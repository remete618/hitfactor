import { useStore } from '../hooks/useStore'
import { analyzeMatch } from '../lib/llm'
import { Sparkles, Loader2 } from 'lucide-react'

export function AIPanel() {
  const { stages, llmConfig, aiAnalysis, aiLoading, setAIAnalysis, setAILoading } = useStore()

  async function handleAnalyze() {
    if (!llmConfig.apiKey) {
      setAIAnalysis('Set an API key in Settings to use AI analysis.')
      return
    }
    setAILoading(true)
    setAIAnalysis(null)
    try {
      const result = await analyzeMatch(llmConfig, stages)
      setAIAnalysis(result)
    } catch (err: any) {
      setAIAnalysis(`Error: ${err.message}`)
    } finally {
      setAILoading(false)
    }
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-400" />
          AI Match Analysis
        </h2>
        <button
          onClick={handleAnalyze}
          disabled={aiLoading || stages.length === 0}
          className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded text-xs font-medium transition-colors flex items-center gap-1.5"
        >
          {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
          {aiLoading ? 'Analyzing...' : 'Analyze Match'}
        </button>
      </div>

      {!llmConfig.apiKey && (
        <p className="text-xs text-zinc-500">Configure an API key in Settings (Claude, OpenAI, or Gemini) to enable AI-powered match analysis.</p>
      )}

      {aiAnalysis && (
        <div className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap bg-zinc-800/50 rounded p-3 mt-2 max-h-96 overflow-y-auto">
          {aiAnalysis}
        </div>
      )}
    </div>
  )
}
