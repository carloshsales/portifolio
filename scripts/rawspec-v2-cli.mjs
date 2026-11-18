#!/usr/bin/env node
/**
 * CLI do RawSpec v2.
 *
 * TASK-006 e TASK-007 da change 003-rawspec-v2.
 *
 * Uso:
 *   node scripts/rawspec-v2-cli.mjs <comando> [argumentos]
 */

import { realpathSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  RawspecError,
  appendHistory,
  archiveChange,
  archiveTask,
  beginVerification,
  buildCommitMessage,
  checkArchiveChange,
  checkArchiveTask,
  commitAndPushTask,
  createAdrSkeleton,
  createTaskBranch,
  failTask,
  listChangeDirs,
  listOpenTasks,
  migrateLegacyChange,
  normalizeChangeId,
  openPullRequest,
  resolveTask,
  selectNextTask,
  startTask,
  verifyTask,
} from './rawspec-v2.mjs'

/**
 * Raiz do repositório onde a CLI opera.
 *
 * Por omissão, é a raiz do repositório onde o script vive. A variável de
 * ambiente `RAWSPEC_REPO_ROOT` permite correr a CLI contra outro repositório,
 * o que é usado pelos testes de nível de CLI, sem acesso à rede.
 */
const REPO_ROOT = process.env.RAWSPEC_REPO_ROOT
  ? resolve(process.env.RAWSPEC_REPO_ROOT)
  : join(dirname(fileURLToPath(import.meta.url)), '..')

/** Códigos de saída por código de erro. */
const EXIT_CODES = {
  E_ARGS: 2,
  E_HISTORY_INVALID: 2,
  E_TASK_NOT_FOUND: 3,
  E_CHANGE_NOT_FOUND: 3,
  E_TASK_ARCHIVED: 3,
  E_TASK_AMBIGUOUS: 4,
  E_CHANGE_AMBIGUOUS: 4,
  E_CHANGE_NOT_APPROVED: 5,
  E_DEPENDENCY_PENDING: 5,
  E_DEPENDENCY_UNDECLARED: 5,
  E_DEPENDENCY_UNKNOWN: 5,
  E_DEPENDENCY_CYCLE: 5,
  E_TASK_STATE: 5,
  E_EVIDENCE_REQUIRED: 5,
  E_APPROVAL_REQUIRED: 5,
  E_ARCHIVE_TASK_BLOCKED: 5,
  E_ARCHIVE_CHANGE_BLOCKED: 5,
  E_COMMIT_MESSAGE_BLOCKED: 5,
  E_ACTION_PLAN_UNRESOLVED: 5,
  E_PARSE: 6,
  E_PATH_ESCAPE: 7,
  E_IO: 7,
  E_ARCHIVE_STATE_UNKNOWN: 7,
  E_ADR_EXISTS: 7,
  E_BRANCH_EXISTS: 7,
  E_GIT_ERROR: 7,
  E_CHECKS_FAILED: 7,
  E_PR_UNAVAILABLE: 8,
  E_PR_CREATE_FAILED: 8,
}

/**
 * Flags booleanas da CLI.
 *
 * Estas flags nunca consomem o argumento seguinte. Sem esta lista, um
 * `--no-push` colocado antes do identificador da tarefa engolia o próprio
 * identificador, e a flag ficava com o valor do texto que lhe seguia em vez
 * de `true`.
 */
const BOOLEAN_FLAGS = new Set(['no-push', 'no-pr', 'approved', 'adr'])

/**
 * Interpreta argumentos `--chave valor` e flags booleanas.
 *
 * As flags booleanas aceitam a forma `--flag` e a forma explícita
 * `--flag=true` ou `--flag=false`. O sufixo depois do `=` é separado antes de
 * a flag ser classificada, para que `--no-pr=false` não seja confundida com
 * uma flag com o valor `false` como argumento, e para que nenhuma flag
 * booleanamente correcta consuma o token seguinte.
 *
 * @param {string[]} argv argumentos.
 * @returns {Record<string, string|boolean|Array<string>>} argumentos interpretados.
 */
export function parseArgs(argv) {
  const args = { _: [] }
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index]
    if (token.startsWith('--')) {
      const body = token.slice(2)
      const separator = body.indexOf('=')
      const key = separator === -1 ? body : body.slice(0, separator)
      const inlineValue = separator === -1 ? undefined : body.slice(separator + 1)

      if (BOOLEAN_FLAGS.has(key)) {
        args[key] = inlineValue === undefined ? true : parseBooleanFlag(inlineValue)
        continue
      }

      if (inlineValue !== undefined) {
        args[key] = inlineValue
        continue
      }

      const next = argv[index + 1]
      if (next === undefined || next.startsWith('--')) {
        args[key] = true
      } else {
        args[key] = next
        index += 1
      }
    } else {
      args._.push(token)
    }
  }
  return args
}

/**
 * Interpreta uma flag booleana, aceitando a forma `--flag` e `--flag=true`.
 *
 * Só a forma `false` (em qualquer caixa) é falsa. Qualquer outro valor é
 * verdadeiro, o que torna `--flag` equivalente a `--flag=true`.
 *
 * @param {string|boolean|undefined} value valor cru da flag.
 * @returns {boolean} valor booleano da flag.
 */
export function parseBooleanFlag(value) {
  if (typeof value === 'boolean') return value
  if (typeof value !== 'string') return false
  return value.toLowerCase() !== 'false'
}

/**
 * Imprime um payload em JSON.
 *
 * @param {unknown} payload conteúdo.
 */
function emit(payload) {
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`)
}

/**
 * Imprime um erro em JSON e define o código de saída.
 *
 * @param {unknown} error erro capturado.
 */
function emitError(error) {
  const code = error instanceof RawspecError ? error.code : 'E_INTERNAL'
  process.stderr.write(
    `${JSON.stringify(
      { error: { code, message: error.message, details: error.details ?? {} } },
      null,
      2,
    )}\n`,
  )
  process.exitCode = EXIT_CODES[code] ?? 7
}

/**
 * Retorna o autor padrão do registro.
 *
 * @returns {string} autor.
 */
function defaultAuthor() {
  return process.env.USERNAME ?? process.env.USER ?? 'Usuário'
}

/**
 * Imprime o uso da CLI.
 */
function usage() {
  process.stderr.write(
    [
      'Uso: node scripts/rawspec-v2-cli.mjs <comando> [argumentos]',
      '',
      'Comandos:',
      '  resolve TASK-ID [--change CHANGE-ID]',
      '  next [--change CHANGE-ID]',
      '  open [--change CHANGE-ID]',
      '  start TASK-ID [--change CHANGE-ID]',
      '  begin-verify TASK-ID [--change CHANGE-ID]',
      '  verify TASK-ID --evidence "..." [--change CHANGE-ID]',
      '  fail TASK-ID --evidence "..." [--change CHANGE-ID]',
      '  archive-task TASK-ID [--change CHANGE-ID] --approved',
      '  archive-change CHANGE-ID --approved',
      '  check-archive-task TASK-ID [--change CHANGE-ID]',
      '  check-archive-change CHANGE-ID',
      '  commit-message TASK-ID [--type TYPE] [--summary "..."] [--tests "..."]',
      '  migrate-change CHANGE-ID',
      '  create-branch TASK-ID [--change CHANGE-ID]',
      '  commit-task TASK-ID [--change CHANGE-ID] [--branch NAME] [--remote NAME] [--no-push] [--no-pr]',
      '  open-pr TASK-ID [--change CHANGE-ID] [--branch NAME] [--base BRANCH]',
      '  log --type <Decisão|Evento|Detalhe> --title <título> --message <texto> [opções]',
      '',
    ].join('\n'),
  )
  process.exitCode = 2
}

/**
 * Ponto de entrada da CLI.
 */
function main() {
  const argv = process.argv.slice(2)
  const command = argv[0]
  const args = parseArgs(argv.slice(1))
  const positional = args._[0]
  const changeId = args.change
  const options = { repoRoot: REPO_ROOT, changeId }

  try {
    switch (command) {
      case 'resolve':
        emit(resolveTask(positional, options))
        return
      case 'next':
        emit(selectNextTask(REPO_ROOT, { changeId }))
        return
      case 'open':
        emit(listOpenTasks(REPO_ROOT))
        return
      case 'start':
        emit(startTask(REPO_ROOT, positional, { changeId }))
        return
      case 'begin-verify':
        emit(beginVerification(REPO_ROOT, positional, { changeId }))
        return
      case 'verify':
        emit(verifyTask(REPO_ROOT, positional, { changeId, evidence: args.evidence }))
        return
      case 'fail':
        emit(failTask(REPO_ROOT, positional, { changeId, evidence: args.evidence }))
        return
      case 'archive-task':
        emit(
          archiveTask(REPO_ROOT, positional, {
            changeId,
            approved: parseBooleanFlag(args.approved),
          }),
        )
        return
      case 'archive-change':
        emit(archiveChange(REPO_ROOT, positional, { approved: parseBooleanFlag(args.approved) }))
        return
      case 'check-archive-task':
        emit(checkArchiveTask(REPO_ROOT, positional, { changeId }))
        return
      case 'check-archive-change':
        emit(checkArchiveChange(REPO_ROOT, positional))
        return
      case 'commit-message':
        process.stdout.write(
          buildCommitMessage(REPO_ROOT, positional, {
            changeId,
            type: args.type,
            summary: args.summary,
            tests: args.tests,
          }),
        )
        return
      case 'migrate-change': {
        const name = normalizeChangeId(positional, listChangeDirs(REPO_ROOT))
        emit(migrateLegacyChange(join(REPO_ROOT, 'specs', 'changes', name)))
        return
      }
      case 'create-branch':
        emit(createTaskBranch(REPO_ROOT, positional, { changeId }))
        return
      case 'commit-task':
        emit(
          commitAndPushTask(REPO_ROOT, positional, {
            changeId,
            branch: args.branch,
            remote: args.remote,
            push: !parseBooleanFlag(args['no-push']),
            pr: !parseBooleanFlag(args['no-pr']),
          }),
        )
        return
      case 'open-pr':
        emit(
          openPullRequest(REPO_ROOT, positional, {
            changeId,
            branch: args.branch,
            base: args.base,
          }),
        )
        return
      case 'log':
        emit(
          appendHistory(REPO_ROOT, {
            type: args.type,
            title: args.title,
            author: args.author ?? defaultAuthor(),
            origin: args.origin ?? 'sessão',
            message: args.message,
            reason: args.reason ?? args.message ?? '',
            impact: args.impact ?? 'não informado',
            evidence: args.evidence ?? 'não informada',
            date: args.date,
          }),
        )
        if (parseBooleanFlag(args.adr)) {
          emit(createAdrSkeleton(REPO_ROOT, { title: args['adr-title'] ?? args.title }))
        }
        return
      default:
        usage()
    }
  } catch (error) {
    emitError(error)
  }
}

/**
 * Compara dois caminhos para saber se apontam para o mesmo ficheiro.
 *
 * A comparação normaliza o caminho, resolve oslinks e, no Windows, ignora a
 * diferença de maiúsculas e minúsculas do sistema de ficheiros.
 *
 * @param {string} left primeiro caminho.
 * @param {string} right segundo caminho.
 * @returns {boolean} `true` quando os caminhos são equivalentes.
 */
function isSamePath(left, right) {
  const normalize = (value) => {
    const resolved = resolve(value)
    return process.platform === 'win32' ? resolved.toLowerCase() : resolved
  }
  try {
    return normalize(realpathSync.native(left)) === normalize(realpathSync.native(right))
  } catch {
    return normalize(left) === normalize(right)
  }
}

/**
 * Executa a CLI quando o ficheiro é usado como programa.
 *
 * A verificação permite importar este módulo em teste, para cobrir o parsing
 * das flags, sem disparar a execução do comando.
 */
const isDirectRun =
  process.argv[1] !== undefined && isSamePath(fileURLToPath(import.meta.url), process.argv[1])

if (isDirectRun) {
  main()
}
