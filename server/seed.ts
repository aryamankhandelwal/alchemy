// One-time seeder. Runs the first time the server connects to an empty `bets`
// collection. Inserts whatever is exported from src/data/bets.ts.

import type { Collection } from 'mongodb'

import { SEED_BETS } from '../src/data/bets'
import type { Bet } from '../src/types/bet'

export async function seedIfEmpty(bets: Collection<Bet>): Promise<void> {
  const count = await bets.countDocuments()
  if (count > 0) return
  if (SEED_BETS.length === 0) return
  await bets.insertMany(SEED_BETS as Bet[])
  console.log(`[seed] inserted ${SEED_BETS.length} bet(s)`)
}
