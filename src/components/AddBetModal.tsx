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

export function AddBetModal({ open, loading = false, onClose, onCreate }: AddBetModalProps) {
  const [form, setForm] = useState<CreateBetInput>(INITIAL)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (!open) return
    setForm(INITIAL)
    setSubmitted(false)
  }, [open])

  const valid = form.name.trim().length > 0 && form.description.trim().length > 0

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    if (!valid || loading) return
    onCreate(form)
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

          <div className="px-7 py-6 space-y-5">
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
