import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { MatchStage, StageInput, LLMConfig, PowerFactor, Organization, ScoringMethod } from '../types/scoring'
import { calculateStageResult, calculateBreakEven, createEmptyHits, calculateMaxPoints } from '../lib/scoring'

interface AppState {
  stages: MatchStage[]
  llmConfig: LLMConfig
  aiAnalysis: string | null
  aiLoading: boolean

  addStage: (input: StageInput) => void
  updateStage: (id: string, input: StageInput) => void
  removeStage: (id: string) => void
  clearStages: () => void
  setLLMConfig: (config: Partial<LLMConfig>) => void
  setAIAnalysis: (text: string | null) => void
  setAILoading: (loading: boolean) => void
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
    (set) => ({
      stages: [],
      llmConfig: { provider: 'claude', apiKey: '', model: '' },
      aiAnalysis: null,
      aiLoading: false,

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
    }),
    {
      name: 'hitfactor-storage',
      partialize: (state) => ({
        stages: state.stages,
        llmConfig: { ...state.llmConfig, apiKey: '' },
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
