import type { StageHits } from '../types/scoring'

export interface VoiceResult {
  hits: Partial<StageHits>
  time?: number
}

export function parseVoiceInput(transcript: string): VoiceResult {
  const text = transcript.toLowerCase().trim()
  const result: VoiceResult = { hits: {} }

  // Parse hit counts: "12 alphas", "4 charlies", "2 deltas", "1 mike", "0 no shoots"
  const patterns: [RegExp, keyof StageHits][] = [
    [/(\d+)\s*(?:alpha|alfa|a(?:lpha)?s?)\b/i, 'A'],
    [/(\d+)\s*(?:charlie|charli|c(?:harlie)?s?)\b/i, 'C'],
    [/(\d+)\s*(?:delta|d(?:elta)?s?)\b/i, 'D'],
    [/(\d+)\s*(?:mike|miss|m(?:ike)?s?)\b/i, 'M'],
    [/(\d+)\s*(?:no[\s-]?shoot|n\.?s\.?)\b/i, 'NS'],
  ]

  for (const [regex, zone] of patterns) {
    const match = text.match(regex)
    if (match) {
      result.hits[zone] = parseInt(match[1])
    }
  }

  // Parse time: "8.43 seconds", "time 8.43", "8.43s"
  const timeMatch = text.match(/(\d+\.?\d*)\s*(?:seconds?|secs?|s\b)/i)
    || text.match(/time\s*(?:is\s*)?(\d+\.?\d*)/i)
  if (timeMatch) {
    result.time = parseFloat(timeMatch[1])
  }

  return result
}

export function startVoiceRecognition(
  onResult: (result: VoiceResult, transcript: string) => void,
  onError: (error: string) => void,
): () => void {
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  if (!SpeechRecognition) {
    onError('Speech recognition not supported in this browser')
    return () => {}
  }

  const recognition = new SpeechRecognition()
  recognition.continuous = false
  recognition.interimResults = false
  recognition.lang = 'en-US'

  recognition.onresult = (event: any) => {
    const transcript = event.results[0][0].transcript
    const parsed = parseVoiceInput(transcript)
    onResult(parsed, transcript)
  }

  recognition.onerror = (event: any) => {
    onError(event.error === 'no-speech' ? 'No speech detected. Try again.' : `Error: ${event.error}`)
  }

  recognition.start()
  return () => recognition.stop()
}

export function isVoiceSupported(): boolean {
  return !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)
}
