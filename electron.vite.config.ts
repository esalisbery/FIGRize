import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import { loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    main: {
      build: {
        lib: {
          entry: 'electron/main.ts'
        }
      },
      plugins: [externalizeDepsPlugin()]
    },
    preload: {
      build: {
        lib: {
          entry: 'electron/preload.ts'
        }
      },
      plugins: [externalizeDepsPlugin()]
    },
    renderer: {
      root: '.',
      build: {
        rollupOptions: {
          input: 'index.html'
        }
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY || ''),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || '')
      }
    }
  }
})
