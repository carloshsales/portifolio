// Verifica que os agentes do orquestrador sao descobertos pelo OpenCode,
// distinguindo erros reais do ruido do PowerShell.
//
// Uso: node bakeoff/check-agents.mjs

import { execSync } from 'node:child_process'

const AGENTS = [
  'orquestrador',
  'explorador',
  'analista-clareza',
  'implementador',
  'revisor',
  'revisor-b',
  'verificador',
  'guardiao',
]

function run(agent) {
  try {
    const out = execSync(
      `opencode run --agent ${agent} --model "opencode-go/beam-free" "Responde apenas: OK"`,
      {
        encoding: 'utf8',
        maxBuffer: 16 * 1024 * 1024,
        shell: 'C:\\Windows\\System32\\cmd.exe',
      },
    )
    const clean = out.replace(/\u001b\[[0-9;]*[A-Za-z]/g, '')
    const banner = clean
      .split('\n')
      .filter((l) => l.startsWith('> '))
      .pop()
    const err = clean.split('\n').find((l) => /^\s*Error:/.test(l))
    return { ok: !err, banner: banner ? banner.trim() : '', err: err ? err.trim() : '' }
  } catch (e) {
    const out = ((e.stdout ?? '') + (e.stderr ?? '')).replace(/\u001b\[[0-9;]*[A-Za-z]/g, '')
    const err = out.split('\n').find((l) => /^\s*Error:/.test(l))
    return { ok: false, banner: '', err: err ? err.trim() : e.message.slice(0, 140) }
  }
}

let failures = 0
for (const agent of AGENTS) {
  const r = run(agent)
  if (r.ok) {
    console.log(`${agent.padEnd(18)} OK    ${r.banner}`)
  } else {
    failures++
    console.log(`${agent.padEnd(18)} FALHOU ${r.err}`)
  }
}

console.log(`\n${AGENTS.length - failures}/${AGENTS.length} agentes descobertos`)
process.exit(failures === 0 ? 0 : 1)
