import { useState } from 'react'
import { calculateStageResult, calculateBreakEven, calculateMaxPoints, createEmptyHits } from '../lib/scoring'
import type { StageHits, PowerFactor, ScoringMethod, HitZone } from '../types/scoring'
import { TrendingDown, RotateCcw } from 'lucide-react'

const zones: HitZone[] = ['A', 'C', 'D', 'M', 'NS']
const zoneColors: Record<HitZone, string> = {
  A: 'text-green-400', C: 'text-yellow-400', D: 'text-orange-400',
  M: 'text-red-400', NS: 'text-red-600',
}

export function QuickCheck() {
  const [hits, setHits] = useState<StageHits>(createEmptyHits())
  const [time, setTime] = useState(0)
  const [roundCount, setRoundCount] = useState(12)
  const [steelCount, setSteelCount] = useState(0)
  const [powerFactor, setPowerFactor] = useState<PowerFactor>('minor')
  const [scoringMethod, setScoringMethod] = useState<ScoringMethod>('comstock')
  const [procedurals, setProcedurals] = useState(0)

  const maxPoints = calculateMaxPoints(roundCount, steelCount)

  const input = {
    id: 'quick',
    name: 'Quick Check',
    hits,
    time,
    maxPoints,
    roundCount,
    scoringMethod,
    powerFactor,
    organization: 'USPSA' as const,
    procedurals,
  }

  const result = calculateStageResult(input)
  const breakEven = calculateBreakEven(input)
  const hasData = time > 0 && (hits.A + hits.C + hits.D + hits.M + hits.NS) > 0

  const hfColor = result.hitFactor >= 6 ? 'text-green-400'
    : result.hitFactor >= 4 ? 'text-yellow-400'
    : result.hitFactor >= 2 ? 'text-orange-400'
    : 'text-red-400'

  function reset() {
    setHits(createEmptyHits())
    setTime(0)
    setRoundCount(12)
    setSteelCount(0)
    setPowerFactor('minor')
    setScoringMethod('comstock')
    setProcedurals(0)
  }

  function updateHit(zone: HitZone, value: number) {
    setHits(prev => ({ ...prev, [zone]: Math.max(0, value) }))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-medium">Quick Check</h2>
          <p className="text-xs text-zinc-500 mt-0.5">Single stage — enter hits and time, get instant analysis</p>
        </div>
        <button onClick={reset} className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded transition-colors">
          <RotateCcw className="w-3 h-3" />
          Reset
        </button>
      </div>

      {/* Config row */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
        <div className="grid grid-cols-5 gap-3">
          <div>
            <label className="text-xs text-zinc-500 block mb-1">Scoring</label>
            <select
              value={scoringMethod}
              onChange={e => setScoringMethod(e.target.value as ScoringMethod)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-zinc-500"
            >
              <option value="comstock">Comstock</option>
              <option value="virginia">Virginia</option>
              <option value="fixed_time">Fixed Time</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-zinc-500 block mb-1">Power Factor</label>
            <select
              value={powerFactor}
              onChange={e => setPowerFactor(e.target.value as PowerFactor)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-zinc-500"
            >
              <option value="minor">Minor</option>
              <option value="major">Major</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-zinc-500 block mb-1">Rounds</label>
            <input
              type="number"
              value={roundCount}
              onChange={e => setRoundCount(parseInt(e.target.value) || 0)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-zinc-500"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-500 block mb-1">Steel</label>
            <input
              type="number"
              value={steelCount}
              onChange={e => setSteelCount(parseInt(e.target.value) || 0)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-zinc-500"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-500 block mb-1">Max Pts</label>
            <div className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-sm text-zinc-400">
              {maxPoints}
            </div>
          </div>
        </div>

        {/* Hits */}
        <div className="mt-4">
          <label className="text-xs text-zinc-500 block mb-2">Hits</label>
          <div className="grid grid-cols-5 gap-2">
            {zones.map(zone => (
              <div key={zone} className="text-center">
                <span className={`text-xs font-mono font-bold ${zoneColors[zone]}`}>{zone}</span>
                <input
                  type="number"
                  min={0}
                  value={hits[zone]}
                  onChange={e => updateHit(zone, parseInt(e.target.value) || 0)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-sm text-center mt-1 focus:outline-none focus:border-zinc-500"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Time + Procedurals */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-zinc-500 block mb-1">Time (seconds)</label>
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
      </div>

      {/* Results */}
      {hasData && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
          <div className="px-4 py-3 grid grid-cols-4 gap-4">
            <div>
              <div className="text-xs text-zinc-500 mb-0.5">Hit Factor</div>
              <div className={`text-2xl font-bold font-mono ${hfColor}`}>
                {result.hitFactor.toFixed(4)}
              </div>
            </div>
            <div>
              <div className="text-xs text-zinc-500 mb-0.5">Points</div>
              <div className="text-2xl font-bold font-mono">
                {result.totalPoints}<span className="text-zinc-600 text-sm">/{result.maxPoints}</span>
              </div>
            </div>
            <div>
              <div className="text-xs text-zinc-500 mb-0.5">Time</div>
              <div className="text-2xl font-bold font-mono">{time.toFixed(2)}s</div>
            </div>
            <div>
              <div className="text-xs text-zinc-500 mb-0.5">Accuracy</div>
              <div className="text-2xl font-bold font-mono">{result.percentOfMax}%</div>
            </div>
          </div>

          {result.penalties > 0 && (
            <div className="px-4 py-2 border-t border-zinc-800 text-xs text-red-400 font-mono">
              -{result.penalties} penalty points ({hits.M > 0 ? `${hits.M}M` : ''}{hits.NS > 0 ? ` ${hits.NS}NS` : ''}{procedurals > 0 ? ` ${procedurals}P` : ''})
            </div>
          )}

          {/* Break-even */}
          <div className="px-4 py-3 border-t border-zinc-800 bg-zinc-900/50">
            <div className="text-xs text-zinc-500 mb-2">Speed vs. Accuracy Trade-off</div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="flex items-start gap-2">
                <TrendingDown className="w-3.5 h-3.5 text-yellow-500 mt-0.5 shrink-0" />
                <div>
                  <span className="text-zinc-400">A&rarr;C break-even:</span>
                  <span className="text-zinc-200 font-mono ml-1">{breakEven.breakEvenTimePerAToC}s</span>
                  <div className="text-zinc-600 mt-0.5">
                    Save &gt;{breakEven.breakEvenTimePerAToC}s per hit to justify
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <TrendingDown className="w-3.5 h-3.5 text-orange-500 mt-0.5 shrink-0" />
                <div>
                  <span className="text-zinc-400">A&rarr;D break-even:</span>
                  <span className="text-zinc-200 font-mono ml-1">{breakEven.breakEvenTimePerAToD}s</span>
                  <div className="text-zinc-600 mt-0.5">
                    Save &gt;{breakEven.breakEvenTimePerAToD}s per hit to justify
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-2 text-xs text-zinc-400 leading-relaxed">
              {breakEven.recommendation}
            </div>
          </div>
        </div>
      )}

      {!hasData && (
        <div className="text-center py-8 text-zinc-600 text-sm">
          Enter your hits and time above to see results
        </div>
      )}
    </div>
  )
}
