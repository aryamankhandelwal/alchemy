import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { chatHandler } from './server/chat.js'

function apiPlugin() {
  return {
    name: 'alchemy-api',
    configureServer(server) {
      server.middlewares.use('/api/chat', async (req, res, next) => {
        if (req.method !== 'POST') return next()
        let body = ''
        req.on('data', chunk => { body += chunk })
        req.on('end', async () => {
          try {
            const payload = JSON.parse(body || '{}')
            const result = await chatHandler(payload)
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(result))
          } catch (err) {
            console.error('[/api/chat] error:', err)
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({
              patch: null,
              reply: `Server error: ${err.message ?? 'unknown'}`
            }))
          }
        })
      })
    }
  }
}

export default defineConfig(({ mode }) => {
  // Load .env (no prefix filter) and expose to server-side middleware via process.env.
  // VITE_-prefixed vars also get exposed to the client by Vite as usual.
  const env = loadEnv(mode, process.cwd(), '')
  for (const key of ['OPENROUTER_API_KEY', 'OPENROUTER_MODEL']) {
    if (env[key] && !process.env[key]) process.env[key] = env[key]
  }

  return {
    plugins: [react(), apiPlugin()],
    server: {
      port: 5173,
      strictPort: false
    }
  }
})
