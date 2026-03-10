import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { MatchStage, StageInput, LLMConfig, PowerFactor, Organization, ScoringMethod, Competition, CompetitionStage, PSCMatch, PSCStage, ReferenceScore, ShooterClass } from '../types/scoring'
import { calculateStageResult, calculateBreakEven, createEmptyHits, calculateMaxPoints } from '../lib/scoring'
import { computeStageBenchmarks } from '../lib/benchmarks'

interface AppState {
  // Quick check + legacy match planner
  stages: MatchStage[]
  llmConfig: LLMConfig
  aiAnalysis: string | null
  aiLoading: boolean

  // Competition mode
  competitions: Competition[]
  activeCompetitionId: string | null
  importedMatches: PSCMatch[]

  // Quick check actions
  addStage: (input: StageInput) => void
  updateStage: (id: string, input: StageInput) => void
  removeStage: (id: string) => void
  clearStages: () => void
  setLLMConfig: (config: Partial<LLMConfig>) => void
  setAIAnalysis: (text: string | null) => void
  setAILoading: (loading: boolean) => void

  // Competition actions
  createCompetition: (name: string, date: string, division: string, shooterClass: ShooterClass) => string
  deleteCompetition: (id: string) => void
  setActiveCompetition: (id: string | null) => void
  updateCompetition: (id: string, updates: Partial<Competition>) => void

  // Competition stage actions
  addCompetitionStage: (compId: string, stageInfo: PSCStage) => void
  removeCompetitionStage: (compId: string, stageId: string) => void
  updateCompetitionStage: (compId: string, stageId: string, updates: Partial<CompetitionStage>) => void
  setStageResult: (compId: string, stageId: string, result: StageInput) => void
  setStageAdvice: (compId: string, stageId: string, advice: string) => void
  addReferenceScore: (compId: string, stageId: string, ref: ReferenceScore) => void
  removeReferenceScore: (compId: string, stageId: string, refId: string) => void
  reorderStages: (compId: string, stageIds: string[]) => void

  // Import actions
  importPSCMatch: (match: PSCMatch) => void
  removeImportedMatch: (id: string) => void
  importStagesFromMatch: (compId: string, matchId: string, stageIds: string[]) => void
}

function buildMatchStage(input: StageInput): MatchStage {
  return {
    input,
    result: calculateStageResult(input),
    breakEven: calculateBreakEven(input),
  }
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      stages: [],
      llmConfig: { provider: 'claude', apiKey: '', model: '' },
      aiAnalysis: null,
      aiLoading: false,
      competitions: [],
      activeCompetitionId: null,
      importedMatches: [],

      addStage: (input) => set((state) => ({
        stages: [...state.stages, buildMatchStage(input)],
        aiAnalysis: null,
      })),

      updateStage: (id, input) => set((state) => ({
        stages: state.stages.map((s) =>
          s.input.id === id ? buildMatchStage(input) : s
        ),
        aiAnalysis: null,
      })),

      removeStage: (id) => set((state) => ({
        stages: state.stages.filter((s) => s.input.id !== id),
        aiAnalysis: null,
      })),

      clearStages: () => set({ stages: [], aiAnalysis: null }),

      setLLMConfig: (config) => set((state) => ({
        llmConfig: { ...state.llmConfig, ...config },
      })),

      setAIAnalysis: (text) => set({ aiAnalysis: text }),
      setAILoading: (loading) => set({ aiLoading: loading }),

      // Competition actions
      createCompetition: (name, date, division, shooterClass) => {
        const id = crypto.randomUUID()
        set((state) => ({
          competitions: [...state.competitions, {
            id,
            name,
            date,
            stages: [],
            startStageIndex: 0,
            shooterDivision: division,
            shooterClass,
          }],
          activeCompetitionId: id,
        }))
        return id
      },

      deleteCompetition: (id) => set((state) => ({
        competitions: state.competitions.filter(c => c.id !== id),
        activeCompetitionId: state.activeCompetitionId === id ? null : state.activeCompetitionId,
      })),

      setActiveCompetition: (id) => set({ activeCompetitionId: id }),

      updateCompetition: (id, updates) => set((state) => ({
        competitions: state.competitions.map(c =>
          c.id === id ? { ...c, ...updates } : c
        ),
      })),

      addCompetitionStage: (compId, stageInfo) => set((state) => ({
        competitions: state.competitions.map(c => {
          if (c.id !== compId) return c
          const newStage: CompetitionStage = {
            id: crypto.randomUUID(),
            stageInfo,
            referenceScores: [],
            completed: false,
            order: c.stages.length,
          }
          return { ...c, stages: [...c.stages, newStage] }
        }),
      })),

      removeCompetitionStage: (compId, stageId) => set((state) => ({
        competitions: state.competitions.map(c => {
          if (c.id !== compId) return c
          const stages = c.stages.filter(s => s.id !== stageId).map((s, i) => ({ ...s, order: i }))
          return { ...c, stages }
        }),
      })),

      updateCompetitionStage: (compId, stageId, updates) => set((state) => ({
        competitions: state.competitions.map(c => {
          if (c.id !== compId) return c
          return { ...c, stages: c.stages.map(s => s.id === stageId ? { ...s, ...updates } : s) }
        }),
      })),

      setStageResult: (compId, stageId, result) => set((state) => ({
        competitions: state.competitions.map(c => {
          if (c.id !== compId) return c
          return { ...c, stages: c.stages.map(s =>
            s.id === stageId ? { ...s, result, completed: true } : s
          )}
        }),
      })),

      setStageAdvice: (compId, stageId, advice) => set((state) => ({
        competitions: state.competitions.map(c => {
          if (c.id !== compId) return c
          return { ...c, stages: c.stages.map(s =>
            s.id === stageId ? { ...s, aiAdvice: advice } : s
          )}
        }),
      })),

      addReferenceScore: (compId, stageId, ref) => set((state) => ({
        competitions: state.competitions.map(c => {
          if (c.id !== compId) return c
          return { ...c, stages: c.stages.map(s =>
            s.id === stageId ? { ...s, referenceScores: [...s.referenceScores, ref] } : s
          )}
        }),
      })),

      removeReferenceScore: (compId, stageId, refId) => set((state) => ({
        competitions: state.competitions.map(c => {
          if (c.id !== compId) return c
          return { ...c, stages: c.stages.map(s =>
            s.id === stageId ? { ...s, referenceScores: s.referenceScores.filter(r => r.id !== refId) } : s
          )}
        }),
      })),

      reorderStages: (compId, stageIds) => set((state) => ({
        competitions: state.competitions.map(c => {
          if (c.id !== compId) return c
          const reordered = stageIds.map((id, i) => {
            const stage = c.stages.find(s => s.id === id)!
            return { ...stage, order: i }
          })
          return { ...c, stages: reordered }
        }),
      })),

      // Import actions
      importPSCMatch: (match) => set((state) => ({
        importedMatches: [...state.importedMatches, match],
      })),

      removeImportedMatch: (id) => set((state) => ({
        importedMatches: state.importedMatches.filter(m => m.id !== id),
      })),

      importStagesFromMatch: (compId, matchId, stageIds) => {
        const state = get()
        const match = state.importedMatches.find(m => m.id === matchId)
        if (!match) return

        set((state) => ({
          competitions: state.competitions.map(c => {
            if (c.id !== compId) return c
            const newStages: CompetitionStage[] = stageIds.map((sid, i) => {
              const pscStage = match.stages.find(s => s.id === sid)!
              const benchmarks = computeStageBenchmarks(pscStage, match)
              return {
                id: crypto.randomUUID(),
                stageInfo: pscStage,
                benchmarks,
                referenceScores: [],
                completed: false,
                order: c.stages.length + i,
              }
            })
            return { ...c, stages: [...c.stages, ...newStages] }
          }),
        }))
      },
    }),
    {
      name: 'hitfactor-storage',
      partialize: (state) => ({
        stages: state.stages,
        llmConfig: { ...state.llmConfig, apiKey: '' },
        competitions: state.competitions,
        activeCompetitionId: state.activeCompetitionId,
        importedMatches: state.importedMatches,
      }),
    }
  )
)

export function createDefaultStageInput(name?: string): StageInput {
  return {
    id: crypto.randomUUID(),
    name: name || 'Stage ' + (useStore.getState().stages.length + 1),
    hits: createEmptyHits(),
    time: 0,
    maxPoints: 0,
    roundCount: 12,
    scoringMethod: 'comstock' as ScoringMethod,
    powerFactor: 'minor' as PowerFactor,
    organization: 'USPSA' as Organization,
    procedurals: 0,
  }
}
