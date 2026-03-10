import { useState } from 'react'
import { useStore } from '../hooks/useStore'
import type { ShooterClass } from '../types/scoring'
import { Plus, Trash2, ChevronRight, Trophy } from 'lucide-react'

const DIVISIONS = ['Open', 'Limited', 'Limited 10', 'Production', 'Single Stack', 'Revolver', 'PCC', 'Carry Optics', 'Classic']
const CLASSES: ShooterClass[] = ['GM', 'M', 'A', 'B', 'C', 'D', 'U']

export function CompetitionList() {
  const { competitions, createCompetition, deleteCompetition, setActiveCompetition } = useStore()
  const [showNew, setShowNew] = useState(false)
  const [name, setName] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [division, setDivision] = useState('Production')
  const [shooterClass, setShooterClass] = useState<ShooterClass>('B')

  function handleCreate() {
    if (!name.trim()) return
    createCompetition(name.trim(), date, division, shooterClass)
    setName('')
    setShowNew(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-medium">Competitions</h2>
          <p className="text-xs text-zinc-500 mt-0.5">Plan matches, track stages, get AI coaching</p>
        </div>
        <button
          onClick={() => setShowNew(!showNew)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded text-xs font-medium transition-colors"
        >
          <Plus className="w-3 h-3" />
          New Competition
        </button>
      </div>

      {showNew && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-3">
          <div>
            <label className="text-xs text-zinc-500 block mb-1">Match Name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. March USPSA Match"
              className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-zinc-500"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-zinc-500 block mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-zinc-500"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-500 block mb-1">Division</label>
              <select
                value={division}
                onChange={e => setDivision(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-zinc-500"
              >
                {DIVISIONS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-zinc-500 block mb-1">Your Class</label>
              <select
                value={shooterClass}
                onChange={e => setShooterClass(e.target.value as ShooterClass)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-zinc-500"
              >
                {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <button onClick={handleCreate} className="w-full py-2 bg-red-600 hover:bg-red-700 rounded text-sm font-medium transition-colors">
            Create Competition
          </button>
        </div>
      )}

      {competitions.length > 0 ? (
        <div className="space-y-2">
          {competitions.map(comp => {
            const completed = comp.stages.filter(s => s.completed).length
            const total = comp.stages.length
            return (
              <div
                key={comp.id}
                className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 flex items-center justify-between cursor-pointer hover:border-zinc-700 transition-colors"
                onClick={() => setActiveCompetition(comp.id)}
              >
                <div>
                  <div className="text-sm font-medium flex items-center gap-2">
                    <Trophy className="w-3.5 h-3.5 text-yellow-500" />
                    {comp.name}
                  </div>
                  <div className="text-xs text-zinc-500 mt-0.5 flex items-center gap-3">
                    <span>{comp.date}</span>
                    <span>{comp.shooterDivision} / {comp.shooterClass}</span>
                    <span>{total} stages{total > 0 ? ` (${completed}/${total} done)` : ''}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteCompetition(comp.id) }}
                    className="p-1.5 hover:bg-zinc-800 rounded text-zinc-500 hover:text-red-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <ChevronRight className="w-4 h-4 text-zinc-600" />
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        !showNew && (
          <div className="text-center py-8 text-zinc-600 text-sm">
            No competitions yet. Create one to start planning your match.
          </div>
        )
      )}
    </div>
  )
}
