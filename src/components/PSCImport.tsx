import { useState, useRef } from 'react'
import { useStore } from '../hooks/useStore'
import { parsePSCFile } from '../lib/psc-parser'
import type { PSCMatch } from '../types/scoring'
import { Upload, Loader2, Trash2, FileText, Users, Target } from 'lucide-react'

export function PSCImport() {
  const { importedMatches, importPSCMatch, removeImportedMatch } = useStore()
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    setImporting(true)
    setError(null)
    try {
      const match = await parsePSCFile(file)
      importPSCMatch(match)
    } catch (err: any) {
      setError(err.message || 'Failed to parse file')
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">PractiScore Import</h3>
          <p className="text-xs text-zinc-500 mt-0.5">Import .psc or .json match files for benchmarks and stage data</p>
        </div>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={importing}
          className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded text-sm text-zinc-300 transition-colors disabled:opacity-50"
        >
          {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {importing ? 'Importing...' : 'Import Match'}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".psc,.json"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
      </div>

      {error && <div className="text-xs text-red-400 bg-red-950/30 rounded p-2">{error}</div>}

      {importedMatches.length > 0 && (
        <div className="space-y-2">
          {importedMatches.map(match => (
            <MatchCard key={match.id} match={match} onRemove={() => removeImportedMatch(match.id)} />
          ))}
        </div>
      )}

      {importedMatches.length === 0 && (
        <div className="text-center py-6 text-zinc-600 text-sm border border-dashed border-zinc-800 rounded-lg">
          No matches imported yet. Export a .psc file from PractiScore and import it here.
        </div>
      )}
    </div>
  )
}

function MatchCard({ match, onRemove }: { match: PSCMatch; onRemove: () => void }) {
  const [expanded, setExpanded] = useState(false)

  const classBreakdown = match.shooters.reduce((acc, s) => {
    acc[s.classification] = (acc[s.classification] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
      <div className="px-4 py-3 flex items-center justify-between cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div>
          <div className="text-sm font-medium">{match.name}</div>
          <div className="text-xs text-zinc-500 flex items-center gap-3 mt-0.5">
            <span>{match.date}</span>
            {match.club && <span>{match.club}</span>}
            <span className="flex items-center gap-1"><Target className="w-3 h-3" />{match.stages.length} stages</span>
            <span className="flex items-center gap-1"><Users className="w-3 h-3" />{match.shooters.length} shooters</span>
          </div>
        </div>
        <button onClick={(e) => { e.stopPropagation(); onRemove() }} className="p-1.5 hover:bg-zinc-800 rounded text-zinc-500 hover:text-red-400">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {expanded && (
        <div className="px-4 py-3 border-t border-zinc-800 space-y-3">
          <div className="text-xs text-zinc-500">
            Classifications: {Object.entries(classBreakdown).sort().map(([cls, n]) => `${cls}: ${n}`).join(', ')}
          </div>
          <div className="space-y-1">
            {match.stages.map(stage => (
              <div key={stage.id} className="flex items-center justify-between text-xs py-1">
                <div className="flex items-center gap-2">
                  <FileText className="w-3 h-3 text-zinc-600" />
                  <span className="text-zinc-300">{stage.name}</span>
                </div>
                <span className="text-zinc-500 font-mono">
                  {stage.roundCount}rds / {stage.paperTargets}p / {stage.steelTargets}s / {stage.maxPoints}pts
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
