import { describe, it, expect } from 'vitest'
import { computeStageBenchmarks, findSimilarBenchmarks } from '../lib/benchmarks'
import type { PSCMatch, PSCStage } from '../types/scoring'

function makeMatch(stages: PSCStage[], shooterCount: number = 5): PSCMatch {
  const shooters = Array.from({ length: shooterCount }, (_, i) => ({
    id: `sh-${i}`,
    name: `Shooter ${i}`,
    division: 'Production',
    classification: (['GM', 'M', 'A', 'B', 'C'] as const)[i % 5],
    powerFactor: 'minor' as const,
  }))

  const scores = stages.flatMap(stage =>
    shooters.map((sh, i) => ({
      shooterId: sh.id,
      stageId: stage.id,
      time: 8 + i * 2,
      hits: { A: 10 - i, C: i, D: 0, M: 0, NS: 0 },
      hitFactor: Math.round(((10 - i) * 5 + i * 3) / (8 + i * 2) * 10000) / 10000,
      points: (10 - i) * 5 + i * 3,
      procedurals: 0,
    }))
  )

  return {
    id: 'match-1', name: 'Test Match', date: '2026-01-01',
    stages, shooters, scores,
  }
}

describe('computeStageBenchmarks', () => {
  it('computes average HF per classification', () => {
    const stage: PSCStage = { id: 's1', name: 'Stage 1', roundCount: 10, paperTargets: 5, steelTargets: 0, noShoots: 0, maxPoints: 50, scoringMethod: 'comstock' }
    const match = makeMatch([stage])
    const benchmarks = computeStageBenchmarks(stage, match)

    expect(benchmarks.sampleSize).toBe(5)
    expect(benchmarks.topHF).toBeGreaterThan(0)
    expect(benchmarks.avgHF.GM).toBeDefined()
    expect(benchmarks.avgHF.GM).toBeGreaterThan(0)
  })

  it('computes accuracy per classification', () => {
    const stage: PSCStage = { id: 's1', name: 'Stage 1', roundCount: 10, paperTargets: 5, steelTargets: 0, noShoots: 0, maxPoints: 50, scoringMethod: 'comstock' }
    const match = makeMatch([stage])
    const benchmarks = computeStageBenchmarks(stage, match)

    expect(benchmarks.avgAccuracy.GM).toBeDefined()
    expect(benchmarks.avgAccuracy.GM).toBeGreaterThan(0)
    expect(benchmarks.avgAccuracy.GM).toBeLessThanOrEqual(100)
  })

  it('handles empty scores', () => {
    const stage: PSCStage = { id: 'empty', name: 'Empty', roundCount: 10, paperTargets: 5, steelTargets: 0, noShoots: 0, maxPoints: 50, scoringMethod: 'comstock' }
    const match = makeMatch([])
    const benchmarks = computeStageBenchmarks(stage, match)

    expect(benchmarks.sampleSize).toBe(0)
    expect(benchmarks.topHF).toBe(0)
  })
})

describe('findSimilarBenchmarks', () => {
  it('finds benchmarks from similar stages', () => {
    const stage: PSCStage = { id: 's1', name: 'Stage 1', roundCount: 12, paperTargets: 6, steelTargets: 0, noShoots: 0, maxPoints: 60, scoringMethod: 'comstock' }
    const match = makeMatch([stage])

    const benchmarks = findSimilarBenchmarks(12, 0, 'comstock', [match])
    expect(benchmarks.sampleSize).toBeGreaterThan(0)
    expect(benchmarks.topHF).toBeGreaterThan(0)
  })

  it('excludes stages with different scoring method', () => {
    const stage: PSCStage = { id: 's1', name: 'Stage 1', roundCount: 12, paperTargets: 6, steelTargets: 0, noShoots: 0, maxPoints: 60, scoringMethod: 'virginia' }
    const match = makeMatch([stage])

    const benchmarks = findSimilarBenchmarks(12, 0, 'comstock', [match])
    expect(benchmarks.sampleSize).toBe(0)
  })

  it('excludes stages with very different round count', () => {
    const stage: PSCStage = { id: 's1', name: 'Stage 1', roundCount: 32, paperTargets: 16, steelTargets: 0, noShoots: 0, maxPoints: 160, scoringMethod: 'comstock' }
    const match = makeMatch([stage])

    const benchmarks = findSimilarBenchmarks(12, 0, 'comstock', [match])
    expect(benchmarks.sampleSize).toBe(0) // 32 vs 12 is more than 4 apart
  })

  it('returns empty for no matches', () => {
    const benchmarks = findSimilarBenchmarks(12, 0, 'comstock', [])
    expect(benchmarks.sampleSize).toBe(0)
    expect(benchmarks.topHF).toBe(0)
  })
})
