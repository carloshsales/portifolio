// Validacao ponta a ponta do orquestrador.
// Uso: node bakeoff/validate.mjs
//
// Cada verificacao devolve OK ou FALHA. O script termina com codigo 1 se
// alguma falhar.

import { execSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'

const results = []
function check(name, fn) {
  try {
    const detail = fn()
    results.push({ name, ok: true, detail: detail ?? '' })
  } catch (e) {
    results.push({ name, ok: false, detail: e.message.split('\n')[0].slice(0, 160) })
  }
}

function sh(cmd) {
  return execSync(cmd, {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    shell: 'C:\\Windows\\System32\\cmd.exe',
  })
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg)
}

// --- 1. configuracao -------------------------------------------------------
check('opencode.json existe e e JSON valido', () => {
  assert(existsSync('opencode.json'), 'opencode.json ausente')
  JSON.parse(readFileSync('opencode.json', 'utf8'))
  return 'JSON valido'
})

check('opencode.json valida contra o schema publicado', () => {
  const schema = JSON.parse(
    execSync('curl -s https://opencode.ai/config.json', {
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
    }),
  )
  const cfg = JSON.parse(readFileSync('opencode.json', 'utf8'))
  const allowed = new Set(Object.keys(schema.properties))
  const unknown = Object.keys(cfg).filter((k) => !allowed.has(k))
  assert(unknown.length === 0, `chaves desconhecidas: ${unknown.join(', ')}`)
  return `${cfg.permissions.length} regras de permissao, sem chaves desconhecidas`
})

check('nao ha campos de uso unico (V1) na configuracao', () => {
  const cfg = JSON.parse(readFileSync('opencode.json', 'utf8'))
  const deprecated = ['permission', 'bash', 'task', 'tools', 'disable', 'maxSteps', 'mode', 'agent']
  const found = deprecated.filter((k) => k in cfg)
  assert(found.length === 0, `campos em desuso: ${found.join(', ')}`)
  return 'nenhum campo em desuso'
})

// --- 2. agentes ------------------------------------------------------------
const AGENT_FILES = [
  'orquestrador',
  'explorador',
  'analista-clareza',
  'implementador',
  'revisor',
  'revisor-b',
  'verificador',
  'guardiao',
]

check('os 8 agentes existem com frontmatter completo', () => {
  for (const a of AGENT_FILES) {
    const path = `.opencode/agents/${a}.md`
    assert(existsSync(path), `${path} ausente`)
    const content = readFileSync(path, 'utf8')
    assert(content.startsWith('---'), `${a} sem frontmatter`)
    assert(/^description:/m.test(content), `${a} sem description`)
    assert(/^mode:/m.test(content), `${a} sem mode`)
    assert(/^model:/m.test(content), `${a} sem model`)
    assert(/^permissions:/m.test(content), `${a} sem permissions`)
  }
  return `${AGENT_FILES.length} agentes com frontmatter completo`
})

check('todos os modelos do routing pertencem ao provider opencode-go', () => {
  for (const a of AGENT_FILES) {
    const content = readFileSync(`.opencode/agents/${a}.md`, 'utf8')
    const model = content.match(/^model:\s*(\S+)/m)?.[1] ?? ''
    assert(model.startsWith('opencode-go/'), `${a} usa ${model}, que nao pertence ao opencode-go`)
  }
  return 'todos os 8 modelos em opencode-go'
})

check('os 5 agentes de leitura negam edit, shell e subagent', () => {
  const readOnly = ['explorador', 'analista-clareza', 'revisor', 'revisor-b', 'verificador']
  for (const a of readOnly) {
    const content = readFileSync(`.opencode/agents/${a}.md`, 'utf8')
    for (const action of ['edit', 'shell', 'subagent']) {
      const re = new RegExp(`action: ${action}[\\s\\S]{0,80}?effect: deny`)
      assert(re.test(content), `${a} nao nega ${action}`)
    }
  }
  return '5 agentes com as 3 negacoes'
})

// --- 3. comandos -----------------------------------------------------------
check('os 2 comandos existem e referenciam agentes validos', () => {
  const agents = AGENT_FILES
  for (const c of ['orquestrar', 'clarity']) {
    const path = `.opencode/commands/${c}.md`
    assert(existsSync(path), `${path} ausente`)
    const content = readFileSync(path, 'utf8')
    const ref = content.match(/^agent:\s*(\S+)/m)?.[1]
    assert(ref, `${c} sem agent`)
    assert(agents.includes(ref), `${c} referencia o agente inexistente ${ref}`)
  }
  return '2 comandos com referencias validas'
})

// --- 4. documentacao -------------------------------------------------------
check('docs/orquestrador.md tem a tabela de routing completa', () => {
  const doc = readFileSync('docs/orquestrador.md', 'utf8')
  for (const a of AGENT_FILES) {
    assert(doc.includes(`\`${a}\``), `${a} ausente da tabela de routing`)
  }
  assert(doc.includes('Cache read'), 'custos de cache ausentes')
  return '8 agentes na tabela, com custos'
})

check('a ADR-007 tem as 6 secoes exigidas', () => {
  const adr = readFileSync('docs/decisions/ADR-007-orquestrador-de-agentes.md', 'utf8')
  for (const s of [
    'Contexto',
    'Alternativas consideradas',
    'Decisão',
    'Justificativa',
    'Consequências',
  ]) {
    assert(adr.includes(`## ${s}`), `seccao ${s} ausente`)
  }
  assert(/- Status:/.test(adr), 'Status ausente')
  return '6 secoes presentes'
})

check('docs/history.md esta integro, sem duplicados nem corrupcao', () => {
  const h = readFileSync('docs/history.md', 'utf8')
  assert(!h.includes('\uFFFD'), 'contem caracteres de substituicao')
  const headers = [...h.matchAll(/^## .*$/gm)].map((m) => m[0])
  const keys = headers.map((x) => x.replace(/^## \S+ [—-] \S+ [—-] /, '').trim())
  const dupes = keys.filter((k, i) => keys.indexOf(k) !== i)
  assert(dupes.length === 0, `entradas duplicadas: ${[...new Set(dupes)].join(', ')}`)
  return `${headers.length} entradas, sem duplicados nem corrupcao`
})

check('os custos documentados batem com a medicao', () => {
  const cost = {}
  for (const r of JSON.parse(readFileSync('bakeoff/results.json', 'utf8'))) {
    cost[r.model.replace('opencode-go/', '')] = r.cost
  }
  const total =
    cost['gpt-6-luna'] * 3 +
    cost['beam-free'] * 2 +
    cost['claude-haiku-5-5'] * 2 +
    cost['kimi-k2.7-code']
  const doc = readFileSync('docs/orquestrador.md', 'utf8')
  const documented = doc.match(/\$0,(\d{4})/)?.[1]
  assert(documented !== undefined, 'custo por task ausente da documentacao')
  const delta = Math.abs(Number(`0.${documented}`) - total)
  assert(delta < 0.0005, `documentado 0,${documented} vs medido ${total.toFixed(4)}`)
  return `0,${documented} bate com a medicao (${total.toFixed(4)})`
})

// --- 5. RawSpec ------------------------------------------------------------
check('o grafo de dependencias da change 006 nao tem ciclos', () => {
  const out = sh('node scripts/rawspec-v2-cli.mjs resolve TASK-007 --change 006-agent-orchestrator')
  const data = JSON.parse(out.slice(out.indexOf('{')))
  const tasks = data.change.tasks
  assert(tasks.length === 7, `esperadas 7 tasks, encontradas ${tasks.length}`)
  for (const t of tasks) {
    assert(
      t.dependencySource === 'explicit' || t.dependencySource === 'none',
      `${t.id} sem dependencia explicita`,
    )
  }
  return `${tasks.length} tasks com dependencias validas, sem ciclos`
})

check('a change 006 esta aprovada', () => {
  const out = sh('node scripts/rawspec-v2-cli.mjs resolve TASK-001 --change 006-agent-orchestrator')
  const data = JSON.parse(out.slice(out.indexOf('{')))
  assert(data.change.proposalStatus === 'APPROVED', `proposal: ${data.change.proposalStatus}`)
  assert(data.change.designStatus === 'APPROVED', `design: ${data.change.designStatus}`)
  return 'proposal e design APPROVED'
})

check('a change 001 continua consistente', () => {
  const out = sh('node scripts/rawspec-v2-cli.mjs next --change 001-portfolio-mvp')
  const data = JSON.parse(out.slice(out.indexOf('{')))
  assert(data.task?.id, 'nenhuma task elegivel')
  return `${data.task.id} — ${data.task.title}`
})

// --- resultado -------------------------------------------------------------
console.log('=== VALIDACAO PONTA A PONTA ===')
for (const r of results) {
  console.log(`${r.ok ? 'PASS' : 'FALHA'}  ${r.name.padEnd(58)} ${r.detail}`)
}
const failures = results.filter((r) => !r.ok).length
console.log(`\n${results.length - failures}/${results.length} verificacoes conformes`)
process.exit(failures === 0 ? 0 : 1)
