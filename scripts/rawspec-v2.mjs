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
  statSync,
  writeFileSync,
} from 'node:fs'
import { basename, dirname, isAbsolute, join, resolve, sep } from 'node:path'

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
 * Extrai a secção `## Arquivos` de uma tarefa.
 *
 * A secção lista os caminhos do âmbito da tarefa, entre crases, com um
 * qualificador opcional entre parênteses:
 *
 * ```markdown
 * ## Arquivos
 *
 * - `src/sections/Home/Home.tsx` (revisão)
 * - `src/content/profile.ts` (leitura; sem escrita)
 * ```
 *
 * O qualificador é informativo. Indica o que fazer com o ficheiro, não se
 * pode escrever nele. O gate de âmbito não faz essa distinção: um ficheiro
 * listado é um ficheiro permitido.
 *
 * @param {Array<{text: string, line: number}>} body linhas do corpo da tarefa.
 * @param {Set<number>} fenced linhas dentro de blocos de código.
 * @returns {{files: string[], source: 'explicit'|'none'}} âmbito da tarefa.
 */
export function readScope(body, fenced) {
  const files = []
  let inside = false
  let sawSection = false

  for (const entry of body) {
    if (fenced.has(entry.line)) continue
    const heading = /^##\s+(.+?)\s*$/.exec(entry.text)
    if (heading) {
      inside = heading[1].trim().toLowerCase() === 'arquivos'
      if (inside) sawSection = true
      continue
    }
    if (!inside) continue
    const item = /^\s*[-*]\s+(.*)$/.exec(entry.text)
    if (!item) continue
    const path = /`([^`]+)`/.exec(item[1])
    if (path) files.push(path[1].trim())
  }

  return { files: [...new Set(files)], source: sawSection ? 'explicit' : 'none' }
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

  const scope = readScope(body, fenced)

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
    scope,
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
 * Descreve as verificações para a linha `Tests:` da mensagem de commit.
 *
 * @param {string[][]} checks argumentos de cada verificação `pnpm`.
 * @returns {string} comandos por ordem de execução, ou `nenhuma`.
 */
function describeChecks(checks) {
  if (checks.length === 0) return 'nenhuma'
  return checks.map((args) => `pnpm ${args.join(' ')}`).join('; ')
}

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

  const { change, task } = loadTask(repoRoot, taskId, changeId)
  const done = task.status === 'COMPLETED' || task.status === 'ARCHIVED'
  if (!done || task.verification !== 'VERIFIED') {
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
  const targetTests = tests ?? describeChecks(COMMIT_CHECKS)
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
 * Resolve o directório Git de um repositório.
 *
 * Num repositório normal, `.git` é um directório. Num worktree, `.git` é um
 * ficheiro com a forma `gitdir: <caminho>`, que aponta para o directório Git
 * real do repositório partilhado.
 *
 * @param {string} repoRoot raiz do repositório.
 * @returns {string} directório Git, ou o caminho de `.git` se não for resolvivel.
 */
function resolveGitDir(repoRoot) {
  const dotGit = join(repoRoot, '.git')
  try {
    if (statSync(dotGit).isDirectory()) return dotGit
  } catch {
    return dotGit
  }

  try {
    const content = readFileSync(dotGit, 'utf8').trim()
    const match = /^gitdir:\s*(.+)$/m.exec(content)
    if (match) {
      const target = match[1].trim()
      return isAbsolute(target) ? target : resolve(repoRoot, target)
    }
  } catch {
    return dotGit
  }

  return dotGit
}

/**
 * Executa um comando no repositório, convertendo falhas em `RawspecError`.
 *
 * O `GIT_DIR` é fixado ao directório Git do próprio repositório. Sem isto, o
 * Git descobre o repositório por ascensão de directórios e, num worktree,
 * onde `.git` é um ficheiro, os comandos são executados no repositório
 * partilhado em vez do repositório indicado.
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
      env: {
        ...process.env,
        GIT_DIR: resolveGitDir(repoRoot),
        GIT_WORK_TREE: repoRoot,
      },
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

/** Verificações executadas antes do commit, por ordem. */
export const COMMIT_CHECKS = [['lint'], ['typecheck'], ['test'], ['build']]

/**
 * Executa uma verificação `pnpm` no repositório, falhando com `E_CHECKS_FAILED`.
 *
 * @param {string} repoRoot caminho raiz do repositório.
 * @param {string[]} args argumentos do `pnpm`, por exemplo `['lint']`.
 */
function runPnpmCheck(repoRoot, args) {
  if (process.platform === 'win32') {
    runCommand('cmd', ['/c', 'pnpm', ...args], repoRoot, 'E_CHECKS_FAILED')
  } else {
    runCommand('pnpm', args, repoRoot, 'E_CHECKS_FAILED')
  }
}

/**
 * Executa as verificações obrigatórias antes do commit, por ordem.
 *
 * A primeira falha interrompe a sequência e lança `E_CHECKS_FAILED`, pelo que
 * nenhum commit nem push acontece.
 *
 * @param {string} repoRoot caminho raiz do repositório.
 * @param {{checks?: string[][], runCheck?: (repoRoot: string, args: string[]) => void}} [options] verificações e executor injetados.
 * @returns {boolean} `true` quando todas passam.
 */
export function runChecks(repoRoot, { checks, runCheck = runPnpmCheck } = {}) {
  for (const args of checks ?? COMMIT_CHECKS) {
    runCheck(repoRoot, args)
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
 * Gera o nome canónico da branch de uma tarefa.
 *
 * @param {object} change mudança.
 * @param {object} task tarefa.
 * @returns {string} nome da branch.
 */
function taskBranchName(change, task) {
  const numeric = /^\d+/.exec(change.id)?.[0] ?? change.id
  const taskNumber = /(\d+)$/.exec(task.id)?.[1] ?? ''
  const slug = slugify(task.title) || 'tarefa'
  return `task/${numeric}-${taskNumber}-${slug}`
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
  const branch = taskBranchName(change, task)

  const existing = runCommand('git', ['branch', '--list', branch], repoRoot, 'E_GIT_ERROR').trim()
  if (existing !== '') {
    throw new RawspecError('E_BRANCH_EXISTS', `Branch já existe: ${branch}`, { branch })
  }

  runCommand('git', ['checkout', '-b', branch], repoRoot, 'E_GIT_ERROR')
  return { branch, task }
}

/**
 * Lista os ficheiros tocados no repositório, relativos à raiz.
 *
 * @param {string} repoRoot caminho raiz do repositório.
 * @returns {string[]} caminhos relativos, sem estado do índice.
 */
function listChangedFiles(repoRoot) {
  // --untracked-files=all expande os directórios não versionados em ficheiros
  // individuais. Sem esta opção, um directório novo aparece como "src/" e o
  // gate não consegue distinguir o que está dentro do âmbito.
  const output = runCommand(
    'git',
    ['status', '--porcelain', '--untracked-files=all'],
    repoRoot,
    'E_GIT_ERROR',
  )
  const files = []
  for (const line of output.split(/\r?\n/)) {
    if (line.trim() === '') continue
    // o porcelain usa "XY <caminho>" ou "XY <origem> -> <destino>"
    const path = line.slice(3).trim()
    if (path === '') continue
    const arrow = path.split(' -> ')
    files.push((arrow[1] ?? arrow[0]).replace(/^"|"$/g, ''))
  }
  return [...new Set(files)]
}

/**
 * Verifica se a remoção de um ficheiro já está preparada no índice.
 *
 * @param {string} repoRoot caminho raiz do repositório.
 * @param {string} file caminho relativo do ficheiro removido do disco.
 * @returns {boolean} `true` quando o índice já regista a remoção.
 */
function isDeletionStaged(repoRoot, file) {
  const output = runCommand(
    'git',
    ['diff', '--cached', '--name-only', '--diff-filter=D', '--', file],
    repoRoot,
    'E_GIT_ERROR',
  )
  return output.trim() !== ''
}

/**
 * Normaliza um caminho para comparação, sem marcas de separador.
 *
 * @param {string} path caminho a normalizar.
 * @returns {string} caminho normalizado.
 */
function normalizeScopePath(path) {
  return path.replace(/\\/g, '/').replace(/^\.\//, '')
}

/**
 * Lista os ficheiros de especificação que a CLI actualiza durante a task.
 *
 * São parte do trabalho da task e têm de ser commited:
 * - o ficheiro da task;
 * - o plano de acção, se existir;
 * - `docs/history.md`, se a task registou histórico.
 *
 * @param {string} repoRoot caminho raiz do repositório.
 * @param {object} located localização da task.
 * @param {object} task task carregada.
 * @returns {string[]} caminhos relativos à raiz do repositório.
 */
function specificationFiles(repoRoot, located, task) {
  const files = []

  const relative = (absolute) => {
    const root = repoRoot.replace(/\\/g, '/').replace(/\/$/, '')
    const target = absolute.replace(/\\/g, '/')
    return target.startsWith(`${root}/`) ? target.slice(root.length + 1) : target
  }

  if (located?.source) files.push(relative(located.source))
  if (located?.dest && existsSync(located.dest)) files.push(relative(located.dest))
  if (task.actionPlan) files.push(normalizeScopePath(task.actionPlan))

  const history = join(repoRoot, 'docs', 'history.md')
  if (existsSync(history)) files.push('docs/history.md')

  return [...new Set(files)]
}

/**
 * Verifica se um caminho tocado está dentro do âmbito declarado da task.
 *
 * O âmbito vem da secção `## Arquivos`. Um ficheiro é considerado dentro se
 * o seu caminho coincide com um dos declarados, ou se está dentro de um
 * diretório declarado.
 *
 * @param {string} file caminho relativo do ficheiro tocado.
 * @param {string[]} scopeFiles caminhos declarados na task.
 * @returns {boolean} `true` quando o ficheiro está dentro do âmbito.
 */
function isWithinScope(file, scopeFiles) {
  const target = normalizeScopePath(file)
  return scopeFiles.some((declared) => {
    const scope = normalizeScopePath(declared).replace(/\/$/, '')
    if (target === scope) return true
    return target.startsWith(`${scope}/`)
  })
}

/** Base de destino dos pull requests criados pela automação. */
export const PR_BASE_BRANCH = 'main'

/**
 * Nomes possíveis do GitHub CLI, por plataforma.
 *
 * No Windows, o GitHub CLI é instalado como `gh.exe`. O Node só consegue
 * executar `gh.cmd` e `gh.bat` através de um shell, o que abriria espaço para
 * injecção de comandos no corpo do pull request. Por isso, a procura é feita
 * por um ficheiro executável real, resolvido antes da chamada.
 */
const GH_EXECUTABLE_NAMES = process.platform === 'win32' ? ['gh.exe'] : ['gh']

/**
 * Verifica se um ficheiro existe e é executável.
 *
 * No Windows, a permissão de execução não é usada pelo sistema de ficheiros,
 * pelo que a existência basta. Em POSIX, um ficheiro sem bit de execução não
 * pode ser executado, e devolvê-lo causaria um erro de permissão em vez de
 * um "não instalado" claro.
 *
 * @param {string} candidate caminho do ficheiro.
 * @returns {boolean} `true` quando o ficheiro existe e é executável.
 */
function isExecutableFile(candidate) {
  try {
    const stats = statSync(candidate)
    if (!stats.isFile()) return false
    if (process.platform === 'win32') return true
    return (stats.mode & 0o111) !== 0
  } catch {
    return false
  }
}

/**
 * Localiza o executável do GitHub CLI.
 *
 * A procura usa o `PATH`, sem executar nada. Devolve `null` quando o GitHub
 * CLI não está instalado.
 *
 * @returns {string|null} caminho do executável ou `null`.
 */
export function resolveGhExecutable() {
  const pathValue = process.env.PATH ?? ''
  const separator = process.platform === 'win32' ? ';' : ':'
  const directories = pathValue.split(separator).filter((entry) => entry !== '')
  for (const directory of directories) {
    for (const name of GH_EXECUTABLE_NAMES) {
      const candidate = join(directory, name)
      if (isExecutableFile(candidate)) return candidate
    }
  }
  return null
}

/**
 * Executa um comando externo, devolvendo o resultado em vez de lançar.
 *
 * A automação do pull request usa este executor para que as chamadas ao GitHub
 * CLI possam ser substituídas em teste, sem acesso à rede.
 *
 * @param {string} command comando a executar.
 * @param {string[]} args argumentos do comando.
 * @param {string} cwd directório de trabalho.
 * @returns {{code: number, stdout: string, stderr: string, unavailable?: boolean}} resultado da execução.
 */
export function runExternalCommand(command, args, cwd) {
  if (command === 'gh' && !resolveGhExecutable()) {
    return {
      code: 127,
      stdout: '',
      stderr: 'GitHub CLI indisponível: o executável gh não foi encontrado no PATH',
      unavailable: true,
    }
  }
  const executable = command === 'gh' ? resolveGhExecutable() : command
  try {
    const stdout = execFileSync(executable, args, {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    return { code: 0, stdout: String(stdout), stderr: '' }
  } catch (error) {
    return {
      code: typeof error.status === 'number' ? error.status : 1,
      stdout: error.stdout ? String(error.stdout) : '',
      stderr: error.stderr ? String(error.stderr) : String(error.message ?? ''),
    }
  }
}

/**
 * Extrai a URL de um pull request a partir da saída do GitHub CLI.
 *
 * @param {string} output saída do comando.
 * @returns {string|null} URL do pull request ou `null`.
 */
function extractPullRequestUrl(output) {
  const match = /https:\/\/github\.com\/[^\s/]+\/[^\s/]+\/pull\/\d+/.exec(output ?? '')
  return match ? match[0] : null
}

/**
 * Valida um elemento da lista de pull requests devolvida pelo GitHub CLI.
 *
 * A validação é mínima e estrita: `url` tem de ser uma string não vazia, `number`
 * tem de ser um inteiro positivo, e `state` e `title` têm de ser strings quando
 * presentes. Um elemento malformado significa que a resposta do GitHub CLI não
 * é fiável, e aceitá-la permitiria criar um pull request duplicado.
 *
 * O `number` é validado pelo tipo, antes de qualquer coerção. Uma coerção
 * acceptaria valores que o GitHub CLI nunca devolve — `null`, `true`, `false` e
 * a string vazia convertem-se em `0`, e uma string numérica converte-se no
 * número correspondente — e reportaria um pull request inexistente como
 * existente.
 *
 * @param {unknown} entry elemento da lista.
 * @returns {{number: number, url: string, state: string, title: string}|null} elemento validado ou `null`.
 */
function parsePullRequestEntry(entry) {
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return null
  if (typeof entry.url !== 'string' || entry.url.trim() === '') return null
  if (typeof entry.number !== 'number') return null
  if (!Number.isInteger(entry.number)) return null
  if (entry.number <= 0) return null
  if (entry.state !== undefined && typeof entry.state !== 'string') return null
  if (entry.title !== undefined && typeof entry.title !== 'string') return null
  return {
    number: entry.number,
    url: entry.url,
    state: entry.state ?? '',
    title: entry.title ?? '',
  }
}

/**
 * Interpreta a saída JSON do `gh pr list`.
 *
 * Só uma resposta válida pode significar ausência de pull request: um array JSON
 * válido e vazio. Qualquer outra resposta — saída vazia, JSON inválido, JSON que
 * não é um array, ou um array com elementos malformados — é uma resposta
 * inválida do GitHub CLI, e é reportada como erro de procura, para que a
 * criação não prossiga e não haja pull request duplicado.
 *
 * @param {string} output saída do comando.
 * @param {{branch?: string, base?: string}} [context] contexto da procura, para o erro.
 * @returns {Array<{number: number, url: string, state: string, title: string}>} pull requests encontrados.
 * @throws {RawspecError} `E_PR_UNAVAILABLE` quando a resposta não é válida.
 */
function parsePullRequestList(output, context = {}) {
  const text = String(output ?? '').trim()
  if (text === '') {
    throw new RawspecError(
      'E_PR_UNAVAILABLE',
      `Resposta inválida ao procurar pull request: o GitHub CLI devolveu saída vazia`,
      { ...context, reason: 'empty_output', output },
    )
  }

  let parsed
  try {
    parsed = JSON.parse(text)
  } catch (error) {
    throw new RawspecError(
      'E_PR_UNAVAILABLE',
      `Resposta inválida ao procurar pull request: o GitHub CLI não devolveu JSON`,
      { ...context, reason: 'invalid_json', output, cause: error.message },
    )
  }

  if (!Array.isArray(parsed)) {
    throw new RawspecError(
      'E_PR_UNAVAILABLE',
      `Resposta inválida ao procurar pull request: o GitHub CLI devolveu JSON que não é uma lista`,
      { ...context, reason: 'not_a_list', output },
    )
  }

  return parsed.map((entry) => {
    const parsedEntry = parsePullRequestEntry(entry)
    if (!parsedEntry) {
      throw new RawspecError(
        'E_PR_UNAVAILABLE',
        `Resposta inválida ao procurar pull request: a lista traz um pull request malformado`,
        { ...context, reason: 'malformed_entry', output, entry },
      )
    }
    return parsedEntry
  })
}

/**
 * Monta o título e o corpo do pull request de uma tarefa.
 *
 * @param {{change: object, task: object}} context tarefa e mudança.
 * @param {string} branch branch de origem do pull request.
 * @param {string} [base] branch base do pull request.
 * @returns {{title: string, body: string}} título e corpo.
 */
export function buildPullRequestContent({ change, task }, branch, base = PR_BASE_BRANCH) {
  const title = `${change.id} — ${task.id} — ${task.title}`
  const body = [
    `## ${task.id} — ${task.title}`,
    '',
    `- Mudança: \`${change.id}\``,
    `- Tarefa: \`${task.id}\``,
    `- Branch: \`${branch}\``,
    `- Base: \`${base}\``,
    `- Verificação: ${task.verification}`,
    `- Evidência: ${task.evidence ?? '—'}`,
    task.actionPlan ? `- Plano de ação: \`${task.actionPlan}\`` : '- Plano de ação: none',
    '',
    'Pull request aberto automaticamente pela automação do RawSpec v2 após o commit e o push da tarefa.',
  ].join('\n')
  return { title, body }
}

/**
 * Procura um pull request já aberto para a branch de origem.
 *
 * @param {string} repoRoot caminho raiz do repositório.
 * @param {string} branch branch de origem.
 * @param {{base?: string, repo?: string, run?: (command: string, args: string[], cwd: string) => {code: number, stdout: string, stderr: string, unavailable?: boolean}}} [options] branch base, repositório GitHub e executor injetado.
 * @returns {{number: number, url: string, state: string, title: string}|null} pull request existente ou `null`.
 * @throws {RawspecError} `E_PR_UNAVAILABLE` quando o GitHub CLI está indisponível, a procura falha ou a resposta do GitHub CLI é inválida.
 */
export function findPullRequest(
  repoRoot,
  branch,
  { base = PR_BASE_BRANCH, repo, run = runExternalCommand } = {},
) {
  const args = [
    'pr',
    'list',
    '--head',
    branch,
    '--base',
    base,
    '--state',
    'open',
    '--json',
    'number,url,state,title',
  ]
  if (repo) args.push('--repo', repo)
  const result = run('gh', args, repoRoot)
  if (result.code !== 0) {
    throw new RawspecError(
      'E_PR_UNAVAILABLE',
      `Falha ao procurar pull request para ${branch}: ${(result.stderr || result.stdout || '').trim()}`,
      { branch, base, stderr: result.stderr, stdout: result.stdout },
    )
  }
  const [existing] = parsePullRequestList(result.stdout, { branch, base })
  return existing ?? null
}

/**
 * Abre o pull request da tarefa para a branch base.
 *
 * A operação é idempotente: se já existir um pull request aberto para a branch
 * de origem, o existente é devolvido e nenhum duplicado é criado. A criação
 * nunca faz merge automático.
 *
 * A idempotência assenta na procura, por isso a resposta da procura tem de ser
 * válida. Uma resposta inválida do GitHub CLI — saída vazia, JSON inválido, JSON
 * que não é uma lista, ou uma lista com elementos malformados — interrompe a
 * operação com `E_PR_UNAVAILABLE`, antes de qualquer criação.
 *
 * @param {string} repoRoot caminho raiz do repositório.
 * @param {string} taskId identificador da tarefa.
 * @param {{changeId?: string, branch?: string, base?: string, repo?: string, run?: (command: string, args: string[], cwd: string) => {code: number, stdout: string, stderr: string, unavailable?: boolean}}} [options] opções.
 * @returns {{status: 'created'|'existing', url: string, number: number|null, branch: string, base: string, title: string}} resultado.
 * @throws {RawspecError} `E_ARGS`, `E_PR_UNAVAILABLE` ou `E_PR_CREATE_FAILED`.
 */
export function openPullRequest(
  repoRoot,
  taskId,
  { changeId, branch, base = PR_BASE_BRANCH, repo, run = runExternalCommand } = {},
) {
  const { change, task } = loadTask(repoRoot, taskId, changeId)
  const head = validateBranchName(branch ?? currentBranch(repoRoot))
  validateBranchName(base)

  // Um pull request da branch para ela própria não faz sentido, e o GitHub CLI
  // só reportaria uma mensagem genérica. A guarda dá um erro preciso, antes
  // de qualquer chamada à rede.
  if (head === base) {
    throw new RawspecError(
      'E_ARGS',
      `A branch de origem e a branch base do pull request não podem ser iguais: ${head}`,
      { branch: head, base },
    )
  }

  const existing = findPullRequest(repoRoot, head, { base, repo, run })
  if (existing) {
    return {
      status: 'existing',
      url: existing.url,
      number: existing.number,
      branch: head,
      base,
      title: existing.title,
    }
  }

  const { title, body } = buildPullRequestContent({ change, task }, head, base)
  const args = ['pr', 'create', '--base', base, '--head', head]
  if (repo) args.push('--repo', repo)
  args.push('--title', title, '--body', body)
  const result = run('gh', args, repoRoot)
  if (result.code !== 0) {
    const code = result.unavailable ? 'E_PR_UNAVAILABLE' : 'E_PR_CREATE_FAILED'
    throw new RawspecError(
      code,
      `Falha ao abrir o pull request para ${head}: ${(result.stderr || result.stdout || '').trim()}`,
      { branch: head, base, stderr: result.stderr, stdout: result.stdout },
    )
  }

  const url = extractPullRequestUrl(result.stdout) ?? extractPullRequestUrl(result.stderr)
  if (!url) {
    throw new RawspecError(
      'E_PR_CREATE_FAILED',
      `Pull request criado sem URL legível para ${head}`,
      { branch: head, base, stdout: result.stdout, stderr: result.stderr },
    )
  }

  const number = Number(/\/pull\/(\d+)/.exec(url)?.[1] ?? Number.NaN)
  return {
    status: 'created',
    url,
    number: Number.isNaN(number) ? null : number,
    branch: head,
    base,
    title,
  }
}

/**
 * Valida um nome de branch antes de o passar ao Git ou ao GitHub CLI.
 *
 * Um nome de branch nunca começa por `-`, porque o Git e o GitHub CLI
 * interpretariam esse prefixo como uma opção. A validação recusa ainda
 * separadores de referência, que permitiriam escrever fora da branch
 * pretendida.
 *
 * @param {string} branch nome da branch.
 * @returns {string} branch validada.
 */
function validateBranchName(branch) {
  if (
    typeof branch !== 'string' ||
    branch.trim() === '' ||
    !/^[A-Za-z0-9][A-Za-z0-9._/-]*$/.test(branch) ||
    branch.includes('..')
  ) {
    throw new RawspecError('E_ARGS', `Nome de branch inválido: ${String(branch)}`, {
      branch,
    })
  }
  return branch
}

/**
 * Executa Git permitindo distinguir uma falha esperada de uma falha operacional.
 *
 * @param {string[]} args argumentos do Git.
 * @param {string} repoRoot raiz do repositório.
 * @returns {{code: number, stdout: string, stderr: string}} resultado do Git.
 */
function runGitResult(repoRoot, args) {
  try {
    const stdout = execFileSync('git', args, {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      env: {
        ...process.env,
        GIT_DIR: resolveGitDir(repoRoot),
        GIT_WORK_TREE: repoRoot,
      },
    })
    return { code: 0, stdout, stderr: '' }
  } catch (error) {
    return {
      code: Number.isInteger(error.status) ? error.status : 1,
      stdout: error.stdout ? String(error.stdout) : '',
      stderr: error.stderr ? String(error.stderr).trim() : error.message,
    }
  }
}

/**
 * Devolve os dados de um remote configurado, sem aceitar nomes que possam ser
 * interpretados como opções do Git.
 *
 * Um remote pode ter vários URLs. Quando isso acontece, o Git usa o primeiro
 * para operações normais, e é esse o URL que interessa para resolver o
 * repositório GitHub. Os restantes são devolvidos para diagnóstico.
 *
 * @param {string} repoRoot raiz do repositório.
 * @param {string} remote nome do remote.
 * @returns {{url: string, urls: string[]}} remote validado.
 */
function getConfiguredRemote(repoRoot, remote) {
  const names = runCommand('git', ['remote'], repoRoot, 'E_GIT_ERROR')
    .split(/\r?\n/)
    .filter(Boolean)
  if (
    typeof remote !== 'string' ||
    !/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(remote) ||
    !names.includes(remote)
  ) {
    throw new RawspecError('E_GIT_ERROR', `Remote Git não configurado: ${String(remote)}`, {
      reason: 'remote_not_found',
      remote,
    })
  }

  const result = runGitResult(repoRoot, ['config', '--get-all', `remote.${remote}.url`])
  const urls = result.stdout
    .split(/\r?\n/)
    .map((url) => url.trim())
    .filter(Boolean)
  if (result.code !== 0 || urls.length === 0) {
    throw new RawspecError('E_GIT_ERROR', `URL do remote Git indisponível: ${remote}`, {
      reason: 'remote_not_found',
      remote,
    })
  }
  return { url: urls[0], urls }
}

/**
 * Converte uma falha de fetch ou de resolução de refs num erro fail-closed.
 *
 * @param {string} remote remote seleccionado.
 * @param {string} operation operação que falhou.
 * @param {{stderr?: string, stdout?: string}} result resultado do Git.
 * @returns {RawspecError} erro contextualizado.
 */
function remoteUnavailableError(remote, operation, result) {
  return new RawspecError('E_GIT_ERROR', `Remote ${remote} indisponível durante ${operation}`, {
    reason: 'remote_unavailable',
    remote,
    operation,
  })
}

/**
 * Atualiza uma ref remota específica e devolve a sua referência local.
 *
 * O fetch é dirigido ao ref exacto, para que a base do range exista mesmo que
 * o refspec configurado não a cubra. É também a prova de que o remote está
 * disponível: um fetch que falha significa que o remote não pode ser
 * verificado, e o caminho tem de falhar fechado.
 *
 * @param {string} repoRoot raiz do repositório.
 * @param {string} remote remote seleccionado.
 * @param {string} branch branch remota.
 * @returns {string} ref em `refs/remotes`.
 */
function fetchRemoteBranchRef(repoRoot, remote, branch) {
  const remoteRef = `refs/heads/${branch}`
  const trackingRef = `refs/remotes/${remote}/${branch}`
  const fetched = runGitResult(repoRoot, ['fetch', remote, `+${remoteRef}:${trackingRef}`])
  if (fetched.code !== 0) {
    throw remoteUnavailableError(remote, `fetch de ${remoteRef}`, fetched)
  }

  const resolved = runGitResult(repoRoot, ['rev-parse', '--verify', `${trackingRef}^{commit}`])
  if (resolved.code !== 0) {
    throw remoteUnavailableError(remote, `validação de ${remoteRef}`, resolved)
  }
  return trackingRef
}

/**
 * Confirma se uma branch existe no remote sem confiar em refs locais obsoletas.
 *
 * @param {string} repoRoot raiz do repositório.
 * @param {string} remote remote seleccionado.
 * @param {string} branch branch remota.
 * @returns {boolean} `true` quando a branch existe no servidor.
 */
function remoteBranchExists(repoRoot, remote, branch) {
  const remoteRef = `refs/heads/${branch}`
  const result = runGitResult(repoRoot, ['ls-remote', '--heads', remote, remoteRef])
  if (result.code !== 0) {
    throw remoteUnavailableError(remote, `procura de ${remoteRef}`, result)
  }
  const lines = result.stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
  if (lines.length === 0) return false
  if (lines.length !== 1 || lines[0].split(/\s+/)[1] !== remoteRef) {
    throw remoteUnavailableError(remote, `validação de ${remoteRef}`, result)
  }
  return true
}

/**
 * Resolve um URL HTTPS ou SSH do GitHub para o argumento `owner/repo` do `gh`.
 *
 * O owner e o nome do repositório são validados: só podem conter os caracteres
 * que o GitHub aceita num identificador de repositório. Sem esta guarda, um URL
 * remoto manipulado poderia injectar um valor arbitrário no `gh --repo`.
 *
 * @param {string} url URL configurado no remote.
 * @returns {string|null} repositório GitHub ou `null` para URLs não suportados.
 */
function parseGitHubRepository(url) {
  const patterns = [
    /^https?:\/\/(?:[^/@]+@)?github\.com\/([^/]+)\/([^/?#]+?)(?:\.git)?\/?$/i,
    /^ssh:\/\/(?:[^/@]+@)?github\.com\/([^/]+)\/([^/?#]+?)(?:\.git)?\/?$/i,
    /^(?:[^/@:]+@)?github\.com:([^/]+)\/([^/?#]+?)(?:\.git)?$/i,
  ]
  for (const pattern of patterns) {
    const match = pattern.exec(url)
    if (!match) continue
    const [, owner, name] = match
    if (!owner || !name) return null
    if (!/^[A-Za-z0-9._-]+$/.test(owner) || !/^[A-Za-z0-9._-]+$/.test(name)) return null
    if (owner === '.' || owner === '..' || name === '.' || name === '..') return null
    return `${owner}/${name}`
  }
  return null
}

/**
 * Exige que o remote tenha um URL GitHub suportado para os comandos `gh`.
 *
 * @param {{url: string, urls?: string[]}} configuredRemote remote já validado para Git.
 * @param {string} remote nome do remote seleccionado.
 * @returns {string} repositório no formato `owner/repo`.
 */
function resolveGitHubRemoteRepository(configuredRemote, remote) {
  const candidates = configuredRemote.urls?.length
    ? configuredRemote.urls
    : configuredRemote.url
      ? [configuredRemote.url]
      : []
  for (const candidate of candidates) {
    const repository = parseGitHubRepository(candidate)
    if (repository) return repository
  }
  throw new RawspecError(
    'E_PR_UNAVAILABLE',
    `O URL do remote ${remote} não identifica um repositório GitHub suportado`,
    { reason: 'remote_url_unsupported', remote },
  )
}

/**
 * Publica o commit existente, classificando uma falha de push pelo estado real
 * do remote.
 *
 * Entre a inspecção do remote e o push, o remote pode mudar. Um push que falha
 * por isso não é um erro Git genérico: é o estado remoto que divergiu, e a
 * task exige uma razão precisa. Por isso, quando o push falha, o estado remoto
 * é reinspeccionado e a razão correspondente é reportada.
 *
 * @param {string} repoRoot raiz do repositório.
 * @param {{remote: string, branch: string, head: string}} context remote, branch e commit local.
 * @returns {boolean} `true` quando o push foi efectuado.
 */
function pushExistingCommit(repoRoot, { remote, branch, head }) {
  try {
    runCommand('git', ['push', '-u', remote, '--', branch], repoRoot, 'E_GIT_ERROR')
    return true
  } catch (error) {
    if (!(error instanceof RawspecError)) throw error
    // A reinspecção só reclassifica o erro quando o remote está de facto
    // divergido. Qualquer outra causa mantém o erro original do Git.
    try {
      inspectPublishRange(repoRoot, remote, branch, head)
    } catch (inspectionError) {
      if (inspectionError instanceof RawspecError) throw inspectionError
    }
    throw error
  }
}

/**
 * Confirma a existência de um commit e obtém a sua mensagem.
 *
 * @param {string} repoRoot raiz do repositório.
 * @param {string} commit hash do commit.
 * @returns {{hash: string, message: string}} commit validado.
 */
function readTaskCommit(repoRoot, commit) {
  const parents = runCommand(
    'git',
    ['rev-list', '--parents', '-n', '1', commit],
    repoRoot,
    'E_GIT_ERROR',
  )
    .trim()
    .split(/\s+/)
  if (parents.length > 2) {
    throw new RawspecError('E_TASK_STATE', `Commit de merge inelegível: ${commit}`, {
      reason: 'merge_commit_ineligible',
      commit,
    })
  }
  const message = runCommand('git', ['show', '-s', '--format=%B', commit], repoRoot, 'E_GIT_ERROR')
  return { hash: parents[0], message }
}

/**
 * Valida metadados e, separadamente, o diff de um commit contra o âmbito da task.
 *
 * @param {string} commit hash do commit.
 * @param {string} message mensagem do commit.
 * @param {{changeId: string, taskId: string, task: object, located: object}} context tarefa e mudança.
 */
function validateTaskCommitMetadata(commit, message, context) {
  const lines = message.split(/\r?\n/)
  const changeLines = lines.filter((line) => line.startsWith('Change:'))
  const taskLines = lines.filter((line) => line.startsWith('Task:'))
  if (
    changeLines.length !== 1 ||
    changeLines[0] !== `Change: ${context.changeId}` ||
    taskLines.length !== 1 ||
    taskLines[0] !== `Task: ${context.taskId}`
  ) {
    throw new RawspecError('E_TASK_STATE', `Metadados incompatíveis no commit ${commit}`, {
      reason: 'commit_metadata_mismatch',
      commit,
      expectedChange: context.changeId,
      expectedTask: context.taskId,
      changeLines,
      taskLines,
    })
  }
}

/**
 * Aplica o gate de âmbito ao diff de um commit já criado.
 *
 * @param {string} repoRoot raiz do repositório.
 * @param {string} commit hash do commit.
 * @param {object} context tarefa e mudança.
 * @param {string[]} scopeFiles ficheiros e diretórios declarados no âmbito.
 */
function validateTaskCommitScope(repoRoot, commit, context, scopeFiles) {
  const specFiles = specificationFiles(repoRoot, context.located, context.task)
  const allowed = [...scopeFiles, ...specFiles]
  const output = runCommand(
    'git',
    ['diff-tree', '--root', '--no-commit-id', '--no-renames', '--name-only', '-r', '-z', commit],
    repoRoot,
    'E_GIT_ERROR',
  )
  const changed = output.split('\0').filter(Boolean)
  const outOfScope = changed.filter((file) => !isWithinScope(file, allowed))
  if (outOfScope.length > 0) {
    throw new RawspecError('E_SCOPE_VIOLATION', `Commit fora do âmbito da task ${context.taskId}`, {
      task: context.taskId,
      commit,
      outOfScope,
    })
  }
}

/**
 * Verifica a relação de ancestralidade entre duas refs.
 *
 * @param {string} repoRoot raiz do repositório.
 * @param {string} ancestor ref candidata a ancestral.
 * @param {string} descendant ref candidata a descendente.
 * @returns {boolean} `true` quando `ancestor` é ancestral de `descendant`.
 */
function isGitAncestor(repoRoot, ancestor, descendant) {
  const result = runGitResult(repoRoot, ['merge-base', '--is-ancestor', ancestor, descendant])
  if (result.code === 0) return true
  if (result.code === 1) return false
  throw new RawspecError('E_GIT_ERROR', `Não foi possível comparar refs Git`, {
    reason: 'remote_unavailable',
    ancestor,
    descendant,
    stderr: result.stderr,
  })
}

/**
 * Determina a base remota e o conjunto de commits a publicar, sempre após fetch.
 *
 * @param {string} repoRoot raiz do repositório.
 * @param {string} remote remote seleccionado.
 * @param {string} branch branch local.
 * @param {string} head commit local.
 * @returns {{baseRef: string, commits: string[], alreadyPublished: boolean}} estado validado.
 */
function inspectPublishRange(repoRoot, remote, branch, head) {
  if (remoteBranchExists(repoRoot, remote, branch)) {
    const baseRef = fetchRemoteBranchRef(repoRoot, remote, branch)
    const remoteHead = runCommand(
      'git',
      ['rev-parse', '--verify', `${baseRef}^{commit}`],
      repoRoot,
      'E_GIT_ERROR',
    ).trim()
    if (remoteHead === head) return { baseRef, commits: [], alreadyPublished: true }
    if (isGitAncestor(repoRoot, remoteHead, head)) {
      const commits = runCommand(
        'git',
        ['rev-list', '--reverse', `${baseRef}..HEAD`],
        repoRoot,
        'E_GIT_ERROR',
      )
        .split(/\r?\n/)
        .filter(Boolean)
      return { baseRef, commits, alreadyPublished: false }
    }
    if (isGitAncestor(repoRoot, head, remoteHead)) {
      throw new RawspecError(
        'E_GIT_ERROR',
        `A branch remota ${branch} está à frente da branch local`,
        {
          reason: 'remote_ahead',
          remote,
          branch,
          local: head,
          remoteHead,
        },
      )
    }
    throw new RawspecError('E_GIT_ERROR', `A branch local e a branch remota ${branch} divergiram`, {
      reason: 'remote_diverged',
      remote,
      branch,
      local: head,
      remoteHead,
    })
  }

  if (!remoteBranchExists(repoRoot, remote, 'main')) {
    throw new RawspecError('E_GIT_ERROR', `A branch base ${remote}/main não existe`, {
      reason: 'remote_unavailable',
      remote,
      branch: 'main',
    })
  }
  const baseRef = fetchRemoteBranchRef(repoRoot, remote, 'main')
  const commits = runCommand(
    'git',
    ['rev-list', '--reverse', `${baseRef}..HEAD`],
    repoRoot,
    'E_GIT_ERROR',
  )
    .split(/\r?\n/)
    .filter(Boolean)
  return { baseRef, commits, alreadyPublished: false }
}

/**
 * Publica uma tarefa verificada, criando commit para alterações ou reutilizando
 * um commit elegível quando a árvore está limpa.
 *
 * As verificações correm por ordem antes da publicação. Uma falha impede o commit e o push.
 *
 * Depois do push, ou quando o HEAD já está publicado, a automação abre ou
 * reutiliza o pull request. A falha não desfaz o commit nem o push e é reportada
 * no resultado.
 *
 * @param {string} repoRoot caminho raiz do repositório.
 * @param {string} taskId identificador da tarefa.
 * @param {{changeId?: string, branch?: string, remote?: string, push?: boolean, checks?: string[][], runCheck?: (repoRoot: string, args: string[]) => void, pr?: boolean, prBase?: string, runExternal?: (command: string, args: string[], cwd: string) => {code: number, stdout: string, stderr: string}}} [options] opções.
 * @returns {{branch: string, commit: string, pushed: boolean, pullRequest: object|null}} resultado.
 */
export function commitAndPushTask(
  repoRoot,
  taskId,
  {
    changeId,
    branch,
    remote = 'origin',
    push = true,
    checks,
    runCheck,
    pr = true,
    prBase = PR_BASE_BRANCH,
    runExternal = runExternalCommand,
  } = {},
) {
  const { change, task, located } = loadTask(repoRoot, taskId, changeId)
  const done = task.status === 'COMPLETED' || task.status === 'ARCHIVED'
  if (!done || task.verification !== 'VERIFIED') {
    throw new RawspecError('E_TASK_STATE', `Tarefa ${task.id} não está COMPLETED + VERIFIED`, {
      reason: 'task_not_verified',
      task: task.id,
      status: task.status,
      verification: task.verification,
    })
  }

  const mergeHead = runCommand(
    'git',
    ['rev-parse', '--git-path', 'MERGE_HEAD'],
    repoRoot,
    'E_GIT_ERROR',
  ).trim()
  const mergeHeadPath = isAbsolute(mergeHead) ? mergeHead : resolve(repoRoot, mergeHead)
  if (existsSync(mergeHeadPath)) {
    throw new RawspecError('E_TASK_STATE', `Existe um merge Git por concluir`, {
      reason: 'merge_in_progress',
      task: task.id,
      mergeHead: mergeHeadPath,
    })
  }

  const initiallyChanged = listChangedFiles(repoRoot)
  const targetBranch = validateBranchName(branch ?? currentBranch(repoRoot))

  if (initiallyChanged.length === 0) {
    if (task.status !== 'COMPLETED' || task.verification !== 'VERIFIED') {
      throw new RawspecError(
        'E_TASK_STATE',
        `Tarefa ${task.id} não está COMPLETED + VERIFIED para publicar commit existente`,
        {
          reason: 'task_not_verified',
          task: task.id,
          status: task.status,
          verification: task.verification,
        },
      )
    }

    const localBranch = currentBranch(repoRoot)
    const expectedBranch = taskBranchName(change, task)
    if (localBranch !== expectedBranch || (branch !== undefined && branch !== localBranch)) {
      throw new RawspecError(
        'E_TASK_STATE',
        `Branch ${localBranch} não corresponde à branch elegível ${expectedBranch}`,
        {
          reason: 'branch_mismatch',
          task: task.id,
          branch: localBranch,
          requestedBranch: branch ?? null,
          expectedBranch,
        },
      )
    }

    const headResult = runGitResult(repoRoot, ['rev-parse', '--verify', 'HEAD'])
    if (headResult.code !== 0) {
      throw new RawspecError('E_TASK_STATE', `Não existe commit HEAD elegível para ${task.id}`, {
        reason: 'no_eligible_commit',
        task: task.id,
        stderr: headResult.stderr,
      })
    }
    const head = headResult.stdout.trim()
    const context = { changeId: change.id, taskId: task.id, task, located }
    const scopeFiles = task.scope?.files ?? []

    // Sem push não há publicação a preparar: não há fetch a fazer nem range a
    // validar. O commit elegível é apenas o HEAD, e a sua elegibilidade é
    // verificada localmente.
    let publishRange = null
    let configuredRemote = null
    if (push) {
      configuredRemote = getConfiguredRemote(repoRoot, remote)
      publishRange = inspectPublishRange(repoRoot, remote, localBranch, head)

      if (!publishRange.alreadyPublished && publishRange.commits.length === 0) {
        throw new RawspecError(
          'E_TASK_STATE',
          `Não existe commit local elegível para publicar para ${task.id}`,
          {
            reason: 'no_eligible_commit',
            task: task.id,
            branch: localBranch,
            base: publishRange.baseRef,
          },
        )
      }
    }

    const commits = publishRange?.commits.length > 0 ? publishRange.commits : [head]
    const commitMessages = commits.map((commit) => {
      const details = readTaskCommit(repoRoot, commit)
      validateTaskCommitMetadata(details.hash, details.message, context)
      return details
    })

    const commands = checks ?? COMMIT_CHECKS
    runChecks(repoRoot, { checks: commands, runCheck })

    for (const commit of commitMessages) {
      validateTaskCommitScope(repoRoot, commit.hash, context, scopeFiles)
    }

    const shortCommit = runCommand(
      'git',
      ['rev-parse', '--short', 'HEAD'],
      repoRoot,
      'E_GIT_ERROR',
    ).trim()
    let pushed = false
    if (push && !publishRange.alreadyPublished) {
      pushed = pushExistingCommit(repoRoot, { remote, branch: localBranch, head })
    }
    let pullRequest = null
    if (push && pr) {
      try {
        const repository = resolveGitHubRemoteRepository(configuredRemote, remote)
        pullRequest = openPullRequest(repoRoot, taskId, {
          changeId,
          branch: localBranch,
          base: prBase,
          repo: repository,
          run: runExternal,
        })
      } catch (error) {
        if (!(error instanceof RawspecError)) throw error
        pullRequest = {
          status: 'failed',
          url: null,
          number: null,
          branch: localBranch,
          base: prBase,
          title: '',
          error: { code: error.code, message: error.message, details: error.details ?? {} },
        }
      }
    }

    return { branch: localBranch, commit: shortCommit, pushed, pullRequest }
  }

  const commands = checks ?? COMMIT_CHECKS
  runChecks(repoRoot, { checks: commands, runCheck })

  const message = buildCommitMessage(repoRoot, taskId, {
    changeId,
    tests: describeChecks(commands),
  })

  // Gate de âmbito. As permissões de caminho não são uma barreira: uma
  // escrita feita por shell contorna a negação de edição. Este gate é a
  // garantia real, e corre antes do staging para que nada seja commited
  // quando falha.
  const scopeFiles = task.scope?.files ?? []
  const specFiles = specificationFiles(repoRoot, located, task)
  const allowed = [...scopeFiles, ...specFiles]
  const changed = listChangedFiles(repoRoot)
  const inScope = changed.filter((file) => isWithinScope(file, allowed))
  const outOfScope = changed.filter((file) => !isWithinScope(file, allowed))

  if (outOfScope.length > 0) {
    throw new RawspecError('E_SCOPE_VIOLATION', `Ficheiros fora do âmbito da task ${task.id}`, {
      task: task.id,
      outOfScope,
      inScope,
    })
  }

  if (inScope.length === 0) {
    throw new RawspecError(
      'E_TASK_STATE',
      `Não há alterações dentro do âmbito para commitar na tarefa ${task.id}`,
      { reason: 'no_changes_to_commit', task: task.id },
    )
  }

  for (const file of inScope) {
    // Um ficheiro removido do disco prepara-se com `add -u`, exceto quando
    // o índice já registou a remoção.
    if (existsSync(join(repoRoot, file))) {
      runCommand('git', ['add', '--', file], repoRoot, 'E_GIT_ERROR')
    } else if (!isDeletionStaged(repoRoot, file)) {
      runCommand('git', ['add', '-u', '--', file], repoRoot, 'E_GIT_ERROR')
    }
  }
  runCommand('git', ['commit', '-m', message], repoRoot, 'E_GIT_ERROR')

  let pushed = false
  if (push) {
    runCommand('git', ['push', '-u', remote, '--', targetBranch], repoRoot, 'E_GIT_ERROR')
    pushed = true
  }

  const commit = runCommand('git', ['rev-parse', '--short', 'HEAD'], repoRoot, 'E_GIT_ERROR').trim()

  // O pull request só faz sentido depois de a branch estar publicada. Uma
  // falha aqui não desfaz o commit nem o push, e não reprova a verificação da
  // tarefa: o erro é reportado com precisão e o registo continua válido.
  let pullRequest = null
  if (pr && pushed) {
    try {
      const configuredRemote = getConfiguredRemote(repoRoot, remote)
      const repository = resolveGitHubRemoteRepository(configuredRemote, remote)
      pullRequest = openPullRequest(repoRoot, taskId, {
        changeId,
        branch: targetBranch,
        base: prBase,
        repo: repository,
        run: runExternal,
      })
    } catch (error) {
      if (!(error instanceof RawspecError)) throw error
      pullRequest = {
        status: 'failed',
        url: null,
        number: null,
        branch: targetBranch,
        base: prBase,
        title: '',
        error: { code: error.code, message: error.message, details: error.details ?? {} },
      }
    }
  }

  return { branch: targetBranch, commit, pushed, pullRequest }
}

/**
 * Carrega uma tarefa ativa ou arquivada para leitura.
 *
 * @param {string} repoRoot caminho raiz do repositório.
 * @param {string} taskId identificador da tarefa.
 * @param {string} [changeId] mudança opcional.
 * @returns {{change: object, task: object, located: object}} tarefa carregada.
 */
function loadTask(repoRoot, taskId, changeId) {
  const id = normalizeTaskId(taskId)
  const located = locateTask(repoRoot, id, changeId)
  const file = existsSync(located.source) ? located.source : located.dest
  return { change: parseChange(located.changeDir), task: parseTaskFile(file), located }
}
