import type { MatchStage, Competition, CompetitionStage } from '../types/scoring'
import { calculateStageResult } from './scoring'

export function exportMatchCSV(stages: MatchStage[]): string {
  const headers = ['Stage', 'A', 'C', 'D', 'M', 'NS', 'Time', 'Points', 'Max Points', 'Hit Factor', 'Accuracy %', 'Penalties', 'Power Factor', 'Scoring']
  const rows = stages.map(s => [
    s.input.name,
    s.input.hits.A, s.input.hits.C, s.input.hits.D, s.input.hits.M, s.input.hits.NS,
    s.input.time.toFixed(2),
    s.result.totalPoints, s.result.maxPoints,
    s.result.hitFactor.toFixed(4),
    s.result.percentOfMax.toFixed(1),
    s.result.penalties,
    s.input.powerFactor,
    s.input.scoringMethod,
  ])

  const totals = [
    'TOTAL', '', '', '', '', '',
    stages.reduce((s, st) => s + st.input.time, 0).toFixed(2),
    stages.reduce((s, st) => s + st.result.totalPoints, 0),
    stages.reduce((s, st) => s + st.result.maxPoints, 0),
    (stages.reduce((s, st) => s + st.result.hitFactor, 0) / stages.length).toFixed(4),
    '', '', '', '',
  ]

  return [headers, ...rows, totals].map(r => r.join(',')).join('\n')
}

export function exportCompetitionCSV(comp: Competition): string {
  const headers = ['#', 'Stage', 'Status', 'A', 'C', 'D', 'M', 'NS', 'Time', 'Points', 'Max Points', 'Hit Factor', 'Accuracy %']
  const rows = comp.stages
    .sort((a, b) => a.order - b.order)
    .map((s, i) => {
      if (!s.completed || !s.result) {
        return [i + 1, s.stageInfo.name, 'Pending', '', '', '', '', '', '', '', s.stageInfo.maxPoints, '', '']
      }
      const res = calculateStageResult(s.result)
      return [
        i + 1, s.stageInfo.name, 'Done',
        s.result.hits.A, s.result.hits.C, s.result.hits.D, s.result.hits.M, s.result.hits.NS,
        s.result.time.toFixed(2),
        res.totalPoints, res.maxPoints,
        res.hitFactor.toFixed(4),
        res.percentOfMax.toFixed(1),
      ]
    })

  return [
    [`Match: ${comp.name}`],
    [`Date: ${comp.date}`],
    [`Division: ${comp.shooterDivision} / Class: ${comp.shooterClass}`],
    [],
    headers,
    ...rows,
  ].map(r => r.join(',')).join('\n')
}

export function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
