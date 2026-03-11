import { useState } from 'react'
import { useStore } from './hooks/useStore'
import { StageForm } from './components/StageForm'
import { StageCard } from './components/StageCard'
import { MatchSummary } from './components/MatchSummary'
import { MatchCharts } from './components/MatchCharts'
import { AIPanel } from './components/AIPanel'
import { Settings } from './components/Settings'
import { Terms } from './components/Terms'
import { QuickCheck } from './components/QuickCheck'
import { CompetitionList } from './components/CompetitionList'
import { CompetitionView } from './components/CompetitionView'
import { PSCImport } from './components/PSCImport'
import { DrillLibrary } from './components/DrillLibrary'
import { MatchHistory } from './components/MatchHistory'
import { exportMatchCSV, downloadCSV } from './lib/export'
import { Crosshair, Settings as SettingsIcon, Plus, Zap, ClipboardList, Trophy, Database, BookOpen, History, Download } from 'lucide-react'

type Tab = 'quick' | 'planner' | 'compete' | 'data' | 'drills' | 'history'

export default function App() {
  const { stages, competitions, activeCompetitionId } = useStore()
  const [tab, setTab] = useState<Tab>('quick')
  const [showForm, setShowForm] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showTerms, setShowTerms] = useState(false)

  if (showTerms) return <Terms onClose={() => setShowTerms(false)} />

  const activeCompetition = competitions.find(c => c.id === activeCompetitionId)

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

        <div className="max-w-4xl mx-auto px-4 flex gap-0.5 overflow-x-auto scrollbar-hide">
          <TabButton active={tab === 'quick'} onClick={() => setTab('quick')} icon={<Zap className="w-3.5 h-3.5" />} label="Quick Check" />
          <TabButton active={tab === 'planner'} onClick={() => setTab('planner')} icon={<ClipboardList className="w-3.5 h-3.5" />} label="Planner" badge={stages.length > 0 ? stages.length : undefined} />
          <TabButton active={tab === 'compete'} onClick={() => setTab('compete')} icon={<Trophy className="w-3.5 h-3.5" />} label="Competition" badge={competitions.length > 0 ? competitions.length : undefined} />
          <TabButton active={tab === 'history'} onClick={() => setTab('history')} icon={<History className="w-3.5 h-3.5" />} label="History" />
          <TabButton active={tab === 'drills'} onClick={() => setTab('drills')} icon={<BookOpen className="w-3.5 h-3.5" />} label="Drills" />
          <TabButton active={tab === 'data'} onClick={() => setTab('data')} icon={<Database className="w-3.5 h-3.5" />} label="Data" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {showSettings && <Settings onClose={() => setShowSettings(false)} />}

        {tab === 'quick' && <QuickCheck />}

        {tab === 'planner' && (
          <>
            {stages.length > 0 && <MatchSummary />}
            {stages.length > 0 && <MatchCharts stages={stages} />}

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

            {stages.length > 0 && (
              <button
                onClick={() => downloadCSV(exportMatchCSV(stages), `match-${new Date().toISOString().split('T')[0]}.csv`)}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm text-zinc-300 transition-colors"
              >
                <Download className="w-4 h-4" />
                Export to CSV
              </button>
            )}
          </>
        )}

        {tab === 'compete' && (
          activeCompetition
            ? <CompetitionView competition={activeCompetition} />
            : <CompetitionList />
        )}

        {tab === 'history' && <MatchHistory />}

        {tab === 'drills' && <DrillLibrary />}

        {tab === 'data' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-sm font-medium mb-1">Match Data</h2>
              <p className="text-xs text-zinc-500">Import PractiScore match files to build benchmark data and import stages into competitions.</p>
            </div>
            <PSCImport />
          </div>
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

function TabButton({ active, onClick, icon, label, badge }: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
  badge?: number
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
        active
          ? 'border-red-500 text-zinc-100'
          : 'border-transparent text-zinc-500 hover:text-zinc-300'
      }`}
    >
      {icon}
      {label}
      {badge !== undefined && (
        <span className="ml-1 px-1.5 py-0.5 bg-zinc-800 rounded text-[10px] text-zinc-400">{badge}</span>
      )}
    </button>
  )
}
