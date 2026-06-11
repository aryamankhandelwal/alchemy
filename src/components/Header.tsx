import { AudioLines, CalendarRange, LayoutGrid, Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type View = 'kanban' | 'timeline'

interface HeaderProps {
  view: View
  onViewChange: (view: View) => void
  onAddBet: () => void
  onGranolaSync: () => void
}

const VIEWS: { id: View; label: string; icon: typeof LayoutGrid }[] = [
  { id: 'kanban', label: 'Kanban', icon: LayoutGrid },
  { id: 'timeline', label: 'Gantt', icon: CalendarRange }
]

export function Header({ view, onViewChange, onAddBet, onGranolaSync }: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-8 py-5 border-b bg-background">
      <div className="flex items-center gap-2">
        <span className="text-primary text-lg leading-none">⬡</span>
        <span className="text-primary text-sm tracking-wider2">Alchemy</span>
        <span className="text-muted-foreground/60 text-sm mx-1">·</span>
        <span className="text-muted-foreground text-xs">
          {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center rounded-md border bg-card p-0.5">
          {VIEWS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => onViewChange(id)}
              className={cn(
                'flex items-center gap-1.5 rounded-[5px] px-3 py-1.5 text-xs uppercase tracking-wider2 transition-colors',
                view === id
                  ? 'bg-primary/15 text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="size-3.5" />
              {label}
            </button>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onGranolaSync}
          className="text-xs uppercase tracking-wider2 text-muted-foreground hover:text-foreground"
        >
          <AudioLines className="!size-3.5" />
          Notes Sync
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onAddBet}
          className="border-primary/30 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground hover:border-primary text-xs uppercase tracking-wider2"
        >
          <Plus className="!size-3.5" />
          Add bet
        </Button>
      </div>
    </header>
  )
}
