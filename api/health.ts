// Deployment diagnostics: reports runtime, env-var presence, and whether each
// server module imports cleanly — so a broken deploy explains itself.

import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const modules: Record<string, () => Promise<unknown>> = {
    db: () => import('../server/db'),
    routes: () => import('../server/routes/bets'),
    chat: () => import('../server/chat'),
    enrich: () => import('../server/enrich'),
    research: () => import('../server/research'),
    score: () => import('../server/score'),
    kpiDef: () => import('../server/kpiDef'),
    granola: () => import('../server/granolaExtract')
  }
  const imports: Record<string, string> = {}
  for (const [name, load] of Object.entries(modules)) {
    try {
      await load()
      imports[name] = 'ok'
    } catch (e) {
      imports[name] = String((e as Error)?.stack ?? e).slice(0, 300)
    }
  }

  let mongo = 'skipped (MONGODB_URI not set)'
  if (process.env.MONGODB_URI) {
    try {
      const { getDb } = await import('../server/db')
      const { bets } = await getDb()
      mongo = `ok (${await bets.countDocuments()} bets)`
    } catch (e) {
      mongo = String((e as Error)?.message ?? e).slice(0, 300)
    }
  }

  res.status(200).json({
    node: process.version,
    env: {
      MONGODB_URI: Boolean(process.env.MONGODB_URI),
      MONGODB_DB: process.env.MONGODB_DB ?? null,
      GEMINI_API_KEY: Boolean(process.env.GEMINI_API_KEY),
      GEMINI_MODEL: process.env.GEMINI_MODEL ?? null
    },
    imports,
    mongo
  })
}
