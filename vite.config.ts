import path from 'node:path'
import type { IncomingMessage } from 'node:http'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

import { chatHandler } from './server/chat'
import { granolaExtractHandler } from './server/granolaExtract'
import { kpiDefinition } from './server/kpiDef'
import {
  createBetHandler,
  deleteBetHandler,
  getBet,
  listBets,
  patchBetHandler,
  runEnrichHandler,
  runResearchHandler,
  runScoreHandler
} from './server/routes/bets'

type Method = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'

interface Route {
  method: Method
  pattern: RegExp
  handler: (ctx: { params: string[]; body: any }) => Promise<unknown>
}

const routes: Route[] = [
  { method: 'GET', pattern: /^\/api\/bets$/, handler: () => listBets() },
  {
    method: 'POST',
    pattern: /^\/api\/bets$/,
    handler: ({ body }) => createBetHandler(body)
  },
  {
    method: 'GET',
    pattern: /^\/api\/bets\/([^/]+)$/,
    handler: ({ params }) => getBet(params[0])
  },
  {
    method: 'PATCH',
    pattern: /^\/api\/bets\/([^/]+)$/,
    handler: ({ params, body }) => patchBetHandler(params[0], body)
  },
  {
    method: 'POST',
    pattern: /^\/api\/research\/([^/]+)$/,
    handler: ({ params }) => runResearchHandler(params[0])
  },
  {
    method: 'POST',
    pattern: /^\/api\/enrich\/([^/]+)$/,
    handler: ({ params }) => runEnrichHandler(params[0])
  },
  {
    method: 'DELETE',
    pattern: /^\/api\/bets\/([^/]+)$/,
    handler: ({ params }) => deleteBetHandler(params[0])
  },
  {
    method: 'POST',
    pattern: /^\/api\/score\/([^/]+)$/,
    handler: ({ params }) => runScoreHandler(params[0])
  },
  {
    method: 'POST',
    pattern: /^\/api\/kpi-def$/,
    handler: async ({ body }) => ({ definition: await kpiDefinition(body.name, body.bet) })
  },
  {
    method: 'POST',
    pattern: /^\/api\/chat$/,
    handler: ({ body }) => chatHandler(body)
  },
  {
    method: 'POST',
    pattern: /^\/api\/granola\/extract$/,
    handler: ({ body }) => granolaExtractHandler(body)
  }
]

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let buf = ''
    req.on('data', (chunk) => {
      buf += chunk
    })
    req.on('end', () => resolve(buf))
    req.on('error', reject)
  })
}

function apiPlugin(): Plugin {
  return {
    name: 'alchemy-api',
    configureServer(server) {
      server.middlewares.use('/api', async (req, res, next) => {
        const url = (req.url ?? '').split('?')[0]
        const fullPath = `/api${url}`
        const method = (req.method ?? 'GET') as Method
        const route = routes.find((r) => r.method === method && r.pattern.test(fullPath))
        if (!route) return next()

        const match = route.pattern.exec(fullPath)
        const params = match ? match.slice(1) : []

        try {
          const raw = method === 'GET' || method === 'DELETE' ? '' : await readBody(req)
          const body = raw ? JSON.parse(raw) : {}
          const result = await route.handler({ params, body })
          res.setHeader('Content-Type', 'application/json')
          res.statusCode = 200
          res.end(JSON.stringify(result))
        } catch (err) {
          const e = err as Error & { status?: number }
          // util.inspect crashes on some AI SDK error objects with custom getters,
          // which would otherwise take Node down. Stringify a flat shape instead.
          const safe = { name: e?.name, message: e?.message, stack: e?.stack?.split('\n').slice(0, 3).join(' | ') }
          console.error(`[api] ${method} ${fullPath} failed:`, JSON.stringify(safe))
          res.setHeader('Content-Type', 'application/json')
          res.statusCode = e?.status ?? 500
          res.end(JSON.stringify({ error: e?.message ?? 'Server error' }))
        }
      })
    }
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  for (const key of [
    'OPENROUTER_API_KEY',
    'OPENROUTER_MODEL',
    'GEMINI_API_KEY',
    'GEMINI_MODEL',
    'MONGODB_URI',
    'MONGODB_DB'
  ]) {
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
