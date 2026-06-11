import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ClipboardList,
  ExternalLink,
  File,
  FileDown,
  FileSpreadsheet,
  FileText,
  Loader2,
  Paperclip,
  Sparkles,
  Trash2,
  Upload
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { api, artifactFileUrl, DOC_UPDATED_EVENT } from '@/lib/apiClient'
import { formatDate } from '@/lib/dates'
import type { Artifact, Bet } from '@/types/bet'

const SPREADSHEET_EXT = /\.(xlsx?|xlsm|csv)$/i
const DOCUMENT_EXT = /\.(pdf|docx?|pptx?|txt|md)$/i

function ArtifactIcon({ name }: { name: string }) {
  if (SPREADSHEET_EXT.test(name)) return <FileSpreadsheet className="size-4 text-success" />
  if (DOCUMENT_EXT.test(name)) return <FileText className="size-4 text-primary" />
  return <File className="size-4 text-muted-foreground" />
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function readAsBase64(file: globalThis.File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '')
    reader.onerror = () => reject(new Error(`Could not read ${file.name}`))
    reader.readAsDataURL(file)
  })
}

export function ArtifactsSection({ bet }: { bet: Bet }) {
  const [artifacts, setArtifacts] = useState<Artifact[] | null>(null)
  const [uploading, setUploading] = useState(false)
  const [generating, setGenerating] = useState<'memo' | 'prd' | null>(null)
  const [converting, setConverting] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const refetch = useCallback(() => {
    api
      .listArtifacts(bet.id)
      .then(setArtifacts)
      .catch((e: Error) => {
        toast.error(`Failed to load artifacts: ${e.message}`)
        setArtifacts([])
      })
  }, [bet.id])

  useEffect(() => {
    setArtifacts(null)
    refetch()
  }, [refetch])

  // The AI chat can regenerate the PRD/memo (replacing the old PDF) — stay in sync.
  useEffect(() => {
    window.addEventListener(DOC_UPDATED_EVENT, refetch)
    return () => window.removeEventListener(DOC_UPDATED_EVENT, refetch)
  }, [refetch])

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return
    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        try {
          const data = await readAsBase64(file)
          const created = await api.uploadArtifact(bet.id, {
            name: file.name,
            type: file.type,
            data
          })
          setArtifacts((prev) => [...(prev ?? []), created])
          toast.success(`${file.name} uploaded`)
        } catch (e) {
          toast.error(`Upload failed: ${(e as Error).message}`)
        }
      }
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const handleGenerate = async (kind: 'memo' | 'prd') => {
    if (generating) return
    setGenerating(kind)
    try {
      const { artifacts: created } = await api.generateDoc(bet.id, kind)
      setArtifacts((prev) => [...(prev ?? []), ...created])
      toast.success(`${kind === 'prd' ? 'PRD' : 'Memo'} generated`)
      const pdf = created.find((a) => a.type === 'application/pdf')
      if (pdf) window.open(artifactFileUrl(pdf.id), '_blank', 'noopener')
    } catch (e) {
      toast.error(`Generation failed: ${(e as Error).message}`)
    } finally {
      setGenerating(null)
    }
  }

  const handleConvert = async (artifact: Artifact) => {
    if (converting) return
    setConverting(artifact.id)
    try {
      const created = await api.convertDocx(artifact.id)
      setArtifacts((prev) => [...(prev ?? []), created])
      toast.success(`${created.name} created`)
    } catch (e) {
      toast.error(`Conversion failed: ${(e as Error).message}`)
    } finally {
      setConverting(null)
    }
  }

  const handleDelete = async (artifact: Artifact) => {
    if (!window.confirm(`Delete "${artifact.name}"?`)) return
    try {
      await api.deleteArtifact(artifact.id)
      setArtifacts((prev) => (prev ? prev.filter((a) => a.id !== artifact.id) : prev))
      toast.success(`${artifact.name} deleted`)
    } catch (e) {
      toast.error(`Delete failed: ${(e as Error).message}`)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider2 text-muted-foreground mb-3">
          <Paperclip className="size-3" />
          <span>Artifacts</span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed mb-4">
          Attach supporting documents — business cases, models, decks, regulatory memos. Files are
          stored with the bet and open in a new tab. 15 MB max per file.
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.xlsm,.csv,.ppt,.pptx,.txt,.md,.png,.jpg,.jpeg"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="text-[11px] uppercase tracking-wider2 border-primary/30 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground hover:border-primary"
        >
          {uploading ? (
            <Loader2 className="!size-3.5 animate-spin" />
          ) : (
            <Upload className="!size-3.5" />
          )}
          <span>{uploading ? 'Uploading…' : 'Upload documents'}</span>
        </Button>
      </div>

      {artifacts === null ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="size-3.5 animate-spin" />
          <span>Loading artifacts…</span>
        </div>
      ) : artifacts.length === 0 ? (
        <Card className="bg-popover/50 p-6 text-center text-xs text-muted-foreground shadow-none">
          No artifacts yet. Upload the first document for this bet.
        </Card>
      ) : (
        <div className="space-y-2">
          {artifacts.map((a) => (
            <Card
              key={a.id}
              className="flex items-center gap-3 p-3 bg-popover/50 shadow-none hover:border-primary/40 transition-colors"
            >
              <ArtifactIcon name={a.name} />
              <a
                href={artifactFileUrl(a.id)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 min-w-0 group"
              >
                <span className="flex items-center gap-1.5 text-sm text-foreground group-hover:text-primary transition-colors">
                  <span className="truncate">{a.name}</span>
                  <ExternalLink className="size-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                </span>
                <span className="block text-[10px] text-muted-foreground">
                  {formatSize(a.size)} · uploaded {formatDate(a.uploadedAt.slice(0, 10))}
                </span>
              </a>
              {a.canConvert && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleConvert(a)}
                  disabled={converting !== null}
                  title="Create an editable Word version of this document"
                  className="text-[10px] uppercase tracking-wider2 text-muted-foreground hover:text-primary shrink-0"
                >
                  {converting === a.id ? (
                    <Loader2 className="!size-3.5 animate-spin" />
                  ) : (
                    <FileDown className="!size-3.5" />
                  )}
                  docx
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(a)}
                aria-label={`Delete ${a.name}`}
                className="text-muted-foreground hover:text-destructive shrink-0"
              >
                <Trash2 className="!size-3.5" />
              </Button>
            </Card>
          ))}
        </div>
      )}

      <div>
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider2 text-muted-foreground mb-3">
          <Sparkles className="size-3" />
          <span>Generate documents</span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed mb-4">
          The AI drafts a document from this bet's current data — summary, market, KPIs, risks,
          initiatives. The PDF lands in the list above and opens automatically; use its "docx"
          button for an editable Word version. Ask the Alchemist chat to revise it ("in the PRD,
          tighten the success metrics") — the old PDF is replaced. Takes ~20 seconds.
        </p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={generating !== null}
            onClick={() => handleGenerate('memo')}
            className="text-[11px] uppercase tracking-wider2 border-primary/30 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground hover:border-primary"
          >
            {generating === 'memo' ? (
              <Loader2 className="!size-3.5 animate-spin" />
            ) : (
              <FileText className="!size-3.5" />
            )}
            <span>{generating === 'memo' ? 'Drafting memo…' : 'Generate Memo'}</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={generating !== null}
            onClick={() => handleGenerate('prd')}
            className="text-[11px] uppercase tracking-wider2 border-primary/30 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground hover:border-primary"
          >
            {generating === 'prd' ? (
              <Loader2 className="!size-3.5 animate-spin" />
            ) : (
              <ClipboardList className="!size-3.5" />
            )}
            <span>{generating === 'prd' ? 'Drafting PRD…' : 'Generate PRD'}</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
