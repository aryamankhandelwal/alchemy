// Thin typed fetch wrapper for the /api/* endpoints. Throws on non-2xx so
// callers can `try/catch` and surface errors via toast.

import type { CreateBetInput } from '@/lib/createBet'
import type { Bet, HistorySource, Patch } from '@/types/bet'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...init
  })
  if (!res.ok) {
    let detail = ''
    try {
      const body = await res.json()
      detail = body?.error ?? ''
    } catch {
      detail = await res.text().catch(() => '')
    }
    throw new Error(detail || `${path} failed: ${res.status}`)
  }
  return res.json() as Promise<T>
}

export interface PatchBody {
  patch: Patch
  source?: HistorySource
  note?: string
}

export const api = {
  listBets: () => request<Bet[]>('/api/bets'),
  createBet: (input: CreateBetInput) =>
    request<Bet>('/api/bets', { method: 'POST', body: JSON.stringify(input) }),
  patchBet: (id: string, body: PatchBody) =>
    request<Bet>(`/api/bets/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteBet: (id: string) => request<{ id: string }>(`/api/bets/${id}`, { method: 'DELETE' }),
  research: (id: string) => request<Bet>(`/api/research/${id}`, { method: 'POST' }),
  enrich: (id: string) => request<Bet>(`/api/enrich/${id}`, { method: 'POST' })
}
