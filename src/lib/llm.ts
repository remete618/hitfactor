import type { LLMConfig, MatchStage, CompetitionStage, ReferenceScore, StageBenchmark, ShooterClass } from '../types/scoring'

function buildMatchPrompt(stages: MatchStage[]): string {
  const stagesSummary = stages.map((s, i) => {
    const inp = s.input
    const res = s.result
    const be = s.breakEven
    return `Stage ${i + 1}: "${inp.name}"
  Hits: ${inp.hits.A}A / ${inp.hits.C}C / ${inp.hits.D}D / ${inp.hits.M}M / ${inp.hits.NS}NS
  Time: ${inp.time}s | Power Factor: ${inp.powerFactor}
  Hit Factor: ${res.hitFactor} | Points: ${res.totalPoints}/${res.maxPoints} (${res.percentOfMax}%)
  Break-even A→C: ${be.breakEvenTimePerAToC}s | A→D: ${be.breakEvenTimePerAToD}s`
  }).join('\n\n')

  return `You are an IPSC/USPSA match analysis assistant. Analyze these stage results and provide tactical advice on the speed vs. accuracy trade-off for each stage and the overall match.

For each stage, tell the shooter:
- Whether they should push speed or focus on accuracy based on the break-even analysis
- Where the biggest point swings are (which stages matter most)
- Specific actionable advice (not generic)

Match data:
${stagesSummary}

Be concise and direct. Use shooting terminology. No filler.`
}

function formatBenchmarks(benchmarks?: StageBenchmark): string {
  if (!benchmarks || benchmarks.sampleSize === 0) return ''
  const lines: string[] = [`\n  Benchmark data (${benchmarks.sampleSize} shooters):`]
  lines.push(`  Top HF: ${benchmarks.topHF}`)
  for (const [cls, hf] of Object.entries(benchmarks.avgHF)) {
    const acc = benchmarks.avgAccuracy[cls as ShooterClass]
    lines.push(`  ${cls} class avg: HF ${hf}${acc ? `, ${acc}% accuracy` : ''}`)
  }
  return lines.join('\n')
}

function formatReferenceScores(refs: ReferenceScore[]): string {
  if (refs.length === 0) return ''
  const lines = ['\n  Reference scores from other shooters:']
  for (const r of refs) {
    lines.push(`  ${r.shooterName || 'Anonymous'} (${r.classification}): HF ${r.hitFactor}, ${r.time}s, ${r.hits.A}A/${r.hits.C}C/${r.hits.D}D/${r.hits.M}M, ${r.points}pts`)
  }
  return lines.join('\n')
}

export function buildStageAdvicePrompt(
  stage: CompetitionStage,
  shooterClass: ShooterClass,
  shooterDivision: string,
): string {
  const s = stage.stageInfo
  const benchmarkText = formatBenchmarks(stage.benchmarks)
  const refText = formatReferenceScores(stage.referenceScores)

  return `You are an IPSC/USPSA stage planning coach. A ${shooterClass}-class shooter in ${shooterDivision} division needs tactical advice for this stage.

Stage: "${s.name}"
- Scoring: ${s.scoringMethod}
- Rounds: ${s.roundCount} minimum
- Paper targets: ${s.paperTargets}
- Steel targets: ${s.steelTargets}
- No-shoots: ${s.noShoots}
- Max points: ${s.maxPoints}
${s.classifier ? `- Classifier: ${s.classifier}` : ''}
${benchmarkText}
${refText}

Based on the stage setup${benchmarkText ? ' and benchmark data' : ''}${refText ? ' and reference scores' : ''}, provide:

1. **Approach**: Should this shooter push speed, focus on accuracy, or balance? Be specific to their class level.
2. **Target priority**: Which targets are worth slowing down for (no-shoots nearby, long shots) vs which to blast through.
3. **Time budget**: Estimate a realistic time and HF target for a ${shooterClass}-class shooter.
4. **Risk assessment**: What are the costly mistakes to avoid on this stage (procedurals, no-shoot penalties, mikes).
${refText ? '5. **Comparison**: Based on the reference scores, what separates the faster/better shooters from the slower ones? What can this shooter learn from them.' : ''}

Be concise, direct, use shooting terminology. No filler or disclaimers.`
}

export function buildCompetitionPlanPrompt(
  stages: CompetitionStage[],
  shooterClass: ShooterClass,
  shooterDivision: string,
  startStageIndex: number,
): string {
  const stageOrder = [...stages].sort((a, b) => {
    const aIdx = (a.order + stages.length - startStageIndex) % stages.length
    const bIdx = (b.order + stages.length - startStageIndex) % stages.length
    return aIdx - bIdx
  })

  const stagesSummary = stageOrder.map((s, i) => {
    const info = s.stageInfo
    const benchmarkText = formatBenchmarks(s.benchmarks)
    const completed = s.completed && s.result
      ? `\n  RESULT: HF ${s.result.time > 0 ? (s.result.maxPoints / s.result.time).toFixed(4) : 'N/A'}, ${s.result.time}s, ${s.result.hits.A}A/${s.result.hits.C}C/${s.result.hits.D}D/${s.result.hits.M}M`
      : '\n  NOT YET SHOT'
    return `Stage ${i + 1} (${s.completed ? 'COMPLETED' : 'UPCOMING'}): "${info.name}"
  ${info.roundCount} rounds, ${info.paperTargets} paper, ${info.steelTargets} steel, ${info.scoringMethod}
  Max points: ${info.maxPoints}${benchmarkText}${completed}`
  }).join('\n\n')

  return `You are an IPSC/USPSA competition planning coach. A ${shooterClass}-class shooter in ${shooterDivision} division is planning their match strategy.

They start at stage ${startStageIndex + 1} and shoot in order.

${stagesSummary}

Provide a stage-by-stage match plan:
1. For each upcoming stage: approach (speed/accuracy/balance), realistic HF target, key things to focus on
2. Overall match strategy: which stages matter most for placement, where to be aggressive vs conservative
3. Energy/focus management: which stages need peak concentration vs which are "freebie" stages
${stageOrder.some(s => s.completed) ? '4. Based on completed stages, are they ahead or behind pace? Adjust remaining stage strategy.' : ''}

Be concise and actionable. Use shooting terminology.`
}

async function callClaude(config: LLMConfig, prompt: string): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: config.model || 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    }),
  })
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  return data.content[0].text
}

async function callOpenAI(config: LLMConfig, prompt: string): Promise<string> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model || 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2048,
    }),
  })
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  return data.choices[0].message.content
}

async function callGemini(config: LLMConfig, prompt: string): Promise<string> {
  const model = config.model || 'gemini-2.0-flash'
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config.apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 2048 },
      }),
    },
  )
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  return data.candidates[0].content.parts[0].text
}

export async function callLLM(config: LLMConfig, prompt: string): Promise<string> {
  if (!config.apiKey) throw new Error('API key required')
  switch (config.provider) {
    case 'claude': return callClaude(config, prompt)
    case 'openai': return callOpenAI(config, prompt)
    case 'gemini': return callGemini(config, prompt)
  }
}

export async function analyzeMatch(config: LLMConfig, stages: MatchStage[]): Promise<string> {
  if (stages.length === 0) throw new Error('Add at least one stage')
  return callLLM(config, buildMatchPrompt(stages))
}

export async function getStageAdvice(
  config: LLMConfig,
  stage: CompetitionStage,
  shooterClass: ShooterClass,
  shooterDivision: string,
): Promise<string> {
  const prompt = buildStageAdvicePrompt(stage, shooterClass, shooterDivision)
  return callLLM(config, prompt)
}

export async function getCompetitionPlan(
  config: LLMConfig,
  stages: CompetitionStage[],
  shooterClass: ShooterClass,
  shooterDivision: string,
  startStageIndex: number,
): Promise<string> {
  const prompt = buildCompetitionPlanPrompt(stages, shooterClass, shooterDivision, startStageIndex)
  return callLLM(config, prompt)
}
