# TASK-001 — Reparar o histórico e integrar as regras de execução

- Change: 006-agent-orchestrator
- Status: ARCHIVED
- Depende de: nenhuma
- Início: 2026-11-16
- Verificação: VERIFIED (2026-11-16) — docs/history.md sem entradas duplicadas (49 entradas) e sem codificacao corrompida (0 caracteres U+FFFD); AGENTS.md integrado com 114 linhas; README.md com referencia; pnpm lint, typecheck e test (134 passando, 1 pulado) e prettier --check aprovados em 2026-11-16
- Evidência: docs/history.md sem entradas duplicadas (49 entradas) e sem codificacao corrompida (0 caracteres U+FFFD); AGENTS.md integrado com 114 linhas; README.md com referencia; pnpm lint, typecheck e test (134 passando, 1 pulado) e prettier --check aprovados em 2026-11-16
- Plano de ação: none
- Arquivada em: 2026-11-16

## Objetivo

Reparar `docs/history.md` e integrar o `AGENTS.md` na branch principal, para que
qualquer agente que trabalha neste repositório leia as regras de execução sem
depender de uma branch não integrada.

## Arquivos

- `docs/history.md` (reparação)
- `AGENTS.md` (criação, a partir de `chore/agent-rules`)
- `README.md` (referência ao `AGENTS.md`)

## Entregáveis

- `docs/history.md` sem as duas entradas duplicadas de TASK-006 e TASK-007 da change 005.
- `docs/history.md` sem as cinco entradas com codificação corrompida (`ÔÇö`), reescritas em UTF-8 correcto.
- `AGENTS.md` presente na raiz, com o conteúdo de `chore/agent-rules` e a referência a `docs/projeto.md`.
- `README.md` com uma secção que refira o `AGENTS.md`.

## Regras

- `docs/history.md` é append-only: a reparação corrige apenas as entradas já corrompidas ou duplicadas, sem reescrever o histórico válido.
- A ordem das entradas é preservada. A entrada duplicada é removida, não movida.
- O `AGENTS.md` é copiado de `chore/agent-rules` sem alteração de conteúdo.
- Nenhum outro ficheiro é tocado. Esta tarefa não altera a aplicação.

## Testes

- `pnpm lint`, `pnpm typecheck` e `pnpm test` passam.
- `pnpm exec prettier --check docs/history.md AGENTS.md README.md` passa.
- Verificação de que `docs/history.md` não contém a sequência `ÔÇö`.
- Verificação de que existe exatamente uma entrada de cada TASK-006 e TASK-007 da change 005.
- `git diff --stat` confirma que só os três ficheiros declarados foram alterados.

## Aceitação

`AGENTS.md` está na branch principal e `docs/history.md` está íntegro, sem duplicados e sem codificação corrompida.

## Checklist de clareza

- Objetivo único e verificável — ATENDE
- Arquivos afetados — ATENDE
- Entregáveis concretos — ATENDE
- Contrato de entrada, saída e erros — ATENDE (entrada: `docs/history.md` actual e `chore/agent-rules:AGENTS.md`; saída: histórico reparado e `AGENTS.md` integrado; erros: entrada duplicada não localizada mantém-se e é reportada)
- Testes obrigatórios — ATENDE
- Critério de aceitação objetivo — ATENDE
- Dependências declaradas explicitamente — ATENDE
- Ausência de decisões pendentes para o implementador — ATENDE
