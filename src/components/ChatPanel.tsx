import { useEffect, useRef, useState } from 'react'
import { Loader2, Send } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { DOC_UPDATED_EVENT } from '@/lib/apiClient'
import { cn } from '@/lib/utils'
import type { Bet, Patch } from '@/types/bet'

/** lucide has no wizard hat — hand-drawn in its 24×24 stroke style */
function WizardHat({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M3 19h18" />
      <path d="M6.5 19 11 6.5c.3-.9 1.6-1 2 0L17.5 19" />
      <path d="M9.5 13.5h5" />
    </svg>
  )
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  patch?: Patch
}

function Message({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user'
  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[88%] min-w-0 break-words text-xs leading-relaxed rounded-lg px-3.5 py-2.5 border',
          isUser ? 'bg-primary/10 text-foreground border-primary/20' : 'bg-popover text-foreground'
        )}
      >
        <div className="whitespace-pre-wrap">{message.content}</div>
        {message.patch && Object.keys(message.patch).length > 0 && (
          <div className="mt-2 pt-2 border-t border-border/60 text-[10px] text-muted-foreground space-y-0.5">
            {Object.entries(message.patch)
              .slice(0, 4)
              .map(([k, v]) => (
                <div key={k} className="truncate">
                  <span className="text-muted-foreground/60">↳</span> {k} →{' '}
                  <span className="text-primary">
                    {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                  </span>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  )
}

interface ChatPanelProps {
  bet: Bet
  onPatch: (id: string, patch: Patch) => void
}

export function ChatPanel({ bet, onPatch }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const taRef = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    setMessages([])
    setInput('')
    if (taRef.current) taRef.current.style.height = 'auto'
  }, [bet.id])

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [messages, loading])

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return
    const userMsg: ChatMessage = { role: 'user', content: text }
    const next = [...messages, userMsg]
    setMessages(next)
    setInput('')
    if (taRef.current) taRef.current.style.height = 'auto'
    setLoading(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: next.map((m) => ({ role: m.role, content: m.content })),
          bet
        })
      })
      const data = (await res.json()) as { patch?: Patch; reply?: string; docUpdated?: boolean }
      if (data?.patch && typeof data.patch === 'object') {
        onPatch(bet.id, data.patch)
      }
      if (data?.docUpdated) {
        // the server regenerated a PRD/memo PDF — tell ArtifactsSection to refetch
        window.dispatchEvent(new Event(DOC_UPDATED_EVENT))
      }
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          content: data?.reply || '(no reply)',
          patch: data?.patch ?? null
        }
      ])
    } catch (e) {
      const err = e as Error
      setMessages((m) => [
        ...m,
        { role: 'assistant', content: `Network error: ${err.message}`, patch: null }
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    const ta = e.target
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 140) + 'px'
  }

  return (
    <div className="flex flex-col h-full bg-background border-l min-h-0">
      <div className="px-6 py-5 border-b shrink-0">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider2 text-primary">
          <WizardHat className="size-3" />
          <span>Alchemist</span>
        </div>
        <div className="text-xs text-muted-foreground mt-1.5">
          Update fields, ask about thresholds, log risks.
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-5 space-y-3 min-h-0">
        {messages.length === 0 && (
          <div className="text-[11px] text-muted-foreground/70 space-y-1.5">
            <div className="text-muted-foreground mb-2">Try one of these:</div>
            <div>"LTV/CAC is now 2.3x"</div>
            <div>"Activation rate dropped to 18%"</div>
            <div>"Add a risk: CBUAE issued new circular, severity high"</div>
            <div>"What's the LTV/CAC threshold for Scale?"</div>
            <div>"Mark this as Prioritise"</div>
          </div>
        )}
        {messages.map((m, i) => (
          <Message key={i} message={m} />
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="size-3 animate-spin" />
            <span>Thinking…</span>
          </div>
        )}
      </div>

      <div className="border-t p-4 shrink-0">
        <div className="flex gap-1 items-end bg-popover border rounded-md p-1.5 focus-within:border-primary/40 transition-colors">
          <Textarea
            ref={taRef}
            rows={1}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKey}
            placeholder="Update fields or ask a question..."
            className="flex-1 min-h-0 border-0 bg-transparent text-xs resize-none focus-visible:ring-0 focus-visible:ring-offset-0 px-2 py-1.5 max-h-[140px] leading-relaxed"
            disabled={loading}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={send}
            disabled={loading || !input.trim()}
            aria-label="Send"
            className="text-primary disabled:text-muted-foreground/60 size-8"
          >
            <Send className="!size-3.5" />
          </Button>
        </div>
        <div className="text-[10px] text-muted-foreground/70 mt-2 px-1">
          Enter to send · Shift+Enter for newline
        </div>
      </div>
    </div>
  )
}
