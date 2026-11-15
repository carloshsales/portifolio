# TASK-001 — Registrar histórico e decisões da sessão

- Change: 003-rawspec-v2
- Status: ARCHIVED
- Depende de: nenhuma
- Início: 2026-11-15
- Verificação: VERIFIED (2026-11-15) — `docs/history.md` criado com 9 entradas; ADR-002, ADR-003 e ADR-004 criados com Status Accepted; `prettier --check`, `pnpm lint`, `pnpm typecheck`, `pnpm test` (42 testes) e `pnpm build` aprovados; ADR-001 e change 002 intactos.
- Evidência: history.md e ADRs em `docs/`; verificações executadas em 2026-11-15.
- Arquivada em: 2026-11-15
- Plano de ação: none

## Objetivo

Criar o registro histórico obrigatório e os ADRs que documentam as decisões tomadas na sessão de melhoria das especificações.

## Arquivos

- `docs/history.md` (criação)
- `docs/decisions/ADR-002-uma-tarefa-por-arquivo.md` (criação)
- `docs/decisions/ADR-003-arquivamento-de-tarefa.md` (criação)
- `docs/decisions/ADR-004-historico-obrigatorio.md` (criação)

## Entregáveis

- `docs/history.md` append-only com uma entrada por decisão confirmada e uma entrada de evento da sessão.
- ADR-002 registrando a decisão de uma tarefa por arquivo.
- ADR-003 registrando a decisão de arquivamento individual de tarefa.
- ADR-004 registrando a decisão de histórico obrigatório com `history.md` e ADRs.
- Autor, origem, decisão, motivo, impacto e evidência preenchidos em cada entrada.

## Regras

- Não alterar `ADR-001-rawspec-storage.md`.
- `history.md` é append-only; não reescrever entradas.
- Usar a data de 2026-11-15 e o autor real do usuário.
- Registrar o evento da sessão de perguntas e respostas.
- Registrar a decisão de cessar a change 002 e migrar a change 001.
- Registrar a decisão de arquivar a mudança quando todas as tarefas forem arquivadas.

## Testes

- Verificação manual de que cada decisão das seções 8 e 9 da proposta aparece no histórico.
- Verificação de que os ADRs têm Status e seções completas.

## Aceitação

- `docs/history.md` existe, é append-only e registra as decisões da sessão.
- Os três ADRs existem, com Status `Accepted` e seções completas.
- Nenhum arquivo existente foi reescrito.

## Checklist de clareza

- Objetivo único e verificável — ATENDE
- Arquivos afetados — ATENDE
- Entregáveis concretos — ATENDE
- Contrato de entrada, saída e erros — NÃO SE APLICA (tarefa documental: a entrada são as decisões confirmadas e a saída são os arquivos de histórico e ADRs)
- Testes obrigatórios — ATENDE
- Critério de aceitação objetivo — ATENDE
- Dependências declaradas explicitamente — ATENDE
- Ausência de decisões pendentes para o implementador — ATENDE
