# Hit Factor

**IPSC/USPSA Hit Factor Calculator & Stage Analyzer**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Deploy](https://img.shields.io/github/actions/workflow/status/remete618/hitfactor/deploy.yml?label=deploy)](https://github.com/remete618/hitfactor/actions)
[![GitHub Pages](https://img.shields.io/badge/live-GitHub%20Pages-blue)](https://remete618.github.io/hitfactor/)

> Calculate hit factors, analyze speed vs. accuracy trade-offs, and get AI-powered match insights for IPSC and USPSA competition shooting.

**Live demo:** [remete618.github.io/hitfactor](https://remete618.github.io/hitfactor/)

---

## What It Does

Hit Factor answers the core question every competitive shooter faces: **should I push speed or focus on accuracy?**

In IPSC/USPSA, Hit Factor = Points / Time. Shooting faster lowers your time but may drop shots from A-zone to C or D. This tool calculates the exact break-even point — how much time you need to save per shot to justify accepting lower-scoring hits.

### Two Modes

- **Quick Check** — Enter hits and time for a single stage. Get instant hit factor, accuracy percentage, and break-even analysis. No account, no saving — just fast math.
- **Match Planner** — Build a full match with multiple stages. Track totals across the event, identify your weakest stage, find where you're leaving the most points on the table, and run AI analysis on the complete match.

### Break-Even Analysis

For each stage, the calculator computes:

- **A→C break-even time** — How many seconds per hit you'd need to save by shooting faster to justify dropping from A-zone to C-zone
- **A→D break-even time** — Same calculation for A-zone to D-zone drops
- **Recommendation** — Based on your current hit factor, whether to push speed, accept some C-hits, or slow down and aim

Example: at a 5.0 HF with Minor power factor, each A→C drop costs you 0.4s equivalent. If you can't save more than 0.4s per hit by shooting faster, stay on the A-zone.

### AI Features (Optional)

Connect your own API key (Claude, OpenAI, or Gemini) to enable:

- **Match analysis** — AI reviews all your stages and provides coaching insights on where to improve
- **Stage card extraction** — Upload a photo of a printed stage design card and automatically extract round count, scoring method, and stage name

API keys stay in browser memory only. Requests go directly from your browser to the AI provider. Nothing passes through our servers.

---

## Scoring Reference

| Zone | Minor PF | Major PF |
|------|----------|----------|
| A    | 5 pts    | 5 pts    |
| C    | 3 pts    | 4 pts    |
| D    | 1 pt     | 2 pts    |
| M    | -10 pen  | -10 pen  |
| NS   | -10 pen  | -10 pen  |

**Hit Factor** = Total Points / Time (Comstock scoring)

**Power Factor**: Minor (125+ PF) vs Major (165+ PF) — affects C and D zone point values.

**Scoring methods**: Comstock (points/time), Virginia Count (fixed round count), Fixed Time.

Supports both **USPSA** and **IPSC** rule sets.

---

## Tech Stack

| Layer       | Technology                  |
|-------------|-----------------------------|
| Framework   | React 19                    |
| Language    | TypeScript 5.9              |
| Build       | Vite 7                      |
| Styling     | Tailwind CSS v4             |
| State       | Zustand (localStorage sync) |
| Icons       | Lucide React                |
| AI APIs     | Claude, OpenAI, Gemini      |
| Hosting     | GitHub Pages                |

All scoring calculations run client-side. No backend. No database. Stage data persists in `localStorage`.

---

## Project Structure

```
src/
├── types/scoring.ts       # TypeScript types for all scoring concepts
├── lib/
│   ├── scoring.ts         # Core scoring engine + break-even analysis
│   ├── llm.ts             # LLM API integration (3 providers)
│   └── vision.ts          # Stage card image extraction via AI vision
├── hooks/useStore.ts      # Zustand store with localStorage persistence
└── components/
    ├── QuickCheck.tsx      # Single-stage instant calculator
    ├── StageForm.tsx       # Stage input form + image upload
    ├── StageCard.tsx       # Stage result display + break-even
    ├── MatchSummary.tsx    # Multi-stage match overview
    ├── AIPanel.tsx         # AI match analysis trigger + display
    ├── Settings.tsx        # LLM provider/key/model config
    └── Terms.tsx           # Terms & conditions page
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm

### Install & Run

```bash
git clone https://github.com/remete618/hitfactor.git
cd hitfactor
npm install
npm run dev
```

Open `http://localhost:5173/hitfactor/` in your browser.

### Build for Production

```bash
npm run build
```

Output goes to `dist/`.

### Deploy

Pushes to `main` auto-deploy to GitHub Pages via the included workflow (`.github/workflows/deploy.yml`).

---

## Contributing

Contributions welcome. Open an issue or submit a pull request.

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes
4. Push to the branch (`git push origin feature/my-feature`)
5. Open a Pull Request

---

## License

[MIT](LICENSE) — Radu Cioplea

---

## Author

**Radu Cioplea**
- Email: [radu@cioplea.com](mailto:radu@cioplea.com)
- Web: [eyepaq.com](https://www.eyepaq.com)

---

`#ipsc` `#uspsa` `#hit-factor` `#competitive-shooting` `#speed-vs-accuracy` `#break-even-analysis` `#react` `#typescript` `#open-source`
