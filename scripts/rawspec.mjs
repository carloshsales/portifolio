/**
 * RawSpec helper — parser de mudanças e tarefas.
 *
 * TASK-002 da change 002-rawspec-task-commands.
 *
 * Este módulo apenas lê e interpreta os arquivos Markdown do RawSpec.
 * Ele não escreve arquivos: as tarefas de escrita são implementadas depois.
 */

import { readFileSync } from 'node:fs'
import { basename, join } from 'node:path'

/** Status válidos de uma tarefa. */
export const TASK_STATUSES = ['PENDING', 'IN PROGRESS', 'VERIFYING', 'COMPLETED']

/** Estados válidos do campo `Verificação`. */
export const TASK_VERIFICATIONS = ['PENDING', 'VERIFIED', 'FAILED']

/** Status válidos de aprovação de uma mudança. */
export const CHANGE_STATUSES = ['PENDING APPROVAL', 'APPROVED', 'REJECTED', 'SUPERSEDED']

/** Identificador de tarefa no formato canônico. */
const TASK_ID_PATTERN = /^TASK-\d+$/

/** Dependência declarada no formato canônico. */
const DEPENDENCY_ID_PATTERN = /^TASK-\d+$/

/** Cabeçalho de tarefa: `### TASK-NNN — Título`. */
const TASK_HEADING_PATTERN = /^###\s+TASK-(\d+)\s+—\s*(.*)$/

/** Cabeçalho de seção qualquer. */
const HEADING_PATTERN = /^(#{2,3})\s+(.*)$/

/** Delimitador de bloco de código cercado. */
const FENCE_PATTERN = /^\s*(```|~~~)/

/** Linha de campo no formato `- **Campo:** valor` ou `**Campo:** valor`. */
const FIELD_PATTERN = /^(?:-\s+)?\*\*([^*]+):\*\*\s*(.*)$/

/** Linha de campo sem negrito: `- Campo: valor` ou `Campo: valor`. */
const PLAIN_FIELD_PATTERN = /^(?:-\s+)?([^*\n][^*\n]*?):\s*(.*)$/

/**
 * Erro de RawSpec com código estável, mensagem legível e detalhes.
 */
export class RawspecError extends Error {
  /**
   * @param {string} code código do erro, por exemplo `E_PARSE`.
   * @param {string} message mensagem legível.
   * @param {object} [details] detalhes adicionais.
   */
  constructor(code, message, details = {}) {
    super(message)
    this.name = 'RawspecError'
    this.code = code
    this.details = details
  }
}

/**
 * Lê um arquivo UTF-8, convertendo falhas de leitura em `E_PARSE`.
 *
 * @param {string} filePath caminho absoluto do arquivo.
 * @returns {string} conteúdo do arquivo.
 */
export function readTextFile(filePath) {
  let buffer
  try {
    buffer = readFileSync(filePath)
  } catch (error) {
    throw new RawspecError('E_PARSE', `Arquivo ausente ou ilegível: ${filePath}`, {
      file: filePath,
      cause: error.message,
    })
  }

  const text = buffer.toString('utf8')
  if (Buffer.from(text, 'utf8').compare(buffer) !== 0) {
    throw new RawspecError('E_PARSE', `Conteúdo não pode ser lido como UTF-8: ${filePath}`, {
      file: filePath,
    })
  }
  return text
}

/**
 * Normaliza um identificador de tarefa para o formato `TASK-NNN`.
 *
 * @param {string} raw identificador bruto, por exemplo `TASK-3`.
 * @returns {string} identificador canônico.
 */
export function normalizeTaskId(raw) {
  if (typeof raw !== 'string') {
    throw new RawspecError('E_ARGS', `Identificador de tarefa inválido: ${String(raw)}`, {
      value: raw,
    })
  }
  const match = /^TASK-(\d+)$/i.exec(raw.trim())
  if (!match) {
    throw new RawspecError('E_ARGS', `Identificador de tarefa inválido: ${raw}`, { value: raw })
  }
  return `TASK-${match[1].padStart(3, '0')}`
}

/**
 * Normaliza um identificador de mudança comparando prefixo numérico e slug.
 *
 * @param {string} raw identificador bruto, por exemplo `002` ou `rawspec-task-commands`.
 * @param {Array<{id: string, name: string}>} changes mudanças candidatas.
 * @returns {string} identificador canônico da mudança.
 */
export function normalizeChangeId(raw, changes = []) {
  if (typeof raw !== 'string' || raw.trim() === '') {
    throw new RawspecError('E_ARGS', `Identificador de mudança inválido: ${String(raw)}`, {
      value: raw,
    })
  }
  const needle = raw.trim().toLowerCase()
  const matches = changes.filter((change) => {
    const name = String(change.name ?? change.id ?? '').toLowerCase()
    const numeric = /^\d+/.exec(name)?.[0]
    return (
      name === needle ||
      numeric === needle ||
      name.endsWith(`-${needle}`) ||
      name.startsWith(`${needle}-`)
    )
  })

  if (matches.length === 0) {
    throw new RawspecError('E_ARGS', `Mudança não encontrada: ${raw}`, { value: raw })
  }
  if (matches.length > 1) {
    throw new RawspecError('E_CHANGE_AMBIGUOUS', `Mais de uma mudança corresponde a: ${raw}`, {
      value: raw,
      candidates: matches.map((change) => change.name),
    })
  }
  return matches[0].name
}

/**
 * Remove o negrito de um valor de campo.
 *
 * @param {string} value valor bruto.
 * @returns {string} valor sem marcadores de negrito.
 */
function stripBold(value) {
  return value.replace(/^\*\*(.*)\*\*$/, '$1').trim()
}

/**
 * Lê o status de um documento antes do primeiro título `##`.
 *
 * @param {string} text conteúdo do documento.
 * @returns {string|null} status encontrado ou `null`.
 */
export function readDocumentStatus(text) {
  const lines = text.split(/\r?\n/)
  const header = []
  for (const line of lines) {
    if (/^##\s+/.test(line)) break
    header.push(line)
  }

  for (const line of header) {
    const field = FIELD_PATTERN.exec(line) ?? PLAIN_FIELD_PATTERN.exec(line)
    if (!field) continue
    if (field[1].trim().toLowerCase() !== 'status') continue
    const value = stripBold(field[2]).trim()
    if (value !== '') return value
  }
  return null
}

/**
 * Separa o texto em linhas, preservando o conteúdo original.
 *
 * @param {string} text conteúdo do documento.
 * @returns {Array<{text: string, line: number}>} linhas numeradas.
 */
function toLines(text) {
  return text.split(/\r?\n/).map((value, index) => ({ text: value, line: index + 1 }))
}

/**
 * Detecta blocos de código cercado não fechados.
 *
 * @param {Array<{text: string, line: number}>} linhas linhas do documento.
 * @param {string} file caminho do arquivo, usado nos detalhes do erro.
 */
function assertClosedFences(lines, file) {
  let openFence = null
  for (const { text, line } of lines) {
    if (!FENCE_PATTERN.test(text)) continue
    if (openFence === null) {
      openFence = { marker: text.trim().slice(0, 3), line }
    } else if (text.trim().startsWith(openFence.marker)) {
      openFence = null
    }
  }
  if (openFence !== null) {
    throw new RawspecError(
      'E_PARSE',
      `Bloco de código cercado não fechado em ${file}:${openFence.line}`,
      {
        file,
        line: openFence.line,
      },
    )
  }
}

/**
 * Coleta as seções de tarefa de um documento.
 *
 * Uma tarefa começa em `### TASK-NNN — Título` e termina no próximo título
 * `##` ou `###`. Títulos `###` sem o token `TASK` pertencem à tarefa anterior.
 *
 * @param {Array<{text: string, line: number}>} lines linhas do documento.
 * @param {string} file caminho do arquivo, usado nos detalhes do erro.
 * @returns {Array<{id: string, title: string, startLine: number, endLine: number, body: Array<{text: string, line: number}>}>} seções.
 */
function collectTaskSections(lines, file) {
  const sections = []
  let current = null
  let inFence = false
  let fenceMarker = null

  for (const entry of lines) {
    const { text, line } = entry

    if (FENCE_PATTERN.test(text)) {
      if (!inFence) {
        inFence = true
        fenceMarker = text.trim().slice(0, 3)
      } else if (text.trim().startsWith(fenceMarker)) {
        inFence = false
        fenceMarker = null
      }
      if (current) current.body.push(entry)
      continue
    }

    if (inFence) {
      if (current) current.body.push(entry)
      continue
    }

    const heading = HEADING_PATTERN.exec(text)
    if (!heading) {
      if (current) current.body.push(entry)
      continue
    }

    const level = heading[1].length
    const headingText = heading[2]

    if (level === 2) {
      if (current) {
        current.endLine = lastContentLine(current)
        sections.push(current)
        current = null
      }
      continue
    }

    // level 3
    if (headingText.includes('TASK')) {
      const match = TASK_HEADING_PATTERN.exec(text)
      if (!match) {
        // `### TASK-NNN` sem `— Título` é título ausente, não cabeçalho inválido.
        const withoutTitle = /^###\s+TASK-(\d+)\s*$/.exec(text)
        if (withoutTitle) {
          throw new RawspecError('E_PARSE', `Tarefa sem título válido em ${file}:${line}`, {
            file,
            line,
            task: `TASK-${withoutTitle[1].padStart(3, '0')}`,
          })
        }
        throw new RawspecError(
          'E_PARSE',
          `Cabeçalho de tarefa inválido em ${file}:${line}: ${headingText}`,
          { file, line, heading: headingText },
        )
      }
      if (current) {
        current.endLine = lastContentLine(current)
        sections.push(current)
      }
      current = {
        id: `TASK-${match[1].padStart(3, '0')}`,
        title: match[2].trim(),
        startLine: line,
        endLine: line,
        body: [],
      }
      continue
    }

    // Título `###` sem o token TASK: conteúdo da tarefa anterior.
    if (current) current.body.push(entry)
  }

  if (current) {
    current.endLine = lastContentLine(current)
    sections.push(current)
  }

  return sections
}

/**
 * Calcula a última linha com conteúdo de uma seção de tarefa.
 *
 * Linhas em branco no final da seção não pertencem à tarefa.
 *
 * @param {{startLine: number, body: Array<{text: string, line: number}>}} section seção da tarefa.
 * @returns {number} número da última linha com conteúdo.
 */
function lastContentLine(section) {
  let last = section.startLine
  for (const entry of section.body) {
    if (entry.text.trim() !== '') last = entry.line
  }
  return last
}

/**
 * Lê um campo de uma seção de tarefa.
 *
 * @param {Array<{text: string, line: number}>} body linhas do corpo da tarefa.
 * @param {string} name nome do campo.
 * @returns {{value: string, line: number}|null} valor e linha, ou `null`.
 */
function readField(body, name) {
  for (const entry of body) {
    const field = FIELD_PATTERN.exec(entry.text) ?? PLAIN_FIELD_PATTERN.exec(entry.text)
    if (!field) continue
    if (field[1].trim().toLowerCase() !== name.toLowerCase()) continue
    return { value: stripBold(field[2]), line: entry.line }
  }
  return null
}

/**
 * Lê as dependências declaradas no campo `Depende de`.
 *
 * @param {Array<{text: string, line: number}>} body linhas do corpo da tarefa.
 * @param {string} file caminho do arquivo, usado nos detalhes do erro.
 * @param {string} id identificador da tarefa.
 * @returns {{dependencies: string[], source: string}} dependências e origem.
 */
function readDependencies(body, file, id) {
  const field = readField(body, 'Depende de')
  if (!field) return { dependencies: [], source: 'undeclared' }

  const raw = field.value.trim()
  if (raw === '' || raw.toLowerCase() === 'nenhuma' || raw === '—' || raw === '-') {
    return { dependencies: [], source: 'none' }
  }

  const dependencies = raw
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part !== '')

  for (const dependency of dependencies) {
    if (!DEPENDENCY_ID_PATTERN.test(dependency)) {
      throw new RawspecError(
        'E_PARSE',
        `Dependência inválida em ${file}:${field.line}: ${dependency}`,
        { file, line: field.line, task: id, dependency },
      )
    }
  }

  return { dependencies: dependencies.map(normalizeTaskId), source: 'explicit' }
}

/**
 * Lê a evidência declarada no campo `Verificação`.
 *
 * @param {Array<{text: string, line: number}>} body linhas do corpo da tarefa.
 * @param {string} file caminho do arquivo, usado nos detalhes do erro.
 * @param {string} id identificador da tarefa.
 * @returns {{verification: string, evidence: string|null}} verificação e evidência.
 */
function readVerification(body, file, id) {
  const field = readField(body, 'Verificação')
  if (!field) return { verification: 'PENDING', evidence: null }

  const raw = field.value.trim()
  const match = /^(PENDING|VERIFIED|FAILED)\b/i.exec(raw)
  if (!match) {
    throw new RawspecError('E_PARSE', `Verificação inválida em ${file}:${field.line}: ${raw}`, {
      file,
      line: field.line,
      task: id,
      value: raw,
    })
  }

  const verification = match[1].toUpperCase()
  const evidence = raw
    .slice(match[0].length)
    .replace(/^[\s—:-]+/, '')
    .trim()
  return { verification, evidence: evidence === '' ? null : evidence }
}

/**
 * Lê o status declarado no campo `Status` de uma tarefa.
 *
 * @param {Array<{text: string, line: number}>} body linhas do corpo da tarefa.
 * @param {string} file caminho do arquivo, usado nos detalhes do erro.
 * @param {string} id identificador da tarefa.
 * @returns {string} status da tarefa.
 */
function readTaskStatus(body, file, id) {
  const field = readField(body, 'Status')
  if (!field) return 'PENDING'

  const raw = field.value.trim()
  const match = /^(PENDING|IN PROGRESS|VERIFYING|COMPLETED)\b/i.exec(raw)
  if (!match) {
    throw new RawspecError('E_PARSE', `Status inválido em ${file}:${field.line}: ${raw}`, {
      file,
      line: field.line,
      task: id,
      value: raw,
    })
  }
  return match[1].toUpperCase()
}

/**
 * Valida a estrutura de um documento de tarefas já interpretado.
 *
 * @param {{tasks: Array<object>, file: string}} tasksDoc documento interpretado.
 * @returns {{tasks: Array<object>, file: string}} o mesmo documento, validado.
 */
export function validateTaskStructure(tasksDoc) {
  const seen = new Map()
  for (const task of tasksDoc.tasks) {
    if (seen.has(task.id)) {
      throw new RawspecError('E_PARSE', `Identificador duplicado em ${tasksDoc.file}: ${task.id}`, {
        file: tasksDoc.file,
        task: task.id,
        line: task.startLine,
      })
    }
    seen.set(task.id, task)
  }
  return tasksDoc
}

/**
 * Interpreta um documento de tarefas.
 *
 * @param {string} tasksPath caminho absoluto do `tasks.md`.
 * @returns {{file: string, status: string|null, tasks: Array<object>}} documento interpretado.
 */
export function parseTasks(tasksPath) {
  const text = readTextFile(tasksPath)
  const lines = toLines(text)
  assertClosedFences(lines, tasksPath)

  const sections = collectTaskSections(lines, tasksPath)
  if (sections.length === 0) {
    throw new RawspecError('E_PARSE', `Nenhuma tarefa reconhecida em ${tasksPath}`, {
      file: tasksPath,
    })
  }

  const tasks = sections.map((section) => {
    if (section.title === '') {
      throw new RawspecError(
        'E_PARSE',
        `Tarefa sem título válido em ${tasksPath}:${section.startLine}`,
        { file: tasksPath, line: section.startLine, task: section.id },
      )
    }

    const { dependencies, source } = readDependencies(section.body, tasksPath, section.id)
    const { verification, evidence } = readVerification(section.body, tasksPath, section.id)
    const status = readTaskStatus(section.body, tasksPath, section.id)
    const actionPlanField = readField(section.body, 'Plano de ação')
    const startField = readField(section.body, 'Início')

    return {
      id: section.id,
      title: section.title,
      status,
      verification,
      evidence,
      dependencies,
      dependencySource: source,
      actionPlan:
        actionPlanField && actionPlanField.value.trim() !== ''
          ? actionPlanField.value.trim()
          : null,
      startedAt: startField && startField.value.trim() !== '' ? startField.value.trim() : null,
      file: tasksPath,
      startLine: section.startLine,
      endLine: section.endLine,
    }
  })

  return validateTaskStructure({ file: tasksPath, status: readDocumentStatus(text), tasks })
}

/**
 * Interpreta uma mudança completa.
 *
 * @param {string} changeDir caminho absoluto do diretório da mudança.
 * @returns {{id: string, dir: string, status: string|null, proposalStatus: string|null, designStatus: string|null, tasksStatus: string|null, tasks: Array<object>}} mudança interpretada.
 */
export function parseChange(changeDir) {
  const proposalPath = join(changeDir, 'proposal.md')
  const designPath = join(changeDir, 'design.md')
  const tasksPath = join(changeDir, 'tasks.md')

  const proposalText = readTextFile(proposalPath)
  const designStatus = existsFile(designPath) ? readDocumentStatus(readTextFile(designPath)) : null
  const tasksDoc = parseTasks(tasksPath)

  return {
    id: basename(changeDir),
    dir: changeDir,
    status: tasksDoc.status,
    proposalStatus: readDocumentStatus(proposalText),
    designStatus,
    tasksStatus: tasksDoc.status,
    tasks: tasksDoc.tasks,
  }
}

/**
 * Verifica se um caminho existe e é um arquivo.
 *
 * @param {string} filePath caminho absoluto.
 * @returns {boolean} `true` quando o arquivo existe.
 */
function existsFile(filePath) {
  try {
    readFileSync(filePath)
    return true
  } catch {
    return false
  }
}

export { TASK_ID_PATTERN }
