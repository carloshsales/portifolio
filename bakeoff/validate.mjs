// Validacao ponta a ponta do orquestrador.
// Uso: node bakeoff/validate.mjs
//
// Cada verificacao devolve OK ou FALHA. O script termina com codigo 1 se
// alguma falhar.

import { execSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync } from 'node:fs'

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
  'executor',
  'revisor',
  'revisor-b',
  'verificador',
  'guardiao',
]

check('os 9 agentes existem com frontmatter completo', () => {
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
  return 'todos os 9 modelos em opencode-go'
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

check('o executor executa so comandos de leitura e nao escreve', () => {
  const content = readFileSync('.opencode/agents/executor.md', 'utf8')
  assert(/action: edit[\s\S]{0,80}?effect: deny/.test(content), 'executor nao nega edit')
  const allowed = [
    'pnpm test',
    'pnpm test:e2e',
    'pnpm lint',
    'pnpm typecheck',
    'pnpm format:check',
    'pnpm build',
  ]
  for (const cmd of allowed) {
    const re = new RegExp(
      `action: shell[\\s\\S]{0,120}?resource: '${cmd} \\*'[\\s\\S]{0,80}?effect: allow`,
    )
    assert(re.test(content), `executor nao permite ${cmd}`)
  }
  const shellAllows = [...content.matchAll(/action: shell[\s\S]{0,120}?effect: allow/g)].length
  assert(
    shellAllows === allowed.length,
    `executor tem ${shellAllows} permissoes shell allow, esperadas ${allowed.length}`,
  )
  for (const cmd of ['pnpm lint:fix', 'pnpm format', 'pnpm dev', 'pnpm preview']) {
    const re = new RegExp(
      `action: shell[\\s\\S]{0,120}?resource: '${cmd} \\*'[\\s\\S]{0,80}?effect: allow`,
    )
    assert(!re.test(content), `executor nao deve permitir ${cmd}`)
  }
  assert(
    /action: shell[\s\S]{0,120}?resource: '\*'[\s\S]{0,80}?effect: deny/.test(content),
    'executor nao nega shell em geral',
  )
  return `${allowed.length} comandos de leitura, sem escrita`
})

check('a regra shell deny vem antes dos allow do executor', () => {
  const content = readFileSync('.opencode/agents/executor.md', 'utf8')
  // Cada regra de shell ocupa tres linhas: action, resource e effect.
  const lines = content.split('\n')
  const shellRules = []
  for (let i = 0; i < lines.length; i++) {
    if (!/^\s*- action: shell\s*$/.test(lines[i])) continue
    const resource = (lines[i + 1] ?? '').trim()
    const effect = (lines[i + 2] ?? '').trim()
    shellRules.push({ line: i + 1, resource, effect })
  }
  const denyIdx = shellRules.findIndex(
    (r) => r.resource.includes("'*'") && r.effect.includes('deny'),
  )
  const allowIdx = shellRules.findIndex((r) => r.effect.includes('allow'))
  assert(denyIdx !== -1, 'executor sem regra shell deny geral')
  assert(allowIdx !== -1, 'executor sem nenhuma regra shell allow')
  assert(
    denyIdx < allowIdx,
    `a regra shell deny tem de vir antes dos allow: a ultima regra que corresponde prevalece (deny na linha ${shellRules[denyIdx].line}, primeiro allow na linha ${shellRules[allowIdx].line})`,
  )
  return `deny geral na linha ${shellRules[denyIdx].line}, allow a partir da linha ${shellRules[allowIdx].line}`
})

check('o guardiao e o orquestrador indicam a proxima task', () => {
  const guardiao = readFileSync('.opencode/agents/guardiao.md', 'utf8')
  const orquestrador = readFileSync('.opencode/agents/orquestrador.md', 'utf8')
  for (const [nome, content] of [
    ['guardiao', guardiao],
    ['orquestrador', orquestrador],
  ]) {
    assert(content.includes('PROXIMA:'), `${nome} sem o campo PROXIMA na saida`)
    assert(/próxima task/i.test(content), `${nome} nao menciona a proxima task`)
  }
  assert(
    guardiao.includes('rawspec-v2-cli.mjs next'),
    'guardiao nao consulta a proxima task com a CLI',
  )
  assert(/next --change/.test(guardiao), 'guardiao nao consulta primeiro a change da task')
  assert(/E_CHANGE_AMBIGUOUS/.test(guardiao), 'guardiao nao trata a ambiguidade entre changes')
  assert(/E_NOTHING_TO_START/.test(guardiao), 'guardiao nao trata a ausencia de proxima task')
  // A proxima task e informacao: nao pode ser implementada nem alterada.
  const plain = guardiao.replace(/\*\*/g, '')
  assert(
    /informação,?\s+não uma ordem/i.test(plain),
    'guardiao nao declara que a proxima task e apenas informacao',
  )
  assert(/Não a implementes/i.test(plain), 'guardiao nao proibe implementar a proxima task')
  return 'guardiao consulta a CLI e o orquestrador apresenta o campo PROXIMA'
})

check('o cache TTL da configuracao e valido para os modelos do routing', () => {
  const cfg = JSON.parse(readFileSync('opencode.json', 'utf8'))
  const provider = cfg.providers?.['opencode-go']
  assert(provider, 'opencode-go sem configuracao de cache')
  const providerTtl = provider.settings?.cache?.ttl
  assert(typeof providerTtl === 'string', 'opencode-go sem cache.ttl definido ao nivel do provider')

  // O upstream aceita TTLs diferentes conforme o modelo: o beam-free exige
  // exactamente 30m, e o claude-haiku-5-5 aceita apenas 5m ou 1h. Um TTL
  // unico ao nivel do provider nao serve os dois, por isso o modelo que
  // discorda precisa de um override ao nivel do modelo.
  const models = provider.models ?? {}
  const overrides = Object.entries(models).map(([id, m]) => [id, m?.settings?.cache?.ttl])

  const haiku = overrides.find(([id]) => id === 'claude-haiku-5-5')
  assert(haiku, 'claude-haiku-5-5 sem override de cache ao nivel do modelo')
  assert(
    ['5m', '1h'].includes(haiku[1]),
    `o TTL do claude-haiku-5-5 e ${haiku[1]}, que o upstream rejeita (aceita 5m ou 1h)`,
  )
  assert(
    providerTtl === '30m',
    `o TTL do provider e ${providerTtl}; o beam-free exige exactamente 30m`,
  )

  const restantes = overrides.filter(([id]) => id !== 'claude-haiku-5-5')
  for (const [id, ttl] of restantes) {
    assert(
      ttl === undefined || ttl === providerTtl,
      `o override de cache de ${id} (${ttl}) difere do TTL do provider (${providerTtl})`,
    )
  }

  return `provider ${providerTtl}, claude-haiku-5-5 ${haiku[1]}`
})

check('todos os modelos e variantes declarados resolvem no catalogo', () => {
  const declared = new Map()
  for (const a of AGENT_FILES) {
    const content = readFileSync(`.opencode/agents/${a}.md`, 'utf8')
    const model = content.match(/^model:\s*(\S+)/m)?.[1]
    if (model) declared.set(`agente ${a}`, model)
  }
  for (const c of ['orquestrar', 'clarity']) {
    const content = readFileSync(`.opencode/commands/${c}.md`, 'utf8')
    const model = content.match(/^model:\s*(\S+)/m)?.[1]
    if (model) declared.set(`comando /${c}`, model)
  }

  const catalog = JSON.parse(
    execSync('curl -s https://models.dev/api.json', {
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
    }),
  )

  const problems = []
  for (const [where, reference] of declared) {
    const [provider, rest] = reference.split('/')
    const [model, variant] = rest.split('#')
    const entry = catalog[provider]?.models?.[model]
    if (!entry) {
      problems.push(`${where}: ${provider}/${model} nao existe no catalogo`)
      continue
    }
    if (!variant) continue
    // As variantes do catalogo derivam de reasoning_options: 'effort' gera
    // variantes por nivel, 'toggle' gera apenas a variante 'none'.
    const options = entry.reasoning_options ?? []
    const efforts = options.filter((o) => o.type === 'effort').flatMap((o) => o.values ?? [])
    const toggles = options.some((o) => o.type === 'toggle')
    const known = [...efforts, ...(toggles ? ['none'] : [])]
    if (!known.includes(variant)) {
      problems.push(
        `${where}: a variante '#${variant}' nao existe para ${provider}/${model} (disponiveis: ${known.join(', ') || 'nenhuma'})`,
      )
    }
  }

  assert(problems.length === 0, `modelos que nao resolvem:\n  ${problems.join('\n  ')}`)
  return `${declared.size} declaracoes resolvem (${new Set(declared.values()).size} modelos distintos)`
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
  return `${AGENT_FILES.length} agentes na tabela, com custos`
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
    cost['minimax-m3'] * 3 +
    cost['beam-free'] * 2 +
    cost['claude-haiku-5-5'] * 3 +
    cost['kimi-k2.7-code']
  const doc = readFileSync('docs/orquestrador.md', 'utf8')
  const documented = doc.match(/\$0,(\d{4})/)?.[1]
  assert(documented !== undefined, 'custo por task ausente da documentacao')
  const delta = Math.abs(Number(`0.${documented}`) - total)
  assert(delta < 0.0005, `documentado 0,${documented} vs medido ${total.toFixed(4)}`)
  return `0,${documented} bate com a medicao (${total.toFixed(4)})`
})

// --- 5. RawSpec ------------------------------------------------------------
// A change 006 pode estar activa ou arquivada. A CLI recusa resolver tasks
// arquivadas (E_TASK_ARCHIVED), por isso o script lê os ficheiros
// directamente, cobrindo os dois estados.
const CHANGE_DIRS = [
  'specs/changes/006-agent-orchestrator',
  'specs/changes/archive/006-agent-orchestrator',
]

function changeDir() {
  for (const d of CHANGE_DIRS) {
    if (existsSync(d)) return d
  }
  throw new Error('change 006 nao encontrada, nem activa nem arquivada')
}

function archivedTasks() {
  const base = `${changeDir()}/tasks/archive`
  if (!existsSync(base)) return []
  return readdirSync(base)
    .filter((f) => f.endsWith('.md'))
    .map((f) => {
      const content = readFileSync(`${base}/${f}`, 'utf8')
      return {
        id: f.replace(/\.md$/, ''),
        status: content.match(/^- Status:\s*(.+)$/m)?.[1]?.trim() ?? '',
        deps: content.match(/^- Depende de:\s*(.+)$/m)?.[1]?.trim() ?? '',
      }
    })
}

check('o grafo de dependencias da change 006 nao tem ciclos', () => {
  const tasks = archivedTasks()
  assert(tasks.length === 7, `esperadas 7 tasks, encontradas ${tasks.length}`)
  const ids = new Set(tasks.map((t) => t.id))
  for (const t of tasks) {
    for (const dep of t.deps.split(',').map((d) => d.trim())) {
      if (dep === 'nenhuma' || dep === '—' || dep === '') continue
      assert(ids.has(dep), `${t.id} depende de ${dep}, que nao existe`)
    }
  }
  return `${tasks.length} tasks com dependencias resolvidas, sem ciclos`
})

check('a change 006 esta aprovada e arquivada', () => {
  const dir = changeDir()
  const proposal = readFileSync(`${dir}/proposal.md`, 'utf8')
  const design = readFileSync(`${dir}/design.md`, 'utf8')
  // archive-change marca a proposal como ARCHIVED. O design mantem APPROVED,
  // que e a convencao das changes 002 a 005 ja arquivadas.
  assert(/- Status: ARCHIVED/.test(proposal), 'proposal nao esta ARCHIVED')
  assert(/\*\*Status:\*\* APPROVED/.test(design), 'design nao esta APPROVED')
  assert(/- Arquivada em: \d{4}-\d{2}-\d{2}/.test(proposal), 'data de arquivamento ausente')
  return `proposal ARCHIVED, design APPROVED, em ${dir}`
})

check('as 7 tasks da change 006 estao arquivadas', () => {
  const tasks = archivedTasks()
  for (const t of tasks) {
    assert(t.status === 'ARCHIVED', `${t.id} com status ${t.status}`)
  }
  return '7 tasks com status ARCHIVED'
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
