import type { PSCMatch, PSCStage, StageBenchmark, ShooterClass } from '../types/scoring'

export function computeStageBenchmarks(
  stage: PSCStage,
  match: PSCMatch,
): StageBenchmark {
  const stageScores = match.scores.filter(s => s.stageId === stage.id)

  const byClass: Record<string, { hfs: number[], accs: number[] }> = {}
  let topHF = 0

  for (const score of stageScores) {
    const shooter = match.shooters.find(sh => sh.id === score.shooterId)
    const cls = shooter?.classification || 'U'

    if (!byClass[cls]) byClass[cls] = { hfs: [], accs: [] }
    byClass[cls].hfs.push(score.hitFactor)

    const acc = stage.maxPoints > 0 ? (score.points / stage.maxPoints) * 100 : 0
    byClass[cls].accs.push(acc)

    if (score.hitFactor > topHF) topHF = score.hitFactor
  }

  const avgHF: Partial<Record<ShooterClass, number>> = {}
  const avgAccuracy: Partial<Record<ShooterClass, number>> = {}

  for (const [cls, data] of Object.entries(byClass)) {
    if (data.hfs.length > 0) {
      avgHF[cls as ShooterClass] = Math.round((data.hfs.reduce((a, b) => a + b, 0) / data.hfs.length) * 10000) / 10000
      avgAccuracy[cls as ShooterClass] = Math.round((data.accs.reduce((a, b) => a + b, 0) / data.accs.length) * 100) / 100
    }
  }

  return { avgHF, topHF, avgAccuracy, sampleSize: stageScores.length }
}

export function findSimilarBenchmarks(
  roundCount: number,
  steelTargets: number,
  scoringMethod: string,
  importedMatches: PSCMatch[],
): StageBenchmark {
  const allHFs: Partial<Record<ShooterClass, number[]>> = {}
  const allAccs: Partial<Record<ShooterClass, number[]>> = {}
  let topHF = 0
  let sampleSize = 0

  for (const match of importedMatches) {
    for (const stage of match.stages) {
      // Match similar stages: same scoring, similar round count (within 4), similar steel
      if (stage.scoringMethod !== scoringMethod) continue
      if (Math.abs(stage.roundCount - roundCount) > 4) continue
      if (Math.abs(stage.steelTargets - steelTargets) > 2) continue

      const benchmarks = computeStageBenchmarks(stage, match)
      sampleSize += benchmarks.sampleSize
      if (benchmarks.topHF > topHF) topHF = benchmarks.topHF

      for (const [cls, hf] of Object.entries(benchmarks.avgHF)) {
        const key = cls as ShooterClass
        if (!allHFs[key]) allHFs[key] = []
        allHFs[key]!.push(hf!)
      }
      for (const [cls, acc] of Object.entries(benchmarks.avgAccuracy)) {
        const key = cls as ShooterClass
        if (!allAccs[key]) allAccs[key] = []
        allAccs[key]!.push(acc!)
      }
    }
  }

  const avgHF: Partial<Record<ShooterClass, number>> = {}
  const avgAccuracy: Partial<Record<ShooterClass, number>> = {}

  for (const [cls, hfs] of Object.entries(allHFs)) {
    if (hfs && hfs.length > 0) {
      avgHF[cls as ShooterClass] = Math.round((hfs.reduce((a, b) => a + b, 0) / hfs.length) * 10000) / 10000
    }
  }
  for (const [cls, accs] of Object.entries(allAccs)) {
    if (accs && accs.length > 0) {
      avgAccuracy[cls as ShooterClass] = Math.round((accs.reduce((a, b) => a + b, 0) / accs.length) * 100) / 100
    }
  }

  return { avgHF, topHF, avgAccuracy, sampleSize }
}
