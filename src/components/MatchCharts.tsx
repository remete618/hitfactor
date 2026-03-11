import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts'
import type { MatchStage } from '../types/scoring'

const COLORS = {
  green: '#4ade80',
  yellow: '#facc15',
  orange: '#fb923c',
  red: '#f87171',
  darkRed: '#dc2626',
  blue: '#60a5fa',
  purple: '#a78bfa',
  zinc: '#71717a',
}

const tooltipStyle = {
  contentStyle: { backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', fontSize: '12px' },
  labelStyle: { color: '#a1a1aa' },
}

export function MatchCharts({ stages }: { stages: MatchStage[] }) {
  if (stages.length === 0) return null

  const hfData = stages.map(s => ({
    name: s.input.name.length > 12 ? s.input.name.slice(0, 12) + '...' : s.input.name,
    hf: s.result.hitFactor,
    fill: s.result.hitFactor >= 6 ? COLORS.green : s.result.hitFactor >= 4 ? COLORS.yellow : s.result.hitFactor >= 2 ? COLORS.orange : COLORS.red,
  }))

  const hitDistribution = stages.reduce(
    (acc, s) => {
      acc[0].value += s.input.hits.A
      acc[1].value += s.input.hits.C
      acc[2].value += s.input.hits.D
      acc[3].value += s.input.hits.M
      acc[4].value += s.input.hits.NS
      return acc
    },
    [
      { name: 'A', value: 0, color: COLORS.green },
      { name: 'C', value: 0, color: COLORS.yellow },
      { name: 'D', value: 0, color: COLORS.orange },
      { name: 'M', value: 0, color: COLORS.red },
      { name: 'NS', value: 0, color: COLORS.darkRed },
    ],
  ).filter(d => d.value > 0)

  const pointsData = stages.map(s => ({
    name: s.input.name.length > 12 ? s.input.name.slice(0, 12) + '...' : s.input.name,
    earned: s.result.totalPoints,
    lost: s.result.maxPoints - s.result.totalPoints,
  }))

  const radarData = stages.map(s => ({
    name: s.input.name.length > 10 ? s.input.name.slice(0, 10) + '..' : s.input.name,
    accuracy: s.result.percentOfMax,
    speed: Math.min(100, (s.result.hitFactor / 8) * 100),
  }))

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium">Match Analytics</h3>

      <div className="grid grid-cols-2 gap-4">
        {/* HF by stage */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
          <div className="text-xs text-zinc-500 mb-3">Hit Factor by Stage</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={hfData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#71717a' }} />
              <YAxis tick={{ fontSize: 10, fill: '#71717a' }} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="hf" radius={[4, 4, 0, 0]}>
                {hfData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Hit distribution */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
          <div className="text-xs text-zinc-500 mb-3">Hit Zone Distribution</div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={hitDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2}>
                {hitDistribution.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip {...tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-3 text-xs mt-1">
            {hitDistribution.map(d => (
              <span key={d.name} className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                {d.name}: {d.value}
              </span>
            ))}
          </div>
        </div>

        {/* Points earned vs lost */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
          <div className="text-xs text-zinc-500 mb-3">Points Earned vs Left on Table</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={pointsData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#71717a' }} />
              <YAxis tick={{ fontSize: 10, fill: '#71717a' }} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="earned" stackId="a" fill={COLORS.green} radius={[0, 0, 0, 0]} name="Earned" />
              <Bar dataKey="lost" stackId="a" fill={COLORS.zinc} radius={[4, 4, 0, 0]} name="Left on table" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Speed vs Accuracy radar */}
        {stages.length >= 3 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
            <div className="text-xs text-zinc-500 mb-3">Speed vs Accuracy Profile</div>
            <ResponsiveContainer width="100%" height={180}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#27272a" />
                <PolarAngleAxis dataKey="name" tick={{ fontSize: 9, fill: '#71717a' }} />
                <PolarRadiusAxis tick={{ fontSize: 9, fill: '#52525b' }} domain={[0, 100]} />
                <Radar name="Accuracy" dataKey="accuracy" stroke={COLORS.blue} fill={COLORS.blue} fillOpacity={0.2} />
                <Radar name="Speed" dataKey="speed" stroke={COLORS.purple} fill={COLORS.purple} fillOpacity={0.2} />
              </RadarChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 text-xs mt-1">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400" />Accuracy</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-400" />Speed</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
