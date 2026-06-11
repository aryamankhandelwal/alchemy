import { useState } from 'react'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { KPIDot } from '@/components/bet-badges'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api } from '@/lib/apiClient'
import { evaluateCustomKpi } from '@/lib/customKpi'
import { cn } from '@/lib/utils'
import { evaluateKpi, formatKpiValue, getKpiDefs } from '@/lib/kpiSchema'
import type { Bet, CustomKpi, HistorySource, KpiStatus, Patch } from '@/types/bet'

const STATUS_TONE: Record<KpiStatus, string> = {
  Prioritise: 'text-success',
  Proceed: 'text-warning',
  Kill: 'text-destructive'
}

const ROW_GRID = 'grid grid-cols-[1.6fr_1fr_1.8fr_1fr] gap-3'

interface KPISectionProps {
  bet: Bet
  onPatch: (id: string, patch: Patch, source?: HistorySource, note?: string) => void | Promise<void>
}

interface Row {
  key: string
  label: string
  sub: string
  formatted: string
  thresholds: string
  status: KpiStatus | null
  custom: boolean
}

const EMPTY_FORM = { name: '', kill: '', proceed: '', prioritise: '', value: '' }

export function KPISection({ bet, onPatch }: KPISectionProps) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [adding, setAdding] = useState(false)

  const hidden = new Set(bet.hiddenKpis ?? [])
  const defs = getKpiDefs(bet.stage)

  const rows: Row[] = Object.keys(defs)
    .filter((k) => !hidden.has(k))
    .map((k) => ({
      key: k,
      label: defs[k].label,
      sub: defs[k].rationale,
      formatted: formatKpiValue(bet.stage, k, bet.kpis?.[k]),
      thresholds: defs[k].thresholds,
      status: evaluateKpi(bet.stage, k, bet.kpis?.[k]),
      custom: false
    }))

  for (const c of bet.customKpis ?? []) {
    rows.push({
      key: c.id,
      label: c.name,
      sub: c.definition,
      formatted: c.value === null || c.value === undefined || c.value === '' ? '—' : String(c.value),
      thresholds: `${c.kill} kill · ${c.proceed} proceed · ${c.prioritise} prioritise`,
      status: evaluateCustomKpi(c),
      custom: true
    })
  }

  const removeSchemaKpi = (key: string, label: string) => {
    if (!window.confirm(`Remove "${label}" from this bet's KPI table?`)) return
    onPatch(
      bet.id,
      { hiddenKpis: [...(bet.hiddenKpis ?? []), key] },
      'system',
      `Removed KPI ${label}`
    )
  }

  const removeCustomKpi = (id: string, label: string) => {
    if (!window.confirm(`Delete custom KPI "${label}"?`)) return
    onPatch(
      bet.id,
      { customKpis: (bet.customKpis ?? []).filter((c) => c.id !== id) },
      'system',
      `Deleted KPI ${label}`
    )
  }

  const addKpi = async () => {
    const name = form.name.trim()
    if (!name || adding) return
    setAdding(true)
    try {
      let definition = ''
      try {
        const res = await api.kpiDefinition(name, {
          name: bet.name,
          description: bet.description,
          stage: bet.stage
        })
        definition = res.definition
      } catch (e) {
        toast.error(`Could not fetch definition: ${(e as Error).message}`)
      }
      const kpi: CustomKpi = {
        id: `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30)}-${Date.now().toString(36).slice(-4)}`,
        name,
        definition,
        kill: form.kill.trim(),
        proceed: form.proceed.trim(),
        prioritise: form.prioritise.trim(),
        value: form.value.trim() === '' ? null : form.value.trim()
      }
      await onPatch(
        bet.id,
        { customKpis: [...(bet.customKpis ?? []), kpi] },
        'system',
        `Added KPI ${name}`
      )
      setForm(EMPTY_FORM)
      toast.success(`${name} added`)
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="text-[10px] uppercase tracking-wider2 text-muted-foreground mb-3">
          {bet.stage} stage KPIs · {rows.length} metrics
        </div>
        <div className="border rounded-lg overflow-hidden">
          <div
            className={cn(
              ROW_GRID,
              'text-[10px] uppercase tracking-wider2 text-muted-foreground bg-popover/50 px-4 py-2.5 border-b'
            )}
          >
            <div>KPI</div>
            <div>Value</div>
            <div>Threshold</div>
            <div>Status</div>
          </div>
          {rows.map((r, i) => (
            <div
              key={r.key}
              className={cn(
                ROW_GRID,
                'group items-center px-4 py-3 text-xs',
                i < rows.length - 1 && 'border-b'
              )}
            >
              <div>
                <div className="text-foreground">
                  {r.label}
                  {r.custom && (
                    <span className="text-[9px] uppercase tracking-wider2 text-primary ml-1.5">
                      custom
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-muted-foreground/70 mt-0.5">{r.sub}</div>
              </div>
              <div className="text-primary font-medium">{r.formatted}</div>
              <div className="text-muted-foreground text-[11px]">{r.thresholds}</div>
              <div className="flex items-center gap-2">
                {r.status && <KPIDot status={r.status} />}
                <span className={r.status ? STATUS_TONE[r.status] : 'text-muted-foreground/60'}>
                  {r.status || '—'}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    r.custom ? removeCustomKpi(r.key, r.label) : removeSchemaKpi(r.key, r.label)
                  }
                  aria-label={`Delete ${r.label}`}
                  className="ml-auto opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
        {hidden.size > 0 && (
          <button
            type="button"
            onClick={() => onPatch(bet.id, { hiddenKpis: [] }, 'system', 'Restored removed KPIs')}
            className="mt-2 text-[10px] text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
          >
            Restore {hidden.size} removed framework KPI{hidden.size > 1 ? 's' : ''}
          </button>
        )}
      </div>

      <Card className="bg-popover/50 p-4 shadow-none space-y-4">
        <div className="text-[10px] uppercase tracking-wider2 text-muted-foreground">
          Add a custom KPI
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FieldInput
            label="KPI name"
            value={form.name}
            onChange={(v) => setForm((f) => ({ ...f, name: v }))}
            placeholder="e.g. Merchant onboarding time"
          />
          <FieldInput
            label="Current value (optional)"
            value={form.value}
            onChange={(v) => setForm((f) => ({ ...f, value: v }))}
            placeholder="e.g. 7 days"
          />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <FieldInput
            label="Kill"
            value={form.kill}
            onChange={(v) => setForm((f) => ({ ...f, kill: v }))}
            placeholder="e.g. >10 days"
          />
          <FieldInput
            label="Proceed"
            value={form.proceed}
            onChange={(v) => setForm((f) => ({ ...f, proceed: v }))}
            placeholder="e.g. 5-10 days"
          />
          <FieldInput
            label="Prioritise"
            value={form.prioritise}
            onChange={(v) => setForm((f) => ({ ...f, prioritise: v }))}
            placeholder="e.g. <5 days"
          />
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-[10px] text-muted-foreground/70">
            The AI writes the KPI's definition automatically when you add it.
          </span>
          <Button
            type="button"
            size="sm"
            onClick={addKpi}
            disabled={adding || !form.name.trim()}
            className="text-xs uppercase tracking-wider2 shrink-0"
          >
            {adding ? <Loader2 className="!size-3.5 animate-spin" /> : <Plus className="!size-3.5" />}
            {adding ? 'Adding…' : 'Add KPI'}
          </Button>
        </div>
      </Card>
    </div>
  )
}

function FieldInput({
  label,
  value,
  onChange,
  placeholder
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[10px] uppercase tracking-wider2 text-muted-foreground">{label}</Label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-8 text-xs"
      />
    </div>
  )
}
