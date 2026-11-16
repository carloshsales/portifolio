// Verifica a presenca de ficheiros e o estado do historico num ref.
//
// Uso: node scripts/inspect-ref.mjs <ref> [ficheiro...]

import { execFileSync } from 'node:child_process'

const REF = process.argv[2] ?? 'origin/main'
const FILES = process.argv.slice(3)

function exists(path, ref = REF) {
  try {
    execFileSync('git', ['cat-file', '-e', `${ref}:${path}`], { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

console.log(`ref: ${REF}`)
if (FILES.length) {
  for (const f of FILES) {
    console.log(`  ${exists(f) ? 'presente' : 'AUSENTE '} ${f}`)
  }
}

const text = execFileSync('git', ['show', `${REF}:docs/history.md`], {
  encoding: 'buffer',
  maxBuffer: 64 * 1024 * 1024,
}).toString('utf8')
const lines = text.split(/\r?\n/)
const headers = lines.filter((l) => l.startsWith('## '))
console.log(`\nhistory.md: ${headers.length} entradas`)
console.log(`  marcadores: ${lines.filter((l) => /^(<<<<<<<|=======|>>>>>>>)/.test(l)).length}`)
console.log(`  corrompidos: ${(text.match(/ÔÇö/g) ?? []).length}`)
console.log('\nultimas 5:')
for (const h of headers.slice(-5)) console.log(`  ${h}`)
