/**
 * Testes do parser de mudanças e tarefas.
 *
 * TASK-002 da change 002-rawspec-task-commands.
 */

import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import {
  RawspecError,
  normalizeChangeId,
  normalizeTaskId,
  parseChange,
  parseTasks,
  readDocumentStatus,
  validateTaskStructure,
} from './rawspec.mjs'

const REPO_ROOT = join(import.meta.dirname, '..')
const CHANGE_001 = join(REPO_ROOT, 'specs', 'changes', '001-portfolio-mvp')

let workDir

beforeEach(() => {
  workDir = mkdtempSync(join(tmpdir(), 'rawspec-parser-'))
})

afterEach(() => {
  rmSync(workDir, { recursive: true, force: true })
})

/**
 * Cria uma mudança de teste no diretório temporário.
 *
 * @param {string} name nome do diretório da mudança.
 * @param {Record<string, string>} files mapa de nome do arquivo para conteúdo.
 * @returns {string} caminho absoluto da mudança.
 */
function writeChange(name, files) {
  const dir = join(workDir, name)
  mkdirSync(dir, { recursive: true })
  for (const [file, content] of Object.entries(files)) {
    writeFileSync(join(dir, file), content, 'utf8')
  }
  return dir
}

/**
 * Cria um `tasks.md` de teste.
 *
 * @param {string} content conteúdo do documento.
 * @param {string} [name] nome da mudança.
 * @returns {string} caminho absoluto do `tasks.md`.
 */
function writeTasks(content, name = '002-test') {
  const dir = join(workDir, name)
  mkdirSync(dir, { recursive: true })
  const tasksPath = join(dir, 'tasks.md')
  writeFileSync(tasksPath, content, 'utf8')
  return tasksPath
}

describe('normalizeTaskId', () => {
  it('normaliza TASK-3 para TASK-003', () => {
    expect(normalizeTaskId('TASK-3')).toBe('TASK-003')
  })

  it('mantém identificadores canônicos', () => {
    expect(normalizeTaskId('TASK-001')).toBe('TASK-001')
    expect(normalizeTaskId('TASK-042')).toBe('TASK-042')
  })

  it('aceita entrada com espaços e caixa diferente', () => {
    expect(normalizeTaskId('  task-7 ')).toBe('TASK-007')
  })

  it('recusa identificador fora do padrão', () => {
    expect(() => normalizeTaskId('TASK-AB')).toThrow(RawspecError)
    expect(() => normalizeTaskId('001')).toThrow(/Identificador de tarefa inválido/)
  })
})

describe('normalizeChangeId', () => {
  const changes = [
    { id: '001', name: '001-portfolio-mvp' },
    { id: '002', name: '002-rawspec-task-commands' },
  ]

  it('resolve pelo prefixo numérico', () => {
    expect(normalizeChangeId('002', changes)).toBe('002-rawspec-task-commands')
  })

  it('resolve pelo slug completo', () => {
    expect(normalizeChangeId('001-portfolio-mvp', changes)).toBe('001-portfolio-mvp')
  })

  it('recusa mudança inexistente', () => {
    expect(() => normalizeChangeId('999', changes)).toThrow(/Mudança não encontrada/)
  })

  it('reporta ambiguidade', () => {
    expect(() => normalizeChangeId('001', [{ name: '001-a' }, { name: '001-b' }])).toThrow(
      /Mais de uma mudança/,
    )
  })
})

describe('readDocumentStatus', () => {
  it('lê status com negrito', () => {
    expect(readDocumentStatus('**Status:** APPROVED\n\n## Seção\n')).toBe('APPROVED')
  })

  it('lê status sem negrito', () => {
    expect(readDocumentStatus('- Status: PENDING APPROVAL\n')).toBe('PENDING APPROVAL')
  })

  it('ignora status depois do primeiro título de seção', () => {
    expect(readDocumentStatus('# Doc\n\n## Seção\n\n- Status: APPROVED\n')).toBeNull()
  })

  it('retorna null quando não há status', () => {
    expect(readDocumentStatus('# Doc\n')).toBeNull()
  })
})

describe('parseTasks', () => {
  it('lê a change 001 sem alteração', () => {
    const doc = parseTasks(join(CHANGE_001, 'tasks.md'))
    expect(doc.tasks.length).toBeGreaterThan(0)
    expect(doc.status).toBe('APPROVED')
    expect(doc.tasks[0].id).toBe('TASK-001')
    expect(doc.tasks[0].title).toBe('Inicializar aplicação')
    expect(doc.tasks[0].status).toBe('COMPLETED')
    expect(doc.tasks[0].verification).toBe('VERIFIED')
    expect(doc.tasks[0].evidence).toContain('lint')
  })

  it('lê status com e sem negrito', () => {
    const path = writeTasks(
      [
        '# Plano',
        '',
        '**Status:** APPROVED',
        '',
        '### TASK-001 — Primeira',
        '- **Status:** PENDING',
        '',
      ].join('\n'),
    )
    const doc = parseTasks(path)
    expect(doc.status).toBe('APPROVED')
    expect(doc.tasks[0].status).toBe('PENDING')
  })

  it('usa PENDING quando status, verificação e plano estão ausentes', () => {
    const path = writeTasks('# Plano\n\n### TASK-001 — Primeira\n\n- Alguma nota.\n')
    const [task] = parseTasks(path).tasks
    expect(task.status).toBe('PENDING')
    expect(task.verification).toBe('PENDING')
    expect(task.evidence).toBeNull()
    expect(task.actionPlan).toBeNull()
    expect(task.dependencySource).toBe('undeclared')
  })

  it('normaliza identificador e dependências', () => {
    const path = writeTasks(
      ['# Plano', '', '### TASK-001 — Primeira', '- **Depende de:** TASK-0, TASK-00', ''].join(
        '\n',
      ),
    )
    const [task] = parseTasks(path).tasks
    expect(task.id).toBe('TASK-001')
    expect(task.dependencies).toEqual(['TASK-000', 'TASK-000'])
    expect(task.dependencySource).toBe('explicit')
  })

  it('trata "Depende de: nenhuma" como dependência explícita vazia', () => {
    const path = writeTasks('# Plano\n\n### TASK-001 — Primeira\n- **Depende de:** nenhuma\n')
    const [task] = parseTasks(path).tasks
    expect(task.dependencies).toEqual([])
    expect(task.dependencySource).toBe('none')
  })

  it('registra os limites da tarefa', () => {
    const path = writeTasks(
      ['# Plano', '', '### TASK-001 — Primeira', 'conteúdo', '', '## Fase 2', ''].join('\n'),
    )
    const [task] = parseTasks(path).tasks
    expect(task.startLine).toBe(3)
    // A última linha com conteúdo da tarefa; linhas em branco finais não contam.
    expect(task.endLine).toBe(4)
  })

  it('ignora markdown comum fora das tarefas', () => {
    const path = writeTasks(
      [
        '# Plano',
        '',
        'Texto livre antes.',
        '',
        '## Fase 1',
        '',
        '### TASK-001 — Primeira',
        '',
        'Lista:',
        '- item',
        '',
      ].join('\n'),
    )
    const doc = parseTasks(path)
    expect(doc.tasks).toHaveLength(1)
  })

  it('não encerra a tarefa em título ### sem o token TASK', () => {
    const path = writeTasks(
      [
        '# Plano',
        '',
        '### TASK-001 — Primeira',
        '',
        '### Observações',
        '',
        '- **Status:** IN PROGRESS',
        '',
      ].join('\n'),
    )
    const [task] = parseTasks(path).tasks
    expect(task.status).toBe('IN PROGRESS')
    expect(task.title).toBe('Primeira')
  })

  it('ignora cabeçalhos dentro de blocos de código', () => {
    const path = writeTasks(
      [
        '# Plano',
        '',
        '### TASK-001 — Primeira',
        '',
        '```markdown',
        '### TASK-999 — Falso',
        '```',
        '',
      ].join('\n'),
    )
    const doc = parseTasks(path)
    expect(doc.tasks).toHaveLength(1)
    expect(doc.tasks[0].id).toBe('TASK-001')
  })
})

describe('parseTasks — erros E_PARSE', () => {
  it('rejeita tasks.md ausente', () => {
    expect(() => parseTasks(join(workDir, 'nao-existe', 'tasks.md'))).toThrow(RawspecError)
    expect(() => parseTasks(join(workDir, 'nao-existe', 'tasks.md'))).toThrow(/ausente ou ilegível/)
  })

  it('rejeita arquivo sem tarefas', () => {
    const path = writeTasks('# Plano\n\nSem tarefas.\n')
    expect(() => parseTasks(path)).toThrow(/Nenhuma tarefa reconhecida/)
  })

  it('rejeita cabeçalho sem identificador reconhecível', () => {
    const path = writeTasks('# Plano\n\n### TASK — Título\n')
    expect(() => parseTasks(path)).toThrow(/Cabeçalho de tarefa inválido/)
  })

  it('rejeita cabeçalho sem título', () => {
    const path = writeTasks('# Plano\n\n### TASK-001\n')
    expect(() => parseTasks(path)).toThrow(/Tarefa sem título válido/)
  })

  it('rejeita título vazio após o identificador', () => {
    const path = writeTasks('# Plano\n\n### TASK-001 — \n')
    expect(() => parseTasks(path)).toThrow(/Tarefa sem título válido/)
  })

  it('rejeita identificador duplicado', () => {
    const path = writeTasks(
      ['# Plano', '', '### TASK-001 — Primeira', '', '### TASK-001 — Repetida', ''].join('\n'),
    )
    expect(() => parseTasks(path)).toThrow(/Identificador duplicado/)
  })

  it('rejeita dependência malformada', () => {
    const path = writeTasks('# Plano\n\n### TASK-001 — Primeira\n- **Depende de:** TASK-AB\n')
    expect(() => parseTasks(path)).toThrow(/Dependência inválida/)
  })

  it('rejeita status desconhecido', () => {
    const path = writeTasks('# Plano\n\n### TASK-001 — Primeira\n- **Status:** CONCLUIDA\n')
    expect(() => parseTasks(path)).toThrow(/Status inválido/)
  })

  it('rejeita verificação desconhecida', () => {
    const path = writeTasks('# Plano\n\n### TASK-001 — Primeira\n- **Verificação:** OK\n')
    expect(() => parseTasks(path)).toThrow(/Verificação inválida/)
  })

  it('rejeita bloco de código cercado não fechado', () => {
    const path = writeTasks('# Plano\n\n### TASK-001 — Primeira\n\n```markdown\nsem fim\n')
    expect(() => parseTasks(path)).toThrow(/Bloco de código cercado não fechado/)
  })

  it('rejeita conteúdo que não é UTF-8', () => {
    const dir = join(workDir, '002-invalido')
    mkdirSync(dir, { recursive: true })
    const tasksPath = join(dir, 'tasks.md')
    writeFileSync(tasksPath, Buffer.from([0x23, 0x20, 0xff, 0xfe, 0x0a]))
    expect(() => parseTasks(tasksPath)).toThrow(/UTF-8/)
  })

  it('usa o código E_PARSE em todos os casos', () => {
    const path = writeTasks('# Plano\n\nSem tarefas.\n')
    try {
      parseTasks(path)
      throw new Error('deveria ter lançado')
    } catch (error) {
      expect(error).toBeInstanceOf(RawspecError)
      expect(error.code).toBe('E_PARSE')
    }
  })
})

describe('validateTaskStructure', () => {
  it('rejeita duplicidade', () => {
    const doc = {
      file: 'tasks.md',
      tasks: [
        { id: 'TASK-001', startLine: 1 },
        { id: 'TASK-001', startLine: 2 },
      ],
    }
    expect(() => validateTaskStructure(doc)).toThrow(/Identificador duplicado/)
  })

  it('aceita estrutura válida', () => {
    const doc = { file: 'tasks.md', tasks: [{ id: 'TASK-001' }, { id: 'TASK-002' }] }
    expect(validateTaskStructure(doc)).toBe(doc)
  })
})

describe('parseChange', () => {
  it('lê proposta, design e tarefas', () => {
    const dir = writeChange('002-exemplo', {
      'proposal.md': '# Change\n\n- Status: APPROVED\n',
      'design.md': '# Design\n\n**Status:** APPROVED\n',
      'tasks.md':
        '# Plano\n\n**Status:** APPROVED\n\n### TASK-001 — Primeira\n- **Status:** PENDING\n',
    })
    const change = parseChange(dir)
    expect(change.id).toBe('002-exemplo')
    expect(change.proposalStatus).toBe('APPROVED')
    expect(change.designStatus).toBe('APPROVED')
    expect(change.tasksStatus).toBe('APPROVED')
    expect(change.tasks).toHaveLength(1)
  })

  it('aceita mudança sem design.md', () => {
    const dir = writeChange('002-sem-design', {
      'proposal.md': '# Change\n\n- Status: APPROVED\n',
      'tasks.md':
        '# Plano\n\n**Status:** APPROVED\n\n### TASK-001 — Primeira\n- **Status:** PENDING\n',
    })
    const change = parseChange(dir)
    expect(change.designStatus).toBeNull()
    expect(change.tasks).toHaveLength(1)
  })

  it('rejeita proposta ausente', () => {
    const dir = writeChange('002-sem-proposal', {
      'tasks.md': '# Plano\n\n### TASK-001 — Primeira\n',
    })
    expect(() => parseChange(dir)).toThrow(/ausente ou ilegível/)
  })
})
