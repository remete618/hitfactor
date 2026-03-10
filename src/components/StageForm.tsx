import { useState, useRef } from 'react'
import { useStore, createDefaultStageInput } from '../hooks/useStore'
import { calculateMaxPoints } from '../lib/scoring'
import { extractStageFromImage } from '../lib/vision'
import type { StageInput, ScoringMethod, PowerFactor, Organization, HitZone } from '../types/scoring'
import { Camera, Upload, X, Loader2 } from 'lucide-react'

interface Props {
  editId: string | null
  onClose: () => void
}

export function StageForm({ editId, onClose }: Props) {
  const { stages, addStage, updateStage, llmConfig } = useStore()
  const existing = editId ? stages.find(s => s.input.id === editId)?.input : null

  const [input, setInput] = useState<StageInput>(existing || createDefaultStageInput())
  const [steelCount, setSteelCount] = useState(0)
  const [extracting, setExtracting] = useState(false)
  const [extractError, setExtractError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const maxPts = calculateMaxPoints(input.roundCount, steelCount)

  function update<K extends keyof StageInput>(key: K, value: StageInput[K]) {
    setInput(prev => ({ ...prev, [key]: value }))
  }

  function updateHit(zone: HitZone, value: number) {
    setInput(prev => ({ ...prev, hits: { ...prev.hits, [zone]: Math.max(0, value) } }))
  }

  function handleSave() {
    const finalInput = { ...input, maxPoints: maxPts }
    if (editId) {
      updateStage(editId, finalInput)
    } else {
      addStage(finalInput)
    }
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
      setInput(prev => ({
        ...prev,
        name: info.name || prev.name,
        roundCount: info.roundCount || prev.roundCount,
        scoringMethod: (info.scoringMethod as ScoringMethod) || prev.scoringMethod,
      }))
      if (info.steelTargets) setSteelCount(info.steelTargets)
    } catch (err: any) {
      setExtractError(err.message || 'Failed to extract stage info')
    } finally {
      setExtracting(false)
    }
  }

  const zones: HitZone[] = ['A', 'C', 'D', 'M', 'NS']
  const zoneColors: Record<HitZone, string> = {
    A: 'text-green-400', C: 'text-yellow-400', D: 'text-orange-400',
    M: 'text-red-400', NS: 'text-red-600',
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-medium">{editId ? 'Edit Stage' : 'New Stage'}</h2>
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

      {/* Stage name and config */}
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="text-xs text-zinc-500 block mb-1">Stage Name</label>
          <input
            value={input.name}
            onChange={e => update('name', e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-zinc-500"
          />
        </div>

        <div>
          <label className="text-xs text-zinc-500 block mb-1">Organization</label>
          <select
            value={input.organization}
            onChange={e => update('organization', e.target.value as Organization)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-zinc-500"
          >
            <option value="USPSA">USPSA</option>
            <option value="IPSC">IPSC</option>
          </select>
        </div>

        <div>
          <label className="text-xs text-zinc-500 block mb-1">Scoring</label>
          <select
            value={input.scoringMethod}
            onChange={e => update('scoringMethod', e.target.value as ScoringMethod)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-zinc-500"
          >
            <option value="comstock">Comstock</option>
            <option value="virginia">Virginia Count</option>
            <option value="fixed_time">Fixed Time</option>
          </select>
        </div>

        <div>
          <label className="text-xs text-zinc-500 block mb-1">Power Factor</label>
          <select
            value={input.powerFactor}
            onChange={e => update('powerFactor', e.target.value as PowerFactor)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-zinc-500"
          >
            <option value="minor">Minor</option>
            <option value="major">Major</option>
          </select>
        </div>

        <div>
          <label className="text-xs text-zinc-500 block mb-1">Min. Rounds</label>
          <input
            type="number"
            value={input.roundCount}
            onChange={e => update('roundCount', parseInt(e.target.value) || 0)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-zinc-500"
          />
        </div>

        <div>
          <label className="text-xs text-zinc-500 block mb-1">Steel Targets</label>
          <input
            type="number"
            value={steelCount}
            onChange={e => setSteelCount(parseInt(e.target.value) || 0)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-zinc-500"
          />
        </div>

        <div>
          <label className="text-xs text-zinc-500 block mb-1">Max Points</label>
          <div className="bg-zinc-800 border border-zinc-700 rounded px-3 py-1.5 text-sm text-zinc-400">
            {maxPts}
          </div>
        </div>
      </div>

      {/* Hit zones */}
      <div>
        <label className="text-xs text-zinc-500 block mb-2">Hits</label>
        <div className="grid grid-cols-5 gap-2">
          {zones.map(zone => (
            <div key={zone} className="text-center">
              <span className={`text-xs font-mono font-bold ${zoneColors[zone]}`}>{zone}</span>
              <input
                type="number"
                min={0}
                value={input.hits[zone]}
                onChange={e => updateHit(zone, parseInt(e.target.value) || 0)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-sm text-center mt-1 focus:outline-none focus:border-zinc-500"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Time and procedurals */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-zinc-500 block mb-1">Time (seconds)</label>
          <input
            type="number"
            step="0.01"
            value={input.time || ''}
            onChange={e => update('time', parseFloat(e.target.value) || 0)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-zinc-500"
          />
        </div>

        <div>
          <label className="text-xs text-zinc-500 block mb-1">Procedurals</label>
          <input
            type="number"
            min={0}
            value={input.procedurals}
            onChange={e => update('procedurals', parseInt(e.target.value) || 0)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-zinc-500"
          />
        </div>
      </div>

      <button
        onClick={handleSave}
        className="w-full py-2 bg-red-600 hover:bg-red-700 rounded text-sm font-medium transition-colors"
      >
        {editId ? 'Update Stage' : 'Add Stage'}
      </button>
    </div>
  )
}
