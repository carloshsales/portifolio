# TASK-001 — Integrar o agente executor, o cache TTL por modelo e a documentação do orquestrador

- Change: 015-verificacao-executada-por-agente
- Status: COMPLETED
- Depende de: nenhuma
- Início: 2026-11-25
- Verificação: VERIFIED (2026-11-25) — pnpm test: Test Files 6 passed (6), Tests 320 passed | 1 skipped (321), 101,45 s. pnpm test:e2e: pnpm build -> tsc --noEmit && vite build (✓ 37 modules transformed, built in 212ms); Playwright Running 75 tests using 6 workers, 73 passed, 2 skipped (14,3 s). Ignorados: [desktop] e2e\\responsive.spec.ts:1056:1 e :1096:1. Verificador devolveu ESTADO: OK na 3.ª volta. Codigo de saida nao capturavel (permissao do executor limita a comandos pnpm); risco coberto pelo commit-task.
- Evidência: pnpm test: Test Files 6 passed (6), Tests 320 passed | 1 skipped (321), 101,45 s. pnpm test:e2e: pnpm build -> tsc --noEmit && vite build (✓ 37 modules transformed, built in 212ms); Playwright Running 75 tests using 6 workers, 73 passed, 2 skipped (14,3 s). Ignorados: [desktop] e2e\\responsive.spec.ts:1056:1 e :1096:1. Verificador devolveu ESTADO: OK na 3.ª volta. Codigo de saida nao capturavel (permissao do executor limita a comandos pnpm); risco coberto pelo commit-task.
- Plano de ação: none

## Objetivo

Integrar no `main` o trabalho de desenvolvimento preservado no stash
`sessoes-anteriores-pre-TASK-006`: o agente `executor`, que executa a verificação
manual do projecto, o override de TTL de cache por modelo em `opencode.json`, e a
documentação e as ADRs que descrevem estas decisões.

## Contexto

Entre 2026-11-24 e 2026-11-25, três decisões de arquitectura do orquestrador
foram implementadas, mas o trabalho não chegou ao `main`:

1. **A verificação manual passou a ser executada por um agente.** A change 008
   implementou o fluxo em que o utilizador executa `pnpm test` e `pnpm test:e2e`
   manualmente. A medição mostrou que esse passo era o mais lento e o mais
   frágil do pipeline, e que separar o agente que executa do agente que avalia
   preserva a independência do gate. Nasce o agente `executor`, com a ADR-010.
2. **O cache TTL deixou de ser uniforme.** O `30m` que o provider `opencode-go`
   aceita rejeita o `claude-haiku-5-5`, usado por três agentes. A correcção é um
   override ao nível do modelo.
3. **O guardião passou a indicar a próxima task**, com a ADR-011.

O trabalho ficou num stash porque o gate de âmbito do `commit-task` da TASK-006
bloqueou o commit ao encontrar 25 ficheiros modificados alheios a essa task. **O
stash é a única cópia deste trabalho.** Sem integração, as decisões ficam
registadas em `docs/history.md` mas o código, a configuração e a documentação que
as implementam não existem no `main`.

O stash **não** mexe em `docs/history.md`, pelo que não há risco de duplicar as
entradas de 2026-11-24 que o PR #25 já integrou. Esta task acrescenta apenas a
sua própria entrada, por append.

## Arquivos

- `.opencode/agents/executor.md` (criação — agente novo, permissões e contrato de evidência)
- `.opencode/agents/verificador.md` (alteração — avalia a evidência do `executor`; distingue ausência de execução de evidência em falta)
- `.opencode/agents/orquestrador.md` (alteração — invoca o `executor` na etapa de verificação)
- `.opencode/agents/implementador.md` (alteração — distingue as suas verificações da verificação global do pipeline)
- `.opencode/agents/guardiao.md` (alteração — secção "Próxima task")
- `.opencode/agents/analista-clareza.md` (alteração — modelo sem variante)
- `.opencode/agents/revisor.md` (alteração — modelo sem variante)
- `.opencode/commands/orquestrar.md` (alteração — pipeline com `executor`)
- `.opencode/commands/continuespec.md` (alteração — alinha com o fluxo por agente)
- `.opencode/commands/startspec.md` (alteração — alinha com o fluxo por agente)
- `.opencode/commands/clarity.md` (alteração — modelo sem variante)
- `AGENTS.md` (alteração — divisão de responsabilidades com o `executor`)
- `opencode.json` (alteração — override de `cache.ttl` para o `claude-haiku-5-5`)
- `docs/orquestrador.md` (alteração — tabela de routing, custos, cache TTL e matriz de permissões)
- `docs/projeto.md` (alteração — referências ao `executor` e aos nove agentes)
- `docs/rawspec-v2.md` (alteração — secções 10 e 15 alinhadas com o fluxo por agente)
- `docs/decisions/ADR-009-routing-minimax-m3.md` (criação)
- `docs/decisions/ADR-010-verificacao-executada-por-agente.md` (criação)
- `docs/decisions/ADR-011-proxima-task-ao-terminar.md` (criação)
- `README.md` (alteração — routing e custos)
- `bakeoff/README.md` (alteração — routing medido)
- `bakeoff/calc-cost.mjs` (alteração — custos com o `executor` e o `minimax-m3`)
- `bakeoff/check-agents.mjs` (alteração — inclui o `executor`)
- `bakeoff/check-permissions.mjs` (alteração — inclui o `executor` e corrige a detecção de negações)
- `bakeoff/validate.mjs` (alteração — valida os nove agentes, o cache TTL e a ordem das regras de permissão)
- `specs/changes/015-verificacao-executada-por-agente/proposal.md` (preservado no commit; proposta aprovada, sem alteração de conteúdo)

## Entregáveis

- O agente `executor` existe em `.opencode/agents/executor.md`, com `edit: deny`,
  `shell` limitado aos seis comandos de leitura (`pnpm test`, `pnpm test:e2e`,
  `pnpm lint`, `pnpm typecheck`, `pnpm format:check`, `pnpm build`), a regra geral
  `shell: '*'` em `deny` antes das específicas, e **sem** `subagent: deny`.
- O `executor` não executa `pnpm lint:fix`, `pnpm format`, `pnpm dev` nem
  `pnpm preview`.
- O `verificador` avalia a evidência do `executor` sem executar shell, e
  distingue a ausência de execução, que é falha, da evidência em falta, que é
  falta de evidência.
- O `orquestrador` invoca o `executor` na etapa de verificação e envia a
  evidência ao `verificador` antes da revisão e do registo.
- O `guardiao` identifica a próxima task no relatório final, sem implementar nem
  alterar o estado da task seguinte.
- `AGENTS.md` documenta a divisão de responsabilidades com o `executor`, e o
  utilizador deixa de executar `pnpm test` e `pnpm test:e2e`.
- `opencode.json` mantém `cache.ttl` de `30m` no provider `opencode-go` e
  define `5m` no modelo `claude-haiku-5-5`.
- As ADR-009, ADR-010 e ADR-011 existem em `docs/decisions/`.
- `docs/orquestrador.md`, `docs/projeto.md`, `docs/rawspec-v2.md` e `README.md`
  descrevem o fluxo por agente, os nove agentes, os custos medidos e o cache TTL
  por modelo.
- Os scripts `bakeoff/` validam a configuração, descobrem os nove agentes e
  verificam as permissões do `executor`.

## Regras

- **A aplicação é por `git stash apply`, não por edição manual.** O conteúdo
  já está escrito e verificado; reescrevê-lo introduziria erros. Se o `apply`
  falhar com conflito, pára e reporta.
- O stash **não** é removido (`drop`) antes de o commit estar no `origin/main`.
  O `drop` só é feito depois, e apenas se o utilizador o autorizar.
- **Nenhuma escrita em `src/`.** Esta task não toca no código de produto.
- **Não alterar** o estado de aprovação de nenhuma change ou task.
- **Não reescrever o histórico.** Sem `reset --hard`, `checkout --`, `restore` ou
  `clean`. Sem `--no-verify`.
- **Não alterar `docs/history.md` para além do acréscimo da entrada de registo.**
  As entradas de 2026-11-24 já estão no `main` e não podem ser duplicadas.
- O commit e o push são feitos pelo `guardião`, através do `commit-task`. Nunca
  com `git add`, `git commit` ou `git push` à mão, nunca com `git add -A`.
- Se o gate de âmbito do `commit-task` bloquear com `E_SCOPE_VIOLATION`, o
  `guardião` reporta a lista e para. Não contorna o gate.
- A integração é feito num único commit, que integra os 25 ficheiros do stash
  mais a entrada de registo e os ficheiros de especificação desta task.

## Testes

- `node bakeoff/validate.mjs` confirma a configuração, os nove agentes, os
  modelos e variantes, as permissões, o cache TTL e a integridade do histórico.
- `node bakeoff/check-agents.mjs` descobre os nove agentes.
- `node bakeoff/check-permissions.mjs` confirma que o `executor` executa os seis
  comandos de leitura, não escreve ficheiros e é recusado nos comandos fora do
  âmbito.
- Os nove agentes carregam e respondem com o modelo que cada um declara.
- `pnpm lint`, `pnpm typecheck`, `pnpm test` e `pnpm build` passam, por esta
  ordem, dentro do `commit-task`.
- `git status --porcelain --untracked-files=all` não mostra ficheiros fora do
  âmbito declarado na secção `## Arquivos` nem das especificações que a CLI
  actualiza.
- A contagem de títulos `## ` em `docs/history.md` aumenta exactamente uma
  unidade em relação ao `main`, e as entradas anteriores mantêm a ordem
  relativa.
- O pull request é aberto automaticamente pelo `commit-task` e reporta
  `MERGEABLE` com a CI verde.

## Aceitação

O `main` passa a conter o agente `executor`, o override de TTL de cache por
modelo, as três ADRs e a documentação que descreve o fluxo de verificação
executado por agente; os nove agentes carregam e respondem; os scripts
`bakeoff/` validam a configuração; e o commit é feito pelo `guardião` pelo
`commit-task`, sem `--no-verify` e sem contornar o gate de âmbito.

## Checklist de clareza

- Objetivo único e verificável — ATENDE (integrar o stash preservado, com os
  25 ficheiros nomeados)
- Arquivos afetados — ATENDE (25 ficheiros do stash, mais `docs/history.md` e os
  ficheiros de especificação)
- Entregáveis concretos — ATENDE
- Contrato de entrada, saída e erros — ATENDE (entrada: o stash
  `sessoes-anteriores-pre-TASK-006`; saída: os 25 ficheiros aplicados e
  verificados no `main`; erros: `git stash apply` em conflito, ou gate de âmbito
  com `E_SCOPE_VIOLATION`, param a task sem descarte)
- Testes obrigatórios — ATENDE
- Critério de aceitação objetivo — ATENDE
- Dependências declaradas explicitamente — ATENDE (nenhuma)
- Ausência de decisões pendentes para o implementador — ATENDE
