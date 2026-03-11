import { describe, it, expect } from 'vitest'
import {
  calculateRawPoints,
  calculatePenalties,
  calculateStageResult,
  calculateBreakEven,
  calculateMaxPoints,
  calculateStagePoints,
  createEmptyHits,
} from '../lib/scoring'
import type { StageInput, StageHits } from '../types/scoring'

function makeInput(overrides: Partial<StageInput> = {}): StageInput {
  return {
    id: 'test',
    name: 'Test Stage',
    hits: { A: 10, C: 2, D: 0, M: 0, NS: 0 },
    time: 10,
    maxPoints: 60,
    roundCount: 12,
    scoringMethod: 'comstock',
    powerFactor: 'minor',
    organization: 'USPSA',
    procedurals: 0,
    ...overrides,
  }
}

describe('calculateRawPoints', () => {
  it('calculates minor power factor correctly', () => {
    const hits: StageHits = { A: 10, C: 2, D: 1, M: 0, NS: 0 }
    expect(calculateRawPoints(hits, 'minor')).toBe(10 * 5 + 2 * 3 + 1 * 1) // 57
  })

  it('calculates major power factor correctly', () => {
    const hits: StageHits = { A: 10, C: 2, D: 1, M: 0, NS: 0 }
    expect(calculateRawPoints(hits, 'major')).toBe(10 * 5 + 2 * 4 + 1 * 2) // 60
  })

  it('returns 0 for empty hits', () => {
    expect(calculateRawPoints(createEmptyHits(), 'minor')).toBe(0)
  })

  it('ignores misses and no-shoots in raw points', () => {
    const hits: StageHits = { A: 5, C: 0, D: 0, M: 3, NS: 2 }
    expect(calculateRawPoints(hits, 'minor')).toBe(25) // only A-zone counts
  })
})

describe('calculatePenalties', () => {
  it('calculates miss penalties at -10 each', () => {
    const hits: StageHits = { A: 10, C: 0, D: 0, M: 2, NS: 0 }
    expect(calculatePenalties(hits, 0)).toBe(20)
  })

  it('calculates no-shoot penalties at -10 each', () => {
    const hits: StageHits = { A: 10, C: 0, D: 0, M: 0, NS: 1 }
    expect(calculatePenalties(hits, 0)).toBe(10)
  })

  it('calculates procedural penalties at -10 each', () => {
    expect(calculatePenalties(createEmptyHits(), 3)).toBe(30)
  })

  it('combines all penalty types', () => {
    const hits: StageHits = { A: 5, C: 0, D: 0, M: 1, NS: 2 }
    expect(calculatePenalties(hits, 1)).toBe(10 + 20 + 10) // 1M + 2NS + 1P
  })
})

describe('calculateStageResult', () => {
  it('calculates hit factor = points / time', () => {
    const input = makeInput({ hits: { A: 12, C: 0, D: 0, M: 0, NS: 0 }, time: 10, maxPoints: 60 })
    const result = calculateStageResult(input)
    expect(result.hitFactor).toBe(6.0) // 60/10
    expect(result.totalPoints).toBe(60)
    expect(result.penalties).toBe(0)
  })

  it('subtracts penalties from points', () => {
    const input = makeInput({ hits: { A: 10, C: 0, D: 0, M: 2, NS: 0 }, time: 10, maxPoints: 60 })
    const result = calculateStageResult(input)
    expect(result.totalPoints).toBe(30) // 50 raw - 20 penalties
    expect(result.penalties).toBe(20)
    expect(result.hitFactor).toBe(3.0)
  })

  it('never returns negative points', () => {
    const input = makeInput({ hits: { A: 1, C: 0, D: 0, M: 5, NS: 5 }, time: 10 })
    const result = calculateStageResult(input)
    expect(result.totalPoints).toBe(0) // 5 raw - 100 penalties, clamped to 0
  })

  it('handles zero time gracefully', () => {
    const input = makeInput({ time: 0 })
    const result = calculateStageResult(input)
    expect(result.hitFactor).toBe(0)
  })

  it('calculates fixed time scoring (points only)', () => {
    const input = makeInput({ scoringMethod: 'fixed_time', hits: { A: 10, C: 0, D: 0, M: 0, NS: 0 }, time: 15 })
    const result = calculateStageResult(input)
    expect(result.hitFactor).toBe(50) // fixed time = just points
  })

  it('calculates accuracy percentage', () => {
    const input = makeInput({ hits: { A: 6, C: 0, D: 0, M: 0, NS: 0 }, maxPoints: 60, time: 5 })
    const result = calculateStageResult(input)
    expect(result.percentOfMax).toBe(50) // 30/60
  })
})

describe('calculateBreakEven', () => {
  it('calculates break-even time for A→C drop (minor)', () => {
    const input = makeInput({ hits: { A: 12, C: 0, D: 0, M: 0, NS: 0 }, time: 10, maxPoints: 60 })
    const be = calculateBreakEven(input)
    // HF = 6.0, A→C costs 2 pts at minor, break-even = 2/6 = 0.333s
    expect(be.breakEvenTimePerAToC).toBeCloseTo(0.333, 2)
  })

  it('calculates break-even time for A→D drop (minor)', () => {
    const input = makeInput({ hits: { A: 12, C: 0, D: 0, M: 0, NS: 0 }, time: 10, maxPoints: 60 })
    const be = calculateBreakEven(input)
    // A→D costs 4 pts at minor, break-even = 4/6 = 0.667s
    expect(be.breakEvenTimePerAToD).toBeCloseTo(0.667, 2)
  })

  it('calculates break-even for major PF', () => {
    const input = makeInput({
      hits: { A: 12, C: 0, D: 0, M: 0, NS: 0 },
      time: 10, maxPoints: 60, powerFactor: 'major',
    })
    const be = calculateBreakEven(input)
    // Major: A→C costs 1 pt, HF=6.0, break-even = 1/6 = 0.167s
    expect(be.breakEvenTimePerAToC).toBeCloseTo(0.167, 2)
  })

  it('returns recommendation for high HF', () => {
    const input = makeInput({ hits: { A: 12, C: 0, D: 0, M: 0, NS: 0 }, time: 6, maxPoints: 60 })
    const be = calculateBreakEven(input)
    // HF = 10, break-even A→C = 0.2s → push speed
    expect(be.recommendation).toContain('speed')
  })

  it('returns recommendation for low HF', () => {
    const input = makeInput({ hits: { A: 8, C: 2, D: 2, M: 0, NS: 0 }, time: 20, maxPoints: 60 })
    const be = calculateBreakEven(input)
    // Low HF → accuracy matters
    expect(be.recommendation).toContain('ccuracy')
  })

  it('handles zero HF gracefully', () => {
    const input = makeInput({ time: 0 })
    const be = calculateBreakEven(input)
    expect(be.breakEvenTimePerAToC).toBe(0)
    expect(be.breakEvenTimePerAToD).toBe(0)
  })
})

describe('calculateMaxPoints', () => {
  it('calculates paper + steel max points', () => {
    // 12 rounds, 2 steel → 5 paper targets (10 rounds / 2 per target) × 10pts + 2 × 5pts
    expect(calculateMaxPoints(12, 2)).toBe(5 * 10 + 2 * 5) // 60
  })

  it('handles all paper (no steel)', () => {
    expect(calculateMaxPoints(12, 0)).toBe(6 * 10) // 6 targets × 10pts
  })

  it('handles all steel', () => {
    expect(calculateMaxPoints(5, 5)).toBe(0 + 5 * 5) // 0 paper + 25 steel
  })

  it('handles zero rounds', () => {
    expect(calculateMaxPoints(0, 0)).toBe(0)
  })
})

describe('calculateStagePoints', () => {
  it('calculates stage points as percentage of winner', () => {
    expect(calculateStagePoints(5.0, 10.0, 100)).toBe(50) // 50% of winner
  })

  it('returns 0 when winner HF is 0', () => {
    expect(calculateStagePoints(5.0, 0, 100)).toBe(0)
  })

  it('returns max points when you ARE the winner', () => {
    expect(calculateStagePoints(8.0, 8.0, 100)).toBe(100)
  })
})

describe('createEmptyHits', () => {
  it('returns all zeros', () => {
    const hits = createEmptyHits()
    expect(hits).toEqual({ A: 0, C: 0, D: 0, M: 0, NS: 0 })
  })
})
