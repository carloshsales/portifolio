// Resolve conflitos de merge em docs/history.md preservando as duas
// propriedades do ficheiro: append-only e sem entradas duplicadas.
//
// O ficheiro e um log append-only. Duas branches que acrescentam entradas
// diferentes produzem um conflito textual, mas nao ha sobreposicao real:
// o resultado correcto e a uniao das entradas.
//
// Uso: node scripts/merge-history.mjs <ficheiro-em-conflito>
//
// Detecta os blocos <<<<<<< / ======= / >>>>>>>, separa as entradas de cada
// lado e reescreve o ficheiro com a uniao, sem duplicados.

import { readFileSync, writeFileSync } from 'node:fs'

const PATH = process.argv[2] ?? 'docs/history.md'
const raw = readFileSync(PATH, 'utf8')

const lines = raw.split(/\r?\n/)
const out = []
let i = 0
let conflicts = 0

// Separa um lado do conflito em entradas, usando o titulo como delimitador.
function collectSide(side) {
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
  const line = lines[i]
  if (line.startsWith('<<<<<<<')) {
    conflicts++
    const ours = []
    const theirs = []
    i++ // salta o marcador inicial
    while (i < lines.length && !lines[i].startsWith('=======') && !lines[i].startsWith('>>>>>>>')) {
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
    if (i < lines.length) i++ // salta >>>>>>>

    out.push(...collectSide(ours))
    out.push(...collectSide(theirs))
    continue
  }
  out.push(line)
  i++
}

// Reconstrói o ficheiro a partir das entradas, sem duplicados.
const text = out.join('\n')
const blocks = text.split(/\n(?=## )/).filter((b) => b.trim())

const seen = new Set()
const unique = []
for (const block of blocks) {
  const trimmed = block.trim()
  if (!trimmed) continue
  // chave: o titulo da entrada, normalizado. Os separadores de titulo
  // variam entre "-" e "—" consoante o encoding usado na escrita.
  const header = trimmed.split('\n')[0]
  const key = header
    .replace(/^##\s+\S+\s*[—-]\s*\S+\s*[—-]\s*/, '')
    .replace(/[—-]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
  if (seen.has(key)) continue
  seen.add(key)
  unique.push(trimmed)
}

writeFileSync(PATH, unique.join('\n\n') + '\n', 'utf8')

console.log(`conflitos resolvidos: ${conflicts}`)
console.log(`entradas no ficheiro: ${unique.length}`)
