import type { PSCMatch, PSCShooter, PSCStage, PSCStageScore, StageHits, ScoringMethod, PowerFactor, ShooterClass } from '../types/scoring'

function parseClass(raw: string): ShooterClass {
  const upper = (raw || '').toUpperCase().trim()
  if (upper === 'GM' || upper === 'G') return 'GM'
  if (['M', 'A', 'B', 'C', 'D'].includes(upper)) return upper as ShooterClass
  return 'U'
}

function parsePF(raw: string): PowerFactor {
  return (raw || '').toLowerCase().includes('major') ? 'major' : 'minor'
}

function parseScoringMethod(raw: string): ScoringMethod {
  const lower = (raw || '').toLowerCase()
  if (lower.includes('virginia')) return 'virginia'
  if (lower.includes('fixed')) return 'fixed_time'
  return 'comstock'
}

function safeNum(val: any): number {
  const n = Number(val)
  return isNaN(n) ? 0 : n
}

function buildHits(scoreData: any): StageHits {
  // PSC format can vary: some use ts_a, ts_c, ts_d, ts_m, ts_ns
  // Others use arrays per target string. We handle both.
  if (typeof scoreData.ts_a === 'number') {
    return {
      A: safeNum(scoreData.ts_a) + safeNum(scoreData.popper),
      C: safeNum(scoreData.ts_c),
      D: safeNum(scoreData.ts_d),
      M: safeNum(scoreData.ts_m) + safeNum(scoreData.popper_m),
      NS: safeNum(scoreData.ts_ns),
    }
  }

  // Per-target string format: "A", "C", "D", "M" per target
  // ts array of per-target hits
  let A = 0, C = 0, D = 0, M = 0, NS = 0
  const ts = scoreData.ts || scoreData.targetScores || []
  if (Array.isArray(ts)) {
    for (const target of ts) {
      if (typeof target === 'object' && target !== null) {
        A += safeNum(target.A || target.a)
        C += safeNum(target.C || target.c)
        D += safeNum(target.D || target.d)
        M += safeNum(target.M || target.m)
        NS += safeNum(target.NS || target.ns)
      }
    }
  }
  A += safeNum(scoreData.popper) + safeNum(scoreData.steel_hit)
  M += safeNum(scoreData.popper_m) + safeNum(scoreData.steel_miss)
  return { A, C, D, M, NS }
}

async function readZipJson(file: File): Promise<any[]> {
  const JSZip = (await import('jszip')).default
  const zip = await JSZip.loadAsync(file)
  const jsons: any[] = []
  for (const [filename, entry] of Object.entries(zip.files)) {
    if (!entry.dir && (filename.endsWith('.json') || !filename.includes('.'))) {
      const text = await entry.async('text')
      try { jsons.push(JSON.parse(text)) } catch {}
    }
  }
  return jsons
}

export async function parsePSCFile(file: File): Promise<PSCMatch> {
  let data: any

  if (file.name.endsWith('.json')) {
    const text = await file.text()
    data = JSON.parse(text)
  } else {
    // .psc is a ZIP
    const jsons = await readZipJson(file)
    if (jsons.length === 0) throw new Error('No valid JSON found in .psc file')
    // Merge all JSON objects
    data = jsons.length === 1 ? jsons[0] : Object.assign({}, ...jsons)
  }

  return extractMatchData(data)
}

function extractMatchData(data: any): PSCMatch {
  // Handle different PSC structures
  const matchDef = data.match_def || data.matchDef || data
  const matchScores = data.match_scores || data.matchScores || data.scores || []

  const matchName = matchDef.match_name || matchDef.matchName || matchDef.name || 'Imported Match'
  const matchDate = matchDef.match_date || matchDef.matchDate || matchDef.date || new Date().toISOString().split('T')[0]
  const club = matchDef.match_club || matchDef.club || undefined

  // Parse stages
  const rawStages = matchDef.match_stages || matchDef.stages || matchDef.match_stage || []
  const stages: PSCStage[] = rawStages.map((s: any, i: number) => {
    const paperTargets = safeNum(s.stage_targets || s.targets || s.paperTargets || 0)
    const steelTargets = safeNum(s.stage_poppers || s.poppers || s.steelTargets || 0)
    const roundCount = safeNum(s.stage_minrounds || s.minRounds || s.roundCount || (paperTargets * 2 + steelTargets))
    const maxPoints = safeNum(s.stage_maxpoints || s.maxPoints || (paperTargets * 10 + steelTargets * 5))

    return {
      id: s.stage_uuid || s.uuid || s.id || `stage-${i}`,
      name: s.stage_name || s.name || `Stage ${i + 1}`,
      roundCount,
      paperTargets,
      steelTargets,
      noShoots: safeNum(s.stage_noshoots || s.noShoots || 0),
      maxPoints,
      scoringMethod: parseScoringMethod(s.stage_scoring || s.scoring || s.scoringMethod || ''),
      classifier: s.stage_classifiercode || s.classifierCode || s.classifier || undefined,
      strings: safeNum(s.stage_strings || s.strings || 1),
    }
  })

  // Parse shooters
  const rawShooters = matchDef.match_shooters || matchDef.shooters || []
  const shooters: PSCShooter[] = rawShooters.map((sh: any, i: number) => ({
    id: sh.sh_uuid || sh.uuid || sh.id || `shooter-${i}`,
    name: `${sh.sh_fn || sh.firstName || sh.first_name || ''} ${sh.sh_ln || sh.lastName || sh.last_name || ''}`.trim() || `Shooter ${i + 1}`,
    memberNumber: sh.sh_id || sh.memberId || sh.member_number || undefined,
    division: sh.sh_dvp || sh.division || sh.div || '',
    classification: parseClass(sh.sh_grd || sh.classification || sh.class || sh.cl || ''),
    powerFactor: parsePF(sh.sh_pf || sh.powerFactor || sh.pf || ''),
  }))

  // Parse scores
  const scores: PSCStageScore[] = []

  if (Array.isArray(matchScores)) {
    // Format 1: flat array of score objects
    for (const sc of matchScores) {
      const shooterId = sc.sh_uuid || sc.shooterId || sc.shooter_uuid || ''
      const stageScores = sc.stage_scores || sc.stageScores || sc.scores || []

      if (Array.isArray(stageScores)) {
        for (const ss of stageScores) {
          const stageId = ss.stage_uuid || ss.stageId || ss.stage_id || ''
          const hits = buildHits(ss)
          const time = safeNum(ss.str || ss.time || ss.stage_time || 0)
          // str can be an array of string times
          const totalTime = Array.isArray(ss.str) ? ss.str.reduce((a: number, b: any) => a + safeNum(b), 0) : time
          const rawPts = hits.A * 5 + hits.C * 3 + hits.D * 1 // minor default
          const penalties = (hits.M + hits.NS) * 10 + safeNum(ss.proc || ss.procedurals || 0) * 10
          const points = Math.max(0, rawPts - penalties)
          const hf = totalTime > 0 ? points / totalTime : 0

          scores.push({
            shooterId,
            stageId,
            time: Math.round(totalTime * 100) / 100,
            hits,
            hitFactor: Math.round(hf * 10000) / 10000,
            points,
            procedurals: safeNum(ss.proc || ss.procedurals || 0),
          })
        }
      }
    }
  }

  return {
    id: matchDef.match_id || matchDef.uuid || matchDef.id || crypto.randomUUID(),
    name: matchName,
    date: matchDate,
    club,
    stages,
    shooters,
    scores,
  }
}

export function parsePSCFromJSON(jsonText: string): PSCMatch {
  const data = JSON.parse(jsonText)
  return extractMatchData(data)
}
