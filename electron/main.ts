import { config } from 'dotenv'
import { join } from 'path'
// Load .env before anything else reads process.env
config({ path: join(process.cwd(), '.env') })

import { app, BrowserWindow, ipcMain, shell } from 'electron'
import express from 'express'
import http from 'http'

const FB_APP_ID     = process.env.FACEBOOK_APP_ID     || ''
const FB_APP_SECRET = process.env.FACEBOOK_APP_SECRET || ''
const OAUTH_PORT    = 3001
const REDIRECT_URI  = `http://localhost:${OAUTH_PORT}/facebook/callback`

interface FacebookPage {
  id: string
  name: string
  access_token: string
  category: string
}

// In-memory state — reset on app restart
let fbPages: FacebookPage[] = []

let mainWindow: BrowserWindow | null = null
let oauthWindow: BrowserWindow | null = null

function startOAuthServer(): void {
  const expressApp = express()
  expressApp.use(express.json())

  // Step 1 — redirect browser to Facebook OAuth dialog
  expressApp.get('/facebook/login', (_req, res) => {
    if (!FB_APP_ID) {
      res.status(500).send('<h2>FACEBOOK_APP_ID is not configured. Add it to your .env file.</h2>')
      return
    }
    const scopes = 'pages_manage_posts,pages_read_engagement,pages_show_list'
    const url =
      `https://www.facebook.com/v20.0/dialog/oauth` +
      `?client_id=${FB_APP_ID}` +
      `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
      `&scope=${scopes}` +
      `&response_type=code`
    res.redirect(url)
  })

  // Step 2 — Facebook redirects back here with ?code=...
  expressApp.get('/facebook/callback', async (req, res) => {
    const { code, error } = req.query as Record<string, string>

    if (error || !code) {
      res.send('<html><body style="font-family:sans-serif;background:#0d1424;color:#e8ecf5;padding:40px"><h2>Authorization cancelled.</h2><p>You can close this window.</p></body></html>')
      mainWindow?.webContents.send('facebook-connected', { success: false, error: 'Authorization cancelled' })
      setTimeout(() => oauthWindow?.close(), 800)
      return
    }

    try {
      // Exchange code for access token
      const tokenUrl =
        `https://graph.facebook.com/v20.0/oauth/access_token` +
        `?client_id=${FB_APP_ID}` +
        `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
        `&client_secret=${FB_APP_SECRET}` +
        `&code=${code}`

      const tokenRes  = await fetch(tokenUrl)
      const tokenData = await tokenRes.json() as { access_token?: string; error?: { message: string } }

      if (!tokenData.access_token) {
        throw new Error(tokenData.error?.message || 'No access token returned')
      }

      // Fetch pages the user manages (with per-page tokens)
      const pagesRes  = await fetch(
        `https://graph.facebook.com/v20.0/me/accounts` +
        `?fields=id,name,access_token,category,picture` +
        `&access_token=${tokenData.access_token}`
      )
      const pagesData = await pagesRes.json() as { data?: FacebookPage[]; error?: { message: string } }

      if (!pagesData.data) {
        throw new Error(pagesData.error?.message || 'Could not retrieve pages')
      }

      fbPages = pagesData.data

      res.send(
        '<html><body style="font-family:sans-serif;background:#0d1424;color:#e8ecf5;text-align:center;padding:60px">' +
        '<h2 style="color:#ff8c42">✓ Connected!</h2>' +
        '<p>FIGRize is now connected to your Facebook Pages.</p>' +
        '<p style="color:#6c7894;font-size:13px">This window will close automatically…</p>' +
        '</body></html>'
      )

      mainWindow?.webContents.send('facebook-connected', { success: true, pages: fbPages })
      setTimeout(() => oauthWindow?.close(), 1800)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      res.send(
        `<html><body style="font-family:sans-serif;background:#0d1424;color:#ff6b6b;padding:40px">` +
        `<h2>Connection failed</h2><p>${msg}</p><p>You can close this window.</p></body></html>`
      )
      mainWindow?.webContents.send('facebook-connected', { success: false, error: msg })
      setTimeout(() => oauthWindow?.close(), 1200)
    }
  })

  // Publish (or schedule) a post to a Facebook Page
  expressApp.post('/facebook/post', async (req, res) => {
    const { pageId, message, scheduledTime } = req.body as {
      pageId: string
      message: string
      scheduledTime?: string
    }

    const page = fbPages.find(p => p.id === pageId)
    if (!page) {
      res.status(400).json({ error: 'Page not found or not connected' })
      return
    }

    try {
      const body: Record<string, unknown> = {
        message,
        access_token: page.access_token,
      }
      if (scheduledTime) {
        body.scheduled_publish_time = Math.floor(new Date(scheduledTime).getTime() / 1000)
        body.published = false
      }

      const postRes = await fetch(`https://graph.facebook.com/v20.0/${pageId}/feed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const result = await postRes.json()
      res.json(result)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      res.status(500).json({ error: msg })
    }
  })

  http.createServer(expressApp).listen(OAUTH_PORT, '127.0.0.1', () => {
    console.log(`[FIGRize] OAuth server listening on http://127.0.0.1:${OAUTH_PORT}`)
  })
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'FIGRize',
    show: false,
    webPreferences: {
      preload: join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })

  mainWindow.on('ready-to-show', () => mainWindow?.show())
  mainWindow.on('closed', () => { mainWindow = null })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (process.env.NODE_ENV === 'development' && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// IPC: open Facebook OAuth popup window
ipcMain.on('facebook-connect', () => {
  if (oauthWindow && !oauthWindow.isDestroyed()) {
    oauthWindow.focus()
    return
  }
  oauthWindow = new BrowserWindow({
    width: 700,
    height: 820,
    minWidth: 650,
    minHeight: 700,
    title: 'Connect Facebook — FIGRize',
    parent: mainWindow ?? undefined,
    modal: false,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  })
  oauthWindow.loadURL(`http://127.0.0.1:${OAUTH_PORT}/facebook/login`)
  oauthWindow.on('closed', () => { oauthWindow = null })
})

// IPC: publish or schedule a text post via the embedded Express server
ipcMain.handle('facebook-post', async (_event, data: { pageId: string; message: string; scheduledTime?: string }) => {
  try {
    const res = await fetch(`http://127.0.0.1:${OAUTH_PORT}/facebook/post`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return res.json()
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Network error' }
  }
})

// IPC: upload a colored-background post as an image to Facebook /photos
ipcMain.handle(
  'facebook-post-image',
  async (_event, data: { pageId: string; imageBase64: string; caption?: string }) => {
    const { pageId, imageBase64, caption } = data
    const page = fbPages.find(p => p.id === pageId)
    if (!page) return { error: 'Page not found or not connected' }

    try {
      // Strip the data-URL prefix and decode to a Buffer
      const base64Raw    = imageBase64.replace(/^data:image\/\w+;base64,/, '')
      const imageBuffer  = Buffer.from(base64Raw, 'base64')
      const blob         = new Blob([imageBuffer], { type: 'image/jpeg' })

      const formData = new FormData()
      formData.append('source', blob, 'post.jpg')
      if (caption) formData.append('caption', caption)
      formData.append('access_token', page.access_token)

      const postRes = await fetch(`https://graph.facebook.com/v20.0/${pageId}/photos`, {
        method: 'POST',
        body: formData,
      })
      return postRes.json()
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Image upload failed' }
    }
  },
)

app.whenReady().then(() => {
  startOAuthServer()
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
