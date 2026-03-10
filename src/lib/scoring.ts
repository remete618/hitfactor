import type { StageInput, StageResult, StageHits, BreakEvenAnalysis, PowerFactor } from '../types/scoring'

function getPointValues(pf: PowerFactor): Record<string, number> {
  if (pf === 'major') {
    return { A: 5, C: 4, D: 2, M: 0, NS: 0 }
  }
  return { A: 5, C: 3, D: 1, M: 0, NS: 0 }
}

export function calculateRawPoints(hits: StageHits, pf: PowerFactor): number {
  const pts = getPointValues(pf)
  return hits.A * pts.A + hits.C * pts.C + hits.D * pts.D
}

export function calculatePenalties(hits: StageHits, procedurals: number): number {
  return (hits.M * 10) + (hits.NS * 10) + (procedurals * 10)
}

export function calculateStageResult(input: StageInput): StageResult {
  const rawPoints = calculateRawPoints(input.hits, input.powerFactor)
  const penalties = calculatePenalties(input.hits, input.procedurals)
  const totalPoints = Math.max(0, rawPoints - penalties)

  let hitFactor: number
  if (input.scoringMethod === 'fixed_time') {
    hitFactor = totalPoints
  } else {
    hitFactor = input.time > 0 ? totalPoints / input.time : 0
  }

  const maxPoints = input.maxPoints
  const percentOfMax = maxPoints > 0 ? (totalPoints / maxPoints) * 100 : 0

  return {
    rawPoints,
    penalties,
    totalPoints,
    hitFactor: Math.round(hitFactor * 10000) / 10000,
    maxPoints,
    percentOfMax: Math.round(percentOfMax * 100) / 100,
  }
}

export function calculateMaxPoints(roundCount: number, steelCount: number = 0): number {
  const paperTargets = Math.floor((roundCount - steelCount) / 2)
  return (paperTargets * 2 * 5) + (steelCount * 5)
}

export function calculateBreakEven(input: StageInput): BreakEvenAnalysis {
  const current = calculateStageResult(input)
  const pf = input.powerFactor

  const cPenalty = pf === 'major' ? 1 : 2
  const dPenalty = pf === 'major' ? 3 : 4

  // Drop one A to C: lose cPenalty points, need to save time to maintain HF
  const pointsLostAToC = cPenalty
  const pointsLostAToD = dPenalty

  // At current HF, how much time does each point cost?
  // HF = points / time → time = points / HF
  const breakEvenTimePerAToC = current.hitFactor > 0
    ? pointsLostAToC / current.hitFactor
    : 0
  const breakEvenTimePerAToD = current.hitFactor > 0
    ? pointsLostAToD / current.hitFactor
    : 0

  // What-if: drop one A to C
  const hitsDropC: StageHits = { ...input.hits, A: input.hits.A - 1, C: input.hits.C + 1 }
  const dropCInput = { ...input, hits: hitsDropC }
  const dropCResult = calculateStageResult(dropCInput)

  // What-if: drop one A to D
  const hitsDropD: StageHits = { ...input.hits, A: input.hits.A - 1, D: input.hits.D + 1 }
  const dropDInput = { ...input, hits: hitsDropD }
  const dropDResult = calculateStageResult(dropDInput)

  // Time you'd need to save to make the drop worthwhile
  const timeSavedForC = breakEvenTimePerAToC
  const timeSavedForD = breakEvenTimePerAToD

  let recommendation: string
  if (breakEvenTimePerAToC < 0.15) {
    recommendation = 'Push speed hard. Dropping to C-zone costs almost nothing at this hit factor. Focus on transitions and movement.'
  } else if (breakEvenTimePerAToC < 0.3) {
    recommendation = 'Moderate speed push. Accept C-zone hits on distant or awkward targets where the time savings exceed ' + breakEvenTimePerAToC.toFixed(2) + 's per hit.'
  } else {
    recommendation = 'Accuracy matters. At this hit factor, each A→C drop costs ' + breakEvenTimePerAToC.toFixed(2) + 's equivalent. Slow down and aim.'
  }

  return {
    currentHF: current.hitFactor,
    dropOneAToC_HF: dropCResult.hitFactor,
    dropOneAToC_timeSaved: Math.round(timeSavedForC * 1000) / 1000,
    dropOneAToD_HF: dropDResult.hitFactor,
    dropOneAToD_timeSaved: Math.round(timeSavedForD * 1000) / 1000,
    breakEvenTimePerAToC: Math.round(breakEvenTimePerAToC * 1000) / 1000,
    breakEvenTimePerAToD: Math.round(breakEvenTimePerAToD * 1000) / 1000,
    recommendation,
  }
}

export function calculateStagePoints(
  yourHF: number,
  winnerHF: number,
  maxStagePoints: number,
): number {
  if (winnerHF <= 0) return 0
  return Math.round((yourHF / winnerHF) * maxStagePoints * 10000) / 10000
}

export function createEmptyHits(): StageHits {
  return { A: 0, C: 0, D: 0, M: 0, NS: 0 }
}
