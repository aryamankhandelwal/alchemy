import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

export function CollapsibleSection({ title, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <section className="border-t border-line first:border-t-0">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between py-4 text-left group"
      >
        <span className="text-[10px] uppercase tracking-wider2 text-muted group-hover:text-accent transition-colors">{title}</span>
        <ChevronDown size={14} className={`text-dim group-hover:text-muted transition-all ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="pb-6">{children}</div>}
    </section>
  )
}
