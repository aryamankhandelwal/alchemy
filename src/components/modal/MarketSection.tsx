import { useState } from 'react'
import { Loader2, RefreshCw } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { Bet, Competitor, ThreatLevel } from '@/types/bet'

const THREAT_VARIANT: Record<ThreatLevel, 'destructive' | 'warning' | 'success'> = {
  High: 'destructive',
  Medium: 'warning',
  Low: 'success'
}

function ThreatBadge({ level }: { level: ThreatLevel }) {
  return <Badge variant={THREAT_VARIANT[level] ?? 'muted'}>{level} threat</Badge>
}

function CompetitorMetric({
  label,
  value,
  source
}: {
  label: string
  value: string
  source: string
}) {
  return (
    <Card className="bg-popover/40 p-3 shadow-none">
      <div className="text-[10px] uppercase tracking-wider2 text-muted-foreground">{label}</div>
      <div className="text-sm text-foreground font-medium leading-tight mt-1">{value}</div>
      {source && (
        <div className="text-[10px] text-muted-foreground/70 mt-1.5 leading-snug">
          Source: {source}
        </div>
      )}
    </Card>
  )
}

function CompetitorCard({ c }: { c: Competitor }) {
  const metrics = c.metrics || []
  const edge = c.edge || c.strength
  const gap = c.gap || c.weakness
  return (
    <Card className="bg-popover/30 p-4 shadow-none">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="text-sm text-foreground font-bold">{c.name}</div>
        <ThreatBadge level={c.threat} />
      </div>

      {metrics.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
          {metrics.map((m, i) => (
            <CompetitorMetric key={i} {...m} />
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-wider2 text-success mb-1.5">Edge vs us</div>
          <div className="text-xs text-muted-foreground leading-relaxed">{edge}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider2 text-destructive mb-1.5">
            Gap vs us
          </div>
          <div className="text-xs text-muted-foreground leading-relaxed">{gap}</div>
        </div>
      </div>
    </Card>
  )
}

interface MarketSectionProps {
  bet: Bet
  onResearch?: (id: string) => Promise<Bet | null>
}

export function MarketSection({ bet, onResearch }: MarketSectionProps) {
  const [researching, setResearching] = useState(false)

  const runResearch = async () => {
    if (!onResearch || researching) return
    setResearching(true)
    try {
      await onResearch(bet.id)
    } finally {
      setResearching(false)
    }
  }

  const m = bet.market
  const competitors = m.competitors ?? []
  const cells: { k: 'tam' | 'sam' | 'som'; l: string }[] = [
    { k: 'tam', l: 'TAM' },
    { k: 'sam', l: 'SAM' },
    { k: 'som', l: 'SOM' }
  ]

  return (
    <div className="space-y-6">
      {onResearch && (
        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={runResearch}
            disabled={researching}
            className="text-[11px] uppercase tracking-wider2 border-primary/30 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground hover:border-primary"
          >
            {researching ? (
              <Loader2 className="!size-3.5 animate-spin" />
            ) : (
              <RefreshCw className="!size-3.5" />
            )}
            <span>{researching ? 'Researching…' : 'Refresh market data'}</span>
          </Button>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        {cells.map(({ k, l }) => (
          <Card key={k} className="p-4 bg-popover/40 shadow-none">
            <div className="text-[10px] uppercase tracking-wider2 text-muted-foreground">{l}</div>
            <div className="text-xl text-foreground mt-1.5 font-bold leading-none">{m[k] || '—'}</div>
            <div className="text-[10px] text-muted-foreground/70 mt-2 leading-snug">
              {m.sources?.[k] || ''}
            </div>
          </Card>
        ))}
      </div>

      <div>
        <div className="text-[10px] uppercase tracking-wider2 text-muted-foreground mb-3">
          Competitive landscape
        </div>
        {competitors.length === 0 ? (
          <Card className="text-xs text-muted-foreground/70 p-4 shadow-none">
            No competitors logged.
          </Card>
        ) : (
          <div className="space-y-3">
            {competitors.map((c, i) => (
              <CompetitorCard key={i} c={c} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
