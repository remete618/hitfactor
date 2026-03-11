# Hit Factor

**IPSC/USPSA Hit Factor Calculator, Stage Analyzer & Competition Planner**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Deploy](https://img.shields.io/github/actions/workflow/status/remete618/hitfactor/deploy.yml?label=deploy)](https://github.com/remete618/hitfactor/actions)
[![GitHub Pages](https://img.shields.io/badge/live-GitHub%20Pages-blue)](https://remete618.github.io/hitfactor/)
[![PWA](https://img.shields.io/badge/PWA-installable-brightgreen)](https://remete618.github.io/hitfactor/)

> Calculate hit factors, plan competitions stage by stage, get AI coaching, and track your performance over time. Installable as a phone app for use at the range.

**Live app:** [remete618.github.io/hitfactor](https://remete618.github.io/hitfactor/)

---

## Features

### Quick Check
Single stage instant calculator. Enter hits and time, get HF + break-even analysis. What-If simulator lets you adjust hits/time to compare scenarios with quick buttons: "All As", "-1s faster", "2 As → Cs", etc.

### Match Planner
Multi-stage tracking with match summary, charts (HF by stage, hit zone distribution, points earned vs lost, speed/accuracy radar), AI analysis, and CSV export.

### Competition Mode
Full match planner with AI coaching:
- Create competitions with your division and classification
- Add stages manually, upload stage card photos, or import from PractiScore
- Set starting stage — system reorders to your shooting sequence
- Get per-stage AI tactical advice (considers benchmarks + reference scores)
- Generate full match strategy plan
- Enter results stage by stage — progress bar tracks completion
- Add other shooters' results as reference data for AI comparison
- Export results to CSV

### PractiScore Import
Import `.psc` files (exported from PractiScore app) or `.json` match data. Parses stages, shooters, scores, and classifications. Feeds the benchmark engine.

### Benchmark Engine
Aggregates hit factor and accuracy data by shooter classification (GM/M/A/B/C/D) from imported matches. Auto-finds similar stages for benchmarking.

### Match History
Track performance across competitions. HF trend line shows improvement over time.

### Drill Library
7 standard practice drills with descriptions, target HFs by classification, and tactical tips:
- El Presidente, Bill Drill, Blake Drill, Mozambique, Smoke & Hope, Accelerator, Dot Torture

### Voice Input
Dictate hits and time hands-free at the range. "12 alphas, 4 charlies, 0 mikes, 8.43 seconds"

### PWA
Installable as a home screen app on iPhone/Android. Works offline for all scoring calculations.

---

## Break-Even Analysis

The core insight: at what point does dropping accuracy for speed actually pay off?

| Zone Drop | Minor PF Cost | Major PF Cost |
|-----------|---------------|---------------|
| A → C     | -2 pts/hit    | -1 pt/hit     |
| A → D     | -4 pts/hit    | -3 pts/hit    |
| A → M     | -15 pts/hit   | -15 pts/hit   |

Example: at 5.0 HF with Minor PF, each A→C drop costs 0.4s equivalent. If you can't save 0.4s by shooting faster, stay on the A-zone.

## Scoring Reference

| Zone | Minor PF | Major PF |
|------|----------|----------|
| A    | 5 pts    | 5 pts    |
| C    | 3 pts    | 4 pts    |
| D    | 1 pt     | 2 pts    |
| M    | -10 pen  | -10 pen  |
| NS   | -10 pen  | -10 pen  |

**Hit Factor** = Points / Time &nbsp;|&nbsp; **Power Factor**: Minor (125+) vs Major (165+)

---

## Tech Stack

| Layer       | Technology                  |
|-------------|-----------------------------|
| Framework   | React 19                    |
| Language    | TypeScript 5.9              |
| Build       | Vite 7 + PWA plugin         |
| Styling     | Tailwind CSS v4             |
| State       | Zustand (localStorage sync) |
| Charts      | Recharts                    |
| Icons       | Lucide React                |
| ZIP Parsing | JSZip                       |
| AI APIs     | Claude, OpenAI, Gemini      |
| Hosting     | GitHub Pages                |

All scoring runs client-side. No backend. No database. Data persists in `localStorage`.

---

## Project Structure

```
src/
├── types/scoring.ts              # All TypeScript types
├── lib/
│   ├── scoring.ts                # Scoring engine + break-even analysis
│   ├── llm.ts                    # LLM integration (3 providers, stage advice, match plans)
│   ├── vision.ts                 # Stage card image extraction
│   ├── psc-parser.ts             # PractiScore .psc file parser
│   ├── benchmarks.ts             # HF benchmark aggregation
│   ├── voice.ts                  # Speech recognition parser
│   └── export.ts                 # CSV export
├── hooks/useStore.ts             # Zustand store
└── components/
    ├── QuickCheck.tsx             # Single stage calculator + what-if
    ├── StageForm.tsx              # Stage input form + image upload
    ├── StageCard.tsx              # Stage result display
    ├── MatchSummary.tsx           # Multi-stage overview
    ├── MatchCharts.tsx            # Visual analytics (4 chart types)
    ├── AIPanel.tsx                # AI analysis trigger
    ├── CompetitionList.tsx        # Competition manager
    ├── CompetitionView.tsx        # Competition stage-by-stage view
    ├── CompetitionStageCard.tsx   # Stage card with AI advice + results
    ├── AddStageForm.tsx           # Add stage to competition
    ├── PSCImport.tsx              # PractiScore file import
    ├── DrillLibrary.tsx           # Practice drill reference
    ├── MatchHistory.tsx           # Performance tracking + trends
    ├── VoiceInput.tsx             # Voice dictation component
    ├── Settings.tsx               # LLM config
    └── Terms.tsx                  # Terms & conditions
```

---

## Getting Started

```bash
git clone https://github.com/remete618/hitfactor.git
cd hitfactor
npm install
npm run dev
```

Open `http://localhost:5173/hitfactor/`

### Build

```bash
npm run build
```

### Deploy

Pushes to `main` auto-deploy to GitHub Pages.

---

## Contributing

Contributions welcome. Open an issue or PR.

1. Fork the repo
2. Create a feature branch
3. Commit your changes
4. Open a Pull Request

---

## License

[MIT](LICENSE) — Radu Cioplea

## Author

**Radu Cioplea** — [radu@cioplea.com](mailto:radu@cioplea.com) — [eyepaq.com](https://www.eyepaq.com)

---

`#ipsc` `#uspsa` `#hit-factor` `#competitive-shooting` `#speed-vs-accuracy` `#break-even-analysis` `#pwa` `#react` `#typescript` `#practiscore` `#open-source`
