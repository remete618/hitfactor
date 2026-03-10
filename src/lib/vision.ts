import type { LLMConfig } from '../types/scoring'

const EXTRACTION_PROMPT = `You are looking at a photo of an IPSC/USPSA stage briefing card, stage design diagram, or written stage description.

Extract the following information. If a field is not visible or unclear, set it to null.

Respond ONLY with valid JSON, no markdown:
{
  "name": "stage name or number",
  "roundCount": minimum round count (number),
  "paperTargets": number of paper targets,
  "steelTargets": number of steel/popper targets,
  "noShoots": number of no-shoot targets,
  "scoringMethod": "comstock" or "virginia" or "fixed_time",
  "description": "brief description of what you see"
}`

async function imageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result.split(',')[1])
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

async function extractWithClaude(config: LLMConfig, base64: string, mimeType: string): Promise<string> {
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
      max_tokens: 512,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mimeType, data: base64 } },
          { type: 'text', text: EXTRACTION_PROMPT },
        ],
      }],
    }),
  })
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  return data.content[0].text
}

async function extractWithOpenAI(config: LLMConfig, base64: string, mimeType: string): Promise<string> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model || 'gpt-4o',
      messages: [{
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}` } },
          { type: 'text', text: EXTRACTION_PROMPT },
        ],
      }],
      max_tokens: 512,
    }),
  })
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  return data.choices[0].message.content
}

async function extractWithGemini(config: LLMConfig, base64: string, mimeType: string): Promise<string> {
  const model = config.model || 'gemini-2.0-flash'
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config.apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { inlineData: { mimeType, data: base64 } },
            { text: EXTRACTION_PROMPT },
          ],
        }],
        generationConfig: { maxOutputTokens: 512 },
      }),
    },
  )
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  return data.candidates[0].content.parts[0].text
}

export interface ExtractedStageInfo {
  name: string | null
  roundCount: number | null
  paperTargets: number | null
  steelTargets: number | null
  noShoots: number | null
  scoringMethod: string | null
  description: string | null
}

export async function extractStageFromImage(config: LLMConfig, file: File): Promise<ExtractedStageInfo> {
  if (!config.apiKey) throw new Error('API key required for image extraction')

  const base64 = await imageToBase64(file)
  const mimeType = file.type || 'image/jpeg'

  let rawText: string
  switch (config.provider) {
    case 'claude': rawText = await extractWithClaude(config, base64, mimeType); break
    case 'openai': rawText = await extractWithOpenAI(config, base64, mimeType); break
    case 'gemini': rawText = await extractWithGemini(config, base64, mimeType); break
  }

  const jsonMatch = rawText.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Could not parse stage info from image')
  return JSON.parse(jsonMatch[0])
}
