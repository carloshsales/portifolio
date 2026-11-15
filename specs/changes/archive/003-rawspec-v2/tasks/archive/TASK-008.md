# TASK-008 — Migrar change 001 e marcar change 002

- Change: 003-rawspec-v2
- Status: ARCHIVED
- Depende de: TASK-007
- Início: 2026-11-15
- Verificação: VERIFIED (2026-11-15) — `migrateLegacyChange` implementado e testado; change 001 migrada (12 tarefas: 4 arquivadas, 8 ativas) com dependências explícitas derivadas; change 002 marcada como SUPERSEDED; parser v2 lê a change 001; `next --change 001-portfolio-mvp` retorna TASK-005; scan ignora mudanças SUPERSEDED/legadas; 80 testes do módulo passando; `prettier --check`, `pnpm lint`, `pnpm typecheck`, `pnpm test` (121 passando, 1 pulado) e `pnpm build` aprovados.
- Evidência: migração em `specs/changes/001-portfolio-mvp/`; implementação e testes em `scripts/`; verificações executadas em 2026-11-15.
- Arquivada em: 2026-11-15
- Plano de ação: none

## Objetivo

Migrar a change `001-portfolio-mvp` para o formato v2 e marcar a change `002-rawspec-task-commands` como `SUPERSEDED`.

## Arquivos

- `scripts/rawspec-v2.mjs`
- `scripts/rawspec-v2.test.mjs`
- `specs/changes/001-portfolio-mvp/tasks/` (criação)
- `specs/changes/001-portfolio-mvp/tasks/archive/` (criação)
- `specs/changes/001-portfolio-mvp/tasks.md` (remoção após migração validada)
- `specs/changes/002-rawspec-task-commands/proposal.md` (marcação)

## Entregáveis

- `migrateLegacyChange(changeDir)` lendo `tasks.md` legado, criando um arquivo por tarefa, preservando status, verificação, evidência e conteúdo.
- Dependências explícitas derivadas da ordem do arquivo legado (`nenhuma` para a primeira).
- Tarefas `COMPLETED` movidas para `tasks/archive/`.
- Change 001 validada pelo parser v2 após a migração.
- Change 002 com `proposal.md` marcado como `Status: SUPERSEDED` e `- Superseded by: 003-rawspec-v2`.

## Regras

- Preservar todo o conteúdo e evidências das tarefas da change 001.
- Não alterar `proposal.md` e `design.md` da change 001.
- Remover `tasks.md` somente após validação completa.
- Não executar nem migrar as tarefas pendentes da change 002.
- Não alterar `tasks.md` e `design.md` da change 002.
- Não fazer commit nem push.

## Testes

- Migração em diretório temporário preserva status e evidência.
- Dependências explícitas derivadas da ordem.
- Tarefas concluídas vão para `tasks/archive/`.
- Parser v2 lê a change migrada sem erro.
- Change 002 marcada como `SUPERSEDED` e demais documentos intactos.
- Comparação antes/depois sem perda de conteúdo.

## Aceitação

- A change 001 está em formato v2, com tarefas em arquivos individuais e concluídas em `tasks/archive/`.
- A change 002 está marcada como `SUPERSEDED`.
- Nenhum conteúdo foi perdido.

## Checklist de clareza

- Objetivo único e verificável — ATENDE
- Arquivos afetados — ATENDE
- Entregáveis concretos — ATENDE
- Contrato de entrada, saída e erros — ATENDE (entrada: diretório da mudança legada; saída: tarefas migradas e change 002 marcada; erros: `E_PARSE`, `E_PATH_ESCAPE`)
- Testes obrigatórios — ATENDE
- Critério de aceitação objetivo — ATENDE
- Dependências declaradas explicitamente — ATENDE
- Ausência de decisões pendentes para o implementador — ATENDE
