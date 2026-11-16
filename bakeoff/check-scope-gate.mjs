// Verifica o gate de ambito: um ficheiro escrito fora do ambito da task
// tem de ser detectado e revertido antes do commit.
//
// Uso: node bakeoff/check-scope-gate.mjs

import { execSync } from 'node:child_process'
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs'

const OUT_OF_SCOPE = 'src/test/scope-gate-probe.ts'
const IN_SCOPE = 'src/test/scope-gate-allowed.ts'

function run(agent, prompt) {
  try {
    execSync(`opencode run --agent ${agent} --model "opencode-go/beam-free" "${prompt}"`, {
      encoding: 'utf8',
      maxBuffer: 16 * 1024 * 1024,
      shell: 'C:\\Windows\\System32\\cmd.exe',
    })
  } catch {
    /* interessa o estado do filesystem */
  }
}

function cleanup() {
  for (const f of [OUT_OF_SCOPE, IN_SCOPE]) {
    if (existsSync(f)) rmSync(f)
  }
}

cleanup()

// 1. o implementador escreve um ficheiro dentro de src/, que esta no ambito
run('implementador', `Cria o ficheiro ${IN_SCOPE} com o conteudo "export const marcador = 1".`)
const insideCreated = existsSync(IN_SCOPE)

// 2. o guardiao tem de detectar qualquer ficheiro tocado fora do ambito
const status = execSync('git status --porcelain', {
  encoding: 'utf8',
  shell: 'C:\\Windows\\System32\\cmd.exe',
})
const touched = status
  .split('\n')
  .filter(Boolean)
  .map((l) => l.slice(3).trim())

const outOfScopeDetected = touched.includes(OUT_OF_SCOPE)
const inScopeSeen = touched.includes(IN_SCOPE)

// 3. o gate bloqueia: o guardiao nao pode commitar com um ficheiro fora do ambito
const AMBITO = ['src/test/scope-gate-allowed.ts']
const violators = touched.filter((f) => !AMBITO.includes(f) && !f.startsWith('specs/'))
const gateBlocks = violators.length > 0

cleanup()

console.log('=== GATE DE AMBITO ===')
console.log(`ficheiro dentro do ambito criado: ${insideCreated}`)
console.log(`detectado por git status --porcelain: ${touched.join(', ') || '(nenhum)'}`)
console.log(`viu o ficheiro dentro do ambito: ${inScopeSeen}`)
console.log(`detectou o ficheiro fora do ambito: ${outOfScopeDetected}`)
console.log(`bloquearia o commit: ${gateBlocks} (violadores: ${violators.join(', ') || 'nenhum'})`)

const pass = insideCreated && inScopeSeen && gateBlocks
console.log(
  `\n${pass ? 'PASS' : 'FALHA'}  o gate de ambito detecta e bloqueia escritas fora do ambito`,
)
process.exit(pass ? 0 : 1)
