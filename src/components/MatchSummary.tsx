import { useStore } from '../hooks/useStore'

export function MatchSummary() {
  const { stages } = useStore()

  if (stages.length === 0) return null

  const totalPoints = stages.reduce((sum, s) => sum + s.result.totalPoints, 0)
  const totalMaxPoints = stages.reduce((sum, s) => sum + s.result.maxPoints, 0)
  const totalTime = stages.reduce((sum, s) => sum + s.input.time, 0)
  const avgHF = stages.reduce((sum, s) => sum + s.result.hitFactor, 0) / stages.length
  const overallAccuracy = totalMaxPoints > 0 ? (totalPoints / totalMaxPoints) * 100 : 0

  const bestStage = stages.reduce((best, s) => s.result.hitFactor > best.result.hitFactor ? s : best)
  const worstStage = stages.reduce((worst, s) => s.result.hitFactor < worst.result.hitFactor ? s : worst)

  // Swing analysis: which stage has the most room for improvement
  const swingStage = stages.reduce((max, s) => {
    const gap = s.result.maxPoints - s.result.totalPoints
    const maxGap = max.result.maxPoints - max.result.totalPoints
    return gap > maxGap ? s : max
  })

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
      <h2 className="text-sm font-medium mb-3">Match Summary — {stages.length} stage{stages.length !== 1 ? 's' : ''}</h2>

      <div className="grid grid-cols-4 gap-4 mb-4">
        <div>
          <div className="text-xs text-zinc-500">Total Points</div>
          <div className="text-lg font-bold font-mono">{totalPoints}<span className="text-zinc-600 text-sm">/{totalMaxPoints}</span></div>
        </div>
        <div>
          <div className="text-xs text-zinc-500">Total Time</div>
          <div className="text-lg font-bold font-mono">{totalTime.toFixed(2)}s</div>
        </div>
        <div>
          <div className="text-xs text-zinc-500">Avg Hit Factor</div>
          <div className="text-lg font-bold font-mono">{avgHF.toFixed(4)}</div>
        </div>
        <div>
          <div className="text-xs text-zinc-500">Accuracy</div>
          <div className="text-lg font-bold font-mono">{overallAccuracy.toFixed(1)}%</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 text-xs">
        <div className="bg-zinc-800/50 rounded p-2">
          <div className="text-zinc-500 mb-1">Best HF</div>
          <div className="text-green-400 font-mono">{bestStage.result.hitFactor.toFixed(4)}</div>
          <div className="text-zinc-500 truncate">{bestStage.input.name}</div>
        </div>
        <div className="bg-zinc-800/50 rounded p-2">
          <div className="text-zinc-500 mb-1">Worst HF</div>
          <div className="text-red-400 font-mono">{worstStage.result.hitFactor.toFixed(4)}</div>
          <div className="text-zinc-500 truncate">{worstStage.input.name}</div>
        </div>
        <div className="bg-zinc-800/50 rounded p-2">
          <div className="text-zinc-500 mb-1">Biggest Swing</div>
          <div className="text-yellow-400 font-mono">-{swingStage.result.maxPoints - swingStage.result.totalPoints} pts</div>
          <div className="text-zinc-500 truncate">{swingStage.input.name}</div>
        </div>
      </div>
    </div>
  )
}
