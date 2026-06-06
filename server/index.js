require('dotenv').config()
const express = require('express')
const cors    = require('cors')
const cron    = require('node-cron')
const { Pool } = require('pg')
// Use Node 18+ global fetch/FormData/Blob (from undici). The previous
// `require('node-fetch')` was v2, which does NOT export FormData and is
// incompatible with the undici FormData passed as a body.
// const fetch = require('node-fetch')

const app  = express()
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })

app.use(cors())
app.use(express.json({ limit: '10mb' }))

// ── Database setup ────────────────────────────────────────────────────────────

async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS pages (
      id           TEXT PRIMARY KEY,
      name         TEXT NOT NULL,
      access_token TEXT NOT NULL,
      category     TEXT
    )
  `)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS posts (
      id              TEXT PRIMARY KEY,
      content         TEXT NOT NULL,
      platform        TEXT NOT NULL,
      page_id         TEXT,
      scheduled_at    TIMESTAMPTZ NOT NULL,
      post_type       TEXT DEFAULT 'Feed',
      image_base64    TEXT,
      status          TEXT DEFAULT 'scheduled',
      fb_post_id      TEXT,
      error_message   TEXT,
      created_at      TIMESTAMPTZ DEFAULT NOW()
    )
  `)
  console.log('[FIGRize] Database ready')
}

// ── Routes ────────────────────────────────────────────────────────────────────

// Health check
app.get('/health', (_req, res) => res.json({ ok: true, time: new Date() }))

// Save connected Facebook pages (called by desktop app after OAuth)
app.post('/pages', async (req, res) => {
  const { pages } = req.body
  if (!Array.isArray(pages)) return res.status(400).json({ error: 'pages must be an array' })
  try {
    for (const p of pages) {
      await pool.query(
        `INSERT INTO pages (id, name, access_token, category)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (id) DO UPDATE SET access_token = $3, name = $2`,
        [p.id, p.name, p.access_token, p.category || '']
      )
    }
    res.json({ ok: true, saved: pages.length })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Get all connected pages
app.get('/pages', async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT id, name, category FROM pages')
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Schedule a post
app.post('/posts', async (req, res) => {
  const { id, content, platform, pageId, scheduledAt, postType, imageBase64 } = req.body
  if (!content || !scheduledAt) return res.status(400).json({ error: 'content and scheduledAt are required' })
  try {
    await pool.query(
      `INSERT INTO posts (id, content, platform, page_id, scheduled_at, post_type, image_base64)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO UPDATE
       SET content=$2, platform=$3, page_id=$4, scheduled_at=$5, post_type=$6, image_base64=$7, status='scheduled'`,
      [id || crypto.randomUUID(), content, platform || 'Facebook', pageId || null, scheduledAt, postType || 'Feed', imageBase64 || null]
    )
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Get all posts
app.get('/posts', async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM posts ORDER BY scheduled_at ASC')
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Delete a post
app.delete('/posts/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM posts WHERE id = $1', [req.params.id])
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── Scheduler (runs every minute) ────────────────────────────────────────────

async function publishPost(post) {
  const { rows } = await pool.query('SELECT * FROM pages WHERE id = $1', [post.page_id])
  const page = rows[0]
  if (!page) throw new Error(`Page ${post.page_id} not found`)

  if (post.image_base64) {
    // Post as image. Node 18+ provides global FormData / Blob from undici,
    // so we use those directly — node-fetch@2 does NOT export FormData,
    // which is what bit us before ("FormData is not a constructor").
    const base64Raw   = post.image_base64.replace(/^data:image\/\w+;base64,/, '')
    const imageBuffer = Buffer.from(base64Raw, 'base64')
    const formData = new FormData()
    formData.append('source', new Blob([imageBuffer], { type: 'image/jpeg' }), 'post.jpg')
    formData.append('caption', post.content || '')
    formData.append('access_token', page.access_token)
    const r = await fetch(`https://graph.facebook.com/v20.0/${page.id}/photos`, { method: 'POST', body: formData })
    return r.json()
  } else {
    // Plain text post
    const r = await fetch(`https://graph.facebook.com/v20.0/${page.id}/feed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: post.content, access_token: page.access_token }),
    })
    return r.json()
  }
}

cron.schedule('* * * * *', async () => {
  try {
    const { rows: due } = await pool.query(
      `SELECT * FROM posts
       WHERE status = 'scheduled' AND scheduled_at <= NOW()`
    )
    for (const post of due) {
      try {
        const result = await publishPost(post)
        if (result.id) {
          await pool.query(
            `UPDATE posts SET status='published', fb_post_id=$1 WHERE id=$2`,
            [result.id, post.id]
          )
          console.log(`[FIGRize] Published post ${post.id} → FB id ${result.id}`)
        } else {
          throw new Error(result.error?.message || JSON.stringify(result))
        }
      } catch (err) {
        await pool.query(
          `UPDATE posts SET status='failed', error_message=$1 WHERE id=$2`,
          [err.message, post.id]
        )
        console.error(`[FIGRize] Failed post ${post.id}:`, err.message)
      }
    }
  } catch (err) {
    console.error('[FIGRize] Scheduler error:', err.message)
  }
})

// ── Start ─────────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3001
initDB().then(() => {
  app.listen(PORT, () => console.log(`[FIGRize] Server running on port ${PORT}`))
})
