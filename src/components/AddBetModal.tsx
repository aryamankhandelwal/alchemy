import { useEffect, useState } from 'react'
import { Loader2, Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
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
import { Textarea } from '@/components/ui/textarea'
import type { CreateBetInput } from '@/lib/createBet'
import { DECISIONS, STAGES } from '@/lib/stages'
import type { Stage, Timeline } from '@/types/bet'

interface AddBetModalProps {
  open: boolean
  loading?: boolean
  onClose: () => void
  onCreate: (input: CreateBetInput) => void
}

const INITIAL: CreateBetInput = {
  name: '',
  description: '',
  stage: 'Evaluation',
  decision: 'Proceed'
}

/** form-side dates: '' instead of null so <input type="date"> stays controlled */
type FormTimeline = Record<Stage, { start: string; end: string }>

const initialTimeline = (): FormTimeline => ({
  Evaluation: { start: new Date().toISOString().slice(0, 10), end: '' },
  Pilot: { start: '', end: '' },
  Scale: { start: '', end: '' }
})

/** end of one phase autofills the start of the next (unless the user already set it) */
const NEXT_STAGE: Partial<Record<Stage, Stage>> = { Evaluation: 'Pilot', Pilot: 'Scale' }

export function AddBetModal({ open, loading = false, onClose, onCreate }: AddBetModalProps) {
  const [form, setForm] = useState<CreateBetInput>(INITIAL)
  const [timeline, setTimeline] = useState<FormTimeline>(initialTimeline)
  const [touchedStarts, setTouchedStarts] = useState<Partial<Record<Stage, boolean>>>({})
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (!open) return
    setForm(INITIAL)
    setTimeline(initialTimeline())
    setTouchedStarts({})
    setSubmitted(false)
  }, [open])

  const setDate = (stage: Stage, field: 'start' | 'end', value: string) => {
    setTimeline((t) => {
      const next = { ...t, [stage]: { ...t[stage], [field]: value } }
      const nextStage = NEXT_STAGE[stage]
      if (field === 'end' && nextStage && !touchedStarts[nextStage]) {
        next[nextStage] = { ...next[nextStage], start: value }
      }
      return next
    })
    if (field === 'start') setTouchedStarts((s) => ({ ...s, [stage]: true }))
  }

  const valid =
    form.name.trim().length > 0 &&
    form.description.trim().length > 0 &&
    timeline.Evaluation.start.length > 0

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    if (!valid || loading) return
    const tl: Timeline = {
      Evaluation: { start: timeline.Evaluation.start || null, end: timeline.Evaluation.end || null },
      Pilot: { start: timeline.Pilot.start || null, end: timeline.Pilot.end || null },
      Scale: { start: timeline.Scale.start || null, end: timeline.Scale.end || null }
    }
    onCreate({ ...form, timeline: tl })
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !loading && onClose()}>
      <DialogContent className="max-w-[520px] p-0 gap-0 overflow-hidden sm:rounded-xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="px-7 pt-7 pb-4 border-b text-left space-y-1.5">
            <div className="text-[10px] uppercase tracking-wider2 text-primary">New bet</div>
            <DialogTitle className="text-lg text-foreground font-bold">
              Add a bet to the portfolio
            </DialogTitle>
            <DialogDescription className="text-xs leading-relaxed">
              Just the basics. The AI co-pilot can fill in market sizing, risks, and KPIs after creation.
            </DialogDescription>
          </DialogHeader>

          <div className="px-7 py-6 space-y-5 max-h-[60vh] overflow-y-auto">
            <Field
              label="Name"
              required
              error={submitted && !form.name.trim() ? 'Name is required.' : null}
            >
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Wealth Management for Expats"
                autoFocus
              />
            </Field>

            <Field
              label="Description"
              required
              error={submitted && !form.description.trim() ? 'Description is required.' : null}
            >
              <Textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
                placeholder="One-liner: who is this for, what does it do, how does it monetise."
                className="resize-none"
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Initial stage">
                <Select
                  value={form.stage}
                  onValueChange={(v) => setForm((f) => ({ ...f, stage: v as CreateBetInput['stage'] }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STAGES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Initial decision">
                <Select
                  value={form.decision}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, decision: v as CreateBetInput['decision'] }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DECISIONS.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <div className="space-y-3">
              <Label className="text-[10px] uppercase tracking-wider2 text-muted-foreground">
                Estimated timeline
              </Label>
              {STAGES.map((s) => (
                <div key={s} className="grid grid-cols-2 gap-4">
                  <Field
                    label={`${s} start`}
                    required={s === 'Evaluation'}
                    error={
                      s === 'Evaluation' && submitted && !timeline.Evaluation.start
                        ? 'Required.'
                        : null
                    }
                  >
                    <Input
                      type="date"
                      value={timeline[s].start}
                      onChange={(e) => setDate(s, 'start', e.target.value)}
                    />
                  </Field>
                  <Field label={`${s} end`}>
                    <Input
                      type="date"
                      value={timeline[s].end}
                      onChange={(e) => setDate(s, 'end', e.target.value)}
                    />
                  </Field>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter className="flex-row items-center justify-end gap-2 px-7 py-4 border-t bg-popover/30">
            {loading && (
              <span className="mr-auto text-[11px] text-muted-foreground">
                AI is filling in summary, hypothesis, target customer, and KPIs…
              </span>
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              disabled={loading}
              className="text-xs uppercase tracking-wider2 text-muted-foreground hover:text-foreground"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!valid || loading}
              className="text-xs uppercase tracking-wider2"
            >
              {loading ? <Loader2 className="!size-3.5 animate-spin" /> : <Plus className="!size-3.5" />}
              {loading ? 'Enriching…' : 'Create bet'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function Field({
  label,
  required,
  error,
  children
}: {
  label: string
  required?: boolean
  error?: string | null
  children: React.ReactNode
}) {
  return (
    <div className="block space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-[10px] uppercase tracking-wider2 text-muted-foreground">
          {label}
          {required && <span className="text-primary ml-1">*</span>}
        </Label>
        {error && <span className="text-[10px] text-destructive">{error}</span>}
      </div>
      {children}
    </div>
  )
}
