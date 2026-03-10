import type { MatchStage } from '../types/scoring'
import { useStore } from '../hooks/useStore'
import { Pencil, Trash2, TrendingUp, TrendingDown } from 'lucide-react'

interface Props {
  stage: MatchStage
  onEdit: () => void
}

export function StageCard({ stage, onEdit }: Props) {
  const { removeStage } = useStore()
  const { input, result, breakEven } = stage

  const hfColor = result.hitFactor >= 6 ? 'text-green-400'
    : result.hitFactor >= 4 ? 'text-yellow-400'
    : result.hitFactor >= 2 ? 'text-orange-400'
    : 'text-red-400'

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-zinc-800">
        <div>
          <h3 className="font-medium text-sm">{input.name}</h3>
          <span className="text-xs text-zinc-500">
            {input.organization} {input.scoringMethod} / {input.powerFactor} PF
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onEdit} className="p-1.5 hover:bg-zinc-800 rounded text-zinc-500 hover:text-zinc-300">
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => removeStage(input.id)} className="p-1.5 hover:bg-zinc-800 rounded text-zinc-500 hover:text-red-400">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Scores */}
      <div className="px-4 py-3 grid grid-cols-4 gap-4">
        <div>
          <div className="text-xs text-zinc-500 mb-0.5">Hit Factor</div>
          <div className={`text-xl font-bold font-mono ${hfColor}`}>
            {result.hitFactor.toFixed(4)}
          </div>
        </div>
        <div>
          <div className="text-xs text-zinc-500 mb-0.5">Points</div>
          <div className="text-xl font-bold font-mono">
            {result.totalPoints}<span className="text-zinc-600 text-sm">/{result.maxPoints}</span>
          </div>
        </div>
        <div>
          <div className="text-xs text-zinc-500 mb-0.5">Time</div>
          <div className="text-xl font-bold font-mono">{input.time.toFixed(2)}s</div>
        </div>
        <div>
          <div className="text-xs text-zinc-500 mb-0.5">Accuracy</div>
          <div className="text-xl font-bold font-mono">{result.percentOfMax}%</div>
        </div>
      </div>

      {/* Hits breakdown */}
      <div className="px-4 py-2 border-t border-zinc-800 flex gap-3 text-xs font-mono">
        <span className="text-green-400">{input.hits.A}A</span>
        <span className="text-yellow-400">{input.hits.C}C</span>
        <span className="text-orange-400">{input.hits.D}D</span>
        {input.hits.M > 0 && <span className="text-red-400">{input.hits.M}M</span>}
        {input.hits.NS > 0 && <span className="text-red-600">{input.hits.NS}NS</span>}
        {result.penalties > 0 && <span className="text-red-500 ml-auto">-{result.penalties} pen</span>}
      </div>

      {/* Break-even analysis */}
      <div className="px-4 py-3 border-t border-zinc-800 bg-zinc-900/50">
        <div className="text-xs text-zinc-500 mb-2">Speed vs. Accuracy Trade-off</div>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="flex items-start gap-2">
            <TrendingDown className="w-3.5 h-3.5 text-yellow-500 mt-0.5 shrink-0" />
            <div>
              <span className="text-zinc-400">A→C break-even:</span>
              <span className="text-zinc-200 font-mono ml-1">{breakEven.breakEvenTimePerAToC}s</span>
              <div className="text-zinc-600 mt-0.5">
                Save &gt;{breakEven.breakEvenTimePerAToC}s per hit to justify
              </div>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <TrendingDown className="w-3.5 h-3.5 text-orange-500 mt-0.5 shrink-0" />
            <div>
              <span className="text-zinc-400">A→D break-even:</span>
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
  )
}
