// Thin typed fetch wrapper for the /api/* endpoints. Throws on non-2xx so
// callers can `try/catch` and surface errors via toast.

import type { CreateBetInput } from '@/lib/createBet'
import type { Artifact, Bet, HistorySource, KpiValue, Patch } from '@/types/bet'

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
  enrich: (id: string) =>
    request<{ bet: Bet; suggestedKpis: Record<string, KpiValue> }>(`/api/enrich/${id}`, {
      method: 'POST'
    }),
  score: (id: string) => request<Bet>(`/api/score/${id}`, { method: 'POST' }),
  kpiDefinition: (name: string, bet: { name: string; description: string; stage: string }) =>
    request<{ definition: string }>('/api/kpi-def', {
      method: 'POST',
      body: JSON.stringify({ name, bet })
    }),
  listArtifacts: (betId: string) => request<Artifact[]>(`/api/bets/${betId}/artifacts`),
  uploadArtifact: (betId: string, file: { name: string; type: string; data: string }) =>
    request<Artifact>(`/api/bets/${betId}/artifacts`, {
      method: 'POST',
      body: JSON.stringify(file)
    }),
  deleteArtifact: (id: string) =>
    request<{ id: string }>(`/api/artifacts/${id}`, { method: 'DELETE' })
}

/** URL that streams the artifact inline — open in a new tab to view/download. */
export const artifactFileUrl = (id: string) => `/api/artifacts/${id}/file`
