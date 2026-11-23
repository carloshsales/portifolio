/**
 * Teste de integração real do fluxo de commit, da CLI e do hook `pre-commit`.
 *
 * TASK-013 da change 001-portfolio-mvp.
 *
 * O teste não simula o hook: executa o Git de verdade numa fixture isolada,
 * com o hook do Husky instalado e o `lint-staged` real a correr sobre os
 * ficheiros preparados. A fixture nunca aponta para o repositório real:
 * `GIT_DIR`, `GIT_WORK_TREE`, `GIT_INDEX_FILE` e `core.hooksPath` são fixados
 * dentro do directório temporário do teste, e a configuração Git global e de
 * sistema é substituída por ficheiros isolados da fixture.
 *
 * O caminho feliz do `commit-task` percorre a CLI real (`runCli`), o staging
 * feito pelo helper, o hook `pre-commit` do Husky e o `lint-staged` real.
 */

import { spawnSync } from 'node:child_process'
import {
  chmodSync,
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { delimiter, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = join(SCRIPT_DIR, '..')

/** Caminho do binário real do `lint-staged`, usado dentro da fixture. */
const LINT_STAGED_BIN = join(REPO_ROOT, 'node_modules', 'lint-staged', 'bin', 'lint-staged.js')

/** Verificações internas que o `commit-task` executa antes do commit. */
const INTERNAL_CHECKS = ['lint', 'typecheck', 'test', 'build']

let workDir

beforeEach(() => {
  workDir = mkdtempSync(join(tmpdir(), 'rawspec-hook-'))
})

afterEach(() => {
  rmSync(workDir, { recursive: true, force: true })
})

/**
 * Verifica se um directório existe.
 *
 * @param {string} path caminho do directório.
 * @returns {boolean} `true` quando o directório existe.
 */
function existsDirectory(path) {
  try {
    return statSync(path).isDirectory()
  } catch {
    return false
  }
}

/**
 * Devolve o directório Git e o índice de uma fixture.
 *
 * @param {string} repo directório da fixture.
 * @returns {{gitDir: string, workTree: string, indexFile: string}} caminhos isolados.
 */
function gitPaths(repo) {
  return {
    gitDir: join(repo, '.git'),
    workTree: repo,
    indexFile: join(repo, '.git', 'index'),
  }
}

/**
 * Constrói um ambiente isolado para a fixture.
 *
 * Todos os valores que couldiam apontar para o repositório real são
 * substituídos: `GIT_DIR`, `GIT_WORK_TREE` e `GIT_INDEX_FILE` são fixados
 * dentro da fixture, a configuração Git global e de sistema é substituída por
 * ficheiros vazios da fixture, e o `PATH` passa a começar pela pasta de
 * ferramentas da fixture, que contém o substituto de `pnpm`.
 *
 * @param {string} repo directório da fixture.
 * @param {string[]} [extraPath] pastas adicionais a colocar à frente do `PATH`.
 * @returns {NodeJS.ProcessEnv} ambiente isolado.
 */
function fixtureEnv(repo, extraPath = []) {
  const { gitDir, workTree, indexFile } = gitPaths(repo)
  const env = { ...process.env }
  env.GIT_DIR = gitDir
  env.GIT_WORK_TREE = workTree
  env.GIT_INDEX_FILE = indexFile
  env.GIT_CONFIG_GLOBAL = join(repo, '.git', 'config-global-isolado')
  env.GIT_CONFIG_SYSTEM = join(repo, '.git', 'config-system-isolado')
  env.GIT_CEILING_DIRECTORIES = workDir
  env.PATH = [join(repo, 'bin'), ...extraPath, env.PATH ?? ''].join(delimiter)
  return env
}

/**
 * Executa um comando Git isolado da fixture.
 *
 * `GIT_DIR`, `GIT_WORK_TREE` e `GIT_INDEX_FILE` são sempre fixados dentro da
 * fixture, para que nenhum comando escape para o repositório ou para o
 * worktree real.
 *
 * @param {string} cwd directório de trabalho do comando.
 * @param {string[]} args argumentos do Git.
 * @returns {string} saída do comando.
 */
function git(cwd, args) {
  const result = spawnSync('git', args, {
    cwd,
    encoding: 'utf8',
    env: fixtureEnv(cwd),
  })
  if (result.status !== 0) {
    throw new Error(`git ${args.join(' ')} falhou: ${result.stderr ?? result.stdout}`)
  }
  return result.stdout ?? ''
}

/**
 * Executa um comando Git e devolve o resultado sem levantar em caso de falha.
 *
 * @param {string} cwd directório de trabalho do comando.
 * @param {string[]} args argumentos do Git.
 * @returns {{status: number|null, stdout: string, stderr: string}} resultado do comando.
 */
function gitResult(cwd, args) {
  const result = spawnSync('git', args, {
    cwd,
    encoding: 'utf8',
    env: fixtureEnv(cwd),
  })
  return {
    status: result.status,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
  }
}

/**
 * Instala na fixture as dependências de que o hook precisa.
 *
 * O `node_modules` é ligado por junction: evita duplicar a árvore de
 * dependências e garante que `prettier` e `eslint` são resolvidos
 * exactamente como no repositório real.
 *
 * @param {string} repo directório da fixture.
 */
function installTooling(repo) {
  for (const file of [
    'package.json',
    'pnpm-lock.yaml',
    '.prettierrc.json',
    '.prettierignore',
    'eslint.config.js',
    '.gitignore',
    '.gitattributes',
  ]) {
    const source = join(REPO_ROOT, file)
    try {
      cpSync(source, join(repo, file))
    } catch {
      // Ficheiro opcional: a fixture continua válida sem ele.
    }
  }

  cpSync(join(REPO_ROOT, '.husky'), join(repo, '.husky'), { recursive: true })

  // Os scripts do RawSpec são copiados para a fixture, porque a CLI resolve a
  // raiz do repositório a partir da sua própria localização.
  mkdirSync(join(repo, 'scripts'), { recursive: true })
  cpSync(join(REPO_ROOT, 'scripts', 'rawspec-v2.mjs'), join(repo, 'scripts', 'rawspec-v2.mjs'))
  cpSync(
    join(REPO_ROOT, 'scripts', 'rawspec-v2-cli.mjs'),
    join(repo, 'scripts', 'rawspec-v2-cli.mjs'),
  )

  const modulesLink = join(repo, 'node_modules')
  try {
    symlinkSync(join(REPO_ROOT, 'node_modules'), modulesLink, 'junction')
  } catch {
    cpSync(join(REPO_ROOT, 'node_modules'), modulesLink, {
      recursive: true,
      verbatimSymlinks: true,
    })
  }
}

/**
 * Instala na fixture um substituto de `pnpm`.
 *
 * O `commit-task` corre as verificações internas do projecto (`lint`,
 * `typecheck`, `test` e `build`) antes do commit. A fixture é mínima e não
 * tem `tsconfig.json` nem a árvore de fontes, por isso essas verificações
 * são substituídas por registos que passam sem executar o projecto real.
 *
 * O `pnpm run lint:staged` não é substituído: delega no binário real do
 * `lint-staged`, de modo que o hook `pre-commit` executa o lint real. A
 * invocação fica registada, para que o teste prove que o hook chegou lá.
 *
 * São instalados dois substitutos: `pnpm` (POSIX, executável) e `pnpm.cmd`
 * (Windows). O `pnpm.cmd` é preservado para o helper, que no Windows invoca
 * `cmd /c pnpm`.
 *
 * @param {string} repo directório da fixture.
 * @returns {{checksLog: string, stagedLog: string}} caminhos dos registos.
 */
function installPnpmShim(repo) {
  const binDir = join(repo, 'bin')
  mkdirSync(binDir, { recursive: true })
  const checksLog = join(repo, '.checks.log')
  const stagedLog = join(repo, '.lint-staged.log')

  // O `sh` do Git Bash corrompe caminhos Windows com barras invertidas, por
  // isso o script POSIX usa caminhos com barras normais.
  const posixChecksLog = checksLog.replace(/\\/g, '/')
  const posixStagedLog = stagedLog.replace(/\\/g, '/')
  const posixLintStagedBin = LINT_STAGED_BIN.replace(/\\/g, '/')
  const posixExecPath = process.execPath.replace(/\\/g, '/')
  const posixBinDir = binDir.replace(/\\/g, '/')

  // POSIX: o hook do Husky corre com `sh`, que resolve o `pnpm` deste ficheiro.
  const posix = [
    '#!/bin/sh',
    'if [ "$1" = "run" ] && [ "$2" = "lint:staged" ]; then',
    `  echo "lint:staged" >> "${posixStagedLog}"`,
    `  exec "${posixExecPath}" "${posixLintStagedBin}" "$@"`,
    'fi',
    'case "$1" in',
    ...INTERNAL_CHECKS.map(
      (check) => `  ${check}) echo "${check}" >> "${posixChecksLog}"; exit 0 ;;`,
    ),
    'esac',
    // Para qualquer outro comando, delega no `pnpm` real. Odirectório deste
    // shim é removido do `PATH` primeiro: como está no início do `PATH`, o
    // `pnpm` resolveria para este mesmo ficheiro, em recursão infinita.
    `PATH=$(printf '%s' "$PATH" | tr ':' '\n' | grep -vx "${posixBinDir}" | paste -sd ':' -)`,
    'export PATH',
    'exec pnpm "$@"',
    '',
  ].join('\n')
  const posixShim = join(binDir, 'pnpm')
  writeFileSync(posixShim, posix, 'utf8')

  // O shim POSIX tem de ser executável: em Linux e macOS o `sh` do hook do
  // Husky resolve `pnpm` neste ficheiro e executa-o directamente, o que
  // falha com "Permission denied" quando a bit de execução não está posta.
  // O `chmod` é inócuo no Windows, onde a execução passa pelo `pnpm.cmd`.
  chmodSync(posixShim, 0o755)

  // Windows: o helper invoca `cmd /c pnpm`, que resolve o `pnpm.cmd`.
  const windows = [
    '@echo off',
    'if "%1"=="run" if "%2"=="lint:staged" (',
    `  echo lint:staged>>"${stagedLog}"`,
    `  "${process.execPath}" "${LINT_STAGED_BIN}" %3 %4 %5 %6 %7 %8 %9`,
    '  exit /b %ERRORLEVEL%',
    ')',
    'if "%1"=="lint" goto noop',
    'if "%1"=="typecheck" goto noop',
    'if "%1"=="test" goto noop',
    'if "%1"=="build" goto noop',
    'pnpm %*',
    'exit /b %ERRORLEVEL%',
    ':noop',
    `echo %1>>"${checksLog}"`,
    'exit /b 0',
    '',
  ].join('\r\n')
  writeFileSync(join(binDir, 'pnpm.cmd'), windows, 'utf8')

  return { checksLog, stagedLog }
}

/**
 * Cria uma fixture Git isolada, com o hook do Husky activo.
 *
 * O `core.hooksPath` aponta para `.husky/_` dentro da fixture, e o `GIT_DIR`,
 * o `GIT_WORK_TREE` e o `GIT_INDEX_FILE` são sempre os da fixture. Nenhum
 * comando executado pelo teste pode tocar no repositório real.
 *
 * @returns {string} directório da fixture.
 */
function createFixture() {
  const repo = join(workDir, 'repo')
  const { gitDir, workTree, indexFile } = gitPaths(repo)
  mkdirSync(gitDir, { recursive: true })

  git(repo, ['init', '--initial-branch=main'])
  git(repo, ['config', 'user.email', 'test@example.com'])
  git(repo, ['config', 'user.name', 'Teste'])
  git(repo, ['config', 'commit.gpgsign', 'false'])

  installTooling(repo)

  writeFileSync(join(repo, 'README.md'), '# Fixture\n', 'utf8')
  git(repo, ['add', '-A'])
  git(repo, ['commit', '-m', 'chore: inicial'])

  // Instala os hooks do Husky dentro da fixture, como o `prepare` faz.
  git(repo, ['config', 'core.hooksPath', '.husky/_'])
  const hooksSource = join(REPO_ROOT, '.husky', '_')
  if (existsDirectory(hooksSource)) {
    cpSync(hooksSource, join(repo, '.husky', '_'), { recursive: true })
  }

  // Ficheiros de configuração global e de sistema isolados: o Git da fixture
  // não lê a configuração do utilizador nem a do sistema.
  writeFileSync(join(gitDir, 'config-global-isolado'), '', 'utf8')
  writeFileSync(join(gitDir, 'config-system-isolado'), '', 'utf8')

  installPnpmShim(repo)

  return repo
}

/**
 * Lê o conteúdo de um ficheiro de registo da fixture.
 *
 * @param {string} path caminho do ficheiro.
 * @returns {string} conteúdo do ficheiro, ou cadeia vazia.
 */
function readLog(path) {
  if (!existsSync(path)) return ''
  return readFileSync(path, 'utf8')
}

/**
 * Extrai o erro JSON emitido pela CLI.
 *
 * A CLI escreve o erro como JSON em `stderr`, com a forma
 * `{ "error": { "code": ..., "message": ..., "details": ... } }`. A
 * extracção tolera lixo antes ou depois do JSON, para não depender do
 * formato exacto da saída do processo.
 *
 * @param {{stdout: string, stderr: string}} result resultado da CLI.
 * @returns {{code?: string, message?: string, details?: Record<string, unknown>}|null} erro, ou `null`.
 */
function parseCliError(result) {
  const output = `${result.stdout}\n${result.stderr}`
  const start = output.indexOf('{')
  const end = output.lastIndexOf('}')
  if (start === -1 || end <= start) return null
  try {
    const parsed = JSON.parse(output.slice(start, end + 1))
    return parsed?.error ?? null
  } catch {
    return null
  }
}

/**
 * Escreve a mudança e a tarefa RawSpec na fixture.
 *
 * @param {string} repo directório da fixture.
 * @param {string} taskName nome do ficheiro da tarefa.
 */
function writeChange(repo, taskName = 'TASK-006.md') {
  const changeDir = join(repo, 'specs', 'changes', '001-portfolio-mvp')
  mkdirSync(join(changeDir, 'tasks'), { recursive: true })
  writeFileSync(
    join(changeDir, 'proposal.md'),
    '# Change 001-portfolio-mvp\n\n- Status: APPROVED\n\n## 1. Objetivo\n\nTeste.\n',
    'utf8',
  )
  writeFileSync(
    join(changeDir, 'tasks', taskName),
    [
      `# ${taskName.replace('.md', '')} — Tarefa de teste`,
      '',
      '- Change: 001-portfolio-mvp',
      '- Status: COMPLETED',
      '- Depende de: nenhuma',
      '- Verificação: VERIFIED',
      '- Evidência: testes aprovados',
      '',
      '## Objetivo',
      '',
      'Alterar apenas ficheiros Markdown.',
      '',
      '## Arquivos',
      '',
      `- \`specs/changes/001-portfolio-mvp/tasks/${taskName}\``,
      '',
    ].join('\n'),
    'utf8',
  )
  git(repo, ['add', '-A'])
  git(repo, ['commit', '-m', 'chore: change'])
}

/**
 * Devolve o caminho do ficheiro da tarefa dentro da fixture.
 *
 * @param {string} repo directório da fixture.
 * @param {string} taskName nome do ficheiro da tarefa.
 * @returns {string} caminho absoluto do ficheiro.
 */
function taskFile(repo, taskName = 'TASK-006.md') {
  return join(repo, 'specs', 'changes', '001-portfolio-mvp', 'tasks', taskName)
}

/**
 * Executa a CLI do RawSpec como processo separado, dentro da fixture.
 *
 * O ambiente é o da fixture: `GIT_DIR`, `GIT_WORK_TREE` e `GIT_INDEX_FILE`
 * apontam para a fixture, e o `PATH` inclui o substituto de `pnpm`. A CLI
 * resolve a raiz do repositório a partir da sua própria localização, dentro
 * da fixture.
 *
 * @param {string} repo directório da fixture.
 * @param {string[]} args argumentos da CLI.
 * @returns {{status: number|null, stdout: string, stderr: string}} resultado.
 */
function runCli(repo, args) {
  const result = spawnSync(
    process.execPath,
    [join(repo, 'scripts', 'rawspec-v2-cli.mjs'), ...args],
    {
      cwd: repo,
      encoding: 'utf8',
      env: fixtureEnv(repo),
    },
  )
  return {
    status: result.status,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
  }
}

/**
 * Executa o `lint-staged` real directamente sobre a fixture.
 *
 * O ambiente é totalmente isolado: `GIT_DIR`, `GIT_WORK_TREE` e
 * `GIT_INDEX_FILE` são fixados dentro da fixture, a configuração Git global
 * e de sistema é substituída, e o `core.hooksPath` do repositório real nunca
 * é alcançado porque o Git só lê a configuração da fixture.
 *
 * @param {string} repo directório da fixture.
 * @param {string[]} [extraArgs] argumentos adicionais do `lint-staged`.
 * @returns {{status: number|null, stdout: string, stderr: string}} resultado.
 */
function runLintStaged(repo, extraArgs = []) {
  const env = fixtureEnv(repo)
  env.PATH = `${join(REPO_ROOT, 'node_modules', '.bin')}${delimiter}${env.PATH}`
  const result = spawnSync(
    process.execPath,
    [LINT_STAGED_BIN, '--config', join(repo, 'package.json'), ...extraArgs],
    {
      cwd: repo,
      encoding: 'utf8',
      env,
    },
  )
  return {
    status: result.status,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
  }
}

describe('hook pre-commit e lint-staged', () => {
  it('o substituto de pnpm da fixture é executável e existe o pnpm.cmd', () => {
    const repo = createFixture()

    const posixShim = join(repo, 'bin', 'pnpm')
    expect(existsSync(posixShim)).toBe(true)

    // Em Linux e macOS o `sh` do hook do Husky executa o ficheiro `pnpm`
    // directamente. Sem a bit de execução, o hook falha com "Permission
    // denied" e o `lint-staged` nunca chega a correr.
    // No Windows esta bit não existe: o `chmod` é inócuo e a execução passa
    // pelo `pnpm.cmd`, invocado por `cmd /c pnpm`.
    if (process.platform !== 'win32') {
      expect(statSync(posixShim).mode & 0o111).not.toBe(0)
    }

    // O `pnpm.cmd` é preservado para o Windows, onde o helper invoca
    // `cmd /c pnpm`.
    expect(existsSync(join(repo, 'bin', 'pnpm.cmd'))).toBe(true)
  }, 120000)

  it('executa o hook real sem falhar quando o commit tem só Markdown', () => {
    const repo = createFixture()
    writeChange(repo)

    writeFileSync(
      taskFile(repo),
      `${readFileSync(taskFile(repo), 'utf8')}\n<!-- alteracao -->\n`,
      'utf8',
    )
    git(repo, ['add', '--', 'specs/changes/001-portfolio-mvp/tasks/TASK-006.md'])

    const staged = git(repo, ['diff', '--staged', '--name-only'])
    expect(staged.trim()).toBe('specs/changes/001-portfolio-mvp/tasks/TASK-006.md')

    const result = gitResult(repo, ['commit', '-m', 'feat(rawspec): markdown apenas'])

    expect(result.status).toBe(0)
    expect(result.stdout + result.stderr).not.toContain('could not find any staged files')
  }, 120000)

  it('o lint-staged aplica o Prettier ao Markdown preparado e altera o ficheiro', () => {
    const repo = createFixture()
    writeChange(repo)

    // O `.prettierignore` do projecto ignora `specs` e `docs`, por isso o
    // ficheiro de teste vive na raiz da fixture: aí o Prettier actua mesmo.
    const target = join(repo, 'NOTAS.md')
    const desformatado = '# Notas\n\n-   item  um\n- item dois\n\ntexto   com   espacos\n'
    writeFileSync(target, desformatado, 'utf8')

    git(repo, ['add', '--', 'NOTAS.md'])

    const result = gitResult(repo, ['commit', '-m', 'feat(rawspec): prettier'])

    expect(result.status).toBe(0)
    const content = readFileSync(target, 'utf8')

    // O conteúdo foi alterado: o Prettier canonicalizou a lista e colapsou
    // os espaços internos.
    expect(content).not.toBe(desformatado)
    expect(content).toContain('- item um')
    expect(content).not.toContain('-   item  um')
    expect(content).toContain('texto com espacos')
    expect(content).not.toContain('texto   com   espacos')
  }, 120000)

  it('o lint-staged continua a executar o lint nos ficheiros TS/JS preparados', () => {
    const repo = createFixture()
    writeChange(repo)

    mkdirSync(join(repo, 'src'), { recursive: true })
    // A variável não usada viola `@typescript-eslint/no-unused-vars`, que o
    // ESLint aplica aos ficheiros TypeScript. Se o `lint-staged` não correr o
    // lint, o commit passa; se correr, o commit é bloqueado.
    writeFileSync(
      join(repo, 'src', 'exemplo.ts'),
      'export const valor = 1\nconst naoUsado = 2\n',
      'utf8',
    )
    git(repo, ['add', '--', 'src/exemplo.ts'])

    const staged = git(repo, ['diff', '--staged', '--name-only'])
    expect(staged.trim()).toBe('src/exemplo.ts')

    const before = git(repo, ['rev-parse', '--short', 'HEAD']).trim()
    const result = gitResult(repo, ['commit', '-m', 'feat(rawspec): typescript'])

    // O lint correu: o commit foi bloqueado pela variável não usada.
    expect(result.status).not.toBe(0)
    const output = result.stdout + result.stderr
    expect(output).toContain('naoUsado')
    // A falha vem da regra concreta do ESLint, não de um erro qualquer do
    // lint-staged.
    expect(output).toContain('@typescript-eslint/no-unused-vars')
    const after = git(repo, ['rev-parse', '--short', 'HEAD']).trim()
    expect(after).toBe(before)
  }, 120000)

  it('um ficheiro TS/JS válido passa pelo lint-staged e é commitado', () => {
    const repo = createFixture()
    writeChange(repo)

    mkdirSync(join(repo, 'src'), { recursive: true })
    writeFileSync(join(repo, 'src', 'valido.ts'), 'export const valor = 1\n', 'utf8')
    git(repo, ['add', '--', 'src/valido.ts'])

    const result = gitResult(repo, ['commit', '-m', 'feat(rawspec): typescript valido'])

    expect(result.status).toBe(0)
    expect(result.stdout + result.stderr).not.toContain('could not find any staged files')
    const committed = git(repo, ['show', '--name-only', '--pretty=format:'])
    expect(committed).toContain('src/valido.ts')
  }, 120000)

  it('a CLI commit-task percorre o staging, o hook real e o lint-staged real', () => {
    const repo = createFixture()
    writeChange(repo)

    const target = taskFile(repo)
    writeFileSync(target, `${readFileSync(target, 'utf8')}\n<!-- alteracao -->\n`, 'utf8')

    const before = git(repo, ['rev-parse', '--short', 'HEAD']).trim()

    // O commit de preparação de `writeChange` já dispara o hook `pre-commit`,
    // que escreve `lint:staged` no registo. Por isso o registo é fotografado
    // aqui, imediatamente antes de `runCli`: só a porção acrescentada depois
    // prova que o commit da CLI chegou a correr o hook.
    const stagedLogPath = join(repo, '.lint-staged.log')
    const stagedLogBefore = readLog(stagedLogPath)

    // A CLI real é executada: `commit-task` corre as verificações, prepara os
    // ficheiros com `git add`, e o commit dispara o hook `pre-commit`, que
    // executa o `lint-staged` real.
    const result = runCli(repo, [
      'commit-task',
      'TASK-006',
      '--change',
      '001-portfolio-mvp',
      '--no-push',
    ])

    expect(result.status).toBe(0)
    // A mensagem do `lint-staged` pode ir para `stdout` ou para `stderr`,
    // conforme o runner que executou o hook. A verificação olha para a
    // saída combinada, para não deixar passar por falha um caso em que a
    // mensagem aparece só no `stdout`.
    expect(result.stdout + result.stderr).not.toContain('could not find any staged files')

    // O hook `pre-commit` do commit da CLI correu e chegou ao `lint-staged`
    // real. O registo cresceu, e a porção nova traz o `lint:staged`: sem isto,
    // a asserção passaria à mesma com o `lint:staged` deixado pelo commit de
    // preparação de `writeChange`.
    const stagedLogAfter = readLog(stagedLogPath)
    expect(stagedLogAfter.length).toBeGreaterThan(stagedLogBefore.length)
    expect(stagedLogAfter.slice(stagedLogBefore.length)).toContain('lint:staged')
    expect(readLog(join(repo, '.checks.log'))).toContain('typecheck')

    // As verificações internas do `commit-task` correram antes do commit.
    const checks = readLog(join(repo, '.checks.log'))
    for (const check of INTERNAL_CHECKS) {
      expect(checks).toContain(check)
    }

    const after = git(repo, ['rev-parse', '--short', 'HEAD']).trim()
    expect(after).not.toBe(before)

    // O commit foi mesmo criado, com a mensagem do RawSpec.
    const subject = git(repo, ['log', '-1', '--pretty=format:%s']).trim()
    expect(subject).toContain('feat(rawspec)')
    const body = git(repo, ['log', '-1', '--pretty=format:%b'])
    expect(body).toContain('Change: 001-portfolio-mvp')
    expect(body).toContain('Task: TASK-006')

    // O ficheiro preparado foi commited.
    const committed = git(repo, ['show', '--name-only', '--pretty=format:'])
    expect(committed).toContain('specs/changes/001-portfolio-mvp/tasks/TASK-006.md')
  }, 120000)

  it('a CLI commit-task corre as verificações antes do gate de âmbito', () => {
    const repo = createFixture()
    writeChange(repo)

    // Um ficheiro fora do âmbito tem de fazer falhar o `commit-task`, mas
    // depois das verificações: o `commit-task` corre `lint`, `typecheck`,
    // `test` e `build` antes do gate de âmbito.
    writeFileSync(join(repo, 'fora-do-ambito.ts'), 'export const fora = 1\n', 'utf8')
    writeFileSync(
      taskFile(repo),
      `${readFileSync(taskFile(repo), 'utf8')}\n<!-- alteracao -->\n`,
      'utf8',
    )

    const before = git(repo, ['rev-parse', '--short', 'HEAD']).trim()
    const result = runCli(repo, [
      'commit-task',
      'TASK-006',
      '--change',
      '001-portfolio-mvp',
      '--no-push',
    ])

    expect(result.status).toBe(7)

    // O código de saída 7 não distingue, por si só, a falha das verificações
    // da falha do gate de âmbito: `E_CHECKS_FAILED` e `E_SCOPE_VIOLATION`
    // mapeiam ambos para 7. Por isso a falha é confirmada por dois
    // sinais independentes.
    //
    // Primeiro, o marcador do shim: as quatro verificações internas foram
    // invocadas, logo a falha não veio delas.
    const checks = readLog(join(repo, '.checks.log'))
    for (const check of INTERNAL_CHECKS) {
      expect(checks).toContain(check)
    }

    // Segundo, o erro emitido pela CLI é o do gate de âmbito, e não o das
    // verificações.
    const error = parseCliError(result)
    expect(error?.code).toBe('E_SCOPE_VIOLATION')
    expect(error?.details?.outOfScope).toContain('fora-do-ambito.ts')

    const after = git(repo, ['rev-parse', '--short', 'HEAD']).trim()
    expect(after).toBe(before)
  }, 120000)
})

describe('diagnóstico da origem da mensagem', () => {
  it('a mensagem aparece quando o índice não tem ficheiros e não faz falhar o commit', () => {
    const repo = createFixture()
    writeChange(repo)

    const result = gitResult(repo, ['commit', '-m', 'chore: vazio', '--allow-empty'])

    expect(result.stdout + result.stderr).toContain('lint-staged could not find any staged files')
    expect(result.status).toBe(0)
  }, 120000)

  it('o lint-staged não falha com índice vazio', () => {
    const repo = createFixture()
    writeChange(repo)

    const result = runLintStaged(repo)

    expect(result.status).toBe(0)
  }, 120000)

  it('a mensagem de índice vazio distingue-se da mensagem de tarefa sem correspondência', () => {
    const repo = createFixture()
    writeChange(repo)

    // Índice vazio: `lint-staged could not find any staged files.`
    const empty = runLintStaged(repo)
    expect(empty.stdout + empty.stderr).toContain('lint-staged could not find any staged files.')
    expect(empty.stdout + empty.stderr).not.toContain('matching configured tasks')
    expect(empty.status).toBe(0)

    // Índice com ficheiros que não correspondem a nenhuma tarefa: a mensagem
    // é diferente, `lint-staged could not find any staged files matching
    // configured tasks.`
    writeFileSync(join(repo, 'dados.bin'), 'conteudo\n', 'utf8')
    git(repo, ['add', '--', 'dados.bin'])

    const unmatched = runLintStaged(repo)
    expect(unmatched.stdout + unmatched.stderr).toContain(
      'lint-staged could not find any staged files matching configured tasks.',
    )
    expect(unmatched.status).toBe(0)
  }, 120000)

  it('as invocações directas do lint-staged correm contra o índice da fixture', () => {
    const repo = createFixture()
    writeChange(repo)

    // Um ficheiro Markdown preparado só na fixture. Se o `lint-staged` usasse
    // o índice do repositório real, este ficheiro não seria visto, e o
    // resultado seria a mensagem de índice vazio em vez do Prettier aplicado.
    const target = join(repo, 'NOTAS.md')
    writeFileSync(target, '# Notas\n\n-   item  um\n', 'utf8')
    git(repo, ['add', '--', 'NOTAS.md'])

    const result = runLintStaged(repo)

    expect(result.status).toBe(0)
    // O `lint-staged` viu o ficheiro preparado da fixture: a mensagem de
    // índice vazio não aparece.
    expect(result.stdout + result.stderr).not.toContain('could not find any staged files')
    // E o Prettier actou sobre ele.
    expect(readFileSync(target, 'utf8')).toContain('- item um')
  }, 120000)

  it('o ambiente da fixture nunca aponta para o repositório real', () => {
    const repo = createFixture()
    const { gitDir, workTree, indexFile } = gitPaths(repo)
    const env = fixtureEnv(repo)

    expect(env.GIT_DIR).toBe(gitDir)
    expect(env.GIT_WORK_TREE).toBe(workTree)
    expect(env.GIT_INDEX_FILE).toBe(indexFile)
    expect(env.GIT_DIR).toContain(workDir)
    expect(env.GIT_WORK_TREE).toContain(workDir)
    expect(env.GIT_INDEX_FILE).toContain(workDir)

    // O `core.hooksPath` da fixture aponta para os hooks da fixture, e não
    // para os do repositório real.
    const hooksPath = git(repo, ['config', '--get', 'core.hooksPath']).trim()
    expect(hooksPath).toBe('.husky/_')
    expect(git(repo, ['rev-parse', '--git-dir']).trim()).toContain(workDir)
  }, 120000)

  it('o lint-staged ignora um GIT_INDEX_FILE herdado e usa o da fixture', () => {
    const repo = createFixture()
    writeChange(repo)

    // Simula um ambiente herdado que aponta para outro repositório: é o
    // caso que fez as revisões A e B reprovarem. O `lint-staged` remove
    // `GIT_DIR` e `GIT_WORK_TREE` do ambiente, mas mantém `GIT_INDEX_FILE`.
    const outro = join(workDir, 'outro')
    mkdirSync(outro, { recursive: true })
    const outroGitDir = join(outro, '.git')
    mkdirSync(outroGitDir, { recursive: true })
    git(outro, ['init', '--initial-branch=main'])

    const target = join(repo, 'NOTAS.md')
    writeFileSync(target, '# Notas\n\n-   item  um\n', 'utf8')
    git(repo, ['add', '--', 'NOTAS.md'])

    const env = {
      ...fixtureEnv(repo),
      GIT_DIR: outroGitDir,
      GIT_WORK_TREE: outro,
      GIT_INDEX_FILE: join(outroGitDir, 'index'),
    }
    env.PATH = `${join(REPO_ROOT, 'node_modules', '.bin')}${delimiter}${env.PATH}`

    const result = spawnSync(
      process.execPath,
      [LINT_STAGED_BIN, '--config', join(repo, 'package.json')],
      { cwd: repo, encoding: 'utf8', env },
    )

    // O `lint-staged` não corrige o `GIT_INDEX_FILE`: com o índice herdaado,
    // o ficheiro preparado na fixture não é visto, e o Prettier não actua.
    // É por isso que o ambiente da fixture tem de fixar o índice.
    expect(result.status).toBe(0)
    expect(readFileSync(target, 'utf8')).toContain('-   item  um')
    expect(git(outro, ['status', '--porcelain']).trim()).toBe('')

    // Com o índice fixado na fixture, o mesmo comando vê e formata o
    // ficheiro preparado.
    const isolado = runLintStaged(repo)
    expect(isolado.status).toBe(0)
    expect(readFileSync(target, 'utf8')).toContain('- item um')
  }, 120000)

  it('as invocações do lint-staged ignoram um ambiente Git herdado', () => {
    const repo = createFixture()
    writeChange(repo)

    const outro = join(workDir, 'outro')
    mkdirSync(outro, { recursive: true })
    const outroGitDir = join(outro, '.git')
    mkdirSync(outroGitDir, { recursive: true })
    git(outro, ['init', '--initial-branch=main'])

    const target = join(repo, 'NOTAS.md')
    writeFileSync(target, '# Notas\n\n-   item  um\n', 'utf8')
    git(repo, ['add', '--', 'NOTAS.md'])

    // Um ambiente herdado que aponta para outro repositório é o cenário que
    // as revisões A e B apontaram: se o teste o herdasse, o `lint-staged`
    // operaria sobre o índice errado e o ficheiro preparado da fixture
    // ficaria por formatar.
    const original = {
      GIT_DIR: process.env.GIT_DIR,
      GIT_WORK_TREE: process.env.GIT_WORK_TREE,
      GIT_INDEX_FILE: process.env.GIT_INDEX_FILE,
    }
    process.env.GIT_DIR = outroGitDir
    process.env.GIT_WORK_TREE = outro
    process.env.GIT_INDEX_FILE = join(outroGitDir, 'index')
    try {
      const result = runLintStaged(repo)

      expect(result.status).toBe(0)
      expect(readFileSync(target, 'utf8')).toContain('- item um')
      expect(git(outro, ['status', '--porcelain']).trim()).toBe('')
    } finally {
      for (const [key, value] of Object.entries(original)) {
        if (value === undefined) {
          delete process.env[key]
        } else {
          process.env[key] = value
        }
      }
    }
  }, 120000)
})
