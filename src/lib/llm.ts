import type { LLMConfig, MatchStage } from '../types/scoring'

function buildPrompt(stages: MatchStage[]): string {
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
      max_tokens: 1024,
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
      max_tokens: 1024,
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
        generationConfig: { maxOutputTokens: 1024 },
      }),
    },
  )
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  return data.candidates[0].content.parts[0].text
}

export async function analyzeMatch(config: LLMConfig, stages: MatchStage[]): Promise<string> {
  if (!config.apiKey) throw new Error('API key required')
  if (stages.length === 0) throw new Error('Add at least one stage')

  const prompt = buildPrompt(stages)

  switch (config.provider) {
    case 'claude': return callClaude(config, prompt)
    case 'openai': return callOpenAI(config, prompt)
    case 'gemini': return callGemini(config, prompt)
  }
}
