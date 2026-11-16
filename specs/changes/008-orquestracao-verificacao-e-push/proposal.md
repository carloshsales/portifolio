# Change 008 — Orquestração, verificação e push

- Status: APPROVED
- Tipo: Processo / ferramentas de desenvolvimento
- Prioridade: Alta

## 1. Objetivo

Ajustar o fluxo de orquestração para que, no fluxo padrão, o utilizador execute manualmente apenas `pnpm test` e `pnpm test:e2e`, com o orquestrador a apresentar esses comandos e a aguardar os resultados antes da revisão e do registo. Os hooks automáticos permanecem ativos e podem repetir parte da suíte no commit/push. Após a evidência e as revisões, o guardião executa `node scripts/rawspec-v2-cli.mjs commit-task TASK-013 --change 008-orquestracao-verificacao-e-push`, que faz commit/push e roda os seus checks automáticos (lint, typecheck, test, build) e os hooks Husky, reportando a branch e o resultado do push.

## 2. Escopo funcional

1. Atualizar `AGENTS.md` para refletir a nova divisão de responsabilidades (utilizador executa verificações; verificador avalia evidência).
2. Atualizar `.opencode/commands/orquestrar.md` para apresentar os comandos ordenados e aguardar resultados.
3. Atualizar `docs/orquestrador.md` com o fluxo e a ordem de checks.
4. Atualizar `.opencode/agents/verificador.md` para não executar shell, apenas avaliar evidência do utilizador.
5. Atualizar `.opencode/agents/guardiao.md` para reportar branch e resultado do push, mantendo hooks ativos.
6. Corrigir a contradição existente em `docs/rawspec-v2.md` (princípio 7 vs §15).
7. Manter hooks automáticos ativos (opção A), podendo repetir checks no commit/push.
8. Atualizar `docs/projeto.md` para que as referências a verificador/testes/branch não fiquem obsoletas.
9. Atualizar `.opencode/agents/orquestrador.md` para alinhar com a nova divisão de responsabilidades.
10. Atualizar `.opencode/commands/continuespec.md` para alinhar o fluxo com a regra geral, mantendo as verificações automáticas de hooks/commit (opção A).
11. Atualizar `.opencode/commands/startspec.md` para alinhar o fluxo com a regra geral, mantendo as verificações automáticas de hooks/commit (opção A).
12. Atualizar `scripts/rawspec-v2.mjs` para que `commitAndPushTask` execute, por ordem, `pnpm lint`, `pnpm typecheck`, `pnpm test` e `pnpm build`.
13. Atualizar `scripts/rawspec-v2.test.mjs` para comprovar a ordem dos checks e impedir commit/push se o lint falhar.

## 3. Verificações executadas pelo utilizador (fluxo padrão)

1. `pnpm test`
2. `pnpm test:e2e`

Contrato mínimo de evidência: para cada comando, identificar o comando exato e o resultado final/passagem (exit code 0 ou resumo de sucesso); se falhar, fornecer a saída relevante e parar o pipeline para correção; se a evidência estiver ausente/ambígua, pedir complemento e não avançar. O verificador avalia essa evidência sem executar shell.

Checks manuais do utilizador: `pnpm test`, `pnpm test:e2e`.
Checks automáticos do `commit-task`/hooks: lint, typecheck, test, build (podem repetir parte da suíte).

Os sete scripts `bakeoff/*` não fazem parte do fluxo normal do utilizador.

## 4. Fora do escopo

- Implementação de código de produto (exceto alteração do helper RawSpec em `scripts/rawspec-v2.mjs` e dos respetivos testes em `scripts/rawspec-v2.test.mjs`).
- Alteração de aprovações de mudanças ou tarefas.
- Reescrita de histórico ou remoção de branches.

## 5. Critérios de aceitação

- Documentos de orquestração refletem a nova divisão de responsabilidades.
- O orquestrador apresenta comandos por ordem e aguarda resultados do utilizador.
- O verificador não executa shell, apenas avalia evidência.
- O guardião reporta branch e resultado do push.
- Hooks automáticos permanecem ativos.
- Contradição em `docs/rawspec-v2.md` corrigida.
- Verificações do projeto passam conforme evidência do utilizador, segundo o contrato mínimo de evidência (comando exato + resultado final/passagem), distinguindo checks manuais de checks automáticos.

## 6. Restrições

- Não alterar status de aprovação de mudança ou tarefa.
- Não fazer commit ou push sem todos os gates passarem.
- Não usar `--no-verify`.
- Escopo limitado aos ficheiros listados na TASK-013.

## 7. Aprovação

A implementação somente poderá começar após aprovação desta proposta.