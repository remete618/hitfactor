import { describe, it, expect } from 'vitest'
import { parseVoiceInput } from '../lib/voice'

describe('parseVoiceInput', () => {
  it('parses full hit count sentence', () => {
    const result = parseVoiceInput('12 alphas 4 charlies 2 deltas 0 mikes 8.43 seconds')
    expect(result.hits.A).toBe(12)
    expect(result.hits.C).toBe(4)
    expect(result.hits.D).toBe(2)
    expect(result.hits.M).toBe(0)
    expect(result.time).toBeCloseTo(8.43)
  })

  it('parses abbreviated zone names', () => {
    const result = parseVoiceInput('10 alphas 3 charlies 1 delta')
    expect(result.hits.A).toBe(10)
    expect(result.hits.C).toBe(3)
    expect(result.hits.D).toBe(1)
  })

  it('parses time with "s" suffix', () => {
    const result = parseVoiceInput('5.67s')
    expect(result.time).toBeCloseTo(5.67)
  })

  it('parses time with "seconds"', () => {
    const result = parseVoiceInput('time is 12.5 seconds')
    expect(result.time).toBeCloseTo(12.5)
  })

  it('parses no-shoots', () => {
    const result = parseVoiceInput('1 no shoot')
    expect(result.hits.NS).toBe(1)
  })

  it('returns empty for unrecognized input', () => {
    const result = parseVoiceInput('hello world')
    expect(Object.keys(result.hits)).toHaveLength(0)
    expect(result.time).toBeUndefined()
  })

  it('handles mixed case', () => {
    const result = parseVoiceInput('8 Alphas 2 Charlies')
    expect(result.hits.A).toBe(8)
    expect(result.hits.C).toBe(2)
  })

  it('parses mikes/misses', () => {
    const r1 = parseVoiceInput('3 mikes')
    expect(r1.hits.M).toBe(3)
    const r2 = parseVoiceInput('2 miss')
    expect(r2.hits.M).toBe(2)
  })
})
