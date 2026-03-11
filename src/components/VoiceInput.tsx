import { useState, useRef, useCallback } from 'react'
import { startVoiceRecognition, isVoiceSupported } from '../lib/voice'
import type { StageHits } from '../types/scoring'
import { Mic, MicOff } from 'lucide-react'

interface Props {
  onResult: (hits: Partial<StageHits>, time?: number) => void
}

export function VoiceInput({ onResult }: Props) {
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const stopRef = useRef<(() => void) | null>(null)

  const handleToggle = useCallback(() => {
    if (listening) {
      stopRef.current?.()
      setListening(false)
      return
    }

    setError(null)
    setTranscript(null)
    setListening(true)

    stopRef.current = startVoiceRecognition(
      (result, rawTranscript) => {
        setListening(false)
        setTranscript(rawTranscript)
        onResult(result.hits, result.time)
      },
      (err) => {
        setListening(false)
        setError(err)
      },
    )
  }, [listening, onResult])

  if (!isVoiceSupported()) return null

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleToggle}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all ${
          listening
            ? 'bg-red-600 text-white animate-pulse'
            : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
        }`}
      >
        {listening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
        {listening ? 'Listening...' : 'Voice Input'}
      </button>
      {transcript && <span className="text-xs text-zinc-500 italic">"{transcript}"</span>}
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  )
}
