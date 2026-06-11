import { useState } from 'react'
import { ArrowLeft, AudioLines, Check, Loader2, Quote, Sparkles, TriangleAlert, Trash2 } from 'lucide-react'
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
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { api } from '@/lib/apiClient'
import { cn } from '@/lib/utils'
import type { GranolaExtractResult, GranolaProposal } from '@/types/granola'

interface GranolaSyncModalProps {
  open: boolean
  onClose: () => void
  /** Applies the kept proposals; resolves when all are committed. */
  onApply: (proposals: GranolaProposal[], meetingTitle: string) => Promise<void>
}

function patchLines(patch: Record<string, unknown>): string[] {
  return Object.entries(patch).map(([path, value]) => {
    const v = typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value)
    return `${path} → ${v}`
  })
}

export function GranolaSyncModal({ open, onClose, onApply }: GranolaSyncModalProps) {
  const [transcript, setTranscript] = useState('')
  const [meetingTitle, setMeetingTitle] = useState('')
  const [extracting, setExtracting] = useState(false)
  const [result, setResult] = useState<GranolaExtractResult | null>(null)
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const [applying, setApplying] = useState(false)

  const reset = () => {
    setTranscript('')
    setMeetingTitle('')
    setResult(null)
    setDismissed(new Set())
    setExtracting(false)
    setApplying(false)
  }

  const close = () => {
    if (extracting || applying) return
    reset()
    onClose()
  }

  const extract = async () => {
    if (extracting || transcript.trim().length < 40) return
    setExtracting(true)
    try {
      const res = await api.granolaExtract({
        transcript: transcript.trim(),
        meetingTitle: meetingTitle.trim() || undefined
      })
      setResult(res)
      setDismissed(new Set())
    } catch (e) {
      toast.error(`Extraction failed: ${(e as Error).message}`)
    } finally {
      setExtracting(false)
    }
  }

  const kept = result ? result.proposals.filter((p) => !dismissed.has(p.id)) : []

  const apply = async () => {
    if (!result || applying || kept.length === 0) return
    setApplying(true)
    try {
      await onApply(kept, result.meetingTitle)
      reset()
      onClose()
    } catch (e) {
      toast.error(`Apply failed: ${(e as Error).message}`)
      setApplying(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent className="max-w-[760px] p-0 gap-0 overflow-hidden sm:rounded-xl">
        <DialogHeader className="px-7 pt-7 pb-4 border-b text-left space-y-1.5">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider2 text-success">
            <AudioLines className="size-3.5" />
            Granola Sync
          </div>
          <DialogTitle className="text-lg text-foreground font-bold">
            {result ? `Review changes — ${result.meetingTitle}` : 'Sync a meeting transcript'}
          </DialogTitle>
          <DialogDescription className="text-xs leading-relaxed">
            {result
              ? 'The AI extracted these proposals from the transcript. Nothing is saved until you apply — remove anything that doesn’t belong.'
              : 'Paste the meeting transcript from Granola (R&D Squad folder). The AI will pull out bet updates, stage moves, KPI changes and new ideas for your review.'}
          </DialogDescription>
        </DialogHeader>

        {!result ? (
          <>
            <div className="px-7 py-5 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-wider2 text-muted-foreground">
                  Meeting title (optional)
                </Label>
                <Input
                  value={meetingTitle}
                  onChange={(e) => setMeetingTitle(e.target.value)}
                  placeholder="e.g. R&D Squad weekly — 11 Jun"
                  className="h-8 text-xs"
                  disabled={extracting}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-wider2 text-muted-foreground">
                  Transcript
                </Label>
                <Textarea
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  placeholder={'Paste the full transcript…\n\nAryaman: LTV to CAC on the BNPL pilot is now at 2.3…'}
                  className="min-h-[260px] text-xs leading-relaxed"
                  disabled={extracting}
                />
              </div>
            </div>
            <DialogFooter className="flex-row items-center justify-between gap-2 px-7 py-4 border-t bg-popover/30">
              <span className="text-[10px] text-muted-foreground/70">
                {extracting ? 'Reading the transcript — usually 10–20 s…' : 'Transcripts stay local; only this extraction call goes to the AI.'}
              </span>
              <Button
                type="button"
                size="sm"
                onClick={extract}
                disabled={extracting || transcript.trim().length < 40}
                className="text-xs uppercase tracking-wider2"
              >
                {extracting ? (
                  <Loader2 className="!size-3.5 animate-spin" />
                ) : (
                  <Sparkles className="!size-3.5" />
                )}
                Extract changes
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <div className="px-7 py-5 space-y-3 max-h-[60vh] overflow-y-auto">
              {result.proposals.length === 0 && (
                <Card className="text-sm text-muted-foreground/70 border-dashed p-6 text-center shadow-none">
                  No actionable changes found in this transcript.
                </Card>
              )}
              {result.proposals.map((p) => {
                const isDismissed = dismissed.has(p.id)
                return (
                  <Card
                    key={p.id}
                    className={cn('bg-popover/40 p-4 shadow-none space-y-3', isDismissed && 'opacity-40')}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={cn('text-xs font-medium text-foreground', isDismissed && 'line-through')}>
                            {p.betName}
                          </span>
                          <Badge variant="outline" className="text-[9px] uppercase tracking-wider2">
                            {p.kind === 'new_bet' ? 'New bet' : 'Edit'}
                          </Badge>
                          {p.kind === 'new_bet' && p.newBet && (
                            <span className="text-[10px] text-muted-foreground">
                              {p.newBet.stage} · {p.newBet.decision}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground leading-snug">{p.summary}</div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setDismissed((d) => {
                            const next = new Set(d)
                            if (next.has(p.id)) next.delete(p.id)
                            else next.add(p.id)
                            return next
                          })
                        }
                        aria-label={isDismissed ? 'Restore proposal' : 'Remove proposal'}
                        className={cn(
                          'size-7 shrink-0',
                          isDismissed ? 'text-success hover:text-success' : 'text-muted-foreground hover:text-destructive'
                        )}
                      >
                        {isDismissed ? <Check className="!size-3.5" /> : <Trash2 className="!size-3.5" />}
                      </Button>
                    </div>

                    {p.patch && (
                      <div className="space-y-1">
                        {patchLines(p.patch).map((line, i) => (
                          <div key={i} className="text-[11px] font-mono text-foreground/90 break-words">
                            {line}
                          </div>
                        ))}
                      </div>
                    )}
                    {p.kind === 'new_bet' && p.newBet && (
                      <div className="text-[11px] text-foreground/90 leading-snug">{p.newBet.description}</div>
                    )}

                    <div className="border-l-2 border-success/40 pl-3 space-y-0.5">
                      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider2 text-muted-foreground">
                        <Quote className="size-3" />
                        {p.evidence.speaker ?? 'Transcript'}
                        {!p.quoteVerified && (
                          <span className="flex items-center gap-1 text-warning normal-case tracking-normal">
                            <TriangleAlert className="size-3" /> not found verbatim in transcript
                          </span>
                        )}
                      </div>
                      <div className="text-xs italic text-muted-foreground leading-snug">
                        “{p.evidence.quote}”
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
            <DialogFooter className="flex-row items-center justify-between gap-2 px-7 py-4 border-t bg-popover/30">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setResult(null)}
                disabled={applying}
                className="text-xs uppercase tracking-wider2 text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="!size-3.5" />
                Back
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={apply}
                disabled={applying || kept.length === 0}
                className="text-xs uppercase tracking-wider2"
              >
                {applying ? <Loader2 className="!size-3.5 animate-spin" /> : <Check className="!size-3.5" />}
                Apply {kept.length} change{kept.length === 1 ? '' : 's'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
