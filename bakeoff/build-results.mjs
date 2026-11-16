// Monta o ficheiro de resultados do bake-off a partir das saidas em
// bakeoff/out/ e dos dados de custo da API de sessoes do OpenCode.
// Uso: node bakeoff/build-results.mjs

import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { execSync } from 'node:child_process'

function sh(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
  } catch (e) {
    return e.stdout ?? ''
  }
}

const raw = sh('opencode api get /api/session')
const start = raw.indexOf('{"data"')
const sessions = JSON.parse(raw.slice(start)).data

// ultimas sessoes criadas no bake-off, indexadas por model id
const recent = sessions
  .filter((s) => s.time.created > 1794793000000 && !s.parentID)
  .sort((a, b) => b.time.created - a.time.created)

const byModel = new Map()
for (const s of recent) {
  if (!byModel.has(s.model.id)) byModel.set(s.model.id, s)
}

const results = []
for (const file of readdirSync('bakeoff/out').filter((f) => f.endsWith('.txt'))) {
  const slug = file.replace(/\.txt$/, '')
  const s = byModel.get(slug)
  results.push({
    model: `opencode-go/${slug}`,
    output: readFileSync(`bakeoff/out/${file}`, 'utf8'),
    cost: s ? Number(s.cost.toFixed(5)) : 0,
    minutes: s ? Number(((s.time.updated - s.time.created) / 60000).toFixed(2)) : 0,
    input: s ? s.tokens.input : 0,
    output_tokens: s ? s.tokens.output : 0,
    cacheRead: s ? (s.tokens.cache?.read ?? 0) : 0,
  })
}

writeFileSync('bakeoff/results.json', JSON.stringify(results, null, 2), 'utf8')
console.log(`results.json escrito com ${results.length} entradas`)
