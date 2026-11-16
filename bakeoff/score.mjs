// Scoring do bake-off: compara as respostas dos modelos com o ground truth.
//
// IMPORTANTE: o score NAO usa os IDs que o modelo atribui. Os modelos
// renumeram os defeitos livremente, pelo que os IDs do modelo sao ignorados.
// O score usa correspondencia semantica por termos-chave.
//
// Uso: node bakeoff/score.mjs <resultado.json>

import { readFileSync } from 'node:fs'

// Termos-chave que identificam cada defeito. Um defeito e considerado
// encontrado se alguma das suas linhas contiver pelo menos um dos termos.
const GROUND_TRUTH = [
  {
    id: 'D1',
    severity: 'alta',
    desc: 'import directo de src/content em vez de src/data',
    patterns: [/content\/profile/i, /src\/content/i, /content\b.*data/i, /data\/profile/i],
  },
  {
    id: 'D2',
    severity: 'alta',
    desc: 'alt generico em vez de "Fotografia de <nome>"',
    patterns: [/alt/i, /texto alternativo/i, /fotografia de/i],
  },
  {
    id: 'D3',
    severity: 'alta',
    desc: 'resumo renderizado sem guarda hasSummary',
    patterns: [/resumo/i, /summary/i],
  },
  {
    id: 'D4',
    severity: 'media',
    desc: 'acoes renderizadas sem verificar conteudo',
    patterns: [/a[çc][õo]e/i, /actions/i, /ac[oó]es/i],
  },
  {
    id: 'D6',
    severity: 'media',
    desc: 'falta width/height na img, causa layout shift',
    patterns: [/width/i, /height/i, /layout shift/i, /dimens[õo]e/i],
  },
]

const SEVERITY_WEIGHT = { alta: 1.5, media: 1.0, baixa: 0.5 }

function stripNoise(text) {
  return text
    .split('\n')
    .filter((l) => {
      if (/^\s*>/.test(l)) return false // prompts do TUI
      if (/opencode\.exe|CategoryInfo|FullyQualified|At line|^\s*\+ /.test(l)) return false
      return true
    })
    .join('\n')
}

function parseFindings(text) {
  const clean = stripNoise(text ?? '')
  const lines = clean
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0)

  // linhas de achado: contem um pipe (formato pedido) ou sao bullets
  return lines.filter((l) => /\|/.test(l) || /^\s*[-*•]\s/.test(l))
}

function scoreOne(result) {
  const text = result.output ?? ''
  const findings = parseFindings(text)

  const formatOk = findings.some((l) => /\|/.test(l) && /:\d+/.test(l))

  if (findings.length === 0) {
    const saidNone = /SEM DEFEITOS/i.test(text)
    return {
      model: result.model,
      cost: result.cost,
      minutes: result.minutes,
      input: result.input,
      outputTokens: result.output_tokens,
      cacheRead: result.cacheRead,
      found: [],
      missed: GROUND_TRUTH.map((g) => g.id),
      falsePositives: 0,
      recall: 0,
      precision: 0,
      weightedRecall: 0,
      formatOk: false,
      total: 0,
      note: saidNone ? 'respondeu SEM DEFEITOS' : 'sem achados legiveis',
    }
  }

  const foundIds = new Set()
  let falsePositives = 0

  for (const line of findings) {
    const matched = GROUND_TRUTH.filter((g) => g.patterns.some((p) => p.test(line)))
    if (matched.length === 0) {
      falsePositives++
    } else {
      matched.sort((a, b) => SEVERITY_WEIGHT[b.severity] - SEVERITY_WEIGHT[a.severity])
      foundIds.add(matched[0].id)
    }
  }

  const missed = GROUND_TRUTH.filter((g) => !foundIds.has(g.id)).map((g) => g.id)

  const totalWeight = GROUND_TRUTH.reduce((a, g) => a + SEVERITY_WEIGHT[g.severity], 0)
  const foundWeight = GROUND_TRUTH.filter((g) => foundIds.has(g.id)).reduce(
    (a, g) => a + SEVERITY_WEIGHT[g.severity],
    0,
  )

  const recall = (foundIds.size / GROUND_TRUTH.length) * 100
  const precision = (foundIds.size / findings.length) * 100
  const weightedRecall = (foundWeight / totalWeight) * 100

  const total = recall * 0.45 + precision * 0.3 + (formatOk ? 15 : 0) + weightedRecall * 0.1

  return {
    model: result.model,
    cost: result.cost,
    minutes: result.minutes,
    input: result.input,
    outputTokens: result.output_tokens,
    cacheRead: result.cacheRead,
    found: [...foundIds].sort(),
    missed,
    falsePositives,
    recall: +recall.toFixed(1),
    precision: +precision.toFixed(1),
    weightedRecall: +weightedRecall.toFixed(1),
    formatOk,
    total: +total.toFixed(1),
  }
}

const file = process.argv[2]
const raw = JSON.parse(readFileSync(file, 'utf8'))
const results = Array.isArray(raw) ? raw : [raw]

const scored = results.map(scoreOne).sort((a, b) => b.total - a.total)

console.log('=== RANKING ===')
console.log(
  'model'.padEnd(44) +
    'score'.padStart(7) +
    'rec'.padStart(7) +
    'prec'.padStart(7) +
    'wgt'.padStart(7) +
    'fmt'.padStart(5) +
    'FP'.padStart(4) +
    'cost'.padStart(10) +
    'min'.padStart(7),
)
for (const s of scored) {
  console.log(
    s.model.padEnd(44) +
      String(s.total).padStart(7) +
      String(s.recall).padStart(7) +
      String(s.precision).padStart(7) +
      String(s.weightedRecall).padStart(7) +
      (s.formatOk ? ' ok' : ' no').padStart(5) +
      String(s.falsePositives).padStart(4) +
      ('$' + s.cost.toFixed(4)).padStart(10) +
      String(s.minutes).padStart(7),
  )
}

console.log('\n=== DETALHE ===')
for (const s of scored) {
  console.log(`\n${s.model}  ->  ${s.total}/100`)
  console.log(`  encontrados: ${s.found.join(', ') || '-'}`)
  console.log(`  em falta:    ${s.missed.join(', ') || '-'}`)
  console.log(`  falsos pos:  ${s.falsePositives}`)
  if (s.note) console.log(`  nota:        ${s.note}`)
}

console.log('\n=== CHAVE (ground truth, 5 defeitos) ===')
for (const g of GROUND_TRUTH) {
  console.log(`  ${g.id} [${g.severity}] ${g.desc}`)
}
