// Recalcula o custo por task a partir da medicao do bake-off.
// Uso: node bakeoff/calc-cost.mjs

import { readFileSync } from 'node:fs'

const results = JSON.parse(readFileSync('bakeoff/results.json', 'utf8'))
const cost = Object.fromEntries(results.map((r) => [r.model.replace('opencode-go/', ''), r.cost]))

console.log('=== custos medidos por modelo ===')
for (const [m, c] of Object.entries(cost).sort((a, b) => a[1] - b[1])) {
  console.log(`${m.padEnd(22)} $${c.toFixed(5)}`)
}

const STEPS = [
  ['Orquestracao', 'minimax-m3'],
  ['Exploracao', 'beam-free'],
  ['Clareza', 'minimax-m3'],
  ['Implementacao', 'claude-haiku-5-5'],
  ['Verificacao exec', 'claude-haiku-5-5'],
  ['Verificacao aval', 'claude-haiku-5-5'],
  ['Revisao A', 'minimax-m3'],
  ['Revisao B', 'kimi-k2.7-code'],
  ['Registo', 'beam-free'],
]

console.log('\n=== custo por etapa do pipeline ===')
let total = 0
for (const [etapa, modelo] of STEPS) {
  console.log(`${etapa.padEnd(16)} ${modelo.padEnd(20)} $${cost[modelo].toFixed(4)}`)
  total += cost[modelo]
}

// revisao simples (sem revisor-b)
const simples = total - cost['kimi-k2.7-code']
// escalonamento do revisor: minimax-m3 -> kimi-k2.7-code
const escalonado = total - cost['minimax-m3'] + cost['kimi-k2.7-code'] * 2
// escalonamento duplo: implementador e revisor sobem para T2 (mimo-v2.6-pro)
const duplo = escalonado - cost['claude-haiku-5-5'] + cost['mimo-v2.6-pro']

console.log('\n=== custo por task ===')
console.log(`revisao em par          $${total.toFixed(4)}`)
console.log(`revisao simples         $${simples.toFixed(4)}`)
console.log(`com escalonamento       $${escalonado.toFixed(4)}`)
console.log(`com escalonamento duplo $${duplo.toFixed(4)}`)

console.log('\n=== cenarios ===')
for (const [nome, v] of [
  ['revisao em par', total],
  ['revisao simples', simples],
  ['escalonado', escalonado],
  ['escalonado duplo', duplo],
]) {
  console.log(
    `${nome.padEnd(20)} 12 tasks = $${(v * 12).toFixed(2)}   30 exec = $${(v * 30).toFixed(2)}`,
  )
}
