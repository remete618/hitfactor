export type ScoringMethod = 'comstock' | 'virginia' | 'fixed_time'
export type PowerFactor = 'major' | 'minor'
export type HitZone = 'A' | 'C' | 'D' | 'M' | 'NS'
export type Organization = 'IPSC' | 'USPSA'
export type ShooterClass = 'GM' | 'M' | 'A' | 'B' | 'C' | 'D' | 'U'

export interface StageHits {
  A: number
  C: number
  D: number
  M: number
  NS: number
}

export interface StageInput {
  id: string
  name: string
  hits: StageHits
  time: number
  maxPoints: number
  roundCount: number
  scoringMethod: ScoringMethod
  powerFactor: PowerFactor
  organization: Organization
  procedurals: number
}

export interface StageResult {
  rawPoints: number
  penalties: number
  totalPoints: number
  hitFactor: number
  maxPoints: number
  percentOfMax: number
}

export interface WhatIfScenario {
  label: string
  hits: StageHits
  time: number
  result: StageResult
}

export interface BreakEvenAnalysis {
  currentHF: number
  dropOneAToC_HF: number
  dropOneAToC_timeSaved: number
  dropOneAToD_HF: number
  dropOneAToD_timeSaved: number
  breakEvenTimePerAToC: number
  breakEvenTimePerAToD: number
  recommendation: string
}

export interface MatchStage {
  input: StageInput
  result: StageResult
  breakEven: BreakEvenAnalysis
}

export type LLMProvider = 'claude' | 'openai' | 'gemini'

export interface LLMConfig {
  provider: LLMProvider
  apiKey: string
  model: string
}

// --- PractiScore Import ---

export interface PSCShooter {
  id: string
  name: string
  memberNumber?: string
  division: string
  classification: ShooterClass
  powerFactor: PowerFactor
}

export interface PSCStageScore {
  shooterId: string
  stageId: string
  time: number
  hits: StageHits
  hitFactor: number
  points: number
  procedurals: number
}

export interface PSCStage {
  id: string
  name: string
  roundCount: number
  paperTargets: number
  steelTargets: number
  noShoots: number
  maxPoints: number
  scoringMethod: ScoringMethod
  classifier?: string
  strings?: number
}

export interface PSCMatch {
  id: string
  name: string
  date: string
  club?: string
  stages: PSCStage[]
  shooters: PSCShooter[]
  scores: PSCStageScore[]
}

// --- Competition Planning ---

export interface ReferenceScore {
  id: string
  shooterName?: string
  classification: ShooterClass
  time: number
  hits: StageHits
  hitFactor: number
  points: number
}

export interface StageBenchmark {
  avgHF: Partial<Record<ShooterClass, number>>
  topHF: number
  avgAccuracy: Partial<Record<ShooterClass, number>>
  sampleSize: number
}

export interface CompetitionStage {
  id: string
  stageInfo: PSCStage
  aiAdvice?: string
  benchmarks?: StageBenchmark
  referenceScores: ReferenceScore[]
  result?: StageInput
  completed: boolean
  order: number
}

export interface Competition {
  id: string
  name: string
  date: string
  stages: CompetitionStage[]
  startStageIndex: number
  shooterDivision: string
  shooterClass: ShooterClass
  notes?: string
}
