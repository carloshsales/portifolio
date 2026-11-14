/**
 * RawSpec helper — parser de mudanças e tarefas.
 *
 * TASK-002 da change 002-rawspec-task-commands.
 *
 * Este módulo apenas lê e interpreta os arquivos Markdown do RawSpec.
 * Ele não escreve arquivos: as tarefas de escrita são implementadas depois.
 */

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
import { spawnSync } from 'node:child_process'
import { basename, join, resolve, relative, isAbsolute } from 'node:path'

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

/* -------------------------------------------------------------------------- */
/* TASK-003 e TASK-004 — resolução de tarefa e seleção da próxima tarefa.    */
/* -------------------------------------------------------------------------- */

/** Subdiretório onde vivem as mudanças do RawSpec. */
export const CHANGES_DIRNAME = join('specs', 'changes')

/** Subdiretório das mudanças arquivadas. */
export const ARCHIVE_DIRNAME = 'archive'

/**
 * Allowlist de mudanças que operam em modo legado sequencial.
 *
 * A change 001 não declara `Depende de` e não será alterada. Nenhuma outra
 * mudança entra em modo legado por omitir o campo.
 */
export const LEGACY_SEQUENTIAL_CHANGES = Object.freeze(['001-portfolio-mvp'])

/**
 * Localiza a raiz do repositório a partir de um caminho qualquer.
 *
 * @param {string} [start] caminho inicial.
 * @returns {string} raiz do repositório.
 */
export function findRepoRoot(start = process.cwd()) {
  let current = resolve(start)
  for (;;) {
    if (existsSync(join(current, CHANGES_DIRNAME))) return current
    const parent = resolve(current, '..')
    if (parent === current) return resolve(start)
    current = parent
  }
}

/**
 * Resolve o diretório de mudanças dentro de uma raiz de repositório.
 *
 * @param {string} repoRoot raiz do repositório.
 * @returns {string} caminho absoluto de `specs/changes`.
 */
export function changesRoot(repoRoot) {
  return resolve(repoRoot, CHANGES_DIRNAME)
}

/**
 * Verifica se um caminho está dentro de um diretório esperado.
 *
 * @param {string} candidate caminho candidato, já resolvido.
 * @param {string} root diretório raiz, já resolvido.
 * @returns {boolean} `true` quando o caminho está contido no diretório.
 */
export function isInside(candidate, root) {
  const rel = relative(root, candidate)
  return rel === '' || (!rel.startsWith('..') && !isAbsolute(rel))
}

/**
 * Recusa caminhos que escapam do diretório permitido.
 *
 * @param {string} candidate caminho candidato.
 * @param {string} root diretório raiz, já resolvido.
 * @param {string} [label] rótulo usado na mensagem.
 * @throws {RawspecError} `E_PATH_ESCAPE` quando o caminho escapa.
 */
export function assertConfinedPath(candidate, root, label = 'caminho') {
  if (typeof candidate !== 'string' || candidate.trim() === '') {
    throw new RawspecError('E_PATH_ESCAPE', `${label} vazio`, { candidate, root })
  }
  if (candidate.includes('..')) {
    throw new RawspecError('E_PATH_ESCAPE', `${label} com ".." não é permitido: ${candidate}`, {
      candidate,
      root,
    })
  }
  if (isAbsolute(candidate)) {
    throw new RawspecError('E_PATH_ESCAPE', `${label} absoluto não é permitido: ${candidate}`, {
      candidate,
      root,
    })
  }
  const resolved = resolve(root, candidate)
  if (!isInside(resolved, root)) {
    throw new RawspecError('E_PATH_ESCAPE', `${label} fora de ${root}: ${candidate}`, {
      candidate,
      root,
    })
  }
  return resolved
}

/**
 * Lista as mudanças não arquivadas de um repositório.
 *
 * @param {string} repoRoot raiz do repositório.
 * @returns {Array<{id: string, dir: string, path: string}>} mudanças ativas.
 */
export function listActiveChanges(repoRoot) {
  const root = changesRoot(repoRoot)
  if (!existsSync(root)) return []

  const changes = []
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    if (entry.name === ARCHIVE_DIRNAME) continue
    const dir = join(root, entry.name)
    if (!existsSync(join(dir, 'tasks.md'))) continue
    changes.push({ id: entry.name, dir, path: join(CHANGES_DIRNAME, entry.name) })
  }
  return changes.sort((a, b) => a.id.localeCompare(b.id))
}

/**
 * Lista as mudanças arquivadas de um repositório.
 *
 * @param {string} repoRoot raiz do repositório.
 * @returns {Array<{id: string, dir: string, path: string}>} mudanças arquivadas.
 */
export function listArchivedChanges(repoRoot) {
  const root = join(changesRoot(repoRoot), ARCHIVE_DIRNAME)
  if (!existsSync(root)) return []

  const changes = []
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    const dir = join(root, entry.name)
    if (!existsSync(join(dir, 'tasks.md'))) continue
    changes.push({ id: entry.name, dir, path: join(CHANGES_DIRNAME, ARCHIVE_DIRNAME, entry.name) })
  }
  return changes.sort((a, b) => a.id.localeCompare(b.id))
}

/**
 * Localiza o diretório de uma mudança pelo identificador informado.
 *
 * @param {string} repoRoot raiz do repositório.
 * @param {string} changeRef identificador da mudança.
 * @returns {{id: string, dir: string, path: string}} mudança resolvida.
 */
export function resolveChange(repoRoot, changeRef) {
  const active = listActiveChanges(repoRoot)
  const archived = listArchivedChanges(repoRoot)
  const all = [...active, ...archived]

  let id
  try {
    id = normalizeChangeId(
      changeRef,
      all.map((change) => ({ id: change.id, name: change.id })),
    )
  } catch (error) {
    if (error instanceof RawspecError && error.code === 'E_ARGS') {
      throw new RawspecError('E_CHANGE_NOT_FOUND', `Mudança não encontrada: ${changeRef}`, {
        value: changeRef,
        candidates: all.map((change) => change.id),
      })
    }
    throw error
  }

  const found = all.find((change) => change.id === id)
  if (!found) {
    throw new RawspecError('E_CHANGE_NOT_FOUND', `Mudança não encontrada: ${changeRef}`, {
      value: changeRef,
    })
  }
  return found
}

/**
 * Carrega a mudança resolvida, aplicando a política de dependências.
 *
 * @param {string} repoRoot raiz do repositório.
 * @param {string} changeRef identificador da mudança.
 * @returns {object} mudança interpretada com dependências resolvidas.
 */
export function loadChange(repoRoot, changeRef) {
  const changeDir = resolveChange(repoRoot, changeRef)
  const change = parseChange(changeDir.dir)
  change.path = changeDir.path
  change.archived =
    changeDir.path.includes(`${ARCHIVE_DIRNAME}${join('', '')}`) ||
    changeDir.path.split(/[\\/]/).includes(ARCHIVE_DIRNAME)
  applyDependencyPolicy(change)
  return change
}

/**
 * Aplica a política de dependências da mudança.
 *
 * Em mudanças novas, toda tarefa precisa declarar `Depende de`. A change 001
 * opera em modo legado sequencial por allowlist explícita.
 *
 * @param {object} change mudança interpretada.
 * @returns {object} a mesma mudança, com `tasks` ajustadas.
 */
export function applyDependencyPolicy(change) {
  const legacy = isLegacySequentialChange(change)

  if (legacy) {
    change.legacySequential = true
    change.tasks.forEach((task, index) => {
      if (task.dependencySource === 'explicit') return
      if (task.dependencySource === 'none') return
      const previous = change.tasks[index - 1]
      task.dependencies = previous ? [previous.id] : []
      task.dependencySource = previous ? 'legacy-sequential' : 'none'
    })
    return change
  }

  change.legacySequential = false
  const undeclared = change.tasks.filter((task) => task.dependencySource === 'undeclared')
  if (undeclared.length > 0) {
    throw new RawspecError(
      'E_DEPENDENCY_UNDECLARED',
      `Tarefa sem "Depende de" declarado em ${change.id}: ${undeclared
        .map((task) => task.id)
        .join(', ')}`,
      {
        change: change.id,
        tasks: undeclared.map((task) => task.id),
      },
    )
  }
  return change
}

/**
 * Informa se a mudança opera em modo legado sequencial.
 *
 * @param {{id: string}} change mudança interpretada.
 * @returns {boolean} `true` quando a mudança está na allowlist.
 */
export function isLegacySequentialChange(change) {
  return LEGACY_SEQUENTIAL_CHANGES.includes(change?.id)
}

/**
 * Constrói o grafo de dependências de uma mudança.
 *
 * @param {Array<object>} tasks tarefas da mudança.
 * @returns {Map<string, Array<object>>} dependências resolvidas por tarefa.
 */
export function buildDependencyGraph(tasks) {
  const graph = new Map()
  const byId = new Map(tasks.map((task) => [task.id, task]))

  for (const task of tasks) {
    const dependencies = []
    for (const dependencyId of task.dependencies) {
      const dependency = byId.get(dependencyId)
      if (!dependency) {
        throw new RawspecError(
          'E_DEPENDENCY_UNKNOWN',
          `Dependência inexistente: ${dependencyId} (exigida por ${task.id})`,
          { task: task.id, dependency: dependencyId },
        )
      }
      if (dependencyId === task.id) {
        throw new RawspecError('E_DEPENDENCY_CYCLE', `Tarefa ${task.id} depende de si mesma`, {
          task: task.id,
          dependency: dependencyId,
        })
      }
      dependencies.push(dependency)
    }
    graph.set(task.id, dependencies)
  }

  detectDependencyCycle(graph, tasks)
  return graph
}

/**
 * Detecta ciclos no grafo de dependências.
 *
 * @param {Map<string, Array<object>>} graph grafo de dependências.
 * @param {Array<object>} tasks tarefas da mudança.
 * @throws {RawspecError} `E_DEPENDENCY_CYCLE` quando há ciclo.
 */
function detectDependencyCycle(graph, tasks) {
  const state = new Map()
  const stack = []

  const visit = (task) => {
    const current = state.get(task.id)
    if (current === 'done') return
    if (current === 'open') {
      const cycle = [...stack.slice(stack.indexOf(task.id)), task.id]
      throw new RawspecError('E_DEPENDENCY_CYCLE', `Ciclo de dependências: ${cycle.join(' → ')}`, {
        cycle,
      })
    }
    state.set(task.id, 'open')
    stack.push(task.id)
    for (const dependency of graph.get(task.id) ?? []) visit(dependency)
    stack.pop()
    state.set(task.id, 'done')
  }

  for (const task of tasks) visit(task)
}

/**
 * Valida as dependências de uma tarefa.
 *
 * @param {object} task tarefa alvo.
 * @param {Array<object>} tasks tarefas da mudança.
 * @returns {Array<object>} dependências, com estado e origem.
 */
export function validateDependencies(task, tasks) {
  const graph = buildDependencyGraph(tasks)
  const dependencies = graph.get(task.id) ?? []
  const pending = []

  for (const dependency of dependencies) {
    const completed = dependency.status === 'COMPLETED' && dependency.verification === 'VERIFIED'
    dependenciesOf(task).push({
      id: dependency.id,
      title: dependency.title,
      status: dependency.status,
      verification: dependency.verification,
      source: task.dependencySource,
      satisfied: completed,
    })
    if (!completed) pending.push(dependency)
  }

  if (pending.length > 0) {
    const details = pending.map((dependency) => ({
      id: dependency.id,
      title: dependency.title,
      status: dependency.status,
      verification: dependency.verification,
      source: task.dependencySource,
    }))
    throw new RawspecError(
      'E_DEPENDENCY_PENDING',
      `Dependências pendentes para ${task.id}: ${pending.map((item) => item.id).join(', ')}`,
      { task: task.id, pending: details },
    )
  }

  return dependenciesOf(task)
}

/**
 * Guarda as dependências resolvidas na própria tarefa.
 *
 * @param {object} task tarefa alvo.
 * @returns {Array<object>} lista de dependências com origem e estado.
 */
function dependenciesOf(task) {
  if (!Array.isArray(task.resolvedDependencies)) task.resolvedDependencies = []
  return task.resolvedDependencies
}

/**
 * Resolve uma tarefa explicitamente indicada.
 *
 * @param {string} taskId identificador da tarefa, em qualquer formato aceito.
 * @param {object} options opções.
 * @param {string} options.repoRoot raiz do repositório.
 * @param {string} [options.changeId] restringe a busca a uma mudança.
 * @returns {object} tarefa resolvida com a mudança de origem.
 */
export function resolveTask(taskId, { repoRoot, changeId } = {}) {
  const root = repoRoot ?? findRepoRoot()
  const id = normalizeTaskId(taskId)

  const scoped = changeId
    ? [resolveChange(root, changeId)].filter(
        (change) => !change.path.split(/[\\/]/).includes(ARCHIVE_DIRNAME),
      )
    : listActiveChanges(root)

  const matches = []
  for (const changeRef of scoped) {
    const change = loadChange(root, changeRef.id)
    const task = change.tasks.find((item) => item.id === id)
    if (task) matches.push({ change, task })
  }

  if (matches.length === 1) {
    const { change, task } = matches[0]
    return {
      change: describeChange(change),
      task: describeTask(task, change),
    }
  }

  if (matches.length > 1) {
    throw new RawspecError('E_TASK_AMBIGUOUS', `Tarefa ${id} existe em mais de uma mudança`, {
      task: id,
      candidates: matches.map(({ change, task }) => describeTask(task, change)),
    })
  }

  const archived = listArchivedChanges(root)
  for (const changeRef of archived) {
    let change
    try {
      change = loadChange(root, changeRef.id)
    } catch {
      continue
    }
    const task = change.tasks.find((item) => item.id === id)
    if (task) {
      throw new RawspecError(
        'E_TASK_ARCHIVED',
        `Tarefa ${id} pertence à mudança arquivada ${change.id}`,
        { task: id, change: change.id, archivedChange: change.id },
      )
    }
  }

  throw new RawspecError('E_TASK_NOT_FOUND', `Tarefa não encontrada: ${id}`, { task: id })
}

/**
 * Descreve uma mudança para a saída JSON.
 *
 * @param {object} change mudança interpretada.
 * @returns {object} descrição serializável.
 */
export function describeChange(change) {
  return {
    id: change.id,
    path: change.path ?? change.dir,
    approved: isChangeApproved(change),
    proposalStatus: change.proposalStatus,
    designStatus: change.designStatus,
    tasksStatus: change.tasksStatus,
    legacySequential: Boolean(change.legacySequential),
  }
}

/**
 * Descreve uma tarefa para a saída JSON.
 *
 * @param {object} task tarefa interpretada.
 * @param {object} change mudança de origem.
 * @returns {object} descrição serializável.
 */
export function describeTask(task, change) {
  return {
    id: task.id,
    title: task.title,
    status: task.status,
    verification: task.verification,
    evidence: task.evidence,
    dependencies: task.dependencies,
    dependencySource: task.dependencySource,
    actionPlan: task.actionPlan,
    startedAt: task.startedAt,
    change: change?.id,
    file: task.file,
    startLine: task.startLine,
    endLine: task.endLine,
  }
}

/**
 * Verifica se a mudança está aprovada nos documentos exigidos.
 *
 * @param {object} change mudança interpretada.
 * @returns {boolean} `true` quando todos os documentos exigidos estão aprovados.
 */
export function isChangeApproved(change) {
  if (change.proposalStatus !== 'APPROVED') return false
  if (change.tasksStatus !== 'APPROVED') return false
  if (change.designStatus !== null && change.designStatus !== 'APPROVED') return false
  return true
}

/**
 * Valida a aprovação humana da mudança.
 *
 * @param {object} change mudança interpretada.
 * @throws {RawspecError} `E_CHANGE_NOT_APPROVED` quando a aprovação falta.
 */
export function validateChangeApproval(change) {
  if (isChangeApproved(change)) return change

  const missing = []
  if (change.proposalStatus !== 'APPROVED') {
    missing.push({ document: 'proposal.md', status: change.proposalStatus ?? null })
  }
  if (change.tasksStatus !== 'APPROVED') {
    missing.push({ document: 'tasks.md', status: change.tasksStatus ?? null })
  }
  if (change.designStatus !== null && change.designStatus !== 'APPROVED') {
    missing.push({ document: 'design.md', status: change.designStatus })
  }

  throw new RawspecError(
    'E_CHANGE_NOT_APPROVED',
    `Mudança ${change.id} não está aprovada: ${missing
      .map((item) => `${item.document}=${item.status ?? 'ausente'}`)
      .join(', ')}`,
    { change: change.id, missing },
  )
}

/**
 * Lista as tarefas abertas (`IN PROGRESS` ou `VERIFYING`) das mudanças ativas.
 *
 * @param {string} repoRoot raiz do repositório.
 * @param {object} [options] opções.
 * @param {string} [options.changeId] restringe a busca a uma mudança.
 * @returns {Array<object>} tarefas abertas com a mudança de origem.
 */
export function listOpenTasks(repoRoot, { changeId } = {}) {
  const root = repoRoot ?? findRepoRoot()
  const changes = changeId
    ? [resolveChange(root, changeId)].filter(
        (change) => !change.path.split(/[\\/]/).includes(ARCHIVE_DIRNAME),
      )
    : listActiveChanges(root)

  const open = []
  for (const changeRef of changes) {
    const change = loadChange(root, changeRef.id)
    for (const task of change.tasks) {
      if (task.status === 'IN PROGRESS' || task.status === 'VERIFYING') {
        open.push({ change, task })
      }
    }
  }
  return open.map(({ change, task }) => ({
    change: describeChange(change),
    task: describeTask(task, change),
  }))
}

/**
 * Lista as mudanças não arquivadas que possuem tarefas pendentes.
 *
 * @param {string} repoRoot raiz do repositório.
 * @returns {Array<object>} mudanças pendentes com a aprovação e as tarefas.
 */
export function listPendingChanges(repoRoot) {
  const root = repoRoot ?? findRepoRoot()
  const pending = []

  for (const changeRef of listActiveChanges(root)) {
    let change
    try {
      change = loadChange(root, changeRef.id)
    } catch (error) {
      if (error instanceof RawspecError && error.code === 'E_DEPENDENCY_UNDECLARED') {
        pending.push({
          id: changeRef.id,
          path: changeRef.path,
          approved: false,
          error: error.code,
          message: error.message,
          pendingTasks: [],
        })
        continue
      }
      throw error
    }
    const pendingTasks = change.tasks.filter((task) => task.status === 'PENDING')
    if (pendingTasks.length === 0) continue
    pending.push({
      id: change.id,
      path: change.path,
      approved: isChangeApproved(change),
      missing: missingApprovalFields(change),
      pendingTasks: pendingTasks.map((task) => describeTask(task, change)),
    })
  }
  return pending
}

/**
 * Lista os documentos que ainda não estão aprovados.
 *
 * @param {object} change mudança interpretada.
 * @returns {Array<object>} documentos pendentes de aprovação.
 */
function missingApprovalFields(change) {
  const missing = []
  if (change.proposalStatus !== 'APPROVED') {
    missing.push({ document: 'proposal.md', status: change.proposalStatus ?? null })
  }
  if (change.tasksStatus !== 'APPROVED') {
    missing.push({ document: 'tasks.md', status: change.tasksStatus ?? null })
  }
  if (change.designStatus !== null && change.designStatus !== 'APPROVED') {
    missing.push({ document: 'design.md', status: change.designStatus })
  }
  return missing
}

/**
 * Seleciona a próxima tarefa pendente.
 *
 * Não pula tarefas bloqueadas: quando a primeira `PENDING` tem dependência
 * pendente, o comando para e informa a pendência.
 *
 * @param {string} repoRoot raiz do repositório.
 * @param {object} [options] opções.
 * @param {string} [options.changeId] restringe a seleção a uma mudança.
 * @returns {object} tarefa selecionada com a mudança de origem.
 */
export function selectNextTask(repoRoot, { changeId } = {}) {
  const root = repoRoot ?? findRepoRoot()
  const pendingChanges = listPendingChanges(root).filter((change) => !change.error)

  if (pendingChanges.length === 0) {
    const notApproved = listPendingChanges(root).filter((change) => change.error)
    if (notApproved.length > 0) {
      throw new RawspecError(
        'E_CHANGE_NOT_APPROVED',
        `Nenhuma mudança aprovada com tarefa pendente: ${notApproved
          .map((change) => change.id)
          .join(', ')}`,
        { changes: notApproved.map((change) => ({ id: change.id, message: change.message })) },
      )
    }
    throw new RawspecError('E_NOTHING_TO_START', 'Nenhuma tarefa pendente para iniciar', {})
  }

  const scoped = changeId
    ? pendingChanges.filter((change) => change.id === resolveChange(root, changeId).id)
    : pendingChanges

  if (scoped.length === 0) {
    throw new RawspecError('E_NOTHING_TO_START', 'Nenhuma tarefa pendente para iniciar', {
      change: changeId,
    })
  }

  const approved = scoped.filter((change) => change.approved)
  if (approved.length === 0) {
    throw new RawspecError(
      'E_CHANGE_NOT_APPROVED',
      `Mudanças com pendências não aprovadas: ${scoped
        .map((change) => `${change.id} (${change.missing.map((item) => item.document).join(', ')})`)
        .join('; ')}`,
      {
        changes: scoped.map((change) => ({
          id: change.id,
          missing: change.missing,
        })),
      },
    )
  }

  if (approved.length > 1 && !changeId) {
    throw new RawspecError(
      'E_CHANGE_AMBIGUOUS',
      `Mais de uma mudança aprovada possui tarefa pendente: ${approved
        .map((change) => change.id)
        .join(', ')}`,
      {
        candidates: approved.map((change) => ({
          id: change.id,
          path: change.path,
          pendingTasks: change.pendingTasks,
        })),
      },
    )
  }

  const change = loadChange(root, approved[0].id)
  const task = change.tasks.find((item) => item.status === 'PENDING')
  if (!task) {
    throw new RawspecError('E_NOTHING_TO_START', 'Nenhuma tarefa pendente para iniciar', {
      change: change.id,
    })
  }

  validateChangeApproval(change)
  validateDependencies(task, change.tasks)

  return { change: describeChange(change), task: describeTask(task, change) }
}

/* -------------------------------------------------------------------------- */
/* TASK-008 — arquivamento por mudança.                                      */
/* -------------------------------------------------------------------------- */

/** Nome do arquivo de estado de arquivamento. */
export const ARCHIVE_STATE_FILE = 'archive-state.json'

/**
 * Verifica se um caminho é um link simbólico.
 *
 * @param {string} path caminho absoluto.
 * @returns {boolean} `true` quando é um link simbólico.
 */
function isSymbolicLink(path) {
  try {
    return statSync(path).isSymbolicLink()
  } catch {
    return false
  }
}

/**
 * Resolve o caminho real de um caminho, recusando links que escapam.
 *
 * @param {string} path caminho a resolver.
 * @param {string} root diretório raiz permitido.
 * @param {string} [label] rótulo usado na mensagem.
 * @returns {string} caminho resolvido.
 * @throws {RawspecError} `E_PATH_ESCAPE` quando o caminho escapa.
 */
export function resolveRealPath(path, root, label = 'caminho') {
  if (isSymbolicLink(path)) {
    throw new RawspecError('E_PATH_ESCAPE', `${label} é um link simbólico: ${path}`, {
      path,
      root,
    })
  }
  const resolved = resolve(path)
  if (!isInside(resolved, resolve(root))) {
    throw new RawspecError('E_PATH_ESCAPE', `${label} fora de ${root}: ${path}`, { path, root })
  }
  return resolved
}

/**
 * Constrói o manifesto de arquivos de uma mudança.
 *
 * @param {object} change mudança interpretada.
 * @returns {Array<string>} caminhos relativos ao diretório da mudança.
 */
export function buildArchiveManifest(change) {
  const files = []
  const walk = (directory, prefix) => {
    for (const entry of readdirSync(directory, { withFileTypes: true }).sort((a, b) =>
      a.name.localeCompare(b.name),
    )) {
      const full = join(directory, entry.name)
      if (entry.isSymbolicLink()) continue
      if (entry.isDirectory()) {
        walk(full, `${prefix}${entry.name}/`)
        continue
      }
      files.push(`${prefix}${entry.name}`)
    }
  }
  walk(change.dir, '')
  return files
}

/**
 * Inspeciona o estado Git dos caminhos do manifesto.
 *
 * @param {string} repoRoot raiz do repositório.
 * @param {Array<string>} paths caminhos relativos a inspecionar.
 * @returns {Array<{path: string, status: string}>} estado por caminho.
 */
export function inspectGitState(repoRoot, paths) {
  const entries = []
  for (const path of paths) {
    const output = runGit(repoRoot, ['status', '--porcelain', '--', path])
    for (const line of output.split(/\r?\n/).filter((item) => item.trim() !== '')) {
      entries.push({ path, status: line.slice(0, 2).trim() || line.trim(), raw: line })
    }
  }
  return entries
}

/**
 * Executa um comando Git, sem shell.
 *
 * @param {string} repoRoot raiz do repositório.
 * @param {Array<string>} args argumentos do Git.
 * @returns {string} saída padrão.
 */
function runGit(repoRoot, args) {
  const result = spawnSync('git', args, { cwd: repoRoot, encoding: 'utf8' })
  if (result.error) {
    throw new RawspecError(
      'E_GIT',
      `Falha ao executar git ${args.join(' ')}: ${result.error.message}`,
      {
        args,
      },
    )
  }
  if (result.status !== 0) {
    throw new RawspecError('E_GIT', `git ${args.join(' ')} falhou: ${result.stderr?.trim()}`, {
      args,
      status: result.status,
    })
  }
  return result.stdout ?? ''
}

/**
 * Verifica se o repositório tem um commit HEAD.
 *
 * @param {string} repoRoot raiz do repositório.
 * @returns {boolean} `true` quando existe algum commit.
 */
export function hasCommits(repoRoot) {
  const result = spawnSync('git', ['rev-parse', '--verify', 'HEAD'], {
    cwd: repoRoot,
    encoding: 'utf8',
  })
  return result.status === 0
}

/**
 * Lê o estado de arquivamento persistido.
 *
 * @param {string} changeDir diretório da mudança.
 * @returns {{change: string, state: string, destination: string, startedAt: string}|null} estado ou `null`.
 */
export function readArchiveState(changeDir) {
  const path = join(changeDir, ARCHIVE_STATE_FILE)
  if (!existsSync(path)) return null

  let parsed
  try {
    parsed = JSON.parse(readTextFile(path))
  } catch (error) {
    throw new RawspecError('E_ARCHIVE_STATE_UNKNOWN', `Arquivo de estado ilegível: ${path}`, {
      path,
      cause: error.message,
    })
  }
  if (!parsed || typeof parsed !== 'object' || !['ARCHIVING', 'ARCHIVED'].includes(parsed.state)) {
    throw new RawspecError('E_ARCHIVE_STATE_UNKNOWN', `Arquivo de estado inválido: ${path}`, {
      path,
    })
  }
  return parsed
}

/**
 * Grava o estado de arquivamento de forma atômica.
 *
 * @param {string} changeDir diretório da mudança.
 * @param {string} state `ARCHIVING` ou `ARCHIVED`.
 * @param {string} destination caminho de destino.
 * @returns {object} estado gravado.
 */
export function writeArchiveState(changeDir, state, destination) {
  const path = join(changeDir, ARCHIVE_STATE_FILE)
  const payload = {
    change: basename(changeDir),
    state,
    destination,
    startedAt: new Date().toISOString(),
  }
  writeFileAtomic(path, `${JSON.stringify(payload, null, 2)}\n`)
  return payload
}

/**
 * Lê os marcadores de arquivamento do `proposal.md`.
 *
 * @param {string} changeDir diretório da mudança.
 * @returns {{status: string|null, archivedAt: string|null, staging: string|null}} marcadores.
 */
export function readProposalArchiveMarkers(changeDir) {
  const path = join(changeDir, 'proposal.md')
  if (!existsSync(path)) return { status: null, archivedAt: null, staging: null }

  const text = readTextFile(path)
  const status = readDocumentStatus(text)
  const archivedAt = /^-?\s*\**Arquivada em\**:\s*(.+)$/m.exec(text)?.[1]?.trim() ?? null
  const staging = /^-?\s*\**Staging Git\**:\s*([A-Z]+)\s*$/m.exec(text)?.[1] ?? null
  return { status, archivedAt, staging }
}

/**
 * Localiza a linha de um marcador de arquivamento no cabeçalho do documento.
 *
 * Só linhas de campo são consideradas. O nome do campo é extraído da linha e
 * comparado com o nome procurado, para que menções em prosa — como
 * "com `Staging Git: DONE`" — nunca sejam tratadas como marcador.
 *
 * @param {string[]} lines linhas do documento.
 * @param {number} limit índice exclusivo de busca.
 * @param {string} fieldName nome do campo procurado.
 * @returns {number} índice da linha do marcador, ou `-1`.
 */
function findArchiveMarkerLine(lines, limit, fieldName) {
  const wanted = fieldName.toLowerCase()
  for (let index = 0; index < limit; index += 1) {
    const match = /^(?:-\s+)?(?:\*\*)?([^*:\n]+?)(?:\*\*)?:\s*(.*)$/.exec(lines[index])
    if (!match) continue
    if (match[1].trim().toLowerCase() !== wanted) continue
    return index
  }
  return -1
}

/**
 * Escreve os marcadores de arquivamento no `proposal.md`.
 *
 * Preserva a data já existente e não rebaixa um marcador `DONE` ou `SKIPPED`.
 *
 * @param {string} changeDir diretório da mudança.
 * @param {string} staging valor do marcador de staging.
 * @param {string} [date] data de arquivamento.
 * @returns {object} marcadores finais.
 */
export function writeProposalArchiveMarkers(changeDir, staging, date) {
  const path = join(changeDir, 'proposal.md')
  const original = readTextFile(path)
  const eol = detectEol(original)
  const lines = original.split(/\r?\n/)
  const existing = readProposalArchiveMarkers(changeDir)

  const finalDate = existing.archivedAt ?? date ?? new Date().toISOString().slice(0, 10)
  const finalStaging =
    existing.staging === 'DONE' || existing.staging === 'SKIPPED' ? existing.staging : staging

  // `Status` do documento: só o cabeçalho, antes do primeiro título `##`.
  const headerEnd = findHeaderEnd(lines)

  const statusLine = findArchiveMarkerLine(lines, headerEnd, 'Status')
  if (statusLine >= 0) {
    setFieldValue(lines, statusLine + 1, 'ARCHIVED')
  } else {
    lines.splice(headerEnd, 0, '- Status: ARCHIVED')
  }

  // Os marcadores de arquivamento são procurados no documento inteiro, sem
  // limite de seção, para que a escrita seja idempotente.
  const archivedAtLine = findArchiveMarkerLine(lines, lines.length, 'Arquivada em')
  if (archivedAtLine >= 0) {
    setFieldValue(lines, archivedAtLine + 1, finalDate)
  } else {
    lines.splice(findHeaderEnd(lines), 0, `- Arquivada em: ${finalDate}`)
  }

  const stagingLine = findArchiveMarkerLine(lines, lines.length, 'Staging Git')
  if (stagingLine >= 0) {
    setFieldValue(lines, stagingLine + 1, finalStaging)
  } else {
    lines.splice(findHeaderEnd(lines), 0, `- Staging Git: ${finalStaging}`)
  }

  writeFileAtomic(path, lines.join(eol))
  return { status: 'ARCHIVED', archivedAt: finalDate, staging: finalStaging }
}

/**
 * Localiza o fim do cabeçalho do documento.
 *
 * @param {string[]} lines linhas do documento.
 * @returns {number} índice da primeira linha de seção `##`, ou o total de linhas.
 */
function findHeaderEnd(lines) {
  const index = lines.findIndex((line) => /^##\s+/.test(line))
  return index === -1 ? lines.length : index
}

/**
 * Verifica as pré-condições de arquivamento de uma mudança.
 *
 * Todas as verificações são concluídas antes de qualquer movimentação.
 *
 * @param {object} change mudança interpretada.
 * @param {string} repoRoot raiz do repositório.
 * @returns {object} relatório das pendências.
 */
export function checkArchive(change, repoRoot) {
  const root = repoRoot ?? findRepoRoot()
  const changeDir = change.dir
  const destination = join(changesRoot(root), ARCHIVE_DIRNAME, change.id)
  const destinationExists = existsSync(destination)
  const sourceExists = existsSync(changeDir)

  const pendingTasks = change.tasks
    .filter((task) => task.status !== 'COMPLETED' || task.verification !== 'VERIFIED')
    .map((task) => ({
      id: task.id,
      title: task.title,
      status: task.status,
      verification: task.verification,
    }))

  const pendingPlans = checkActionPlans(change)

  let state = null
  let stateError = null
  try {
    state = readArchiveState(sourceExists ? changeDir : destination)
  } catch (error) {
    stateError = error
  }

  const markers = sourceExists
    ? readProposalArchiveMarkers(changeDir)
    : readProposalArchiveMarkers(destination)

  return {
    change: describeChange(change),
    source: relative(root, changeDir).split('\\').join('/'),
    destination: relative(root, destination).split('\\').join('/'),
    sourceExists,
    destinationExists,
    alreadyMoved: !sourceExists && destinationExists,
    pendingTasks,
    pendingPlans,
    approvalMissing: isChangeApproved(change) ? [] : missingApprovalFields(change),
    archiveState: state,
    archiveStateError: stateError ? stateError.code : null,
    markers,
    eligible:
      pendingTasks.length === 0 &&
      pendingPlans.length === 0 &&
      isChangeApproved(change) &&
      !stateError,
  }
}

/**
 * Executa o arquivamento de uma mudança.
 *
 * @param {object} changeRef referência da mudança.
 * @param {object} [options] opções.
 * @param {boolean} [options.stage] autoriza o staging dos caminhos exatos.
 * @returns {object} resultado do arquivamento.
 */
export function archiveChange(changeRef, { stage = true } = {}) {
  const repoRoot = changeRef.repoRoot ?? findRepoRoot()
  const changeId = typeof changeRef === 'string' ? changeRef : changeRef.changeId
  const root = changesRoot(repoRoot)

  // A origem e o destino são resolvidos de forma independente, para que a
  // presença do destino nunca confunda a detecção de um arquivamento já movido.
  const canonicalId = resolveArchiveChangeId(repoRoot, changeId)
  const sourceDir = join(root, canonicalId)
  const destination = join(root, ARCHIVE_DIRNAME, canonicalId)

  const sourceExists = existsSync(sourceDir)
  const destinationExists = existsSync(destination)

  // Recuperação: destino já existe e a origem não. Nunca mover de novo.
  if (!sourceExists && destinationExists) {
    return recoverArchive(repoRoot, canonicalId, destination)
  }

  if (sourceExists && destinationExists) {
    throw new RawspecError(
      'E_ARCHIVE_DESTINATION_EXISTS',
      `Destino já existe: ${relative(repoRoot, destination).split('\\').join('/')}`,
      { destination: relative(repoRoot, destination).split('\\').join('/') },
    )
  }

  if (!sourceExists) {
    throw new RawspecError('E_CHANGE_NOT_FOUND', `Mudança não encontrada: ${changeId}`, {
      value: changeId,
    })
  }

  const change = loadChange(repoRoot, canonicalId)

  // 1. Aprova��ão.
  validateChangeApproval(change)

  // 2. Tarefas.
  if (change.tasks.length === 0) {
    throw new RawspecError('E_ARCHIVE_PENDING_TASKS', `Mudança ${change.id} não possui tarefas`, {
      change: change.id,
    })
  }
  const pendingTasks = change.tasks.filter(
    (task) => task.status !== 'COMPLETED' || task.verification !== 'VERIFIED',
  )
  if (pendingTasks.length > 0) {
    throw new RawspecError(
      'E_ARCHIVE_PENDING_TASKS',
      `Mudança ${change.id} tem tarefas não concluídas: ${pendingTasks
        .map((task) => `${task.id} (${task.status}/${task.verification})`)
        .join(', ')}`,
      {
        change: change.id,
        pendingTasks: pendingTasks.map((task) => ({
          id: task.id,
          status: task.status,
          verification: task.verification,
        })),
      },
    )
  }

  // 3. Planos de ação.
  const pendingPlans = checkActionPlans(change)
  if (pendingPlans.length > 0) {
    throw new RawspecError(
      'E_ACTION_PLAN_PENDING',
      `Mudança ${change.id} tem planos de ação não resolvidos: ${pendingPlans
        .map((plan) => `${plan.relative} (${plan.status})`)
        .join(', ')}`,
      {
        change: change.id,
        plans: pendingPlans.map((plan) => ({ path: plan.relative, status: plan.status })),
      },
    )
  }

  // 4. Confinamento de caminhos.
  resolveRealPath(sourceDir, root, 'origem')
  resolveRealPath(destination, root, 'destino')
  if (resolve(destination) !== resolve(join(root, ARCHIVE_DIRNAME, change.id))) {
    throw new RawspecError('E_PATH_ESCAPE', 'Destino fora de specs/changes/archive/', {
      destination,
    })
  }

  // 5. Estado Git inspecionado antes de mover.
  const sourceManifest = buildArchiveManifest(change)
  const sourcePrefix = `specs/changes/${change.id}`
  const destinationRelative = relative(repoRoot, destination).split('\\').join('/')
  const gitState = inspectGitState(repoRoot, [
    ...sourceManifest.map((path) => `${sourcePrefix}/${path}`),
    destinationRelative,
  ])
  const trackedDirty = gitState.filter((entry) => entry.status !== '??')
  if (trackedDirty.length > 0) {
    throw new RawspecError(
      'E_GIT_DIRTY',
      `Caminhos do manifesto têm alterações rastreadas preexistentes: ${trackedDirty
        .map((entry) => entry.path)
        .join(', ')}`,
      { entries: trackedDirty },
    )
  }

  // 6. O manifesto inclui o archive-state.json que será criado no destino.
  const manifest = [
    ...sourceManifest.map((path) => `${destinationRelative}/${path}`),
    `${destinationRelative}/${ARCHIVE_STATE_FILE}`,
  ]

  // 7. Marcação write-ahead antes do rename.
  writeArchiveState(sourceDir, 'ARCHIVING', destinationRelative)

  // 8. Rename atômico.
  try {
    mkdirSync(join(root, ARCHIVE_DIRNAME), { recursive: true })
    renameSync(sourceDir, destination)
  } catch (error) {
    rmSync(join(sourceDir, ARCHIVE_STATE_FILE), { force: true })
    throw new RawspecError('E_ARCHIVE_MOVE_FAILED', `Falha ao mover a mudança: ${error.message}`, {
      cause: error.message,
    })
  }

  // 9. Marcadores: proposal.md primeiro, archive-state.json depois.
  const finalStaging = stage ? 'PENDING' : 'SKIPPED'
  writeProposalArchiveMarkers(destination, finalStaging)
  writeArchiveState(destination, 'ARCHIVED', destinationRelative)

  // 10. Staging dos caminhos exatos.
  const stagingResult = stage
    ? stageArchive(repoRoot, manifest, destination, change.id)
    : { staged: [], status: 'SKIPPED' }

  return {
    change: describeChange(change),
    destination: destinationRelative,
    manifest,
    staging: stagingResult,
    moved: true,
  }
}

/**
 * Resolve o identificador canônico de uma mudança para arquivamento.
 *
 * @param {string} repoRoot raiz do repositório.
 * @param {string} changeRef identificador informado.
 * @returns {string} identificador canônico, por exemplo `003-exemplo`.
 */
function resolveArchiveChangeId(repoRoot, changeRef) {
  const active = listActiveChanges(repoRoot)
  const archived = listArchivedChanges(repoRoot)
  const all = [...active, ...archived]

  if (all.length === 0) {
    throw new RawspecError('E_CHANGE_NOT_FOUND', `Nenhuma mudança encontrada em ${repoRoot}`, {
      value: changeRef,
    })
  }

  try {
    return normalizeChangeId(
      changeRef,
      all.map((change) => ({ id: change.id, name: change.id })),
    )
  } catch (error) {
    if (error instanceof RawspecError && error.code === 'E_ARGS') {
      throw new RawspecError('E_CHANGE_NOT_FOUND', `Mudança não encontrada: ${changeRef}`, {
        value: changeRef,
        candidates: all.map((change) => change.id),
      })
    }
    throw error
  }
}

/**
 * Recupera um arquivamento interrompido ou já movido.
 *
 * @param {string} repoRoot raiz do repositório.
 * @param {object} changeRefResolved mudança resolvida.
 * @param {string} destination caminho absoluto do destino.
 * @returns {object} resultado da recuperação.
 */
export function recoverArchive(repoRoot, changeId, destination) {
  const root = changesRoot(repoRoot)
  let state
  try {
    state = readArchiveState(destination)
  } catch (error) {
    throw new RawspecError('E_ARCHIVE_STATE_UNKNOWN', error.message, { path: destination })
  }

  const markers = readProposalArchiveMarkers(destination)

  if (!state && markers.status !== 'ARCHIVED') {
    throw new RawspecError(
      'E_ARCHIVE_STATE_UNKNOWN',
      `Destino existe sem archive-state.json e sem Status: ARCHIVED: ${relative(
        repoRoot,
        destination,
      )
        .split('\\')
        .join('/')}`,
      { destination: relative(repoRoot, destination).split('\\').join('/') },
    )
  }

  // Completa os dois marcadores, proposal.md primeiro.
  const staging = markers.staging ?? 'PENDING'
  writeProposalArchiveMarkers(destination, staging)
  writeArchiveState(destination, 'ARCHIVED', relative(repoRoot, destination).split('\\').join('/'))

  const change = parseChange(destination)
  const destinationRelative = relative(repoRoot, destination).split('\\').join('/')
  const manifest = buildArchiveManifest(change).map((path) => `${destinationRelative}/${path}`)
  const finalMarkers = readProposalArchiveMarkers(destination)

  if (finalMarkers.staging === 'SKIPPED') {
    return {
      change: describeChange(change),
      destination: destinationRelative,
      manifest,
      staging: { staged: [], status: 'SKIPPED' },
      moved: false,
      recovered: true,
    }
  }

  const stagingResult = stageArchive(repoRoot, manifest, destination, change.id)
  return {
    change: describeChange(change),
    destination: destinationRelative,
    manifest,
    staging: stagingResult,
    moved: false,
    recovered: true,
  }
}

/**
 * Executa `git add` nos caminhos exatos do manifesto e verifica a convergência.
 *
 * @param {string} repoRoot raiz do repositório.
 * @param {Array<string>} manifest caminhos relativos.
 * @param {string} destination diretório de destino.
 * @param {string} changeId identificador da mudança.
 * @returns {object} resultado do staging.
 */
export function stageArchive(repoRoot, manifest, destination, changeId) {
  const relativeDestination = relative(repoRoot, destination).split('\\').join('/')
  const sourcePrefix = `specs/changes/${changeId}`

  const paths = [...manifest]
  // Caminhos de origem rastreados precisam registrar a remoção.
  const trackedSource = runGit(repoRoot, ['ls-files', '--', sourcePrefix])
  for (const line of trackedSource.split(/\r?\n/).filter((item) => item.trim() !== '')) {
    if (!paths.includes(line)) paths.push(line)
  }

  const staged = []
  for (const path of paths) {
    try {
      runGit(repoRoot, ['add', '--', path])
      staged.push(path)
    } catch (error) {
      writeProposalArchiveMarkers(destination, 'FAILED')
      throw new RawspecError('E_GIT_ADD_FAILED', `Falha no git add de ${path}: ${error.message}`, {
        path,
        cause: error.message,
      })
    }
  }

  // O marcador final é gravado antes do re-staging, para que a versão final
  // do proposal.md, com `Staging Git: DONE`, seja a que entra no índice.
  writeProposalArchiveMarkers(destination, 'DONE')

  // Re-stagia o caminho exato do proposal.md final.
  const proposalPath = `${relativeDestination}/proposal.md`
  try {
    runGit(repoRoot, ['add', '--', proposalPath])
  } catch (error) {
    writeProposalArchiveMarkers(destination, 'FAILED')
    throw new RawspecError(
      'E_GIT_ADD_FAILED',
      `Falha no git add de ${proposalPath}: ${error.message}`,
      { path: proposalPath, cause: error.message },
    )
  }

  const convergence = verifyStagedState(repoRoot, manifest, proposalPath)
  if (!convergence.ok) {
    writeProposalArchiveMarkers(destination, 'FAILED')
    throw new RawspecError(
      'E_GIT_ADD_FAILED',
      `Staging não convergiu: ${convergence.missing.join(', ')}`,
      { missing: convergence.missing },
    )
  }

  return { staged, status: 'DONE', proposalPath }
}

/**
 * Verifica a convergência do staging contra o índice Git.
 *
 * @param {string} repoRoot raiz do repositório.
 * @param {Array<string>} manifest caminhos relativos.
 * @param {string} proposalPath caminho do `proposal.md` arquivado.
 * @returns {{ok: boolean, missing: Array<string>}} resultado da verificação.
 */
export function verifyStagedState(repoRoot, manifest, proposalPath) {
  const missing = []
  const indexed = runGit(repoRoot, ['diff', '--cached', '--name-only'])
  const indexedPaths = new Set(indexed.split(/\r?\n/).filter((item) => item.trim() !== ''))

  for (const path of manifest) {
    if (!indexedPaths.has(path)) missing.push(path)
  }

  let proposalContent = ''
  try {
    const result = spawnSync('git', ['show', `:${proposalPath}`], {
      cwd: repoRoot,
      encoding: 'utf8',
    })
    proposalContent = result.stdout ?? ''
  } catch {
    proposalContent = ''
  }

  if (!proposalContent.includes('Status: ARCHIVED')) missing.push(`${proposalPath} (Status)`)
  if (!proposalContent.includes('Staging Git: DONE')) missing.push(`${proposalPath} (Staging)`)

  return { ok: missing.length === 0, missing }
}

/**
 * Detecta o final de linha predominante em um texto.
 *
 * @param {string} text conteúdo do arquivo.
 * @returns {string} `'\r\n'` ou `'\n'`.
 */
function detectEol(text) {
  return text.includes('\r\n') ? '\r\n' : '\n'
}

/**
 * Escreve um arquivo de forma atômica.
 *
 * Grava em arquivo temporário no mesmo diretório e renomeia por cima.
 *
 * @param {string} filePath caminho absoluto do arquivo.
 * @param {string} content conteúdo final.
 */
export function writeFileAtomic(filePath, content) {
  const directory = filePath.slice(
    0,
    Math.max(filePath.lastIndexOf('\\'), filePath.lastIndexOf('/')),
  )
  const temporary = join(directory, `.${basename(filePath)}.tmp-${process.pid}-${Date.now()}`)

  try {
    writeFileSync(temporary, content, 'utf8')
    renameSync(temporary, filePath)
  } catch (error) {
    rmSync(temporary, { force: true })
    throw new RawspecError('E_IO', `Falha ao gravar ${filePath}: ${error.message}`, {
      file: filePath,
    })
  }
}

/**
 * Localiza a linha de um campo dentro do corpo de uma tarefa.
 *
 * @param {string[]} lines linhas do arquivo.
 * @param {number} startLine primeira linha da tarefa.
 * @param {number} endLine última linha da tarefa.
 * @param {string} name nome do campo.
 * @returns {number|null} número da linha ou `null`.
 */
function findFieldLine(lines, startLine, endLine, name) {
  for (let index = startLine - 1; index < endLine; index += 1) {
    const text = lines[index] ?? ''
    const field = FIELD_PATTERN.exec(text) ?? PLAIN_FIELD_PATTERN.exec(text)
    if (!field) continue
    if (field[1].trim().toLowerCase() !== name.toLowerCase()) continue
    return index + 1
  }
  return null
}

/**
 * Substitui o valor de um campo preservando o restante do arquivo.
 *
 * @param {string[]} lines linhas do arquivo.
 * @param {number} line número da linha do campo.
 * @param {string} value novo valor.
 */
function setFieldValue(lines, line, value) {
  const text = lines[line - 1]
  const bold = FIELD_PATTERN.exec(text)
  if (bold) {
    lines[line - 1] = text.replace(/(\*\*[^*]+:\*\*).*$/, `$1 ${value}`)
    return
  }
  const plain = PLAIN_FIELD_PATTERN.exec(text)
  if (plain) {
    const prefix = text.startsWith('-') ? '- ' : ''
    lines[line - 1] = `${prefix}${plain[1].trim()}: ${value}`
  }
}

/**
 * Insere um campo novo logo após o cabeçalho da tarefa.
 *
 * @param {string[]} lines linhas do arquivo.
 * @param {number} startLine linha do cabeçalho da tarefa.
 * @param {string} name nome do campo.
 * @param {string} value valor do campo.
 */
function insertField(lines, startLine, name, value) {
  lines.splice(startLine, 0, `- **${name}:** ${value}`)
}

/**
 * Aplica uma mutação pontual em um `tasks.md`, preservando o resto do arquivo.
 *
 * @param {object} change mudança interpretada.
 * @param {object} task tarefa alvo.
 * @param {(lines: string[], eol: string) => void} mutate mutação aplicada.
 */
function mutateTasksFile(change, task, mutate) {
  const original = readTextFile(task.file)
  const eol = detectEol(original)
  const lines = original.split(/\r?\n/)

  try {
    mutate(lines, eol)
    writeFileAtomic(task.file, lines.join(eol))
  } catch (error) {
    // Restaura o conteúdo original quando a escrita falha.
    try {
      writeFileAtomic(task.file, original)
    } catch {
      // A restauração é best effort; o erro original é propagado.
    }
    throw error
  }
  void change
}

/**
 * Recarrega a tarefa depois de uma escrita.
 *
 * @param {object} change mudança interpretada.
 * @param {string} taskId identificador da tarefa.
 * @returns {object} tarefa relida.
 */
function reloadTask(change, taskId) {
  const updated = parseChange(change.dir)
  applyDependencyPolicy(updated)
  const task = updated.tasks.find((item) => item.id === taskId)
  if (!task) {
    throw new RawspecError('E_TASK_NOT_FOUND', `Tarefa não encontrada após escrita: ${taskId}`, {
      task: taskId,
    })
  }
  return task
}

/**
 * Inicia uma tarefa `PENDING`, movendo-a para `IN PROGRESS`.
 *
 * @param {object} taskRef referência da tarefa, com `repoRoot` e `changeId`.
 * @returns {object} tarefa atualizada.
 */
export function startTask(taskRef) {
  const { change, task } = resolveTask(taskRef.taskId, taskRef)
  validateChangeApproval(change)
  validateDependencies(task, loadChange(taskRef.repoRoot ?? findRepoRoot(), change.id).tasks)

  if (task.status === 'IN PROGRESS' || task.status === 'VERIFYING') {
    throw new RawspecError(
      'E_TASK_STATE',
      `Tarefa ${task.id} já está ${task.status}; use /continuespec ${task.id}`,
      { task: task.id, status: task.status },
    )
  }
  if (task.status === 'COMPLETED') {
    throw new RawspecError(
      'E_TASK_STATE',
      `Tarefa ${task.id} já está concluída; use /continuespec ${task.id}`,
      { task: task.id, status: task.status },
    )
  }
  if (task.status !== 'PENDING') {
    throw new RawspecError('E_TASK_STATE', `Transição inválida a partir de ${task.status}`, {
      task: task.id,
      status: task.status,
    })
  }

  const date = new Date().toISOString().slice(0, 10)
  const changeModel = loadChange(taskRef.repoRoot ?? findRepoRoot(), change.id)

  mutateTasksFile(changeModel, task, (lines) => {
    const statusLine = findFieldLine(lines, task.startLine, task.endLine, 'Status')
    if (statusLine) setFieldValue(lines, statusLine, 'IN PROGRESS')
    else insertField(lines, task.startLine + 1, 'Status', 'IN PROGRESS')

    const startLine = findFieldLine(lines, task.startLine, task.endLine, 'Início')
    if (startLine) setFieldValue(lines, startLine, date)
    else insertField(lines, task.startLine + 1, 'Início', date)
  })

  const updated = reloadTask(changeModel, task.id)
  return { change: describeChange(changeModel), task: describeTask(updated, changeModel) }
}

/**
 * Move uma tarefa `IN PROGRESS` para `VERIFYING`.
 *
 * @param {object} taskRef referência da tarefa.
 * @returns {object} tarefa atualizada.
 */
export function beginVerification(taskRef) {
  const { change, task } = resolveTask(taskRef.taskId, taskRef)
  validateChangeApproval(change)

  if (task.status !== 'IN PROGRESS') {
    throw new RawspecError(
      'E_TASK_STATE',
      `Tarefa ${task.id} está ${task.status}; a verificação exige IN PROGRESS`,
      { task: task.id, status: task.status },
    )
  }

  const changeModel = loadChange(taskRef.repoRoot ?? findRepoRoot(), change.id)
  mutateTasksFile(changeModel, task, (lines) => {
    const statusLine = findFieldLine(lines, task.startLine, task.endLine, 'Status')
    if (statusLine) setFieldValue(lines, statusLine, 'VERIFYING')
    else insertField(lines, task.startLine + 1, 'Status', 'VERIFYING')
  })

  const updated = reloadTask(changeModel, task.id)
  return { change: describeChange(changeModel), task: describeTask(updated, changeModel) }
}

/**
 * Conclui uma tarefa `VERIFYING`, exigindo evidência.
 *
 * @param {object} taskRef referência da tarefa.
 * @param {string} evidence evidência das verificações executadas.
 * @returns {object} tarefa atualizada.
 */
export function verifyTask(taskRef, evidence) {
  const { change, task } = resolveTask(taskRef.taskId, taskRef)
  validateChangeApproval(change)

  const text = typeof evidence === 'string' ? evidence.trim() : ''
  if (text === '') {
    throw new RawspecError(
      'E_EVIDENCE_REQUIRED',
      `Evidência obrigatória para concluir ${task.id}`,
      {
        task: task.id,
      },
    )
  }

  if (task.status !== 'VERIFYING') {
    throw new RawspecError(
      'E_TASK_STATE',
      `Tarefa ${task.id} está ${task.status}; a conclusão exige VERIFYING`,
      { task: task.id, status: task.status },
    )
  }

  const changeModel = loadChange(taskRef.repoRoot ?? findRepoRoot(), change.id)
  const date = new Date().toISOString().slice(0, 10)

  mutateTasksFile(changeModel, task, (lines) => {
    const statusLine = findFieldLine(lines, task.startLine, task.endLine, 'Status')
    if (statusLine) setFieldValue(lines, statusLine, 'COMPLETED')
    else insertField(lines, task.startLine + 1, 'Status', 'COMPLETED')

    const verificationLine = findFieldLine(lines, task.startLine, task.endLine, 'Verificação')
    const value = `VERIFIED (${date}) — ${text}`
    if (verificationLine) setFieldValue(lines, verificationLine, value)
    else insertField(lines, task.startLine + 1, 'Verificação', value)
  })

  const updated = reloadTask(changeModel, task.id)
  return { change: describeChange(changeModel), task: describeTask(updated, changeModel) }
}

/**
 * Registra falha de verificação, mantendo a tarefa aberta.
 *
 * @param {object} taskRef referência da tarefa.
 * @param {string} evidence motivo da falha.
 * @returns {object} tarefa atualizada.
 */
export function failTask(taskRef, evidence) {
  const { change, task } = resolveTask(taskRef.taskId, taskRef)
  validateChangeApproval(change)

  const text = typeof evidence === 'string' ? evidence.trim() : ''
  if (text === '') {
    throw new RawspecError('E_EVIDENCE_REQUIRED', `Motivo obrigatório para registrar a falha`, {
      task: task.id,
    })
  }

  if (task.status !== 'VERIFYING') {
    throw new RawspecError(
      'E_TASK_STATE',
      `Tarefa ${task.id} está ${task.status}; a falha de verificação exige VERIFYING`,
      { task: task.id, status: task.status },
    )
  }

  const changeModel = loadChange(taskRef.repoRoot ?? findRepoRoot(), change.id)
  const date = new Date().toISOString().slice(0, 10)

  mutateTasksFile(changeModel, task, (lines) => {
    const statusLine = findFieldLine(lines, task.startLine, task.endLine, 'Status')
    if (statusLine) setFieldValue(lines, statusLine, 'IN PROGRESS')
    else insertField(lines, task.startLine + 1, 'Status', 'IN PROGRESS')

    const verificationLine = findFieldLine(lines, task.startLine, task.endLine, 'Verificação')
    const value = `FAILED (${date}) — ${text}`
    if (verificationLine) setFieldValue(lines, verificationLine, value)
    else insertField(lines, task.startLine + 1, 'Verificação', value)
  })

  const updated = reloadTask(changeModel, task.id)
  return { change: describeChange(changeModel), task: describeTask(updated, changeModel) }
}

/* -------------------------------------------------------------------------- */
/* TASK-007 — mensagem de commit e planos de ação.                           */
/* -------------------------------------------------------------------------- */

/** Tipos aceitos na mensagem de commit. */
export const COMMIT_TYPES = Object.freeze([
  'feat',
  'fix',
  'refactor',
  'test',
  'docs',
  'chore',
  'build',
])

/** Status possíveis de um plano de ação. */
export const ACTION_PLAN_STATUSES = Object.freeze([
  'PENDING ACCEPTANCE',
  'ACCEPTED',
  'IN EXECUTION',
  'RESOLVED',
  'REJECTED',
])

/**
 * Lê o status de um plano de ação.
 *
 * @param {string} planPath caminho absoluto do plano.
 * @returns {{status: string, path: string, content: string}} plano interpretado.
 */
export function readActionPlan(planPath) {
  const content = readTextFile(planPath)
  const status = readDocumentStatus(content)
  if (!status || !ACTION_PLAN_STATUSES.includes(status)) {
    throw new RawspecError('E_PARSE', `Plano de ação com status inválido ou ausente: ${planPath}`, {
      file: planPath,
      status: status ?? null,
    })
  }
  return { status, path: planPath, content }
}

/**
 * Localiza os planos de ação de uma mudança.
 *
 * @param {object} change mudança interpretada.
 * @returns {Array<string>} caminhos absolutos dos planos.
 */
export function listActionPlanPaths(change) {
  const directory = join(change.dir, 'action-plans')
  if (!existsSync(directory)) return []
  return readdirSync(directory)
    .filter((name) => name.endsWith('.md'))
    .sort()
    .map((name) => join(directory, name))
}

/**
 * Lista os planos de ação não resolvidos de uma mudança.
 *
 * @param {object} change mudança interpretada.
 * @returns {Array<{status: string, path: string, relative: string, task: string|null}>} planos pendentes.
 */
export function checkActionPlans(change) {
  const pending = []
  for (const path of listActionPlanPaths(change)) {
    const plan = readActionPlan(path)
    if (plan.status !== 'RESOLVED') {
      pending.push({
        status: plan.status,
        path,
        relative: relative(change.dir, path).split('\\').join('/'),
        task: readActionPlanTask(plan.content),
      })
    }
  }
  return pending
}

/**
 * Lê a tarefa associada a um plano de ação.
 *
 * @param {string} content conteúdo do plano.
 * @returns {string|null} identificador da tarefa ou `null`.
 */
function readActionPlanTask(content) {
  const match = /^-?\s*\**Task\**:\s*(TASK-\d+)\s*$/im.exec(content)
  return match ? match[1] : null
}

/**
 * Cria o esqueleto de um plano de ação em `PENDING ACCEPTANCE`.
 *
 * @param {object} taskRef referência da tarefa.
 * @param {object} payload conteúdo do plano.
 * @returns {object} plano criado.
 */
export function createActionPlan(taskRef, payload = {}) {
  const { change, task } = resolveTask(taskRef.taskId, taskRef)
  const repoRoot = taskRef.repoRoot ?? findRepoRoot()
  const changeModel = loadChange(repoRoot, change.id)

  const directory = join(changeModel.dir, 'action-plans')
  const root = changesRoot(repoRoot)
  if (!isInside(resolve(directory), root)) {
    throw new RawspecError('E_PATH_ESCAPE', `Plano de ação fora de ${CHANGES_DIRNAME}`, {
      directory,
    })
  }

  const slug = String(payload.slug ?? 'action-plan')
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
  const date = new Date().toISOString().slice(0, 10)
  const fileName = `${task.id}-${date}-${slug}.md`
  const planPath = join(directory, fileName)

  if (existsSync(planPath)) {
    throw new RawspecError('E_ACTION_PLAN_EXISTS', `Plano de ação já existe: ${fileName}`, {
      path: planPath,
    })
  }

  const severity = payload.severity ?? 'MEDIA'
  const origin = payload.origin ?? 'Identificado durante a execução da tarefa.'
  const content = [
    `# Plano de Ação — ${task.id} — ${task.title}`,
    '',
    `- Status: PENDING ACCEPTANCE`,
    `- Change: ${changeModel.id}`,
    `- Task: ${task.id}`,
    `- Data: ${date}`,
    `- Severidade: ${severity}`,
    `- Origem: ${origin}`,
    '',
    '## 1. Problema ou risco',
    payload.problem ?? 'A preencher.',
    '',
    '## 2. Impacto se não tratado',
    payload.impact ?? 'A preencher.',
    '',
    '## 3. Evidências',
    payload.evidence ?? 'A preencher.',
    '',
    '## 4. Opções consideradas',
    payload.options ?? 'A preencher.',
    '',
    '## 5. Ação recomendada',
    payload.recommendation ?? 'A preencher.',
    '',
    '## 6. Passos de execução',
    payload.steps ?? 'A preencher.',
    '',
    '## 7. Validação',
    payload.validation ?? 'A preencher.',
    '',
    '## 8. Rollback',
    payload.rollback ?? 'A preencher.',
    '',
    '## 9. Critérios de aceite',
    payload.acceptance ?? 'A preencher.',
    '',
    '## 10. Aprovação',
    '- Decisão:',
    '- Data:',
    '- Observações:',
    '',
  ].join('\n')

  if (!existsSync(directory)) {
    mkdirSync(directory, { recursive: true })
  }
  writeFileAtomic(planPath, content)

  // Registra o caminho do plano na tarefa.
  mutateTasksFile(changeModel, task, (lines) => {
    const relativePath = relative(repoRoot, planPath).split('\\').join('/')
    const planLine = findFieldLine(lines, task.startLine, task.endLine, 'Plano de ação')
    if (planLine) setFieldValue(lines, planLine, relativePath)
    else insertField(lines, task.startLine + 1, 'Plano de ação', relativePath)
  })

  return {
    change: describeChange(changeModel),
    task: describeTask(reloadTask(changeModel, task.id), changeModel),
    plan: {
      status: 'PENDING ACCEPTANCE',
      path: planPath,
      relative: relative(repoRoot, planPath).split('\\').join('/'),
    },
  }
}

/**
 * Marca um plano de ação como `RESOLVED`.
 *
 * @param {string} planPath caminho do plano.
 * @param {string} evidence evidência da resolução.
 * @returns {object} plano atualizado.
 */
export function resolveActionPlan(planPath, evidence) {
  const resolved = resolve(planPath)
  const plan = readActionPlan(resolved)
  const text = typeof evidence === 'string' ? evidence.trim() : ''
  if (text === '') {
    throw new RawspecError('E_EVIDENCE_REQUIRED', 'Evidência obrigatória para resolver o plano', {
      path: resolved,
    })
  }

  const eol = detectEol(plan.content)
  const lines = plan.content.split(/\r?\n/)
  const statusLine = findFieldLine(lines, 1, lines.length, 'Status')
  if (statusLine) {
    setFieldValue(lines, statusLine, 'RESOLVED')
  }
  const resolutionLine = lines.findIndex((line) =>
    /^-?\s*\*?\*?(Resolvido|Resolução)\b/i.test(line),
  )
  if (resolutionLine >= 0) {
    setFieldValue(lines, resolutionLine + 1, text)
  } else {
    lines.splice(Math.max(1, lines.length - 1), 0, `- **Resolvido:** ${text}`, '')
  }
  writeFileAtomic(resolved, lines.join(eol))

  return { status: 'RESOLVED', path: resolved, evidence: text }
}

/**
 * Gera a mensagem de commit de uma tarefa concluída.
 *
 * @param {object} taskRef referência da tarefa.
 * @returns {object} mensagem de commit.
 */
export function buildCommitMessage(taskRef) {
  const { change, task } = resolveTask(taskRef.taskId, taskRef)
  const repoRoot = taskRef.repoRoot ?? findRepoRoot()
  const changeModel = loadChange(repoRoot, change.id)

  if (task.status !== 'COMPLETED' || task.verification !== 'VERIFIED') {
    throw new RawspecError(
      'E_COMMIT_MESSAGE_BLOCKED',
      `Tarefa ${task.id} não está concluída e verificada (${task.status} / ${task.verification})`,
      { task: task.id, status: task.status, verification: task.verification },
    )
  }

  const pendingPlans = checkActionPlans(changeModel).filter(
    (plan) => plan.task === task.id || plan.task === null,
  )
  const taskPlan = pendingPlans[0]
  if (taskPlan) {
    throw new RawspecError(
      'E_ACTION_PLAN_UNRESOLVED',
      `Tarefa ${task.id} tem plano de ação não resolvido (${taskPlan.status})`,
      { task: task.id, plan: taskPlan.relative, status: taskPlan.status },
    )
  }

  const resolvedPlan = listActionPlanPaths(changeModel)
    .map((path) => readActionPlan(path))
    .filter((plan) => plan.status === 'RESOLVED')
    .map((plan) => relative(repoRoot, plan.path).split('\\').join('/'))

  const type = taskRef.type ?? 'feat'
  if (!COMMIT_TYPES.includes(type)) {
    throw new RawspecError('E_ARGS', `Tipo de commit inválido: ${type}`, { value: type })
  }
  const scope = taskRef.scope ?? 'rawspec'
  const summary = taskRef.summary ?? task.title.toLowerCase()

  const message = [
    `${type}(${scope}): ${summary}`,
    '',
    `Change: ${changeModel.id}`,
    `Task: ${task.id}`,
    `Tests: ${taskRef.tests ?? 'nenhuma verificação registrada'}`,
    `Evidence: ${task.evidence ?? 'não registrada'}`,
    `Action-Plan: ${resolvedPlan.length > 0 ? resolvedPlan.join(', ') : 'none'}`,
    '',
  ].join('\n')

  return {
    change: describeChange(changeModel),
    task: describeTask(task, changeModel),
    message,
    type,
    scope,
    summary,
  }
}

/* -------------------------------------------------------------------------- */
/* TASK-009 — interface de linha de comando.                                  */
/* -------------------------------------------------------------------------- */

export { TASK_ID_PATTERN }

/**
 * Códigos de saída por categoria de erro.
 */
const EXIT_CODES = {
  E_ARGS: 2,
  E_TASK_NOT_FOUND: 3,
  E_CHANGE_NOT_FOUND: 3,
  E_TASK_AMBIGUOUS: 4,
  E_CHANGE_AMBIGUOUS: 4,
  E_CHANGE_NOT_APPROVED: 5,
  E_DEPENDENCY_PENDING: 5,
  E_DEPENDENCY_CYCLE: 5,
  E_DEPENDENCY_UNKNOWN: 5,
  E_DEPENDENCY_UNDECLARED: 5,
  E_TASK_STATE: 5,
  E_EVIDENCE_REQUIRED: 5,
  E_NOTHING_TO_START: 5,
  E_NO_OPEN_TASK: 5,
  E_ACTION_PLAN_UNRESOLVED: 5,
  E_ACTION_PLAN_PENDING: 5,
  E_ACTION_PLAN_REJECTED: 5,
  E_COMMIT_MESSAGE_BLOCKED: 5,
  E_ARCHIVE_TASK_SCOPE: 5,
  E_ARCHIVE_PENDING_TASKS: 5,
  E_NO_ELIGIBLE_CHANGE: 5,
  E_PARSE: 6,
  E_PATH_ESCAPE: 6,
  E_IO: 7,
  E_GIT: 7,
  E_GIT_DIRTY: 7,
  E_GIT_ADD_FAILED: 7,
  E_ARCHIVE_MOVE_FAILED: 7,
  E_ARCHIVE_STATE_UNKNOWN: 7,
  E_ARCHIVE_DESTINATION_EXISTS: 7,
}

/**
 * Interpreta os argumentos da linha de comando.
 *
 * @param {Array<string>} argv argumentos sem `node` e script.
 * @returns {object} comando e opções interpretadas.
 */
export function parseArgs(argv) {
  const positional = []
  const options = {}

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]
    if (argument === '--json') {
      options.json = true
      continue
    }
    if (argument === '--no-stage') {
      options.stage = false
      continue
    }
    if (argument === '--change') {
      options.changeId = argv[index + 1]
      index += 1
      continue
    }
    if (argument === '--evidence') {
      options.evidence = argv[index + 1]
      index += 1
      continue
    }
    if (argument === '--slug') {
      options.slug = argv[index + 1]
      index += 1
      continue
    }
    if (argument === '--severity') {
      options.severity = argv[index + 1]
      index += 1
      continue
    }
    if (argument === '--origin') {
      options.origin = argv[index + 1]
      index += 1
      continue
    }
    if (argument === '--problem') {
      options.problem = argv[index + 1]
      index += 1
      continue
    }
    if (argument === '--impact') {
      options.impact = argv[index + 1]
      index += 1
      continue
    }
    if (argument === '--recommendation') {
      options.recommendation = argv[index + 1]
      index += 1
      continue
    }
    if (argument === '--type') {
      options.type = argv[index + 1]
      index += 1
      continue
    }
    if (argument === '--scope') {
      options.scope = argv[index + 1]
      index += 1
      continue
    }
    if (argument === '--summary') {
      options.summary = argv[index + 1]
      index += 1
      continue
    }
    if (argument === '--tests') {
      options.tests = argv[index + 1]
      index += 1
      continue
    }
    if (argument.startsWith('--')) {
      throw new RawspecError('E_ARGS', `Flag desconhecida: ${argument}`, { flag: argument })
    }
    positional.push(argument)
  }

  return { positional, options }
}

/**
 * Executa um comando do helper e devolve o código de saída.
 *
 * @param {Array<string>} argv argumentos sem `node` e script.
 * @returns {number} código de saída.
 */
export function runCli(argv) {
  const repoRoot = findRepoRoot()
  const [command, ...rest] = argv

  if (!command) {
    process.stdout.write(`${usage()}\n`)
    return 0
  }

  let parsed
  try {
    parsed = parseArgs(rest)
  } catch (error) {
    return reportError(error, parsed?.options?.json ?? false)
  }

  const { positional, options } = parsed
  const json = Boolean(options.json)

  try {
    switch (command) {
      case 'resolve': {
        if (positional.length === 0) {
          throw new RawspecError('E_ARGS', 'Informe um TASK-ID: resolve TASK-003', {})
        }
        const result = resolveTask(positional[0], { repoRoot, changeId: options.changeId })
        emit(json, result)
        return 0
      }

      case 'next': {
        const result = selectNextTask(repoRoot, { changeId: options.changeId })
        emit(json, result)
        return 0
      }

      case 'open': {
        const open = listOpenTasks(repoRoot, { changeId: options.changeId })
        if (open.length === 0) {
          throw new RawspecError('E_NO_OPEN_TASK', 'Nenhuma tarefa em execução', {})
        }
        emit(json, { status: 'ok', openTasks: open })
        return 0
      }

      case 'pending-changes': {
        emit(json, { status: 'ok', changes: listPendingChanges(repoRoot) })
        return 0
      }

      case 'start': {
        if (positional.length === 0) {
          throw new RawspecError('E_ARGS', 'Informe um TASK-ID: start TASK-003', {})
        }
        const result = startTask({
          taskId: positional[0],
          repoRoot,
          changeId: options.changeId,
        })
        emit(json, result)
        return 0
      }

      case 'begin-verify': {
        if (positional.length === 0) {
          throw new RawspecError('E_ARGS', 'Informe um TASK-ID: begin-verify TASK-003', {})
        }
        const result = beginVerification({
          taskId: positional[0],
          repoRoot,
          changeId: options.changeId,
        })
        emit(json, result)
        return 0
      }

      case 'verify': {
        if (positional.length === 0) {
          throw new RawspecError('E_ARGS', 'Informe um TASK-ID: verify TASK-003', {})
        }
        const result = verifyTask(
          { taskId: positional[0], repoRoot, changeId: options.changeId },
          options.evidence,
        )
        emit(json, result)
        return 0
      }

      case 'fail': {
        if (positional.length === 0) {
          throw new RawspecError('E_ARGS', 'Informe um TASK-ID: fail TASK-003', {})
        }
        const result = failTask(
          { taskId: positional[0], repoRoot, changeId: options.changeId },
          options.evidence,
        )
        emit(json, result)
        return 0
      }

      case 'commit-message': {
        if (positional.length === 0) {
          throw new RawspecError('E_ARGS', 'Informe um TASK-ID: commit-message TASK-003', {})
        }
        const result = buildCommitMessage({
          taskId: positional[0],
          repoRoot,
          changeId: options.changeId,
          type: options.type,
          scope: options.scope,
          summary: options.summary,
          tests: options.tests,
        })
        emit(json, result)
        return 0
      }

      case 'action-plan': {
        if (positional.length === 0) {
          throw new RawspecError('E_ARGS', 'Informe um TASK-ID: action-plan TASK-003', {})
        }
        const result = createActionPlan(
          { taskId: positional[0], repoRoot, changeId: options.changeId },
          {
            slug: options.slug,
            severity: options.severity,
            origin: options.origin,
            problem: options.problem,
            impact: options.impact,
            recommendation: options.recommendation,
          },
        )
        emit(json, result)
        return 0
      }

      case 'check-action-plans': {
        const changeRef = positional[0]
        const changes = changeRef
          ? [loadChange(repoRoot, changeRef)]
          : listActiveChanges(repoRoot).map((item) => loadChange(repoRoot, item.id))
        const plans = changes.map((change) => ({
          change: change.id,
          pending: checkActionPlans(change),
        }))
        emit(json, { status: 'ok', plans })
        return 0
      }

      case 'resolve-action-plan': {
        if (positional.length === 0) {
          throw new RawspecError('E_ARGS', 'Informe o caminho do plano', {})
        }
        const result = resolveActionPlan(positional[0], options.evidence)
        emit(json, result)
        return 0
      }

      case 'check-archive': {
        const changeRef = positional[0]
        const candidates = changeRef
          ? [loadChange(repoRoot, changeRef)]
          : listActiveChanges(repoRoot).map((item) => loadChange(repoRoot, item.id))
        const reports = candidates.map((change) => checkArchive(change, repoRoot))
        emit(json, { status: 'ok', changes: reports })
        return 0
      }

      case 'archive': {
        const changeRef = positional[0]
        if (changeRef && /^TASK-\d+$/i.test(changeRef)) {
          throw new RawspecError(
            'E_ARCHIVE_TASK_SCOPE',
            'O arquivamento é sempre da mudança inteira, não de uma tarefa',
            { value: changeRef },
          )
        }
        const result = archiveChange(
          { repoRoot, changeId: changeRef },
          { stage: options.stage !== false },
        )
        emit(json, result)
        return 0
      }

      case 'help':
      case '--help':
        process.stdout.write(`${usage()}\n`)
        return 0

      default:
        throw new RawspecError('E_ARGS', `Comando desconhecido: ${command}`, { command })
    }
  } catch (error) {
    return reportError(error, json)
  }
}

/**
 * Texto de uso do helper.
 *
 * @returns {string} texto de uso.
 */
function usage() {
  return [
    'RawSpec helper',
    '',
    'Uso:',
    '  node scripts/rawspec.mjs resolve TASK-ID [--change CHANGE-ID] [--json]',
    '  node scripts/rawspec.mjs next [--change CHANGE-ID] [--json]',
    '  node scripts/rawspec.mjs open [--change CHANGE-ID] [--json]',
    '  node scripts/rawspec.mjs pending-changes [--json]',
    '  node scripts/rawspec.mjs start TASK-ID [--change CHANGE-ID]',
    '  node scripts/rawspec.mjs begin-verify TASK-ID [--change CHANGE-ID]',
    '  node scripts/rawspec.mjs verify TASK-ID --evidence "..." [--change CHANGE-ID]',
    '  node scripts/rawspec.mjs fail TASK-ID --evidence "..." [--change CHANGE-ID]',
    '  node scripts/rawspec.mjs commit-message TASK-ID [--change CHANGE-ID]',
    '  node scripts/rawspec.mjs action-plan TASK-ID --slug SLUG [--severity ALTA]',
    '  node scripts/rawspec.mjs check-action-plans [CHANGE-ID]',
    '  node scripts/rawspec.mjs resolve-action-plan PATH --evidence "..."',
    '  node scripts/rawspec.mjs check-archive [CHANGE-ID]',
    '  node scripts/rawspec.mjs archive [CHANGE-ID] [--no-stage]',
  ].join('\n')
}

/**
 * Emite o resultado de um comando.
 *
 * @param {boolean} json quando `true`, emite JSON.
 * @param {object} payload conteúdo emitido.
 */
function emit(json, payload) {
  if (json) {
    process.stdout.write(`${JSON.stringify({ status: 'ok', ...payload }, null, 2)}\n`)
    return
  }
  process.stdout.write(`${renderText(payload)}\n`)
}

/**
 * Converte o resultado em texto legível.
 *
 * @param {object} payload conteúdo emitido.
 * @returns {string} texto formatado.
 */
function renderText(payload) {
  const lines = []
  if (payload.task) {
    lines.push(`Tarefa: ${payload.task.id} — ${payload.task.title}`)
    lines.push(`Status: ${payload.task.status} / ${payload.task.verification}`)
    lines.push(`Mudança: ${payload.task.change ?? payload.change?.id ?? '—'}`)
    lines.push(`Depende de: ${payload.task.dependencies.join(', ') || 'nenhuma'}`)
    lines.push(`Origem: ${payload.task.dependencySource}`)
    if (payload.task.evidence) lines.push(`Evidência: ${payload.task.evidence}`)
  }
  if (payload.openTasks) {
    for (const entry of payload.openTasks) {
      lines.push(
        `${entry.task.id} — ${entry.task.title} (${entry.task.status}) [${entry.change.id}]`,
      )
    }
  }
  if (payload.changes) {
    for (const entry of payload.changes) {
      lines.push(`${entry.id}: ${entry.approved ? 'aprovada' : 'não aprovada'}`)
    }
  }
  if (payload.plans) {
    for (const entry of payload.plans) {
      lines.push(`${entry.change}: ${entry.pending.length} plano(s) pendente(s)`)
      for (const plan of entry.pending) lines.push(`  - ${plan.relative} (${plan.status})`)
    }
  }
  if (payload.message) {
    lines.push(payload.message)
  }
  if (payload.destination) {
    lines.push(`Destino: ${payload.destination}`)
    lines.push(`Staging: ${payload.staging?.status ?? '—'}`)
  }
  return lines.join('\n')
}

/**
 * Reporta um erro e devolve o código de saída correspondente.
 *
 * @param {Error} error erro capturado.
 * @param {boolean} json quando `true`, emite JSON.
 * @returns {number} código de saída.
 */
function reportError(error, json) {
  if (error instanceof RawspecError) {
    const code = EXIT_CODES[error.code] ?? 7
    if (json) {
      process.stdout.write(
        `${JSON.stringify({ status: 'error', code: error.code, message: error.message, details: error.details }, null, 2)}\n`,
      )
    } else {
      process.stderr.write(`Erro ${error.code}: ${error.message}\n`)
    }
    return code
  }

  if (json) {
    process.stdout.write(
      `${JSON.stringify({ status: 'error', code: 'E_UNKNOWN', message: error.message }, null, 2)}\n`,
    )
  } else {
    process.stderr.write(`Erro inesperado: ${error?.message ?? String(error)}\n`)
  }
  return 7
}

const isMain = process.argv[1] && resolve(process.argv[1]) === resolve(import.meta.filename)
if (isMain) {
  process.exitCode = runCli(process.argv.slice(2))
}
