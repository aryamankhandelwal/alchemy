import { useEffect, useState } from 'react'
import { X, Plus } from 'lucide-react'
import { STAGES, DECISIONS } from '../lib/stages.js'

const INITIAL = {
  name: '',
  description: '',
  stage: 'Evaluation',
  decision: 'Proceed'
}

export function AddBetModal({ open, onClose, onCreate }) {
  const [form, setForm] = useState(INITIAL)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (!open) return
    setForm(INITIAL)
    setSubmitted(false)
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  const update = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const valid = form.name.trim().length > 0 && form.description.trim().length > 0

  const handleSubmit = (e) => {
    e.preventDefault()
    setSubmitted(true)
    if (!valid) return
    onCreate(form)
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[520px] bg-surface border border-line rounded-modal overflow-hidden animate-modal-in"
      >
        <div className="flex items-start justify-between gap-4 px-7 pt-7 pb-4 border-b border-line">
          <div>
            <div className="text-[10px] uppercase tracking-wider2 text-accent mb-1">New bet</div>
            <h2 className="text-lg text-fg font-bold">Add a bet to the portfolio</h2>
            <p className="text-xs text-muted mt-1.5 leading-relaxed">
              Just the basics. The AI co-pilot can fill in market sizing, risks, and KPIs after creation.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted hover:text-fg transition-colors p-1.5 -mt-1 -mr-1"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-7 py-6 space-y-5">
          <Field label="Name" required error={submitted && !form.name.trim() && 'Name is required.'}>
            <input
              type="text"
              value={form.name}
              onChange={update('name')}
              placeholder="e.g. Wealth Management for Expats"
              autoFocus
              className="w-full bg-bg border border-line rounded-card px-3 py-2 text-sm text-fg placeholder:text-dim outline-none focus:border-accent/50 transition-colors"
            />
          </Field>

          <Field label="Description" required error={submitted && !form.description.trim() && 'Description is required.'}>
            <textarea
              value={form.description}
              onChange={update('description')}
              rows={3}
              placeholder="One-liner: who is this for, what does it do, how does it monetise."
              className="w-full bg-bg border border-line rounded-card px-3 py-2 text-sm text-fg placeholder:text-dim outline-none focus:border-accent/50 transition-colors resize-none"
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Initial stage">
              <Select value={form.stage} onChange={update('stage')} options={STAGES} />
            </Field>
            <Field label="Initial decision">
              <Select value={form.decision} onChange={update('decision')} options={DECISIONS} />
            </Field>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-7 py-4 border-t border-line bg-elevated/30">
          <button
            type="button"
            onClick={onClose}
            className="text-xs uppercase tracking-wider2 text-muted hover:text-fg px-3 py-2 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-card
                       bg-accent text-bg hover:brightness-110
                       border border-accent
                       text-xs uppercase tracking-wider2 font-medium
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition"
            disabled={!form.name.trim() || !form.description.trim()}
          >
            <Plus size={13} />
            <span>Create bet</span>
          </button>
        </div>
      </form>
    </div>
  )
}

function Field({ label, required, error, children }) {
  return (
    <label className="block">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] uppercase tracking-wider2 text-muted">
          {label}{required && <span className="text-accent ml-1">*</span>}
        </span>
        {error && <span className="text-[10px] text-bad">{error}</span>}
      </div>
      {children}
    </label>
  )
}

function Select({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={onChange}
      className="w-full bg-bg border border-line rounded-card px-3 py-2 text-sm text-fg outline-none focus:border-accent/50 transition-colors appearance-none cursor-pointer"
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'><path d='M1 1l4 4 4-4' stroke='%239ca0aa' stroke-width='1.4' fill='none' stroke-linecap='round' stroke-linejoin='round'/></svg>\")",
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 12px center',
        paddingRight: 30
      }}
    >
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  )
}
