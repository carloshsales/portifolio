/**
 * Testes de nível de CLI do RawSpec v2.
 *
 * Cobrem a invocação real de `scripts/rawspec-v2-cli.mjs` como processo
 * separado, com um `gh` falso no `PATH`. Não há acesso à rede: o `gh` falso
 * responde a partir de respostas preparadas em cada teste.
 */

import { execFileSync, spawnSync } from 'node:child_process'
import {
  chmodSync,
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { delimiter, dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { parseArgs, parseBooleanFlag } from './rawspec-v2-cli.mjs'

const CLI_PATH = join(dirname(fileURLToPath(import.meta.url)), 'rawspec-v2-cli.mjs')

let workDir

beforeEach(() => {
  workDir = mkdtempSync(join(tmpdir(), 'rawspec-cli-'))
})

afterEach(() => {
  rmSync(workDir, { recursive: true, force: true })
})

/**
 * Executa um comando Git dentro de um repositório isolado.
 *
 * @param {string} repo directório do repositório.
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
 * Cria um repositório isolado com uma mudança e uma tarefa concluída.
 *
 * O repositório tem um remote `origin` local, porque o GitHub CLI recusa
 * procurar pull requests num repositório sem remotes.
 *
 * @returns {string} caminho do repositório.
 */
function createRepo() {
  const repo = join(workDir, 'repo')
  const gitDir = join(repo, '.git')
  mkdirSync(gitDir, { recursive: true })
  execFileSync('git', ['init', '--initial-branch=main'], {
    cwd: repo,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, GIT_DIR: gitDir, GIT_WORK_TREE: repo },
  })
  git(repo, ['config', 'user.email', 'test@example.com'])
  git(repo, ['config', 'user.name', 'Test'])
  git(repo, ['config', 'commit.gpgsign', 'false'])
  writeFileSync(join(repo, 'README.md'), '# Teste\n', 'utf8')
  git(repo, ['add', '-A'])
  git(repo, ['commit', '-m', 'chore: inicial'])

  const bare = join(workDir, 'remote.git')
  mkdirSync(bare, { recursive: true })
  const bareEnv = { ...process.env }
  delete bareEnv.GIT_WORK_TREE
  execFileSync('git', ['init', '--bare'], {
    cwd: bare,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...bareEnv, GIT_DIR: bare },
  })
  git(repo, ['remote', 'add', 'origin', bare])

  const changeDir = join(repo, 'specs', 'changes', '004-test')
  mkdirSync(join(changeDir, 'tasks'), { recursive: true })
  writeFileSync(
    join(changeDir, 'proposal.md'),
    '# Mudança 004-test\n\n- Status: APPROVED\n\n## 1. Objetivo\n\nTeste.\n',
    'utf8',
  )
  writeFileSync(
    join(changeDir, 'tasks', 'TASK-001.md'),
    [
      '# TASK-001 — Implementar coisa',
      '',
      '- Change: 004-test',
      '- Status: COMPLETED',
      '- Depende de: nenhuma',
      '- Verificação: VERIFIED',
      '- Evidência: testes aprovados',
      '',
      '## Objetivo',
      '',
      'Implementar a coisa.',
      '',
    ].join('\n'),
    'utf8',
  )
  git(repo, ['add', '-A'])
  git(repo, ['commit', '-m', 'chore: mudança'])
  return repo
}

/**
 * Preload partilhado pelos executáveis falsos.
 *
 * No Windows, um ficheiro `.cmd` não pode ser executado pelo Node sem shell, e
 * um shell abriria espaço para injecção de comandos. A solução é copiar o
 * próprio `node.exe` para `gh.exe` e `pnpm.exe`, e carregar este ficheiro com
 * `NODE_OPTIONS=--require`. O preload corre antes de o Node tentar carregar o
 * primeiro argumento como módulo principal, e decide, pelo nome do executável,
 * se responde ou se deixa passar.
 *
 * @param {string} binDir directório dos executáveis falsos.
 * @param {string[]} responses respostas do `gh`, por chamada.
 * @returns {string} valor de `NODE_OPTIONS`, vazio fora do Windows.
 */
function writeFakePreload(binDir, responses) {
  if (process.platform !== 'win32') return ''

  const logPath = join(binDir, 'gh-calls.log')
  const preloadPath = join(binDir, 'fake-preload.cjs')
  writeFileSync(
    preloadPath,
    [
      `const fs = require('node:fs')`,
      `const path = require('node:path')`,
      `const responses = ${JSON.stringify(responses)}`,
      `const logPath = ${JSON.stringify(logPath)}`,
      `const name = path.basename(process.argv[0] ?? '').toLowerCase()`,
      `if (name === 'pnpm.exe') {`,
      `  process.stdout.write('verificacao falsa ok\\n')`,
      `  process.exit(0)`,
      `}`,
      `if (name !== 'gh.exe') return`,
      // O Windows passa o primeiro argumento como caminho do módulo principal,
      // por isso o nome do subcomando é reconstruído a partir do basename.
      `const args = process.argv[1] && process.argv[1].endsWith('.js')`,
      `  ? process.argv.slice(2)`,
      `  : [path.basename(process.argv[1] ?? ''), ...process.argv.slice(2)]`,
      `const calls = fs.existsSync(logPath) ? fs.readFileSync(logPath, 'utf8') : ''`,
      `const count = calls.split('\\n').filter((line) => line.trim() !== '').length`,
      `fs.appendFileSync(logPath, JSON.stringify(args) + '\\n')`,
      `const raw = responses[Math.min(count, responses.length - 1)] ?? ''`,
      `const [code, stdout = '', stderr = ''] = raw.split('|')`,
      `if (stdout) process.stdout.write(stdout + '\\n')`,
      `if (stderr) process.stderr.write(stderr + '\\n')`,
      `process.exit(Number(code) || 0)`,
    ].join('\n'),
    'utf8',
  )
  copyFileSync(process.execPath, join(binDir, 'gh.exe'))
  copyFileSync(process.execPath, join(binDir, 'pnpm.exe'))
  return `--require=${preloadPath}`
}

/**
 * Cria um `gh` falso no `PATH`, que responde segundo um guião de respostas.
 *
 * Cada resposta corresponde a uma chamada, pela ordem em que o `gh` é
 * invocado. A resposta é escrita como `código|stdout|stderr`, com `stdout` e
 * `stderr` opcionais.
 *
 * @param {string[]} responses respostas por chamada.
 * @returns {{binDir: string, calls: Array<{args: string[]}>, log: string, nodeOptions: string}} directório do guião, chamadas registadas, registo bruto e opções do Node.
 */
function createFakeGh(responses) {
  const binDir = join(workDir, 'bin')
  mkdirSync(binDir, { recursive: true })
  const logPath = join(binDir, 'gh-calls.log')
  writeFileSync(logPath, '', 'utf8')

  const nodeOptions = writeFakePreload(binDir, responses)

  if (!nodeOptions) {
    const ghPath = join(binDir, 'gh')
    writeFileSync(
      ghPath,
      [
        '#!/usr/bin/env node',
        `const fs = require('node:fs')`,
        `const path = require('node:path')`,
        `const responses = ${JSON.stringify(responses)}`,
        `const logPath = ${JSON.stringify(logPath)}`,
        `const args = process.argv.slice(2)`,
        `const calls = fs.existsSync(logPath) ? fs.readFileSync(logPath, 'utf8') : ''`,
        `const count = calls.split('\\n').filter((line) => line.trim() !== '').length`,
        `fs.appendFileSync(logPath, JSON.stringify(args) + '\\n')`,
        `const raw = responses[Math.min(count, responses.length - 1)] ?? ''`,
        `const [code, stdout = '', stderr = ''] = raw.split('|')`,
        `if (stdout) process.stdout.write(stdout + '\\n')`,
        `if (stderr) process.stderr.write(stderr + '\\n')`,
        `process.exit(Number(code) || 0)`,
      ].join('\n'),
      'utf8',
    )
    chmodSync(ghPath, 0o755)
  }

  return {
    binDir,
    log: logPath,
    nodeOptions,
    get calls() {
      const content = readFileSync(logPath, 'utf8')
      return content
        .split('\n')
        .filter((line) => line.trim() !== '')
        .map((line) => JSON.parse(line))
    },
  }
}

/**
 * Cria um `pnpm` falso no `PATH`, que passa todas as verificações.
 *
 * O `commit-task` corre `pnpm lint`, `pnpm typecheck`, `pnpm test` e
 * `pnpm build` antes do commit. Estes testes não devem correr a suíte real do
 * projecto, por isso o `pnpm` falso confirma as verificações sem as executar.
 *
 * No Windows, o executável falso é criado pelo preload partilhado.
 *
 * @returns {string} directório do binário falso.
 */
function createFakePnpm() {
  const binDir = join(workDir, 'bin')
  mkdirSync(binDir, { recursive: true })

  if (process.platform !== 'win32') {
    const pnpmPath = join(binDir, 'pnpm')
    writeFileSync(
      pnpmPath,
      ['#!/usr/bin/env node', `console.log('verificacao falsa ok')`, 'process.exit(0)'].join('\n'),
      'utf8',
    )
    chmodSync(pnpmPath, 0o755)
  }

  return binDir
}

/**
 * Executa a CLI num repositório isolado.
 *
 * @param {string[]} args argumentos da CLI.
 * @param {{repo: string, binDir?: string, nodeOptions?: string, isolatedPath?: boolean, branch?: string}} options repositório, directório do `gh` falso, opções do Node, isolamento do `PATH` e branch da tarefa.
 * @returns {{status: number, stdout: string, stderr: string}} resultado do processo.
 */
function runCli(args, { repo, binDir, nodeOptions = '', isolatedPath = false, branch }) {
  const path = isolatedPath
    ? (binDir ?? '')
    : binDir
      ? `${binDir}${delimiter}${process.env.PATH ?? ''}`
      : process.env.PATH
  const env = {
    ...process.env,
    PATH: path,
    RAWSPEC_REPO_ROOT: repo,
  }
  if (nodeOptions) {
    env.NODE_OPTIONS = nodeOptions
  } else {
    delete env.NODE_OPTIONS
  }
  if (branch) {
    args = [...args, '--branch', branch]
  }
  return spawnSync(process.execPath, [CLI_PATH, ...args], {
    cwd: repo,
    encoding: 'utf8',
    env,
  })
}

/**
 * Interpreta a saída JSON da CLI.
 *
 * @param {string} output saída do processo.
 * @returns {unknown} conteúdo do JSON.
 */
function parseJson(output) {
  return JSON.parse(output)
}

describe('parsing das flags da CLI', () => {
  it('trata --no-push como flag booleana antes do identificador', () => {
    const args = parseArgs(['--no-push', 'TASK-001'])

    expect(args['no-push']).toBe(true)
    expect(args._).toEqual(['TASK-001'])
  })

  it('trata --no-pr como flag booleana antes do identificador', () => {
    const args = parseArgs(['--no-pr', 'TASK-001'])

    expect(args['no-pr']).toBe(true)
    expect(args._).toEqual(['TASK-001'])
  })

  it('trata --no-push e --no-pr como flags booleanas depois do identificador', () => {
    const args = parseArgs(['TASK-001', '--no-push', '--no-pr'])

    expect(args['no-push']).toBe(true)
    expect(args['no-pr']).toBe(true)
    expect(args._).toEqual(['TASK-001'])
  })

  it('não consome o valor seguinte em --no-push nem em --no-pr', () => {
    const args = parseArgs(['--no-push', '--no-pr', 'TASK-001', '--base', 'develop'])

    expect(args['no-push']).toBe(true)
    expect(args['no-pr']).toBe(true)
    expect(args.base).toBe('develop')
    expect(args._).toEqual(['TASK-001'])
  })

  it('mantém o valor das flags com argumento', () => {
    const args = parseArgs(['TASK-001', '--change', '004-test', '--branch', 'task/x'])

    expect(args.change).toBe('004-test')
    expect(args.branch).toBe('task/x')
  })

  it('interpreta --approved e --adr como booleanos', () => {
    expect(parseArgs(['--approved']).approved).toBe(true)
    expect(parseArgs(['--adr']).adr).toBe(true)
  })

  it('interpreta a forma --flag=false', () => {
    expect(parseBooleanFlag('false')).toBe(false)
    expect(parseBooleanFlag('true')).toBe(true)
    expect(parseBooleanFlag(true)).toBe(true)
    expect(parseBooleanFlag(undefined)).toBe(false)
  })

  it('separa o sufixo depois do = antes de classificar a flag', () => {
    const args = parseArgs(['--no-pr=false', 'TASK-001'])

    expect(args['no-pr']).toBe(false)
    expect(args._).toEqual(['TASK-001'])
  })

  it('interpreta --no-pr=false e --no-push=false', () => {
    const args = parseArgs(['--no-pr=false', '--no-push=false', 'TASK-001'])

    expect(args['no-pr']).toBe(false)
    expect(args['no-push']).toBe(false)
    expect(args._).toEqual(['TASK-001'])
  })

  it('interpreta --approved=false e --adr=false', () => {
    const args = parseArgs(['--approved=false', '--adr=false', 'TASK-001'])

    expect(args.approved).toBe(false)
    expect(args.adr).toBe(false)
    expect(args._).toEqual(['TASK-001'])
  })

  it('interpreta --no-pr=true e --no-push=true', () => {
    const args = parseArgs(['--no-pr=true', '--no-push=true', 'TASK-001'])

    expect(args['no-pr']).toBe(true)
    expect(args['no-push']).toBe(true)
    expect(args._).toEqual(['TASK-001'])
  })

  it('não consome o token seguinte numa flag booleana com sufixo', () => {
    const args = parseArgs(['--no-pr=false', 'TASK-001', '--base', 'develop'])

    expect(args['no-pr']).toBe(false)
    expect(args.base).toBe('develop')
    expect(args._).toEqual(['TASK-001'])
  })

  it('aceita o sufixo em maiúsculas e minusculas', () => {
    expect(parseArgs(['--no-pr=FALSE'])['no-pr']).toBe(false)
    expect(parseArgs(['--no-pr=False'])['no-pr']).toBe(false)
    expect(parseArgs(['--no-pr=TRUE'])['no-pr']).toBe(true)
  })

  it('mantém o valor de flags que não são booleanas com sufixo', () => {
    const args = parseArgs(['TASK-001', '--base=develop', '--change=004-test'])

    expect(args.base).toBe('develop')
    expect(args.change).toBe('004-test')
    expect(args._).toEqual(['TASK-001'])
  })
})

/**
 * Timeout dos testes que correm a CLI contra um repositório Git real.
 *
 * Estes testes fazem operações de Git — init, commit, push e fetch — em
 * diretórios temporários. O valor por omissão do Vitest, 5000 ms, deixa-os
 * à beira do limite: quando a máquina está ocupada, um teste que demora 3 s
 * normalmente falha por timeout, sem que nada esteja errado. O timeout
 * explícito dá margem para a variabilidade do sistema de ficheiros, sem
 * esconder uma falha real.
 */
const CLI_INTEGRATION_TIMEOUT = 30_000

/**
 * Declara um teste de integração, com o timeout adequado.
 *
 * @param {string} name nome do teste.
 * @param {() => void} fn corpo do teste.
 */
function itIntegration(name, fn) {
  it(name, fn, CLI_INTEGRATION_TIMEOUT)
}

/**
 * Cria um repositório isolado com a branch de tarefa activa.
 *
 * O pull request só faz sentido a partir de uma branch de tarefa: um pull
 * request da branch base para ela própria é rejeitado.
 *
 * @param {string} [branch] nome da branch de tarefa.
 * @returns {string} caminho do repositório.
 */
function createRepoOnTaskBranch(branch = 'task/004-001-implementar-coisa') {
  const repo = createRepo()
  git(repo, ['checkout', '-b', branch])
  return repo
}

describe('open-pr na CLI', () => {
  itIntegration('abre o pull request e devolve o URL em JSON', () => {
    const repo = createRepoOnTaskBranch()
    const gh = createFakeGh(['0|[]|', '0|https://github.com/acme/site/pull/42|'])

    const result = runCli(['open-pr', 'TASK-001', '--change', '004-test'], {
      repo,
      binDir: gh.binDir,
      nodeOptions: gh.nodeOptions,
    })

    expect(result.status, result.stderr).toBe(0)
    const payload = parseJson(result.stdout)
    expect(payload.status, result.stdout).toBe('created')
    expect(payload.url).toBe('https://github.com/acme/site/pull/42')
    expect(payload.number).toBe(42)
    expect(payload.branch).toBe('task/004-001-implementar-coisa')
    expect(payload.base).toBe('main')

    expect(gh.calls).toHaveLength(2)
    expect(gh.calls[0].slice(0, 2)).toEqual(['pr', 'list'])
    expect(gh.calls[0]).toContain('--head')
    expect(gh.calls[0]).toContain('--base')
    expect(gh.calls[1].slice(0, 2)).toEqual(['pr', 'create'])
    expect(gh.calls[1]).toContain('--base')
    expect(gh.calls[1]).toContain('--head')
  })

  itIntegration('usa a branch base pedida', () => {
    const repo = createRepoOnTaskBranch()
    const gh = createFakeGh(['0|[]|', '0|https://github.com/acme/site/pull/42|'])

    const result = runCli(['open-pr', 'TASK-001', '--change', '004-test', '--base', 'develop'], {
      repo,
      binDir: gh.binDir,
      nodeOptions: gh.nodeOptions,
    })

    expect(result.status).toBe(0)
    expect(parseJson(result.stdout).base).toBe('develop')
    expect(gh.calls[0][gh.calls[0].indexOf('--base') + 1]).toBe('develop')
    expect(gh.calls[1][gh.calls[1].indexOf('--base') + 1]).toBe('develop')
  })

  itIntegration('não cria duplicado quando já existe pull request para a branch', () => {
    const repo = createRepoOnTaskBranch()
    const gh = createFakeGh([
      '0|[{"number":7,"url":"https://github.com/acme/site/pull/7","state":"OPEN",' +
        '"title":"004-test — TASK-001 — Implementar coisa"}]|',
    ])

    const result = runCli(['open-pr', 'TASK-001', '--change', '004-test'], {
      repo,
      binDir: gh.binDir,
      nodeOptions: gh.nodeOptions,
    })

    expect(result.status).toBe(0)
    const payload = parseJson(result.stdout)
    expect(payload.status).toBe('existing')
    expect(payload.url).toBe('https://github.com/acme/site/pull/7')
    expect(payload.number).toBe(7)
    expect(payload.title).toBe('004-test — TASK-001 — Implementar coisa')
    expect(gh.calls).toHaveLength(1)
    expect(gh.calls[0][0]).toBe('pr')
  })

  itIntegration('reporta E_PR_UNAVAILABLE e sai com 8 quando o gh não está disponível', () => {
    const repo = createRepoOnTaskBranch()
    const binDir = join(workDir, 'empty-bin')
    mkdirSync(binDir, { recursive: true })
    const gh = createFakeGh(['0|[]|', '0|https://github.com/acme/site/pull/42|'])

    const result = runCli(['open-pr', 'TASK-001', '--change', '004-test'], {
      repo,
      binDir,
      isolatedPath: true,
      branch: 'task/004-001-implementar-coisa',
    })

    expect(result.status).toBe(8)
    const payload = parseJson(result.stderr)
    expect(payload.error.code).toBe('E_PR_UNAVAILABLE')
    expect(payload.error.message).not.toBe('')
    expect(payload.error.message).toContain('gh')
    expect(gh.calls).toHaveLength(0)
  })

  itIntegration(
    'reporta E_PR_UNAVAILABLE e sai com 8 quando a procura falha com o gh instalado',
    () => {
      const repo = createRepoOnTaskBranch()
      const gh = createFakeGh(['1||gh: cannot connect'])

      const result = runCli(['open-pr', 'TASK-001', '--change', '004-test'], {
        repo,
        binDir: gh.binDir,
        nodeOptions: gh.nodeOptions,
      })

      expect(result.status).toBe(8)
      const payload = parseJson(result.stderr)
      expect(payload.error.code).toBe('E_PR_UNAVAILABLE')
      expect(payload.error.message).toContain('cannot connect')
      expect(gh.calls).toHaveLength(1)
      expect(gh.calls[0].slice(0, 2)).toEqual(['pr', 'list'])
    },
  )

  itIntegration('reporta E_PR_CREATE_FAILED e sai com 8 quando a criação falha', () => {
    const repo = createRepoOnTaskBranch()
    const gh = createFakeGh(['0|[]|', '1||gh: not authenticated'])

    const result = runCli(['open-pr', 'TASK-001', '--change', '004-test'], {
      repo,
      binDir: gh.binDir,
      nodeOptions: gh.nodeOptions,
    })

    expect(result.status).toBe(8)
    const payload = parseJson(result.stderr)
    expect(payload.error.code).toBe('E_PR_CREATE_FAILED')
    expect(payload.error.message).toContain('not authenticated')
  })

  itIntegration('reporta E_PR_CREATE_FAILED e sai com 8 quando a criação não devolve URL', () => {
    const repo = createRepoOnTaskBranch()
    const gh = createFakeGh(['0|[]|', '0|created|'])

    const result = runCli(['open-pr', 'TASK-001', '--change', '004-test'], {
      repo,
      binDir: gh.binDir,
      nodeOptions: gh.nodeOptions,
    })

    expect(result.status).toBe(8)
    expect(parseJson(result.stderr).error.code).toBe('E_PR_CREATE_FAILED')
  })

  itIntegration('sai com 8 e E_PR_UNAVAILABLE quando a procura devolve JSON inválido', () => {
    const repo = createRepoOnTaskBranch()
    const gh = createFakeGh(['0|isto não é JSON|'])

    const result = runCli(['open-pr', 'TASK-001', '--change', '004-test'], {
      repo,
      binDir: gh.binDir,
      nodeOptions: gh.nodeOptions,
    })

    expect(result.status).toBe(8)
    const payload = parseJson(result.stderr)
    expect(payload.error.code).toBe('E_PR_UNAVAILABLE')
    expect(payload.error.message).toContain('não devolveu JSON')
    expect(payload.error.details.reason).toBe('invalid_json')
    expect(gh.calls).toHaveLength(1)
    expect(gh.calls[0][0]).toBe('pr')
    expect(gh.calls[0][1]).toBe('list')
  })

  itIntegration(
    'sai com 8 e E_PR_UNAVAILABLE quando a procura devolve JSON que não é uma lista',
    () => {
      const repo = createRepoOnTaskBranch()
      const gh = createFakeGh(['0|{"number":7,"url":"https://github.com/acme/site/pull/7"}|'])

      const result = runCli(['open-pr', 'TASK-001', '--change', '004-test'], {
        repo,
        binDir: gh.binDir,
        nodeOptions: gh.nodeOptions,
      })

      expect(result.status).toBe(8)
      const payload = parseJson(result.stderr)
      expect(payload.error.code).toBe('E_PR_UNAVAILABLE')
      expect(payload.error.message).toContain('não é uma lista')
      expect(payload.error.details.reason).toBe('not_a_list')
      expect(gh.calls).toHaveLength(1)
      expect(gh.calls[0][1]).toBe('list')
    },
  )

  itIntegration('sai com 8 e E_PR_UNAVAILABLE quando a procura devolve saída vazia', () => {
    const repo = createRepoOnTaskBranch()
    const gh = createFakeGh(['0||'])

    const result = runCli(['open-pr', 'TASK-001', '--change', '004-test'], {
      repo,
      binDir: gh.binDir,
      nodeOptions: gh.nodeOptions,
    })

    expect(result.status).toBe(8)
    const payload = parseJson(result.stderr)
    expect(payload.error.code).toBe('E_PR_UNAVAILABLE')
    expect(payload.error.message).toContain('saída vazia')
    expect(payload.error.details.reason).toBe('empty_output')
    expect(gh.calls).toHaveLength(1)
    expect(gh.calls[0][1]).toBe('list')
  })

  itIntegration(
    'sai com 8 e E_PR_UNAVAILABLE quando a lista traz um pull request malformado',
    () => {
      const repo = createRepoOnTaskBranch()
      const gh = createFakeGh(['0|[{"number":7}]|'])

      const result = runCli(['open-pr', 'TASK-001', '--change', '004-test'], {
        repo,
        binDir: gh.binDir,
        nodeOptions: gh.nodeOptions,
      })

      expect(result.status).toBe(8)
      const payload = parseJson(result.stderr)
      expect(payload.error.code).toBe('E_PR_UNAVAILABLE')
      expect(payload.error.message).toContain('malformado')
      expect(payload.error.details.reason).toBe('malformed_entry')
      expect(gh.calls).toHaveLength(1)
      expect(gh.calls[0][1]).toBe('list')
    },
  )

  itIntegration('não cria pull request quando a resposta da procura é inválida', () => {
    const repo = createRepoOnTaskBranch()
    const gh = createFakeGh(['0|{"unexpected":true}|', '0|https://github.com/acme/site/pull/42|'])

    const result = runCli(['open-pr', 'TASK-001', '--change', '004-test'], {
      repo,
      binDir: gh.binDir,
      nodeOptions: gh.nodeOptions,
    })

    expect(result.status).toBe(8)
    expect(gh.calls).toHaveLength(1)
    expect(gh.calls.some((call) => call[1] === 'create')).toBe(false)
  })

  itIntegration('sai com 8 e E_PR_UNAVAILABLE quando o número do pull request é nulo', () => {
    const repo = createRepoOnTaskBranch()
    const gh = createFakeGh([
      '0|[{"number":null,"url":"https://github.com/acme/site/pull/7"}]|',
      '0|https://github.com/acme/site/pull/42|',
    ])

    const result = runCli(['open-pr', 'TASK-001', '--change', '004-test'], {
      repo,
      binDir: gh.binDir,
      nodeOptions: gh.nodeOptions,
    })

    expect(result.status).toBe(8)
    const payload = parseJson(result.stderr)
    expect(payload.error.code).toBe('E_PR_UNAVAILABLE')
    expect(payload.error.details.reason).toBe('malformed_entry')
    expect(gh.calls).toHaveLength(1)
    expect(gh.calls[0][1]).toBe('list')
    expect(gh.calls.some((call) => call[1] === 'create')).toBe(false)
  })

  itIntegration('sai com 8 e E_PR_UNAVAILABLE quando o número do pull request é booleano', () => {
    const repo = createRepoOnTaskBranch()
    const gh = createFakeGh([
      '0|[{"number":true,"url":"https://github.com/acme/site/pull/7"}]|',
      '0|https://github.com/acme/site/pull/42|',
    ])

    const result = runCli(['open-pr', 'TASK-001', '--change', '004-test'], {
      repo,
      binDir: gh.binDir,
      nodeOptions: gh.nodeOptions,
    })

    expect(result.status).toBe(8)
    const payload = parseJson(result.stderr)
    expect(payload.error.code).toBe('E_PR_UNAVAILABLE')
    expect(payload.error.details.reason).toBe('malformed_entry')
    expect(gh.calls).toHaveLength(1)
    expect(gh.calls.some((call) => call[1] === 'create')).toBe(false)
  })

  itIntegration('sai com 8 e E_PR_UNAVAILABLE quando o número do pull request é falso', () => {
    const repo = createRepoOnTaskBranch()
    const gh = createFakeGh([
      '0|[{"number":false,"url":"https://github.com/acme/site/pull/7"}]|',
      '0|https://github.com/acme/site/pull/42|',
    ])

    const result = runCli(['open-pr', 'TASK-001', '--change', '004-test'], {
      repo,
      binDir: gh.binDir,
      nodeOptions: gh.nodeOptions,
    })

    expect(result.status).toBe(8)
    const payload = parseJson(result.stderr)
    expect(payload.error.code).toBe('E_PR_UNAVAILABLE')
    expect(payload.error.details.reason).toBe('malformed_entry')
    expect(gh.calls).toHaveLength(1)
    expect(gh.calls.some((call) => call[1] === 'create')).toBe(false)
  })

  itIntegration(
    'sai com 8 e E_PR_UNAVAILABLE quando o número do pull request é uma string vazia',
    () => {
      const repo = createRepoOnTaskBranch()
      const gh = createFakeGh([
        '0|[{"number":"","url":"https://github.com/acme/site/pull/7"}]|',
        '0|https://github.com/acme/site/pull/42|',
      ])

      const result = runCli(['open-pr', 'TASK-001', '--change', '004-test'], {
        repo,
        binDir: gh.binDir,
        nodeOptions: gh.nodeOptions,
      })

      expect(result.status).toBe(8)
      const payload = parseJson(result.stderr)
      expect(payload.error.code).toBe('E_PR_UNAVAILABLE')
      expect(payload.error.details.reason).toBe('malformed_entry')
      expect(gh.calls).toHaveLength(1)
      expect(gh.calls.some((call) => call[1] === 'create')).toBe(false)
    },
  )

  itIntegration(
    'sai com 8 e E_PR_UNAVAILABLE quando o número do pull request é uma string numérica',
    () => {
      const repo = createRepoOnTaskBranch()
      const gh = createFakeGh([
        '0|[{"number":"7","url":"https://github.com/acme/site/pull/7"}]|',
        '0|https://github.com/acme/site/pull/42|',
      ])

      const result = runCli(['open-pr', 'TASK-001', '--change', '004-test'], {
        repo,
        binDir: gh.binDir,
        nodeOptions: gh.nodeOptions,
      })

      expect(result.status).toBe(8)
      const payload = parseJson(result.stderr)
      expect(payload.error.code).toBe('E_PR_UNAVAILABLE')
      expect(payload.error.details.reason).toBe('malformed_entry')
      expect(gh.calls).toHaveLength(1)
      expect(gh.calls.some((call) => call[1] === 'create')).toBe(false)
    },
  )

  itIntegration('sai com 8 e E_PR_UNAVAILABLE quando o número do pull request é zero', () => {
    const repo = createRepoOnTaskBranch()
    const gh = createFakeGh([
      '0|[{"number":0,"url":"https://github.com/acme/site/pull/7"}]|',
      '0|https://github.com/acme/site/pull/42|',
    ])

    const result = runCli(['open-pr', 'TASK-001', '--change', '004-test'], {
      repo,
      binDir: gh.binDir,
      nodeOptions: gh.nodeOptions,
    })

    expect(result.status).toBe(8)
    const payload = parseJson(result.stderr)
    expect(payload.error.code).toBe('E_PR_UNAVAILABLE')
    expect(payload.error.details.reason).toBe('malformed_entry')
    expect(gh.calls).toHaveLength(1)
    expect(gh.calls.some((call) => call[1] === 'create')).toBe(false)
  })

  itIntegration('sai com 8 e E_PR_UNAVAILABLE quando o número do pull request é negativo', () => {
    const repo = createRepoOnTaskBranch()
    const gh = createFakeGh([
      '0|[{"number":-7,"url":"https://github.com/acme/site/pull/7"}]|',
      '0|https://github.com/acme/site/pull/42|',
    ])

    const result = runCli(['open-pr', 'TASK-001', '--change', '004-test'], {
      repo,
      binDir: gh.binDir,
      nodeOptions: gh.nodeOptions,
    })

    expect(result.status).toBe(8)
    const payload = parseJson(result.stderr)
    expect(payload.error.code).toBe('E_PR_UNAVAILABLE')
    expect(payload.error.details.reason).toBe('malformed_entry')
    expect(gh.calls).toHaveLength(1)
    expect(gh.calls.some((call) => call[1] === 'create')).toBe(false)
  })

  itIntegration('sai com 8 e E_PR_UNAVAILABLE quando o número do pull request é um decimal', () => {
    const repo = createRepoOnTaskBranch()
    const gh = createFakeGh([
      '0|[{"number":7.5,"url":"https://github.com/acme/site/pull/7"}]|',
      '0|https://github.com/acme/site/pull/42|',
    ])

    const result = runCli(['open-pr', 'TASK-001', '--change', '004-test'], {
      repo,
      binDir: gh.binDir,
      nodeOptions: gh.nodeOptions,
    })

    expect(result.status).toBe(8)
    const payload = parseJson(result.stderr)
    expect(payload.error.code).toBe('E_PR_UNAVAILABLE')
    expect(payload.error.details.reason).toBe('malformed_entry')
    expect(gh.calls).toHaveLength(1)
    expect(gh.calls.some((call) => call[1] === 'create')).toBe(false)
  })

  itIntegration('recusa um pull request da branch base para ela própria', () => {
    const repo = createRepo()
    const gh = createFakeGh(['0|[]|', '0|https://github.com/acme/site/pull/42|'])

    const result = runCli(['open-pr', 'TASK-001', '--change', '004-test', '--base', 'main'], {
      repo,
      binDir: gh.binDir,
      nodeOptions: gh.nodeOptions,
    })

    expect(result.status).toBe(2)
    expect(parseJson(result.stderr).error.code).toBe('E_ARGS')
    expect(gh.calls).toHaveLength(0)
  })
})

describe('commit-task na CLI', () => {
  /**
   * Prepara um repositório com a branch de tarefa activa.
   *
   * @returns {string} caminho do repositório.
   */
  function createRepoWithRemote() {
    const repo = createRepo()
    const bare = join(workDir, 'remote.git')
    const localUrl = pathToFileURL(bare).href
    git(repo, ['config', `url.${localUrl}.insteadOf`, 'https://github.com/acme/site.git'])
    git(repo, ['remote', 'set-url', 'origin', 'https://github.com/acme/site.git'])
    git(repo, ['checkout', '-b', 'task/004-001-implementar-coisa'])
    return repo
  }

  /**
   * Prepara um repositório com um commit elegível já existente e a árvore limpa.
   *
   * @param {{remote?: string, publishBranch?: boolean, githubRemote?: boolean|string}} options remote, publicação prévia e remote GitHub.
   * @returns {{repo: string, branch: string, head: string, remote: string}} estado do repositório.
   */
  function createRepoWithExistingCommit({
    remote = 'origin',
    publishBranch = false,
    githubRemote = false,
  } = {}) {
    const repo = createRepo()
    let bare
    if (remote !== 'origin') {
      bare = join(workDir, `${remote}.git`)
      mkdirSync(bare, { recursive: true })
      const bareEnv = { ...process.env }
      delete bareEnv.GIT_WORK_TREE
      execFileSync('git', ['init', '--bare'], {
        cwd: bare,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
        env: { ...bareEnv, GIT_DIR: bare },
      })
      git(repo, ['remote', 'add', remote, bare])
    } else {
      bare = join(workDir, 'remote.git')
    }
    const githubUrl =
      githubRemote === 'ssh' ? 'git@github.com:acme/site.git' : 'https://github.com/acme/site.git'
    if (githubRemote) {
      const localUrl = pathToFileURL(bare).href
      git(repo, ['config', `url.${localUrl}.insteadOf`, 'https://github.com/acme/site.git'])
      git(repo, ['config', '--add', `url.${localUrl}.insteadOf`, 'git@github.com:acme/site.git'])
      git(repo, ['remote', 'set-url', remote, githubUrl])
    }

    const taskPath = 'specs/changes/004-test/tasks/TASK-001.md'
    const taskFile = join(repo, taskPath)
    const task = readFileSync(taskFile, 'utf8')
    writeFileSync(taskFile, `${task.trimEnd()}\n\n## Arquivos\n\n- \`src/allowed.ts\`\n`, 'utf8')
    git(repo, ['add', '--', taskPath])
    git(repo, ['commit', '-m', 'docs(rawspec): declarar âmbito da tarefa'])
    git(repo, ['push', remote, 'main'])

    const branch = 'task/004-001-implementar-coisa'
    git(repo, ['checkout', '-b', branch])
    mkdirSync(join(repo, 'src'), { recursive: true })
    writeFileSync(join(repo, 'src', 'allowed.ts'), 'export const allowed = true\n', 'utf8')
    git(repo, ['add', '--', 'src/allowed.ts'])
    git(repo, [
      'commit',
      '-m',
      [
        'feat(rawspec): Implementar coisa',
        '',
        'Change: 004-test',
        'Task: TASK-001',
        'Tests: pnpm test',
        'Evidence: testes aprovados',
        'Action-Plan: none',
      ].join('\n'),
    ])
    const head = git(repo, ['rev-parse', 'HEAD']).trim()
    if (publishBranch) git(repo, ['push', '-u', remote, branch])
    return { repo, branch, head, remote }
  }

  /**
   * Altera o ficheiro da tarefa, para que o commit-task tenha algo a commitar.
   *
   * @param {string} repo directório do repositório.
   */
  function touchTaskFile(repo) {
    const file = join(repo, 'specs', 'changes', '004-test', 'tasks', 'TASK-001.md')
    writeFileSync(file, `${readFileSync(file, 'utf8')}\n<!-- alteração -->\n`, 'utf8')
  }

  itIntegration('abre o pull request depois do push', () => {
    const repo = createRepoWithRemote()
    touchTaskFile(repo)
    const gh = createFakeGh(['0|[]|', '0|https://github.com/acme/site/pull/11|'])
    createFakePnpm()

    const result = runCli(['commit-task', 'TASK-001', '--change', '004-test'], {
      repo,
      binDir: gh.binDir,
      nodeOptions: gh.nodeOptions,
    })

    expect(result.status, result.stderr).toBe(0)
    const payload = parseJson(result.stdout)
    expect(payload.pushed).toBe(true)
    expect(payload.commit).not.toBe('')
    expect(payload.pullRequest.status).toBe('created')
    expect(payload.pullRequest.url).toBe('https://github.com/acme/site/pull/11')
    expect(gh.calls).toHaveLength(2)
    expect(gh.calls[1].slice(0, 2)).toEqual(['pr', 'create'])
  })

  itIntegration('não duplica o pull request quando já existe um aberto', () => {
    const repo = createRepoWithRemote()
    touchTaskFile(repo)
    const gh = createFakeGh([
      '0|[{"number":3,"url":"https://github.com/acme/site/pull/3","state":"OPEN"}]|',
    ])
    createFakePnpm()

    const result = runCli(['commit-task', 'TASK-001', '--change', '004-test'], {
      repo,
      binDir: gh.binDir,
      nodeOptions: gh.nodeOptions,
    })

    expect(result.status).toBe(0)
    const payload = parseJson(result.stdout)
    expect(payload.pushed).toBe(true)
    expect(payload.pullRequest.status).toBe('existing')
    expect(payload.pullRequest.url).toBe('https://github.com/acme/site/pull/3')
    expect(gh.calls).toHaveLength(1)
  })

  itIntegration('não desfaz o commit nem o push quando o pull request falha', () => {
    const repo = createRepoWithRemote()
    touchTaskFile(repo)
    const gh = createFakeGh(['1||gh: not authenticated'])
    createFakePnpm()

    const result = runCli(['commit-task', 'TASK-001', '--change', '004-test'], {
      repo,
      binDir: gh.binDir,
      nodeOptions: gh.nodeOptions,
    })

    expect(result.status).toBe(0)
    const payload = parseJson(result.stdout)
    expect(payload.pushed).toBe(true)
    expect(payload.commit).not.toBe('')
    expect(payload.pullRequest.status).toBe('failed')
    expect(payload.pullRequest.error.code).toBe('E_PR_UNAVAILABLE')
    expect(payload.pullRequest.url).toBeNull()
    expect(git(repo, ['branch', '-r'])).toContain('origin/task/004-001-implementar-coisa')
    expect(git(repo, ['status', '--porcelain'])).not.toContain('TASK-001.md')
  })

  itIntegration('não desfaz o commit nem o push quando a resposta da procura é inválida', () => {
    const repo = createRepoWithRemote()
    touchTaskFile(repo)
    const gh = createFakeGh(['0|resposta inválida|', '0|https://github.com/acme/site/pull/11|'])
    createFakePnpm()

    const result = runCli(['commit-task', 'TASK-001', '--change', '004-test'], {
      repo,
      binDir: gh.binDir,
      nodeOptions: gh.nodeOptions,
    })

    expect(result.status).toBe(0)
    const payload = parseJson(result.stdout)
    expect(payload.pushed).toBe(true)
    expect(payload.commit).not.toBe('')
    expect(payload.pullRequest.status).toBe('failed')
    expect(payload.pullRequest.error.code).toBe('E_PR_UNAVAILABLE')
    expect(payload.pullRequest.error.message).toContain('não devolveu JSON')
    expect(payload.pullRequest.url).toBeNull()
    expect(gh.calls).toHaveLength(1)
    expect(gh.calls.some((call) => call[1] === 'create')).toBe(false)
    expect(git(repo, ['branch', '-r'])).toContain('origin/task/004-001-implementar-coisa')
    expect(git(repo, ['status', '--porcelain'])).not.toContain('TASK-001.md')
  })

  itIntegration(
    'não desfaz o commit nem o push quando o número do pull request é malformado',
    () => {
      const repo = createRepoWithRemote()
      touchTaskFile(repo)
      const gh = createFakeGh([
        '0|[{"number":null,"url":"https://github.com/acme/site/pull/3"}]|',
        '0|https://github.com/acme/site/pull/11|',
      ])
      createFakePnpm()

      const result = runCli(['commit-task', 'TASK-001', '--change', '004-test'], {
        repo,
        binDir: gh.binDir,
        nodeOptions: gh.nodeOptions,
      })

      expect(result.status).toBe(0)
      const payload = parseJson(result.stdout)
      expect(payload.pushed).toBe(true)
      expect(payload.commit).not.toBe('')
      expect(payload.pullRequest.status).toBe('failed')
      expect(payload.pullRequest.error.code).toBe('E_PR_UNAVAILABLE')
      expect(payload.pullRequest.error.details.reason).toBe('malformed_entry')
      expect(payload.pullRequest.url).toBeNull()
      expect(gh.calls).toHaveLength(1)
      expect(gh.calls.some((call) => call[1] === 'create')).toBe(false)
      expect(git(repo, ['branch', '-r'])).toContain('origin/task/004-001-implementar-coisa')
      expect(git(repo, ['status', '--porcelain'])).not.toContain('TASK-001.md')
    },
  )

  itIntegration('não abre pull request com a flag --no-pr', () => {
    const repo = createRepoWithRemote()
    touchTaskFile(repo)
    const gh = createFakeGh(['0|[]|', '0|https://github.com/acme/site/pull/11|'])
    createFakePnpm()

    const result = runCli(['commit-task', 'TASK-001', '--change', '004-test', '--no-pr'], {
      repo,
      binDir: gh.binDir,
      nodeOptions: gh.nodeOptions,
    })

    expect(result.status).toBe(0)
    const payload = parseJson(result.stdout)
    expect(payload.pushed).toBe(true)
    expect(payload.pullRequest).toBeNull()
    expect(gh.calls).toHaveLength(0)
  })

  itIntegration('com --no-pr=false abre o pull request, ao contrário de --no-pr', () => {
    const repo = createRepoWithRemote()
    touchTaskFile(repo)
    const gh = createFakeGh(['0|[]|', '0|https://github.com/acme/site/pull/11|'])
    createFakePnpm()

    const result = runCli(['commit-task', 'TASK-001', '--change', '004-test', '--no-pr=false'], {
      repo,
      binDir: gh.binDir,
      nodeOptions: gh.nodeOptions,
    })

    expect(result.status, result.stderr).toBe(0)
    const payload = parseJson(result.stdout)
    expect(payload.pushed).toBe(true)
    expect(payload.pullRequest.status).toBe('created')
    expect(payload.pullRequest.url).toBe('https://github.com/acme/site/pull/11')
    expect(gh.calls).toHaveLength(2)
  })

  itIntegration('com --no-push=false faz o push, ao contrário de --no-push', () => {
    const repo = createRepoWithRemote()
    touchTaskFile(repo)
    const gh = createFakeGh(['0|[]|', '0|https://github.com/acme/site/pull/11|'])
    createFakePnpm()

    const result = runCli(['commit-task', 'TASK-001', '--change', '004-test', '--no-push=false'], {
      repo,
      binDir: gh.binDir,
      nodeOptions: gh.nodeOptions,
    })

    expect(result.status, result.stderr).toBe(0)
    const payload = parseJson(result.stdout)
    expect(payload.pushed).toBe(true)
    expect(payload.pullRequest.status).toBe('created')
    expect(git(repo, ['branch', '-r'])).toContain('origin/task/004-001-implementar-coisa')
  })

  itIntegration(
    'com --no-pr o push continua a ser feito, e com --no-push o push não é feito',
    () => {
      const repo = createRepoWithRemote()
      touchTaskFile(repo)
      const gh = createFakeGh(['0|[]|', '0|https://github.com/acme/site/pull/11|'])
      createFakePnpm()

      const comNoPr = runCli(['commit-task', 'TASK-001', '--change', '004-test', '--no-pr'], {
        repo,
        binDir: gh.binDir,
        nodeOptions: gh.nodeOptions,
      })

      expect(comNoPr.status).toBe(0)
      expect(parseJson(comNoPr.stdout).pushed).toBe(true)
      expect(git(repo, ['branch', '-r'])).toContain('origin/task/004-001-implementar-coisa')

      touchTaskFile(repo)
      const comNoPush = runCli(['commit-task', 'TASK-001', '--change', '004-test', '--no-push'], {
        repo,
        binDir: gh.binDir,
        nodeOptions: gh.nodeOptions,
      })

      expect(comNoPush.status).toBe(0)
      expect(parseJson(comNoPush.stdout).pushed).toBe(false)
    },
  )

  itIntegration('não confunde --no-push com --no-pr', () => {
    const repo = createRepoWithRemote()
    touchTaskFile(repo)
    const gh = createFakeGh(['0|[]|', '0|https://github.com/acme/site/pull/11|'])
    createFakePnpm()

    const soNoPush = runCli(['commit-task', 'TASK-001', '--change', '004-test', '--no-push'], {
      repo,
      binDir: gh.binDir,
      nodeOptions: gh.nodeOptions,
    })

    // Sem push, não há pull request, mas a flag --no-pr não foi a que impediu.
    expect(parseJson(soNoPush.stdout).pullRequest).toBeNull()
    expect(parseJson(soNoPush.stdout).pushed).toBe(false)

    touchTaskFile(repo)
    const soNoPr = runCli(['commit-task', 'TASK-001', '--change', '004-test', '--no-pr'], {
      repo,
      binDir: gh.binDir,
      nodeOptions: gh.nodeOptions,
    })

    // Com --no-pr, o push é feito e não há pull request.
    expect(parseJson(soNoPr.stdout).pushed).toBe(true)
    expect(parseJson(soNoPr.stdout).pullRequest).toBeNull()
    expect(gh.calls).toHaveLength(0)
  })

  itIntegration('não faz push nem abre pull request com a flag --no-push', () => {
    const repo = createRepoWithRemote()
    touchTaskFile(repo)
    const gh = createFakeGh(['0|[]|', '0|https://github.com/acme/site/pull/11|'])
    createFakePnpm()

    const result = runCli(['commit-task', 'TASK-001', '--change', '004-test', '--no-push'], {
      repo,
      binDir: gh.binDir,
      nodeOptions: gh.nodeOptions,
    })

    expect(result.status).toBe(0)
    const payload = parseJson(result.stdout)
    expect(payload.pushed).toBe(false)
    expect(payload.pullRequest).toBeNull()
    expect(gh.calls).toHaveLength(0)
    expect(git(repo, ['branch', '-r'])).not.toContain('origin/task/004-001-implementar-coisa')
  })

  itIntegration('aceita --no-pr e --no-push antes do identificador', () => {
    const repo = createRepoWithRemote()
    touchTaskFile(repo)
    const gh = createFakeGh(['0|[]|', '0|https://github.com/acme/site/pull/11|'])
    createFakePnpm()

    const result = runCli(
      ['commit-task', '--no-push', '--no-pr', 'TASK-001', '--change', '004-test'],
      {
        repo,
        binDir: gh.binDir,
        nodeOptions: gh.nodeOptions,
      },
    )

    expect(result.status).toBe(0)
    const payload = parseJson(result.stdout)
    expect(payload.pushed).toBe(false)
    expect(payload.pullRequest).toBeNull()
    expect(gh.calls).toHaveLength(0)
  })

  itIntegration(
    'publica um commit limpo existente sem criar outro commit e repete sem push duplicado',
    () => {
      const fixture = createRepoWithExistingCommit()
      const gh = createFakeGh([])
      createFakePnpm()
      const commitCount = git(fixture.repo, ['rev-list', '--count', 'HEAD']).trim()

      const first = runCli(['commit-task', 'TASK-001', '--change', '004-test', '--no-pr'], {
        repo: fixture.repo,
        binDir: gh.binDir,
        nodeOptions: gh.nodeOptions,
      })
      expect(first.status, first.stderr).toBe(0)
      const firstPayload = parseJson(first.stdout)
      expect(firstPayload.pushed).toBe(true)
      expect(firstPayload.commit).toBe(fixture.head.slice(0, 7))
      expect(git(fixture.repo, ['rev-parse', 'HEAD']).trim()).toBe(fixture.head)
      expect(git(fixture.repo, ['rev-list', '--count', 'HEAD']).trim()).toBe(commitCount)
      expect(git(fixture.repo, ['ls-remote', '--heads', 'origin', fixture.branch])).toContain(
        fixture.head,
      )

      const second = runCli(['commit-task', 'TASK-001', '--change', '004-test', '--no-pr'], {
        repo: fixture.repo,
        binDir: gh.binDir,
        nodeOptions: gh.nodeOptions,
      })
      expect(second.status, second.stderr).toBe(0)
      expect(parseJson(second.stdout).pushed).toBe(false)
      expect(parseJson(second.stdout).commit).toBe(fixture.head.slice(0, 7))
      expect(git(fixture.repo, ['rev-list', '--count', 'HEAD']).trim()).toBe(commitCount)
      expect(gh.calls).toHaveLength(0)
    },
  )

  itIntegration('encaminha --remote e publica no alias selecionado', () => {
    const fixture = createRepoWithExistingCommit({ remote: 'backup' })
    const gh = createFakeGh([])
    createFakePnpm()

    const result = runCli(
      ['commit-task', 'TASK-001', '--change', '004-test', '--remote', 'backup', '--no-pr'],
      { repo: fixture.repo, binDir: gh.binDir, nodeOptions: gh.nodeOptions },
    )

    expect(result.status, result.stderr).toBe(0)
    expect(parseJson(result.stdout).pushed).toBe(true)
    expect(git(fixture.repo, ['ls-remote', '--heads', 'backup', fixture.branch])).toContain(
      fixture.head,
    )
    expect(git(fixture.repo, ['ls-remote', '--heads', 'origin']).trim()).toBe('')
  })

  itIntegration(
    'não desfaz o commit nem o push quando a criação do PR falha depois de válida',
    () => {
      const fixture = createRepoWithExistingCommit({ githubRemote: true })
      const gh = createFakeGh(['0|[]|', '1||gh: could not create pull request'])
      createFakePnpm()

      const result = runCli(['commit-task', 'TASK-001', '--change', '004-test'], {
        repo: fixture.repo,
        binDir: gh.binDir,
        nodeOptions: gh.nodeOptions,
      })

      expect(result.status, result.stderr).toBe(0)
      const payload = parseJson(result.stdout)
      expect(payload.pushed).toBe(true)
      expect(payload.commit).not.toBe('')
      expect(payload.pullRequest.status).toBe('failed')
      expect(payload.pullRequest.error.code).toBe('E_PR_CREATE_FAILED')
      expect(payload.pullRequest.url).toBeNull()
      expect(git(fixture.repo, ['ls-remote', '--heads', 'origin', fixture.branch])).toContain(
        fixture.head,
      )
    },
  )

  itIntegration('recusa uma branch inválida antes de tocar no remote', () => {
    const fixture = createRepoWithExistingCommit()
    const gh = createFakeGh([])
    createFakePnpm()

    const result = runCli(
      ['commit-task', 'TASK-001', '--change', '004-test', '--branch', '--force'],
      {
        repo: fixture.repo,
        binDir: gh.binDir,
        nodeOptions: gh.nodeOptions,
      },
    )

    expect(result.status).not.toBe(0)
    expect(parseJson(result.stderr).error.code).toBe('E_ARGS')
    expect(git(fixture.repo, ['ls-remote', '--heads', 'origin', fixture.branch])).toBe('')
  })

  itIntegration('usa owner/repo do remote ao criar PR no caminho de commit existente', () => {
    const fixture = createRepoWithExistingCommit({ remote: 'backup', githubRemote: true })
    const gh = createFakeGh(['0|[]|', '0|https://github.com/acme/site/pull/44|'])
    createFakePnpm()

    const result = runCli(
      ['commit-task', 'TASK-001', '--change', '004-test', '--remote', 'backup'],
      {
        repo: fixture.repo,
        binDir: gh.binDir,
        nodeOptions: gh.nodeOptions,
      },
    )

    expect(result.status, result.stderr).toBe(0)
    const payload = parseJson(result.stdout)
    expect(payload.pushed).toBe(true)
    expect(payload.pullRequest.status).toBe('created')
    expect(payload.pullRequest.url).toBe('https://github.com/acme/site/pull/44')
    expect(gh.calls).toHaveLength(2)
    for (const call of gh.calls) {
      expect(call).toContain('--repo')
      expect(call[call.indexOf('--repo') + 1]).toBe('acme/site')
    }
    expect(git(fixture.repo, ['ls-remote', '--heads', 'backup', fixture.branch])).toContain(
      fixture.head,
    )
  })

  itIntegration('reporta branch_mismatch sem publicar quando --branch não corresponde', () => {
    const fixture = createRepoWithExistingCommit()
    const gh = createFakeGh([])
    createFakePnpm()

    const result = runCli(
      ['commit-task', 'TASK-001', '--change', '004-test', '--branch', 'task/outro-alvo', '--no-pr'],
      { repo: fixture.repo, binDir: gh.binDir, nodeOptions: gh.nodeOptions },
    )

    expect(result.status).not.toBe(0)
    expect(parseJson(result.stderr).error.details.reason).toBe('branch_mismatch')
    expect(git(fixture.repo, ['ls-remote', '--heads', 'origin', fixture.branch])).toBe('')
  })

  itIntegration(
    'reporta a indisponibilidade do PR sem desfazer o push em remote não-GitHub',
    () => {
      const fixture = createRepoWithExistingCommit()
      const gh = createFakeGh([])
      createFakePnpm()

      const result = runCli(['commit-task', 'TASK-001', '--change', '004-test'], {
        repo: fixture.repo,
        binDir: gh.binDir,
        nodeOptions: gh.nodeOptions,
      })

      expect(result.status, result.stderr).toBe(0)
      const payload = parseJson(result.stdout)
      expect(payload.pushed).toBe(true)
      expect(payload.pullRequest.status).toBe('failed')
      expect(payload.pullRequest.error.code).toBe('E_PR_UNAVAILABLE')
      expect(payload.pullRequest.error.details.reason).toBe('remote_url_unsupported')
      expect(git(fixture.repo, ['ls-remote', '--heads', 'origin', fixture.branch])).toContain(
        fixture.head,
      )
      expect(gh.calls).toHaveLength(0)
    },
  )

  itIntegration('com --no-push não abre PR nem repete push quando remote já está em HEAD', () => {
    const fixture = createRepoWithExistingCommit({ publishBranch: true })
    const gh = createFakeGh([])
    createFakePnpm()

    const result = runCli(['commit-task', 'TASK-001', '--change', '004-test', '--no-push'], {
      repo: fixture.repo,
      binDir: gh.binDir,
      nodeOptions: gh.nodeOptions,
    })

    expect(result.status, result.stderr).toBe(0)
    const payload = parseJson(result.stdout)
    expect(payload.pushed).toBe(false)
    expect(payload.pullRequest).toBeNull()
    expect(payload.commit).toBe(fixture.head.slice(0, 7))
    expect(gh.calls).toHaveLength(0)
  })

  itIntegration('com --no-push não contacta o remote, mesmo que esteja indisponível', () => {
    const fixture = createRepoWithExistingCommit()
    const gh = createFakeGh([])
    createFakePnpm()
    git(fixture.repo, ['remote', 'set-url', 'origin', join(workDir, 'missing-remote.git')])

    const result = runCli(['commit-task', 'TASK-001', '--change', '004-test', '--no-push'], {
      repo: fixture.repo,
      binDir: gh.binDir,
      nodeOptions: gh.nodeOptions,
    })

    expect(result.status, result.stderr).toBe(0)
    const payload = parseJson(result.stdout)
    expect(payload.pushed).toBe(false)
    expect(payload.pullRequest).toBeNull()
    expect(payload.commit).toBe(fixture.head.slice(0, 7))
    expect(gh.calls).toHaveLength(0)
  })
})
