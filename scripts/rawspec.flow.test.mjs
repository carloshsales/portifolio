/**
 * Testes do resolvedor, dos gates, das transições e do arquivamento.
 *
 * TASK-003 a TASK-008 da change 002-rawspec-task-commands.
 */

import { cpSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import {
  RawspecError,
  archiveChange,
  buildCommitMessage,
  checkActionPlans,
  checkArchive,
  createActionPlan,
  failTask,
  findRepoRoot,
  listOpenTasks,
  listPendingChanges,
  loadChange,
  parseArgs,
  resolveActionPlan,
  resolveTask,
  selectNextTask,
  startTask,
  beginVerification,
  verifyTask,
} from './rawspec.mjs'

const REPO_ROOT = join(import.meta.dirname, '..')
const CHANGE_001 = '001-portfolio-mvp'
const CHANGE_002 = '002-rawspec-task-commands'

let workDir

beforeEach(() => {
  workDir = mkdtempSync(join(tmpdir(), 'rawspec-flow-'))
})

afterEach(() => {
  rmSync(workDir, { recursive: true, force: true })
})

/**
 * Cria uma mudança de teste dentro do diretório temporário.
 *
 * @param {string} name nome do diretório da mudança.
 * @param {Record<string, string>} files mapa de arquivo para conteúdo.
 * @param {string} [root] raiz do repositório de teste.
 * @returns {string} caminho absoluto da mudança.
 */
function writeChange(name, files, root = workDir) {
  const dir = join(root, 'specs', 'changes', name)
  mkdirSync(dir, { recursive: true })
  for (const [file, content] of Object.entries(files)) {
    writeFileSync(join(dir, file), content, 'utf8')
  }
  return dir
}

/**
 * Monta um `tasks.md` a partir de blocos de tarefa.
 *
 * @param {Array<string>} blocks blocos de cada tarefa.
 * @param {string} [status] status do documento.
 * @returns {string} conteúdo do documento.
 */
function tasksDoc(blocks, status = 'APPROVED') {
  return [`# Plano`, '', `**Status:** ${status}`, '', ...blocks].join('\n')
}

/**
 * Monta um bloco de tarefa.
 *
 * @param {string} id identificador.
 * @param {string} title título.
 * @param {object} [options] campos opcionais.
 * @returns {string} bloco markdown.
 */
function taskBlock(id, title, options = {}) {
  const lines = [`### ${id} — ${title}`]
  if (options.depends !== undefined) lines.push(`- **Depende de:** ${options.depends}`)
  if (options.status) lines.push(`- **Status:** ${options.status}`)
  if (options.verification) lines.push(`- **Verificação:** ${options.verification}`)
  if (options.started) lines.push(`- **Início:** ${options.started}`)
  return lines.join('\n')
}

/**
 * Cria um repositório Git temporário com uma mudança.
 *
 * @param {Array<[string, Record<string, string>]>} changes mudanças a criar.
 * @returns {string} raiz do repositório.
 */
function initRepo(changes) {
  const root = join(workDir, 'repo')
  mkdirSync(join(root, 'specs', 'changes', 'archive'), { recursive: true })
  for (const [name, files] of changes) {
    writeChange(name, files, root)
  }
  execFileSync('git', ['init'], { cwd: root, stdio: 'ignore' })
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: root, stdio: 'ignore' })
  execFileSync('git', ['config', 'user.name', 'Test'], { cwd: root, stdio: 'ignore' })
  execFileSync('git', ['add', '-A'], { cwd: root, stdio: 'ignore' })
  execFileSync('git', ['commit', '-m', 'base'], { cwd: root, stdio: 'ignore' })
  return root
}

/**
 * Executa o helper e devolve o JSON de saída.
 *
 * @param {string} root raiz do repositório.
 * @param {Array<string>} args argumentos do helper.
 * @returns {{status: string, code?: string, message?: string, [key: string]: unknown}} saída.
 */
function runHelper(root, args) {
  try {
    const stdout = execFileSync(
      'node',
      [join(REPO_ROOT, 'scripts', 'rawspec.mjs'), ...args, '--json'],
      {
        cwd: root,
        encoding: 'utf8',
      },
    )
    return JSON.parse(stdout)
  } catch (error) {
    const stdout = error.stdout ?? ''
    try {
      return JSON.parse(stdout)
    } catch {
      throw error
    }
  }
}

/**
 * Simula uma interrupção do arquivamento movendo a mudança no disco.
 *
 * @param {string} root raiz do repositório.
 * @param {string} changeId identificador da mudança.
 * @param {object} [options] opções.
 * @param {string} [options.state] estado do `archive-state.json`.
 * @param {boolean} [options.withStateFile] grava ou não o arquivo de estado.
 * @param {boolean} [options.finalizeProposal] finaliza o `proposal.md` do destino.
 * @param {string} [options.staging] marcador de staging já gravado.
 */
function simulateInterruptedArchive(root, changeId, options = {}) {
  const source = join(root, 'specs', 'changes', changeId)
  const destination = join(root, 'specs', 'changes', 'archive', changeId)

  mkdirSync(destination, { recursive: true })
  cpSync(source, destination, { recursive: true })

  if (options.withStateFile !== false) {
    writeFileSync(
      join(destination, 'archive-state.json'),
      `${JSON.stringify(
        {
          change: changeId,
          state: options.state ?? 'ARCHIVING',
          destination: `specs/changes/archive/${changeId}`,
          startedAt: '2026-11-13T10:00:00Z',
        },
        null,
        2,
      )}\n`,
    )
  }

  if (options.finalizeProposal) {
    const proposalPath = join(destination, 'proposal.md')
    const proposal = readFileSync(proposalPath, 'utf8').replace(
      '- Status: APPROVED',
      '- Status: ARCHIVED',
    )
    writeFileSync(
      proposalPath,
      `${proposal}\n- Arquivada em: 2026-11-13\n- Staging Git: ${options.staging ?? 'PENDING'}\n`,
    )
  }

  rmSync(source, { recursive: true, force: true })
}

describe('resolveTask', () => {
  it('resolve uma tarefa única em um repositório de teste', () => {
    const root = initRepo([
      [
        '003-exemplo',
        {
          'proposal.md': '# Change\n\n- Status: APPROVED\n',
          'tasks.md': tasksDoc([taskBlock('TASK-001', 'Primeira', { depends: 'nenhuma' })]),
        },
      ],
    ])

    const result = resolveTask('TASK-001', { repoRoot: root })
    expect(result.task.id).toBe('TASK-001')
    expect(result.task.title).toBe('Primeira')
    expect(result.change.id).toBe('003-exemplo')
  })

  it('normaliza TASK-1 para TASK-001', () => {
    const root = initRepo([
      [
        '003-exemplo',
        {
          'proposal.md': '# Change\n\n- Status: APPROVED\n',
          'tasks.md': tasksDoc([taskBlock('TASK-001', 'Primeira', { depends: 'nenhuma' })]),
        },
      ],
    ])

    expect(resolveTask('TASK-1', { repoRoot: root }).task.id).toBe('TASK-001')
    expect(resolveTask('task-001', { repoRoot: root }).task.id).toBe('TASK-001')
  })

  it('restringe a busca com --change', () => {
    const root = initRepo([
      [
        '003-a',
        {
          'proposal.md': '# Change\n\n- Status: APPROVED\n',
          'tasks.md': tasksDoc([taskBlock('TASK-001', 'A', { depends: 'nenhuma' })]),
        },
      ],
      [
        '004-b',
        {
          'proposal.md': '# Change\n\n- Status: APPROVED\n',
          'tasks.md': tasksDoc([taskBlock('TASK-001', 'B', { depends: 'nenhuma' })]),
        },
      ],
    ])

    const result = resolveTask('TASK-001', { repoRoot: root, changeId: '004-b' })
    expect(result.change.id).toBe('004-b')
    expect(result.task.title).toBe('B')
  })

  it('reporta ambiguidade com as candidatas', () => {
    const root = initRepo([
      [
        '003-a',
        {
          'proposal.md': '# Change\n\n- Status: APPROVED\n',
          'tasks.md': tasksDoc([taskBlock('TASK-001', 'A', { depends: 'nenhuma' })]),
        },
      ],
      [
        '004-b',
        {
          'proposal.md': '# Change\n\n- Status: APPROVED\n',
          'tasks.md': tasksDoc([taskBlock('TASK-001', 'B', { depends: 'nenhuma' })]),
        },
      ],
    ])

    try {
      resolveTask('TASK-001', { repoRoot: root })
      throw new Error('deveria ter lançado')
    } catch (error) {
      expect(error).toBeInstanceOf(RawspecError)
      expect(error.code).toBe('E_TASK_AMBIGUOUS')
      expect(error.details.candidates).toHaveLength(2)
      expect(error.details.candidates[0].change).toBe('003-a')
      expect(error.details.candidates[0].file).toContain('tasks.md')
      expect(error.details.candidates[0].startLine).toBeGreaterThan(0)
    }
  })

  it('falha com E_TASK_NOT_FOUND para tarefa inexistente', () => {
    const root = initRepo([
      [
        '003-a',
        {
          'proposal.md': '# Change\n\n- Status: APPROVED\n',
          'tasks.md': tasksDoc([taskBlock('TASK-001', 'A', { depends: 'nenhuma' })]),
        },
      ],
    ])

    expect(() => resolveTask('TASK-999', { repoRoot: root })).toThrow(/não encontrada/)
    try {
      resolveTask('TASK-999', { repoRoot: root })
    } catch (error) {
      expect(error.code).toBe('E_TASK_NOT_FOUND')
    }
  })

  it('reporta E_TASK_ARCHIVED quando a tarefa existe só em mudança arquivada', () => {
    const root = initRepo([
      [
        '003-a',
        {
          'proposal.md': '# Change\n\n- Status: APPROVED\n',
          'tasks.md': tasksDoc([taskBlock('TASK-001', 'A', { depends: 'nenhuma' })]),
        },
      ],
    ])

    const archived = join(root, 'specs', 'changes', 'archive', '003-a')
    mkdirSync(archived, { recursive: true })
    for (const file of ['proposal.md', 'tasks.md']) {
      writeFileSync(
        join(archived, file),
        readFileSync(join(root, 'specs', 'changes', '003-a', file)),
      )
    }
    rmSync(join(root, 'specs', 'changes', '003-a'), { recursive: true, force: true })

    try {
      resolveTask('TASK-001', { repoRoot: root })
      throw new Error('deveria ter lançado')
    } catch (error) {
      expect(error.code).toBe('E_TASK_ARCHIVED')
    }
  })

  it('recusa identificador fora do padrão', () => {
    expect(() => resolveTask('TASK-AB', { repoRoot: workDir })).toThrow(
      /Identificador de tarefa inválido/,
    )
  })

  it('lê a change 001 real em modo somente leitura', () => {
    const result = resolveTask('TASK-003', { repoRoot: REPO_ROOT, changeId: CHANGE_001 })
    expect(result.change.id).toBe(CHANGE_001)
    expect(result.task.dependencySource).toBe('legacy-sequential')
    expect(result.task.dependencies).toEqual(['TASK-002'])
  })
})

describe('gates de aprovação', () => {
  it('recusa mudança com proposal não aprovado', () => {
    const root = initRepo([
      [
        '003-a',
        {
          'proposal.md': '# Change\n\n- Status: PENDING APPROVAL\n',
          'tasks.md': tasksDoc([taskBlock('TASK-001', 'A', { depends: 'nenhuma' })]),
        },
      ],
    ])

    try {
      resolveTask('TASK-001', { repoRoot: root })
      startTask({ taskId: 'TASK-001', repoRoot: root })
      throw new Error('deveria ter lançado')
    } catch (error) {
      expect(error.code).toBe('E_CHANGE_NOT_APPROVED')
      expect(error.details.missing[0].document).toBe('proposal.md')
    }
  })

  it('recusa mudança com design existente e não aprovado', () => {
    const root = initRepo([
      [
        '003-a',
        {
          'proposal.md': '# Change\n\n- Status: APPROVED\n',
          'design.md': '# Design\n\n- Status: PENDING APPROVAL\n',
          'tasks.md': tasksDoc([taskBlock('TASK-001', 'A', { depends: 'nenhuma' })]),
        },
      ],
    ])

    try {
      startTask({ taskId: 'TASK-001', repoRoot: root })
      throw new Error('deveria ter lançado')
    } catch (error) {
      expect(error.code).toBe('E_CHANGE_NOT_APPROVED')
      expect(error.details.missing.map((item) => item.document)).toContain('design.md')
    }
  })

  it('recusa mudança com tasks não aprovado', () => {
    const root = initRepo([
      [
        '003-a',
        {
          'proposal.md': '# Change\n\n- Status: APPROVED\n',
          'tasks.md': tasksDoc(
            [taskBlock('TASK-001', 'A', { depends: 'nenhuma' })],
            'PENDING APPROVAL',
          ),
        },
      ],
    ])

    try {
      startTask({ taskId: 'TASK-001', repoRoot: root })
      throw new Error('deveria ter lançado')
    } catch (error) {
      expect(error.code).toBe('E_CHANGE_NOT_APPROVED')
      expect(error.details.missing.map((item) => item.document)).toContain('tasks.md')
    }
  })

  it('aceita mudança aprovada sem design.md', () => {
    const root = initRepo([
      [
        '003-a',
        {
          'proposal.md': '# Change\n\n- Status: APPROVED\n',
          'tasks.md': tasksDoc([taskBlock('TASK-001', 'A', { depends: 'nenhuma' })]),
        },
      ],
    ])

    expect(() => startTask({ taskId: 'TASK-001', repoRoot: root })).not.toThrow()
  })
})

describe('gates de dependências', () => {
  it('recusa tarefa sem "Depende de" em mudança nova', () => {
    const root = initRepo([
      [
        '003-a',
        {
          'proposal.md': '# Change\n\n- Status: APPROVED\n',
          'tasks.md': tasksDoc([taskBlock('TASK-001', 'A')]),
        },
      ],
    ])

    try {
      loadChange(root, '003-a')
      throw new Error('deveria ter lançado')
    } catch (error) {
      expect(error.code).toBe('E_DEPENDENCY_UNDECLARED')
    }
  })

  it('recusa mesmo quando nenhuma tarefa declara o campo', () => {
    const root = initRepo([
      [
        '003-a',
        {
          'proposal.md': '# Change\n\n- Status: APPROVED\n',
          'tasks.md': tasksDoc([taskBlock('TASK-001', 'A'), taskBlock('TASK-002', 'B')]),
        },
      ],
    ])

    try {
      loadChange(root, '003-a')
      throw new Error('deveria ter lançado')
    } catch (error) {
      expect(error.code).toBe('E_DEPENDENCY_UNDECLARED')
    }
  })

  it('aplica modo legado somente à change 001', () => {
    const change = loadChange(REPO_ROOT, CHANGE_001)
    expect(change.legacySequential).toBe(true)
    expect(change.tasks[0].dependencySource).toBe('none')
    expect(change.tasks[1].dependencySource).toBe('legacy-sequential')
    expect(change.tasks[1].dependencies).toEqual(['TASK-001'])
  })

  it('recusa dependência inexistente', () => {
    const root = initRepo([
      [
        '003-a',
        {
          'proposal.md': '# Change\n\n- Status: APPROVED\n',
          'tasks.md': tasksDoc([taskBlock('TASK-001', 'A', { depends: 'TASK-999' })]),
        },
      ],
    ])

    try {
      startTask({ taskId: 'TASK-001', repoRoot: root })
      throw new Error('deveria ter lançado')
    } catch (error) {
      expect(error.code).toBe('E_DEPENDENCY_UNKNOWN')
    }
  })

  it('recusa autodependência', () => {
    const root = initRepo([
      [
        '003-a',
        {
          'proposal.md': '# Change\n\n- Status: APPROVED\n',
          'tasks.md': tasksDoc([taskBlock('TASK-001', 'A', { depends: 'TASK-001' })]),
        },
      ],
    ])

    try {
      startTask({ taskId: 'TASK-001', repoRoot: root })
      throw new Error('deveria ter lançar')
    } catch (error) {
      expect(error.code).toBe('E_DEPENDENCY_CYCLE')
    }
  })

  it('recusa ciclo de dependências', () => {
    const root = initRepo([
      [
        '003-a',
        {
          'proposal.md': '# Change\n\n- Status: APPROVED\n',
          'tasks.md': tasksDoc([
            taskBlock('TASK-001', 'A', { depends: 'TASK-002' }),
            taskBlock('TASK-002', 'B', { depends: 'TASK-001' }),
          ]),
        },
      ],
    ])

    try {
      startTask({ taskId: 'TASK-001', repoRoot: root })
      throw new Error('deveria ter lançado')
    } catch (error) {
      expect(error.code).toBe('E_DEPENDENCY_CYCLE')
    }
  })

  it('recusa dependência não concluída com a lista de pendências', () => {
    const root = initRepo([
      [
        '003-a',
        {
          'proposal.md': '# Change\n\n- Status: APPROVED\n',
          'tasks.md': tasksDoc([
            taskBlock('TASK-001', 'A', { depends: 'nenhuma', status: 'PENDING' }),
            taskBlock('TASK-002', 'B', { depends: 'TASK-001' }),
          ]),
        },
      ],
    ])

    try {
      startTask({ taskId: 'TASK-002', repoRoot: root })
      throw new Error('deveria ter lançado')
    } catch (error) {
      expect(error.code).toBe('E_DEPENDENCY_PENDING')
      expect(error.details.pending[0].id).toBe('TASK-001')
      expect(error.details.pending[0].source).toBe('explicit')
    }
  })

  it('recusa dependência concluída sem verificação', () => {
    const root = initRepo([
      [
        '003-a',
        {
          'proposal.md': '# Change\n\n- Status: APPROVED\n',
          'tasks.md': tasksDoc([
            taskBlock('TASK-001', 'A', {
              depends: 'nenhuma',
              status: 'COMPLETED',
              verification: 'PENDING',
            }),
            taskBlock('TASK-002', 'B', { depends: 'TASK-001' }),
          ]),
        },
      ],
    ])

    try {
      startTask({ taskId: 'TASK-002', repoRoot: root })
      throw new Error('deveria ter lançado')
    } catch (error) {
      expect(error.code).toBe('E_DEPENDENCY_PENDING')
    }
  })

  it('aceita dependência concluída e verificada', () => {
    const root = initRepo([
      [
        '003-a',
        {
          'proposal.md': '# Change\n\n- Status: APPROVED\n',
          'tasks.md': tasksDoc([
            taskBlock('TASK-001', 'A', {
              depends: 'nenhuma',
              status: 'COMPLETED',
              verification: 'VERIFIED (2026-11-13) — testes aprovados.',
            }),
            taskBlock('TASK-002', 'B', { depends: 'TASK-001' }),
          ]),
        },
      ],
    ])

    expect(() => startTask({ taskId: 'TASK-002', repoRoot: root })).not.toThrow()
  })
})

describe('seleção da próxima tarefa', () => {
  it('retorna a primeira PENDING da mudança', () => {
    const root = initRepo([
      [
        '003-a',
        {
          'proposal.md': '# Change\n\n- Status: APPROVED\n',
          'tasks.md': tasksDoc([
            taskBlock('TASK-001', 'A', {
              depends: 'nenhuma',
              status: 'COMPLETED',
              verification: 'VERIFIED (2026-11-13) — ok.',
            }),
            taskBlock('TASK-002', 'B', { depends: 'TASK-001' }),
            taskBlock('TASK-003', 'C', { depends: 'TASK-002' }),
          ]),
        },
      ],
    ])

    const result = selectNextTask(root)
    expect(result.task.id).toBe('TASK-002')
  })

  it('não pula tarefa bloqueada', () => {
    const root = initRepo([
      [
        '003-a',
        {
          'proposal.md': '# Change\n\n- Status: APPROVED\n',
          'tasks.md': tasksDoc([
            taskBlock('TASK-001', 'A', { depends: 'TASK-002' }),
            taskBlock('TASK-002', 'B', { depends: 'nenhuma' }),
          ]),
        },
      ],
    ])

    try {
      selectNextTask(root)
      throw new Error('deveria ter lançado')
    } catch (error) {
      expect(error.code).toBe('E_DEPENDENCY_PENDING')
      expect(error.details.pending[0].id).toBe('TASK-002')
    }
  })

  it('falha com E_NOTHING_TO_START sem tarefas pendentes', () => {
    const root = initRepo([
      [
        '003-a',
        {
          'proposal.md': '# Change\n\n- Status: APPROVED\n',
          'tasks.md': tasksDoc([
            taskBlock('TASK-001', 'A', {
              depends: 'nenhuma',
              status: 'COMPLETED',
              verification: 'VERIFIED (2026-11-13) — ok.',
            }),
          ]),
        },
      ],
    ])

    try {
      selectNextTask(root)
      throw new Error('deveria ter lançado')
    } catch (error) {
      expect(error.code).toBe('E_NOTHING_TO_START')
    }
  })

  it('falha com E_CHANGE_NOT_APPROVED quando só há mudanças não aprovadas', () => {
    const root = initRepo([
      [
        '003-a',
        {
          'proposal.md': '# Change\n\n- Status: PENDING APPROVAL\n',
          'tasks.md': tasksDoc([taskBlock('TASK-001', 'A', { depends: 'nenhuma' })]),
        },
      ],
    ])

    try {
      selectNextTask(root)
      throw new Error('deveria ter lançado')
    } catch (error) {
      expect(error.code).toBe('E_CHANGE_NOT_APPROVED')
    }
  })

  it('reporta ambiguidade quando mais de uma mudança aprovada tem pendências', () => {
    const root = initRepo([
      [
        '003-a',
        {
          'proposal.md': '# Change\n\n- Status: APPROVED\n',
          'tasks.md': tasksDoc([taskBlock('TASK-001', 'A', { depends: 'nenhuma' })]),
        },
      ],
      [
        '004-b',
        {
          'proposal.md': '# Change\n\n- Status: APPROVED\n',
          'tasks.md': tasksDoc([taskBlock('TASK-001', 'B', { depends: 'nenhuma' })]),
        },
      ],
    ])

    try {
      selectNextTask(root)
      throw new Error('deveria ter lançado')
    } catch (error) {
      expect(error.code).toBe('E_CHANGE_AMBIGUOUS')
      expect(error.details.candidates).toHaveLength(2)
    }
  })

  it('lista as tarefas abertas', () => {
    const root = initRepo([
      [
        '003-a',
        {
          'proposal.md': '# Change\n\n- Status: APPROVED\n',
          'tasks.md': tasksDoc([
            taskBlock('TASK-001', 'A', { depends: 'nenhuma', status: 'IN PROGRESS' }),
            taskBlock('TASK-002', 'B', { depends: 'TASK-001', status: 'VERIFYING' }),
            taskBlock('TASK-003', 'C', { depends: 'TASK-002' }),
          ]),
        },
      ],
    ])

    const open = listOpenTasks(root)
    expect(open).toHaveLength(2)
    expect(open[0].task.id).toBe('TASK-001')
    expect(open[1].task.status).toBe('VERIFYING')
  })

  it('lista mudanças pendentes com o estado de aprovação', () => {
    const root = initRepo([
      [
        '003-a',
        {
          'proposal.md': '# Change\n\n- Status: APPROVED\n',
          'tasks.md': tasksDoc([taskBlock('TASK-001', 'A', { depends: 'nenhuma' })]),
        },
      ],
      [
        '004-b',
        {
          'proposal.md': '# Change\n\n- Status: PENDING APPROVAL\n',
          'tasks.md': tasksDoc([taskBlock('TASK-001', 'B', { depends: 'nenhuma' })]),
        },
      ],
    ])

    const pending = listPendingChanges(root)
    expect(pending).toHaveLength(2)
    expect(pending.find((item) => item.id === '003-a').approved).toBe(true)
    expect(pending.find((item) => item.id === '004-b').approved).toBe(false)
  })
})

describe('transições de estado', () => {
  it('move PENDING para IN PROGRESS e registra a data', () => {
    const root = initRepo([
      [
        '003-a',
        {
          'proposal.md': '# Change\n\n- Status: APPROVED\n',
          'tasks.md': tasksDoc([taskBlock('TASK-001', 'A', { depends: 'nenhuma' })]),
        },
      ],
    ])

    const result = startTask({ taskId: 'TASK-001', repoRoot: root })
    expect(result.task.status).toBe('IN PROGRESS')
    expect(result.task.startedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('recusa iniciar tarefa já em progresso', () => {
    const root = initRepo([
      [
        '003-a',
        {
          'proposal.md': '# Change\n\n- Status: APPROVED\n',
          'tasks.md': tasksDoc([
            taskBlock('TASK-001', 'A', { depends: 'nenhuma', status: 'IN PROGRESS' }),
          ]),
        },
      ],
    ])

    try {
      startTask({ taskId: 'TASK-001', repoRoot: root })
      throw new Error('deveria ter lançado')
    } catch (error) {
      expect(error.code).toBe('E_TASK_STATE')
      expect(error.message).toContain('/continuespec')
    }
  })

  it('recusa iniciar tarefa concluída', () => {
    const root = initRepo([
      [
        '003-a',
        {
          'proposal.md': '# Change\n\n- Status: APPROVED\n',
          'tasks.md': tasksDoc([
            taskBlock('TASK-001', 'A', {
              depends: 'nenhuma',
              status: 'COMPLETED',
              verification: 'VERIFIED (2026-11-13) — ok.',
            }),
          ]),
        },
      ],
    ])

    try {
      startTask({ taskId: 'TASK-001', repoRoot: root })
      throw new Error('deveria ter lançado')
    } catch (error) {
      expect(error.code).toBe('E_TASK_STATE')
    }
  })

  it('move IN PROGRESS para VERIFYING', () => {
    const root = initRepo([
      [
        '003-a',
        {
          'proposal.md': '# Change\n\n- Status: APPROVED\n',
          'tasks.md': tasksDoc([
            taskBlock('TASK-001', 'A', { depends: 'nenhuma', status: 'IN PROGRESS' }),
          ]),
        },
      ],
    ])

    const result = beginVerification({ taskId: 'TASK-001', repoRoot: root })
    expect(result.task.status).toBe('VERIFYING')
  })

  it('recusa begin-verify fora de IN PROGRESS', () => {
    const root = initRepo([
      [
        '003-a',
        {
          'proposal.md': '# Change\n\n- Status: APPROVED\n',
          'tasks.md': tasksDoc([taskBlock('TASK-001', 'A', { depends: 'nenhuma' })]),
        },
      ],
    ])

    try {
      beginVerification({ taskId: 'TASK-001', repoRoot: root })
      throw new Error('deveria ter lançado')
    } catch (error) {
      expect(error.code).toBe('E_TASK_STATE')
    }
  })

  it('conclui com COMPLETED e VERIFIED gravando a evidência', () => {
    const root = initRepo([
      [
        '003-a',
        {
          'proposal.md': '# Change\n\n- Status: APPROVED\n',
          'tasks.md': tasksDoc([
            taskBlock('TASK-001', 'A', { depends: 'nenhuma', status: 'VERIFYING' }),
          ]),
        },
      ],
    ])

    const result = verifyTask({ taskId: 'TASK-001', repoRoot: root }, 'testes aprovados')
    expect(result.task.status).toBe('COMPLETED')
    expect(result.task.verification).toBe('VERIFIED')
    expect(result.task.evidence).toContain('testes aprovados')
  })

  it('recusa verify sem evidência', () => {
    const root = initRepo([
      [
        '003-a',
        {
          'proposal.md': '# Change\n\n- Status: APPROVED\n',
          'tasks.md': tasksDoc([
            taskBlock('TASK-001', 'A', { depends: 'nenhuma', status: 'VERIFYING' }),
          ]),
        },
      ],
    ])

    try {
      verifyTask({ taskId: 'TASK-001', repoRoot: root }, '   ')
      throw new Error('deveria ter lançado')
    } catch (error) {
      expect(error.code).toBe('E_EVIDENCE_REQUIRED')
    }
  })

  it('registra FAILED e mantém a tarefa aberta', () => {
    const root = initRepo([
      [
        '003-a',
        {
          'proposal.md': '# Change\n\n- Status: APPROVED\n',
          'tasks.md': tasksDoc([
            taskBlock('TASK-001', 'A', { depends: 'nenhuma', status: 'VERIFYING' }),
          ]),
        },
      ],
    ])

    const result = failTask({ taskId: 'TASK-001', repoRoot: root }, 'build quebrado')
    expect(result.task.status).toBe('IN PROGRESS')
    expect(result.task.verification).toBe('FAILED')
    expect(result.task.evidence).toContain('build quebrado')
  })

  it('preserva CRLF', () => {
    const root = initRepo([
      [
        '003-a',
        {
          'proposal.md': '# Change\r\n\r\n- Status: APPROVED\r\n',
          'tasks.md':
            '# Plano\r\n\r\n**Status:** APPROVED\r\n\r\n### TASK-001 — A\r\n- **Depende de:** nenhuma\r\n',
        },
      ],
    ])

    startTask({ taskId: 'TASK-001', repoRoot: root })
    const content = readFileSync(join(root, 'specs', 'changes', '003-a', 'tasks.md'), 'utf8')
    expect(content.includes('\r\n')).toBe(true)
    expect(/[^\r]\n/.test(content)).toBe(false)
  })

  it('preserva o restante do conteúdo do arquivo', () => {
    const root = initRepo([
      [
        '003-a',
        {
          'proposal.md': '# Change\n\n- Status: APPROVED\n',
          'tasks.md': tasksDoc([
            taskBlock('TASK-001', 'A', { depends: 'nenhuma' }),
            'texto livre da tarefa',
          ]),
        },
      ],
    ])

    startTask({ taskId: 'TASK-001', repoRoot: root })
    const content = readFileSync(join(root, 'specs', 'changes', '003-a', 'tasks.md'), 'utf8')
    expect(content).toContain('texto livre da tarefa')
    expect(content).toContain('### TASK-001 — A')
  })
})

describe('mensagem de commit e planos de ação', () => {
  it('gera a mensagem para tarefa concluída', () => {
    const root = initRepo([
      [
        '003-a',
        {
          'proposal.md': '# Change\n\n- Status: APPROVED\n',
          'tasks.md': tasksDoc([
            taskBlock('TASK-001', 'A', {
              depends: 'nenhuma',
              status: 'COMPLETED',
              verification: 'VERIFIED (2026-11-13) — testes aprovados.',
            }),
          ]),
        },
      ],
    ])

    const result = buildCommitMessage({ taskId: 'TASK-001', repoRoot: root })
    expect(result.message).toContain('feat(rawspec)')
    expect(result.message).toContain('Change: 003-a')
    expect(result.message).toContain('Task: TASK-001')
    expect(result.message).toContain('Action-Plan: none')
  })

  it('recusa a mensagem para tarefa incompleta', () => {
    const root = initRepo([
      [
        '003-a',
        {
          'proposal.md': '# Change\n\n- Status: APPROVED\n',
          'tasks.md': tasksDoc([taskBlock('TASK-001', 'A', { depends: 'nenhuma' })]),
        },
      ],
    ])

    try {
      buildCommitMessage({ taskId: 'TASK-001', repoRoot: root })
      throw new Error('deveria ter lançado')
    } catch (error) {
      expect(error.code).toBe('E_COMMIT_MESSAGE_BLOCKED')
    }
  })

  it('cria plano de ação com PENDING ACCEPTANCE e registra o caminho na tarefa', () => {
    const root = initRepo([
      [
        '003-a',
        {
          'proposal.md': '# Change\n\n- Status: APPROVED\n',
          'tasks.md': tasksDoc([
            taskBlock('TASK-001', 'A', { depends: 'nenhuma', status: 'IN PROGRESS' }),
          ]),
        },
      ],
    ])

    const result = createActionPlan(
      { taskId: 'TASK-001', repoRoot: root },
      { slug: 'build-failure', severity: 'ALTA', problem: 'build quebrado' },
    )
    expect(result.plan.status).toBe('PENDING ACCEPTANCE')
    expect(result.plan.relative).toContain('action-plans/TASK-001-')
    expect(existsSync(result.plan.path)).toBe(true)

    const content = readFileSync(result.plan.path, 'utf8')
    expect(content).toContain('Status: PENDING ACCEPTANCE')
    expect(content).toContain('build quebrado')

    const tasks = readFileSync(join(root, 'specs', 'changes', '003-a', 'tasks.md'), 'utf8')
    expect(tasks).toContain('Plano de ação')
  })

  it('plano não resolvido bloqueia a mensagem de commit', () => {
    const root = initRepo([
      [
        '003-a',
        {
          'proposal.md': '# Change\n\n- Status: APPROVED\n',
          'tasks.md': tasksDoc([
            taskBlock('TASK-001', 'A', {
              depends: 'nenhuma',
              status: 'COMPLETED',
              verification: 'VERIFIED (2026-11-13) — ok.',
            }),
          ]),
        },
      ],
    ])

    createActionPlan({ taskId: 'TASK-001', repoRoot: root }, { slug: 'risco' })

    try {
      buildCommitMessage({ taskId: 'TASK-001', repoRoot: root })
      throw new Error('deveria ter lançado')
    } catch (error) {
      expect(error.code).toBe('E_ACTION_PLAN_UNRESOLVED')
    }
  })

  it('plano RESOLVED libera a mensagem de commit', () => {
    const root = initRepo([
      [
        '003-a',
        {
          'proposal.md': '# Change\n\n- Status: APPROVED\n',
          'tasks.md': tasksDoc([
            taskBlock('TASK-001', 'A', {
              depends: 'nenhuma',
              status: 'COMPLETED',
              verification: 'VERIFIED (2026-11-13) — ok.',
            }),
          ]),
        },
      ],
    ])

    const created = createActionPlan({ taskId: 'TASK-001', repoRoot: root }, { slug: 'risco' })
    resolveActionPlan(created.plan.path, 'risco tratado')

    const change = loadChange(root, '003-a')
    expect(checkActionPlans(change)).toHaveLength(0)

    const message = buildCommitMessage({ taskId: 'TASK-001', repoRoot: root })
    expect(message.message).toContain('Action-Plan:')
    expect(message.message).not.toContain('Action-Plan: none')
  })
})

describe('arquivamento', () => {
  it('bloqueia arquivamento com tarefa PENDING', () => {
    const root = initRepo([
      [
        '003-a',
        {
          'proposal.md': '# Change\n\n- Status: APPROVED\n',
          'tasks.md': tasksDoc([taskBlock('TASK-001', 'A', { depends: 'nenhuma' })]),
        },
      ],
    ])

    try {
      archiveChange({ repoRoot: root, changeId: '003-a' })
      throw new Error('deveria ter lançado')
    } catch (error) {
      expect(error.code).toBe('E_ARCHIVE_PENDING_TASKS')
    }
    expect(existsSync(join(root, 'specs', 'changes', '003-a'))).toBe(true)
  })

  it('bloqueia arquivamento com COMPLETED sem VERIFIED', () => {
    const root = initRepo([
      [
        '003-a',
        {
          'proposal.md': '# Change\n\n- Status: APPROVED\n',
          'tasks.md': tasksDoc([
            taskBlock('TASK-001', 'A', { depends: 'nenhuma', status: 'COMPLETED' }),
          ]),
        },
      ],
    ])

    try {
      archiveChange({ repoRoot: root, changeId: '003-a' })
      throw new Error('deveria ter lançado')
    } catch (error) {
      expect(error.code).toBe('E_ARCHIVE_PENDING_TASKS')
    }
  })

  it('bloqueia arquivamento com plano PENDING ACCEPTANCE', () => {
    const root = initRepo([
      [
        '003-a',
        {
          'proposal.md': '# Change\n\n- Status: APPROVED\n',
          'tasks.md': tasksDoc([
            taskBlock('TASK-001', 'A', {
              depends: 'nenhuma',
              status: 'COMPLETED',
              verification: 'VERIFIED (2026-11-13) — ok.',
            }),
          ]),
        },
      ],
    ])

    createActionPlan({ taskId: 'TASK-001', repoRoot: root }, { slug: 'risco' })

    try {
      archiveChange({ repoRoot: root, changeId: '003-a' })
      throw new Error('deveria ter lançado')
    } catch (error) {
      expect(error.code).toBe('E_ACTION_PLAN_PENDING')
    }
    expect(existsSync(join(root, 'specs', 'changes', '003-a'))).toBe(true)
  })

  it('arquiva mudança completa com rename atômico e staging exato', () => {
    const root = initRepo([
      [
        '003-a',
        {
          'proposal.md': '# Change\n\n- Status: APPROVED\n',
          'tasks.md': tasksDoc([
            taskBlock('TASK-001', 'A', {
              depends: 'nenhuma',
              status: 'COMPLETED',
              verification: 'VERIFIED (2026-11-13) — ok.',
            }),
          ]),
        },
      ],
    ])

    const result = archiveChange({ repoRoot: root, changeId: '003-a' })

    expect(existsSync(join(root, 'specs', 'changes', '003-a'))).toBe(false)
    const destination = join(root, 'specs', 'changes', 'archive', '003-a')
    expect(existsSync(destination)).toBe(true)
    expect(existsSync(join(destination, 'tasks.md'))).toBe(true)
    expect(result.staging.status).toBe('DONE')

    const proposal = readFileSync(join(destination, 'proposal.md'), 'utf8')
    expect(proposal).toContain('Status: ARCHIVED')
    expect(proposal).toContain('Staging Git: DONE')
    expect(proposal).toContain('Arquivada em:')

    const state = JSON.parse(readFileSync(join(destination, 'archive-state.json'), 'utf8'))
    expect(state.state).toBe('ARCHIVED')
  })

  it('o proposal.md final fica staged e não fica unstaged', () => {
    const root = initRepo([
      [
        '003-a',
        {
          'proposal.md': '# Change\n\n- Status: APPROVED\n',
          'tasks.md': tasksDoc([
            taskBlock('TASK-001', 'A', {
              depends: 'nenhuma',
              status: 'COMPLETED',
              verification: 'VERIFIED (2026-11-13) — ok.',
            }),
          ]),
        },
      ],
    ])

    archiveChange({ repoRoot: root, changeId: '003-a' })

    const indexed = execFileSync('git', ['show', ':specs/changes/archive/003-a/proposal.md'], {
      cwd: root,
      encoding: 'utf8',
    })
    expect(indexed).toContain('Status: ARCHIVED')
    expect(indexed).toContain('Staging Git: DONE')

    const status = execFileSync('git', ['status', '--porcelain'], { cwd: root, encoding: 'utf8' })
    const unstaged = status
      .split(/\r?\n/)
      .filter((line) => line.trim() !== '')
      .filter((line) => {
        const code = line.slice(0, 2)
        return code === ' M' || code === ' D' || code === '??' || code.charAt(1) === 'M'
      })
    expect(unstaged).toEqual([])
  })

  it('não executa git add quando a validação falha', () => {
    const root = initRepo([
      [
        '003-a',
        {
          'proposal.md': '# Change\n\n- Status: APPROVED\n',
          'tasks.md': tasksDoc([taskBlock('TASK-001', 'A', { depends: 'nenhuma' })]),
        },
      ],
    ])

    try {
      archiveChange({ repoRoot: root, changeId: '003-a' })
    } catch {
      // esperado
    }

    const status = execFileSync('git', ['status', '--porcelain'], { cwd: root, encoding: 'utf8' })
    expect(status).toBe('')
  })

  it('recusa arquivamento de tarefa isolada', () => {
    const output = runHelper(workDir, ['archive', 'TASK-001'])
    expect(output.status).toBe('error')
    expect(output.code).toBe('E_ARCHIVE_TASK_SCOPE')
  })

  it('bloqueia arquivamento com alteração rastreada preexistente', () => {
    const root = initRepo([
      [
        '003-a',
        {
          'proposal.md': '# Change\n\n- Status: APPROVED\n',
          'tasks.md': tasksDoc([
            taskBlock('TASK-001', 'A', {
              depends: 'nenhuma',
              status: 'COMPLETED',
              verification: 'VERIFIED (2026-11-13) — ok.',
            }),
          ]),
        },
      ],
    ])

    const tasksPath = join(root, 'specs', 'changes', '003-a', 'tasks.md')
    writeFileSync(tasksPath, `${readFileSync(tasksPath, 'utf8')}\nalteração do usuário\n`)

    try {
      archiveChange({ repoRoot: root, changeId: '003-a' })
      throw new Error('deveria ter lançado')
    } catch (error) {
      expect(error.code).toBe('E_GIT_DIRTY')
    }
    expect(existsSync(join(root, 'specs', 'changes', '003-a'))).toBe(true)
  })

  it('recusa destino já existente', () => {
    const root = initRepo([
      [
        '003-a',
        {
          'proposal.md': '# Change\n\n- Status: APPROVED\n',
          'tasks.md': tasksDoc([
            taskBlock('TASK-001', 'A', {
              depends: 'nenhuma',
              status: 'COMPLETED',
              verification: 'VERIFIED (2026-11-13) — ok.',
            }),
          ]),
        },
      ],
    ])

    mkdirSync(join(root, 'specs', 'changes', 'archive', '003-a'), { recursive: true })

    try {
      archiveChange({ repoRoot: root, changeId: '003-a' })
      throw new Error('deveria ter lançado')
    } catch (error) {
      expect(error.code).toBe('E_ARCHIVE_DESTINATION_EXISTS')
    }
  })

  it('recupera arquivamento interrompido sem mover de novo', () => {
    const root = initRepo([
      [
        '003-a',
        {
          'proposal.md': '# Change\n\n- Status: APPROVED\n',
          'tasks.md': tasksDoc([
            taskBlock('TASK-001', 'A', {
              depends: 'nenhuma',
              status: 'COMPLETED',
              verification: 'VERIFIED (2026-11-13) — ok.',
            }),
          ]),
        },
      ],
    ])

    // Simula a interrupção: rename feito, archive-state.json em ARCHIVING.
    const source = join(root, 'specs', 'changes', '003-a')
    const destination = join(root, 'specs', 'changes', 'archive', '003-a')
    simulateInterruptedArchive(root, '003-a', { state: 'ARCHIVING' })

    const result = archiveChange({ repoRoot: root, changeId: '003-a' })

    expect(result.moved).toBe(false)
    expect(result.recovered).toBe(true)
    expect(existsSync(source)).toBe(false)
    expect(existsSync(destination)).toBe(true)

    const proposal = readFileSync(join(destination, 'proposal.md'), 'utf8')
    expect(proposal).toContain('Status: ARCHIVED')

    const state = JSON.parse(readFileSync(join(destination, 'archive-state.json'), 'utf8'))
    expect(state.state).toBe('ARCHIVED')
  })

  it('não rebaixa um marcador Staging Git já DONE', () => {
    const root = initRepo([
      [
        '003-a',
        {
          'proposal.md': '# Change\n\n- Status: APPROVED\n',
          'tasks.md': tasksDoc([
            taskBlock('TASK-001', 'A', {
              depends: 'nenhuma',
              status: 'COMPLETED',
              verification: 'VERIFIED (2026-11-13) — ok.',
            }),
          ]),
        },
      ],
    ])

    const source = join(root, 'specs', 'changes', '003-a')
    const destination = join(root, 'specs', 'changes', 'archive', '003-a')
    simulateInterruptedArchive(root, '003-a', {
      state: 'ARCHIVED',
      finalizeProposal: true,
      staging: 'DONE',
    })

    archiveChange({ repoRoot: root, changeId: '003-a' })

    const proposal = readFileSync(join(destination, 'proposal.md'), 'utf8')
    expect(proposal).toContain('Staging Git: DONE')
  })

  it('reporta E_ARCHIVE_STATE_UNKNOWN para destino sem marcadores', () => {
    const root = initRepo([
      [
        '003-a',
        {
          'proposal.md': '# Change\n\n- Status: APPROVED\n',
          'tasks.md': tasksDoc([
            taskBlock('TASK-001', 'A', {
              depends: 'nenhuma',
              status: 'COMPLETED',
              verification: 'VERIFIED (2026-11-13) — ok.',
            }),
          ]),
        },
      ],
    ])

    const source = join(root, 'specs', 'changes', '003-a')
    const destination = join(root, 'specs', 'changes', 'archive', '003-a')
    simulateInterruptedArchive(root, '003-a', { withStateFile: false })

    try {
      archiveChange({ repoRoot: root, changeId: '003-a' })
      throw new Error('deveria ter lançado')
    } catch (error) {
      expect(error.code).toBe('E_ARCHIVE_STATE_UNKNOWN')
    }
    expect(existsSync(destination)).toBe(true)
  })

  it('check-archive lista as pendências', () => {
    const root = initRepo([
      [
        '003-a',
        {
          'proposal.md': '# Change\n\n- Status: APPROVED\n',
          'tasks.md': tasksDoc([taskBlock('TASK-001', 'A', { depends: 'nenhuma' })]),
        },
      ],
    ])

    const change = loadChange(root, '003-a')
    const report = checkArchive(change, root)
    expect(report.eligible).toBe(false)
    expect(report.pendingTasks).toHaveLength(1)
    expect(report.destination).toContain('archive/003-a')
  })

  it('não confunde menção em prosa com o marcador Staging Git', () => {
    const root = initRepo([
      [
        '003-a',
        {
          'proposal.md': [
            '# Change',
            '',
            '- Status: APPROVED',
            '',
            '## 1. Requisitos',
            '',
            '- **RF-25** — Garantir que a versão final do `proposal.md` arquivado, com `Staging Git: DONE`, esteja no índice.',
            '',
          ].join('\n'),
          'tasks.md': tasksDoc([
            taskBlock('TASK-001', 'A', {
              depends: 'nenhuma',
              status: 'COMPLETED',
              verification: 'VERIFIED (2026-11-13) — ok.',
            }),
          ]),
        },
      ],
    ])

    archiveChange({ repoRoot: root, changeId: '003-a' })

    const proposal = readFileSync(
      join(root, 'specs', 'changes', 'archive', '003-a', 'proposal.md'),
      'utf8',
    )

    // O marcador real é um campo do cabeçalho.
    expect(proposal).toMatch(/^- Staging Git: DONE$/m)
    // A linha de prosa original não foi alterada.
    expect(proposal).toContain('com `Staging Git: DONE`, esteja no índice')

    // E a versão final está no índice Git.
    const indexed = execFileSync('git', ['show', ':specs/changes/archive/003-a/proposal.md'], {
      cwd: root,
      encoding: 'utf8',
    })
    expect(indexed).toMatch(/^- Staging Git: DONE$/m)
    expect(indexed).toContain('- Status: ARCHIVED')
  })

  it('não confunde menção em prosa no cabeçalho com o marcador Staging Git', () => {
    const root = initRepo([
      [
        '003-a',
        {
          'proposal.md': [
            '# Change',
            '',
            '- Status: APPROVED',
            '- Observação: o marcador `Staging Git: DONE` será escrito ao final.',
            '',
          ].join('\n'),
          'tasks.md': tasksDoc([
            taskBlock('TASK-001', 'A', {
              depends: 'nenhuma',
              status: 'COMPLETED',
              verification: 'VERIFIED (2026-11-13) — ok.',
            }),
          ]),
        },
      ],
    ])

    archiveChange({ repoRoot: root, changeId: '003-a' })

    const proposal = readFileSync(
      join(root, 'specs', 'changes', 'archive', '003-a', 'proposal.md'),
      'utf8',
    )
    expect(proposal).toContain(
      '- Observação: o marcador `Staging Git: DONE` será escrito ao final.',
    )
    expect(proposal).toMatch(/^- Staging Git: DONE$/m)
  })

  it('a escrita dos marcadores é idempotente', () => {
    const root = initRepo([
      [
        '003-a',
        {
          'proposal.md': '# Change\n\n- Status: APPROVED\n\n## 1. Requisitos\n\ntexto\n',
          'tasks.md': tasksDoc([
            taskBlock('TASK-001', 'A', {
              depends: 'nenhuma',
              status: 'COMPLETED',
              verification: 'VERIFIED (2026-11-13) — ok.',
            }),
          ]),
        },
      ],
    ])

    archiveChange({ repoRoot: root, changeId: '003-a' })
    const proposalPath = join(root, 'specs', 'changes', 'archive', '003-a', 'proposal.md')
    const first = readFileSync(proposalPath, 'utf8')

    // Repetir o arquivamento não pode duplicar marcadores nem mover de novo.
    archiveChange({ repoRoot: root, changeId: '003-a' })
    const second = readFileSync(proposalPath, 'utf8')

    const count = (text, pattern) => text.split(/\r?\n/).filter((line) => pattern.test(line)).length

    expect(count(second, /^- Status: ARCHIVED$/)).toBe(1)
    expect(count(second, /^- Arquivada em:/)).toBe(1)
    expect(count(second, /^- Staging Git:/)).toBe(1)
    expect(second).toBe(first)
  })
})

describe('parseArgs', () => {
  it('interpreta TASK-ID, --change e ausência de argumento', () => {
    expect(parseArgs(['TASK-003']).positional).toEqual(['TASK-003'])
    expect(parseArgs(['TASK-003', '--change', '001-portfolio-mvp']).options.changeId).toBe(
      '001-portfolio-mvp',
    )
    expect(parseArgs([]).positional).toEqual([])
  })

  it('interpreta --evidence e --json', () => {
    const parsed = parseArgs(['TASK-003', '--evidence', 'testes aprovados', '--json'])
    expect(parsed.options.evidence).toBe('testes aprovados')
    expect(parsed.options.json).toBe(true)
  })

  it('recusa flag desconhecida', () => {
    expect(() => parseArgs(['--desconhecida'])).toThrow(/Flag desconhecida/)
  })
})

describe('findRepoRoot', () => {
  it('encontra a raiz a partir de um subdiretório', () => {
    expect(findRepoRoot(join(REPO_ROOT, 'scripts'))).toBe(REPO_ROOT)
  })
})
