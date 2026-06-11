import { useEffect, useState } from 'react'
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Circle,
  ListTodo,
  Paperclip,
  Plus,
  Trash2,
  X
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { api, artifactFileUrl } from '@/lib/apiClient'
import { formatDate } from '@/lib/dates'
import { cn } from '@/lib/utils'
import type { Artifact, Bet, HistorySource, Initiative, Patch } from '@/types/bet'

interface InitiativesSectionProps {
  bet: Bet
  onPatch: (id: string, patch: Patch, source?: HistorySource, note?: string) => void | Promise<void>
}

const newId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`

export function InitiativesSection({ bet, onPatch }: InitiativesSectionProps) {
  const initiatives = bet.initiatives ?? []
  const [open, setOpen] = useState<Set<string>>(new Set())
  const [newName, setNewName] = useState('')
  const [artifacts, setArtifacts] = useState<Artifact[]>([])
  // notes are drafted locally and saved on blur to avoid a patch per keystroke
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({})
  const [subDrafts, setSubDrafts] = useState<Record<string, { name: string; due: string }>>({})

  useEffect(() => {
    api
      .listArtifacts(bet.id)
      .then(setArtifacts)
      .catch(() => setArtifacts([]))
  }, [bet.id])

  const save = (next: Initiative[], note: string) =>
    onPatch(bet.id, { initiatives: next }, 'system', note)

  const update = (id: string, fn: (i: Initiative) => Initiative, note: string) =>
    save(initiatives.map((i) => (i.id === id ? fn(i) : i)), note)

  const toggleOpen = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const addInitiative = () => {
    const name = newName.trim()
    if (!name) return
    const init: Initiative = { id: newId('init'), name, notes: '', subs: [], artifactIds: [] }
    save([...initiatives, init], `Added initiative ${name}`)
    setNewName('')
    setOpen((prev) => new Set(prev).add(init.id))
  }

  const deleteInitiative = (init: Initiative) => {
    if (!window.confirm(`Delete initiative "${init.name}" and its checklist?`)) return
    save(initiatives.filter((i) => i.id !== init.id), `Deleted initiative ${init.name}`)
  }

  const addSub = (init: Initiative) => {
    const draft = subDrafts[init.id] ?? { name: '', due: '' }
    const name = draft.name.trim()
    if (!name) return
    update(
      init.id,
      (i) => ({
        ...i,
        subs: [...i.subs, { id: newId('sub'), name, done: false, due: draft.due || null }]
      }),
      `Added "${name}" to ${init.name}`
    )
    setSubDrafts((d) => ({ ...d, [init.id]: { name: '', due: '' } }))
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider2 text-muted-foreground mb-3">
          <ListTodo className="size-3" />
          <span>Initiatives · {initiatives.length}</span>
        </div>
        <div className="flex gap-2">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addInitiative()}
            placeholder="New initiative, e.g. CBUAE licensing workstream"
            className="h-9 text-xs"
          />
          <Button
            type="button"
            size="sm"
            onClick={addInitiative}
            disabled={!newName.trim()}
            className="text-xs uppercase tracking-wider2 shrink-0"
          >
            <Plus className="!size-3.5" />
            Add
          </Button>
        </div>
      </div>

      {initiatives.length === 0 ? (
        <Card className="bg-popover/50 p-6 text-center text-xs text-muted-foreground shadow-none">
          No initiatives yet. Add the first workstream for this bet.
        </Card>
      ) : (
        <div className="space-y-3">
          {initiatives.map((init) => {
            const isOpen = open.has(init.id)
            const done = init.subs.filter((s) => s.done).length
            const tagged = artifacts.filter((a) => init.artifactIds.includes(a.id))
            const untagged = artifacts.filter((a) => !init.artifactIds.includes(a.id))
            const draft = subDrafts[init.id] ?? { name: '', due: '' }

            return (
              <Card key={init.id} className="bg-popover/50 shadow-none overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleOpen(init.id)}
                  className="w-full flex items-center gap-2.5 px-4 py-3 text-left group"
                >
                  {isOpen ? (
                    <ChevronDown className="size-3.5 text-muted-foreground shrink-0" />
                  ) : (
                    <ChevronRight className="size-3.5 text-muted-foreground shrink-0" />
                  )}
                  <span className="text-sm text-foreground font-medium flex-1 min-w-0 truncate">
                    {init.name}
                  </span>
                  {init.subs.length > 0 && (
                    <span
                      className={cn(
                        'text-[10px] shrink-0',
                        done === init.subs.length ? 'text-success' : 'text-muted-foreground'
                      )}
                    >
                      {done}/{init.subs.length}
                    </span>
                  )}
                  {init.artifactIds.length > 0 && (
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground shrink-0">
                      <Paperclip className="size-3" />
                      {init.artifactIds.length}
                    </span>
                  )}
                  <span
                    role="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteInitiative(init)
                    }}
                    aria-label={`Delete ${init.name}`}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity shrink-0"
                  >
                    <Trash2 className="size-3.5" />
                  </span>
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 space-y-4 border-t pt-4">
                    <div className="space-y-1.5">
                      {init.subs.map((sub) => (
                        <div key={sub.id} className="flex items-center gap-2.5 group">
                          <button
                            type="button"
                            onClick={() =>
                              update(
                                init.id,
                                (i) => ({
                                  ...i,
                                  subs: i.subs.map((s) =>
                                    s.id === sub.id ? { ...s, done: !s.done } : s
                                  )
                                }),
                                `${sub.done ? 'Reopened' : 'Completed'} "${sub.name}" in ${init.name}`
                              )
                            }
                            aria-label={sub.done ? `Reopen ${sub.name}` : `Complete ${sub.name}`}
                            className="shrink-0"
                          >
                            {sub.done ? (
                              <CheckCircle2 className="size-4 text-success" />
                            ) : (
                              <Circle className="size-4 text-muted-foreground hover:text-foreground" />
                            )}
                          </button>
                          <span
                            className={cn(
                              'text-xs flex-1 min-w-0 truncate',
                              sub.done ? 'text-muted-foreground line-through' : 'text-foreground'
                            )}
                          >
                            {sub.name}
                          </span>
                          <Input
                            type="date"
                            value={sub.due ?? ''}
                            onChange={(e) =>
                              update(
                                init.id,
                                (i) => ({
                                  ...i,
                                  subs: i.subs.map((s) =>
                                    s.id === sub.id ? { ...s, due: e.target.value || null } : s
                                  )
                                }),
                                `Updated due date for "${sub.name}"`
                              )
                            }
                            className="h-7 text-[10px] w-32 shrink-0"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              update(
                                init.id,
                                (i) => ({ ...i, subs: i.subs.filter((s) => s.id !== sub.id) }),
                                `Removed "${sub.name}" from ${init.name}`
                              )
                            }
                            aria-label={`Remove ${sub.name}`}
                            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity shrink-0"
                          >
                            <X className="size-3.5" />
                          </button>
                        </div>
                      ))}
                      <div className="flex items-center gap-2.5 pt-1">
                        <Plus className="size-4 text-muted-foreground/60 shrink-0" />
                        <Input
                          value={draft.name}
                          onChange={(e) =>
                            setSubDrafts((d) => ({
                              ...d,
                              [init.id]: { ...draft, name: e.target.value }
                            }))
                          }
                          onKeyDown={(e) => e.key === 'Enter' && addSub(init)}
                          placeholder="Add sub-initiative…"
                          className="h-7 text-xs flex-1"
                        />
                        <Input
                          type="date"
                          value={draft.due}
                          onChange={(e) =>
                            setSubDrafts((d) => ({
                              ...d,
                              [init.id]: { ...draft, due: e.target.value }
                            }))
                          }
                          className="h-7 text-[10px] w-32 shrink-0"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => addSub(init)}
                          disabled={!draft.name.trim()}
                          className="h-7 text-[10px] uppercase tracking-wider2 shrink-0"
                        >
                          Add
                        </Button>
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] uppercase tracking-wider2 text-muted-foreground mb-1.5">
                        Notes
                      </div>
                      <Textarea
                        rows={2}
                        value={noteDrafts[init.id] ?? init.notes}
                        onChange={(e) =>
                          setNoteDrafts((d) => ({ ...d, [init.id]: e.target.value }))
                        }
                        onBlur={() => {
                          const draftNote = noteDrafts[init.id]
                          if (draftNote === undefined || draftNote === init.notes) return
                          update(init.id, (i) => ({ ...i, notes: draftNote }), `Updated notes on ${init.name}`)
                        }}
                        placeholder="Context, blockers, decisions…"
                        className="text-xs resize-none"
                      />
                    </div>

                    <div>
                      <div className="text-[10px] uppercase tracking-wider2 text-muted-foreground mb-1.5">
                        Tagged artifacts
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {tagged.map((a) => (
                          <span
                            key={a.id}
                            className="flex items-center gap-1.5 text-[11px] bg-primary/10 border border-primary/20 rounded-md px-2 py-1"
                          >
                            <Paperclip className="size-3 text-primary shrink-0" />
                            <a
                              href={artifactFileUrl(a.id)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-foreground hover:text-primary max-w-[180px] truncate"
                            >
                              {a.name}
                            </a>
                            <button
                              type="button"
                              onClick={() =>
                                update(
                                  init.id,
                                  (i) => ({
                                    ...i,
                                    artifactIds: i.artifactIds.filter((x) => x !== a.id)
                                  }),
                                  `Untagged ${a.name} from ${init.name}`
                                )
                              }
                              aria-label={`Untag ${a.name}`}
                              className="text-muted-foreground hover:text-destructive"
                            >
                              <X className="size-3" />
                            </button>
                          </span>
                        ))}
                        {untagged.length > 0 ? (
                          <Select
                            value=""
                            onValueChange={(aid) => {
                              const a = artifacts.find((x) => x.id === aid)
                              update(
                                init.id,
                                (i) => ({ ...i, artifactIds: [...i.artifactIds, aid] }),
                                `Tagged ${a?.name ?? 'artifact'} on ${init.name}`
                              )
                            }}
                          >
                            <SelectTrigger className="h-7 w-44 text-[11px]">
                              <SelectValue placeholder="Tag an artifact…" />
                            </SelectTrigger>
                            <SelectContent>
                              {untagged.map((a) => (
                                <SelectItem key={a.id} value={a.id} className="text-xs">
                                  {a.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          tagged.length === 0 && (
                            <span className="text-[11px] text-muted-foreground/70">
                              No artifacts uploaded yet — add them in the Artifacts tab first.
                            </span>
                          )
                        )}
                      </div>
                    </div>

                    {init.subs.some((s) => !s.done && s.due) && (
                      <div className="text-[10px] text-muted-foreground">
                        Next due:{' '}
                        {formatDate(
                          init.subs
                            .filter((s) => !s.done && s.due)
                            .map((s) => s.due as string)
                            .sort()[0]
                        )}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
