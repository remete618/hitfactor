import { useStore } from '../hooks/useStore'
import { calculateStageResult } from '../lib/scoring'
import type { Competition } from '../types/scoring'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { Trophy, TrendingUp } from 'lucide-react'

const tooltipStyle = {
  contentStyle: { backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', fontSize: '12px' },
  labelStyle: { color: '#a1a1aa' },
}

export function MatchHistory() {
  const { competitions } = useStore()

  const completedComps = competitions.filter(c =>
    c.stages.some(s => s.completed)
  ).sort((a, b) => b.date.localeCompare(a.date))

  if (completedComps.length === 0) {
    return (
      <div className="text-center py-8 text-zinc-600 text-sm">
        No completed matches yet. Enter results in Competition mode to build your history.
      </div>
    )
  }

  // HF trend across all competitions
  const trendData = completedComps.map(c => {
    const completedStages = c.stages.filter(s => s.completed && s.result)
    const avgHF = completedStages.length > 0
      ? completedStages.reduce((sum, s) => sum + calculateStageResult(s.result!).hitFactor, 0) / completedStages.length
      : 0
    return {
      name: c.name.length > 15 ? c.name.slice(0, 15) + '...' : c.name,
      date: c.date,
      avgHF: Math.round(avgHF * 10000) / 10000,
      stages: completedStages.length,
    }
  }).reverse()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-sm font-medium">Match History</h2>
        <p className="text-xs text-zinc-500 mt-0.5">Track your performance across competitions</p>
      </div>

      {/* HF Trend */}
      {trendData.length >= 2 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
          <div className="text-xs text-zinc-500 mb-3 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5" />
            Average HF Trend
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={trendData} margin={{ top: 0, right: 10, bottom: 0, left: -20 }}>
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#71717a' }} />
              <YAxis tick={{ fontSize: 10, fill: '#71717a' }} />
              <Tooltip {...tooltipStyle} />
              <Line type="monotone" dataKey="avgHF" stroke="#4ade80" strokeWidth={2} dot={{ fill: '#4ade80', r: 4 }} name="Avg HF" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Competition cards */}
      {completedComps.map(comp => (
        <CompHistoryCard key={comp.id} competition={comp} />
      ))}
    </div>
  )
}

function CompHistoryCard({ competition }: { competition: Competition }) {
  const completed = competition.stages.filter(s => s.completed && s.result)

  const stageData = completed.map(s => {
    const res = calculateStageResult(s.result!)
    return {
      name: s.stageInfo.name.length > 10 ? s.stageInfo.name.slice(0, 10) + '..' : s.stageInfo.name,
      hf: res.hitFactor,
      accuracy: res.percentOfMax,
    }
  })

  const totalPoints = completed.reduce((sum, s) => sum + calculateStageResult(s.result!).totalPoints, 0)
  const totalMaxPts = completed.reduce((sum, s) => sum + calculateStageResult(s.result!).maxPoints, 0)
  const totalTime = completed.reduce((sum, s) => sum + (s.result?.time || 0), 0)
  const avgHF = completed.length > 0
    ? completed.reduce((sum, s) => sum + calculateStageResult(s.result!).hitFactor, 0) / completed.length
    : 0
  const accuracy = totalMaxPts > 0 ? (totalPoints / totalMaxPts) * 100 : 0

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-500" />
            <h3 className="text-sm font-medium">{competition.name}</h3>
          </div>
          <span className="text-xs text-zinc-500">{competition.date}</span>
        </div>
        <div className="text-xs text-zinc-500 mt-0.5">
          {competition.shooterDivision} / {competition.shooterClass} — {completed.length} stages
        </div>
      </div>

      <div className="px-4 py-3 grid grid-cols-4 gap-4">
        <div>
          <div className="text-xs text-zinc-500">Avg HF</div>
          <div className="text-lg font-bold font-mono text-green-400">{avgHF.toFixed(4)}</div>
        </div>
        <div>
          <div className="text-xs text-zinc-500">Points</div>
          <div className="text-lg font-bold font-mono">{totalPoints}<span className="text-zinc-600 text-sm">/{totalMaxPts}</span></div>
        </div>
        <div>
          <div className="text-xs text-zinc-500">Time</div>
          <div className="text-lg font-bold font-mono">{totalTime.toFixed(2)}s</div>
        </div>
        <div>
          <div className="text-xs text-zinc-500">Accuracy</div>
          <div className="text-lg font-bold font-mono">{accuracy.toFixed(1)}%</div>
        </div>
      </div>

      {stageData.length >= 2 && (
        <div className="px-4 py-3 border-t border-zinc-800">
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={stageData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#71717a' }} />
              <YAxis tick={{ fontSize: 9, fill: '#71717a' }} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="hf" fill="#4ade80" radius={[3, 3, 0, 0]} name="HF" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
