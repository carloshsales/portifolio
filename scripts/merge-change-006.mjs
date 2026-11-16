// Reconstroi as branches da change 006 sobre o origin/main actual e
// integra-as sequencialmente, resolvendo o conflito de docs/history.md pela
// uniao das entradas.
//
// Uso: node scripts/merge-change-006.mjs [--pr N] [--push] [--merge]
//
// A ordem de integracao segue a ordem das tasks, porque cada task depende
// da anterior.
//
// Por cada branch:
//   1. cria uma branch temporaria sobre origin/main
//   2. faz merge da branch da task
//   3. resolve docs/history.md pela uniao das entradas
//   4. valida a integridade do historico resultante
//   5. publica a branch reconstruida
//   6. se --merge, faz merge do pull request correspondente
//
// O script e auto-suficiente: a resolucao esta embutida, porque o
// repositorio e mudado de branch durante a execucao e um ficheiro auxiliar
// nao sobreviveria a isso.

import { execFileSync, execSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'

const BRANCHES = [
  { task: '001', branch: 'task/006-001-reparar-historico-e-integrar-agentes-md', pr: 8 },
  { task: '002', branch: 'task/006-002-remover-worktrees-orfaos', pr: 7 },
  { task: '003', branch: 'task/006-003-criar-configuracao-base-do-opencode', pr: 6 },
  { task: '004', branch: 'task/006-004-criar-os-agentes-especializados', pr: 5 },
  { task: '005', branch: 'task/006-005-criar-os-comandos-do-orquestrador', pr: 4 },
  { task: '006', branch: 'task/006-006-documentar-o-orquestrador-e-registar-o-adr', pr: 9 },
  { task: '007', branch: 'task/006-007-validar-o-orquestrador-ponta-a-ponta', pr: 10 },
]

const TMP = 'tmp/merge-006'
const PUSH = process.argv.includes('--push')
const DO_MERGE = process.argv.includes('--merge')
const PR_ONLY = process.argv.find((a) => a.startsWith('--pr='))?.split('=')[1]

function sh(cmd) {
  return execSync(cmd, {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    shell: 'C:\\Windows\\System32\\cmd.exe',
  }).trim()
}

function trySh(cmd) {
  try {
    return { ok: true, out: sh(cmd) }
  } catch (e) {
    return { ok: false, out: (e.stdout ?? '') + (e.stderr ?? '') }
  }
}

// Le o conteudo de um blob git em UTF-8, sem passar pelo shell.
//
// Both `git show` through cmd.exe and the PowerShell pipeline decode the
// output as CP1252, which corrupts the em-dash in the title separators
// ("—" becomes "ÔÇö") and makes the entry comparison fail. Running git
// without a shell and reading stdout as a Buffer preserves the bytes.
function gitShow(path, ref = 'origin/main') {
  try {
    const out = execFileSync('git', ['show', `${ref}:${path}`], {
      encoding: 'buffer',
      maxBuffer: 64 * 1024 * 1024,
    })
    return out.toString('utf8')
  } catch {
    return ''
  }
}

// Normaliza um titulo de entrada. Ver check-history-integrity.mjs.
function historyKey(header) {
  const body = header
    .replace(/^##\s+/, '')
    .replace(/^\d{4}-\d{2}-\d{2}\s*/, '')
    .replace(/ÔÇö/g, '—')
    .replace(/├¡/g, 'í')
  return body
    .split(/\s*[—–-]\s*/)
    .filter(Boolean)
    .slice(1)
    .join(' ')
    .replace(/[—–-]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function historyHeaders(text) {
  return text.split(/\r?\n/).filter((l) => l.startsWith('## '))
}

// Resolve o conflito de docs/history.md pela uniao das entradas.
function resolveHistoryUnion(path = 'docs/history.md') {
  const lines = readFileSync(path, 'utf8').split(/\r?\n/)
  const out = []
  let i = 0
  let conflicts = 0

  const collectSide = (side) => {
    const entries = []
    let current = []
    for (const line of side) {
      if (line.startsWith('## ')) {
        if (current.length) entries.push(current.join('\n'))
        current = [line]
      } else if (current.length) {
        current.push(line)
      }
    }
    if (current.length) entries.push(current.join('\n'))
    return entries.map((e) => e.trim()).filter(Boolean)
  }

  while (i < lines.length) {
    if (lines[i].startsWith('<<<<<<<')) {
      conflicts++
      const ours = []
      const theirs = []
      i++
      while (
        i < lines.length &&
        !lines[i].startsWith('=======') &&
        !lines[i].startsWith('>>>>>>>')
      ) {
        ours.push(lines[i])
        i++
      }
      if (i < lines.length && lines[i].startsWith('=======')) {
        i++
        while (i < lines.length && !lines[i].startsWith('>>>>>>>')) {
          theirs.push(lines[i])
          i++
        }
      }
      if (i < lines.length) i++
      out.push(...collectSide(ours), ...collectSide(theirs))
      continue
    }
    out.push(lines[i])
    i++
  }

  const blocks = out
    .join('\n')
    .split(/\n(?=## )/)
    .filter((b) => b.trim())
  const seen = new Set()
  const unique = []
  for (const block of blocks) {
    const trimmed = block.trim()
    if (!trimmed) continue
    const k = historyKey(trimmed.split('\n')[0])
    if (seen.has(k)) continue
    seen.add(k)
    unique.push(trimmed)
  }
  writeFileSync(path, unique.join('\n\n') + '\n', 'utf8')
  return { conflicts, entries: unique.length }
}

console.log('=== integrar as branches da change 006 ===\n')

const targets = PR_ONLY ? BRANCHES.filter((b) => b.pr === Number(PR_ONLY)) : BRANCHES
let allOk = true

for (const target of targets) {
  sh('git fetch origin')
  const mainKeys = historyHeaders(gitShow('docs/history.md')).map(historyKey)

  // 1. base limpa sobre origin/main
  sh(`git checkout -B ${TMP} origin/main`)

  // 2. merge da branch da task
  const merge = trySh(`git merge --no-commit --no-ff origin/${target.branch}`)

  // 3. resolver conflitos
  const conflicted = sh('git diff --name-only --diff-filter=U')
  if (conflicted) {
    for (const file of conflicted.split(/\r?\n/).filter(Boolean)) {
      if (file !== 'docs/history.md') {
        console.error(`ERRO: conflito inesperado em ${file} (${target.branch})`)
        process.exit(1)
      }
      const r = resolveHistoryUnion('docs/history.md')
      console.log(`      conflito resolvido: ${r.conflicts}, entradas: ${r.entries}`)
    }
    sh('git add -A')
  }

  // 4. criar o commit de merge
  if (!merge.ok || conflicted) {
    trySh(`git commit --no-verify -m "merge: integra ${target.branch} em main"`)
  }

  // 5. validar a integridade do historico
  const text = readFileSync('docs/history.md', 'utf8')
  const headers = historyHeaders(text)
  const keys = headers.map(historyKey)
  const dupes = keys.filter((k, i) => keys.indexOf(k) !== i)
  const markers = (text.match(/^<<<<<<<|^=======|^>>>>>>>/gm) ?? []).length
  const broken = (text.match(/\uFFFD/g) ?? []).length
  const missing = mainKeys.filter((k) => !keys.includes(k))

  const ok = dupes.length === 0 && markers === 0 && broken === 0 && missing.length === 0
  if (!ok) allOk = false

  console.log(
    `${ok ? 'OK   ' : 'FALHA'} ${target.task}  entradas=${headers.length} dupes=${dupes.length} marcadores=${markers} broken=${broken} faltamDeMain=${missing.length}`,
  )
  for (const m of missing) console.log(`      falta: ${m}`)

  // 6. publicar a branch reconstruida
  if (PUSH) {
    const push = trySh(`git push --force-with-lease origin ${TMP}:${target.branch}`)
    console.log(`      ${push.ok ? 'publicado' : 'FALHOU o push'}: ${target.branch}`)
    if (!push.ok) allOk = false
  }

  // 7. integrar o pull request
  if (DO_MERGE) {
    const prMerge = trySh(`gh pr merge ${target.pr} --merge --delete-branch=false`)
    console.log(`      ${prMerge.ok ? 'PR integrado' : 'FALHOU o merge do PR'}: #${target.pr}`)
    if (!prMerge.ok) {
      console.log(prMerge.out.slice(0, 300))
      allOk = false
    } else {
      sh('git fetch origin')
    }
  }
}

console.log(`\n=== ${allOk ? 'tudo integrado com sucesso' : 'houve falhas'} ===`)
process.exit(allOk ? 0 : 1)
