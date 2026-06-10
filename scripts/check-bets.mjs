// Quick diagnostic: connect to Mongo and report what's in the bets collection.
import dns from 'node:dns'
import fs from 'node:fs'
import { MongoClient } from 'mongodb'

// Minimal .env loader (avoids a dotenv dep).
try {
  const env = fs.readFileSync('.env', 'utf8')
  for (const line of env.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (!m) continue
    if (!process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '')
  }
} catch {}

dns.setServers(['1.1.1.1', '8.8.8.8', '1.0.0.1'])

const uri = process.env.MONGODB_URI
const dbName = process.env.MONGODB_DB || 'alchemy'

if (!uri) {
  console.error('MONGODB_URI is not set')
  process.exit(1)
}

const client = new MongoClient(uri, { serverSelectionTimeoutMS: 10000 })

try {
  await client.connect()
  const db = client.db(dbName)

  const collections = (await db.listCollections().toArray()).map((c) => c.name)
  console.log(`[db] ${dbName} collections:`, collections)

  const bets = db.collection('bets')
  const count = await bets.countDocuments()
  console.log(`[db] bets count: ${count}`)

  if (count > 0) {
    const sample = await bets.find({}, { projection: { id: 1, name: 1, stage: 1, decision: 1, _id: 0 } }).toArray()
    console.log('[db] bets:')
    for (const b of sample) console.log('  -', JSON.stringify(b))
  }
} catch (err) {
  console.error('[db] error:', err.name, err.message)
  if (err.cause) console.error('     cause:', err.cause.code ?? err.cause.message ?? err.cause)
  process.exitCode = 1
} finally {
  await client.close()
}
