# TASK-013 — Diagnóstico-first: falha `lint-staged could not find any staged files` no commit-task de TASK-006

- Change: 001-portfolio-mvp
- Status: COMPLETED
- Depende de: TASK-002
- Início: 2026-11-19
- Verificação: VERIFIED (2026-11-23) — pnpm test: 6 ficheiros, 160 passed, 1 skipped (161), 45.14s; 14/14 scripts/rawspec-v2-cli.test.mjs passed. pnpm test:e2e: build passou, 15 passed, 0 falhas (7.6s). Diagnóstico: falha original não reproduzida; fixture real confirma que o hook Markdown-only funciona; nenhum código de produção corrigido. Correcções de revisão limitaram-se ao teste scripts/rawspec-v2-cli.test.mjs. Revisor A e B finais APROVADOS, sem achados. Incidente de processo: agente alternativo fez mutação temporária em scripts/rawspec-v2.mjs com --no-verify para teste de mutação, depois restaurou; inspecção read-only confirmou HEAD sem commit novo, diff de produção vazio, sem staging/push, apenas ficheiros não rastreados esperados. Utilizadora informada e autorizou retomar sem novas mutações. Não se usou --no-verify neste registo.
- Evidência: pnpm test: 6 ficheiros, 160 passed, 1 skipped (161), 45.14s; 14/14 scripts/rawspec-v2-cli.test.mjs passed. pnpm test:e2e: build passou, 15 passed, 0 falhas (7.6s). Diagnóstico: falha original não reproduzida; fixture real confirma que o hook Markdown-only funciona; nenhum código de produção corrigido. Correcções de revisão limitaram-se ao teste scripts/rawspec-v2-cli.test.mjs. Revisor A e B finais APROVADOS, sem achados. Incidente de processo: agente alternativo fez mutação temporária em scripts/rawspec-v2.mjs com --no-verify para teste de mutação, depois restaurou; inspecção read-only confirmou HEAD sem commit novo, diff de produção vazio, sem staging/push, apenas ficheiros não rastreados esperados. Utilizadora informada e autorizou retomar sem novas mutações. Não se usou --no-verify neste registo.
- Plano de ação: none

## Objetivo

Investigar a falha observada no commit-task de TASK-006, em que havia `TASK-006.md` modificado e o commit chegou ao hook Husky e falhou com a mensagem exacta `lint-staged could not find any staged files`; o helper reportou nenhum ficheiro staged. A causa não está confirmada.

Adoptar abordagem diagnóstico-first: reproduzir num repositório temporário o fluxo real `commit-task` → `git add` → `.husky/pre-commit` → `lint-staged` com alteração exclusivamente RawSpec/Markdown; identificar se o problema é de staging ou de invocação do hook. Se a falha não for reproduzida, documentar a evidência e parar para decisão do utilizador, sem inventar causa. Corrigir apenas se a falha for reproduzida, preservando os hooks ativos e proibindo `--no-verify` ou desactivação do Husky. Confirmar também que ficheiros TS/JS staged continuam a passar pelo lint-staged.

## Arquivos

- `.husky/pre-commit` (alteração prevista apenas se o diagnóstico confirmar a causa aí)
- `package.json` (alteração prevista apenas se o diagnóstico confirmar a causa aí)
- `scripts/rawspec-v2.mjs` (alteração prevista apenas se o diagnóstico confirmar a causa aí)
- `scripts/rawspec-v2.test.mjs` (alteração prevista: teste de regressão do caso markdown-only)
- `scripts/rawspec-v2-cli.test.mjs` (CRIAÇÃO: teste de integração real do CLI/hook; o caminho não existe nesta base main)
- `scripts/rawspec-v2-cli.mjs` — leitura/execução read-only; não pode ser alterado sem nova decisão do utilizador.

Qualquer outro ficheiro apenas após decisão do utilizador.

## Entregáveis

- Causa confirmada ou não reproduzida com evidência.
- Quando reproduzida: correcção mínima e teste de regressão.
- Sem uso de `--no-verify`.
- Evidência do diagnóstico (comandos e resultados) registada.

## Regras

- Não usar `--no-verify` em nenhuma circunstância.
- Não desativar nem contornar os hooks do Husky.
- Investigar primeiro a causa real (helper staging vs. invocação lint-staged) e só então corrigir; não prescrever uma única solução arquitetural.
- Restringir alterações aos ficheiros listados em `## Arquivos`.
- Preservar a execução normal dos hooks para ficheiros TS/JS.
- Se a falha não for reproduzida, parar e reportar a evidência ao utilizador; não inventar causa.
- Qualquer ficheiro fora do âmbito apenas após decisão do utilizador.

## Testes

- Teste de regressão deve exercer o hook pre-commit real e o commit-task em fixture Git temporário com alterações Markdown-only. A fixture Git deve isolar `GIT_DIR` e `GIT_WORK_TREE` (e a configuração de hooks) e nunca apontar para o repositório/worktree real.
- Teste de regressão deve incluir um caso TS/JS staged que prove o lint-staged executa o lint.
- Não aceitar teste que apenas mocka o hook sem o executar.
- `pnpm test` passa com a totalidade da suíte.
- `pnpm test:e2e` passa.
- Hook `pre-commit` ativo (sem `--no-verify`) durante a validação.

## Aceitação

Commits de alterações válidas apenas em Markdown/spec não falham com `lint-staged could not find any staged files`; os hooks permanecem ativos e sem `--no-verify`; ficheiros TS/JS staged continuam a ser lintados; `pnpm test` e `pnpm test:e2e` passam.

## Checklist de clareza

- Objetivo único e verificável — ATENDE
- Arquivos afetados — ATENDE
- Entregáveis concretos — ATENDE
- Contrato de entrada, saída e erros — ATENDE
- Testes obrigatórios — ATENDE
- Critério de aceitação objetivo — ATENDE
- Dependências declaradas explicitamente — ATENDE
- Ausência de decisões pendentes para o implementador — ATENDE