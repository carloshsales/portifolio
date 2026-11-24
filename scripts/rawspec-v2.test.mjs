/**
 * Testes do parser v2 de mudanças e tarefas.
 *
 * TASK-003 da change 003-rawspec-v2.
 */

import { execFileSync } from 'node:child_process'
import {
  chmodSync,
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import {
  COMMIT_CHECKS,
  RawspecError,
  appendHistory,
  archiveChange,
  archiveTask,
  beginVerification,
  buildCommitMessage,
  buildDependencyGraph,
  buildPullRequestContent,
  checkArchiveChange,
  checkArchiveTask,
  commitAndPushTask,
  createAdrSkeleton,
  createTaskBranch,
  failTask,
  isChangeApproved,
  listChangeDirs,
  listOpenTasks,
  listPendingChanges,
  listTaskFiles,
  migrateLegacyChange,
  normalizeTaskId,
  openPullRequest,
  parseChange,
  parseTaskFile,
  resolveGhExecutable,
  resolveTask,
  resolveWithinRepo,
  runChecks,
  runExternalCommand,
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
    if (name !== 'archivespec') {
      expect(content).toMatch(/commit-task|create-branch/)
    }
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

describe('verificações do commit-task', () => {
  it('usa lint, typecheck, test e build, por esta ordem', () => {
    expect(COMMIT_CHECKS).toEqual([['lint'], ['typecheck'], ['test'], ['build']])
  })

  it('executa as verificações por ordem', () => {
    const calls = []

    runChecks(workDir, {
      runCheck: (_repoRoot, args) => {
        calls.push(args.join(' '))
      },
    })

    expect(calls).toEqual(['lint', 'typecheck', 'test', 'build'])
  })

  it('para na primeira verificação que falha', () => {
    const calls = []
    const runCheck = (_repoRoot, args) => {
      calls.push(args.join(' '))
      if (args[0] === 'typecheck') {
        throw new RawspecError('E_CHECKS_FAILED', 'typecheck falhou')
      }
    }

    const error = captureError(() => runChecks(workDir, { runCheck }))

    expect(error).toBeInstanceOf(RawspecError)
    expect(error.code).toBe('E_CHECKS_FAILED')
    expect(calls).toEqual(['lint', 'typecheck'])
  })
})

/**
 * Executa um comando Git dentro de um repositório de teste.
 *
 * `GIT_DIR` e `GIT_WORK_TREE` são fixados ao repositório de teste. Sem isto,
 * o Git descobre o repositório por ascensão de directórios e, num worktree,
 * onde `.git` é um ficheiro, os comandos escrevem no repositório partilhado
 * em vez do repositório de teste.
 *
 * @param {string} repo directório do repositório de teste.
 * @param {string[]} args argumentos do Git.
 * @returns {string} saída do comando.
 */
function git(repo, args) {
  return execFileSync('git', args, {
    cwd: repo,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    env: {
      ...process.env,
      GIT_DIR: join(repo, '.git'),
      GIT_WORK_TREE: repo,
    },
  })
}

/**
 * Executa um comando Git isolado do repositório real.
 *
 * @param {string} cwd directório de trabalho do comando.
 * @param {string[]} args argumentos do Git.
 * @param {{gitDir?: string, workTree?: string}} [env] directórios a fixar.
 * @returns {string} saída do comando.
 */
function gitIsolated(cwd, args, env = {}) {
  return execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    env: {
      ...process.env,
      GIT_DIR: env.gitDir,
      GIT_WORK_TREE: env.workTree,
    },
  })
}

describe('branch e commit por tarefa', () => {
  /**
   * Inicializa um repositório isolado, sem possibilidade de reinitializar o
   * repositório real.
   *
   * O `GIT_DIR` é fixado para um directório novo, por isso o `git init` não
   * pode tocar no repositório partilhado, mesmo executado a partir de um
   * worktree.
   *
   * @param {string} repo directório do novo repositório.
   */
  function initRepo(repo) {
    const gitDir = join(repo, '.git')
    mkdirSync(gitDir, { recursive: true })
    gitIsolated(repo, ['init', '--initial-branch=main'], { gitDir, workTree: repo })
  }

  /**
   * Inicializa um repositório vazio, isolado, para simular um remote.
   *
   * @param {string} bare caminho do novo repositório vazio.
   */
  function initBareRepo(bare) {
    mkdirSync(bare, { recursive: true })
    gitIsolated(bare, ['init', '--bare'], { gitDir: bare })
  }

  function createRepoWithTask(status = 'COMPLETED') {
    const repo = mkdtempSync(join(workDir, 'repo-'))
    initRepo(repo)
    git(repo, ['config', 'user.email', 'test@example.com'])
    git(repo, ['config', 'user.name', 'Test'])
    git(repo, ['config', 'commit.gpgsign', 'false'])
    writeFileSync(join(repo, 'README.md'), '# Test\n', 'utf8')
    git(repo, ['add', '-A'])
    git(repo, ['commit', '-m', 'chore: initial'])

    const changeDir = join(repo, 'specs', 'changes', '004-test')
    mkdirSync(join(changeDir, 'tasks'), { recursive: true })
    writeFileSync(
      join(changeDir, 'proposal.md'),
      '# Change\n\n- Status: APPROVED\n\n## 1. Objetivo\n',
      'utf8',
    )
    const verification = status === 'COMPLETED' ? 'VERIFIED' : 'PENDING'
    writeFileSync(
      join(changeDir, 'tasks', 'TASK-001.md'),
      `# TASK-001 — Implementar coisa\n\n- Change: 004-test\n- Status: ${status}\n- Depende de: nenhuma\n- Verificação: ${verification}\n`,
      'utf8',
    )
    git(repo, ['add', '-A'])
    git(repo, ['commit', '-m', 'chore: change'])
    return repo
  }

  function addTaskCommit(
    repo,
    { files = ['src/allowed.ts'], change = '004-test', task = 'TASK-001' } = {},
  ) {
    for (const [index, file] of files.entries()) {
      const fullPath = join(repo, file)
      mkdirSync(dirname(fullPath), { recursive: true })
      writeFileSync(fullPath, `conteúdo ${index + 1}\n`, 'utf8')
    }
    git(repo, ['add', '--', ...files])
    git(repo, [
      'commit',
      '-m',
      [
        'feat(rawspec): Implementar coisa',
        '',
        `Change: ${change}`,
        `Task: ${task}`,
        'Tests: pnpm test',
        'Evidence: testes aprovados',
        'Action-Plan: none',
      ].join('\n'),
    ])
    return git(repo, ['rev-parse', 'HEAD']).trim()
  }

  function createPublishFixture({
    scopeFiles = ['src/allowed.ts'],
    remote = 'origin',
    pushMain = true,
    taskStatus = 'COMPLETED',
    taskCommit = true,
    taskCommitOptions,
    pushTaskBranch = false,
    githubRemote = false,
  } = {}) {
    const repo = createRepoWithTask(taskStatus)
    const taskPath = 'specs/changes/004-test/tasks/TASK-001.md'
    const fullTaskPath = join(repo, taskPath)
    const task = readFileSync(fullTaskPath, 'utf8')
    const scope = scopeFiles.map((file) => `- \`${file}\``).join('\n')
    writeFileSync(fullTaskPath, `${task.trimEnd()}\n\n## Arquivos\n\n${scope}\n`, 'utf8')
    git(repo, ['add', '--', taskPath])
    git(repo, ['commit', '-m', 'docs(rawspec): declarar âmbito da tarefa'])

    const bare = join(workDir, `remote-${remote}.git`)
    initBareRepo(bare)
    const githubUrl =
      githubRemote === 'ssh' ? 'git@github.com:acme/site.git' : 'https://github.com/acme/site.git'
    if (githubRemote) {
      const localUrl = pathToFileURL(bare).href
      git(repo, ['config', `url.${localUrl}.insteadOf`, 'https://github.com/acme/site.git'])
      git(repo, ['config', '--add', `url.${localUrl}.insteadOf`, 'git@github.com:acme/site.git'])
    }
    git(repo, ['remote', 'add', remote, githubRemote ? githubUrl : bare])
    if (pushMain) git(repo, ['push', remote, 'main'])

    const { branch } = createTaskBranch(repo, 'TASK-001')
    if (taskCommit) addTaskCommit(repo, taskCommitOptions)
    const head = git(repo, ['rev-parse', 'HEAD']).trim()
    if (pushTaskBranch && taskCommit) git(repo, ['push', '-u', remote, branch])

    return { repo, bare, branch, head, remote, scopeFiles }
  }

  function touchTask(repo) {
    const file = join(repo, 'specs', 'changes', '004-test', 'tasks', 'TASK-001.md')
    writeFileSync(file, `${readFileSync(file, 'utf8')}\n<!-- alteracao -->\n`, 'utf8')
  }

  describe('âmbito da tarefa', () => {
    it('extrai os ficheiros de ## Arquivos', () => {
      const repo = createRepoWithTask()
      const file = join(repo, 'specs', 'changes', '004-test', 'tasks', 'TASK-001.md')
      const content = readFileSync(file, 'utf8')
      writeFileSync(
        file,
        `${content}\n## Arquivos\n\n- \`src/um.tsx\` (revisão)\n- \`src/dois.tsx\`\n`,
        'utf8',
      )

      const task = parseTaskFile(file)

      expect(task.scope.source).toBe('explicit')
      expect(task.scope.files).toEqual(['src/um.tsx', 'src/dois.tsx'])
    })

    it('devolve âmbito vazio quando a secção não existe', () => {
      const repo = createRepoWithTask()

      const task = parseTaskFile(join(repo, 'specs', 'changes', '004-test', 'tasks', 'TASK-001.md'))

      expect(task.scope.source).toBe('none')
      expect(task.scope.files).toEqual([])
    })

    it('ignora o qualificador entre parênteses', () => {
      const repo = createRepoWithTask()
      const file = join(repo, 'specs', 'changes', '004-test', 'tasks', 'TASK-001.md')
      writeFileSync(
        file,
        `${readFileSync(file, 'utf8')}\n## Arquivos\n\n- \`src/x.tsx\` (leitura dos dados; sem escrita)\n`,
        'utf8',
      )

      const task = parseTaskFile(file)

      expect(task.scope.files).toEqual(['src/x.tsx'])
    })
  })

  describe('gate de âmbito no commit-task', () => {
    function repoWithScope(repo, files) {
      const file = join(repo, 'specs', 'changes', '004-test', 'tasks', 'TASK-001.md')
      const list = files.map((f) => `- \`${f}\``).join('\n')
      writeFileSync(file, `${readFileSync(file, 'utf8')}\n## Arquivos\n\n${list}\n`, 'utf8')
      return file
    }

    it('commita apenas os ficheiros do âmbito', () => {
      const repo = createRepoWithTask()
      repoWithScope(repo, ['src/permitido.ts'])
      mkdirSync(join(repo, 'src'), { recursive: true })
      writeFileSync(join(repo, 'src', 'permitido.ts'), 'export const a = 1\n', 'utf8')
      writeFileSync(join(repo, 'src', 'outro.ts'), 'export const b = 2\n', 'utf8')
      touchTask(repo)

      const error = captureError(() =>
        commitAndPushTask(repo, 'TASK-001', { checks: [], push: false }),
      )

      expect(error.code).toBe('E_SCOPE_VIOLATION')
      expect(error.details.outOfScope).toContain('src/outro.ts')
      expect(error.details.outOfScope).not.toContain('src/permitido.ts')
    })

    it('não commita quando há um ficheiro fora do âmbito', () => {
      const repo = createRepoWithTask()
      repoWithScope(repo, ['src/permitido.ts'])
      mkdirSync(join(repo, 'src'), { recursive: true })
      writeFileSync(join(repo, 'src', 'permitido.ts'), 'export const a = 1\n', 'utf8')
      writeFileSync(join(repo, 'src', 'outro.ts'), 'export const b = 2\n', 'utf8')
      touchTask(repo)
      const before = git(repo, ['rev-parse', '--short', 'HEAD']).trim()

      captureError(() => commitAndPushTask(repo, 'TASK-001', { checks: [], push: false }))

      expect(git(repo, ['rev-parse', '--short', 'HEAD']).trim()).toBe(before)
    })

    it('commita o ficheiro da task e os do âmbito', () => {
      const repo = createRepoWithTask()
      repoWithScope(repo, ['src/permitido.ts'])
      mkdirSync(join(repo, 'src'), { recursive: true })
      writeFileSync(join(repo, 'src', 'permitido.ts'), 'export const a = 1\n', 'utf8')
      touchTask(repo)

      commitAndPushTask(repo, 'TASK-001', { checks: [], push: false })

      const files = git(repo, ['show', '--name-only', '--pretty=format:']).trim().split('\n')
      expect(files).toContain('src/permitido.ts')
      expect(files).toContain('specs/changes/004-test/tasks/TASK-001.md')
    })

    it('commita alterações já staged no índice, sem as tratar como caminho limpo', () => {
      const repo = createRepoWithTask()
      repoWithScope(repo, ['src/permitido.ts'])
      mkdirSync(join(repo, 'src'), { recursive: true })
      writeFileSync(join(repo, 'src', 'permitido.ts'), 'export const a = 1\n', 'utf8')
      git(repo, ['add', '--', 'src/permitido.ts'])
      const before = git(repo, ['rev-list', '--count', 'HEAD']).trim()

      const result = commitAndPushTask(repo, 'TASK-001', { checks: [], push: false })

      expect(result.pushed).toBe(false)
      expect(git(repo, ['rev-list', '--count', 'HEAD']).trim()).toBe(String(Number(before) + 1))
      const files = git(repo, ['show', '--name-only', '--pretty=format:']).trim().split('\n')
      expect(files).toContain('src/permitido.ts')
    })

    it('bloqueia alterações já staged fora do âmbito', () => {
      const repo = createRepoWithTask()
      repoWithScope(repo, ['src/permitido.ts'])
      mkdirSync(join(repo, 'src'), { recursive: true })
      writeFileSync(join(repo, 'src', 'outro.ts'), 'export const b = 2\n', 'utf8')
      git(repo, ['add', '--', 'src/outro.ts'])
      const before = git(repo, ['rev-parse', '--short', 'HEAD']).trim()

      const error = captureError(() =>
        commitAndPushTask(repo, 'TASK-001', { checks: [], push: false }),
      )

      expect(error.code).toBe('E_SCOPE_VIOLATION')
      expect(error.details.outOfScope).toContain('src/outro.ts')
      expect(git(repo, ['rev-parse', '--short', 'HEAD']).trim()).toBe(before)
    })

    it('não usa git add -A', () => {
      const source = readFileSync(join(import.meta.dirname, 'rawspec-v2.mjs'), 'utf8')
      expect(source).not.toContain("'add', '-A'")
    })
  })

  it('cria a branch com a nomenclatura esperada', () => {
    const repo = createRepoWithTask()

    const result = createTaskBranch(repo, 'TASK-001')

    expect(result.branch).toBe('task/004-001-implementar-coisa')
    expect(git(repo, ['rev-parse', '--abbrev-ref', 'HEAD']).trim()).toBe(result.branch)
  })

  it('recusa branch já existente', () => {
    const repo = createRepoWithTask()
    createTaskBranch(repo, 'TASK-001')

    const error = captureError(() => createTaskBranch(repo, 'TASK-001'))

    expect(error).toBeInstanceOf(RawspecError)
    expect(error.code).toBe('E_BRANCH_EXISTS')
  })

  it('commita com a mensagem gerada', () => {
    const repo = createRepoWithTask()
    touchTask(repo)

    const result = commitAndPushTask(repo, 'TASK-001', { checks: [], push: false })

    expect(result.pushed).toBe(false)
    const log = git(repo, ['log', '-1', '--pretty=%B'])
    expect(log).toContain('feat(rawspec): Implementar coisa')
    expect(log).toContain('Task: TASK-001')
  })

  it('não commita quando as verificações falham', () => {
    const repo = createRepoWithTask()
    touchTask(repo)
    const before = git(repo, ['rev-parse', '--short', 'HEAD']).trim()

    const error = captureError(() =>
      commitAndPushTask(repo, 'TASK-001', { checks: [['--invalid-flag']], push: false }),
    )

    expect(error.code).toBe('E_CHECKS_FAILED')
    expect(git(repo, ['rev-parse', '--short', 'HEAD']).trim()).toBe(before)
  })

  it('executa lint, typecheck, test e build antes de commitar', () => {
    const repo = createRepoWithTask()
    touchTask(repo)
    const calls = []
    const runCheck = (_repoRoot, args) => {
      calls.push(args.join(' '))
    }

    commitAndPushTask(repo, 'TASK-001', { push: false, runCheck })

    expect(calls).toEqual(['lint', 'typecheck', 'test', 'build'])
    expect(git(repo, ['log', '-1', '--pretty=%B'])).toContain(
      'Tests: pnpm lint; pnpm typecheck; pnpm test; pnpm build',
    )
  })

  it('não commita nem faz push quando o lint falha', () => {
    const repo = createRepoWithTask()
    const bare = join(workDir, 'remote-lint.git')
    initBareRepo(bare)
    git(repo, ['remote', 'add', 'origin', bare])
    createTaskBranch(repo, 'TASK-001')
    touchTask(repo)
    const before = git(repo, ['rev-parse', '--short', 'HEAD']).trim()
    const calls = []
    const runCheck = (_repoRoot, args) => {
      calls.push(args.join(' '))
      if (args[0] === 'lint') {
        throw new RawspecError('E_CHECKS_FAILED', 'lint falhou')
      }
    }

    const error = captureError(() => commitAndPushTask(repo, 'TASK-001', { push: true, runCheck }))

    expect(error.code).toBe('E_CHECKS_FAILED')
    expect(calls).toEqual(['lint'])
    expect(git(repo, ['rev-parse', '--short', 'HEAD']).trim()).toBe(before)
    expect(git(repo, ['ls-remote', '--heads', 'origin']).trim()).toBe('')
  })

  it('recusa tarefa incompleta', () => {
    const repo = createRepoWithTask('PENDING')

    const error = captureError(() =>
      commitAndPushTask(repo, 'TASK-001', { checks: [], push: false }),
    )

    expect(error.code).toBe('E_TASK_STATE')
  })

  it('faz push quando há remote', () => {
    const repo = createRepoWithTask()
    const bare = join(workDir, 'remote.git')
    initBareRepo(bare)
    git(repo, ['remote', 'add', 'origin', bare])
    createTaskBranch(repo, 'TASK-001')
    touchTask(repo)

    const result = commitAndPushTask(repo, 'TASK-001', { checks: [], push: true })

    expect(result.pushed).toBe(true)
    expect(git(repo, ['branch', '-r'])).toContain('origin/task/004-001-implementar-coisa')
  })

  describe('publicação idempotente de commit existente', () => {
    it('publica o commit elegível sem criar outro commit e corre os checks por ordem', () => {
      const fixture = createPublishFixture()
      const commitCount = git(fixture.repo, ['rev-list', '--count', 'HEAD']).trim()
      const checks = []
      const result = commitAndPushTask(fixture.repo, 'TASK-001', {
        changeId: '004-test',
        runCheck: (_repoRoot, args) => checks.push(args.join(' ')),
        pr: false,
      })

      expect(result.branch).toBe(fixture.branch)
      expect(result.commit).toBe(fixture.head.slice(0, 7))
      expect(result.pushed).toBe(true)
      expect(result.pullRequest).toBeNull()
      expect(checks).toEqual(['lint', 'typecheck', 'test', 'build'])
      expect(git(fixture.repo, ['rev-parse', 'HEAD']).trim()).toBe(fixture.head)
      expect(git(fixture.repo, ['rev-list', '--count', 'HEAD']).trim()).toBe(commitCount)
      expect(git(fixture.repo, ['ls-remote', '--heads', 'origin', fixture.branch])).toContain(
        fixture.head,
      )
      expect(git(fixture.repo, ['status', '--porcelain'])).toBe('')
    })

    it('não cria commit vazio quando o remote main já está no HEAD e não há branch publicada', () => {
      const fixture = createPublishFixture({ taskCommit: false })
      const before = git(fixture.repo, ['rev-parse', 'HEAD']).trim()

      const error = captureError(() =>
        commitAndPushTask(fixture.repo, 'TASK-001', { changeId: '004-test', checks: [] }),
      )

      expect(error.code).toBe('E_TASK_STATE')
      expect(error.details.reason).toBe('no_eligible_commit')
      expect(git(fixture.repo, ['rev-parse', 'HEAD']).trim()).toBe(before)
      expect(git(fixture.repo, ['ls-remote', '--heads', 'origin', fixture.branch])).toBe('')
    })

    it('falha com task_not_verified quando a task não está COMPLETED + VERIFIED', () => {
      const fixture = createPublishFixture({ taskStatus: 'PENDING', taskCommit: false })

      const error = captureError(() =>
        commitAndPushTask(fixture.repo, 'TASK-001', { changeId: '004-test', checks: [] }),
      )

      expect(error.code).toBe('E_TASK_STATE')
      expect(error.details.reason).toBe('task_not_verified')
      expect(git(fixture.repo, ['ls-remote', '--heads', 'origin', fixture.branch])).toBe('')
    })

    it('falha com branch_mismatch quando a branch corrente não corresponde à task', () => {
      const fixture = createPublishFixture()
      git(fixture.repo, ['checkout', 'main'])

      const error = captureError(() =>
        commitAndPushTask(fixture.repo, 'TASK-001', { changeId: '004-test', checks: [] }),
      )

      expect(error.code).toBe('E_TASK_STATE')
      expect(error.details.reason).toBe('branch_mismatch')
      expect(git(fixture.repo, ['ls-remote', '--heads', 'origin', fixture.branch])).toBe('')
    })

    it('falha com branch_mismatch quando --branch não corresponde à branch corrente', () => {
      const fixture = createPublishFixture()

      const error = captureError(() =>
        commitAndPushTask(fixture.repo, 'TASK-001', {
          changeId: '004-test',
          branch: 'task/outro-alvo',
          checks: [],
        }),
      )

      expect(error.code).toBe('E_TASK_STATE')
      expect(error.details.reason).toBe('branch_mismatch')
      expect(git(fixture.repo, ['ls-remote', '--heads', 'origin', fixture.branch])).toBe('')
    })

    it('falha com merge_in_progress durante um merge activo mesmo com alterações locais', () => {
      const fixture = createPublishFixture()
      writeFileSync(join(fixture.repo, '.git', 'MERGE_HEAD'), `${fixture.head}\n`, 'utf8')
      mkdirSync(join(fixture.repo, 'src'), { recursive: true })
      writeFileSync(join(fixture.repo, 'src', 'allowed.ts'), 'alteração durante merge\n', 'utf8')

      const error = captureError(() =>
        commitAndPushTask(fixture.repo, 'TASK-001', { changeId: '004-test', checks: [] }),
      )

      expect(error.code).toBe('E_TASK_STATE')
      expect(error.details.reason).toBe('merge_in_progress')
      expect(git(fixture.repo, ['ls-remote', '--heads', 'origin', fixture.branch])).toBe('')
    })

    it('falha com remote_not_found quando o alias solicitado não existe', () => {
      const fixture = createPublishFixture()

      const error = captureError(() =>
        commitAndPushTask(fixture.repo, 'TASK-001', {
          changeId: '004-test',
          remote: 'missing',
          checks: [],
        }),
      )

      expect(error.code).toBe('E_GIT_ERROR')
      expect(error.details.reason).toBe('remote_not_found')
    })

    it('falha fechado com remote_unavailable quando o fetch falha', () => {
      const fixture = createPublishFixture()
      git(fixture.repo, ['remote', 'set-url', 'origin', join(workDir, 'missing-remote.git')])

      const error = captureError(() =>
        commitAndPushTask(fixture.repo, 'TASK-001', { changeId: '004-test', checks: [] }),
      )

      expect(error.code).toBe('E_GIT_ERROR')
      expect(error.details.reason).toBe('remote_unavailable')
      expect(git(fixture.repo, ['rev-parse', 'HEAD']).trim()).toBe(fixture.head)
    })

    it('falha fechado quando a branch base remota main não existe', () => {
      const fixture = createPublishFixture({ pushMain: false })

      const error = captureError(() =>
        commitAndPushTask(fixture.repo, 'TASK-001', { changeId: '004-test', checks: [] }),
      )

      expect(error.code).toBe('E_GIT_ERROR')
      expect(error.details.reason).toBe('remote_unavailable')
      expect(git(fixture.repo, ['ls-remote', '--heads', 'origin']).trim()).toBe('')
    })

    it('recusa commits com metadata Change ou Task incompatível', () => {
      const fixture = createPublishFixture({
        taskCommitOptions: { change: '999-other' },
      })

      const error = captureError(() =>
        commitAndPushTask(fixture.repo, 'TASK-001', { changeId: '004-test', checks: [] }),
      )

      expect(error.code).toBe('E_TASK_STATE')
      expect(error.details.reason).toBe('commit_metadata_mismatch')
      expect(git(fixture.repo, ['ls-remote', '--heads', 'origin', fixture.branch])).toBe('')
    })

    it('não publica quando os checks falham: o push só acontece depois dos checks', () => {
      const fixture = createPublishFixture()
      const calls = []

      const error = captureError(() =>
        commitAndPushTask(fixture.repo, 'TASK-001', {
          changeId: '004-test',
          pr: false,
          runCheck: (_repoRoot, args) => {
            calls.push(args.join(' '))
            if (args[0] === 'lint') {
              throw new RawspecError('E_CHECKS_FAILED', 'lint falhou')
            }
          },
        }),
      )

      expect(error.code).toBe('E_CHECKS_FAILED')
      expect(calls).toEqual(['lint'])
      expect(git(fixture.repo, ['ls-remote', '--heads', 'origin', fixture.branch])).toBe('')
      expect(git(fixture.repo, ['rev-parse', 'HEAD']).trim()).toBe(fixture.head)
    })

    it('aplica o gate de âmbito a todos os commits do range, não apenas ao HEAD', () => {
      const fixture = createPublishFixture({ scopeFiles: ['src/permitido.ts'], taskCommit: false })
      addTaskCommit(fixture.repo, { files: ['src/fora-do-ambito.ts'] })
      addTaskCommit(fixture.repo, { files: ['src/permitido.ts'] })

      const error = captureError(() =>
        commitAndPushTask(fixture.repo, 'TASK-001', { changeId: '004-test', checks: [] }),
      )

      expect(error.code).toBe('E_SCOPE_VIOLATION')
      expect(error.details.outOfScope).toContain('src/fora-do-ambito.ts')
      expect(git(fixture.repo, ['ls-remote', '--heads', 'origin', fixture.branch])).toBe('')
    })

    it('valida metadata em todos os commits do range, não apenas em HEAD', () => {
      const fixture = createPublishFixture({ scopeFiles: ['src'], taskCommit: false })
      addTaskCommit(fixture.repo, {
        files: ['src/first.ts'],
        task: 'TASK-002',
      })
      addTaskCommit(fixture.repo, { files: ['src/second.ts'] })

      const error = captureError(() =>
        commitAndPushTask(fixture.repo, 'TASK-001', { changeId: '004-test', checks: [] }),
      )

      expect(error.code).toBe('E_TASK_STATE')
      expect(error.details.reason).toBe('commit_metadata_mismatch')
      expect(error.details.expectedTask).toBe('TASK-001')
      expect(error.details.taskLines).toEqual(['Task: TASK-002'])
      expect(git(fixture.repo, ['ls-remote', '--heads', 'origin', fixture.branch])).toBe('')
    })

    it('recusa um commit de merge no range elegível', () => {
      const fixture = createPublishFixture({ scopeFiles: ['src'], taskCommit: false })
      git(fixture.repo, ['checkout', '-b', 'side'])
      addTaskCommit(fixture.repo, { files: ['src/side.ts'] })
      git(fixture.repo, ['checkout', fixture.branch])
      addTaskCommit(fixture.repo, { files: ['src/local.ts'] })
      git(fixture.repo, [
        'merge',
        '--no-ff',
        'side',
        '-m',
        'merge task commits\n\nChange: 004-test\nTask: TASK-001\n',
      ])

      const error = captureError(() =>
        commitAndPushTask(fixture.repo, 'TASK-001', { changeId: '004-test', checks: [] }),
      )

      expect(error.code).toBe('E_TASK_STATE')
      expect(error.details.reason).toBe('merge_commit_ineligible')
      expect(git(fixture.repo, ['ls-remote', '--heads', 'origin', fixture.branch])).toBe('')
    })

    it('recusa commits cujo diff ultrapassa o âmbito declarado', () => {
      const fixture = createPublishFixture({
        taskCommitOptions: { files: ['src/outside.ts'] },
      })

      const error = captureError(() =>
        commitAndPushTask(fixture.repo, 'TASK-001', { changeId: '004-test', checks: [] }),
      )

      expect(error.code).toBe('E_SCOPE_VIOLATION')
      expect(error.details.outOfScope).toContain('src/outside.ts')
      expect(git(fixture.repo, ['ls-remote', '--heads', 'origin', fixture.branch])).toBe('')
    })

    it('não repete o push quando a branch remota já aponta para HEAD', () => {
      const fixture = createPublishFixture({ pushTaskBranch: true })

      const result = commitAndPushTask(fixture.repo, 'TASK-001', {
        changeId: '004-test',
        checks: [],
        pr: false,
      })

      expect(result.pushed).toBe(false)
      expect(result.pullRequest).toBeNull()
      expect(result.commit).toBe(fixture.head.slice(0, 7))
      expect(git(fixture.repo, ['ls-remote', '--heads', 'origin', fixture.branch])).toContain(
        fixture.head,
      )
    })

    it('faz push fast-forward quando a branch remota é ancestral de HEAD', () => {
      const fixture = createPublishFixture({ scopeFiles: ['src'], taskCommit: false })
      addTaskCommit(fixture.repo, { files: ['src/first.ts'] })
      git(fixture.repo, ['push', '-u', 'origin', fixture.branch])
      addTaskCommit(fixture.repo, { files: ['src/second.ts'] })
      const head = git(fixture.repo, ['rev-parse', 'HEAD']).trim()

      const result = commitAndPushTask(fixture.repo, 'TASK-001', {
        changeId: '004-test',
        checks: [],
        pr: false,
      })

      expect(result.pushed).toBe(true)
      expect(git(fixture.repo, ['ls-remote', '--heads', 'origin', fixture.branch])).toContain(head)
      expect(git(fixture.repo, ['rev-parse', 'HEAD']).trim()).toBe(head)
    })

    it('recusa sem force-push quando a branch remota está à frente', () => {
      const fixture = createPublishFixture({ scopeFiles: ['src'] })
      git(fixture.repo, ['checkout', '-b', 'remote-advance'])
      addTaskCommit(fixture.repo, { files: ['src/remote.ts'] })
      git(fixture.repo, ['push', 'origin', `remote-advance:${fixture.branch}`])
      git(fixture.repo, ['checkout', fixture.branch])

      const error = captureError(() =>
        commitAndPushTask(fixture.repo, 'TASK-001', { changeId: '004-test', checks: [] }),
      )

      expect(error.code).toBe('E_GIT_ERROR')
      expect(error.details.reason).toBe('remote_ahead')
    })

    it('recusa sem force-push quando a branch remota divergiu', () => {
      const fixture = createPublishFixture({ scopeFiles: ['src'] })
      const base = git(fixture.repo, ['rev-parse', 'main']).trim()
      git(fixture.repo, ['checkout', '-b', 'remote-diverged', base])
      addTaskCommit(fixture.repo, { files: ['src/remote.ts'] })
      git(fixture.repo, ['push', 'origin', `remote-diverged:${fixture.branch}`])
      git(fixture.repo, ['checkout', fixture.branch])

      const error = captureError(() =>
        commitAndPushTask(fixture.repo, 'TASK-001', { changeId: '004-test', checks: [] }),
      )

      expect(error.code).toBe('E_GIT_ERROR')
      expect(error.details.reason).toBe('remote_diverged')
    })

    it('mantém o hook pre-push activo no publish-existing', () => {
      const fixture = createPublishFixture()
      const hooksDir = join(fixture.repo, '.git', 'test-hooks')
      mkdirSync(hooksDir, { recursive: true })
      const hook = join(hooksDir, 'pre-push')
      writeFileSync(hook, '#!/bin/sh\necho pre-push bloqueou >&2\nexit 1\n', 'utf8')
      chmodSync(hook, 0o755)
      git(fixture.repo, ['config', 'core.hooksPath', hooksDir])

      const error = captureError(() =>
        commitAndPushTask(fixture.repo, 'TASK-001', {
          changeId: '004-test',
          checks: [],
          pr: false,
        }),
      )

      expect(error.code).toBe('E_GIT_ERROR')
      expect(error.details.stderr).toContain('pre-push bloqueou')
      expect(git(fixture.repo, ['ls-remote', '--heads', 'origin', fixture.branch])).toBe('')
    })

    it('não invoca pre-commit/lint-staged sem ficheiros staged', () => {
      const fixture = createPublishFixture()
      const hooksDir = join(fixture.repo, '.git', 'test-hooks')
      mkdirSync(hooksDir, { recursive: true })
      const preCommit = join(hooksDir, 'pre-commit')
      const prePush = join(hooksDir, 'pre-push')
      writeFileSync(
        preCommit,
        '#!/bin/sh\necho "lint-staged could not find any staged files" >&2\nexit 1\n',
        'utf8',
      )
      writeFileSync(prePush, '#!/bin/sh\nexit 0\n', 'utf8')
      chmodSync(preCommit, 0o755)
      chmodSync(prePush, 0o755)
      git(fixture.repo, ['config', 'core.hooksPath', hooksDir])

      const result = commitAndPushTask(fixture.repo, 'TASK-001', {
        changeId: '004-test',
        checks: [],
        pr: false,
      })

      expect(result.pushed).toBe(true)
      expect(git(fixture.repo, ['ls-remote', '--heads', 'origin', fixture.branch])).toContain(
        fixture.head,
      )
    })

    it('não toca na rede com --no-push, mesmo com o remote indisponível', () => {
      const fixture = createPublishFixture()
      git(fixture.repo, ['remote', 'set-url', 'origin', join(workDir, 'missing-remote.git')])

      const result = commitAndPushTask(fixture.repo, 'TASK-001', {
        changeId: '004-test',
        push: false,
        checks: [],
      })

      expect(result.pushed).toBe(false)
      expect(result.pullRequest).toBeNull()
      expect(result.commit).toBe(fixture.head.slice(0, 7))
    })

    it('resolve o repositório GitHub quando o remote tem múltiplos URLs', () => {
      const fixture = createPublishFixture({ githubRemote: true })
      const localUrl = pathToFileURL(fixture.bare).href
      git(fixture.repo, [
        'config',
        '--add',
        'remote.origin.url',
        'https://github.com/outro/repo.git',
      ])
      git(fixture.repo, [
        'config',
        '--add',
        `url.${localUrl}.insteadOf`,
        'https://github.com/outro/repo.git',
      ])
      const calls = []
      const runExternal = (_command, args) => {
        calls.push(args)
        return {
          code: 0,
          stdout: '[{"number":7,"url":"https://github.com/acme/site/pull/7","state":"OPEN"}]',
          stderr: '',
        }
      }

      const result = commitAndPushTask(fixture.repo, 'TASK-001', {
        changeId: '004-test',
        checks: [],
        runExternal,
      })

      expect(result.pullRequest.status).toBe('existing')
      expect(calls[0][calls[0].indexOf('--repo') + 1]).toBe('acme/site')
    })

    it('recusa uma branch inválida antes de tocar no remote', () => {
      const fixture = createPublishFixture()

      const error = captureError(() =>
        commitAndPushTask(fixture.repo, 'TASK-001', {
          changeId: '004-test',
          branch: '--force',
          checks: [],
        }),
      )

      expect(error.code).toBe('E_ARGS')
      expect(git(fixture.repo, ['ls-remote', '--heads', 'origin', fixture.branch])).toBe('')
    })

    it('recusa uma branch que não é elegível para publicar', () => {
      const fixture = createPublishFixture()

      const error = captureError(() =>
        commitAndPushTask(fixture.repo, 'TASK-001', {
          changeId: '004-test',
          branch: 'task/004-001-outra-branch',
          checks: [],
        }),
      )

      expect(error.code).toBe('E_TASK_STATE')
      expect(error.details.reason).toBe('branch_mismatch')
      expect(git(fixture.repo, ['ls-remote', '--heads', 'origin', fixture.branch])).toBe('')
    })

    it('permite um remote personalizado', () => {
      const fixture = createPublishFixture({ remote: 'backup' })

      const result = commitAndPushTask(fixture.repo, 'TASK-001', {
        changeId: '004-test',
        remote: 'backup',
        checks: [],
        pr: false,
      })

      expect(result.pushed).toBe(true)
      expect(git(fixture.repo, ['ls-remote', '--heads', 'backup', fixture.branch])).toContain(
        fixture.head,
      )
      expect(git(fixture.repo, ['remote'])).toContain('backup')
      expect(git(fixture.repo, ['remote'])).not.toContain('origin')
    })

    it('reutiliza PR idempotente no repositório resolvido do remote HTTPS', () => {
      const fixture = createPublishFixture({
        remote: 'backup',
        githubRemote: true,
        pushTaskBranch: true,
      })
      const calls = []
      const runExternal = (_command, args) => {
        calls.push(args)
        return {
          code: 0,
          stdout: '[{"number":42,"url":"https://github.com/acme/site/pull/42","state":"OPEN"}]',
          stderr: '',
        }
      }

      const result = commitAndPushTask(fixture.repo, 'TASK-001', {
        changeId: '004-test',
        remote: fixture.remote,
        checks: [],
        runExternal,
      })

      expect(result.pushed).toBe(false)
      expect(result.pullRequest.status).toBe('existing')
      expect(result.pullRequest.url).toBe('https://github.com/acme/site/pull/42')
      expect(calls).toHaveLength(1)
      expect(calls[0]).toContain('--repo')
      expect(calls[0][calls[0].indexOf('--repo') + 1]).toBe('acme/site')
    })

    it('publica e abre PR usando o repositório resolvido do remote SSH', () => {
      const fixture = createPublishFixture({ githubRemote: 'ssh' })
      const calls = []
      const runExternal = (_command, args) => {
        calls.push(args)
        return args[1] === 'list'
          ? { code: 0, stdout: '[]', stderr: '' }
          : { code: 0, stdout: 'https://github.com/acme/site/pull/43\n', stderr: '' }
      }

      const result = commitAndPushTask(fixture.repo, 'TASK-001', {
        changeId: '004-test',
        checks: [],
        runExternal,
      })

      expect(result.pushed).toBe(true)
      expect(result.pullRequest.status).toBe('created')
      expect(result.pullRequest.url).toBe('https://github.com/acme/site/pull/43')
      expect(calls).toHaveLength(2)
      for (const call of calls) {
        expect(call).toContain('--repo')
        expect(call[call.indexOf('--repo') + 1]).toBe('acme/site')
      }
      expect(git(fixture.repo, ['ls-remote', '--heads', 'origin', fixture.branch])).toContain(
        fixture.head,
      )
    })

    it('não tenta criar PR num remote não-GitHub, mas preserva o push', () => {
      const fixture = createPublishFixture()

      const result = commitAndPushTask(fixture.repo, 'TASK-001', {
        changeId: '004-test',
        checks: [],
      })

      expect(result.pushed).toBe(true)
      expect(result.pullRequest.status).toBe('failed')
      expect(result.pullRequest.error.code).toBe('E_PR_UNAVAILABLE')
      expect(result.pullRequest.error.details.reason).toBe('remote_url_unsupported')
      expect(git(fixture.repo, ['ls-remote', '--heads', 'origin', fixture.branch])).toContain(
        fixture.head,
      )
    })
  })
})

describe('automação do pull request', () => {
  /**
   * Cria um executor de comando externo falso, que regista as chamadas.
   *
   * @param {Array<{code: number, stdout?: string, stderr?: string, unavailable?: boolean}>} respostas respostas por chamada.
   * @returns {{run: (command: string, args: string[], cwd: string) => {code: number, stdout: string, stderr: string, unavailable?: boolean}, calls: Array<{command: string, args: string[]}>}} executor e registo.
   */
  function fakeRunner(responses) {
    const calls = []
    let index = 0
    const run = (command, args) => {
      calls.push({ command, args })
      const response = responses[Math.min(index, responses.length - 1)] ?? { code: 0, stdout: '' }
      index += 1
      return {
        code: response.code ?? 0,
        stdout: response.stdout ?? '',
        stderr: response.stderr ?? '',
        unavailable: response.unavailable ?? false,
      }
    }
    return { run, calls }
  }

  /**
   * Cria um repositório isolado com uma tarefa concluída e verificada.
   *
   * @returns {string} caminho do repositório.
   */
  function createRepo() {
    const repo = mkdtempSync(join(workDir, 'repo-pr-'))
    const gitDir = join(repo, '.git')
    mkdirSync(gitDir, { recursive: true })
    gitIsolated(repo, ['init', '--initial-branch=main'], { gitDir, workTree: repo })
    git(repo, ['config', 'user.email', 'test@example.com'])
    git(repo, ['config', 'user.name', 'Test'])
    git(repo, ['config', 'commit.gpgsign', 'false'])
    writeFileSync(join(repo, 'README.md'), '# Test\n', 'utf8')
    git(repo, ['add', '-A'])
    git(repo, ['commit', '-m', 'chore: initial'])

    const changeDir = join(repo, 'specs', 'changes', '004-test')
    mkdirSync(join(changeDir, 'tasks'), { recursive: true })
    writeFileSync(
      join(changeDir, 'proposal.md'),
      '# Change\n\n- Status: APPROVED\n\n## 1. Objetivo\n',
      'utf8',
    )
    writeFileSync(
      join(changeDir, 'tasks', 'TASK-001.md'),
      '# TASK-001 — Implementar coisa\n\n- Change: 004-test\n- Status: COMPLETED\n- Depende de: nenhuma\n- Verificação: VERIFIED\n- Evidência: testes\n',
      'utf8',
    )
    git(repo, ['add', '-A'])
    git(repo, ['commit', '-m', 'chore: change'])
    return repo
  }

  function addGitHubRemote(repo, bare) {
    const localUrl = pathToFileURL(bare).href
    git(repo, ['config', `url.${localUrl}.insteadOf`, 'https://github.com/acme/site.git'])
    git(repo, ['remote', 'add', 'origin', 'https://github.com/acme/site.git'])
  }

  /**
   * Altera o ficheiro da tarefa, para que o commit-task tenha algo a commitar.
   *
   * @param {string} repo directório do repositório de teste.
   */
  function touchTaskFile(repo) {
    const file = join(repo, 'specs', 'changes', '004-test', 'tasks', 'TASK-001.md')
    writeFileSync(file, `${readFileSync(file, 'utf8')}\n<!-- alteracao -->\n`, 'utf8')
  }

  it('procura um pull request aberto para a branch antes de criar', () => {
    const repo = createRepo()
    const { run, calls } = fakeRunner([
      { code: 0, stdout: '[]' },
      { code: 0, stdout: 'https://github.com/acme/site/pull/42\n' },
    ])

    const result = openPullRequest(repo, 'TASK-001', { branch: 'task/004-001-x', run })

    expect(result.status).toBe('created')
    expect(result.url).toBe('https://github.com/acme/site/pull/42')
    expect(result.number).toBe(42)
    expect(result.branch).toBe('task/004-001-x')
    expect(result.base).toBe('main')
    expect(calls[0].command).toBe('gh')
    expect(calls[0].args.slice(0, 2)).toEqual(['pr', 'list'])
    expect(calls[0].args).toContain('--head')
    expect(calls[0].args).toContain('task/004-001-x')
    expect(calls[0].args[calls[0].args.indexOf('--base') + 1]).toBe('main')
  })

  it('passa --repo explicitamente na procura e criação do pull request', () => {
    const repo = createRepo()
    const { run, calls } = fakeRunner([
      { code: 0, stdout: '[]' },
      { code: 0, stdout: 'https://github.com/acme/site/pull/42\n' },
    ])

    const result = openPullRequest(repo, 'TASK-001', {
      branch: 'task/004-001-x',
      repo: 'acme/site',
      run,
    })

    expect(result.status).toBe('created')
    expect(calls).toHaveLength(2)
    for (const call of calls) {
      expect(call.args).toContain('--repo')
      expect(call.args[call.args.indexOf('--repo') + 1]).toBe('acme/site')
    }
  })

  it('reutiliza o PR do repositório explicitamente seleccionado', () => {
    const repo = createRepo()
    const { run, calls } = fakeRunner([
      {
        code: 0,
        stdout: '[{"number":7,"url":"https://github.com/acme/site/pull/7","state":"OPEN"}]',
      },
    ])

    const result = openPullRequest(repo, 'TASK-001', {
      branch: 'task/004-001-x',
      repo: 'acme/site',
      run,
    })

    expect(result.status).toBe('existing')
    expect(result.url).toBe('https://github.com/acme/site/pull/7')
    expect(calls).toHaveLength(1)
    expect(calls[0].args).toContain('--repo')
    expect(calls[0].args[calls[0].args.indexOf('--repo') + 1]).toBe('acme/site')
  })

  it('usa a branch base pedida na procura e na criação', () => {
    const repo = createRepo()
    const { run, calls } = fakeRunner([
      { code: 0, stdout: '[]' },
      { code: 0, stdout: 'https://github.com/acme/site/pull/13\n' },
    ])

    const result = openPullRequest(repo, 'TASK-001', {
      branch: 'task/004-001-x',
      base: 'develop',
      run,
    })

    expect(result.base).toBe('develop')
    expect(calls[0].args[calls[0].args.indexOf('--base') + 1]).toBe('develop')
    expect(calls[1].args[calls[1].args.indexOf('--base') + 1]).toBe('develop')
  })

  it('não cria duplicado quando já existe pull request para a branch', () => {
    const repo = createRepo()
    const { run, calls } = fakeRunner([
      {
        code: 0,
        stdout:
          '[{"number":7,"url":"https://github.com/acme/site/pull/7","state":"OPEN",' +
          '"title":"004-test — TASK-001 — Implementar coisa"}]',
      },
    ])

    const result = openPullRequest(repo, 'TASK-001', { branch: 'task/004-001-x', run })

    expect(result.status).toBe('existing')
    expect(result.url).toBe('https://github.com/acme/site/pull/7')
    expect(result.number).toBe(7)
    expect(result.title).toBe('004-test — TASK-001 — Implementar coisa')
    expect(calls).toHaveLength(1)
    expect(calls[0].args[0]).toBe('pr')
  })

  it('pede o título na procura do pull request, para o reportar no estado existing', () => {
    const repo = createRepo()
    const { run, calls } = fakeRunner([
      { code: 0, stdout: '[]' },
      { code: 0, stdout: 'https://github.com/acme/site/pull/9\n' },
    ])

    openPullRequest(repo, 'TASK-001', { branch: 'task/004-001-x', run })

    const jsonIndex = calls[0].args.indexOf('--json')
    expect(jsonIndex).toBeGreaterThan(-1)
    expect(calls[0].args[jsonIndex + 1]).toContain('title')
  })

  it('cria o pull request com base e head explícitos', () => {
    const repo = createRepo()
    const { run, calls } = fakeRunner([
      { code: 0, stdout: '[]' },
      { code: 0, stdout: 'https://github.com/acme/site/pull/9\n' },
    ])

    openPullRequest(repo, 'TASK-001', { branch: 'task/004-001-x', run })

    const create = calls[1]
    expect(create.args.slice(0, 2)).toEqual(['pr', 'create'])
    expect(create.args).toContain('--base')
    expect(create.args[create.args.indexOf('--base') + 1]).toBe('main')
    expect(create.args).toContain('--head')
    expect(create.args[create.args.indexOf('--head') + 1]).toBe('task/004-001-x')
    expect(create.args).toContain('--title')
    expect(create.args).toContain('--body')
    expect(create.args).not.toContain('--auto-merge')
  })

  it('reporta falha do GitHub CLI ao criar o pull request', () => {
    const repo = createRepo()
    const { run } = fakeRunner([
      { code: 0, stdout: '[]' },
      { code: 1, stderr: 'gh: not authenticated' },
    ])

    const error = captureError(() => openPullRequest(repo, 'TASK-001', { branch: 'b', run }))

    expect(error).toBeInstanceOf(RawspecError)
    expect(error.code).toBe('E_PR_CREATE_FAILED')
    expect(error.message).toContain('not authenticated')
  })

  it('reporta o GitHub CLI indisponível ao criar o pull request', () => {
    const repo = createRepo()
    const { run } = fakeRunner([
      { code: 0, stdout: '[]' },
      { code: 127, stderr: 'GitHub CLI indisponível', unavailable: true },
    ])

    const error = captureError(() => openPullRequest(repo, 'TASK-001', { branch: 'b', run }))

    expect(error).toBeInstanceOf(RawspecError)
    expect(error.code).toBe('E_PR_UNAVAILABLE')
    expect(error.message).toContain('indisponível')
  })

  it('reporta falha ao procurar o pull request', () => {
    const repo = createRepo()
    const { run } = fakeRunner([{ code: 1, stderr: 'gh: command not found' }])

    const error = captureError(() => openPullRequest(repo, 'TASK-001', { branch: 'b', run }))

    expect(error.code).toBe('E_PR_UNAVAILABLE')
    expect(error.message).toContain('command not found')
  })

  it('recusa a criação quando a procura devolve JSON inválido', () => {
    const repo = createRepo()
    const { run, calls } = fakeRunner([{ code: 0, stdout: 'isto não é JSON' }])

    const error = captureError(() =>
      openPullRequest(repo, 'TASK-001', { branch: 'task/004-01-x', run }),
    )

    expect(error).toBeInstanceOf(RawspecError)
    expect(error.code).toBe('E_PR_UNAVAILABLE')
    expect(error.message).toContain('não devolveu JSON')
    expect(error.details.reason).toBe('invalid_json')
    expect(calls).toHaveLength(1)
    expect(calls[0].args[0]).toBe('pr')
    expect(calls[0].args[1]).toBe('list')
  })

  it('recusa a criação quando a procura devolve JSON que não é uma lista', () => {
    const repo = createRepo()
    const { run, calls } = fakeRunner([{ code: 0, stdout: '{"number":7,"url":"https://x/1"}' }])

    const error = captureError(() =>
      openPullRequest(repo, 'TASK-001', { branch: 'task/004-01-x', run }),
    )

    expect(error).toBeInstanceOf(RawspecError)
    expect(error.code).toBe('E_PR_UNAVAILABLE')
    expect(error.message).toContain('não é uma lista')
    expect(error.details.reason).toBe('not_a_list')
    expect(calls).toHaveLength(1)
    expect(calls[0].args[1]).toBe('list')
  })

  it('recusa a criação quando a procura devolve saída vazia', () => {
    const repo = createRepo()
    const { run, calls } = fakeRunner([{ code: 0, stdout: '' }])

    const error = captureError(() =>
      openPullRequest(repo, 'TASK-001', { branch: 'task/004-01-x', run }),
    )

    expect(error).toBeInstanceOf(RawspecError)
    expect(error.code).toBe('E_PR_UNAVAILABLE')
    expect(error.message).toContain('saída vazia')
    expect(error.details.reason).toBe('empty_output')
    expect(calls).toHaveLength(1)
    expect(calls[0].args[1]).toBe('list')
  })

  it('recusa a criação quando a lista traz um pull request malformado', () => {
    const repo = createRepo()
    const { run, calls } = fakeRunner([{ code: 0, stdout: '[{"number":7}]' }])

    const error = captureError(() =>
      openPullRequest(repo, 'TASK-001', { branch: 'task/004-01-x', run }),
    )

    expect(error).toBeInstanceOf(RawspecError)
    expect(error.code).toBe('E_PR_UNAVAILABLE')
    expect(error.message).toContain('malformado')
    expect(error.details.reason).toBe('malformed_entry')
    expect(calls).toHaveLength(1)
    expect(calls[0].args[1]).toBe('list')
  })

  it('recusa a criação quando o número do pull request não é um inteiro', () => {
    const repo = createRepo()
    const { run } = fakeRunner([
      { code: 0, stdout: '[{"number":"sete","url":"https://github.com/acme/site/pull/7"}]' },
    ])

    const error = captureError(() =>
      openPullRequest(repo, 'TASK-001', { branch: 'task/004-01-x', run }),
    )

    expect(error.code).toBe('E_PR_UNAVAILABLE')
    expect(error.details.reason).toBe('malformed_entry')
  })

  it('recusa a criação quando o número do pull request é nulo', () => {
    const repo = createRepo()
    const { run, calls } = fakeRunner([
      { code: 0, stdout: '[{"number":null,"url":"https://github.com/acme/site/pull/7"}]' },
    ])

    const error = captureError(() =>
      openPullRequest(repo, 'TASK-001', { branch: 'task/004-01-x', run }),
    )

    expect(error).toBeInstanceOf(RawspecError)
    expect(error.code).toBe('E_PR_UNAVAILABLE')
    expect(error.details.reason).toBe('malformed_entry')
    expect(calls).toHaveLength(1)
    expect(calls.some((call) => call.args[1] === 'create')).toBe(false)
  })

  it('recusa a criação quando o número do pull request é booleano', () => {
    const repo = createRepo()
    const { run, calls } = fakeRunner([
      { code: 0, stdout: '[{"number":true,"url":"https://github.com/acme/site/pull/7"}]' },
    ])

    const error = captureError(() =>
      openPullRequest(repo, 'TASK-001', { branch: 'task/004-01-x', run }),
    )

    expect(error).toBeInstanceOf(RawspecError)
    expect(error.code).toBe('E_PR_UNAVAILABLE')
    expect(error.details.reason).toBe('malformed_entry')
    expect(calls.some((call) => call.args[1] === 'create')).toBe(false)
  })

  it('recusa a criação quando o número do pull request é falso', () => {
    const repo = createRepo()
    const { run, calls } = fakeRunner([
      { code: 0, stdout: '[{"number":false,"url":"https://github.com/acme/site/pull/7"}]' },
    ])

    const error = captureError(() =>
      openPullRequest(repo, 'TASK-001', { branch: 'task/004-01-x', run }),
    )

    expect(error).toBeInstanceOf(RawspecError)
    expect(error.code).toBe('E_PR_UNAVAILABLE')
    expect(error.details.reason).toBe('malformed_entry')
    expect(calls.some((call) => call.args[1] === 'create')).toBe(false)
  })

  it('recusa a criação quando o número do pull request é uma string vazia', () => {
    const repo = createRepo()
    const { run, calls } = fakeRunner([
      { code: 0, stdout: '[{"number":"","url":"https://github.com/acme/site/pull/7"}]' },
    ])

    const error = captureError(() =>
      openPullRequest(repo, 'TASK-001', { branch: 'task/004-01-x', run }),
    )

    expect(error).toBeInstanceOf(RawspecError)
    expect(error.code).toBe('E_PR_UNAVAILABLE')
    expect(error.details.reason).toBe('malformed_entry')
    expect(calls.some((call) => call.args[1] === 'create')).toBe(false)
  })

  it('recusa a criação quando o número do pull request é uma string numérica', () => {
    const repo = createRepo()
    const { run, calls } = fakeRunner([
      { code: 0, stdout: '[{"number":"7","url":"https://github.com/acme/site/pull/7"}]' },
    ])

    const error = captureError(() =>
      openPullRequest(repo, 'TASK-001', { branch: 'task/004-01-x', run }),
    )

    expect(error).toBeInstanceOf(RawspecError)
    expect(error.code).toBe('E_PR_UNAVAILABLE')
    expect(error.details.reason).toBe('malformed_entry')
    expect(calls.some((call) => call.args[1] === 'create')).toBe(false)
  })

  it('recusa a criação quando o número do pull request é zero', () => {
    const repo = createRepo()
    const { run, calls } = fakeRunner([
      { code: 0, stdout: '[{"number":0,"url":"https://github.com/acme/site/pull/7"}]' },
    ])

    const error = captureError(() =>
      openPullRequest(repo, 'TASK-001', { branch: 'task/004-01-x', run }),
    )

    expect(error).toBeInstanceOf(RawspecError)
    expect(error.code).toBe('E_PR_UNAVAILABLE')
    expect(error.details.reason).toBe('malformed_entry')
    expect(calls.some((call) => call.args[1] === 'create')).toBe(false)
  })

  it('recusa a criação quando o número do pull request é negativo', () => {
    const repo = createRepo()
    const { run, calls } = fakeRunner([
      { code: 0, stdout: '[{"number":-7,"url":"https://github.com/acme/site/pull/7"}]' },
    ])

    const error = captureError(() =>
      openPullRequest(repo, 'TASK-001', { branch: 'task/004-01-x', run }),
    )

    expect(error).toBeInstanceOf(RawspecError)
    expect(error.code).toBe('E_PR_UNAVAILABLE')
    expect(error.details.reason).toBe('malformed_entry')
    expect(calls.some((call) => call.args[1] === 'create')).toBe(false)
  })

  it('recusa a criação quando o número do pull request é um decimal', () => {
    const repo = createRepo()
    const { run, calls } = fakeRunner([
      { code: 0, stdout: '[{"number":7.5,"url":"https://github.com/acme/site/pull/7"}]' },
    ])

    const error = captureError(() =>
      openPullRequest(repo, 'TASK-001', { branch: 'task/004-01-x', run }),
    )

    expect(error).toBeInstanceOf(RawspecError)
    expect(error.code).toBe('E_PR_UNAVAILABLE')
    expect(error.details.reason).toBe('malformed_entry')
    expect(calls.some((call) => call.args[1] === 'create')).toBe(false)
  })

  it('não reporta um pull request com número malformado como existente', () => {
    const repo = createRepo()
    const { run, calls } = fakeRunner([
      { code: 0, stdout: '[{"number":null,"url":"https://github.com/acme/site/pull/7"}]' },
    ])

    captureError(() => openPullRequest(repo, 'TASK-001', { branch: 'task/004-01-x', run }))

    expect(calls).toHaveLength(1)
    expect(calls[0].args[1]).toBe('list')
  })

  it('aceita um número de pull request inteiro positivo', () => {
    const repo = createRepo()
    const { run, calls } = fakeRunner([
      { code: 0, stdout: '[{"number":7,"url":"https://github.com/acme/site/pull/7"}]' },
    ])

    const result = openPullRequest(repo, 'TASK-001', { branch: 'task/004-01-x', run })

    expect(result.status).toBe('existing')
    expect(result.number).toBe(7)
    expect(calls).toHaveLength(1)
  })

  it('não desfaz o commit nem o push quando o número do pull request é malformado', () => {
    const repo = createRepo()
    const bare = join(workDir, 'remote-pr-malformed-number.git')
    mkdirSync(bare, { recursive: true })
    gitIsolated(bare, ['init', '--bare'], { gitDir: bare })
    addGitHubRemote(repo, bare)
    createTaskBranch(repo, 'TASK-001')
    touchTaskFile(repo)
    const { run, calls } = fakeRunner([
      { code: 0, stdout: '[{"number":null,"url":"https://github.com/acme/site/pull/11"}]' },
    ])

    const result = commitAndPushTask(repo, 'TASK-001', {
      checks: [],
      push: true,
      runExternal: run,
    })

    expect(result.pushed).toBe(true)
    expect(result.commit).not.toBe('')
    expect(result.pullRequest.status).toBe('failed')
    expect(result.pullRequest.error.code).toBe('E_PR_UNAVAILABLE')
    expect(result.pullRequest.error.details.reason).toBe('malformed_entry')
    expect(result.pullRequest.url).toBeNull()
    expect(calls.some((call) => call.args[1] === 'create')).toBe(false)
    expect(git(repo, ['branch', '-r'])).toContain('origin/task/004-001-implementar-coisa')
  })

  it('recusa a criação quando o estado do pull request não é uma string', () => {
    const repo = createRepo()
    const { run } = fakeRunner([
      {
        code: 0,
        stdout: '[{"number":7,"url":"https://github.com/acme/site/pull/7","state":42}]',
      },
    ])

    const error = captureError(() =>
      openPullRequest(repo, 'TASK-001', { branch: 'task/004-01-x', run }),
    )

    expect(error.code).toBe('E_PR_UNAVAILABLE')
    expect(error.details.reason).toBe('malformed_entry')
  })

  it('aceita uma lista vazia válida como ausência de pull request', () => {
    const repo = createRepo()
    const { run, calls } = fakeRunner([
      { code: 0, stdout: '[]' },
      { code: 0, stdout: 'https://github.com/acme/site/pull/21\n' },
    ])

    const result = openPullRequest(repo, 'TASK-001', { branch: 'task/004-01-x', run })

    expect(result.status).toBe('created')
    expect(calls).toHaveLength(2)
    expect(calls[1].args[1]).toBe('create')
  })

  it('aceita um pull request sem estado nem título, com valores por omissão', () => {
    const repo = createRepo()
    const { run } = fakeRunner([
      { code: 0, stdout: '[{"number":3,"url":"https://github.com/acme/site/pull/3"}]' },
    ])

    const result = openPullRequest(repo, 'TASK-001', { branch: 'task/004-01-x', run })

    expect(result.status).toBe('existing')
    expect(result.number).toBe(3)
    expect(result.title).toBe('')
  })

  it('não cria pull request quando a resposta da procura é inválida', () => {
    const repo = createRepo()
    const { run, calls } = fakeRunner([{ code: 0, stdout: '{"unexpected":true}' }])

    captureError(() => openPullRequest(repo, 'TASK-001', { branch: 'task/004-01-x', run }))

    expect(calls.some((call) => call.args[1] === 'create')).toBe(false)
  })

  it('recusa um pull request da branch para ela própria, sem chamar o gh', () => {
    const repo = createRepo()
    const { run, calls } = fakeRunner([{ code: 0, stdout: '[]' }])

    const error = captureError(() =>
      openPullRequest(repo, 'TASK-001', { branch: 'main', base: 'main', run }),
    )

    expect(error).toBeInstanceOf(RawspecError)
    expect(error.code).toBe('E_ARGS')
    expect(error.message).toContain('main')
    expect(error.details.branch).toBe('main')
    expect(error.details.base).toBe('main')
    expect(calls).toHaveLength(0)
  })

  it('gera título e corpo com a tarefa, a mudança e a branch', () => {
    const content = buildPullRequestContent(
      {
        change: { id: '004-test' },
        task: {
          id: 'TASK-001',
          title: 'Implementar coisa',
          verification: 'VERIFIED',
          evidence: 'testes',
        },
      },
      'task/004-001-x',
    )

    expect(content.title).toContain('004-test')
    expect(content.title).toContain('TASK-001')
    expect(content.title).toContain('Implementar coisa')
    expect(content.body).toContain('`task/004-001-x`')
    expect(content.body).toContain('`main`')
    expect(content.body).toContain('testes')
  })

  it('usa a branch base pedida no corpo do pull request', () => {
    const content = buildPullRequestContent(
      {
        change: { id: '004-test' },
        task: {
          id: 'TASK-001',
          title: 'Implementar coisa',
          verification: 'VERIFIED',
          evidence: null,
        },
      },
      'task/004-001-x',
      'develop',
    )

    expect(content.body).toContain('`develop`')
    expect(content.body).not.toContain('`main`')
  })

  it('abre o pull request no commit-task depois do push', () => {
    const repo = createRepo()
    const bare = join(workDir, 'remote-pr.git')
    mkdirSync(bare, { recursive: true })
    gitIsolated(bare, ['init', '--bare'], { gitDir: bare })
    addGitHubRemote(repo, bare)
    createTaskBranch(repo, 'TASK-001')
    touchTaskFile(repo)
    const { run, calls } = fakeRunner([
      { code: 0, stdout: '[]' },
      { code: 0, stdout: 'https://github.com/acme/site/pull/11\n' },
    ])

    const result = commitAndPushTask(repo, 'TASK-001', {
      checks: [],
      push: true,
      runExternal: run,
    })

    expect(result.pushed).toBe(true)
    expect(result.pullRequest.status).toBe('created')
    expect(result.pullRequest.url).toBe('https://github.com/acme/site/pull/11')
    expect(calls).toHaveLength(2)
    expect(calls[1].args.slice(0, 2)).toEqual(['pr', 'create'])
  })

  it('não desfaz o commit nem o push quando o pull request falha', () => {
    const repo = createRepo()
    const bare = join(workDir, 'remote-pr-fail.git')
    mkdirSync(bare, { recursive: true })
    gitIsolated(bare, ['init', '--bare'], { gitDir: bare })
    addGitHubRemote(repo, bare)
    createTaskBranch(repo, 'TASK-001')
    touchTaskFile(repo)
    const { run } = fakeRunner([{ code: 1, stderr: 'gh: not authenticated' }])

    const result = commitAndPushTask(repo, 'TASK-001', {
      checks: [],
      push: true,
      runExternal: run,
    })

    expect(result.pushed).toBe(true)
    expect(result.commit).not.toBe('')
    expect(result.pullRequest.status).toBe('failed')
    expect(result.pullRequest.error.code).toBe('E_PR_UNAVAILABLE')
    expect(git(repo, ['branch', '-r'])).toContain('origin/task/004-001-implementar-coisa')
  })

  it('não desfaz o commit nem o push quando a resposta da procura é inválida', () => {
    const repo = createRepo()
    const bare = join(workDir, 'remote-pr-invalid.git')
    mkdirSync(bare, { recursive: true })
    gitIsolated(bare, ['init', '--bare'], { gitDir: bare })
    addGitHubRemote(repo, bare)
    createTaskBranch(repo, 'TASK-001')
    touchTaskFile(repo)
    const { run, calls } = fakeRunner([{ code: 0, stdout: 'resposta inválida' }])

    const result = commitAndPushTask(repo, 'TASK-001', {
      checks: [],
      push: true,
      runExternal: run,
    })

    expect(result.pushed).toBe(true)
    expect(result.commit).not.toBe('')
    expect(result.pullRequest.status).toBe('failed')
    expect(result.pullRequest.error.code).toBe('E_PR_UNAVAILABLE')
    expect(result.pullRequest.url).toBeNull()
    expect(calls.some((call) => call.args[1] === 'create')).toBe(false)
    expect(git(repo, ['branch', '-r'])).toContain('origin/task/004-001-implementar-coisa')
  })

  it('não abre pull request sem push', () => {
    const repo = createRepo()
    touchTaskFile(repo)
    const { run, calls } = fakeRunner([{ code: 0, stdout: '[]' }])

    const result = commitAndPushTask(repo, 'TASK-001', {
      checks: [],
      push: false,
      runExternal: run,
    })

    expect(result.pushed).toBe(false)
    expect(result.pullRequest).toBeNull()
    expect(calls).toHaveLength(0)
  })

  it('não abre pull request quando desativado', () => {
    const repo = createRepo()
    const bare = join(workDir, 'remote-pr-off.git')
    mkdirSync(bare, { recursive: true })
    gitIsolated(bare, ['init', '--bare'], { gitDir: bare })
    addGitHubRemote(repo, bare)
    createTaskBranch(repo, 'TASK-001')
    touchTaskFile(repo)
    const { run, calls } = fakeRunner([{ code: 0, stdout: '[]' }])

    const result = commitAndPushTask(repo, 'TASK-001', {
      checks: [],
      push: true,
      pr: false,
      runExternal: run,
    })

    expect(result.pullRequest).toBeNull()
    expect(calls).toHaveLength(0)
  })
})

describe('resolução do GitHub CLI', () => {
  /**
   * Guarda o `PATH` original e restores-o no fim.
   *
   * @returns {() => void} função de reposição do `PATH`.
   */
  function withPath() {
    const original = process.env.PATH
    return () => {
      if (original === undefined) {
        delete process.env.PATH
      } else {
        process.env.PATH = original
      }
    }
  }

  it('devolve o caminho do executável encontrado no PATH', () => {
    const restore = withPath()
    const dir = join(workDir, 'gh-bin')
    mkdirSync(dir, { recursive: true })
    const name = process.platform === 'win32' ? 'gh.exe' : 'gh'
    const executable = join(dir, name)
    writeFileSync(executable, '', 'utf8')
    chmodSync(executable, 0o755)
    process.env.PATH = dir

    try {
      expect(resolveGhExecutable()).toBe(executable)
    } finally {
      restore()
    }
  })

  it('ignora em POSIX o ficheiro gh sem bit de execução', () => {
    if (process.platform === 'win32') return

    const restore = withPath()
    const dir = join(workDir, 'gh-sem-permissao')
    mkdirSync(dir, { recursive: true })
    const executable = join(dir, 'gh')
    writeFileSync(executable, '', 'utf8')
    chmodSync(executable, 0o644)
    process.env.PATH = dir

    try {
      expect(resolveGhExecutable()).toBeNull()
    } finally {
      restore()
    }
  })

  it('ignora um directório com o nome do GitHub CLI', () => {
    const restore = withPath()
    const dir = join(workDir, 'gh-directorio')
    mkdirSync(join(dir, process.platform === 'win32' ? 'gh.exe' : 'gh'), { recursive: true })
    process.env.PATH = dir

    try {
      expect(resolveGhExecutable()).toBeNull()
    } finally {
      restore()
    }
  })

  it('devolve null quando o GitHub CLI não está no PATH', () => {
    const restore = withPath()
    const dir = join(workDir, 'sem-gh')
    mkdirSync(dir, { recursive: true })
    process.env.PATH = dir

    try {
      expect(resolveGhExecutable()).toBeNull()
    } finally {
      restore()
    }
  })

  it('ignora ficheiros que não são executáveis do GitHub CLI', () => {
    const restore = withPath()
    const dir = join(workDir, 'gh-incorrecto')
    mkdirSync(dir, { recursive: true })
    writeFileSync(join(dir, 'gh.txt'), '', 'utf8')
    writeFileSync(join(dir, 'outro'), '', 'utf8')
    process.env.PATH = dir

    try {
      expect(resolveGhExecutable()).toBeNull()
    } finally {
      restore()
    }
  })

  it('reporta falha do comando externo sem lançar', () => {
    const result = runExternalCommand('comando-que-nao-existe', [], workDir)

    expect(result.code).not.toBe(0)
    expect(result.stdout).toBe('')
    expect(result.stderr).not.toBe('')
  })

  it('reporta o GitHub CLI indisponível sem tentar executá-lo', () => {
    const restore = withPath()
    const dir = join(workDir, 'sem-gh-execucao')
    mkdirSync(dir, { recursive: true })
    process.env.PATH = dir

    try {
      const result = runExternalCommand('gh', ['pr', 'list'], workDir)

      expect(result.code).toBe(127)
      expect(result.unavailable).toBe(true)
      expect(result.stdout).toBe('')
      expect(result.stderr).toContain('indisponível')
    } finally {
      restore()
    }
  })

  it('devolve o resultado de um comando externo que termina com sucesso', () => {
    const result = runExternalCommand(
      process.execPath,
      ['-e', 'process.stdout.write("ok")'],
      workDir,
    )

    expect(result.code).toBe(0)
    expect(result.stdout).toBe('ok')
    expect(result.stderr).toBe('')
  })

  it('reporta o código de saída de um comando externo que falha', () => {
    const result = runExternalCommand(
      process.execPath,
      ['-e', 'process.stderr.write("erro"); process.exit(3)'],
      workDir,
    )

    expect(result.code).toBe(3)
    expect(result.stderr).toContain('erro')
  })
})
