import { ArrowLeft } from 'lucide-react'

interface Props {
  onClose: () => void
}

export function Terms({ onClose }: Props) {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800 px-4 py-3">
        <div className="max-w-3xl mx-auto">
          <button onClick={onClose} className="flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 prose prose-invert prose-sm prose-zinc">
        <h1 className="text-xl font-semibold mb-6">Terms & Conditions</h1>
        <p className="text-xs text-zinc-500 mb-6">Last updated: August 2025</p>

        <section className="space-y-4 text-sm text-zinc-300 leading-relaxed">
          <h2 className="text-base font-medium text-zinc-100">1. Acceptance of Terms</h2>
          <p>By accessing and using Hit Factor ("the Application"), you agree to be bound by these Terms & Conditions. If you do not agree, do not use the Application.</p>

          <h2 className="text-base font-medium text-zinc-100">2. Description of Service</h2>
          <p>Hit Factor is a client-side web application that calculates IPSC/USPSA hit factors, performs speed vs. accuracy break-even analysis, and optionally connects to third-party AI APIs for match analysis and stage card image extraction. All scoring calculations run entirely in your browser.</p>

          <h2 className="text-base font-medium text-zinc-100">3. API Keys & Third-Party Services</h2>
          <p>The Application allows you to provide your own API keys for Anthropic (Claude), OpenAI, or Google (Gemini) services. Your API keys are stored in browser memory only and are never transmitted to our servers. When you use AI features, requests are sent directly from your browser to the respective third-party API provider. Your use of those services is subject to their own terms and pricing.</p>

          <h2 className="text-base font-medium text-zinc-100">4. Data & Privacy</h2>
          <p>All stage data you enter is stored locally in your browser's localStorage. No data is collected, transmitted to, or stored on our servers. We do not use cookies or tracking. Clearing your browser data will remove all stored stages and settings.</p>

          <h2 className="text-base font-medium text-zinc-100">5. Accuracy Disclaimer</h2>
          <p>Scoring calculations are provided for informational and training purposes only. While we strive for accuracy per IPSC and USPSA rulebooks, results should not be used as official match scores. Always defer to official match directors and scoring systems for competition results.</p>

          <h2 className="text-base font-medium text-zinc-100">6. AI-Generated Content</h2>
          <p>Match analysis and stage card extraction powered by AI may contain errors or inaccuracies. AI outputs are suggestions only and should be verified independently. We are not responsible for decisions made based on AI-generated analysis.</p>

          <h2 className="text-base font-medium text-zinc-100">7. Intellectual Property</h2>
          <p>The Application source code is open source and available on GitHub. IPSC and USPSA are trademarks of their respective organizations. This application is not affiliated with, endorsed by, or officially connected to IPSC or USPSA.</p>

          <h2 className="text-base font-medium text-zinc-100">8. Limitation of Liability</h2>
          <p>The Application is provided "as is" without warranty of any kind, express or implied. In no event shall the authors or copyright holders be liable for any claim, damages, or other liability arising from the use of the Application.</p>

          <h2 className="text-base font-medium text-zinc-100">9. Changes to Terms</h2>
          <p>We reserve the right to modify these terms at any time. Continued use of the Application after changes constitutes acceptance of the updated terms.</p>

          <h2 className="text-base font-medium text-zinc-100">10. Contact</h2>
          <p>For questions regarding these terms, contact: <a href="mailto:radu@cioplea.com" className="text-zinc-200 underline hover:text-zinc-100">radu@cioplea.com</a></p>
        </section>

        <div className="mt-8 pt-6 border-t border-zinc-800 text-xs text-zinc-600">
          &copy; 2025–2026 eyepaq.com. All rights reserved.
        </div>
      </main>
    </div>
  )
}
