import { Plus } from 'lucide-react'

export function Header({ onAddBet }) {
  return (
    <header className="flex items-center justify-between px-8 py-5 border-b border-line bg-bg">
      <div className="flex items-center gap-2">
        <span className="text-accent text-lg leading-none">⬡</span>
        <span className="text-accent text-sm tracking-wider2">Alchemy</span>
      </div>
      <button
        type="button"
        onClick={onAddBet}
        className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-card
                   bg-accent/10 hover:bg-accent text-accent hover:text-bg
                   border border-accent/30 hover:border-accent
                   text-xs uppercase tracking-wider2
                   transition-colors"
      >
        <Plus size={13} className="shrink-0" />
        <span>Add bet</span>
      </button>
    </header>
  )
}
