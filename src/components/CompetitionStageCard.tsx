import { useState } from 'react'
import { useStore } from '../hooks/useStore'
import { getStageAdvice } from '../lib/llm'
import { calculateStageResult, calculateBreakEven, createEmptyHits } from '../lib/scoring'
import { VoiceInput } from './VoiceInput'
import type { CompetitionStage, StageInput, ShooterClass, HitZone, ReferenceScore, StageHits } from '../types/scoring'
import { Sparkles, Loader2, Trash2, ChevronDown, ChevronUp, Target, Clock, TrendingDown, Plus, UserPlus, Check } from 'lucide-react'

const zones: HitZone[] = ['A', 'C', 'D', 'M', 'NS']
const zoneColors: Record<HitZone, string> = {
  A: 'text-green-400', C: 'text-yellow-400', D: 'text-orange-400',
  M: 'text-red-400', NS: 'text-red-600',
}

interface Props {
  stage: CompetitionStage
  competitionId: string
  shootingPosition: number
  isNext: boolean
  shooterClass: ShooterClass
  shooterDivision: string
}

export function CompetitionStageCard({ stage, competitionId, shootingPosition, isNext, shooterClass, shooterDivision }: Props) {
  const { removeCompetitionStage, setStageResult, setStageAdvice, addReferenceScore, removeReferenceScore, llmConfig } = useStore()
  const [expanded, setExpanded] = useState(isNext)
  const [adviceLoading, setAdviceLoading] = useState(false)
  const [showResultEntry, setShowResultEntry] = useState(false)
  const [showRefEntry, setShowRefEntry] = useState(false)

  const s = stage.stageInfo

  async function handleGetAdvice() {
    if (!llmConfig.apiKey) return
    setAdviceLoading(true)
    try {
      const advice = await getStageAdvice(llmConfig, stage, shooterClass, shooterDivision)
      setStageAdvice(competitionId, stage.id, advice)
    } catch (err: any) {
      setStageAdvice(competitionId, stage.id, `Error: ${err.message}`)
    } finally {
      setAdviceLoading(false)
    }
  }

  return (
    <div className={`bg-zinc-900 border rounded-lg overflow-hidden ${
      isNext ? 'border-red-500/50' : stage.completed ? 'border-green-900/50' : 'border-zinc-800'
    }`}>
      {/* Header */}
      <div
        className="px-4 py-3 flex items-center justify-between cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
            stage.completed ? 'bg-green-900/50 text-green-400' : isNext ? 'bg-red-900/50 text-red-400' : 'bg-zinc-800 text-zinc-500'
          }`}>
            {stage.completed ? <Check className="w-3.5 h-3.5" /> : shootingPosition}
          </div>
          <div>
            <h3 className="font-medium text-sm">{s.name}</h3>
            <span className="text-xs text-zinc-500">
              {s.roundCount} rds / {s.paperTargets}p / {s.steelTargets}s / {s.scoringMethod} / {s.maxPoints} pts
              {s.classifier && ` / ${s.classifier}`}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isNext && <span className="text-xs text-red-400 font-medium">NEXT</span>}
          {stage.completed && stage.result && (
            <span className="text-xs text-green-400 font-mono">
              HF {(stage.result.time > 0 ? calculateStageResult(stage.result).hitFactor : 0).toFixed(4)}
            </span>
          )}
          {expanded ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-zinc-800">
          {/* Benchmarks */}
          {stage.benchmarks && stage.benchmarks.sampleSize > 0 && (
            <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-900/50">
              <div className="text-xs text-zinc-500 mb-2">Benchmark data ({stage.benchmarks.sampleSize} shooters)</div>
              <div className="flex flex-wrap gap-3 text-xs font-mono">
                <span className="text-zinc-400">Top HF: <span className="text-green-400">{stage.benchmarks.topHF}</span></span>
                {Object.entries(stage.benchmarks.avgHF).sort().map(([cls, hf]) => (
                  <span key={cls} className="text-zinc-400">
                    {cls}: <span className="text-zinc-200">{hf}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Reference scores */}
          {stage.referenceScores.length > 0 && (
            <div className="px-4 py-3 border-b border-zinc-800">
              <div className="text-xs text-zinc-500 mb-2">Reference scores</div>
              <div className="space-y-1">
                {stage.referenceScores.map(ref => (
                  <div key={ref.id} className="flex items-center justify-between text-xs">
                    <span className="text-zinc-300">
                      {ref.shooterName || 'Anonymous'} <span className="text-zinc-500">({ref.classification})</span>
                    </span>
                    <div className="flex items-center gap-3 font-mono">
                      <span className="text-zinc-400">HF {ref.hitFactor}</span>
                      <span className="text-zinc-500">{ref.time}s</span>
                      <span className="text-zinc-500">{ref.hits.A}A/{ref.hits.C}C/{ref.hits.D}D</span>
                      <button onClick={() => removeReferenceScore(competitionId, stage.id, ref.id)} className="text-zinc-600 hover:text-red-400">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Advice */}
          {stage.aiAdvice && (
            <div className="px-4 py-3 border-b border-zinc-800">
              <div className="text-xs text-zinc-500 mb-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-purple-400" />
                AI Stage Advice
              </div>
              <div className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
                {stage.aiAdvice}
              </div>
            </div>
          )}

          {/* Completed result */}
          {stage.completed && stage.result && (
            <div className="px-4 py-3 border-b border-zinc-800 bg-green-950/10">
              <div className="text-xs text-zinc-500 mb-2">Your Result</div>
              <ResultDisplay result={stage.result} />
            </div>
          )}

          {/* Actions */}
          <div className="px-4 py-3 flex flex-wrap gap-2">
            {llmConfig.apiKey && (
              <button
                onClick={handleGetAdvice}
                disabled={adviceLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded text-xs font-medium transition-colors"
              >
                {adviceLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                {adviceLoading ? 'Thinking...' : stage.aiAdvice ? 'Refresh Advice' : 'Get AI Advice'}
              </button>
            )}
            <button
              onClick={() => setShowRefEntry(!showRefEntry)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded text-xs text-zinc-300 transition-colors"
            >
              <UserPlus className="w-3 h-3" />
              Add Reference Score
            </button>
            {!stage.completed && (
              <button
                onClick={() => setShowResultEntry(!showResultEntry)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded text-xs text-zinc-300 transition-colors"
              >
                <Target className="w-3 h-3" />
                Enter My Result
              </button>
            )}
            <button
              onClick={() => removeCompetitionStage(competitionId, stage.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-zinc-800 rounded text-xs text-zinc-500 hover:text-red-400 transition-colors ml-auto"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>

          {showRefEntry && (
            <ReferenceScoreEntry
              competitionId={competitionId}
              stageId={stage.id}
              onClose={() => setShowRefEntry(false)}
            />
          )}

          {showResultEntry && (
            <ResultEntry
              stage={stage}
              competitionId={competitionId}
              onClose={() => setShowResultEntry(false)}
            />
          )}
        </div>
      )}
    </div>
  )
}

function ResultDisplay({ result }: { result: StageInput }) {
  const stageResult = calculateStageResult(result)
  const breakEven = calculateBreakEven(result)

  const hfColor = stageResult.hitFactor >= 6 ? 'text-green-400'
    : stageResult.hitFactor >= 4 ? 'text-yellow-400'
    : stageResult.hitFactor >= 2 ? 'text-orange-400'
    : 'text-red-400'

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-4 gap-4">
        <div>
          <div className="text-xs text-zinc-500">Hit Factor</div>
          <div className={`text-lg font-bold font-mono ${hfColor}`}>{stageResult.hitFactor.toFixed(4)}</div>
        </div>
        <div>
          <div className="text-xs text-zinc-500">Points</div>
          <div className="text-lg font-bold font-mono">{stageResult.totalPoints}<span className="text-zinc-600 text-sm">/{stageResult.maxPoints}</span></div>
        </div>
        <div>
          <div className="text-xs text-zinc-500">Time</div>
          <div className="text-lg font-bold font-mono">{result.time.toFixed(2)}s</div>
        </div>
        <div>
          <div className="text-xs text-zinc-500">Accuracy</div>
          <div className="text-lg font-bold font-mono">{stageResult.percentOfMax}%</div>
        </div>
      </div>
      <div className="flex gap-3 text-xs font-mono">
        <span className="text-green-400">{result.hits.A}A</span>
        <span className="text-yellow-400">{result.hits.C}C</span>
        <span className="text-orange-400">{result.hits.D}D</span>
        {result.hits.M > 0 && <span className="text-red-400">{result.hits.M}M</span>}
        {result.hits.NS > 0 && <span className="text-red-600">{result.hits.NS}NS</span>}
      </div>
      <div className="flex gap-4 text-xs text-zinc-500">
        <span className="flex items-center gap-1">
          <TrendingDown className="w-3 h-3 text-yellow-500" />
          A→C: {breakEven.breakEvenTimePerAToC}s
        </span>
        <span className="flex items-center gap-1">
          <TrendingDown className="w-3 h-3 text-orange-500" />
          A→D: {breakEven.breakEvenTimePerAToD}s
        </span>
      </div>
    </div>
  )
}

function ResultEntry({ stage, competitionId, onClose }: { stage: CompetitionStage; competitionId: string; onClose: () => void }) {
  const { setStageResult } = useStore()
  const [hits, setHits] = useState(createEmptyHits())
  const [time, setTime] = useState(0)
  const [procedurals, setProcedurals] = useState(0)

  function handleSave() {
    const result: StageInput = {
      id: stage.id,
      name: stage.stageInfo.name,
      hits,
      time,
      maxPoints: stage.stageInfo.maxPoints,
      roundCount: stage.stageInfo.roundCount,
      scoringMethod: stage.stageInfo.scoringMethod,
      powerFactor: 'minor',
      organization: 'USPSA',
      procedurals,
    }
    setStageResult(competitionId, stage.id, result)
    onClose()
  }

  return (
    <div className="px-4 py-3 border-t border-zinc-800 bg-zinc-800/30 space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-xs font-medium text-zinc-400">Enter your result</div>
        <VoiceInput onResult={(vHits, vTime) => {
          if (vHits.A !== undefined || vHits.C !== undefined || vHits.D !== undefined || vHits.M !== undefined || vHits.NS !== undefined) {
            setHits(prev => ({ ...prev, ...Object.fromEntries(Object.entries(vHits).filter(([, v]) => v !== undefined)) } as StageHits))
          }
          if (vTime !== undefined) setTime(vTime)
        }} />
      </div>
      <div className="grid grid-cols-5 gap-2">
        {zones.map(zone => (
          <div key={zone} className="text-center">
            <span className={`text-xs font-mono font-bold ${zoneColors[zone]}`}>{zone}</span>
            <input
              type="number"
              min={0}
              value={hits[zone]}
              onChange={e => setHits(prev => ({ ...prev, [zone]: Math.max(0, parseInt(e.target.value) || 0) }))}
              className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm text-center mt-1 focus:outline-none focus:border-zinc-500"
            />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-zinc-500 block mb-1">Time (s)</label>
          <input
            type="number"
            step="0.01"
            value={time || ''}
            onChange={e => setTime(parseFloat(e.target.value) || 0)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-zinc-500"
          />
        </div>
        <div>
          <label className="text-xs text-zinc-500 block mb-1">Procedurals</label>
          <input
            type="number"
            min={0}
            value={procedurals}
            onChange={e => setProcedurals(parseInt(e.target.value) || 0)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-zinc-500"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={handleSave} className="flex-1 py-1.5 bg-green-600 hover:bg-green-700 rounded text-xs font-medium transition-colors">
          Save Result
        </button>
        <button onClick={onClose} className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded text-xs text-zinc-300 transition-colors">
          Cancel
        </button>
      </div>
    </div>
  )
}

function ReferenceScoreEntry({ competitionId, stageId, onClose }: { competitionId: string; stageId: string; onClose: () => void }) {
  const { addReferenceScore } = useStore()
  const [name, setName] = useState('')
  const [classification, setClassification] = useState<ShooterClass>('B')
  const [time, setTime] = useState(0)
  const [hits, setHits] = useState(createEmptyHits())

  function handleSave() {
    const rawPts = hits.A * 5 + hits.C * 3 + hits.D * 1
    const penalties = (hits.M + hits.NS) * 10
    const points = Math.max(0, rawPts - penalties)
    const hf = time > 0 ? Math.round((points / time) * 10000) / 10000 : 0

    const ref: ReferenceScore = {
      id: crypto.randomUUID(),
      shooterName: name || undefined,
      classification,
      time,
      hits,
      hitFactor: hf,
      points,
    }
    addReferenceScore(competitionId, stageId, ref)
    onClose()
  }

  const CLASSES: ShooterClass[] = ['GM', 'M', 'A', 'B', 'C', 'D', 'U']

  return (
    <div className="px-4 py-3 border-t border-zinc-800 bg-zinc-800/30 space-y-3">
      <div className="text-xs font-medium text-zinc-400">Add reference score from another shooter</div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-zinc-500 block mb-1">Shooter Name</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Optional"
            className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-zinc-500"
          />
        </div>
        <div>
          <label className="text-xs text-zinc-500 block mb-1">Classification</label>
          <select
            value={classification}
            onChange={e => setClassification(e.target.value as ShooterClass)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-zinc-500"
          >
            {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-5 gap-2">
        {zones.map(zone => (
          <div key={zone} className="text-center">
            <span className={`text-xs font-mono font-bold ${zoneColors[zone]}`}>{zone}</span>
            <input
              type="number"
              min={0}
              value={hits[zone]}
              onChange={e => setHits(prev => ({ ...prev, [zone]: Math.max(0, parseInt(e.target.value) || 0) }))}
              className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm text-center mt-1 focus:outline-none focus:border-zinc-500"
            />
          </div>
        ))}
      </div>
      <div>
        <label className="text-xs text-zinc-500 block mb-1">Time (s)</label>
        <input
          type="number"
          step="0.01"
          value={time || ''}
          onChange={e => setTime(parseFloat(e.target.value) || 0)}
          className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-zinc-500"
        />
      </div>
      <div className="flex gap-2">
        <button onClick={handleSave} className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-xs font-medium transition-colors">
          Add Reference
        </button>
        <button onClick={onClose} className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded text-xs text-zinc-300 transition-colors">
          Cancel
        </button>
      </div>
    </div>
  )
}
