// Route handlers for /api/bets and /api/research. Each function takes parsed
// inputs and returns a JSON-serializable result; the Vite middleware (in
// vite.config.ts) handles HTTP plumbing.

import { applyPatch } from '../../src/lib/applyPatch'
import { createBet, type CreateBetInput } from '../../src/lib/createBet'
import { appendHistory, diffPatch, makeHistoryEntry } from '../../src/lib/history'
import type { Bet, HistorySource, Patch } from '../../src/types/bet'
import { getBetsCollection } from '../db'
import { researchMarket } from '../research'

function stripId<T extends { _id?: unknown }>(doc: T): Omit<T, '_id'> {
  const { _id: _ignored, ...rest } = doc
  return rest
}

export async function listBets(): Promise<Bet[]> {
  const col = await getBetsCollection()
  const docs = await col.find({}).toArray()
  return docs.map(stripId) as Bet[]
}

export async function getBet(id: string): Promise<Bet | null> {
  const col = await getBetsCollection()
  const doc = await col.findOne({ id })
  return doc ? (stripId(doc) as Bet) : null
}

export async function createBetHandler(input: CreateBetInput): Promise<Bet> {
  if (!input?.name || !input?.description) {
    throw Object.assign(new Error('name and description are required'), { status: 400 })
  }
  const bet = createBet(input)
  const col = await getBetsCollection()
  await col.insertOne(bet as Bet)
  return bet
}

interface PatchBody {
  patch: Patch
  source?: HistorySource
  note?: string
}

export async function patchBetHandler(id: string, body: PatchBody): Promise<Bet> {
  const col = await getBetsCollection()
  const doc = await col.findOne({ id })
  if (!doc) throw Object.assign(new Error(`bet ${id} not found`), { status: 404 })
  const current = stripId(doc) as Bet

  const patch = body?.patch
  if (!patch || typeof patch !== 'object') {
    throw Object.assign(new Error('patch is required'), { status: 400 })
  }
  const source = body.source ?? 'ai'
  const note = body.note ?? 'AI update'

  const changes = diffPatch(current, patch)
  const patched = applyPatch(current, patch)
  const entry = makeHistoryEntry(source, changes, note)
  const next = appendHistory(patched, entry)

  await col.replaceOne({ id }, next as Bet)
  return next
}

export async function runResearchHandler(id: string): Promise<Bet> {
  const col = await getBetsCollection()
  const doc = await col.findOne({ id })
  if (!doc) throw Object.assign(new Error(`bet ${id} not found`), { status: 404 })
  const bet = stripId(doc) as Bet

  const patch = await researchMarket(bet)
  return patchBetHandler(id, { patch, source: 'ai', note: 'Market research refresh' })
}
