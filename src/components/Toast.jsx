import { useEffect } from 'react'
import { Check } from 'lucide-react'

export function Toast({ message, onDismiss }) {
  useEffect(() => {
    if (!message) return
    const t = setTimeout(onDismiss, 2400)
    return () => clearTimeout(t)
  }, [message, onDismiss])

  if (!message) return null
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-slide-up pointer-events-none">
      <div className="flex items-center gap-3 bg-elevated border border-line text-fg text-xs px-4 py-3 rounded-card shadow-2xl">
        <Check size={13} className="text-accent shrink-0" />
        <span>{message}</span>
      </div>
    </div>
  )
}
