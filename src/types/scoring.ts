export type ScoringMethod = 'comstock' | 'virginia' | 'fixed_time'
export type PowerFactor = 'major' | 'minor'
export type HitZone = 'A' | 'C' | 'D' | 'M' | 'NS'
export type Organization = 'IPSC' | 'USPSA'

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
