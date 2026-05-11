import path from 'node:path'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

import { chatHandler } from './server/chat'

function apiPlugin(): Plugin {
  return {
    name: 'alchemy-api',
    configureServer(server) {
      server.middlewares.use('/api/chat', async (req, res, next) => {
        if (req.method !== 'POST') return next()
        let body = ''
        req.on('data', (chunk) => {
          body += chunk
        })
        req.on('end', async () => {
          try {
            const payload = JSON.parse(body || '{}')
            const result = await chatHandler(payload)
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(result))
          } catch (err) {
            const e = err as Error
            console.error('[/api/chat] error:', e)
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(
              JSON.stringify({
                patch: null,
                reply: `Server error: ${e.message ?? 'unknown'}`
              })
            )
          }
        })
      })
    }
  }
}

export default defineConfig(({ mode }) => {
  // Load .env (no prefix filter) and expose to server-side middleware via process.env.
  const env = loadEnv(mode, process.cwd(), '')
  for (const key of ['OPENROUTER_API_KEY', 'OPENROUTER_MODEL']) {
    if (env[key] && !process.env[key]) process.env[key] = env[key]
  }

  return {
    plugins: [react(), apiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src')
      }
    },
    server: {
      port: 5173,
      strictPort: false
    }
  }
})
