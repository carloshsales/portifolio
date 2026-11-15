#!/usr/bin/env node
/**
 * CLI do RawSpec v2.
 *
 * TASK-006 e TASK-007 da change 003-rawspec-v2.
 *
 * Uso:
 *   node scripts/rawspec-v2-cli.mjs <comando> [argumentos]
 */

import { dirname, join } from 'node:path'
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
  resolveTask,
  selectNextTask,
  startTask,
  verifyTask,
} from './rawspec-v2.mjs'

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

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
}

/**
 * Interpreta argumentos `--chave valor` e flags booleanas.
 *
 * @param {string[]} argv argumentos.
 * @returns {Record<string, string|boolean|Array<string>>} argumentos interpretados.
 */
function parseArgs(argv) {
  const args = { _: [] }
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index]
    if (token.startsWith('--')) {
      const key = token.slice(2)
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
      '  commit-task TASK-ID [--change CHANGE-ID] [--branch NAME] [--remote NAME] [--no-push]',
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
            approved: args.approved === true,
          }),
        )
        return
      case 'archive-change':
        emit(archiveChange(REPO_ROOT, positional, { approved: args.approved === true }))
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
            push: args['no-push'] !== true,
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
        if (args.adr) {
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

main()
