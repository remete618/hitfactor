import { useState } from 'react'
import { useStore } from '../hooks/useStore'
import { CompetitionStageCard } from './CompetitionStageCard'
import { AddStageForm } from './AddStageForm'
import { PSCImport } from './PSCImport'
import { getCompetitionPlan } from '../lib/llm'
import type { Competition } from '../types/scoring'
import { ArrowLeft, Plus, Upload, Sparkles, Loader2, Play } from 'lucide-react'

export function CompetitionView({ competition }: { competition: Competition }) {
  const { setActiveCompetition, updateCompetition, llmConfig, importedMatches } = useStore()
  const [showAddStage, setShowAddStage] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [matchPlan, setMatchPlan] = useState<string | null>(null)
  const [planLoading, setPlanLoading] = useState(false)

  const completed = competition.stages.filter(s => s.completed).length
  const total = competition.stages.length
  const sortedStages = [...competition.stages].sort((a, b) => a.order - b.order)

  // Shooting order starting from startStageIndex
  const shootingOrder = sortedStages.map((s, i) => ({
    ...s,
    shootingPosition: (i - competition.startStageIndex + total) % total,
  })).sort((a, b) => a.shootingPosition - b.shootingPosition)

  async function handleGetPlan() {
    if (!llmConfig.apiKey) return
    setPlanLoading(true)
    setMatchPlan(null)
    try {
      const result = await getCompetitionPlan(
        llmConfig,
        competition.stages,
        competition.shooterClass,
        competition.shooterDivision,
        competition.startStageIndex,
      )
      setMatchPlan(result)
    } catch (err: any) {
      setMatchPlan(`Error: ${err.message}`)
    } finally {
      setPlanLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => setActiveCompetition(null)}
            className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 mb-2 transition-colors"
          >
            <ArrowLeft className="w-3 h-3" />
            Back to competitions
          </button>
          <h2 className="text-lg font-semibold">{competition.name}</h2>
          <div className="text-xs text-zinc-500 flex items-center gap-3 mt-0.5">
            <span>{competition.date}</span>
            <span>{competition.shooterDivision} / {competition.shooterClass}</span>
            {total > 0 && <span>{completed}/{total} stages completed</span>}
          </div>
        </div>
      </div>

      {/* Start stage selector */}
      {total > 0 && (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <Play className="w-3 h-3" />
            <span>Start at:</span>
          </div>
          <select
            value={competition.startStageIndex}
            onChange={e => updateCompetition(competition.id, { startStageIndex: parseInt(e.target.value) })}
            className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs focus:outline-none focus:border-zinc-500"
          >
            {sortedStages.map((s, i) => (
              <option key={s.id} value={i}>Stage {i + 1}: {s.stageInfo.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Progress bar */}
      {total > 0 && (
        <div className="w-full bg-zinc-800 rounded-full h-1.5">
          <div
            className="bg-red-500 h-1.5 rounded-full transition-all"
            style={{ width: `${(completed / total) * 100}%` }}
          />
        </div>
      )}

      {/* Stage cards in shooting order */}
      {shootingOrder.map((stage, i) => (
        <CompetitionStageCard
          key={stage.id}
          stage={stage}
          competitionId={competition.id}
          shootingPosition={i + 1}
          isNext={!stage.completed && shootingOrder.findIndex(s => !s.completed) === i}
          shooterClass={competition.shooterClass}
          shooterDivision={competition.shooterDivision}
        />
      ))}

      {/* Add stage buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => setShowAddStage(true)}
          className="flex-1 py-3 border border-dashed border-zinc-700 rounded-lg text-zinc-500 hover:text-zinc-300 hover:border-zinc-500 transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Stage Manually
        </button>
        <button
          onClick={() => setShowImport(!showImport)}
          className="flex-1 py-3 border border-dashed border-zinc-700 rounded-lg text-zinc-500 hover:text-zinc-300 hover:border-zinc-500 transition-colors flex items-center justify-center gap-2"
        >
          <Upload className="w-4 h-4" />
          Import from PractiScore
        </button>
      </div>

      {showAddStage && (
        <AddStageForm
          competitionId={competition.id}
          onClose={() => setShowAddStage(false)}
        />
      )}

      {showImport && (
        <div className="space-y-4">
          <PSCImport />
          {importedMatches.length > 0 && (
            <ImportStageSelector competitionId={competition.id} />
          )}
        </div>
      )}

      {/* AI Match Plan */}
      {total > 0 && llmConfig.apiKey && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              AI Match Plan
            </h3>
            <button
              onClick={handleGetPlan}
              disabled={planLoading}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded text-xs font-medium transition-colors flex items-center gap-1.5"
            >
              {planLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
              {planLoading ? 'Planning...' : 'Generate Match Plan'}
            </button>
          </div>
          {matchPlan && (
            <div className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap bg-zinc-800/50 rounded p-3 max-h-96 overflow-y-auto">
              {matchPlan}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ImportStageSelector({ competitionId }: { competitionId: string }) {
  const { importedMatches, importStagesFromMatch } = useStore()
  const [selectedMatch, setSelectedMatch] = useState(importedMatches[0]?.id || '')
  const [selectedStages, setSelectedStages] = useState<string[]>([])

  const match = importedMatches.find(m => m.id === selectedMatch)

  function toggleStage(id: string) {
    setSelectedStages(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id])
  }

  function handleImport() {
    if (selectedStages.length === 0) return
    importStagesFromMatch(competitionId, selectedMatch, selectedStages)
    setSelectedStages([])
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-3">
      <h4 className="text-xs font-medium text-zinc-400">Import stages from match</h4>
      <select
        value={selectedMatch}
        onChange={e => { setSelectedMatch(e.target.value); setSelectedStages([]) }}
        className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-zinc-500"
      >
        {importedMatches.map(m => (
          <option key={m.id} value={m.id}>{m.name} ({m.date})</option>
        ))}
      </select>

      {match && (
        <div className="space-y-1">
          {match.stages.map(stage => (
            <label key={stage.id} className="flex items-center gap-2 py-1 px-2 rounded hover:bg-zinc-800 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={selectedStages.includes(stage.id)}
                onChange={() => toggleStage(stage.id)}
                className="rounded bg-zinc-700 border-zinc-600"
              />
              <span className="text-zinc-300">{stage.name}</span>
              <span className="text-zinc-600 font-mono ml-auto">{stage.roundCount}rds / {stage.maxPoints}pts</span>
            </label>
          ))}
        </div>
      )}

      <button
        onClick={handleImport}
        disabled={selectedStages.length === 0}
        className="w-full py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded text-sm font-medium transition-colors"
      >
        Import {selectedStages.length} stage{selectedStages.length !== 1 ? 's' : ''}
      </button>
    </div>
  )
}
