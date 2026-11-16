# TASK-013 — Orquestração, verificação pelo utilizador e push

- Change: 008-orquestracao-verificacao-e-push
- Status: COMPLETED
- Depende de: nenhuma
- Início: 2026-11-16
- Verificação: VERIFIED (2026-11-16) — pnpm test: exit 0, 146 aprovados e 1 ignorado; pnpm test:e2e: exit 0, 15 aprovados em 3 viewports (mobile, tablet, desktop)
- Evidência: pnpm test: exit 0, 146 aprovados e 1 ignorado; pnpm test:e2e: exit 0, 15 aprovados em 3 viewports (mobile, tablet, desktop)
- Plano de ação: none

## Contexto

A alteração aprovada já foi aplicada nesta branch nos 12 ficheiros classificados como alteração em `## Arquivos`; a proposta aprovada permanece preservada. O trabalho pendente é rever e validar o fluxo aplicado. O utilizador executa pessoalmente as verificações por ordem e envia a evidência dos resultados. Os hooks automáticos permanecem ativos e podem repetir as verificações no commit/push. O orquestrador apresenta os comandos ordenados e aguarda os resultados do utilizador antes da revisão e do registo.

## Objetivo

Revisar e validar o fluxo já aplicado nos 12 ficheiros classificados como alteração em `## Arquivos`: confirmar que, no fluxo padrão, o utilizador executa manualmente somente `pnpm test` e `pnpm test:e2e`, por ordem; o verificador avalia essa evidência sem shell; depois, após as revisões e todos os gates, o guardião executa o `commit-task` oficial, que corre `pnpm lint`, `pnpm typecheck`, `pnpm test` e `pnpm build` por essa ordem e aciona os hooks, podendo repetir checks; e o relatório contém a branch e o resultado do push. Confirmar também que a contradição existente em `docs/rawspec-v2.md` (princípio 7 vs §15) está resolvida e que `commitAndPushTask`, em `scripts/rawspec-v2.mjs`, e os respetivos testes, em `scripts/rawspec-v2.test.mjs`, garantem a ordem dos checks e impedem commit/push se o lint falhar. Corrigir apenas defeitos encontrados na revisão, sem reimplementar o fluxo do zero nem ampliar o escopo.

## Arquivos

- `AGENTS.md` (alteração)
- `.opencode/commands/orquestrar.md` (alteração)
- `docs/orquestrador.md` (alteração)
- `.opencode/agents/verificador.md` (alteração)
- `.opencode/agents/guardiao.md` (alteração)
- `docs/rawspec-v2.md` (alteração)
- `docs/projeto.md` (alteração)
- `.opencode/agents/orquestrador.md` (alteração)
- `.opencode/commands/continuespec.md` (alteração)
- `.opencode/commands/startspec.md` (alteração)
- `scripts/rawspec-v2.mjs` (alteração)
- `scripts/rawspec-v2.test.mjs` (alteração)
- `package.json` (alteração)
- `specs/changes/008-orquestracao-verificacao-e-push/proposal.md` (preservado no commit; proposta aprovada, sem alteração de conteúdo)
## Entregáveis

- Revisão dos 12 ficheiros classificados como alteração, confirmando os requisitos abaixo e corrigindo apenas defeitos encontrados:
  - `AGENTS.md` reflete a nova divisão de responsabilidades (utilizador executa verificações; verificador avalia evidência).
  - `.opencode/commands/orquestrar.md` apresenta os comandos ordenados e aguarda resultados do utilizador.
  - `docs/orquestrador.md` documenta o fluxo e a ordem de checks.
  - `.opencode/agents/verificador.md` não executa shell e apenas avalia evidência do utilizador.
  - `.opencode/agents/guardiao.md` reporta a branch e o resultado do push, mantendo hooks ativos.
  - `docs/rawspec-v2.md` não contém a contradição entre o princípio 7 e a §15.
  - `docs/projeto.md` não mantém referências obsoletas a verificador/testes/branch.
  - `.opencode/agents/orquestrador.md` está alinhado com a nova divisão de responsabilidades.
  - `.opencode/commands/continuespec.md` está alinhado com a regra geral e mantém as verificações automáticas de hooks/commit (opção A).
  - `.opencode/commands/startspec.md` está alinhado com a regra geral e mantém as verificações automáticas de hooks/commit (opção A).
  - `scripts/rawspec-v2.mjs` faz `commitAndPushTask` executar, por ordem, `pnpm lint`, `pnpm typecheck`, `pnpm test` e `pnpm build`.
  - `scripts/rawspec-v2.test.mjs` comprova a ordem dos checks e impede commit/push se o lint falhar.
  - `package.json` faz `test:e2e` correr `pnpm build` antes do Playwright, para que o comando funcione de raiz, sem depender de um build prévio.

## Regras

- No fluxo padrão, o utilizador executa manualmente apenas `pnpm test` e `pnpm test:e2e`; o orquestrador apresenta esses comandos e aguarda os resultados antes da revisão/registo.
- `pnpm test:e2e` executa `pnpm build` antes do Playwright, porque o `vite preview` serve `dist/`, que é ignorado pelo Git e não existe num clone novo.
- Os sete scripts `bakeoff/*` não fazem parte do fluxo normal do utilizador.
- O verificador não executa shell; apenas avalia a evidência fornecida pelo utilizador.
- Hooks automáticos permanecem ativos (opção A) e podem repetir as verificações no commit/push.
- Após a evidência e as revisões, o guardião executa `node scripts/rawspec-v2-cli.mjs commit-task TASK-013 --change 008-orquestracao-verificacao-e-push`, que faz commit/push e roda os seus checks automáticos (lint, typecheck, test, build) e os hooks Husky; reporta a branch e o resultado do push.
- Os checks/hooks automáticos podem repetir parte da suíte.
- O utilizador não executa commit/push; o guardião faz isso via `commit-task`.
- Não alterar status de aprovação de mudança ou tarefa.
- Não implementar código de produto; no helper RawSpec em `scripts/rawspec-v2.mjs` e nos respetivos testes em `scripts/rawspec-v2.test.mjs`, corrigir apenas defeitos encontrados na revisão.
- `commitAndPushTask` executa os checks por ordem: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`; se o lint falhar, não há commit nem push.
- Os sete scripts `bakeoff/*` não fazem parte do fluxo normal.
- Não adicionar entradas em `docs/history.md` nem criar ADRs nesta tarefa.
- Não fazer commit ou push manualmente.

## Testes

- Verificações obrigatórias (executadas pelo utilizador, por ordem):
  1. `pnpm test`
  2. `pnpm test:e2e`
- O verificador avalia a evidência enviada pelo utilizador para cada comando e regista o resultado, sem executar shell.
- Os checks automáticos do `commit-task` (lint, typecheck, test, build) e os hooks Husky podem repetir parte da suíte.
- Os testes em `scripts/rawspec-v2.test.mjs` comprovam a ordem dos checks e impedem commit/push se o lint falhar.

## Contrato mínimo de evidência

Para cada comando executado manualmente pelo utilizador, a evidência deve conter:

- O comando exato executado.
- O resultado final / passagem (exit code 0 ou resumo de sucesso).

Se um comando falhar, deve fornecer a saída relevante e parar o pipeline para correção. Se a evidência estiver ausente ou ambígua, o verificador pede complemento e não avança.

Checks manuais (utilizador): `pnpm test`, `pnpm test:e2e`.
Checks automáticos (commit-task/hooks): lint, typecheck, test, build.

## Aceitação

Condição objetiva de conclusão: os 12 ficheiros classificados como alteração foram revistos e validados, e estão consistentes com a nova divisão de responsabilidades, incluindo `docs/projeto.md`, `.opencode/agents/orquestrador.md`, `.opencode/commands/continuespec.md` e `.opencode/commands/startspec.md`; os defeitos identificados na revisão foram corrigidos; a ordem de checks está documentada e implementada em `commitAndPushTask` (`pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`); a contradição em `docs/rawspec-v2.md` está resolvida; os hooks automáticos permanecem ativos; o guardião reporta a branch e o resultado do push via `commit-task`; `pnpm test:e2e` executa `pnpm build` antes do Playwright, de modo a funcionar de raiz; a evidência manual do utilizador segue o contrato mínimo (comando exato + resultado final/passagem) e distingue checks manuais de checks automáticos. Incluir a proposta aprovada (`proposal.md`) no mesmo commit mantém a change e a task rastreáveis no push, sem exigir alteração de conteúdo.

## Checklist de clareza

- Objetivo único e verificável — ATENDE
- Arquivos afetados — ATENDE
- Entregáveis concretos — ATENDE
- Contrato de entrada, saída e erros — ATENDE
- Testes obrigatórios — ATENDE
- Critério de aceitação objetivo — ATENDE
- Dependências declaradas explicitamente — ATENDE
- Ausência de decisões pendentes para o implementador — ATENDE
