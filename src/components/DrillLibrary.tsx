import { useState } from 'react'
import { Target, Clock, ChevronDown, ChevronUp } from 'lucide-react'

interface Drill {
  name: string
  description: string
  roundCount: number
  paperTargets: number
  steelTargets: number
  scoringMethod: string
  targetHF: Record<string, string>
  tips: string[]
}

const DRILLS: Drill[] = [
  {
    name: 'El Presidente',
    description: 'Start facing uprange. On signal, turn, draw, engage 3 targets with 2 rounds each, mandatory reload, engage 3 targets again. 12 rounds, Virginia Count.',
    roundCount: 12,
    paperTargets: 3,
    steelTargets: 0,
    scoringMethod: 'virginia',
    targetHF: { GM: '8.0+', M: '6.5+', A: '5.0+', B: '4.0+', C: '3.0+' },
    tips: ['Smooth turn wins — don\'t rush the draw', 'Reload while transitioning to first target', 'Accept Cs on far targets if saving 0.3s+'],
  },
  {
    name: 'Bill Drill',
    description: 'Draw and fire 6 rounds at a single IPSC target at 7 yards. All A-zone. Tests draw speed and recoil control.',
    roundCount: 6,
    paperTargets: 1,
    steelTargets: 0,
    scoringMethod: 'comstock',
    targetHF: { GM: '10.0+', M: '8.0+', A: '6.0+', B: '5.0+', C: '4.0+' },
    tips: ['Focus on grip pressure, not trigger speed', 'Track the front sight — let it settle between shots', 'Sub-2s is GM level'],
  },
  {
    name: 'Blake Drill',
    description: '3 targets, 2 rounds each. Draw, 2 on center, 2 on left, 2 on right. Tests transitions and draw.',
    roundCount: 6,
    paperTargets: 3,
    steelTargets: 0,
    scoringMethod: 'comstock',
    targetHF: { GM: '9.0+', M: '7.0+', A: '5.5+', B: '4.5+', C: '3.5+' },
    tips: ['Drive the gun to the next target — eyes lead the gun', 'Don\'t confirm second hit, trust the rhythm', 'Work on a consistent draw to first shot'],
  },
  {
    name: 'Mozambique (Failure to Stop)',
    description: '1 target, 3 rounds: 2 to the body (A-zone), 1 to the head. Tests controlled pairs and precision.',
    roundCount: 3,
    paperTargets: 1,
    steelTargets: 0,
    scoringMethod: 'comstock',
    targetHF: { GM: '8.0+', M: '6.5+', A: '5.0+', B: '4.0+', C: '3.0+' },
    tips: ['Don\'t rush the head shot — it\'s worth slowing down 0.3s', 'Two fast body shots, pause, precise head shot', 'Head miss costs more than the time saved'],
  },
  {
    name: 'Smoke & Hope',
    description: '5 steel poppers at varying distances. Draw and engage all 5. Tests steel transition speed.',
    roundCount: 5,
    paperTargets: 0,
    steelTargets: 5,
    scoringMethod: 'comstock',
    targetHF: { GM: '7.0+', M: '5.5+', A: '4.5+', B: '3.5+', C: '2.5+' },
    tips: ['Shoot near to far — easier transitions', 'Don\'t wait for the fall — move to next target', 'A makeup shot costs more than slowing down 0.2s'],
  },
  {
    name: 'Accelerator',
    description: '4 targets at 5, 10, 15, 20 yards. 2 rounds each. Tests accuracy at distance under time pressure.',
    roundCount: 8,
    paperTargets: 4,
    steelTargets: 0,
    scoringMethod: 'comstock',
    targetHF: { GM: '7.0+', M: '5.5+', A: '4.0+', B: '3.0+', C: '2.5+' },
    tips: ['Slow down for far targets — the break-even on a miss is huge', 'Speed up close, slow down far', 'At 20 yards, a C is acceptable if saving 0.5s'],
  },
  {
    name: 'Dot Torture (Modified)',
    description: '10 small targets at 3-7 yards. 1 round each. Pure precision drill — fixed time.',
    roundCount: 10,
    paperTargets: 10,
    steelTargets: 0,
    scoringMethod: 'fixed_time',
    targetHF: { GM: '50/50', M: '48/50', A: '45/50', B: '40/50', C: '35/50' },
    tips: ['This is pure accuracy — no time pressure', 'Focus on sight picture and trigger press', 'Track which positions you miss consistently'],
  },
]

export function DrillLibrary() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-medium">Drill Library</h2>
        <p className="text-xs text-zinc-500 mt-0.5">Standard practice drills with target HFs by classification</p>
      </div>
      <div className="space-y-2">
        {DRILLS.map(drill => <DrillCard key={drill.name} drill={drill} />)}
      </div>
    </div>
  )
}

function DrillCard({ drill }: { drill: Drill }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
      <div className="px-4 py-3 flex items-center justify-between cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div>
          <h3 className="text-sm font-medium">{drill.name}</h3>
          <div className="text-xs text-zinc-500 flex items-center gap-3 mt-0.5">
            <span className="flex items-center gap-1"><Target className="w-3 h-3" />{drill.paperTargets}p / {drill.steelTargets}s</span>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{drill.roundCount} rds</span>
            <span>{drill.scoringMethod}</span>
          </div>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
      </div>

      {expanded && (
        <div className="border-t border-zinc-800 space-y-3">
          <div className="px-4 pt-3">
            <p className="text-xs text-zinc-400 leading-relaxed">{drill.description}</p>
          </div>

          <div className="px-4">
            <div className="text-xs text-zinc-500 mb-1.5">Target HF by Class</div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(drill.targetHF).map(([cls, hf]) => (
                <span key={cls} className="px-2 py-1 bg-zinc-800 rounded text-xs font-mono">
                  <span className="text-zinc-500">{cls}:</span> <span className="text-zinc-200">{hf}</span>
                </span>
              ))}
            </div>
          </div>

          <div className="px-4 pb-3">
            <div className="text-xs text-zinc-500 mb-1.5">Tips</div>
            <ul className="space-y-1">
              {drill.tips.map((tip, i) => (
                <li key={i} className="text-xs text-zinc-400 pl-3 relative before:content-[''] before:absolute before:left-0 before:top-[7px] before:w-1.5 before:h-1.5 before:rounded-full before:bg-zinc-700">
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
