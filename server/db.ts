// MongoDB connection singleton. Lazy-inits on first call, runs the seeder once
// per process lifetime, and exposes a typed handle to the `bets` collection.

import dns from 'node:dns'

import { MongoClient, type Collection, type Db } from 'mongodb'

import type { Bet } from '../src/types/bet'
import { seedArtifactsIfEmpty, seedIfEmpty } from './seed'

// Force public DNS resolvers. Some Windows/corporate networks intercept Node's
// SRV lookups for mongodb+srv:// URIs even when the system resolver works fine.
dns.setServers(['1.1.1.1', '8.8.8.8', '1.0.0.1'])

interface CachedConnection {
  client: MongoClient
  db: Db
  bets: Collection<Bet>
}

let cached: Promise<CachedConnection> | null = null

async function connect(): Promise<CachedConnection> {
  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error('MONGODB_URI is not set. Add it to .env and restart `npm run dev`.')

  const dbName = process.env.MONGODB_DB || 'alchemy'

  const client = new MongoClient(uri)
  await client.connect()
  const db = client.db(dbName)
  const bets = db.collection<Bet>('bets')

  await bets.createIndex({ id: 1 }, { unique: true })
  await seedIfEmpty(bets)
  await seedArtifactsIfEmpty(db)

  console.log(`[db] connected to ${dbName}`)
  return { client, db, bets }
}

export function getDb(): Promise<CachedConnection> {
  if (!cached) {
    cached = connect().catch((err) => {
      cached = null // allow retry on next call
      throw err
    })
  }
  return cached
}

export async function getBetsCollection(): Promise<Collection<Bet>> {
  const { bets } = await getDb()
  return bets
}
