# TASK-001 — Automatizar a criação de pull requests

- Change: 012-pull-request-automatico
- Status: COMPLETED
- Depende de: nenhuma
- Início: 2026-11-17
- Verificação: VERIFIED (2026-11-17) — pnpm test exit 0, 6 ficheiros, 256 passed | 1 skipped (257); pnpm test:e2e exit 0, build aprovado, 61 passed | 2 skipped (63); lint/typecheck/build/format:check aprovados. Avisos jsdom canvas não bloqueantes. Revisão A: APROVADO, sem achados. Revisão B: APROVADO, sem achados de alta/média.
- Evidência: pnpm test exit 0, 6 ficheiros, 258 passed | 1 skipped (259); pnpm test:e2e exit 0, build aprovado, 61 passed | 2 skipped (63); lint/typecheck/build/format:check aprovados. Avisos jsdom canvas não bloqueantes. Revisão A: APROVADO, sem achados. Revisão B: APROVADO, sem achados de alta/média.
- Plano de ação: none

## Objetivo

Automatizar a abertura do pull request da branch da tarefa para `main` no
`commit-task`, depois do push bem-sucedido, de forma idempotente e sem merge
automático, e formalizar em RawSpec a alteração já implementada e verificada.

## Contexto

Esta tarefa **formaliza e conclui uma alteração que já está implementada e
verificada**. Não constrói nada de raiz: o código, a documentação e os testes
existem no repositório, em nove ficheiros modificados e ainda não commitados.

O que esta tarefa faz é dar à alteração a forma que o RawSpec exige: uma
proposta aprovada, uma tarefa com âmbito declarado, um gate de âmbito que
cobre exactamente os ficheiros tocados, e a evidência de verificação que
comprova o comportamento.

O estado inicial observado, antes desta formalização:

- Nove ficheiros com a implementação: `.opencode/agents/guardiao.md`,
  `.opencode/commands/continuespec.md`, `.opencode/commands/orquestrar.md`,
  `AGENTS.md`, `docs/rawspec-v2.md`, `scripts/rawspec-v2-cli.mjs`,
  `scripts/rawspec-v2.mjs`, `scripts/rawspec-v2.test.mjs` e
  `scripts/rawspec-v2-cli.test.mjs` (este último novo, ainda por rastrear).
- O trabalho da implementação está temporariamente em `task/001-004-rever-e-corrigir-a-estrutura-de-navegacao`,
  com o trabalho da implementação por commitear. Antes do início desta tarefa,
  a branch de trabalho passa a ser `task/012-001-automatizar-a-criacao-de-pull-requests`,
  criada a partir de `main`; as alterações não commitadas são transferidas para
  essa branch sem commit intermédio, descarte ou reescrita de histórico.
- O `commit-task` termina no push e não abre pull request.
- O parser de argumentos da CLI trata `--no-push` como flag que consome o
  argumento seguinte, pelo que `commit-task --no-push TASK-001` é inválido.

O que a implementação adiciona:

- `openPullRequest`, `findPullRequest`, `buildPullRequestContent`,
  `resolveGhExecutable` e `runExternalCommand` em `scripts/rawspec-v2.mjs`.
- `commitAndPushTask` passa a abrir o pull request depois do push e a devolver
  `pullRequest`, com `status` entre `created`, `existing` e `failed`.
- O comando `open-pr` e a flag `--no-pr` em `scripts/rawspec-v2-cli.mjs`, e a
  correcção do parsing das flags booleanas.
- `E_PR_UNAVAILABLE` e `E_PR_CREATE_FAILED`, com código de saída `8`: o primeiro
  cobre a ausência ou indisponibilidade do `gh` e as falhas de procura; o
  segundo é reservado às falhas de criação depois de o `gh` executar. A guarda
  `E_ARGS` protege um pull request da base para ela própria.
- A secção §15.6 de `docs/rawspec-v2.md` e a documentação correspondente em
  `AGENTS.md` e nas instruções do `guardião`, do `/continuespec` e do
  `/orquestrar`.
- Testes unitários em `scripts/rawspec-v2.test.mjs` e testes de nível de CLI
  em `scripts/rawspec-v2-cli.test.mjs`, com um `gh` falso no `PATH` e sem
  acesso à rede.

## Arquivos

- `.opencode/agents/guardiao.md` (alteração: campo `PR:` no formato de saída,
  secção "Pull request", proibição de criar pull requests à mão e de fazer
  merge)
- `.opencode/commands/continuespec.md` (alteração: abertura do pull request
  depois do push, idempotência, efeito da falha, comando `open-pr`, campo `PR:`
  no reporte)
- `.opencode/commands/orquestrar.md` (alteração: descrição da abertura
  automática, proibição de criar pull requests à mão e de fazer merge, campo
  `PR:` no reporte)
- `AGENTS.md` (alteração: linha "Pull request (automático)" na secção das
  responsabilidades)
- `docs/rawspec-v2.md` (alteração: §15.6 "Pull request automático", catálogo de
  erros, fluxo ponta a ponta, exemplos da CLI e tabela dos comandos)
- `scripts/rawspec-v2-cli.mjs` (alteração: comando `open-pr`, flag `--no-pr`,
  correcção do parsing das flags booleanas, `RAWSPEC_REPO_ROOT`, execução
  condicional do `main`)
- `scripts/rawspec-v2.mjs` (alteração: `openPullRequest`, `findPullRequest`,
  `buildPullRequestContent`, `resolveGhExecutable`, `runExternalCommand`,
  distinção entre `E_PR_UNAVAILABLE` e `E_PR_CREATE_FAILED`, abertura do pull
  request em `commitAndPushTask`)
- `scripts/rawspec-v2.test.mjs` (alteração: bloco "automação do pull request",
  bloco "resolução do GitHub CLI", extracção dos utilitários de Git para o
  nível superior)
- `scripts/rawspec-v2-cli.test.mjs` (criação: testes de nível de CLI, com `gh` e
  `pnpm` falsos no `PATH`)
- `specs/changes/012-pull-request-automatico/proposal.md` (criação: proposta
  aprovada desta change)
- `specs/changes/012-pull-request-automatico/tasks/TASK-001.md` (criação: esta
  tarefa; a CLI actualiza os campos `Status`, `Início`, `Verificação` e
  `Evidência`)
- `docs/history.md` (acréscimo da entrada de registo desta tarefa, pela CLI,
  em append; nenhuma entrada existente é reescrita)
- `docs/decisions/ADR-008-pull-request-automatico.md` (acréscimo, se aplicável:
  a decisão de automatizar a abertura do pull request e de nunca fundir
  automaticamente é registada como ADR, pela CLI, no momento do registo)

Os três últimos ficheiros são os ficheiros de especificação que a CLI actualiza
e que o gate de âmbito do `commit-task` permite. A ADR só é criada se a
decisão for registada como ADR; não é obrigatória.

## Entregáveis

- O `commit-task` abre o pull request da branch da tarefa para `main`, depois do
  push bem-sucedido, com `gh pr create --base main --head <branch>`.
- O resultado do `commit-task` traz `pullRequest`, com `status` entre
  `created`, `existing` e `failed`, e com `url`, `number`, `branch`, `base` e
  `title` quando criado.
- A criação é idempotente: havendo um pull request aberto para a branch, o URL
  existente é reportado com `status: existing` e nenhum duplicado é criado.
- O pull request nunca é fundido automaticamente. Nenhum caminho de código
  chama `gh pr merge`, e os argumentos de `pr create` não contêm
  `--auto-merge`.
- Sem push, não há pull request: o resultado traz `pullRequest: null` e o
  GitHub CLI não é invocado.
- A flag `--no-pr` desactiva a abertura automática, com o push intacto. A forma
  `--no-pr=false` volta a activá-la.
- O comando `open-pr TASK-NNN --change NNN-slug [--branch NAME] [--base BRANCH]`
  abre o pull request de uma tarefa à parte, com o mesmo comportamento
  idempotente. Termina com código de saída `8` e `E_PR_UNAVAILABLE` quando o
  GitHub CLI está ausente ou indisponível, ou quando a procura falha ou devolve
  uma resposta inválida; termina com `E_PR_CREATE_FAILED` quando `gh pr create`
  foi executado e a criação falhou ou não devolveu uma URL legível.
- A falha do pull request é reportada com precisão, **não desfaz o commit nem o
  push** e **não reprova a verificação da tarefa**: o `commit-task` termina com
  sucesso e `pullRequest.status` vale `failed`, com o erro correspondente.
- As flags booleanas da CLI (`--no-push`, `--no-pr`, `--approved`, `--adr`)
  aceitam `--flag`, `--flag=true` e `--flag=false`, e nenhuma delas consome o
  argumento seguinte.
- Um pull request da branch base para ela própria é recusado com `E_ARGS` e
  código de saída `2`, antes de qualquer chamada ao GitHub CLI.
- `docs/rawspec-v2.md` documenta a automação em §15.6, no catálogo de erros, no
  fluxo ponta a ponta e nos exemplos da CLI.
- `AGENTS.md`, `.opencode/agents/guardiao.md`, `.opencode/commands/continuespec.md`
  e `.opencode/commands/orquestrar.md` descrevem a abertura automática, a
  idempotência, a ausência de merge automático, o efeito da falha e o comando
  `open-pr`.
- A proposta e esta tarefa ficam registadas em RawSpec, com a proposta em
  `APPROVED`.

## Regras

- **Esta tarefa formaliza e conclui o que já está implementado.** A
  implementação nos nove ficheiros listados não é reescrita nem reimplementada
  nesta tarefa; o trabalho aqui é o registo, a verificação e a integração no
  fluxo RawSpec. Nenhum ficheiro de implementação é alterado por causa da
  formalização.
- **Não alterar o estado de aprovação de nenhuma mudança ou tarefa.** A
  aprovação desta change foi dada pelo utilizador em 2026-11-17 e está
  registada como `APPROVED` na proposta.
- **O pull request é sempre para `main`**, com `--base` e `--head` explícitos,
  tanto na procura como na criação.
- **A criação é idempotente.** A procura de um pull request aberto para a
  branch precede sempre a criação.
- **Nunca fundir automaticamente.** A revisão e a integração são decisões do
  utilizador. Nenhum caminho de código chama `gh pr merge`, e nenhuma
  instrução aos agentes autoriza o merge.
- **A falha do pull request não desfaz o commit nem o push, e não reprova a
  verificação da tarefa.** A falha é reportada com `pullRequest.status: failed`.
- **O `gh` é executado sem shell**, como processo filho de Node, com o
  executável resolvido antes da chamada.
- **Os testes não podem aceder à rede.** As chamadas ao GitHub CLI são
  substituídas por executáveis falsos no `PATH`, e o `pnpm` das verificações
  é substituído por um executável falso que confirma sem correr a suíte real.
- **Não tocar em `src/`, `src/content/`, `index.html`, nos tokens globais, nem
  no layout da aplicação.** Esta task é de processo, não de interface.
- **Não alterar as permissões do `guardião` nem de qualquer outro agente.** O
  `gh` não passa pelas permissões de shell do agente.
- **Nunca** reescrever o histórico: sem `reset --hard`, `checkout --`,
  `restore`, `clean` ou descarte de alterações.
- **Nunca** usar `--no-verify` para contornar verificações.
- O commit e o push são feitos pelo `guardião`, através do `commit-task`, nunca
  à mão e nunca com `git add -A`.
- O gate de âmbito do `commit-task` não pode ser contornado. Se bloquear com
  `E_SCOPE_VIOLATION`, o `guardião` reporta a lista e para.

## Testes

Verificações já executadas nesta implementação, com os resultados verificados:

- `pnpm lint` — exit 0.
- `pnpm typecheck` — exit 0.
- `pnpm test` — exit 0, **258 aprovados, 1 ignorado** (259 em 6 ficheiros de
  teste).
- `pnpm test:e2e` — exit 0, build aprovado, **61 aprovados, 2 ignorados** (63).
- `pnpm build` — exit 0.

Cobertura de testes da automação, já presente em
`scripts/rawspec-v2.test.mjs` e `scripts/rawspec-v2-cli.test.mjs`:

- Procura um pull request aberto para a branch antes de criar, com `--head` e
  `--base` explícitos.
- Não cria duplicado quando já existe pull request para a branch, e devolve
  `status: existing`.
- Cria o pull request com `--base` e `--head` explícitos, e sem `--auto-merge`.
- Gera título e corpo com a mudança, a tarefa, a branch e a branch base.
- Abre o pull request no `commit-task` depois do push, e o resultado traz
  `pullRequest.status: created` com o URL.
- Não desfaz o commit nem o push quando o pull request falha, e
  `pullRequest.status` vale `failed` com `E_PR_UNAVAILABLE`.
- Recusa a criação quando a resposta da procura é inválida — saída vazia, JSON
  inválido, JSON que não é um array, ou um array com elementos malformados — com
  `E_PR_UNAVAILABLE`, sem chamar `gh pr create`.
- Aceita um array JSON válido e vazio como ausência de pull request, e aceita um
  pull request sem `state` nem `title`, com valores por omissão.
- Recusa um pull request cujo `number` não é um inteiro positivo, validado pelo
  tipo e sem coerção: `null`, `true`, `false`, a string vazia, uma string
  numérica, `0`, um número negativo e um decimal falham com
  `E_PR_UNAVAILABLE` e `reason: malformed_entry`, sem chamar `gh pr create` e
  sem reportar o pull request como existente.
- Não desfaz o commit nem o push quando a resposta da procura é inválida, e o
  resultado traz `pullRequest.status: failed` com `E_PR_UNAVAILABLE`.
- Não abre pull request sem push.
- Não abre pull request quando desativado.
- Recusa um pull request da branch base para ela própria, com `E_ARGS` e sem
  chamar o GitHub CLI.
- `resolveGhExecutable` devolve o caminho do executável encontrado no `PATH`,
  e `null` quando o GitHub CLI não está instalado, quando o ficheiro não é
  executável em POSIX, ou quando o caminho é um directório.
- `runExternalCommand` devolve o resultado de um comando externo com sucesso e
  reporta o código de saída de um comando que falha, sem lançar; quando o `gh`
  não existe, devolve uma indisponibilidade explícita sem tentar executá-lo.
- Na criação do pull request, o `gh` ausente ou indisponível é reportado com
  `E_PR_UNAVAILABLE`; uma falha de `gh pr create` depois da sua execução é
  reportada com `E_PR_CREATE_FAILED`.
- Na CLI: `open-pr` abre o pull request e devolve o URL em JSON; usa a branch
  base pedida; não cria duplicado; sai com `8` e `E_PR_UNAVAILABLE` quando o
  `gh` está ausente ou indisponível; sai com `8` e `E_PR_UNAVAILABLE` quando o
  `gh` está instalado mas a procura falha; sai com `8` e `E_PR_CREATE_FAILED`
  quando `gh pr create` foi executado e a criação falha ou não devolve URL;
  sai com `8` e `E_PR_UNAVAILABLE` quando a resposta da procura é inválida, sem
  chamar `gh pr create`; sai com `8` e `E_PR_UNAVAILABLE` com
  `reason: malformed_entry` quando o `number` do pull request é `null`, `true`,
  `false`, a string vazia, uma string numérica, `0`, um número negativo ou um
  decimal, sem chamar `gh pr create`; recusa um pull request da base para ela
  própria com código de saída `2` e `E_ARGS`, sem chamar o `gh`.
- Na CLI: o `commit-task` abre o pull request depois do push; não duplica quando
  já existe um aberto; não desfaz o commit nem o push quando o pull request
  falha, nem quando a resposta da procura é inválida, nem quando o `number` do
  pull request é malformado; `--no-pr` impede a abertura mas não o push;
  `--no-pr=false` abre o pull request; `--no-push=false` faz o push;
  `--no-push` não faz push nem abre pull request; `--no-pr` e `--no-push` são
  aceite antes do identificador.
- No parsing: `--no-push`, `--no-pr`, `--approved` e `--adr` não consomem o
  argumento seguinte; a forma `--flag=false` é interpretada; o sufixo é separado
  antes da classificação da flag; as formas com maiúsculas e minúsculas são
  aceites; as flags com argumento mantêm o valor.

Verificações a repetir no registo, antes do commit, pela ordem do
`commit-task`:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Antes do commit, o gate de âmbito executado pelo `commit-task` confirma que os
ficheiros tocados estão na secção `## Arquivos` desta tarefa. A listagem
prévia pode ser observada com:

```bash
git status --porcelain --untracked-files=all
```

A validação vinculativa é o resultado do `commit-task`: se algum ficheiro
estiver fora do âmbito, o comando termina com `E_SCOPE_VIOLATION` e não há
commit nem push.

## Aceitação

A criação do pull request está automatizada no `commit-task`, de forma
idempotente e nunca com merge automático; a falha do pull request não desfaz o
commit nem o push e não reprova a verificação da tarefa; a flag `--no-pr` e o
comando `open-pr` dão controlo ao executante; e a alteração está formalizada
em RawSpec, com a proposta aprovada, o âmbito dos nove ficheiros de
implementação mais os ficheiros de especificação que a CLI actualiza, e a
evidência de verificação registada.

## Checklist de clareza

- Objetivo único e verificável — ATENDE (automatizar a abertura do pull request
  no `commit-task`, de forma idempotente e sem merge automático, e formalizar a
  alteração já implementada)
- Arquivos afetados — ATENDE (os nove ficheiros da implementação, a proposta, a
  própria tarefa, `docs/history.md` e a ADR, se aplicável)
- Entregáveis concretos — ATENDE
- Contrato de entrada, saída e erros — ATENDE (entrada: a branch da tarefa, a
  base `main` e o estado do push; saída: `pullRequest` com `status` entre
  `created`, `existing` e `failed`, `url`, `number`, `branch`, `base` e `title`;
  erros: `E_PR_UNAVAILABLE` para o `gh` ausente ou indisponível e para falhas
  de procura, `E_PR_CREATE_FAILED` para falhas reais de criação, ambos com
  código de saída `8` no `open-pr`, `E_ARGS` com código de saída `2` para a base
  igual à origem, e `pullRequest.status: failed` sem reprovar a verificação no
  `commit-task`)
- Testes obrigatórios — ATENDE (as verificações já executadas e a cobertura de
  testes da automação)
- Critério de aceitação objetivo — ATENDE
- Dependências declaradas explicitamente — ATENDE (nenhuma; a implementação já
  existe e não depende de outra tarefa)
- Ausência de decisões pendentes para o implementador — ATENDE
