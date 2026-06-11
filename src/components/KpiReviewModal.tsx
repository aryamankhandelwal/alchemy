import { useEffect, useState } from 'react'
import { Check, Loader2, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { api } from '@/lib/apiClient'
import { getKpiDefs, type KpiDefinition } from '@/lib/kpiSchema'
import { cn } from '@/lib/utils'
import type { Bet, CustomKpi, KpiValue, Patch } from '@/types/bet'

export interface KpiReview {
  bet: Bet
  suggestions: Record<string, KpiValue>
}

interface KpiReviewModalProps {
  review: KpiReview | null
  onClose: () => void
  onApprove: (betId: string, patch: Patch) => Promise<void> | void
}

interface DraftRow {
  key: string
  def: KpiDefinition
  /** display value: enums hold the exact string, pct holds e.g. "38", others raw */
  draft: string
  removed: boolean
}

const EMPTY_CUSTOM = { name: '', kill: '', proceed: '', prioritise: '', value: '' }

function toDraft(def: KpiDefinition, v: KpiValue | undefined): string {
  if (v === undefined || v === null || v === '') return ''
  if (def.format === 'pct') return String(Math.round(Number(v) * 1000) / 10)
  return String(v)
}

function fromDraft(def: KpiDefinition, draft: string): KpiValue | null {
  const t = draft.trim()
  if (!t) return null
  if (def.format === 'enum') return t
  const n = Number(t.replace(/[%x×]/gi, '').trim())
  if (Number.isNaN(n)) return null
  return def.format === 'pct' ? (n >= 1 ? n / 100 : n) : n
}

export function KpiReviewModal({ review, onClose, onApprove }: KpiReviewModalProps) {
  const [rows, setRows] = useState<DraftRow[]>([])
  const [customs, setCustoms] = useState<CustomKpi[]>([])
  const [customForm, setCustomForm] = useState(EMPTY_CUSTOM)
  const [addingCustom, setAddingCustom] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!review) return
    const defs = getKpiDefs(review.bet.stage)
    setRows(
      Object.entries(defs).map(([key, def]) => ({
        key,
        def,
        draft: toDraft(def, review.suggestions[key]),
        removed: false
      }))
    )
    setCustoms([])
    setCustomForm(EMPTY_CUSTOM)
    setSaving(false)
  }, [review])

  if (!review) return null
  const { bet } = review

  const setDraft = (key: string, draft: string) =>
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, draft } : r)))
  const toggleRemoved = (key: string) =>
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, removed: !r.removed } : r)))

  const addCustom = async () => {
    const name = customForm.name.trim()
    if (!name || addingCustom) return
    setAddingCustom(true)
    try {
      let definition = ''
      try {
        const res = await api.kpiDefinition(name, {
          name: bet.name,
          description: bet.description,
          stage: bet.stage
        })
        definition = res.definition
      } catch {
        // definition is nice-to-have; the KPI still works without it
      }
      setCustoms((cs) => [
        ...cs,
        {
          id: `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30)}-${Date.now().toString(36).slice(-4)}`,
          name,
          definition,
          kill: customForm.kill.trim(),
          proceed: customForm.proceed.trim(),
          prioritise: customForm.prioritise.trim(),
          value: customForm.value.trim() === '' ? null : customForm.value.trim()
        }
      ])
      setCustomForm(EMPTY_CUSTOM)
    } finally {
      setAddingCustom(false)
    }
  }

  const approve = async () => {
    if (saving) return
    const patch: Patch = {}
    for (const r of rows) {
      if (r.removed) continue
      const v = fromDraft(r.def, r.draft)
      if (v !== null) patch[`kpis.${r.key}`] = v
    }
    const removed = rows.filter((r) => r.removed).map((r) => r.key)
    if (removed.length) patch['hiddenKpis'] = removed
    if (customs.length) patch['customKpis'] = customs
    if (Object.keys(patch).length === 0) {
      onClose()
      return
    }
    setSaving(true)
    try {
      await onApprove(bet.id, patch)
      toast.success(`KPIs added to ${bet.name}`)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const keptCount = rows.filter((r) => !r.removed && fromDraft(r.def, r.draft) !== null).length

  return (
    <Dialog open onOpenChange={(o) => !o && !saving && onClose()}>
      <DialogContent className="max-w-[680px] p-0 gap-0 overflow-hidden sm:rounded-xl">
        <DialogHeader className="px-7 pt-7 pb-4 border-b text-left space-y-1.5">
          <div className="text-[10px] uppercase tracking-wider2 text-primary">
            {bet.name} · {bet.stage}
          </div>
          <DialogTitle className="text-lg text-foreground font-bold">
            Review suggested KPIs
          </DialogTitle>
          <DialogDescription className="text-xs leading-relaxed">
            The AI proposed these starting values — nothing is saved to the bet until you approve.
            Edit values, remove KPIs you don't want tracked, or add your own.
          </DialogDescription>
        </DialogHeader>

        <div className="px-7 py-5 space-y-5 max-h-[60vh] overflow-y-auto">
          <div className="border rounded-lg overflow-hidden">
            {rows.map((r, i) => (
              <div
                key={r.key}
                className={cn(
                  'grid grid-cols-[1.6fr_1fr_auto] gap-3 items-center px-4 py-3',
                  i < rows.length - 1 && 'border-b',
                  r.removed && 'opacity-40'
                )}
              >
                <div>
                  <div className={cn('text-xs text-foreground', r.removed && 'line-through')}>
                    {r.def.label}
                  </div>
                  <div className="text-[10px] text-muted-foreground/70 mt-0.5">
                    {r.def.thresholds}
                  </div>
                </div>
                {r.def.format === 'enum' ? (
                  <Select
                    value={r.draft}
                    onValueChange={(v) => setDraft(r.key, v)}
                    disabled={r.removed}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="—" />
                    </SelectTrigger>
                    <SelectContent>
                      {(r.def.enumOrder ?? []).map((o) => (
                        <SelectItem key={o} value={o} className="text-xs">
                          {o}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="relative">
                    <Input
                      value={r.draft}
                      onChange={(e) => setDraft(r.key, e.target.value)}
                      disabled={r.removed}
                      placeholder="—"
                      className="h-8 text-xs pr-10"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground/60 pointer-events-none">
                      {{ pct: '%', x: '×', months: 'mo', weeks: 'wk' }[r.def.format]}
                    </span>
                  </div>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => toggleRemoved(r.key)}
                  aria-label={r.removed ? `Restore ${r.def.label}` : `Remove ${r.def.label}`}
                  className={cn(
                    'size-7',
                    r.removed
                      ? 'text-success hover:text-success'
                      : 'text-muted-foreground hover:text-destructive'
                  )}
                >
                  {r.removed ? <Plus className="!size-3.5" /> : <Trash2 className="!size-3.5" />}
                </Button>
              </div>
            ))}
          </div>

          {customs.length > 0 && (
            <div className="space-y-2">
              {customs.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between gap-3 border rounded-md px-4 py-2.5"
                >
                  <div className="text-xs text-foreground">
                    {c.name}
                    <span className="text-[9px] uppercase tracking-wider2 text-primary ml-1.5">
                      custom
                    </span>
                    <span className="text-muted-foreground ml-2">{c.value ?? '—'}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCustoms((cs) => cs.filter((x) => x.id !== c.id))}
                    aria-label={`Remove ${c.name}`}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <Card className="bg-popover/50 p-4 shadow-none space-y-3">
            <div className="text-[10px] uppercase tracking-wider2 text-muted-foreground">
              Add your own KPI
            </div>
            <div className="grid grid-cols-2 gap-3">
              <LabeledInput
                label="Name"
                value={customForm.name}
                onChange={(v) => setCustomForm((f) => ({ ...f, name: v }))}
                placeholder="e.g. Merchant onboarding time"
              />
              <LabeledInput
                label="Current value (optional)"
                value={customForm.value}
                onChange={(v) => setCustomForm((f) => ({ ...f, value: v }))}
                placeholder="e.g. 7 days"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <LabeledInput
                label="Kill"
                value={customForm.kill}
                onChange={(v) => setCustomForm((f) => ({ ...f, kill: v }))}
                placeholder=">10 days"
              />
              <LabeledInput
                label="Proceed"
                value={customForm.proceed}
                onChange={(v) => setCustomForm((f) => ({ ...f, proceed: v }))}
                placeholder="5-10 days"
              />
              <LabeledInput
                label="Prioritise"
                value={customForm.prioritise}
                onChange={(v) => setCustomForm((f) => ({ ...f, prioritise: v }))}
                placeholder="<5 days"
              />
            </div>
            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addCustom}
                disabled={addingCustom || !customForm.name.trim()}
                className="text-xs uppercase tracking-wider2"
              >
                {addingCustom ? (
                  <Loader2 className="!size-3.5 animate-spin" />
                ) : (
                  <Plus className="!size-3.5" />
                )}
                Add
              </Button>
            </div>
          </Card>
        </div>

        <DialogFooter className="flex-row items-center justify-between gap-2 px-7 py-4 border-t bg-popover/30">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={saving}
            className="text-xs uppercase tracking-wider2 text-muted-foreground hover:text-foreground"
          >
            Skip — no KPIs
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={approve}
            disabled={saving}
            className="text-xs uppercase tracking-wider2"
          >
            {saving ? <Loader2 className="!size-3.5 animate-spin" /> : <Check className="!size-3.5" />}
            Approve {keptCount + customs.length} KPI{keptCount + customs.length === 1 ? '' : 's'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function LabeledInput({
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
