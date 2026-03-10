import { useState, useRef } from 'react'
import { useStore } from '../hooks/useStore'
import { extractStageFromImage } from '../lib/vision'
import { calculateMaxPoints } from '../lib/scoring'
import type { PSCStage, ScoringMethod } from '../types/scoring'
import { Camera, Loader2, X } from 'lucide-react'

interface Props {
  competitionId: string
  onClose: () => void
}

export function AddStageForm({ competitionId, onClose }: Props) {
  const { addCompetitionStage, llmConfig } = useStore()
  const [name, setName] = useState('')
  const [roundCount, setRoundCount] = useState(12)
  const [paperTargets, setPaperTargets] = useState(6)
  const [steelTargets, setSteelTargets] = useState(0)
  const [noShoots, setNoShoots] = useState(0)
  const [scoringMethod, setScoringMethod] = useState<ScoringMethod>('comstock')
  const [classifier, setClassifier] = useState('')
  const [extracting, setExtracting] = useState(false)
  const [extractError, setExtractError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const maxPoints = calculateMaxPoints(roundCount, steelTargets)

  function handleSave() {
    const stage: PSCStage = {
      id: crypto.randomUUID(),
      name: name || `Stage ${Date.now()}`,
      roundCount,
      paperTargets,
      steelTargets,
      noShoots,
      maxPoints,
      scoringMethod,
      classifier: classifier || undefined,
    }
    addCompetitionStage(competitionId, stage)
    onClose()
  }

  async function handleImageUpload(file: File) {
    if (!llmConfig.apiKey) {
      setExtractError('Set an API key in Settings to use image extraction')
      return
    }
    setExtracting(true)
    setExtractError(null)
    try {
      const info = await extractStageFromImage(llmConfig, file)
      if (info.name) setName(info.name)
      if (info.roundCount) setRoundCount(info.roundCount)
      if (info.paperTargets) setPaperTargets(info.paperTargets)
      if (info.steelTargets) setSteelTargets(info.steelTargets)
      if (info.noShoots) setNoShoots(info.noShoots)
      if (info.scoringMethod) setScoringMethod(info.scoringMethod as ScoringMethod)
    } catch (err: any) {
      setExtractError(err.message || 'Failed to extract stage info')
    } finally {
      setExtracting(false)
    }
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-sm">Add Stage</h3>
        <button onClick={onClose} className="p-1 hover:bg-zinc-800 rounded">
          <X className="w-4 h-4 text-zinc-500" />
        </button>
      </div>

      {/* Image upload */}
      <div className="flex gap-2">
        <button
          onClick={() => fileRef.current?.click()}
          disabled={extracting}
          className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded text-sm text-zinc-300 transition-colors disabled:opacity-50"
        >
          {extracting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
          {extracting ? 'Reading...' : 'Upload stage card'}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
        />
        {extractError && <span className="text-xs text-red-400 self-center">{extractError}</span>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="text-xs text-zinc-500 block mb-1">Stage Name</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Stage 1 - El Presidente"
            className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-zinc-500"
          />
        </div>
        <div>
          <label className="text-xs text-zinc-500 block mb-1">Scoring</label>
          <select
            value={scoringMethod}
            onChange={e => setScoringMethod(e.target.value as ScoringMethod)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-zinc-500"
          >
            <option value="comstock">Comstock</option>
            <option value="virginia">Virginia Count</option>
            <option value="fixed_time">Fixed Time</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-zinc-500 block mb-1">Classifier</label>
          <input
            value={classifier}
            onChange={e => setClassifier(e.target.value)}
            placeholder="e.g. CM 99-12"
            className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-zinc-500"
          />
        </div>
        <div>
          <label className="text-xs text-zinc-500 block mb-1">Min Rounds</label>
          <input
            type="number"
            value={roundCount}
            onChange={e => setRoundCount(parseInt(e.target.value) || 0)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-zinc-500"
          />
        </div>
        <div>
          <label className="text-xs text-zinc-500 block mb-1">Paper Targets</label>
          <input
            type="number"
            value={paperTargets}
            onChange={e => setPaperTargets(parseInt(e.target.value) || 0)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-zinc-500"
          />
        </div>
        <div>
          <label className="text-xs text-zinc-500 block mb-1">Steel Targets</label>
          <input
            type="number"
            value={steelTargets}
            onChange={e => setSteelTargets(parseInt(e.target.value) || 0)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-zinc-500"
          />
        </div>
        <div>
          <label className="text-xs text-zinc-500 block mb-1">No-Shoots</label>
          <input
            type="number"
            value={noShoots}
            onChange={e => setNoShoots(parseInt(e.target.value) || 0)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-zinc-500"
          />
        </div>
        <div>
          <label className="text-xs text-zinc-500 block mb-1">Max Points</label>
          <div className="bg-zinc-800 border border-zinc-700 rounded px-3 py-1.5 text-sm text-zinc-400">
            {maxPoints}
          </div>
        </div>
      </div>

      <button onClick={handleSave} className="w-full py-2 bg-red-600 hover:bg-red-700 rounded text-sm font-medium transition-colors">
        Add Stage
      </button>
    </div>
  )
}
