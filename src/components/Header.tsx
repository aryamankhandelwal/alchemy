import { Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'

interface HeaderProps {
  onAddBet: () => void
}

export function Header({ onAddBet }: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-8 py-5 border-b bg-background">
      <div className="flex items-center gap-2">
        <span className="text-primary text-lg leading-none">⬡</span>
        <span className="text-primary text-sm tracking-wider2">Alchemy</span>
      </div>
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
    </header>
  )
}
