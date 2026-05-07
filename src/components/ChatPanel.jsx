import { useState, useRef, useEffect } from 'react'
import { Send, Sparkles, Loader2 } from 'lucide-react'

function Message({ message }) {
  const isUser = message.role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[88%] text-xs leading-relaxed rounded-card px-3.5 py-2.5
                    ${isUser
                      ? 'bg-accent/10 text-fg border border-accent/20'
                      : 'bg-elevated text-fg border border-line'}`}
      >
        <div className="whitespace-pre-wrap">{message.content}</div>
        {message.patch && Object.keys(message.patch).length > 0 && (
          <div className="mt-2 pt-2 border-t border-line/60 text-[10px] text-muted space-y-0.5">
            {Object.entries(message.patch).slice(0, 4).map(([k, v]) => (
              <div key={k} className="truncate">
                <span className="text-dim">↳</span> {k} → <span className="text-accent">
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

export function ChatPanel({ bet, onPatch }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef(null)
  const taRef = useRef(null)

  // Reset chat history when switching to a different bet.
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
    const userMsg = { role: 'user', content: text }
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
          messages: next.map(m => ({ role: m.role, content: m.content })),
          bet
        })
      })
      const data = await res.json()
      if (data?.patch && typeof data.patch === 'object') {
        onPatch(bet.id, data.patch)
      }
      setMessages(m => [...m, {
        role: 'assistant',
        content: data?.reply || '(no reply)',
        patch: data?.patch || null
      }])
    } catch (e) {
      setMessages(m => [...m, {
        role: 'assistant',
        content: `Network error: ${e.message}`,
        patch: null
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  const handleInput = (e) => {
    setInput(e.target.value)
    const ta = e.target
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 140) + 'px'
  }

  return (
    <div className="flex flex-col h-full bg-bg border-l border-line min-h-0">
      <div className="px-6 py-5 border-b border-line shrink-0">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider2 text-accent">
          <Sparkles size={11} />
          <span>AI co-pilot</span>
        </div>
        <div className="text-xs text-muted mt-1.5">Update fields, ask about thresholds, log risks.</div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-5 space-y-3 min-h-0">
        {messages.length === 0 && (
          <div className="text-[11px] text-dim space-y-1.5">
            <div className="text-muted mb-2">Try one of these:</div>
            <div>"LTV/CAC is now 2.3x"</div>
            <div>"Activation rate dropped to 18%"</div>
            <div>"Add a risk: CBUAE issued new circular, severity high"</div>
            <div>"What's the LTV/CAC threshold for Scale?"</div>
            <div>"Mark this as Prioritise"</div>
          </div>
        )}
        {messages.map((m, i) => <Message key={i} message={m} />)}
        {loading && (
          <div className="flex items-center gap-2 text-xs text-muted">
            <Loader2 size={12} className="animate-spin" />
            <span>Thinking…</span>
          </div>
        )}
      </div>

      <div className="border-t border-line p-4 shrink-0">
        <div className="flex gap-1 items-end bg-elevated border border-line rounded-card p-1.5 focus-within:border-accent/40 transition-colors">
          <textarea
            ref={taRef}
            rows={1}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKey}
            placeholder="Update fields or ask a question..."
            className="flex-1 bg-transparent text-xs text-fg placeholder:text-dim resize-none outline-none px-2 py-1.5 max-h-[140px] leading-relaxed"
            disabled={loading}
          />
          <button
            onClick={send}
            disabled={loading || !input.trim()}
            className="text-accent disabled:text-dim p-2 hover:bg-bg disabled:hover:bg-transparent rounded transition-colors"
            aria-label="Send"
          >
            <Send size={13} />
          </button>
        </div>
        <div className="text-[10px] text-dim mt-2 px-1">Enter to send · Shift+Enter for newline</div>
      </div>
    </div>
  )
}
