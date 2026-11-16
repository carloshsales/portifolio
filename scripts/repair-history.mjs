// Repara docs/history.md:
//  1. Remove as entradas duplicadas de TASK-006 e TASK-007 da change 005,
//     conservando a versão em UTF-8.
//  2. Corrige a codificacao corrompida das restantes entradas.
//
// Uso: node scripts/repair-history.mjs

import { readFileSync, writeFileSync } from 'node:fs'

const PATH = 'docs/history.md'
const raw = readFileSync(PATH, 'utf8')

// As entradas corrompidas foram escritas num encoding de byte unico. Os
// separadores de titulo aparecem como "ÔÇö" e os acentos como "\uFFFD".
const BROKEN_DASH = 'ÔÇö'
const EM_DASH = '—'
const REPLACEMENT = '\uFFFD'

// --- 1. Correcção de codificação -------------------------------------------
let content = raw.split(BROKEN_DASH).join(EM_DASH)

// --- 2. Remoção de entradas duplicadas -------------------------------------
// TASK-006 e TASK-007 da change 005 aparecem duas vezes. A segunda
// ocorrência está em UTF-8 correcto e é a versão mais precisa (refere 12
// tarefas, a primeira refere 13). Remove-se a primeira, corrompida.
const HEADER = /^## (\S+) — (Decisão|Evento|Detalhe) — (.+)$/gm

const headers = []
let match
while ((match = HEADER.exec(content)) !== null) {
  headers.push({ index: match.index, raw: match[0] })
}

const blocks = []
for (let i = 0; i < headers.length; i++) {
  const start = headers[i].index
  const end = i + 1 < headers.length ? headers[i + 1].index : content.length
  blocks.push({ header: headers[i].raw, body: content.slice(start, end) })
}

// Chave de identidade: o titulo da entrada, sem a data.
const keyOf = (header) => header.replace(/^##\s+\S+\s+—\s+\S+\s+—\s+/, '').trim()

const occurrences = new Map()
for (const block of blocks) {
  const key = keyOf(block.header)
  if (!occurrences.has(key)) {
    occurrences.set(key, [])
  }
  occurrences.get(key).push(block)
}

const toRemove = []
for (const [, group] of occurrences) {
  if (group.length < 2) continue
  // dentro de cada grupo, remove a primeira ocorrência que esteja corrompida
  const corruptIndex = group.findIndex((b) => b.body.includes(REPLACEMENT))
  if (corruptIndex !== -1) {
    toRemove.push(group[corruptIndex].body)
  } else {
    // sem corrupcao detectavel, remove a primeira e conserva a ultima
    toRemove.push(group[0].body)
  }
}

let removed = 0
for (const body of toRemove) {
  const idx = content.indexOf(body)
  if (idx !== -1) {
    content = content.slice(0, idx) + content.slice(idx + body.length)
    removed++
  }
}

content = content.replace(/\n{3,}/g, '\n\n').trimEnd() + '\n'

writeFileSync(PATH, content, 'utf8')

console.log(`entradas duplicadas removidas: ${removed}`)
console.log(
  `ocorrencias de codificacao corrompida restantes: ${content.split(REPLACEMENT).length - 1}`,
)
