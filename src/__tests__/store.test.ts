import { describe, it, expect, beforeEach } from 'vitest'
import { useStore, createDefaultStageInput } from '../hooks/useStore'
import type { PSCMatch } from '../types/scoring'

beforeEach(() => {
  localStorage.clear()
  useStore.setState({
    stages: [],
    competitions: [],
    activeCompetitionId: null,
    importedMatches: [],
    aiAnalysis: null,
    aiLoading: false,
    llmConfig: { provider: 'claude', apiKey: '', model: '' },
  })
})

describe('Stage management', () => {
  it('adds a stage and computes result', () => {
    const input = createDefaultStageInput('Test')
    input.hits = { A: 10, C: 2, D: 0, M: 0, NS: 0 }
    input.time = 8
    input.maxPoints = 60

    useStore.getState().addStage(input)
    const stages = useStore.getState().stages
    expect(stages).toHaveLength(1)
    expect(stages[0].input.name).toBe('Test')
    expect(stages[0].result.hitFactor).toBeGreaterThan(0)
    expect(stages[0].breakEven.breakEvenTimePerAToC).toBeGreaterThan(0)
  })

  it('updates a stage', () => {
    const input = createDefaultStageInput('Original')
    input.hits = { A: 10, C: 0, D: 0, M: 0, NS: 0 }
    input.time = 10
    input.maxPoints = 50

    useStore.getState().addStage(input)
    const id = useStore.getState().stages[0].input.id

    const updated = { ...input, name: 'Updated', time: 5 }
    useStore.getState().updateStage(id, updated)

    expect(useStore.getState().stages[0].input.name).toBe('Updated')
    expect(useStore.getState().stages[0].result.hitFactor).toBe(10) // 50/5
  })

  it('removes a stage', () => {
    const input = createDefaultStageInput('ToRemove')
    useStore.getState().addStage(input)
    const id = useStore.getState().stages[0].input.id

    useStore.getState().removeStage(id)
    expect(useStore.getState().stages).toHaveLength(0)
  })

  it('clears all stages', () => {
    useStore.getState().addStage(createDefaultStageInput('A'))
    useStore.getState().addStage(createDefaultStageInput('B'))
    expect(useStore.getState().stages).toHaveLength(2)

    useStore.getState().clearStages()
    expect(useStore.getState().stages).toHaveLength(0)
  })

  it('clears AI analysis when stages change', () => {
    useStore.setState({ aiAnalysis: 'old analysis' })
    useStore.getState().addStage(createDefaultStageInput('New'))
    expect(useStore.getState().aiAnalysis).toBeNull()
  })
})

describe('Competition management', () => {
  it('creates a competition', () => {
    const id = useStore.getState().createCompetition('March Match', '2026-03-15', 'Production', 'B')
    expect(id).toBeTruthy()

    const comps = useStore.getState().competitions
    expect(comps).toHaveLength(1)
    expect(comps[0].name).toBe('March Match')
    expect(comps[0].shooterDivision).toBe('Production')
    expect(comps[0].shooterClass).toBe('B')
    expect(useStore.getState().activeCompetitionId).toBe(id)
  })

  it('deletes a competition', () => {
    const id = useStore.getState().createCompetition('ToDelete', '2026-01-01', 'Open', 'A')
    useStore.getState().deleteCompetition(id)
    expect(useStore.getState().competitions).toHaveLength(0)
    expect(useStore.getState().activeCompetitionId).toBeNull()
  })

  it('adds stages to competition', () => {
    const compId = useStore.getState().createCompetition('Test', '2026-01-01', 'Open', 'A')
    useStore.getState().addCompetitionStage(compId, {
      id: 's1', name: 'Stage 1', roundCount: 12, paperTargets: 6,
      steelTargets: 0, noShoots: 0, maxPoints: 60, scoringMethod: 'comstock',
    })

    const comp = useStore.getState().competitions[0]
    expect(comp.stages).toHaveLength(1)
    expect(comp.stages[0].stageInfo.name).toBe('Stage 1')
    expect(comp.stages[0].completed).toBe(false)
    expect(comp.stages[0].order).toBe(0)
  })

  it('removes competition stage and reorders', () => {
    const compId = useStore.getState().createCompetition('Test', '2026-01-01', 'Open', 'A')
    useStore.getState().addCompetitionStage(compId, { id: 's1', name: 'S1', roundCount: 12, paperTargets: 6, steelTargets: 0, noShoots: 0, maxPoints: 60, scoringMethod: 'comstock' })
    useStore.getState().addCompetitionStage(compId, { id: 's2', name: 'S2', roundCount: 12, paperTargets: 6, steelTargets: 0, noShoots: 0, maxPoints: 60, scoringMethod: 'comstock' })

    const stageId = useStore.getState().competitions[0].stages[0].id
    useStore.getState().removeCompetitionStage(compId, stageId)

    const comp = useStore.getState().competitions[0]
    expect(comp.stages).toHaveLength(1)
    expect(comp.stages[0].order).toBe(0) // reindexed
  })

  it('sets stage result and marks completed', () => {
    const compId = useStore.getState().createCompetition('Test', '2026-01-01', 'Open', 'A')
    useStore.getState().addCompetitionStage(compId, { id: 's1', name: 'S1', roundCount: 12, paperTargets: 6, steelTargets: 0, noShoots: 0, maxPoints: 60, scoringMethod: 'comstock' })

    const stageId = useStore.getState().competitions[0].stages[0].id
    const result = createDefaultStageInput('Result')
    result.hits = { A: 12, C: 0, D: 0, M: 0, NS: 0 }
    result.time = 10

    useStore.getState().setStageResult(compId, stageId, result)

    const stage = useStore.getState().competitions[0].stages[0]
    expect(stage.completed).toBe(true)
    expect(stage.result).toBeDefined()
    expect(stage.result!.hits.A).toBe(12)
  })

  it('adds and removes reference scores', () => {
    const compId = useStore.getState().createCompetition('Test', '2026-01-01', 'Open', 'A')
    useStore.getState().addCompetitionStage(compId, { id: 's1', name: 'S1', roundCount: 12, paperTargets: 6, steelTargets: 0, noShoots: 0, maxPoints: 60, scoringMethod: 'comstock' })

    const stageId = useStore.getState().competitions[0].stages[0].id
    useStore.getState().addReferenceScore(compId, stageId, {
      id: 'ref-1', shooterName: 'Pro Shooter', classification: 'GM',
      time: 6, hits: { A: 12, C: 0, D: 0, M: 0, NS: 0 }, hitFactor: 10, points: 60,
    })

    expect(useStore.getState().competitions[0].stages[0].referenceScores).toHaveLength(1)

    useStore.getState().removeReferenceScore(compId, stageId, 'ref-1')
    expect(useStore.getState().competitions[0].stages[0].referenceScores).toHaveLength(0)
  })
})

describe('PractiScore import', () => {
  it('imports and removes a match', () => {
    const match: PSCMatch = {
      id: 'psc-1', name: 'Imported Match', date: '2026-01-01',
      stages: [{ id: 's1', name: 'S1', roundCount: 12, paperTargets: 6, steelTargets: 0, noShoots: 0, maxPoints: 60, scoringMethod: 'comstock' }],
      shooters: [{ id: 'sh1', name: 'Test', division: 'Open', classification: 'A', powerFactor: 'minor' }],
      scores: [],
    }

    useStore.getState().importPSCMatch(match)
    expect(useStore.getState().importedMatches).toHaveLength(1)

    useStore.getState().removeImportedMatch('psc-1')
    expect(useStore.getState().importedMatches).toHaveLength(0)
  })

  it('imports stages from match into competition', () => {
    const match: PSCMatch = {
      id: 'psc-1', name: 'Source Match', date: '2026-01-01',
      stages: [
        { id: 'ps1', name: 'PS Stage 1', roundCount: 12, paperTargets: 6, steelTargets: 0, noShoots: 0, maxPoints: 60, scoringMethod: 'comstock' },
        { id: 'ps2', name: 'PS Stage 2', roundCount: 24, paperTargets: 12, steelTargets: 0, noShoots: 0, maxPoints: 120, scoringMethod: 'comstock' },
      ],
      shooters: [],
      scores: [],
    }

    useStore.getState().importPSCMatch(match)
    const compId = useStore.getState().createCompetition('Target', '2026-01-01', 'Open', 'A')
    useStore.getState().importStagesFromMatch(compId, 'psc-1', ['ps1', 'ps2'])

    const comp = useStore.getState().competitions.find(c => c.id === compId)!
    expect(comp.stages).toHaveLength(2)
    expect(comp.stages[0].stageInfo.name).toBe('PS Stage 1')
    expect(comp.stages[1].stageInfo.name).toBe('PS Stage 2')
  })
})

describe('LLM config', () => {
  it('updates LLM config partially', () => {
    useStore.getState().setLLMConfig({ provider: 'openai' })
    expect(useStore.getState().llmConfig.provider).toBe('openai')
    expect(useStore.getState().llmConfig.apiKey).toBe('') // unchanged
  })
})
