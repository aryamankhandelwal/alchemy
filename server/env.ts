// Hot-reloading .env reader. The file is re-parsed whenever its mtime changes,
// so e.g. switching GEMINI_MODEL takes effect on the next request without
// restarting `npm run dev`. Falls back to process.env for values not in .env.

import { readFileSync, statSync } from 'node:fs'
import { resolve } from 'node:path'

const ENV_PATH = resolve(process.cwd(), '.env')

let cache: Record<string, string> = {}
let mtimeMs: number | null = null

function parse(src: string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const line of src.split('\n')) {
    const m = /^\s*([A-Z_]+)\s*=\s*(.+?)\s*$/.exec(line)
    if (m && !line.trimStart().startsWith('#')) out[m[1]] = m[2]
  }
  return out
}

export function envVar(key: string): string | undefined {
  try {
    const m = statSync(ENV_PATH).mtimeMs
    if (m !== mtimeMs) {
      cache = parse(readFileSync(ENV_PATH, 'utf-8'))
      mtimeMs = m
    }
  } catch {
    // no .env file — fall through to process.env
  }
  return cache[key] ?? process.env[key]
}
