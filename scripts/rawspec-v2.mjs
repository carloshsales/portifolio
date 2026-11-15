/**
 * RawSpec v2 helper — parser de mudanças e tarefas.
 *
 * TASK-003 da change 003-rawspec-v2.
 *
 * Cada tarefa é um arquivo independente em `specs/changes/NNN-slug/tasks/TASK-NNN.md`.
 * Este módulo apenas lê e interpreta os arquivos Markdown do RawSpec v2.
 * Ele não escreve arquivos.
 */

import { execFileSync } from 'node:child_process'
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { basename, dirname, join, resolve, sep } from 'node:path'

/** Status válidos de uma tarefa. */
export const TASK_STATUSES = ['PENDING', 'IN PROGRESS', 'VERIFYING', 'COMPLETED', 'ARCHIVED']

/** Estados válidos do campo `Verificação`. */
export const TASK_VERIFICATIONS = ['PENDING', 'VERIFIED', 'FAILED']

/** Status válidos de uma mudança. */
export const CHANGE_STATUSES = [
  'PENDING APPROVAL',
  'APPROVED',
  'REJECTED',
  'SUPERSEDED',
  'ARCHIVED',
]

/** Identificador de tarefa no formato canônico. */
export const TASK_ID_PATTERN = /^TASK-\d+$/

/** Dependência declarada no formato canônico. */
export const DEPENDENCY_ID_PATTERN = /^TASK-\d+$/

/** Cabeçalho de tarefa: `# TASK-NNN — Título`. */
const TASK_HEADING_PATTERN = /^#\s+TASK-(\d+)\s+—\s*(.*)$/

/** Linha de campo no formato `- **Campo:** valor` ou `**Campo:** valor`. */
const FIELD_PATTERN = /^(?:-\s+)?\*\*([^*]+):\*\*\s*(.*)$/

/** Linha de campo sem negrito: `- Campo: valor` ou `Campo: valor`. */
const PLAIN_FIELD_PATTERN = /^(?:-\s+)?([^*\n][^*\n]*?):\s*(.*)$/

/** Delimitador de bloco de código cercado. */
const FENCE_PATTERN = /^\s*(```|~~~)/

/** Campos reconhecidos no arquivo de tarefa. */
const KNOWN_FIELDS = [
  'Change',
  'Status',
  'Depende de',
  'Início',
  'Verificação',
  'Evidência',
  'Plano de ação',
  'Arquivada em',
]

/** Mesmos campos em caixa baixa, para comparação. */
const KNOWN_FIELDS_LOWER = new Set(KNOWN_FIELDS.map((field) => field.toLowerCase()))

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
 * @param {string} raw identificador bruto, por exemplo `003` ou `rawspec-v2`.
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
      candidates: matches.map((change) => change.name ?? change.id),
    })
  }
  return matches[0].name ?? matches[0].id
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
 * Separa o texto em linhas, preservando o conteúdo original.
 *
 * @param {string} text conteúdo do documento.
 * @returns {Array<{text: string, line: number}>} linhas numeradas.
 */
function toLines(text) {
  return text.split(/\r?\n/).map((value, index) => ({ text: value, line: index + 1 }))
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
 * Marca as linhas que estão dentro de blocos de código cercado.
 *
 * @param {Array<{text: string, line: number}>} lines linhas do documento.
 * @returns {Set<number>} conjunto de linhas cercadas.
 */
function fencedLineSet(lines) {
  const fenced = new Set()
  let inFence = false
  let marker = null
  for (const { text, line } of lines) {
    if (FENCE_PATTERN.test(text)) {
      fenced.add(line)
      if (!inFence) {
        inFence = true
        marker = text.trim().slice(0, 3)
      } else if (text.trim().startsWith(marker)) {
        inFence = false
        marker = null
      }
      continue
    }
    if (inFence) fenced.add(line)
  }
  return fenced
}

/**
 * Lê o primeiro campo com o nome informado.
 *
 * @param {Array<{text: string, line: number}>} body linhas do corpo da tarefa.
 * @param {string} name nome do campo.
 * @param {Set<number>} fenced linhas dentro de blocos de código.
 * @returns {{value: string, line: number}|null} valor e linha, ou `null`.
 */
function readField(body, name, fenced) {
  for (const entry of body) {
    if (fenced.has(entry.line)) continue
    const field = FIELD_PATTERN.exec(entry.text) ?? PLAIN_FIELD_PATTERN.exec(entry.text)
    if (!field) continue
    if (field[1].trim().toLowerCase() !== name.toLowerCase()) continue
    return { value: stripBold(field[2]), line: entry.line }
  }
  return null
}

/**
 * Verifica se há campos conhecidos duplicados.
 *
 * @param {Array<{text: string, line: number}>} body linhas do corpo da tarefa.
 * @param {Set<number>} fenced linhas dentro de blocos de código.
 * @param {string} file caminho do arquivo.
 */
function assertUniqueKnownFields(body, fenced, file) {
  const seen = new Map()
  for (const entry of body) {
    if (fenced.has(entry.line)) continue
    const field = FIELD_PATTERN.exec(entry.text) ?? PLAIN_FIELD_PATTERN.exec(entry.text)
    if (!field) continue
    const name = field[1].trim()
    const key = name.toLowerCase()
    if (!KNOWN_FIELDS_LOWER.has(key)) continue
    if (seen.has(key)) {
      throw new RawspecError('E_PARSE', `Campo duplicado em ${file}:${entry.line}: ${name}`, {
        file,
        line: entry.line,
        field: name,
      })
    }
    seen.set(key, entry.line)
  }
}

/**
 * Interpreta o campo `Status`.
 *
 * @param {{value: string, line: number}|null} field campo lido.
 * @param {string} file caminho do arquivo.
 * @param {string} id identificador da tarefa.
 * @returns {string} status da tarefa.
 */
function parseTaskStatus(field, file, id) {
  if (!field) return 'PENDING'
  const raw = field.value.trim()
  const match = /^(PENDING|IN PROGRESS|VERIFYING|COMPLETED|ARCHIVED)\b/i.exec(raw)
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
 * Interpreta o campo `Verificação`.
 *
 * @param {{value: string, line: number}|null} field campo lido.
 * @param {string} file caminho do arquivo.
 * @param {string} id identificador da tarefa.
 * @returns {{value: string, evidence: string|null}} verificação e evidência.
 */
function parseVerification(field, file, id) {
  if (!field) return { value: 'PENDING', evidence: null }
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
  const value = match[1].toUpperCase()
  const evidence = raw
    .slice(match[0].length)
    .replace(/^\s*\(\d{4}-\d{2}-\d{2}\)\s*/, '')
    .replace(/^[\s—:-]+/, '')
    .trim()
  return { value, evidence: evidence === '' ? null : evidence }
}

/**
 * Interpreta o campo `Depende de`.
 *
 * @param {string} raw valor bruto do campo.
 * @param {number} line linha do campo.
 * @param {string} file caminho do arquivo.
 * @param {string} id identificador da tarefa.
 * @returns {{dependencies: string[], source: string}} dependências e origem.
 */
function readDependencies(raw, line, file, id) {
  const value = raw.trim()
  if (value === '' || value.toLowerCase() === 'nenhuma' || value === '—' || value === '-') {
    return { dependencies: [], source: 'none' }
  }

  const dependencies = value
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part !== '')

  for (const dependency of dependencies) {
    if (!DEPENDENCY_ID_PATTERN.test(dependency)) {
      throw new RawspecError('E_PARSE', `Dependência inválida em ${file}:${line}: ${dependency}`, {
        file,
        line,
        task: id,
        dependency,
      })
    }
  }

  return { dependencies: dependencies.map(normalizeTaskId), source: 'explicit' }
}

/**
 * Interpreta um arquivo de tarefa v2.
 *
 * @param {string} filePath caminho absoluto do arquivo `TASK-NNN.md`.
 * @returns {object} tarefa interpretada.
 */
export function parseTaskFile(filePath) {
  const text = readTextFile(filePath)
  const lines = toLines(text)
  assertClosedFences(lines, filePath)

  const firstContent = lines.find((entry) => entry.text.trim() !== '')
  if (!firstContent) {
    throw new RawspecError('E_PARSE', `Arquivo de tarefa vazio: ${filePath}`, { file: filePath })
  }

  const heading = TASK_HEADING_PATTERN.exec(firstContent.text)
  if (!heading) {
    throw new RawspecError(
      'E_PARSE',
      `Cabeçalho de tarefa inválido em ${filePath}:${firstContent.line}`,
      { file: filePath, line: firstContent.line },
    )
  }

  const id = `TASK-${heading[1].padStart(3, '0')}`
  const title = heading[2].trim()
  if (title === '') {
    throw new RawspecError('E_PARSE', `Tarefa sem título em ${filePath}:${firstContent.line}`, {
      file: filePath,
      line: firstContent.line,
      task: id,
    })
  }

  const body = lines.filter((entry) => entry.line > firstContent.line)
  const fenced = fencedLineSet(body)
  assertUniqueKnownFields(body, fenced, filePath)

  const changeField = readField(body, 'Change', fenced)
  if (!changeField || changeField.value.trim() === '') {
    throw new RawspecError('E_PARSE', `Campo Change ausente em ${filePath}:${firstContent.line}`, {
      file: filePath,
      line: firstContent.line,
      task: id,
    })
  }
  const change = changeField.value.trim()

  const status = parseTaskStatus(readField(body, 'Status', fenced), filePath, id)
  const verificationField = readField(body, 'Verificação', fenced)
  const verification = parseVerification(verificationField, filePath, id)

  const evidenceField = readField(body, 'Evidência', fenced)
  const evidenceValue = evidenceField ? evidenceField.value.trim() : ''
  const evidence =
    evidenceValue !== '' && evidenceValue !== '—' ? evidenceValue : verification.evidence

  const dependencyField = readField(body, 'Depende de', fenced)
  if (!dependencyField) {
    throw new RawspecError(
      'E_DEPENDENCY_UNDECLARED',
      `Campo Depende de ausente em ${filePath}:${firstContent.line}`,
      { file: filePath, line: firstContent.line, task: id },
    )
  }
  const { dependencies, source } = readDependencies(
    dependencyField.value,
    dependencyField.line,
    filePath,
    id,
  )

  const actionPlanField = readField(body, 'Plano de ação', fenced)
  const actionPlanValue = actionPlanField ? actionPlanField.value.trim() : ''
  const actionPlan =
    actionPlanValue !== '' && actionPlanValue.toLowerCase() !== 'none' && actionPlanValue !== '—'
      ? actionPlanValue
      : null

  const startField = readField(body, 'Início', fenced)
  const startValue = startField ? startField.value.trim() : ''
  const startedAt = startValue !== '' && startValue !== '—' ? startValue : null

  const archivedField = readField(body, 'Arquivada em', fenced)
  const archivedValue = archivedField ? archivedField.value.trim() : ''
  const archivedAt = archivedValue !== '' && archivedValue !== '—' ? archivedValue : null

  return {
    id,
    title,
    change,
    status,
    verification: verification.value,
    evidence,
    dependencies,
    dependencySource: source,
    actionPlan,
    startedAt,
    archivedAt,
    file: filePath,
  }
}

/**
 * Lista os arquivos de tarefa de uma mudança.
 *
 * @param {string} changeDir caminho absoluto da mudança.
 * @param {{includeArchived?: boolean}} [options] inclui `tasks/archive/` quando `true`.
 * @returns {string[]} caminhos absolutos dos arquivos de tarefa.
 */
export function listTaskFiles(changeDir, { includeArchived = false } = {}) {
  const tasksDir = join(changeDir, 'tasks')
  if (!existsSync(tasksDir)) return []

  const files = readdirSync(tasksDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .map((entry) => join(tasksDir, entry.name))

  if (includeArchived) {
    const archiveDir = join(tasksDir, 'archive')
    if (existsSync(archiveDir)) {
      files.push(
        ...readdirSync(archiveDir, { withFileTypes: true })
          .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
          .map((entry) => join(archiveDir, entry.name)),
      )
    }
  }

  const taskNumber = (file) => {
    const match = /TASK-(\d+)\.md$/.exec(file)
    return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER
  }
  return files.sort((a, b) => taskNumber(a) - taskNumber(b))
}

/**
 * Interpreta uma mudança v2 completa.
 *
 * @param {string} changeDir caminho absoluto do diretório da mudança.
 * @returns {object} mudança interpretada.
 */
export function parseChange(changeDir) {
  const proposalPath = join(changeDir, 'proposal.md')
  const proposalText = readTextFile(proposalPath)
  const proposalStatus = readDocumentStatus(proposalText)

  const designPath = join(changeDir, 'design.md')
  const designStatus = existsSync(designPath) ? readDocumentStatus(readTextFile(designPath)) : null

  const legacyTasksPath = join(changeDir, 'tasks.md')
  if (existsSync(legacyTasksPath)) {
    throw new RawspecError(
      'E_PARSE',
      `Formato legado tasks.md encontrado em ${changeDir}; execute a migração para v2`,
      { file: legacyTasksPath },
    )
  }

  const tasksDir = join(changeDir, 'tasks')
  if (!existsSync(tasksDir)) {
    throw new RawspecError('E_PARSE', `Diretório de tarefas ausente em ${changeDir}`, {
      file: changeDir,
    })
  }

  const changeId = basename(changeDir)
  const tasks = listTaskFiles(changeDir).map(parseTaskFile)

  const seen = new Set()
  for (const task of tasks) {
    if (task.change !== changeId) {
      throw new RawspecError(
        'E_PARSE',
        `Campo Change da ${task.id} não corresponde à mudança ${changeId}`,
        { file: task.file, task: task.id, expected: changeId, found: task.change },
      )
    }
    if (seen.has(task.id)) {
      throw new RawspecError('E_PARSE', `Identificador duplicado em ${changeDir}: ${task.id}`, {
        file: changeDir,
        task: task.id,
      })
    }
    seen.add(task.id)
  }

  return {
    id: changeId,
    dir: changeDir,
    proposalStatus,
    designStatus,
    tasks,
  }
}

/** Operações de I/O usadas pelas escritas atômicas. */
const DEFAULT_IO = { writeFileSync, renameSync, rmSync }

/**
 * Lista as mudanças ativas do repositório, excluindo `specs/changes/archive/`.
 *
 * @param {string} repoRoot caminho raiz do repositório.
 * @returns {Array<{id: string, name: string, dir: string}>} mudanças ordenadas.
 */
export function listChangeDirs(repoRoot) {
  const changesDir = join(repoRoot, 'specs', 'changes')
  if (!existsSync(changesDir)) return []
  return readdirSync(changesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name !== 'archive')
    .map((entry) => ({ id: entry.name, name: entry.name, dir: join(changesDir, entry.name) }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

/**
 * Verifica se uma mudança pode ser interpretada pelo formato v2.
 *
 * Mudanças `SUPERSEDED`, `ARCHIVED` ou com `tasks.md` legado são ignoradas
 * pelos scans globais.
 *
 * @param {string} changeDir caminho absoluto da mudança.
 * @returns {boolean} `true` quando a mudança é escaneável.
 */
function isScannableChange(changeDir) {
  const proposalPath = join(changeDir, 'proposal.md')
  if (!existsSync(proposalPath)) return false
  const status = readDocumentStatus(readTextFile(proposalPath))
  if (status === 'SUPERSEDED' || status === 'ARCHIVED') return false
  if (existsSync(join(changeDir, 'tasks.md'))) return false
  return true
}

/**
 * Resolve o diretório de uma mudança pelo identificador.
 *
 * @param {string} repoRoot caminho raiz do repositório.
 * @param {string} raw identificador da mudança.
 * @returns {{id: string, name: string, dir: string}} mudança resolvida.
 */
function resolveChangeDir(repoRoot, raw) {
  const needle = String(raw).trim().toLowerCase()
  const archiveRoot = join(repoRoot, 'specs', 'changes', 'archive')
  const active = listChangeDirs(repoRoot)
  const archived = existsSync(archiveRoot)
    ? readdirSync(archiveRoot, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => ({ id: entry.name, name: entry.name, dir: join(archiveRoot, entry.name) }))
    : []

  const matchList = (list) =>
    list.filter((change) => {
      const name = change.name.toLowerCase()
      const numeric = /^\d+/.exec(name)?.[0]
      return (
        name === needle ||
        numeric === needle ||
        name.endsWith(`-${needle}`) ||
        name.startsWith(`${needle}-`)
      )
    })

  // Prefere a mudança ativa quando existe homônima arquivada.
  let matches = matchList(active)
  if (matches.length === 0) matches = matchList(archived)

  if (matches.length === 0) {
    throw new RawspecError('E_CHANGE_NOT_FOUND', `Mudança não encontrada: ${raw}`, { change: raw })
  }
  if (matches.length > 1) {
    throw new RawspecError('E_CHANGE_AMBIGUOUS', `Mais de uma mudança corresponde a: ${raw}`, {
      change: raw,
      candidates: matches.map((change) => change.name),
    })
  }
  return matches[0]
}

/**
 * Resolve uma tarefa ativa pelo identificador.
 *
 * @param {string} taskId identificador da tarefa.
 * @param {{repoRoot: string, changeId?: string}} options raiz e mudança opcional.
 * @returns {{change: object, task: object}} tarefa e mudança resolvidas.
 */
export function resolveTask(taskId, { repoRoot, changeId } = {}) {
  const id = normalizeTaskId(taskId)
  const changes = changeId ? [resolveChangeDir(repoRoot, changeId)] : listChangeDirs(repoRoot)

  const matches = []
  for (const change of changes) {
    if (!existsSync(change.dir)) continue
    if (!changeId && !isScannableChange(change.dir)) continue
    for (const file of listTaskFiles(change.dir)) {
      const task = parseTaskFile(file)
      if (task.id === id) matches.push({ change: parseChange(change.dir), task })
    }
  }

  if (matches.length === 1) return matches[0]
  if (matches.length > 1) {
    throw new RawspecError('E_TASK_AMBIGUOUS', `Mais de uma tarefa ativa com o ID ${id}`, {
      task: id,
      candidates: matches.map((match) => ({
        change: match.change.id,
        task: match.task.id,
        title: match.task.title,
        status: match.task.status,
        file: match.task.file,
      })),
    })
  }

  const archived = []
  for (const change of changes) {
    if (!existsSync(change.dir)) continue
    for (const file of listTaskFiles(change.dir, { includeArchived: true })) {
      const task = parseTaskFile(file)
      if (task.id === id) archived.push({ change: change.id, task })
    }
  }
  if (archived.length > 0) {
    throw new RawspecError('E_TASK_ARCHIVED', `Tarefa ${id} existe apenas em mudança arquivada`, {
      task: id,
      candidates: archived.map((match) => ({
        change: match.change,
        task: match.task.id,
        file: match.task.file,
      })),
    })
  }

  throw new RawspecError('E_TASK_NOT_FOUND', `Tarefa não encontrada: ${id}`, { task: id })
}

/**
 * Lista as tarefas abertas (`IN PROGRESS` ou `VERIFYING`) das mudanças ativas.
 *
 * @param {string} repoRoot caminho raiz do repositório.
 * @returns {Array<{change: object, task: object}>} tarefas abertas.
 */
export function listOpenTasks(repoRoot) {
  const open = []
  for (const change of listChangeDirs(repoRoot)) {
    if (!existsSync(change.dir)) continue
    if (!isScannableChange(change.dir)) continue
    const parsed = parseChange(change.dir)
    for (const task of parsed.tasks) {
      if (task.status === 'IN PROGRESS' || task.status === 'VERIFYING') {
        open.push({ change: parsed, task })
      }
    }
  }
  return open
}

/**
 * Verifica se uma mudança está aprovada.
 *
 * @param {object} change mudança interpretada.
 * @returns {boolean} `true` quando aprovada.
 */
export function isChangeApproved(change) {
  if (change.proposalStatus !== 'APPROVED') return false
  if (change.designStatus !== null && change.designStatus !== 'APPROVED') return false
  return true
}

/**
 * Valida a aprovação da mudança, lançando `E_CHANGE_NOT_APPROVED` quando pendente.
 *
 * @param {object} change mudança interpretada.
 * @returns {object} a própria mudança, quando aprovada.
 */
export function validateChangeApproval(change) {
  const missing = []
  if (change.proposalStatus !== 'APPROVED') {
    missing.push(`proposal.md: ${change.proposalStatus ?? 'ausente'}`)
  }
  if (change.designStatus !== null && change.designStatus !== 'APPROVED') {
    missing.push(`design.md: ${change.designStatus}`)
  }
  if (missing.length > 0) {
    throw new RawspecError('E_CHANGE_NOT_APPROVED', `Mudança não aprovada: ${change.id}`, {
      change: change.id,
      missing,
    })
  }
  return change
}

/**
 * Lista as mudanças ativas com tarefas `PENDING`.
 *
 * @param {string} repoRoot caminho raiz do repositório.
 * @returns {Array<{change: object, tasks: object[], approved: boolean}>} mudanças pendentes.
 */
export function listPendingChanges(repoRoot) {
  const pending = []
  for (const change of listChangeDirs(repoRoot)) {
    if (!existsSync(change.dir)) continue
    if (!isScannableChange(change.dir)) continue
    const parsed = parseChange(change.dir)
    const pendingTasks = parsed.tasks.filter((task) => task.status === 'PENDING')
    if (pendingTasks.length > 0) {
      pending.push({
        change: parsed,
        tasks: pendingTasks,
        approved: isChangeApproved(parsed),
      })
    }
  }
  return pending
}

/**
 * Constrói o grafo de dependências das tarefas.
 *
 * @param {object[]} tasks tarefas da mudança.
 * @returns {{byId: Map<string, object>, graph: Map<string, string[]>}} grafo.
 */
export function buildDependencyGraph(tasks) {
  const byId = new Map(tasks.map((task) => [task.id, task]))
  const graph = new Map()
  for (const task of tasks) {
    graph.set(
      task.id,
      task.dependencies.filter((dependency) => byId.has(dependency)),
    )
  }
  return { byId, graph }
}

/**
 * Valida as dependências de uma tarefa.
 *
 * @param {object} task tarefa a validar.
 * @param {object[]} tasks tarefas da mudança.
 * @returns {object} a própria tarefa, quando válida.
 */
export function validateDependencies(task, tasks) {
  const byId = new Map(tasks.map((item) => [item.id, item]))

  for (const dependency of task.dependencies) {
    if (!byId.has(dependency)) {
      throw new RawspecError('E_DEPENDENCY_UNKNOWN', `Dependência inexistente: ${dependency}`, {
        task: task.id,
        dependency,
      })
    }
    if (dependency === task.id) {
      throw new RawspecError('E_DEPENDENCY_CYCLE', `Autodependência: ${task.id}`, {
        task: task.id,
        dependency,
      })
    }
  }

  const visited = new Set()
  const stack = new Set()
  const visit = (id) => {
    if (stack.has(id)) {
      throw new RawspecError('E_DEPENDENCY_CYCLE', `Ciclo de dependências envolvendo ${id}`, {
        task: task.id,
        cycle: [...stack, id],
      })
    }
    if (visited.has(id)) return
    stack.add(id)
    const current = byId.get(id)
    if (current) {
      for (const dependency of current.dependencies) visit(dependency)
    }
    stack.delete(id)
    visited.add(id)
  }
  visit(task.id)

  const isDone = (dependencyTask) =>
    Boolean(
      dependencyTask &&
      (dependencyTask.status === 'COMPLETED' || dependencyTask.status === 'ARCHIVED') &&
      dependencyTask.verification === 'VERIFIED',
    )

  const pending = task.dependencies.filter((dependency) => !isDone(byId.get(dependency)))
  if (pending.length > 0) {
    throw new RawspecError(
      'E_DEPENDENCY_PENDING',
      `Dependências pendentes: ${pending.join(', ')}`,
      { task: task.id, dependencies: pending, source: task.dependencySource },
    )
  }
  return task
}

/**
 * Lista todas as tarefas de uma mudança, incluindo as arquivadas.
 *
 * @param {string} changeDir caminho absoluto da mudança.
 * @returns {object[]} tarefas.
 */
function listAllTasks(changeDir) {
  return listTaskFiles(changeDir, { includeArchived: true }).map(parseTaskFile)
}

/**
 * Seleciona a próxima tarefa `PENDING` de uma mudança aprovada.
 *
 * @param {string} repoRoot caminho raiz do repositório.
 * @param {{changeId?: string}} [options] mudança opcional.
 * @returns {{change: object, task: object}} próxima tarefa.
 */
export function selectNextTask(repoRoot, { changeId } = {}) {
  let candidates = listPendingChanges(repoRoot)

  if (changeId) {
    const name = resolveChangeDir(repoRoot, changeId).name
    candidates = candidates.filter((entry) => entry.change.id === name)
    if (candidates.length === 0) {
      throw new RawspecError('E_NOTHING_TO_START', `Nenhuma tarefa pendente em ${name}`, {
        change: name,
      })
    }
  }

  if (candidates.length === 0) {
    const anyPending = listChangeDirs(repoRoot).some((change) => {
      if (!existsSync(change.dir)) return false
      try {
        return parseChange(change.dir).tasks.some((task) => task.status === 'PENDING')
      } catch {
        return false
      }
    })
    if (anyPending) {
      throw new RawspecError(
        'E_CHANGE_NOT_APPROVED',
        'Existem tarefas pendentes apenas em mudanças não aprovadas',
        { repoRoot },
      )
    }
    throw new RawspecError('E_NOTHING_TO_START', 'Nenhuma tarefa pendente', { repoRoot })
  }

  const approved = candidates.filter((entry) => entry.approved)
  if (approved.length === 0) {
    throw new RawspecError(
      'E_CHANGE_NOT_APPROVED',
      'Mudanças com tarefas pendentes não estão aprovadas',
      { changes: candidates.map((entry) => entry.change.id) },
    )
  }
  if (approved.length > 1) {
    throw new RawspecError(
      'E_CHANGE_AMBIGUOUS',
      'Mais de uma mudança aprovada com tarefas pendentes',
      {
        candidates: approved.map((entry) => ({
          change: entry.change.id,
          tasks: entry.tasks.map((task) => task.id),
        })),
      },
    )
  }

  const { change } = approved[0]
  const next = approved[0].tasks[0]
  validateChangeApproval(change)
  validateDependencies(next, listAllTasks(change.dir))
  return { change, task: next }
}

/**
 * Formata uma linha de campo preservando à aparência da linha original.
 *
 * @param {string} existingLine linha original.
 * @param {string} field nome do campo.
 * @param {string} value valor do campo.
 * @returns {string} linha formatada.
 */
function formatFieldLine(existingLine, field, value) {
  const leading = /^(\s*-\s+)/.exec(existingLine)?.[1] ?? '- '
  const bold = /^\s*(?:-\s+)?\*\*/.test(existingLine)
  return `${leading}${bold ? `**${field}:**` : `${field}:`} ${value}`
}

/**
 * Atualiza campos de um arquivo de tarefa de forma atômica.
 *
 * @param {string} taskFile caminho absoluto do arquivo de tarefa.
 * @param {Record<string, string>} updates mapa de campo para valor.
 * @param {{writeFileSync: Function, renameSync: Function, rmSync: Function}} [io] operações de I/O.
 * @returns {string} conteúdo atualizado.
 */
export function updateTaskFile(taskFile, updates, io = DEFAULT_IO) {
  const original = readTextFile(taskFile)
  const eol = original.includes('\r\n') ? '\r\n' : '\n'
  const lines = original.split(/\r\n|\n/)
  const numbered = lines.map((text, index) => ({ text, line: index + 1 }))
  const fenced = fencedLineSet(numbered)

  const fieldIndex = new Map()
  numbered.forEach((entry, index) => {
    if (fenced.has(entry.line)) return
    const field = FIELD_PATTERN.exec(entry.text) ?? PLAIN_FIELD_PATTERN.exec(entry.text)
    if (!field) return
    const key = field[1].trim().toLowerCase()
    if (!KNOWN_FIELDS_LOWER.has(key)) return
    if (!fieldIndex.has(key)) fieldIndex.set(key, index)
  })

  const missing = []
  for (const [field, value] of Object.entries(updates)) {
    const key = field.toLowerCase()
    const index = fieldIndex.get(key)
    if (index !== undefined) {
      lines[index] = formatFieldLine(lines[index], field, value)
    } else {
      missing.push([field, value])
    }
  }

  if (missing.length > 0) {
    let insertAt = 0
    for (const index of fieldIndex.values()) {
      if (index > insertAt) insertAt = index
    }
    lines.splice(
      insertAt + 1,
      0,
      ...missing.map(([field, value]) => formatFieldLine('', field, value)),
    )
  }

  return writeAtomic(taskFile, lines.join(eol), io)
}

/**
 * Grava conteúdo de forma atômica, gravando em temporário e renomeando.
 *
 * @param {string} filePath caminho absoluto do arquivo.
 * @param {string} content conteúdo a gravar.
 * @param {{writeFileSync: Function, renameSync: Function, rmSync: Function}} [io] operações de I/O.
 * @returns {string} conteúdo gravado.
 */
function writeAtomic(filePath, content, io = DEFAULT_IO) {
  const tmp = `${filePath}.tmp`
  io.writeFileSync(tmp, content, 'utf8')
  try {
    io.renameSync(tmp, filePath)
  } catch (error) {
    try {
      io.rmSync(tmp, { force: true })
    } catch {
      // ignora falha ao remover o arquivo temporário
    }
    throw new RawspecError('E_IO', `Falha ao gravar ${filePath}: ${error.message}`, {
      file: filePath,
    })
  }
  return content
}

/**
 * Retorna a data atual no formato `YYYY-MM-DD`.
 *
 * @returns {string} data.
 */
function defaultToday() {
  return new Date().toISOString().slice(0, 10)
}

/**
 * Exige um status específico para a tarefa.
 *
 * @param {object} task tarefa.
 * @param {string} expected status esperado.
 * @param {string} id identificador da tarefa.
 */
function requireStatus(task, expected, id) {
  if (task.status !== expected) {
    throw new RawspecError(
      'E_TASK_STATE',
      `Tarefa ${id} está ${task.status}; esperado ${expected}`,
      { task: id, expected, actual: task.status },
    )
  }
}

/**
 * Inicia uma tarefa `PENDING`.
 *
 * @param {string} repoRoot caminho raiz do repositório.
 * @param {string} taskId identificador da tarefa.
 * @param {{changeId?: string, today?: string}} [options] opções.
 * @returns {object} tarefa atualizada.
 */
export function startTask(repoRoot, taskId, { changeId, today = defaultToday() } = {}) {
  const { change, task } = resolveTask(taskId, { repoRoot, changeId })
  validateChangeApproval(change)
  validateDependencies(task, listAllTasks(change.dir))
  requireStatus(task, 'PENDING', task.id)
  updateTaskFile(task.file, { Status: 'IN PROGRESS', Início: task.startedAt ?? today })
  return parseTaskFile(task.file)
}

/**
 * Marca uma tarefa `IN PROGRESS` como `VERIFYING`.
 *
 * @param {string} repoRoot caminho raiz do repositório.
 * @param {string} taskId identificador da tarefa.
 * @param {{changeId?: string}} [options] opções.
 * @returns {object} tarefa atualizada.
 */
export function beginVerification(repoRoot, taskId, { changeId } = {}) {
  const { task } = resolveTask(taskId, { repoRoot, changeId })
  requireStatus(task, 'IN PROGRESS', task.id)
  updateTaskFile(task.file, { Status: 'VERIFYING' })
  return parseTaskFile(task.file)
}

/**
 * Conclui uma tarefa `VERIFYING` com evidência.
 *
 * @param {string} repoRoot caminho raiz do repositório.
 * @param {string} taskId identificador da tarefa.
 * @param {{changeId?: string, evidence: string, today?: string}} options opções.
 * @returns {object} tarefa atualizada.
 */
export function verifyTask(repoRoot, taskId, { changeId, evidence, today = defaultToday() } = {}) {
  if (!evidence || evidence.trim() === '') {
    throw new RawspecError('E_EVIDENCE_REQUIRED', `Evidência obrigatória para ${taskId}`, {
      task: taskId,
    })
  }
  const { task } = resolveTask(taskId, { repoRoot, changeId })
  requireStatus(task, 'VERIFYING', task.id)
  const text = evidence.trim()
  updateTaskFile(task.file, {
    Status: 'COMPLETED',
    Verificação: `VERIFIED (${today}) — ${text}`,
    Evidência: text,
  })
  return parseTaskFile(task.file)
}

/**
 * Registra falha de verificação e devolve a tarefa para `IN PROGRESS`.
 *
 * @param {string} repoRoot caminho raiz do repositório.
 * @param {string} taskId identificador da tarefa.
 * @param {{changeId?: string, evidence: string, today?: string}} options opções.
 * @returns {object} tarefa atualizada.
 */
export function failTask(repoRoot, taskId, { changeId, evidence, today = defaultToday() } = {}) {
  if (!evidence || evidence.trim() === '') {
    throw new RawspecError('E_EVIDENCE_REQUIRED', `Evidência obrigatória para ${taskId}`, {
      task: taskId,
    })
  }
  const { task } = resolveTask(taskId, { repoRoot, changeId })
  requireStatus(task, 'VERIFYING', task.id)
  const text = evidence.trim()
  updateTaskFile(task.file, {
    Status: 'IN PROGRESS',
    Verificação: `FAILED (${today}) — ${text}`,
    Evidência: text,
  })
  return parseTaskFile(task.file)
}

/**
 * Resolve um caminho dentro do repositório, recusando escape.
 *
 * @param {string} repoRoot caminho raiz do repositório.
 * @param {string} relative caminho relativo.
 * @returns {string} caminho absoluto confinado ao repositório.
 */
export function resolveWithinRepo(repoRoot, relative) {
  if (typeof relative !== 'string' || relative.trim() === '') {
    throw new RawspecError('E_PATH_ESCAPE', 'Caminho vazio', { repoRoot })
  }
  const resolved = resolve(repoRoot, relative)
  if (resolved !== repoRoot && !resolved.startsWith(`${repoRoot}${sep}`)) {
    throw new RawspecError('E_PATH_ESCAPE', `Caminho fora do repositório: ${relative}`, {
      repoRoot,
      path: relative,
    })
  }
  return resolved
}

/**
 * Lê o status de um plano de ação.
 *
 * @param {string} repoRoot caminho raiz do repositório.
 * @param {string} actionPlanPath caminho relativo do plano.
 * @returns {string|null} status do plano ou `null` quando ausente.
 */
function readActionPlanStatus(repoRoot, actionPlanPath) {
  const fullPath = resolveWithinRepo(repoRoot, actionPlanPath)
  if (!existsSync(fullPath)) return null
  return readDocumentStatus(readTextFile(fullPath))
}

/**
 * Localiza uma tarefa ativa ou arquivada.
 *
 * @param {string} repoRoot caminho raiz do repositório.
 * @param {string} id identificador canônico da tarefa.
 * @param {string} [changeId] mudança opcional.
 * @returns {{changeDir: string, source: string, dest: string, archived: boolean}} localização.
 */
function locateTask(repoRoot, id, changeId) {
  const changes = changeId ? [resolveChangeDir(repoRoot, changeId)] : listChangeDirs(repoRoot)
  const matches = []
  for (const change of changes) {
    const source = join(change.dir, 'tasks', `${id}.md`)
    const dest = join(change.dir, 'tasks', 'archive', `${id}.md`)
    if (existsSync(source)) {
      matches.push({ changeDir: change.dir, source, dest, archived: false })
    } else if (existsSync(dest)) {
      matches.push({ changeDir: change.dir, source, dest, archived: true })
    }
  }

  if (matches.length === 0) {
    throw new RawspecError('E_TASK_NOT_FOUND', `Tarefa não encontrada: ${id}`, { task: id })
  }
  if (matches.length > 1) {
    throw new RawspecError('E_TASK_AMBIGUOUS', `Mais de uma tarefa com o ID ${id}`, {
      task: id,
      candidates: matches.map((match) => match.changeDir),
    })
  }
  return matches[0]
}

/**
 * Verifica bloqueadores de arquivamento de uma tarefa.
 *
 * @param {string} repoRoot caminho raiz do repositório.
 * @param {object} task tarefa interpretada.
 * @returns {string[]} bloqueadores.
 */
function taskArchiveBlockers(repoRoot, task) {
  const blockers = []
  const done =
    (task.status === 'COMPLETED' || task.status === 'ARCHIVED') && task.verification === 'VERIFIED'
  if (!done) {
    blockers.push(
      `tarefa não concluída/verificada (status: ${task.status}, verificação: ${task.verification})`,
    )
  }
  if (task.actionPlan) {
    const status = readActionPlanStatus(repoRoot, task.actionPlan)
    if (status !== 'RESOLVED') {
      blockers.push(`plano de ação não resolvido: ${task.actionPlan} (${status ?? 'ausente'})`)
    }
  }
  return blockers
}

/**
 * Verifica se uma tarefa pode ser arquivada.
 *
 * @param {string} repoRoot caminho raiz do repositório.
 * @param {string} taskId identificador da tarefa.
 * @param {{changeId?: string}} [options] opções.
 * @returns {{task: object, archived: boolean, eligible: boolean, blockers: string[]}} resultado.
 */
export function checkArchiveTask(repoRoot, taskId, { changeId } = {}) {
  const id = normalizeTaskId(taskId)
  const located = locateTask(repoRoot, id, changeId)
  const task = parseTaskFile(existsSync(located.source) ? located.source : located.dest)
  const blockers = located.archived ? [] : taskArchiveBlockers(repoRoot, task)
  return { task, archived: located.archived, eligible: blockers.length === 0, blockers }
}

/**
 * Arquiva uma tarefa após aprovação humana.
 *
 * @param {string} repoRoot caminho raiz do repositório.
 * @param {string} taskId identificador da tarefa.
 * @param {{changeId?: string, approved: boolean, today?: string}} options opções.
 * @returns {object} tarefa arquivada.
 */
export function archiveTask(repoRoot, taskId, { changeId, approved, today = defaultToday() } = {}) {
  if (approved !== true) {
    throw new RawspecError(
      'E_APPROVAL_REQUIRED',
      `Aprovação humana obrigatória para arquivar ${taskId}`,
      { task: taskId },
    )
  }

  const id = normalizeTaskId(taskId)
  const located = locateTask(repoRoot, id, changeId)

  if (located.archived) {
    return parseTaskFile(located.dest)
  }

  const task = parseTaskFile(located.source)
  const change = parseChange(located.changeDir)
  validateChangeApproval(change)

  const blockers = taskArchiveBlockers(repoRoot, task)
  if (blockers.length > 0) {
    throw new RawspecError('E_ARCHIVE_TASK_BLOCKED', `Tarefa ${id} não pode ser arquivada`, {
      task: id,
      blockers,
    })
  }

  mkdirSync(join(located.changeDir, 'tasks', 'archive'), { recursive: true })
  updateTaskFile(located.source, { Status: 'ARCHIVED', 'Arquivada em': today })
  renameSync(located.source, located.dest)
  return parseTaskFile(located.dest)
}

/**
 * Verifica se uma mudança pode ser arquivada.
 *
 * @param {string} repoRoot caminho raiz do repositório.
 * @param {string} changeId identificador da mudança.
 * @returns {{changeDir: string, archivedDir: string, archived: boolean, eligible: boolean, blockers: string[]}} resultado.
 */
export function checkArchiveChange(repoRoot, changeId) {
  const changeDir = resolveChangeDir(repoRoot, changeId).dir
  const archivedDir = join(repoRoot, 'specs', 'changes', 'archive', basename(changeDir))

  if (!existsSync(changeDir)) {
    return {
      changeDir,
      archivedDir,
      archived: existsSync(archivedDir),
      eligible: false,
      blockers: ['mudança não encontrada'],
    }
  }

  if (existsSync(archivedDir)) {
    const proposalPath = join(archivedDir, 'proposal.md')
    const status = existsSync(proposalPath) ? readDocumentStatus(readTextFile(proposalPath)) : null
    return {
      changeDir,
      archivedDir,
      archived: true,
      eligible: status === 'ARCHIVED',
      blockers: status === 'ARCHIVED' ? [] : ['destino existente sem Status: ARCHIVED'],
    }
  }

  const change = parseChange(changeDir)
  const blockers = []
  if (!isChangeApproved(change)) blockers.push('mudança não aprovada')

  const active = listTaskFiles(changeDir)
  const all = listTaskFiles(changeDir, { includeArchived: true })
  if (all.length === 0) {
    blockers.push('mudança sem tarefas')
  }
  if (active.length > 0) {
    blockers.push(`tarefas não arquivadas: ${active.map((file) => basename(file)).join(', ')}`)
  }

  const allTasks = all.map(parseTaskFile)
  for (const task of allTasks) {
    if (task.actionPlan) {
      const status = readActionPlanStatus(repoRoot, task.actionPlan)
      if (status !== 'RESOLVED') {
        blockers.push(`plano de ação não resolvido: ${task.actionPlan}`)
      }
    }
  }

  return { changeDir, archivedDir, archived: false, eligible: blockers.length === 0, blockers }
}

/**
 * Arquiva uma mudança quando todas as tarefas estiverem arquivadas.
 *
 * @param {string} repoRoot caminho raiz do repositório.
 * @param {string} changeId identificador da mudança.
 * @param {{approved: boolean, today?: string}} options opções.
 * @returns {{changeDir: string, archivedDir: string, alreadyArchived: boolean}} resultado.
 */
export function archiveChange(repoRoot, changeId, { approved, today = defaultToday() } = {}) {
  if (approved !== true) {
    throw new RawspecError(
      'E_APPROVAL_REQUIRED',
      `Aprovação humana obrigatória para arquivar ${changeId}`,
      { change: changeId },
    )
  }

  const changeDir = resolveChangeDir(repoRoot, changeId).dir
  const archivedDir = join(repoRoot, 'specs', 'changes', 'archive', basename(changeDir))

  if (!existsSync(changeDir)) {
    throw new RawspecError('E_CHANGE_NOT_FOUND', `Mudança não encontrada: ${changeId}`, {
      change: changeId,
    })
  }

  if (existsSync(archivedDir)) {
    const proposalPath = join(archivedDir, 'proposal.md')
    const status = existsSync(proposalPath) ? readDocumentStatus(readTextFile(proposalPath)) : null
    if (status === 'ARCHIVED') {
      return { changeDir, archivedDir, alreadyArchived: true }
    }
    throw new RawspecError(
      'E_ARCHIVE_STATE_UNKNOWN',
      `Destino de arquivamento já existe: ${archivedDir}`,
      { path: archivedDir },
    )
  }

  const change = parseChange(changeDir)
  validateChangeApproval(change)

  const active = listTaskFiles(changeDir)
  if (active.length > 0) {
    throw new RawspecError(
      'E_ARCHIVE_CHANGE_BLOCKED',
      `Tarefas não arquivadas: ${active.map((file) => basename(file)).join(', ')}`,
      { change: change.id, tasks: active.map((file) => basename(file)) },
    )
  }

  const all = listTaskFiles(changeDir, { includeArchived: true })
  if (all.length === 0) {
    throw new RawspecError('E_ARCHIVE_CHANGE_BLOCKED', 'Mudança sem tarefas', {
      change: change.id,
    })
  }

  const allTasks = all.map(parseTaskFile)
  for (const task of allTasks) {
    if (task.actionPlan) {
      const status = readActionPlanStatus(repoRoot, task.actionPlan)
      if (status !== 'RESOLVED') {
        throw new RawspecError(
          'E_ARCHIVE_CHANGE_BLOCKED',
          `Plano de ação não resolvido: ${task.actionPlan}`,
          { change: change.id, plan: task.actionPlan },
        )
      }
    }
  }

  mkdirSync(join(repoRoot, 'specs', 'changes', 'archive'), { recursive: true })
  renameSync(changeDir, archivedDir)
  setDocumentField(join(archivedDir, 'proposal.md'), 'Status', 'ARCHIVED')
  setDocumentField(join(archivedDir, 'proposal.md'), 'Arquivada em', today)

  return { changeDir, archivedDir, alreadyArchived: false }
}

/**
 * Atualiza um campo no cabeçalho de um documento de forma atômica.
 *
 * @param {string} filePath caminho absoluto do documento.
 * @param {string} field nome do campo.
 * @param {string} value valor do campo.
 * @param {{writeFileSync: Function, renameSync: Function, rmSync: Function}} [io] operações de I/O.
 * @returns {string} conteúdo atualizado.
 */
export function setDocumentField(filePath, field, value, io = DEFAULT_IO) {
  const original = readTextFile(filePath)
  const eol = original.includes('\r\n') ? '\r\n' : '\n'
  const lines = original.split(/\r\n|\n/)
  const numberedAll = lines.map((text, index) => ({ text, line: index + 1 }))

  const header = []
  for (const entry of numberedAll) {
    if (/^##\s+/.test(entry.text)) break
    header.push(entry)
  }

  const fenced = fencedLineSet(header)
  const existing = readField(header, field, fenced)

  if (existing) {
    const index = numberedAll.findIndex((entry) => entry.line === existing.line)
    lines[index] = formatFieldLine(lines[index], field, value)
  } else {
    const statusField = readField(header, 'Status', fenced)
    const insertIndex = statusField
      ? numberedAll.findIndex((entry) => entry.line === statusField.line)
      : 0
    lines.splice(insertIndex + 1, 0, formatFieldLine('', field, value))
  }

  return writeAtomic(filePath, lines.join(eol), io)
}

/** Tipos de entrada aceitos no histórico. */
const HISTORY_TYPES = ['Decisão', 'Evento', 'Detalhe']

/**
 * Normaliza um texto para slug de nome de arquivo.
 *
 * @param {string} text texto original.
 * @returns {string} slug.
 */
function slugify(text) {
  return String(text)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

/**
 * Acrescenta uma entrada ao histórico do projeto, sem reescrever entradas antigas.
 *
 * @param {string} repoRoot caminho raiz do repositório.
 * @param {{type: string, title: string, author: string, origin: string, message: string, reason: string, impact: string, evidence: string, date?: string}} entry entrada.
 * @returns {{path: string, type: string, title: string, date: string}} resultado.
 */
export function appendHistory(repoRoot, entry) {
  const type = entry?.type
  if (!HISTORY_TYPES.includes(type)) {
    throw new RawspecError('E_HISTORY_INVALID', `Tipo de histórico inválido: ${String(type)}`, {
      allowed: HISTORY_TYPES,
    })
  }

  const required = ['title', 'author', 'origin', 'message', 'reason', 'impact', 'evidence']
  const missing = required.filter((field) => !entry[field] || String(entry[field]).trim() === '')
  if (missing.length > 0) {
    throw new RawspecError(
      'E_HISTORY_INVALID',
      `Campos obrigatórios ausentes: ${missing.join(', ')}`,
      { missing },
    )
  }

  const date = entry.date ?? defaultToday()
  const historyPath = resolveWithinRepo(repoRoot, 'docs/history.md')
  const block = [
    `## ${date} — ${type} — ${String(entry.title).trim()}`,
    '',
    `- Autor: ${String(entry.author).trim()}`,
    `- Origem: ${String(entry.origin).trim()}`,
    `- Decisão: ${String(entry.message).trim()}`,
    `- Motivo: ${String(entry.reason).trim()}`,
    `- Impacto: ${String(entry.impact).trim()}`,
    `- Evidência: ${String(entry.evidence).trim()}`,
    '',
  ].join('\n')

  let content = existsSync(historyPath)
    ? readTextFile(historyPath)
    : '# Histórico do projeto\n\nRegistro append-only de decisões, eventos e detalhes relevantes. Entradas nunca são reescritas; novas ocorrências são adicionadas ao final.\n'

  if (!content.endsWith('\n')) content += '\n'
  if (!content.endsWith('\n\n')) content += '\n'
  content += block

  mkdirSync(dirname(historyPath), { recursive: true })
  writeAtomic(historyPath, content)
  return { path: historyPath, type, title: String(entry.title).trim(), date }
}

/**
 * Cria um esqueleto de ADR em `docs/decisions/`.
 *
 * @param {string} repoRoot caminho raiz do repositório.
 * @param {{id?: string|number, title: string}} options identificador e título.
 * @returns {{path: string, id: string, file: string}} ADR criado.
 */
export function createAdrSkeleton(repoRoot, { id, title } = {}) {
  if (!title || String(title).trim() === '') {
    throw new RawspecError('E_ARGS', 'Título do ADR é obrigatório', {})
  }

  const decisionsDir = join(repoRoot, 'docs', 'decisions')
  mkdirSync(decisionsDir, { recursive: true })
  const existing = readdirSync(decisionsDir).filter((file) => /^ADR-\d+.*\.md$/.test(file))

  let number = id
  if (number === undefined || number === null || String(number).trim() === '') {
    const max = existing.reduce((acc, file) => {
      const match = /^ADR-(\d+)/.exec(file)
      return match ? Math.max(acc, Number(match[1])) : acc
    }, 0)
    number = max + 1
  }

  const normalized = String(number).trim()
  if (!/^\d+$/.test(normalized)) {
    throw new RawspecError('E_ARGS', `Número de ADR inválido: ${String(number)}`, {})
  }

  const padded = normalized.padStart(3, '0')
  const slug = slugify(title) || 'adr'
  const fileName = `ADR-${padded}-${slug}.md`
  const fullPath = join(decisionsDir, fileName)
  if (existsSync(fullPath)) {
    throw new RawspecError('E_ADR_EXISTS', `ADR já existe: ${fileName}`, { file: fileName })
  }

  const content = [
    `# ADR-${padded}: ${String(title).trim()}`,
    '',
    '- Status: Proposed',
    `- Data: ${defaultToday()}`,
    '',
    '## Contexto',
    '',
    '## Alternativas consideradas',
    '',
    '## Decisão',
    '',
    '## Justificativa',
    '',
    '## Consequências',
    '',
  ].join('\n')

  writeAtomic(fullPath, content)
  return { path: fullPath, id: `ADR-${padded}`, file: fileName }
}

/** Tipos aceitos na mensagem de commit. */
const COMMIT_TYPES = ['feat', 'fix', 'refactor', 'test', 'docs', 'chore', 'build']

/**
 * Gera a mensagem de commit de uma tarefa concluída.
 *
 * @param {string} repoRoot caminho raiz do repositório.
 * @param {string} taskId identificador da tarefa.
 * @param {{changeId?: string, type?: string, summary?: string, tests?: string}} [options] opções.
 * @returns {string} mensagem de commit.
 */
export function buildCommitMessage(
  repoRoot,
  taskId,
  { changeId, type = 'feat', summary, tests } = {},
) {
  if (!COMMIT_TYPES.includes(type)) {
    throw new RawspecError('E_ARGS', `Tipo de commit inválido: ${String(type)}`, {
      allowed: COMMIT_TYPES,
    })
  }

  const { change, task } = resolveTask(taskId, { repoRoot, changeId })
  if (task.status !== 'COMPLETED' || task.verification !== 'VERIFIED') {
    throw new RawspecError(
      'E_COMMIT_MESSAGE_BLOCKED',
      `Tarefa ${task.id} não está COMPLETED + VERIFIED`,
      { task: task.id, status: task.status, verification: task.verification },
    )
  }
  if (task.actionPlan) {
    const status = readActionPlanStatus(repoRoot, task.actionPlan)
    if (status !== 'RESOLVED') {
      throw new RawspecError(
        'E_ACTION_PLAN_UNRESOLVED',
        `Plano de ação não resolvido: ${task.actionPlan}`,
        { task: task.id, plan: task.actionPlan },
      )
    }
  }

  const targetSummary = summary ?? task.title
  const targetTests = tests ?? 'pnpm lint; pnpm typecheck; pnpm test; pnpm build'
  return [
    `${type}(rawspec): ${targetSummary}`,
    '',
    `Change: ${change.id}`,
    `Task: ${task.id}`,
    `Tests: ${targetTests}`,
    `Evidence: ${task.evidence ?? '—'}`,
    `Action-Plan: ${task.actionPlan ?? 'none'}`,
    '',
  ].join('\n')
}

/**
 * Coleta seções de tarefa de um `tasks.md` legado.
 *
 * @param {string} text conteúdo do `tasks.md`.
 * @param {string} file caminho do arquivo.
 * @returns {Array<{id: string, title: string, body: Array<{text: string, line: number}>}>} seções.
 */
function collectLegacySections(text, file) {
  const lines = toLines(text)
  const sections = []
  let current = null
  let inFence = false
  let fenceMarker = null

  for (const entry of lines) {
    const { text: line } = entry
    if (FENCE_PATTERN.test(line)) {
      if (current) current.body.push(entry)
      if (!inFence) {
        inFence = true
        fenceMarker = line.trim().slice(0, 3)
      } else if (line.trim().startsWith(fenceMarker)) {
        inFence = false
        fenceMarker = null
      }
      continue
    }
    if (inFence) {
      if (current) current.body.push(entry)
      continue
    }

    const heading = /^###\s+TASK-(\d+)\s+—\s*(.*)$/.exec(line)
    if (heading) {
      if (current) sections.push(current)
      current = {
        id: `TASK-${heading[1].padStart(3, '0')}`,
        title: heading[2].trim(),
        body: [],
      }
      continue
    }

    if (/^##\s+/.test(line)) {
      if (current) {
        sections.push(current)
        current = null
      }
      continue
    }

    if (current) current.body.push(entry)
  }

  if (current) sections.push(current)
  return sections
}

/**
 * Constrói o conteúdo de um arquivo de tarefa v2 a partir de uma seção legada.
 *
 * @param {{id: string, title: string, body: Array<{text: string, line: number}>}} section seção legada.
 * @param {string} changeId identificador da mudança.
 * @param {string[]} dependencies dependências derivadas.
 * @param {string} today data de arquivamento.
 * @param {string} legacyPath caminho do `tasks.md` legado.
 * @param {string} status status da tarefa.
 * @returns {string} conteúdo do arquivo v2.
 */
function buildLegacyTaskFile(section, changeId, dependencies, today, legacyPath, status) {
  const fenced = fencedLineSet(section.body)
  const verificationField = readField(section.body, 'Verificação', fenced)
  const verification = parseVerification(verificationField, legacyPath, section.id)
  const startField = readField(section.body, 'Início', fenced)
  const startValue = startField && startField.value.trim() !== '' ? startField.value.trim() : '—'
  const planField = readField(section.body, 'Plano de ação', fenced)
  const planValue = planField && planField.value.trim() !== '' ? planField.value.trim() : 'none'
  const evidence = verification.evidence ?? '—'

  const contentLines = section.body
    .filter((entry) => {
      if (fenced.has(entry.line)) return true
      const field = FIELD_PATTERN.exec(entry.text) ?? PLAIN_FIELD_PATTERN.exec(entry.text)
      if (field && KNOWN_FIELDS_LOWER.has(field[1].trim().toLowerCase())) return false
      return true
    })
    .map((entry) => entry.text)

  while (contentLines.length > 0 && contentLines[0].trim() === '') contentLines.shift()
  while (contentLines.length > 0 && contentLines[contentLines.length - 1].trim() === '') {
    contentLines.pop()
  }

  const archived = status === 'COMPLETED'
  const lines = [
    `# ${section.id} — ${section.title}`,
    '',
    `- Change: ${changeId}`,
    `- Status: ${archived ? 'ARCHIVED' : status}`,
    `- Depende de: ${dependencies.length > 0 ? dependencies.join(', ') : 'nenhuma'}`,
    `- Início: ${startValue}`,
    `- Verificação: ${verificationField ? verificationField.value.trim() : 'PENDING'}`,
    `- Evidência: ${evidence}`,
    `- Plano de ação: ${planValue}`,
  ]
  if (archived) lines.push(`- Arquivada em: ${today}`)
  lines.push('')
  lines.push(...contentLines)
  lines.push('')
  return lines.join('\n')
}

/**
 * Migra uma mudança legada (com `tasks.md`) para o formato v2.
 *
 * @param {string} changeDir caminho absoluto da mudança.
 * @param {{today?: string}} [options] opções.
 * @returns {Array<{id: string, file: string, archived: boolean}>} tarefas migradas.
 */
export function migrateLegacyChange(changeDir, { today = defaultToday() } = {}) {
  const legacyPath = join(changeDir, 'tasks.md')
  if (!existsSync(legacyPath)) {
    throw new RawspecError('E_PARSE', `tasks.md legado não encontrado em ${changeDir}`, {
      file: legacyPath,
    })
  }

  const text = readTextFile(legacyPath)
  const sections = collectLegacySections(text, legacyPath)
  if (sections.length === 0) {
    throw new RawspecError('E_PARSE', `Nenhuma tarefa reconhecida em ${legacyPath}`, {
      file: legacyPath,
    })
  }

  const changeId = basename(changeDir)
  const tasksDir = join(changeDir, 'tasks')
  mkdirSync(tasksDir, { recursive: true })

  const migrated = []
  let previousId = null

  for (const section of sections) {
    const fenced = fencedLineSet(section.body)
    const statusField = readField(section.body, 'Status', fenced)
    const status = parseTaskStatus(statusField, legacyPath, section.id)
    const archived = status === 'COMPLETED'
    const dependencies = previousId ? [previousId] : []
    const content = buildLegacyTaskFile(section, changeId, dependencies, today, legacyPath, status)

    const destDir = archived ? join(tasksDir, 'archive') : tasksDir
    mkdirSync(destDir, { recursive: true })
    const dest = join(destDir, `${section.id}.md`)
    writeAtomic(dest, content)

    migrated.push({ id: section.id, file: dest, archived })
    previousId = section.id
  }

  rmSync(legacyPath, { force: true })
  return migrated
}

/**
 * Executa um comando no repositório, convertendo falhas em `RawspecError`.
 *
 * @param {string} command comando a executar.
 * @param {string[]} args argumentos.
 * @param {string} repoRoot diretório de trabalho.
 * @param {string} errorCode código de erro em caso de falha.
 * @returns {string} saída do comando.
 */
function runCommand(command, args, repoRoot, errorCode) {
  try {
    return execFileSync(command, args, {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    })
  } catch (error) {
    const stderr = error.stderr
      ? String(error.stderr).trim()
      : error.stdout
        ? String(error.stdout).trim()
        : error.message
    throw new RawspecError(errorCode, `Falha ao executar ${command} ${args.join(' ')}: ${stderr}`, {
      command,
      args,
      stderr,
    })
  }
}

/**
 * Executa as verificações obrigatórias antes do commit.
 *
 * @param {string} repoRoot caminho raiz do repositório.
 * @param {{checks?: string[][]}} [options] verificações injetadas.
 * @returns {boolean} `true` quando todas passam.
 */
export function runChecks(repoRoot, { checks } = {}) {
  const commands = checks ?? [['typecheck'], ['test'], ['build']]
  const isWindows = process.platform === 'win32'
  for (const args of commands) {
    if (isWindows) {
      runCommand('cmd', ['/c', 'pnpm', ...args], repoRoot, 'E_CHECKS_FAILED')
    } else {
      runCommand('pnpm', args, repoRoot, 'E_CHECKS_FAILED')
    }
  }
  return true
}

/**
 * Retorna a branch atual do repositório.
 *
 * @param {string} repoRoot caminho raiz do repositório.
 * @returns {string} nome da branch.
 */
function currentBranch(repoRoot) {
  return runCommand('git', ['rev-parse', '--abbrev-ref', 'HEAD'], repoRoot, 'E_GIT_ERROR').trim()
}

/**
 * Cria a branch da tarefa no formato `task/NNN-NNN-slug`.
 *
 * @param {string} repoRoot caminho raiz do repositório.
 * @param {string} taskId identificador da tarefa.
 * @param {{changeId?: string}} [options] opções.
 * @returns {{branch: string, task: object}} branch criada.
 */
export function createTaskBranch(repoRoot, taskId, { changeId } = {}) {
  const { change, task } = resolveTask(taskId, { repoRoot, changeId })
  const numeric = /^\d+/.exec(change.id)?.[0] ?? change.id
  const taskNumber = /(\d+)$/.exec(task.id)?.[1] ?? ''
  const slug = slugify(task.title) || 'tarefa'
  const branch = `task/${numeric}-${taskNumber}-${slug}`

  const existing = runCommand('git', ['branch', '--list', branch], repoRoot, 'E_GIT_ERROR').trim()
  if (existing !== '') {
    throw new RawspecError('E_BRANCH_EXISTS', `Branch já existe: ${branch}`, { branch })
  }

  runCommand('git', ['checkout', '-b', branch], repoRoot, 'E_GIT_ERROR')
  return { branch, task }
}

/**
 * Conclui a tarefa com commit e push, respeitando os hooks do Husky.
 *
 * @param {string} repoRoot caminho raiz do repositório.
 * @param {string} taskId identificador da tarefa.
 * @param {{changeId?: string, branch?: string, remote?: string, push?: boolean, checks?: string[][]}} [options] opções.
 * @returns {{branch: string, commit: string, pushed: boolean}} resultado.
 */
export function commitAndPushTask(
  repoRoot,
  taskId,
  { changeId, branch, remote = 'origin', push = true, checks } = {},
) {
  const { task } = resolveTask(taskId, { repoRoot, changeId })
  if (task.status !== 'COMPLETED' || task.verification !== 'VERIFIED') {
    throw new RawspecError('E_TASK_STATE', `Tarefa ${task.id} não está COMPLETED + VERIFIED`, {
      task: task.id,
      status: task.status,
      verification: task.verification,
    })
  }

  runChecks(repoRoot, { checks })

  const message = buildCommitMessage(repoRoot, taskId, { changeId })
  const targetBranch = branch ?? currentBranch(repoRoot)

  runCommand('git', ['add', '-A'], repoRoot, 'E_GIT_ERROR')
  runCommand('git', ['commit', '-m', message], repoRoot, 'E_GIT_ERROR')

  let pushed = false
  if (push) {
    runCommand('git', ['push', '-u', remote, targetBranch], repoRoot, 'E_GIT_ERROR')
    pushed = true
  }

  const commit = runCommand('git', ['rev-parse', '--short', 'HEAD'], repoRoot, 'E_GIT_ERROR').trim()
  return { branch: targetBranch, commit, pushed }
}
