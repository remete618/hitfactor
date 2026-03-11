import { describe, it, expect } from 'vitest'
import { exportMatchCSV, exportCompetitionCSV } from '../lib/export'
import { calculateStageResult, calculateBreakEven } from '../lib/scoring'
import type { MatchStage, Competition, CompetitionStage } from '../types/scoring'

function makeMatchStage(name: string, a: number, c: number, time: number): MatchStage {
  const input = {
    id: crypto.randomUUID(),
    name,
    hits: { A: a, C: c, D: 0, M: 0, NS: 0 },
    time,
    maxPoints: (a + c) * 5,
    roundCount: a + c,
    scoringMethod: 'comstock' as const,
    powerFactor: 'minor' as const,
    organization: 'USPSA' as const,
    procedurals: 0,
  }
  return {
    input,
    result: calculateStageResult(input),
    breakEven: calculateBreakEven(input),
  }
}

describe('exportMatchCSV', () => {
  it('generates valid CSV with headers', () => {
    const stages = [makeMatchStage('Stage 1', 10, 2, 8)]
    const csv = exportMatchCSV(stages)
    const lines = csv.split('\n')
    expect(lines[0]).toContain('Stage')
    expect(lines[0]).toContain('Hit Factor')
    expect(lines[0]).toContain('Time')
  })

  it('includes stage data rows', () => {
    const stages = [
      makeMatchStage('Stage 1', 10, 2, 8),
      makeMatchStage('Stage 2', 8, 4, 12),
    ]
    const csv = exportMatchCSV(stages)
    const lines = csv.split('\n')
    expect(lines.length).toBe(4) // header + 2 stages + totals
    expect(lines[1]).toContain('Stage 1')
    expect(lines[2]).toContain('Stage 2')
  })

  it('includes totals row', () => {
    const stages = [makeMatchStage('S1', 10, 0, 5)]
    const csv = exportMatchCSV(stages)
    const lastLine = csv.split('\n').pop()!
    expect(lastLine).toContain('TOTAL')
  })
})

describe('exportCompetitionCSV', () => {
  it('includes competition metadata', () => {
    const comp: Competition = {
      id: '1', name: 'Test Match', date: '2026-03-10',
      stages: [], startStageIndex: 0,
      shooterDivision: 'Production', shooterClass: 'B',
    }
    const csv = exportCompetitionCSV(comp)
    expect(csv).toContain('Test Match')
    expect(csv).toContain('2026-03-10')
    expect(csv).toContain('Production')
  })

  it('marks pending stages', () => {
    const comp: Competition = {
      id: '1', name: 'Test', date: '2026-03-10',
      stages: [{
        id: 's1',
        stageInfo: { id: 's1', name: 'Stage 1', roundCount: 12, paperTargets: 6, steelTargets: 0, noShoots: 0, maxPoints: 60, scoringMethod: 'comstock' },
        referenceScores: [], completed: false, order: 0,
      }],
      startStageIndex: 0, shooterDivision: 'Open', shooterClass: 'A',
    }
    const csv = exportCompetitionCSV(comp)
    expect(csv).toContain('Pending')
  })
})
