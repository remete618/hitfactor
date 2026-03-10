import { useStore } from '../hooks/useStore'
import type { LLMProvider } from '../types/scoring'
import { X, Trash2 } from 'lucide-react'

interface Props {
  onClose: () => void
}

const PROVIDER_MODELS: Record<LLMProvider, string[]> = {
  claude: ['claude-sonnet-4-20250514', 'claude-haiku-4-5-20251001'],
  openai: ['gpt-4o', 'gpt-4o-mini'],
  gemini: ['gemini-2.0-flash', 'gemini-2.5-pro-preview-06-05'],
}

export function Settings({ onClose }: Props) {
  const { llmConfig, setLLMConfig, clearStages, stages } = useStore()

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-medium text-sm">Settings</h2>
        <button onClick={onClose} className="p-1 hover:bg-zinc-800 rounded">
          <X className="w-4 h-4 text-zinc-500" />
        </button>
      </div>

      <div className="space-y-3">
        <div className="text-xs text-zinc-500 font-medium">AI Provider (for analysis + image extraction)</div>

        <div>
          <label className="text-xs text-zinc-500 block mb-1">Provider</label>
          <select
            value={llmConfig.provider}
            onChange={e => setLLMConfig({ provider: e.target.value as LLMProvider, model: '' })}
            className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-zinc-500"
          >
            <option value="claude">Anthropic (Claude)</option>
            <option value="openai">OpenAI (GPT-4o)</option>
            <option value="gemini">Google (Gemini)</option>
          </select>
        </div>

        <div>
          <label className="text-xs text-zinc-500 block mb-1">API Key</label>
          <input
            type="password"
            value={llmConfig.apiKey}
            onChange={e => setLLMConfig({ apiKey: e.target.value })}
            placeholder={`Enter ${llmConfig.provider} API key`}
            className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-zinc-500"
          />
          <p className="text-xs text-zinc-600 mt-1">Stored in memory only. Never sent to our servers.</p>
        </div>

        <div>
          <label className="text-xs text-zinc-500 block mb-1">Model</label>
          <select
            value={llmConfig.model}
            onChange={e => setLLMConfig({ model: e.target.value })}
            className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-zinc-500"
          >
            <option value="">Default</option>
            {PROVIDER_MODELS[llmConfig.provider].map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      {stages.length > 0 && (
        <div className="pt-3 border-t border-zinc-800">
          <button
            onClick={clearStages}
            className="flex items-center gap-2 px-3 py-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-zinc-800 rounded transition-colors"
          >
            <Trash2 className="w-3 h-3" />
            Clear all stages ({stages.length})
          </button>
        </div>
      )}
    </div>
  )
}
