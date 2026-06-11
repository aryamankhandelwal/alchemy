// Deployment diagnostics: reports runtime, env-var presence, and Mongo
// connectivity — so a broken deploy explains itself.

import type { VercelRequest, VercelResponse } from '@vercel/node'

import { getDb } from '../server/db'

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  let mongo = 'skipped (MONGODB_URI not set)'
  if (process.env.MONGODB_URI) {
    try {
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
    mongo
  })
}
