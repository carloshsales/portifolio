# TASK-014 — Registar o incidente de Git e a correcção da causa raiz

- Change: 009-registro-do-incidente-de-git
- Status: ARCHIVED
- Depende de: nenhuma
- Início: 2026-11-16
- Verificação: VERIFIED (2026-11-16) — pnpm test: exit 0, 146 aprovados e 1 ignorado; pnpm test:e2e: exit 0, 15 aprovados em 3 viewports (mobile, tablet, desktop)
- Evidência: pnpm test: exit 0, 146 aprovados e 1 ignorado; pnpm test:e2e: exit 0, 15 aprovados em 3 viewports (mobile, tablet, desktop)
- Plano de ação: none
- Arquivada em: 2026-11-16

## Contexto

A execução do `commit-task` da TASK-013, em 2026-11-16, criou o commit correcto e
foi depois bloqueada pelo hook `pre-push`, que executa `pnpm test` a partir do
worktree. A suíte de testes do helper criava repositórios temporários com `git init`
sem isolar o `GIT_DIR`.

Num worktree, `.git` é um ficheiro com a forma `gitdir: <caminho>`, e o Git
descobre o repositório por ascensão de directórios. Comprovou-se que `git init` num
directório com um ficheiro `.git` reinitializa o repositório partilhado em vez de
criar um novo, e que `git init --separate-git-dir` move o `.git` real para outro
sítio.

Os danos observados foram: `core.bare = true` na configuração partilhada, a
identidade de teste `[user] Test <test@example.com>` injectada na configuração
partilhada, a branch da TASK-013 sobrescrita com commits de fixture, o `HEAD` do
worktree deslocado para uma branch de fixture, a branch
`task/004-001-implementar-coisa` criada no repositório real, e o `author` do commit
atribuído a `Test <test@example.com>` em vez da identidade do utilizador.

Todos foram reparados e o commit foi pushado com a identificação correcta. A causa
raiz foi corrigida em `scripts/rawspec-v2.mjs` e `scripts/rawspec-v2.test.mjs`, que
já estavam no âmbito da TASK-013 e ficaram no commit `211a64e`.

O que falta é o registo. As regras da TASK-013 proíbem explicitamente adicionar
entradas a `docs/history.md` e criar ADRs, pelo que o registo não pode ter sido feito
naquela tarefa. Esta tarefa existe para o fazer.

Esta tarefa não declara dependência de grafo: o CLI valida dependências dentro da
mesma mudança, e a TASK-013 pertence à change 008. A relação é de contexto, não de
ordem — a TASK-013 já está `COMPLETED` e `VERIFIED`, e a correção da causa raiz
já está no commit `211a64e`, que a contém.

## Objetivo

Registar em `docs/history.md` o incidente de corrupção do repositório ocorrido durante
o push da TASK-013 e a correção da sua causa raiz, e actualizar `docs/projeto.md`
para que documente que as operações Git do helper fixam o directório Git em vez de o
descobrirem por ascensão de directórios.

## Arquivos

- `docs/history.md` (alteração)
- `docs/projeto.md` (alteração)
- `specs/changes/009-registro-do-incidente-de-git/proposal.md` (preservado no commit; proposta aprovada, sem alteração de conteúdo)
- `specs/changes/009-registro-do-incidente-de-git/tasks/TASK-014.md` (movido para o arquivo pelo arquivamento da tarefa)
- `specs/changes/archive/009-registro-do-incidente-de-git/proposal.md` (movido pelo arquivamento da mudança)
- `specs/changes/archive/009-registro-do-incidente-de-git/tasks/archive/TASK-014.md` (movido pelo arquivamento da tarefa)

## Entregáveis

- `docs/history.md` tem um `Evento` registado com a CLI, que descreve:
  - o incidente: o `commit-task` da TASK-013 criou o commit correcto e o push foi
    bloqueado pelo hook `pre-push` ao executar a suíte de testes;
  - o mecanismo comprovado: `git init` num directório com `.git` ficheiro
    reinitializa o repositório partilhado, e `git init --separate-git-dir` move o
    `.git` real;
  - os danos observados, enumerados;
  - a reparação efectuada e o commit que a contém;
  - a evidência da prova, com a mensagem de erro observada.
- `docs/history.md` tem um `Detalhe` registado com a CLI, que descreve a correção da
  causa raiz: a função `resolveGitDir`, que resolve o directório Git tanto para
  `.git` directório como para o ficheiro `gitdir:` de um worktree, e a fixação de
  `GIT_DIR` e `GIT_WORK_TREE` em `runCommand` e nos helpers de teste.
- `docs/projeto.md` tem uma nova secção `### 7.5 Isolamento do repositório`, criada
  imediatamente a seguir a `### 7.4 Husky` e antes do separador `---` que antecede a
  secção 8, que regista que as operações Git do helper fixam `GIT_DIR` e
  `GIT_WORK_TREE` ao directório Git do repositório indicado em vez de o
  descobrirem por ascensão de directórios, e que a suíte de testes usa repositórios
  temporários isolados com o mesmo mecanismo. A secção deve mencionar o risco
  concreto: num worktree, `.git` é um ficheiro `gitdir:` e `git init` reinitializa o
  repositório partilhado.
- Nenhuma entrada existente de `docs/history.md` foi alterada, reordenada ou removida.
- A tarefa e a mudança ficam arquivadas, com a proposta e a task em
  `specs/changes/archive/009-registro-do-incidente-de-git`, e o arquivamento é
  registado em `docs/history.md` como um `Evento` próprio.

## Regras

- Usar a CLI RawSpec para escrever em `docs/history.md`:
  `node scripts/rawspec-v2-cli.mjs log --type <Evento|Detalhe> --title "<título>" --message "<decisão>" --reason "<motivo>" --impact "<impacto>" --evidence "<evidência>"`.
- `docs/history.md` é append-only: as entradas novas são acrescentadas no fim.
- Descrever o mecanismo como comprovado, com a evidência da prova. Não escrever
  suposições.
- Não criar ADRs. O incidente é um evento com uma correcção pontual, não uma
  decisão arquitectural.
- Não alterar `scripts/rawspec-v2.mjs` nem `scripts/rawspec-v2.test.mjs`. A
  correcção da causa raiz já está feita e verificada na TASK-013.
- Não reverter, reformatar nem reescrever entradas existentes de `docs/history.md`.
- Não alterar o status de aprovação da change ou da tarefa.
- Não implementar código de produto.
- Não fazer commit ou push manualmente; o guardião executa o `commit-task`.
- Não adicionar entradas duplicadas: verificar `docs/history.md` antes de registar.

## Testes

- Verificações obrigatórias, executadas pelo utilizador, por ordem:
  1. `pnpm test`
  2. `pnpm test:e2e`
- O verificador avalia a evidência do utilizador sem executar shell.
- Os checks automáticos do `commit-task` (lint, typecheck, test, build) e os hooks
  Husky podem repetir parte da suíte.
- A prova de que o registo está correcto é a leitura de `docs/history.md`: as duas
  entradas novas no fim do ficheiro, com os seis campos preenchidos, e as entradas
  anteriores intactas.

## Contrato mínimo de evidência

Para cada comando executado manualmente pelo utilizador, a evidência deve conter:

- O comando exato executado.
- O resultado final / passagem (exit code 0 ou resumo de sucesso).

Se um comando falhar, deve fornecer a saída relevante e parar o pipeline para
correcção. Se a evidência estiver ausente ou ambígua, o verificador pede complemento
e não avança.

Checks manuais (utilizador): `pnpm test`, `pnpm test:e2e`.
Checks automáticos (commit-task/hooks): lint, typecheck, test, build.

## Aceitação

Condição-objectiva de conclusão: `docs/history.md` contém as duas entradas novas, um
`Evento` sobre o incidente e um `Detalhe` sobre a correcção, registados pela CLI e
com os seis campos preenchidos, descrevendo o mecanismo comprovado e os danos
observados; `docs/projeto.md` tem a nova secção `### 7.5 Isolamento do repositório`,
que regista a fixação de `GIT_DIR` e `GIT_WORK_TREE` e o risco de `git init` num
worktree; nenhuma entrada anterior de `docs/history.md` foi alterada; o
`commit-task` produz um commit que contém apenas os ficheiros do âmbito.

## Checklist de clareza

- Objetivo único e verificável — ATENDE
- Arquivos afetados — ATENDE
- Entregáveis concretos — ATENDE
- Contrato de entrada, saída e erros — ATENDE
- Testes obrigatórios — ATENDE
- Critério de aceitação objetivo — ATENDE
- Dependências declaradas explicitamente — ATENDE
- Ausência de decisões pendentes para o implementador — ATENDE
