import { describe, it, expect } from 'vitest'
import { parsePSCFromJSON } from '../lib/psc-parser'

describe('parsePSCFromJSON', () => {
  it('parses match with standard field names', () => {
    const data = {
      match_def: {
        match_name: 'Test USPSA Match',
        match_date: '2026-01-15',
        match_club: 'Test Club',
        match_stages: [
          {
            stage_uuid: 'stage-1',
            stage_name: 'Stage 1',
            stage_targets: 6,
            stage_poppers: 2,
            stage_noshoots: 1,
            stage_minrounds: 14,
            stage_maxpoints: 70,
            stage_scoring: 'Comstock',
          },
        ],
        match_shooters: [
          {
            sh_uuid: 'sh-1',
            sh_fn: 'John',
            sh_ln: 'Doe',
            sh_id: 'A12345',
            sh_dvp: 'Open',
            sh_grd: 'M',
            sh_pf: 'Major',
          },
        ],
      },
      match_scores: [
        {
          sh_uuid: 'sh-1',
          stage_scores: [
            {
              stage_uuid: 'stage-1',
              ts_a: 12,
              ts_c: 1,
              ts_d: 1,
              ts_m: 0,
              ts_ns: 0,
              str: 8.5,
              proc: 0,
            },
          ],
        },
      ],
    }

    const match = parsePSCFromJSON(JSON.stringify(data))

    expect(match.name).toBe('Test USPSA Match')
    expect(match.date).toBe('2026-01-15')
    expect(match.club).toBe('Test Club')
    expect(match.stages).toHaveLength(1)
    expect(match.stages[0].name).toBe('Stage 1')
    expect(match.stages[0].paperTargets).toBe(6)
    expect(match.stages[0].steelTargets).toBe(2)
    expect(match.stages[0].noShoots).toBe(1)
    expect(match.stages[0].maxPoints).toBe(70)
    expect(match.stages[0].scoringMethod).toBe('comstock')

    expect(match.shooters).toHaveLength(1)
    expect(match.shooters[0].name).toBe('John Doe')
    expect(match.shooters[0].classification).toBe('M')
    expect(match.shooters[0].powerFactor).toBe('major')

    expect(match.scores).toHaveLength(1)
    expect(match.scores[0].hits.A).toBe(12)
    expect(match.scores[0].hits.C).toBe(1)
    expect(match.scores[0].time).toBe(8.5)
  })

  it('parses alternative field name format', () => {
    const data = {
      match_def: {
        name: 'Alt Match',
        date: '2026-02-01',
        stages: [
          { id: 's1', name: 'S1', targets: 4, poppers: 0, noShoots: 0, minRounds: 8, maxPoints: 40, scoring: 'virginia' },
        ],
        shooters: [
          { id: 'sh1', firstName: 'Jane', lastName: 'Smith', division: 'Production', classification: 'A', powerFactor: 'minor' },
        ],
      },
      match_scores: [],
    }

    const match = parsePSCFromJSON(JSON.stringify(data))
    expect(match.name).toBe('Alt Match')
    expect(match.stages[0].scoringMethod).toBe('virginia')
    expect(match.shooters[0].name).toBe('Jane Smith')
    expect(match.shooters[0].classification).toBe('A')
  })

  it('handles classification parsing edge cases', () => {
    const data = {
      match_def: {
        match_name: 'Class Test',
        match_stages: [],
        match_shooters: [
          { sh_uuid: '1', sh_fn: 'A', sh_ln: 'B', sh_grd: 'GM' },
          { sh_uuid: '2', sh_fn: 'C', sh_ln: 'D', sh_grd: 'G' },
          { sh_uuid: '3', sh_fn: 'E', sh_ln: 'F', sh_grd: '' },
          { sh_uuid: '4', sh_fn: 'G', sh_ln: 'H', sh_grd: 'X' },
        ],
      },
      match_scores: [],
    }

    const match = parsePSCFromJSON(JSON.stringify(data))
    expect(match.shooters[0].classification).toBe('GM')
    expect(match.shooters[1].classification).toBe('GM') // 'G' maps to GM
    expect(match.shooters[2].classification).toBe('U')  // empty
    expect(match.shooters[3].classification).toBe('U')  // unknown
  })

  it('handles steel hits in score data', () => {
    const data = {
      match_def: {
        match_name: 'Steel Test',
        match_stages: [{ stage_uuid: 's1', stage_name: 'Steel', stage_targets: 0, stage_poppers: 4, stage_minrounds: 4, stage_maxpoints: 20, stage_scoring: 'Comstock' }],
        match_shooters: [{ sh_uuid: 'sh1', sh_fn: 'A', sh_ln: 'B', sh_grd: 'A' }],
      },
      match_scores: [
        {
          sh_uuid: 'sh1',
          stage_scores: [
            { stage_uuid: 's1', ts_a: 0, ts_c: 0, ts_d: 0, ts_m: 0, ts_ns: 0, popper: 4, popper_m: 0, str: 3.5 },
          ],
        },
      ],
    }

    const match = parsePSCFromJSON(JSON.stringify(data))
    expect(match.scores[0].hits.A).toBe(4) // steel hits count as A
    expect(match.scores[0].time).toBe(3.5)
  })

  it('handles missing match_scores gracefully', () => {
    const data = {
      match_def: {
        match_name: 'No Scores',
        match_stages: [],
        match_shooters: [],
      },
    }

    const match = parsePSCFromJSON(JSON.stringify(data))
    expect(match.scores).toHaveLength(0)
  })
})
