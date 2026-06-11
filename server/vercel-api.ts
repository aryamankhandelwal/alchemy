// Vercel serverless backend — one catch-all function mirroring the dev-server
// API (vite.config.ts middleware). Mongo connects lazily and seeds the default
// portfolio (src/data/bets.ts + seed/) on first request against an empty DB.
//
// Vercel's node builder cannot resolve project TS imports from api/ under
// "type": "module", so this file is BUNDLED into api/[...path].mjs with
// esbuild — run `npm run build:api` after changing it or anything it imports.
//
// Not available here (pyserver-only, needs Python): PDF/docx generation
// (/generate-doc, /artifacts/:id/docx) — those return 501 with a hint.

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { Binary } from 'mongodb'

import { chatHandler } from './chat'
import { getDb } from './db'
import { granolaExtractHandler } from './granolaExtract'
import { kpiDefinition } from './kpiDef'
import {
  createBetHandler,
  deleteBetHandler,
  getBet,
  listBets,
  patchBetHandler,
  runEnrichHandler,
  runResearchHandler,
  runScoreHandler
} from './routes/bets'

async function health() {
  let mongo = 'skipped (MONGODB_URI not set)'
  if (process.env.MONGODB_URI) {
    try {
      const { bets } = await getDb()
      mongo = `ok (${await bets.countDocuments()} bets)`
    } catch (e) {
      mongo = String((e as Error)?.message ?? e).slice(0, 300)
    }
  }
  return {
    node: process.version,
    env: {
      MONGODB_URI: Boolean(process.env.MONGODB_URI),
      GEMINI_API_KEY: Boolean(process.env.GEMINI_API_KEY),
      GEMINI_MODEL: process.env.GEMINI_MODEL ?? null
    },
    mongo
  }
}

const ARTIFACT_META_KEYS = ['id', 'betId', 'name', 'type', 'size', 'uploadedAt'] as const
const MAX_ARTIFACT_BYTES = 15 * 1024 * 1024

function artifactMeta(doc: Record<string, unknown>) {
  const meta: Record<string, unknown> = {}
  for (const k of ARTIFACT_META_KEYS) meta[k] = doc[k]
  meta.canConvert = Boolean(doc.gen)
  return meta
}

function httpError(status: number, message: string): Error & { status: number } {
  return Object.assign(new Error(message), { status })
}

async function listArtifacts(betId: string) {
  const { db } = await getDb()
  const docs = await db
    .collection('artifacts')
    .find({ betId }, { projection: { data: 0 } })
    .sort({ uploadedAt: 1 })
    .toArray()
  return docs.map(artifactMeta)
}

async function uploadArtifact(betId: string, body: { name?: string; type?: string; data?: string }) {
  const { db, bets } = await getDb()
  if (!(await bets.findOne({ id: betId }))) throw httpError(404, `bet ${betId} not found`)
  const name = (body.name ?? '').trim()
  if (!name || !body.data) throw httpError(400, 'name and data (base64) are required')
  let raw: Buffer
  try {
    raw = Buffer.from(body.data, 'base64')
  } catch {
    throw httpError(400, 'data is not valid base64')
  }
  if (raw.length > MAX_ARTIFACT_BYTES) throw httpError(413, 'file too large (15 MB max)')
  const doc = {
    id: `${Date.now().toString(16)}${Math.floor(Math.random() * 0xffff).toString(16).padStart(4, '0')}`,
    betId,
    name,
    type: body.type || 'application/octet-stream',
    size: raw.length,
    uploadedAt: new Date().toISOString(),
    data: new Binary(raw)
  }
  await db.collection('artifacts').insertOne(doc)
  return artifactMeta(doc)
}

async function deleteArtifact(id: string) {
  const { db } = await getDb()
  const result = await db.collection('artifacts').deleteOne({ id })
  if (result.deletedCount === 0) throw httpError(404, `artifact ${id} not found`)
  return { id }
}

type Handler = (params: string[], body: any) => Promise<unknown>

const ROUTES: Array<[string, RegExp, Handler]> = [
  ['GET', /^\/api\/health$/, () => health()],
  ['GET', /^\/api\/bets$/, () => listBets()],
  ['POST', /^\/api\/bets$/, (_p, b) => createBetHandler(b)],
  ['GET', /^\/api\/bets\/([^/]+)$/, (p) => getBet(p[0])],
  ['PATCH', /^\/api\/bets\/([^/]+)$/, (p, b) => patchBetHandler(p[0], b)],
  ['DELETE', /^\/api\/bets\/([^/]+)$/, (p) => deleteBetHandler(p[0])],
  ['POST', /^\/api\/research\/([^/]+)$/, (p) => runResearchHandler(p[0])],
  ['POST', /^\/api\/enrich\/([^/]+)$/, (p) => runEnrichHandler(p[0])],
  ['POST', /^\/api\/score\/([^/]+)$/, (p) => runScoreHandler(p[0])],
  ['POST', /^\/api\/chat$/, (_p, b) => chatHandler(b)],
  ['POST', /^\/api\/kpi-def$/, async (_p, b) => ({ definition: await kpiDefinition(b.name, b.bet) })],
  ['POST', /^\/api\/granola\/extract$/, (_p, b) => granolaExtractHandler(b)],
  ['GET', /^\/api\/bets\/([^/]+)\/artifacts$/, (p) => listArtifacts(p[0])],
  ['POST', /^\/api\/bets\/([^/]+)\/artifacts$/, (p, b) => uploadArtifact(p[0], b)],
  ['DELETE', /^\/api\/artifacts\/([^/]+)$/, (p) => deleteArtifact(p[0])],
  [
    'POST',
    /^\/api\/bets\/([^/]+)\/generate-doc$/,
    async () => {
      throw httpError(501, 'Document generation runs on the local pyserver only (needs Python).')
    }
  ],
  [
    'POST',
    /^\/api\/artifacts\/([^/]+)\/docx$/,
    async () => {
      throw httpError(501, 'Docx conversion runs on the local pyserver only (needs Python).')
    }
  ]
]

const ARTIFACT_FILE_RE = /^\/api\/artifacts\/([^/]+)\/file$/

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const url = (req.url ?? '').split('?')[0]
  const method = req.method ?? 'GET'

  try {
    // Binary artifact streaming — handled outside the JSON route table.
    const fileMatch = method === 'GET' ? ARTIFACT_FILE_RE.exec(url) : null
    if (fileMatch) {
      const { db } = await getDb()
      const doc = await db.collection('artifacts').findOne({ id: fileMatch[1] })
      if (!doc) {
        res.status(404).json({ error: `artifact ${fileMatch[1]} not found` })
        return
      }
      const data = Buffer.from((doc.data as Binary).buffer)
      const safeName = String(doc.name).replace(/"/g, '').replace(/[^\x20-\x7e]/g, '_')
      res.setHeader('Content-Type', doc.type || 'application/octet-stream')
      res.setHeader('Content-Disposition', `inline; filename="${safeName}"`)
      res.setHeader('Cache-Control', 'no-cache')
      res.status(200).send(data)
      return
    }

    const route = ROUTES.find(([m, re]) => m === method && re.test(url))
    if (!route) {
      res.status(404).json({ error: 'no route' })
      return
    }
    const params = route[1].exec(url)!.slice(1)
    const result = await route[2](params, req.body ?? {})
    res.status(200).json(result)
  } catch (err) {
    const e = err as Error & { status?: number }
    console.error(`[api] ${method} ${url} failed:`, e?.message)
    res.status(e?.status ?? 500).json({ error: e?.message ?? 'Server error' })
  }
}
