import { useState } from 'react'
import { useStore } from './hooks/useStore'
import { StageForm } from './components/StageForm'
import { StageCard } from './components/StageCard'
import { MatchSummary } from './components/MatchSummary'
import { AIPanel } from './components/AIPanel'
import { Settings } from './components/Settings'
import { Terms } from './components/Terms'
import { QuickCheck } from './components/QuickCheck'
import { Crosshair, Settings as SettingsIcon, Plus, Zap, ClipboardList } from 'lucide-react'

type Tab = 'quick' | 'planner'

export default function App() {
  const { stages } = useStore()
  const [tab, setTab] = useState<Tab>('quick')
  const [showForm, setShowForm] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showTerms, setShowTerms] = useState(false)

  if (showTerms) return <Terms onClose={() => setShowTerms(false)} />

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crosshair className="w-5 h-5 text-red-500" />
            <h1 className="text-lg font-semibold tracking-tight">Hit Factor</h1>
            <span className="text-xs text-zinc-500 ml-1">IPSC / USPSA</span>
          </div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <SettingsIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="max-w-4xl mx-auto px-4 flex gap-1">
          <button
            onClick={() => setTab('quick')}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === 'quick'
                ? 'border-red-500 text-zinc-100'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            Quick Check
          </button>
          <button
            onClick={() => setTab('planner')}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === 'planner'
                ? 'border-red-500 text-zinc-100'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5" />
            Match Planner
            {stages.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-zinc-800 rounded text-xs text-zinc-400">{stages.length}</span>
            )}
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {showSettings && <Settings onClose={() => setShowSettings(false)} />}

        {tab === 'quick' && <QuickCheck />}

        {tab === 'planner' && (
          <>
            {stages.length > 0 && <MatchSummary />}

            {stages.map((stage) => (
              <StageCard
                key={stage.input.id}
                stage={stage}
                onEdit={() => { setEditingId(stage.input.id); setShowForm(true) }}
              />
            ))}

            {showForm && (
              <StageForm
                editId={editingId}
                onClose={() => { setShowForm(false); setEditingId(null) }}
              />
            )}

            {!showForm && (
              <button
                onClick={() => { setEditingId(null); setShowForm(true) }}
                className="w-full py-3 border border-dashed border-zinc-700 rounded-lg text-zinc-500 hover:text-zinc-300 hover:border-zinc-500 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Stage
              </button>
            )}

            {stages.length > 0 && <AIPanel />}
          </>
        )}
      </main>

      <footer className="border-t border-zinc-800 px-4 py-4 mt-12">
        <div className="max-w-4xl mx-auto text-center text-xs text-zinc-600 space-x-2">
          <span>&copy; 2025–2026 eyepaq.com. All rights reserved.</span>
          <span>&middot;</span>
          <button onClick={() => setShowTerms(true)} className="hover:text-zinc-400 underline">Terms &amp; Conditions</button>
        </div>
      </footer>
    </div>
  )
}
