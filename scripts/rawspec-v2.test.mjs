/**
 * Testes do parser v2 de mudanças e tarefas.
 *
 * TASK-003 da change 003-rawspec-v2.
 */

import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import {
  RawspecError,
  appendHistory,
  archiveChange,
  archiveTask,
  beginVerification,
  buildCommitMessage,
  buildDependencyGraph,
  checkArchiveChange,
  checkArchiveTask,
  createAdrSkeleton,
  failTask,
  isChangeApproved,
  listChangeDirs,
  listOpenTasks,
  listPendingChanges,
  listTaskFiles,
  migrateLegacyChange,
  normalizeTaskId,
  parseChange,
  parseTaskFile,
  resolveTask,
  resolveWithinRepo,
  selectNextTask,
  startTask,
  updateTaskFile,
  validateChangeApproval,
  validateDependencies,
  verifyTask,
} from './rawspec-v2.mjs'

let workDir

beforeEach(() => {
  workDir = mkdtempSync(join(tmpdir(), 'rawspec-v2-'))
})

afterEach(() => {
  rmSync(workDir, { recursive: true, force: true })
})

/**
 * Cria um arquivo de tarefa em uma mudança temporária.
 *
 * @param {string} content conteúdo do arquivo.
 * @param {string} [name] nome do arquivo.
 * @param {string} [changeName] nome da mudança.
 * @returns {string} caminho absoluto do arquivo.
 */
function writeTask(content, name = 'TASK-001.md', changeName = '003-test') {
  const tasksDir = join(workDir, changeName, 'tasks')
  mkdirSync(tasksDir, { recursive: true })
  const taskPath = join(tasksDir, name)
  writeFileSync(taskPath, content, 'utf8')
  return taskPath
}

/**
 * Cria uma mudança temporária com os arquivos informados.
 *
 * @param {string} name nome da mudança.
 * @param {Record<string, string>} files mapa de caminho relativo para conteúdo.
 * @returns {string} caminho absoluto da mudança.
 */
function writeChange(name, files) {
  const dir = join(workDir, name)
  for (const [file, content] of Object.entries(files)) {
    const fullPath = join(dir, file)
    mkdirSync(dirname(fullPath), { recursive: true })
    writeFileSync(fullPath, content, 'utf8')
  }
  return dir
}

/**
 * Executa uma função e captura o erro, se houver.
 *
 * @param {() => unknown} fn função a executar.
 * @returns {RawspecError|undefined} erro capturado ou `undefined`.
 */
function captureError(fn) {
  try {
    fn()
  } catch (error) {
    return error
  }
  return undefined
}

const FULL_TASK = `# TASK-001 — Exemplo completo

- Change: 003-test
- Status: COMPLETED
- Depende de: TASK-002, TASK-003
- Início: 2026-11-15
- Verificação: VERIFIED (2026-11-15) — testes aprovados
- Evidência: 42 testes
- Plano de ação: none

## Objetivo

Exemplo.
`

describe('normalizeTaskId', () => {
  it('normaliza TASK-3 para TASK-003', () => {
    expect(normalizeTaskId('TASK-3')).toBe('TASK-003')
  })

  it('aceita caixa diferente e espaços', () => {
    expect(normalizeTaskId('  task-7 ')).toBe('TASK-007')
  })

  it('recusa identificador fora do padrão', () => {
    const error = captureError(() => normalizeTaskId('TASK-AB'))
    expect(error).toBeInstanceOf(RawspecError)
    expect(error.code).toBe('E_ARGS')
  })
})

describe('parseTaskFile', () => {
  it('lê tarefa completa com todos os campos', () => {
    const task = parseTaskFile(writeTask(FULL_TASK))

    expect(task.id).toBe('TASK-001')
    expect(task.title).toBe('Exemplo completo')
    expect(task.change).toBe('003-test')
    expect(task.status).toBe('COMPLETED')
    expect(task.verification).toBe('VERIFIED')
    expect(task.evidence).toBe('42 testes')
    expect(task.dependencies).toEqual(['TASK-002', 'TASK-003'])
    expect(task.dependencySource).toBe('explicit')
    expect(task.actionPlan).toBeNull()
    expect(task.startedAt).toBe('2026-11-15')
    expect(task.archivedAt).toBeNull()
  })

  it('aplica defaults para campos ausentes', () => {
    const task = parseTaskFile(
      writeTask(`# TASK-002 — Mínimo\n\n- Change: 003-test\n- Depende de: nenhuma\n`),
    )

    expect(task.status).toBe('PENDING')
    expect(task.verification).toBe('PENDING')
    expect(task.evidence).toBeNull()
    expect(task.dependencies).toEqual([])
    expect(task.dependencySource).toBe('none')
    expect(task.startedAt).toBeNull()
  })

  it('lê status e verificação com negrito', () => {
    const task = parseTaskFile(
      writeTask(
        `# TASK-003 — Negrito\n\n- Change: 003-test\n- **Status:** IN PROGRESS\n- Depende de: nenhuma\n- **Verificação:** VERIFIED\n`,
      ),
    )

    expect(task.status).toBe('IN PROGRESS')
    expect(task.verification).toBe('VERIFIED')
  })

  it('trata Depende de — como sem dependência', () => {
    const task = parseTaskFile(
      writeTask(`# TASK-004 — Sem dependência\n\n- Change: 003-test\n- Depende de: —\n`),
    )

    expect(task.dependencies).toEqual([])
    expect(task.dependencySource).toBe('none')
  })

  it('lê tarefa arquivada', () => {
    const task = parseTaskFile(
      writeTask(
        `# TASK-005 — Arquivada\n\n- Change: 003-test\n- Status: ARCHIVED\n- Depende de: nenhuma\n- Verificação: VERIFIED\n- Arquivada em: 2026-11-15\n`,
      ),
    )

    expect(task.status).toBe('ARCHIVED')
    expect(task.archivedAt).toBe('2026-11-15')
  })

  it('lê plano de ação quando informado', () => {
    const task = parseTaskFile(
      writeTask(
        `# TASK-006 — Plano\n\n- Change: 003-test\n- Depende de: nenhuma\n- Plano de ação: specs/changes/003-test/action-plans/TASK-006-2026-11-15-falha.md\n`,
      ),
    )

    expect(task.actionPlan).toBe('specs/changes/003-test/action-plans/TASK-006-2026-11-15-falha.md')
  })

  it('recusa Depende de malformado com E_PARSE', () => {
    const taskPath = writeTask(
      `# TASK-007 — Dependência inválida\n\n- Change: 003-test\n- Depende de: TASK-AB\n`,
    )

    const error = captureError(() => parseTaskFile(taskPath))
    expect(error).toBeInstanceOf(RawspecError)
    expect(error.code).toBe('E_PARSE')
  })

  it('recusa Status desconhecido com E_PARSE', () => {
    const taskPath = writeTask(
      `# TASK-008 — Status inválido\n\n- Change: 003-test\n- Status: CONCLUIDA\n- Depende de: nenhuma\n`,
    )

    const error = captureError(() => parseTaskFile(taskPath))
    expect(error).toBeInstanceOf(RawspecError)
    expect(error.code).toBe('E_PARSE')
  })

  it('recusa Verificação desconhecida com E_PARSE', () => {
    const taskPath = writeTask(
      `# TASK-009 — Verificação inválida\n\n- Change: 003-test\n- Depende de: nenhuma\n- Verificação: OK\n`,
    )

    const error = captureError(() => parseTaskFile(taskPath))
    expect(error).toBeInstanceOf(RawspecError)
    expect(error.code).toBe('E_PARSE')
  })

  it('recusa Change ausente com E_PARSE', () => {
    const taskPath = writeTask(`# TASK-010 — Sem change\n\n- Depende de: nenhuma\n`)

    const error = captureError(() => parseTaskFile(taskPath))
    expect(error).toBeInstanceOf(RawspecError)
    expect(error.code).toBe('E_PARSE')
  })

  it('recusa Depende de ausente com E_DEPENDENCY_UNDECLARED', () => {
    const taskPath = writeTask(`# TASK-011 — Sem dependência\n\n- Change: 003-test\n`)

    const error = captureError(() => parseTaskFile(taskPath))
    expect(error).toBeInstanceOf(RawspecError)
    expect(error.code).toBe('E_DEPENDENCY_UNDECLARED')
  })

  it('recusa cabeçalho sem título com E_PARSE', () => {
    const taskPath = writeTask(`# TASK-012 — \n\n- Change: 003-test\n- Depende de: nenhuma\n`)

    const error = captureError(() => parseTaskFile(taskPath))
    expect(error).toBeInstanceOf(RawspecError)
    expect(error.code).toBe('E_PARSE')
  })

  it('recusa bloco de código não fechado com E_PARSE', () => {
    const taskPath = writeTask(
      `# TASK-013 — Bloco aberto\n\n- Change: 003-test\n- Depende de: nenhuma\n\n\`\`\`text\n- Status: COMPLETED\n`,
    )

    const error = captureError(() => parseTaskFile(taskPath))
    expect(error).toBeInstanceOf(RawspecError)
    expect(error.code).toBe('E_PARSE')
  })

  it('recusa UTF-8 inválido com E_PARSE', () => {
    const tasksDir = join(workDir, '003-test', 'tasks')
    mkdirSync(tasksDir, { recursive: true })
    const taskPath = join(tasksDir, 'TASK-014.md')
    writeFileSync(taskPath, Buffer.from([0xff, 0xfe, 0x00, 0x41]))

    const error = captureError(() => parseTaskFile(taskPath))
    expect(error).toBeInstanceOf(RawspecError)
    expect(error.code).toBe('E_PARSE')
  })

  it('ignora campos dentro de blocos de código', () => {
    const task = parseTaskFile(
      writeTask(
        `# TASK-015 — Fence\n\n- Change: 003-test\n- Depende de: nenhuma\n\n\`\`\`text\n- Status: COMPLETED\n- Verificação: VERIFIED\n\`\`\`\n`,
      ),
    )

    expect(task.status).toBe('PENDING')
    expect(task.verification).toBe('PENDING')
  })

  it('recusa campo conhecido duplicado com E_PARSE', () => {
    const taskPath = writeTask(
      `# TASK-016 — Duplicado\n\n- Change: 003-test\n- Status: PENDING\n- Status: COMPLETED\n- Depende de: nenhuma\n`,
    )

    const error = captureError(() => parseTaskFile(taskPath))
    expect(error).toBeInstanceOf(RawspecError)
    expect(error.code).toBe('E_PARSE')
  })
})

describe('parseChange', () => {
  const PROPOSAL = `# Change 003 — Teste\n\n- Status: APPROVED\n\n## 1. Objetivo\n`
  const DESIGN = `# Design — Teste\n\n**Status:** APPROVED\n\n## 1. Objetivo\n`
  const TASK = `# TASK-001 — Tarefa\n\n- Change: 003-test\n- Status: COMPLETED\n- Depende de: nenhuma\n`

  it('lê mudança completa', () => {
    const dir = writeChange('003-test', {
      'proposal.md': PROPOSAL,
      'design.md': DESIGN,
      'tasks/TASK-001.md': TASK,
    })

    const change = parseChange(dir)

    expect(change.id).toBe('003-test')
    expect(change.proposalStatus).toBe('APPROVED')
    expect(change.designStatus).toBe('APPROVED')
    expect(change.tasks).toHaveLength(1)
    expect(change.tasks[0].id).toBe('TASK-001')
  })

  it('aceita design ausente', () => {
    const dir = writeChange('003-test', {
      'proposal.md': PROPOSAL,
      'tasks/TASK-001.md': TASK,
    })

    const change = parseChange(dir)

    expect(change.designStatus).toBeNull()
  })

  it('recusa tasks.md legado com E_PARSE', () => {
    const dir = writeChange('003-test', {
      'proposal.md': PROPOSAL,
      'tasks.md': '# Legado\n\n### TASK-001 — Tarefa\n',
      'tasks/TASK-001.md': TASK,
    })

    const error = captureError(() => parseChange(dir))
    expect(error).toBeInstanceOf(RawspecError)
    expect(error.code).toBe('E_PARSE')
  })

  it('recusa diretório de tarefas ausente com E_PARSE', () => {
    const dir = writeChange('003-test', { 'proposal.md': PROPOSAL })

    const error = captureError(() => parseChange(dir))
    expect(error).toBeInstanceOf(RawspecError)
    expect(error.code).toBe('E_PARSE')
  })

  it('recusa Change divergente com E_PARSE', () => {
    const dir = writeChange('003-test', {
      'proposal.md': PROPOSAL,
      'tasks/TASK-001.md': `# TASK-001 — Tarefa\n\n- Change: outro-change\n- Depende de: nenhuma\n`,
    })

    const error = captureError(() => parseChange(dir))
    expect(error).toBeInstanceOf(RawspecError)
    expect(error.code).toBe('E_PARSE')
  })
})

describe('resolução, gates e transições', () => {
  const PROPOSAL = `# Change — Teste\n\n- Status: APPROVED\n\n## 1. Objetivo\n`
  const PROPOSAL_PENDING = `# Change — Teste\n\n- Status: PENDING APPROVAL\n\n## 1. Objetivo\n`
  const TASK = (id) =>
    `# ${id} — Tarefa\n\n- Change: 003-test\n- Status: PENDING\n- Depende de: nenhuma\n`

  function repoRoot() {
    return join(workDir, 'repo')
  }

  function writeRepoChange(name, files) {
    return writeChange(join('repo', 'specs', 'changes', name), files)
  }

  it('resolve a tarefa única', () => {
    writeRepoChange('003-test', {
      'proposal.md': PROPOSAL,
      'tasks/TASK-001.md': TASK('TASK-001'),
    })

    const resolved = resolveTask('TASK-001', { repoRoot: repoRoot() })

    expect(resolved.change.id).toBe('003-test')
    expect(resolved.task.id).toBe('TASK-001')
  })

  it('resolve com changeId', () => {
    writeRepoChange('003-test', {
      'proposal.md': PROPOSAL,
      'tasks/TASK-001.md': TASK('TASK-001'),
    })

    const resolved = resolveTask('TASK-001', { repoRoot: repoRoot(), changeId: '003' })

    expect(resolved.change.id).toBe('003-test')
  })

  it('recusa ambiguidade entre mudanças com E_TASK_AMBIGUOUS', () => {
    writeRepoChange('003-test', {
      'proposal.md': PROPOSAL,
      'tasks/TASK-001.md': TASK('TASK-001'),
    })
    writeRepoChange('004-test', {
      'proposal.md': PROPOSAL,
      'tasks/TASK-001.md': `# TASK-001 — Outra\n\n- Change: 004-test\n- Depende de: nenhuma\n`,
    })

    const error = captureError(() => resolveTask('TASK-001', { repoRoot: repoRoot() }))

    expect(error).toBeInstanceOf(RawspecError)
    expect(error.code).toBe('E_TASK_AMBIGUOUS')
  })

  it('recusa tarefa inexistente com E_TASK_NOT_FOUND', () => {
    writeRepoChange('003-test', {
      'proposal.md': PROPOSAL,
      'tasks/TASK-001.md': TASK('TASK-001'),
    })

    const error = captureError(() => resolveTask('TASK-999', { repoRoot: repoRoot() }))

    expect(error).toBeInstanceOf(RawspecError)
    expect(error.code).toBe('E_TASK_NOT_FOUND')
  })

  it('recusa tarefa apenas arquivada com E_TASK_ARCHIVED', () => {
    writeRepoChange('003-test', {
      'proposal.md': PROPOSAL,
      'tasks/archive/TASK-001.md': `# TASK-001 — Arquivada\n\n- Change: 003-test\n- Status: ARCHIVED\n- Depende de: nenhuma\n`,
    })

    const error = captureError(() => resolveTask('TASK-001', { repoRoot: repoRoot() }))

    expect(error).toBeInstanceOf(RawspecError)
    expect(error.code).toBe('E_TASK_ARCHIVED')
  })

  it('seleciona a primeira tarefa PENDING', () => {
    writeRepoChange('003-test', {
      'proposal.md': PROPOSAL,
      'tasks/TASK-001.md': TASK('TASK-001'),
      'tasks/TASK-002.md': TASK('TASK-002'),
    })

    const { task } = selectNextTask(repoRoot())

    expect(task.id).toBe('TASK-001')
  })

  it('recusa a primeira PENDING bloqueada com E_DEPENDENCY_PENDING', () => {
    writeRepoChange('003-test', {
      'proposal.md': PROPOSAL,
      'tasks/TASK-001.md': `# TASK-001 — Bloqueada\n\n- Change: 003-test\n- Status: PENDING\n- Depende de: TASK-002\n`,
      'tasks/TASK-002.md': TASK('TASK-002'),
    })

    const error = captureError(() => selectNextTask(repoRoot()))

    expect(error).toBeInstanceOf(RawspecError)
    expect(error.code).toBe('E_DEPENDENCY_PENDING')
  })

  it('recusa seleção sem tarefas pendentes com E_NOTHING_TO_START', () => {
    writeRepoChange('003-test', {
      'proposal.md': PROPOSAL,
      'tasks/TASK-001.md': `# TASK-001 — Concluída\n\n- Change: 003-test\n- Status: COMPLETED\n- Depende de: nenhuma\n- Verificação: VERIFIED\n`,
    })

    const error = captureError(() => selectNextTask(repoRoot()))

    expect(error).toBeInstanceOf(RawspecError)
    expect(error.code).toBe('E_NOTHING_TO_START')
  })

  it('recusa mudança não aprovada com E_CHANGE_NOT_APPROVED', () => {
    writeRepoChange('003-test', {
      'proposal.md': PROPOSAL_PENDING,
      'tasks/TASK-001.md': TASK('TASK-001'),
    })

    const error = captureError(() => selectNextTask(repoRoot()))

    expect(error).toBeInstanceOf(RawspecError)
    expect(error.code).toBe('E_CHANGE_NOT_APPROVED')
    expect(isChangeApproved(parseChange(join(repoRoot(), 'specs', 'changes', '003-test')))).toBe(
      false,
    )
  })

  it('valida dependências completas', () => {
    const tasks = [
      {
        id: 'TASK-001',
        dependencies: ['TASK-002'],
        status: 'PENDING',
        verification: 'PENDING',
        dependencySource: 'explicit',
      },
      {
        id: 'TASK-002',
        dependencies: [],
        status: 'COMPLETED',
        verification: 'VERIFIED',
        dependencySource: 'none',
      },
    ]

    expect(validateDependencies(tasks[0], tasks)).toBe(tasks[0])
  })

  it('recusa dependência pendente', () => {
    const tasks = [
      {
        id: 'TASK-001',
        dependencies: ['TASK-002'],
        status: 'PENDING',
        verification: 'PENDING',
        dependencySource: 'explicit',
      },
      {
        id: 'TASK-002',
        dependencies: [],
        status: 'IN PROGRESS',
        verification: 'PENDING',
        dependencySource: 'none',
      },
    ]

    const error = captureError(() => validateDependencies(tasks[0], tasks))

    expect(error.code).toBe('E_DEPENDENCY_PENDING')
  })

  it('recusa dependência inexistente', () => {
    const tasks = [
      {
        id: 'TASK-001',
        dependencies: ['TASK-999'],
        status: 'PENDING',
        verification: 'PENDING',
        dependencySource: 'explicit',
      },
    ]

    const error = captureError(() => validateDependencies(tasks[0], tasks))

    expect(error.code).toBe('E_DEPENDENCY_UNKNOWN')
  })

  it('recusa autodependência', () => {
    const tasks = [
      {
        id: 'TASK-001',
        dependencies: ['TASK-001'],
        status: 'PENDING',
        verification: 'PENDING',
        dependencySource: 'explicit',
      },
    ]

    const error = captureError(() => validateDependencies(tasks[0], tasks))

    expect(error.code).toBe('E_DEPENDENCY_CYCLE')
  })

  it('recusa ciclo de dependências', () => {
    const tasks = [
      {
        id: 'TASK-001',
        dependencies: ['TASK-002'],
        status: 'PENDING',
        verification: 'PENDING',
        dependencySource: 'explicit',
      },
      {
        id: 'TASK-002',
        dependencies: ['TASK-001'],
        status: 'PENDING',
        verification: 'PENDING',
        dependencySource: 'explicit',
      },
    ]

    const error = captureError(() => validateDependencies(tasks[0], tasks))

    expect(error.code).toBe('E_DEPENDENCY_CYCLE')
  })

  it('constroi o grafo de dependências', () => {
    const tasks = [
      {
        id: 'TASK-001',
        dependencies: ['TASK-002', 'TASK-999'],
        status: 'PENDING',
        verification: 'PENDING',
        dependencySource: 'explicit',
      },
      {
        id: 'TASK-002',
        dependencies: [],
        status: 'COMPLETED',
        verification: 'VERIFIED',
        dependencySource: 'none',
      },
    ]

    const { graph } = buildDependencyGraph(tasks)

    expect(graph.get('TASK-001')).toEqual(['TASK-002'])
    expect(graph.get('TASK-002')).toEqual([])
  })

  it('inicia, verifica e conclui uma tarefa', () => {
    writeRepoChange('003-test', {
      'proposal.md': PROPOSAL,
      'tasks/TASK-001.md': TASK('TASK-001'),
    })

    const started = startTask(repoRoot(), 'TASK-001', { today: '2026-11-15' })
    expect(started.status).toBe('IN PROGRESS')
    expect(started.startedAt).toBe('2026-11-15')

    const verifying = beginVerification(repoRoot(), 'TASK-001')
    expect(verifying.status).toBe('VERIFYING')

    const completed = verifyTask(repoRoot(), 'TASK-001', {
      evidence: 'testes aprovados',
      today: '2026-11-15',
    })
    expect(completed.status).toBe('COMPLETED')
    expect(completed.verification).toBe('VERIFIED')
    expect(completed.evidence).toBe('testes aprovados')
  })

  it('exige evidência para verificar', () => {
    writeRepoChange('003-test', {
      'proposal.md': PROPOSAL,
      'tasks/TASK-001.md': TASK('TASK-001'),
    })
    startTask(repoRoot(), 'TASK-001', { today: '2026-11-15' })
    beginVerification(repoRoot(), 'TASK-001')

    const error = captureError(() => verifyTask(repoRoot(), 'TASK-001', { evidence: '   ' }))

    expect(error).toBeInstanceOf(RawspecError)
    expect(error.code).toBe('E_EVIDENCE_REQUIRED')
  })

  it('registra falha e mantém a tarefa aberta', () => {
    writeRepoChange('003-test', {
      'proposal.md': PROPOSAL,
      'tasks/TASK-001.md': TASK('TASK-001'),
    })
    startTask(repoRoot(), 'TASK-001', { today: '2026-11-15' })
    beginVerification(repoRoot(), 'TASK-001')

    const failed = failTask(repoRoot(), 'TASK-001', {
      evidence: 'lint falhou',
      today: '2026-11-15',
    })

    expect(failed.status).toBe('IN PROGRESS')
    expect(failed.verification).toBe('FAILED')
  })

  it('recusa transição de estado inválida', () => {
    writeRepoChange('003-test', {
      'proposal.md': PROPOSAL,
      'tasks/TASK-001.md': TASK('TASK-001'),
    })

    const error = captureError(() => beginVerification(repoRoot(), 'TASK-001'))

    expect(error.code).toBe('E_TASK_STATE')
  })

  it('lista tarefas abertas e mudanças pendentes', () => {
    writeRepoChange('003-test', {
      'proposal.md': PROPOSAL,
      'tasks/TASK-001.md': `# TASK-001 — Aberta\n\n- Change: 003-test\n- Status: IN PROGRESS\n- Depende de: nenhuma\n`,
      'tasks/TASK-002.md': TASK('TASK-002'),
    })

    expect(listOpenTasks(repoRoot()).map((entry) => entry.task.id)).toEqual(['TASK-001'])
    expect(listPendingChanges(repoRoot()).map((entry) => entry.change.id)).toEqual(['003-test'])
  })

  it('preserva LF em atualizações', () => {
    const file = join(workDir, 'lf.md')
    writeFileSync(
      file,
      '# TASK-001 — LF\n\n- Change: 003-test\n- Status: PENDING\n- Depende de: nenhuma\n',
      'utf8',
    )

    updateTaskFile(file, { Status: 'IN PROGRESS' })

    const content = readFileSync(file, 'utf8')
    expect(content).toContain('\n')
    expect(content).not.toContain('\r\n')
  })

  it('preserva CRLF em atualizações', () => {
    const file = join(workDir, 'crlf.md')
    writeFileSync(
      file,
      '# TASK-001 — CRLF\r\n\r\n- Change: 003-test\r\n- Status: PENDING\r\n- Depende de: nenhuma\r\n',
      'utf8',
    )

    updateTaskFile(file, { Status: 'IN PROGRESS' })

    expect(readFileSync(file, 'utf8')).toContain('\r\n')
  })

  it('não deixa arquivo temporário após sucesso', () => {
    const file = join(workDir, 'ok.md')
    writeFileSync(
      file,
      '# TASK-001 — OK\n\n- Change: 003-test\n- Status: PENDING\n- Depende de: nenhuma\n',
      'utf8',
    )

    updateTaskFile(file, { Status: 'IN PROGRESS' })

    expect(existsSync(`${file}.tmp`)).toBe(false)
  })

  it('restaura o conteúdo original quando a gravação falha', () => {
    const file = join(workDir, 'atomic.md')
    const original =
      '# TASK-001 — Atômica\n\n- Change: 003-test\n- Status: PENDING\n- Depende de: nenhuma\n'
    writeFileSync(file, original, 'utf8')

    let removed = false
    const io = {
      writeFileSync,
      renameSync: () => {
        throw new Error('falha simulada')
      },
      rmSync: (path) => {
        removed = true
        rmSync(path, { force: true })
      },
    }

    const error = captureError(() => updateTaskFile(file, { Status: 'IN PROGRESS' }, io))

    expect(error).toBeInstanceOf(RawspecError)
    expect(error.code).toBe('E_IO')
    expect(readFileSync(file, 'utf8')).toBe(original)
    expect(removed).toBe(true)
    expect(existsSync(`${file}.tmp`)).toBe(false)
  })
})

describe('arquivamento de tarefa e mudança', () => {
  const PROPOSAL = `# Change — Teste\n\n- Status: APPROVED\n\n## 1. Objetivo\n`
  const TASK_DONE = `# TASK-001 — Concluída\n\n- Change: 003-test\n- Status: COMPLETED\n- Depende de: nenhuma\n- Verificação: VERIFIED (2026-11-15) — testes\n`
  const ARCHIVED_TASK = `# TASK-001 — A\n\n- Change: 003-test\n- Status: ARCHIVED\n- Depende de: nenhuma\n- Verificação: VERIFIED\n`

  function repoRoot() {
    return join(workDir, 'repo')
  }

  function writeRepoChange(name, files) {
    return writeChange(join('repo', 'specs', 'changes', name), files)
  }

  it('arquiva tarefa concluída e verificada', () => {
    writeRepoChange('003-test', {
      'proposal.md': PROPOSAL,
      'tasks/TASK-001.md': TASK_DONE,
    })

    const archived = archiveTask(repoRoot(), 'TASK-001', {
      approved: true,
      today: '2026-11-15',
    })

    expect(archived.status).toBe('ARCHIVED')
    expect(archived.archivedAt).toBe('2026-11-15')
    expect(
      existsSync(
        join(repoRoot(), 'specs', 'changes', '003-test', 'tasks', 'archive', 'TASK-001.md'),
      ),
    ).toBe(true)
    expect(
      existsSync(join(repoRoot(), 'specs', 'changes', '003-test', 'tasks', 'TASK-001.md')),
    ).toBe(false)
  })

  it('recusa tarefa sem verificação', () => {
    writeRepoChange('003-test', {
      'proposal.md': PROPOSAL,
      'tasks/TASK-001.md': `# TASK-001 — Pendente\n\n- Change: 003-test\n- Status: PENDING\n- Depende de: nenhuma\n`,
    })

    const error = captureError(() => archiveTask(repoRoot(), 'TASK-001', { approved: true }))

    expect(error).toBeInstanceOf(RawspecError)
    expect(error.code).toBe('E_ARCHIVE_TASK_BLOCKED')
    expect(
      existsSync(
        join(repoRoot(), 'specs', 'changes', '003-test', 'tasks', 'archive', 'TASK-001.md'),
      ),
    ).toBe(false)
  })

  it('recusa tarefa com plano não resolvido', () => {
    writeRepoChange('003-test', {
      'proposal.md': PROPOSAL,
      'tasks/TASK-001.md': `# TASK-001 — Plano\n\n- Change: 003-test\n- Status: COMPLETED\n- Depende de: nenhuma\n- Verificação: VERIFIED\n- Plano de ação: specs/changes/003-test/action-plans/TASK-001-2026-11-15-x.md\n`,
      'action-plans/TASK-001-2026-11-15-x.md': `# Plano\n\n- Status: PENDING ACCEPTANCE\n`,
    })

    const error = captureError(() => archiveTask(repoRoot(), 'TASK-001', { approved: true }))

    expect(error.code).toBe('E_ARCHIVE_TASK_BLOCKED')
  })

  it('recusa sem aprovação humana', () => {
    writeRepoChange('003-test', {
      'proposal.md': PROPOSAL,
      'tasks/TASK-001.md': TASK_DONE,
    })

    const error = captureError(() => archiveTask(repoRoot(), 'TASK-001', { approved: false }))

    expect(error.code).toBe('E_APPROVAL_REQUIRED')
  })

  it('é idempotente para tarefa já arquivada', () => {
    writeRepoChange('003-test', {
      'proposal.md': PROPOSAL,
      'tasks/archive/TASK-001.md': ARCHIVED_TASK,
    })

    const archived = archiveTask(repoRoot(), 'TASK-001', { approved: true })

    expect(archived.status).toBe('ARCHIVED')
  })

  it('arquiva mudança com todas as tarefas arquivadas', () => {
    writeRepoChange('003-test', {
      'proposal.md': PROPOSAL,
      'tasks/archive/TASK-001.md': ARCHIVED_TASK,
      'tasks/archive/TASK-002.md': `# TASK-002 — B\n\n- Change: 003-test\n- Status: ARCHIVED\n- Depende de: TASK-001\n- Verificação: VERIFIED\n`,
    })

    const result = archiveChange(repoRoot(), '003-test', {
      approved: true,
      today: '2026-11-15',
    })

    expect(result.alreadyArchived).toBe(false)
    const proposal = readFileSync(join(result.archivedDir, 'proposal.md'), 'utf8')
    expect(proposal).toContain('Status: ARCHIVED')
    expect(proposal).toContain('Arquivada em: 2026-11-15')
  })

  it('é idempotente para mudança já arquivada', () => {
    const archiveDir = join(repoRoot(), 'specs', 'changes', 'archive', '003-test')
    mkdirSync(join(archiveDir, 'tasks'), { recursive: true })
    writeFileSync(join(archiveDir, 'proposal.md'), '# Change\n\n- Status: ARCHIVED\n', 'utf8')

    const result = archiveChange(repoRoot(), '003-test', { approved: true })

    expect(result.alreadyArchived).toBe(true)
  })

  it('recusa mudança com tarefa não arquivada', () => {
    writeRepoChange('003-test', {
      'proposal.md': PROPOSAL,
      'tasks/TASK-001.md': TASK_DONE,
    })

    const error = captureError(() => archiveChange(repoRoot(), '003-test', { approved: true }))

    expect(error.code).toBe('E_ARCHIVE_CHANGE_BLOCKED')
    expect(existsSync(join(repoRoot(), 'specs', 'changes', 'archive', '003-test'))).toBe(false)
  })

  it('recusa mudança sem tarefas', () => {
    writeRepoChange('003-test', {
      'proposal.md': PROPOSAL,
      'tasks/.gitkeep': '',
    })

    const error = captureError(() => archiveChange(repoRoot(), '003-test', { approved: true }))

    expect(error.code).toBe('E_ARCHIVE_CHANGE_BLOCKED')
  })

  it('recusa destino existente sem Status ARCHIVED', () => {
    writeRepoChange('003-test', {
      'proposal.md': PROPOSAL,
      'tasks/archive/TASK-001.md': ARCHIVED_TASK,
    })
    const archiveDir = join(repoRoot(), 'specs', 'changes', 'archive', '003-test')
    mkdirSync(archiveDir, { recursive: true })
    writeFileSync(join(archiveDir, 'proposal.md'), PROPOSAL, 'utf8')

    const error = captureError(() => archiveChange(repoRoot(), '003-test', { approved: true }))

    expect(error.code).toBe('E_ARCHIVE_STATE_UNKNOWN')
  })

  it('recusa caminho de plano fora do repositório', () => {
    writeRepoChange('003-test', {
      'proposal.md': PROPOSAL,
      'tasks/TASK-001.md': `# TASK-001 — Plano externo\n\n- Change: 003-test\n- Status: COMPLETED\n- Depende de: nenhuma\n- Verificação: VERIFIED\n- Plano de ação: ../fora.md\n`,
    })

    const error = captureError(() => checkArchiveTask(repoRoot(), 'TASK-001'))

    expect(error.code).toBe('E_PATH_ESCAPE')
  })

  it('checkArchiveTask relata bloqueadores', () => {
    writeRepoChange('003-test', {
      'proposal.md': PROPOSAL,
      'tasks/TASK-001.md': `# TASK-001 — Pendente\n\n- Change: 003-test\n- Status: PENDING\n- Depende de: nenhuma\n`,
    })

    const result = checkArchiveTask(repoRoot(), 'TASK-001')

    expect(result.eligible).toBe(false)
    expect(result.blockers.length).toBeGreaterThan(0)
  })

  it('checkArchiveChange relata tarefas não arquivadas', () => {
    writeRepoChange('003-test', {
      'proposal.md': PROPOSAL,
      'tasks/TASK-001.md': TASK_DONE,
    })

    const result = checkArchiveChange(repoRoot(), '003-test')

    expect(result.eligible).toBe(false)
    expect(result.blockers.some((blocker) => blocker.includes('tarefas não arquivadas'))).toBe(true)
  })

  it('resolveWithinRepo recusa escape', () => {
    const error = captureError(() => resolveWithinRepo(repoRoot(), '../fora'))

    expect(error).toBeInstanceOf(RawspecError)
    expect(error.code).toBe('E_PATH_ESCAPE')
  })
})

describe('histórico e ADRs', () => {
  function repoRoot() {
    return join(workDir, 'repo')
  }

  const BASE_ENTRY = {
    type: 'Decisão',
    title: 'Decisão de teste',
    author: 'Autor',
    origin: 'sessão',
    message: 'Decisão X',
    reason: 'Motivo',
    impact: 'Impacto',
    evidence: 'Evidência',
    date: '2026-11-15',
  }

  it('acrescenta entrada válida ao histórico', () => {
    const result = appendHistory(repoRoot(), BASE_ENTRY)
    const content = readFileSync(result.path, 'utf8')

    expect(content).toContain('## 2026-11-15 — Decisão — Decisão de teste')
    expect(content).toContain('- Autor: Autor')
    expect(content).toContain('- Decisão: Decisão X')
    expect(content).toContain('- Evidência: Evidência')
  })

  it('não reescreve entradas existentes', () => {
    const root = repoRoot()
    appendHistory(root, { ...BASE_ENTRY, title: 'Primeira' })
    appendHistory(root, { ...BASE_ENTRY, type: 'Evento', title: 'Segunda' })
    const content = readFileSync(join(root, 'docs', 'history.md'), 'utf8')

    expect(content).toContain('Primeira')
    expect(content).toContain('Segunda')
    expect(content.indexOf('Primeira')).toBeLessThan(content.indexOf('Segunda'))
  })

  it('recusa tipo inválido', () => {
    const error = captureError(() => appendHistory(repoRoot(), { ...BASE_ENTRY, type: 'XXX' }))

    expect(error).toBeInstanceOf(RawspecError)
    expect(error.code).toBe('E_HISTORY_INVALID')
  })

  it('recusa campos obrigatórios ausentes', () => {
    const error = captureError(() =>
      appendHistory(repoRoot(), { type: 'Decisão', title: 'Sem mensagem' }),
    )

    expect(error.code).toBe('E_HISTORY_INVALID')
  })

  it('cria esqueleto de ADR', () => {
    const adr = createAdrSkeleton(repoRoot(), { title: 'Uma tarefa por arquivo' })
    const content = readFileSync(adr.path, 'utf8')

    expect(adr.id).toBe('ADR-001')
    expect(content).toContain('- Status: Proposed')
    expect(content).toContain('# ADR-001: Uma tarefa por arquivo')
  })

  it('incrementa o número do ADR', () => {
    const root = repoRoot()
    createAdrSkeleton(root, { title: 'Primeiro' })
    const second = createAdrSkeleton(root, { title: 'Segundo' })

    expect(second.id).toBe('ADR-002')
  })

  it('recusa ADR duplicado', () => {
    const root = repoRoot()
    createAdrSkeleton(root, { id: 1, title: 'Duplicado' })
    const error = captureError(() => createAdrSkeleton(root, { id: 1, title: 'Duplicado' }))

    expect(error.code).toBe('E_ADR_EXISTS')
  })
})

describe('mensagem de commit', () => {
  const PROPOSAL = `# Change — Teste\n\n- Status: APPROVED\n\n## 1. Objetivo\n`
  const DONE = `# TASK-001 — Implementar\n\n- Change: 003-test\n- Status: COMPLETED\n- Depende de: nenhuma\n- Verificação: VERIFIED\n- Evidência: testes\n`

  function repoRoot() {
    return join(workDir, 'repo')
  }

  function writeRepoChange(files) {
    return writeChange(join('repo', 'specs', 'changes', '003-test'), files)
  }

  it('gera mensagem para tarefa concluída', () => {
    writeRepoChange({ 'proposal.md': PROPOSAL, 'tasks/TASK-001.md': DONE })

    const message = buildCommitMessage(repoRoot(), 'TASK-001', { tests: 'pnpm test' })

    expect(message).toContain('feat(rawspec): Implementar')
    expect(message).toContain('Change: 003-test')
    expect(message).toContain('Task: TASK-001')
    expect(message).toContain('Tests: pnpm test')
    expect(message).toContain('Evidence: testes')
    expect(message).toContain('Action-Plan: none')
  })

  it('recusa tarefa incompleta', () => {
    writeRepoChange({
      'proposal.md': PROPOSAL,
      'tasks/TASK-001.md': `# TASK-001 — Pendente\n\n- Change: 003-test\n- Status: PENDING\n- Depende de: nenhuma\n`,
    })

    const error = captureError(() => buildCommitMessage(repoRoot(), 'TASK-001'))

    expect(error).toBeInstanceOf(RawspecError)
    expect(error.code).toBe('E_COMMIT_MESSAGE_BLOCKED')
  })

  it('recusa tipo de commit inválido', () => {
    writeRepoChange({ 'proposal.md': PROPOSAL, 'tasks/TASK-001.md': DONE })

    const error = captureError(() => buildCommitMessage(repoRoot(), 'TASK-001', { type: 'xyz' }))

    expect(error.code).toBe('E_ARGS')
  })
})

describe('comandos v2', () => {
  const REPO_ROOT = join(import.meta.dirname, '..')
  const COMMANDS = ['startspec', 'continuespec', 'arquivespec', 'archivespec']

  it.each(COMMANDS)('%s existe e referencia o helper', (name) => {
    const commandPath = join(REPO_ROOT, '.opencode', 'commands', `${name}.md`)
    const content = readFileSync(commandPath, 'utf8')

    expect(content).toContain('argument-hint:')
    expect(content).toContain('rawspec-v2-cli.mjs')
    expect(content).toContain('Nunca faça `git commit` nem `git push`')
  })
})

describe('migração de mudança legada', () => {
  const LEGACY = `# Plano de Implementação — 001 Portfolio MVP

**Status:** APPROVED

## Fase 1 — Fundação

### TASK-001 — Inicializar aplicação
- **Status:** COMPLETED (2026-11-12)
- **Verificação:** VERIFIED (2026-11-12) — lint aprovado
- Criar aplicação React + TypeScript + Vite.

**Aceitação:** aplicação inicia localmente.

### TASK-002 — Configurar qualidade
- **Status:** PENDING
- Instalar ESLint.

**Aceitação:** hooks funcionam.

### TASK-003 — Configurar estilos
- **Status:** PENDING
- Definir paleta de cores.

**Aceitação:** identidade disponível.
`

  function repoRoot() {
    return join(workDir, 'repo')
  }

  it('migra tasks.md para arquivos individuais', () => {
    const dir = writeChange(join('repo', 'specs', 'changes', '001-portfolio-mvp'), {
      'proposal.md': '# Change\n\n- Status: APPROVED\n\n## 1. Objetivo\n',
      'tasks.md': LEGACY,
    })

    const result = migrateLegacyChange(dir, { today: '2026-11-15' })

    expect(result).toHaveLength(3)
    expect(result[0].archived).toBe(true)
    expect(result[1].archived).toBe(false)
    expect(existsSync(join(dir, 'tasks.md'))).toBe(false)

    const change = parseChange(dir)
    expect(change.tasks.map((task) => task.id)).toEqual(['TASK-002', 'TASK-003'])
    expect(change.tasks[0].dependencies).toEqual(['TASK-001'])
    expect(change.tasks[1].dependencies).toEqual(['TASK-002'])

    const all = listTaskFiles(dir, { includeArchived: true }).map(parseTaskFile)
    expect(all.map((task) => task.id)).toEqual(['TASK-001', 'TASK-002', 'TASK-003'])
    expect(all[0].status).toBe('ARCHIVED')
    expect(all[0].verification).toBe('VERIFIED')
    expect(all[0].evidence).toBe('lint aprovado')
    expect(change.tasks[0].status).toBe('PENDING')
    expect(change.tasks[0].dependencySource).toBe('explicit')

    expect(() => validateDependencies(change.tasks[0], all)).not.toThrow()
  })

  it('seleciona a próxima tarefa com dependência arquivada', () => {
    writeChange(join('repo', 'specs', 'changes', '001-portfolio-mvp'), {
      'proposal.md': '# Change\n\n- Status: APPROVED\n\n## 1. Objetivo\n',
      'tasks/archive/TASK-001.md': `# TASK-001 — A\n\n- Change: 001-portfolio-mvp\n- Status: ARCHIVED\n- Depende de: nenhuma\n- Verificação: VERIFIED\n`,
      'tasks/TASK-002.md': `# TASK-002 — B\n\n- Change: 001-portfolio-mvp\n- Status: PENDING\n- Depende de: TASK-001\n`,
    })

    const { task } = selectNextTask(repoRoot(), { changeId: '001-portfolio-mvp' })

    expect(task.id).toBe('TASK-002')
  })

  it('recusa migração sem tasks.md', () => {
    const dir = writeChange(join('repo', 'specs', 'changes', '001-portfolio-mvp'), {
      'proposal.md': '# Change\n\n- Status: APPROVED\n\n## 1. Objetivo\n',
    })

    const error = captureError(() => migrateLegacyChange(dir))

    expect(error).toBeInstanceOf(RawspecError)
    expect(error.code).toBe('E_PARSE')
  })
})

describe('scan de mudanças', () => {
  const PROPOSAL = `# Change — Teste\n\n- Status: APPROVED\n\n## 1. Objetivo\n`
  const TASK = `# TASK-001 — Tarefa\n\n- Change: 003-test\n- Status: PENDING\n- Depende de: nenhuma\n`

  function repoRoot() {
    return join(workDir, 'repo')
  }

  function writeRepoChange(name, files) {
    return writeChange(join('repo', 'specs', 'changes', name), files)
  }

  it('ignora mudanças SUPERSEDED com formato legado', () => {
    writeRepoChange('003-test', { 'proposal.md': PROPOSAL, 'tasks/TASK-001.md': TASK })
    writeRepoChange('002-legado', {
      'proposal.md': '# Change\n\n- Status: SUPERSEDED\n\n## 1. Objetivo\n',
      'tasks.md': '# Legado\n\n### TASK-001 — Legada\n',
    })

    expect(listPendingChanges(repoRoot()).map((entry) => entry.change.id)).toEqual(['003-test'])
    expect(listOpenTasks(repoRoot())).toEqual([])
    expect(() => resolveTask('TASK-001', { repoRoot: repoRoot() })).not.toThrow()
    expect(() => selectNextTask(repoRoot())).not.toThrow()
  })
})

describe('fluxo ponta a ponta', () => {
  const PROPOSAL = `# Change — Teste\n\n- Status: APPROVED\n\n## 1. Objetivo\n`
  const TASK = (id, dependencies) =>
    `# ${id} — Tarefa\n\n- Change: 003-test\n- Status: PENDING\n- Depende de: ${dependencies}\n`

  function repoRoot() {
    return join(workDir, 'repo')
  }

  it('inicia, verifica, conclui, arquiva tarefa e arquiva mudança', () => {
    writeChange(join('repo', 'specs', 'changes', '003-test'), {
      'proposal.md': PROPOSAL,
      'tasks/TASK-001.md': TASK('TASK-001', 'nenhuma'),
      'tasks/TASK-002.md': TASK('TASK-002', 'TASK-001'),
    })

    expect(startTask(repoRoot(), 'TASK-001', { today: '2026-11-15' }).status).toBe('IN PROGRESS')
    expect(beginVerification(repoRoot(), 'TASK-001').status).toBe('VERIFYING')
    expect(
      verifyTask(repoRoot(), 'TASK-001', { evidence: 'testes', today: '2026-11-15' }).status,
    ).toBe('COMPLETED')
    expect(
      archiveTask(repoRoot(), 'TASK-001', { approved: true, today: '2026-11-15' }).status,
    ).toBe('ARCHIVED')

    expect(startTask(repoRoot(), 'TASK-002', { today: '2026-11-15' }).status).toBe('IN PROGRESS')
    expect(beginVerification(repoRoot(), 'TASK-002').status).toBe('VERIFYING')
    expect(
      verifyTask(repoRoot(), 'TASK-002', { evidence: 'testes', today: '2026-11-15' }).status,
    ).toBe('COMPLETED')
    expect(
      archiveTask(repoRoot(), 'TASK-002', { approved: true, today: '2026-11-15' }).status,
    ).toBe('ARCHIVED')

    const result = archiveChange(repoRoot(), '003-test', { approved: true, today: '2026-11-15' })

    expect(result.alreadyArchived).toBe(false)
    const proposal = readFileSync(join(result.archivedDir, 'proposal.md'), 'utf8')
    expect(proposal).toContain('Status: ARCHIVED')
    expect(existsSync(join(result.archivedDir, 'tasks', 'archive', 'TASK-001.md'))).toBe(true)
    expect(existsSync(join(result.archivedDir, 'tasks', 'archive', 'TASK-002.md'))).toBe(true)
  })
})
