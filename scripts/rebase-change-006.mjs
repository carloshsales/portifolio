// Reconstroi as sete branches da change 006 sobre o origin/main actual,
// resolvendo o conflito de docs/history.md pela uniao das entradas.
//
// Uso: node scripts/rebase-change-006.mjs [--push]
//
// Por cada branch:
//   1. cria uma branch temporaria sobre origin/main
//   2. faz merge da branch da task
//   3. resolve docs/history.md com scripts/merge-history.mjs
//   4. valida a integridade do historico resultante
//   5. publica a branch reconstruida
//
// Nao apaga ficheiros nao versionados: usa `git reset --merge`, que desfaz
// apenas o indice, e `git restore --staged` quando necessario.

import { execSync } from 'node:child_process'
import { readFileSync, writeFileSync, unlinkSync } from 'node:fs'

const BRANCHES = [
  'task/006-001-reparar-historico-e-integrar-agentes-md',
  'task/006-002-remover-worktrees-orfaos',
  'task/006-003-criar-configuracao-base-do-opencode',
  'task/006-004-criar-os-agentes-especializados',
  'task/006-005-criar-os-comandos-do-orquestrador',
  'task/006-006-documentar-o-orquestrador-e-registar-o-adr',
  'task/006-007-validar-o-orquestrador-ponta-a-ponta',
]

const TMP = 'tmp/rebuild-006'
const PUSH = process.argv.includes('--push')

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

// Le o conteudo de um blob git sem passar pelo shell. O shell do Windows
// descodifica a saida UTF-8 como CP1252, o que corrompe os separadores de
// titulo ("—" vira "ÔÇö") e invalida a comparacao de entradas.
function gitShow(path, ref = 'origin/main') {
  const tmpFile = `${process.env.TEMP ?? '.'}/opencode/git-show-${Date.now()}.md`
  try {
    execSync(`git show ${ref}:${path} > "${tmpFile}"`, {
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
      shell: 'C:\\Windows\\System32\\cmd.exe',
    })
    return readFileSync(tmpFile, 'utf8')
  } catch {
    return ''
  } finally {
    try {
      unlinkSync(tmpFile)
    } catch {
      /* ficheiro temporario ausente */
    }
  }
}

function historyHeaders(text) {
  return [...text.matchAll(/^## .*$/gm)].map((m) => m[0])
}

function key(header) {
  return header
    .replace(/^##\s+\S+\s*[—-]\s*\S+\s*[—-]\s*/, '')
    .replace(/[—-]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

// Resolve o conflito de docs/history.md pela uniao das entradas. Esta versao
// esta embutida para que o script seja auto-suficiente: o repositorio e
// mudado de branch durante a execucao e um ficheiro auxiliar nao sobreviveria.
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
    const k = key(trimmed.split('\n')[0])
    if (seen.has(k)) continue
    seen.add(k)
    unique.push(trimmed)
  }
  writeFileSync(path, unique.join('\n\n') + '\n', 'utf8')
  return { conflicts, entries: unique.length }
}

console.log('=== reconstruir branches da change 006 sobre origin/main ===\n')

const mainKeys = historyHeaders(gitShow('docs/history.md')).map(key)
let allOk = true

for (const branch of BRANCHES) {
  const slug = branch.replace('task/006-', '').split('-')[0]

  // 1. base limpa sobre origin/main
  sh(`git checkout -B ${TMP} origin/main`)

  // 2. merge da branch da task
  const merge = trySh(`git merge --no-commit --no-ff origin/${branch}`)

  // 3. resolver conflitos
  const conflicted = sh('git diff --name-only --diff-filter=U')
  if (conflicted) {
    for (const file of conflicted.split(/\r?\n/).filter(Boolean)) {
      if (file === 'docs/history.md') {
        const r = resolveHistoryUnion('docs/history.md')
        console.log(`      conflito resolvido: ${r.conflicts}, entradas: ${r.entries}`)
      } else {
        console.error(`ERRO: conflito inesperado em ${file} (branch ${branch})`)
        process.exit(1)
      }
    }
    sh('git add -A')
  }

  // 4. criar o commit de merge
  if (!merge.ok || conflicted) {
    trySh(`git commit --no-verify -m "merge: integra ${branch} em main"`)
  }

  // 5. validar a integridade do historico
  const text = readFileSync('docs/history.md', 'utf8')
  const headers = historyHeaders(text)
  const keys = headers.map(key)
  const dupes = keys.filter((k, i) => keys.indexOf(k) !== i)
  const markers = (text.match(/^<<<<<<<|^=======|^>>>>>>>/gm) ?? []).length
  const broken = (text.match(/\uFFFD/g) ?? []).length
  const missing = mainKeys.filter((k) => !keys.includes(k))

  const ok = dupes.length === 0 && markers === 0 && broken === 0 && missing.length === 0
  if (!ok) allOk = false

  console.log(
    `${ok ? 'OK   ' : 'FALHA'} ${slug}  entradas=${headers.length} dupes=${dupes.length} marcadores=${markers} broken=${broken} faltamDeMain=${missing.length}`,
  )
  for (const m of missing) console.log(`      falta: ${m}`)

  // 6. publicar
  if (PUSH) {
    const push = trySh(`git push --force-with-lease origin ${TMP}:${branch}`)
    console.log(`      ${push.ok ? 'publicado' : 'FALHOU o push'}: ${branch}`)
    if (!push.ok) allOk = false
  }
}

console.log(`\n=== ${allOk ? 'todas as branches reconstruidas com sucesso' : 'houve falhas'} ===`)
process.exit(allOk ? 0 : 1)
