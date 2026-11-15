# TASK-003 — Implementar parser v2

- Change: 003-rawspec-v2
- Status: ARCHIVED
- Depende de: TASK-002
- Início: 2026-11-15
- Verificação: VERIFIED (2026-11-15) — `scripts/rawspec-v2.mjs` e `scripts/rawspec-v2.test.mjs` criados; 24 testes do parser passando; `prettier --check`, `pnpm lint`, `pnpm typecheck`, `pnpm test` (66 testes) e `pnpm build` aprovados; o parser lê a change 003 sem escrever nela.
- Evidência: parser e testes em `scripts/`; verificações executadas em 2026-11-15.
- Arquivada em: 2026-11-15
- Plano de ação: none

## Objetivo

Implementar o parser que lê um arquivo por tarefa e valida campos, status, dependências e estrutura.

## Arquivos

- `scripts/rawspec-v2.mjs` (criação)
- `scripts/rawspec-v2.test.mjs` (criação)

## Entregáveis

- `parseTaskFile(path)` retornando `{ id, title, change, status, verification, evidence, dependencies, dependencySource, actionPlan, startedAt, archivedAt, file }`.
- `parseChange(dir)` retornando `{ id, dir, proposalStatus, designStatus, tasks }`.
- `normalizeTaskId(raw)` e `normalizeChangeId(raw, changes)`.
- `RawspecError` com `code`, `message` e `details`.
- Validação de campos: `Change` obrigatório; `Status` em `PENDING`, `IN PROGRESS`, `VERIFYING`, `COMPLETED`, `ARCHIVED`; `Verificação` em `PENDING`, `VERIFIED`, `FAILED`; `Depende de` obrigatório; dependências no padrão `TASK-\d+`.
- Rejeitar estrutura malformada com `E_PARSE`: arquivo ausente/ilegível, cabeçalho sem `# TASK-NNN — Título`, título vazio, campo inválido, bloco de código não fechado, UTF-8 inválido.

## Regras

- Um arquivo é uma tarefa; não há seções `###` dentro do arquivo.
- `Status` ausente equivale a `PENDING`; `Verificação` ausente equivale a `PENDING`.
- `Depende de` ausente em mudança v2 retorna `E_DEPENDENCY_UNDECLARED`.
- `Depende de: nenhuma` ou `—` retorna `dependencySource: none`.
- O parser não escreve arquivos.
- Sem dependências novas de runtime.
- Preservar UTF-8 e não normalizar conteúdo.

## Testes

- Ler tarefa completa com todos os campos.
- Ler tarefa com campos ausentes.
- Normalizar `TASK-3` para `TASK-003`.
- `Status` e `Verificação` com e sem negrito.
- `Depende de: nenhuma` e `Depende de: —`.
- `Depende de` com lista de várias tarefas.
- `Depende de` malformado retorna `E_PARSE`.
- `Status` desconhecido retorna `E_PARSE`.
- `Verificação` desconhecida retorna `E_PARSE`.
- `Change` ausente retorna `E_PARSE`.
- Cabeçalho sem título retorna `E_PARSE`.
- Bloco de código não fechado retorna `E_PARSE`.
- UTF-8 inválido retorna `E_PARSE`.
- `parseChange` com `design.md` ausente.

## Aceitação

- Os testes de parsing passam.
- Estruturas malformadas retornam `E_PARSE`.
- O parser lê a change 003 sem escrever nela.

## Checklist de clareza

- Objetivo único e verificável — ATENDE
- Arquivos afetados — ATENDE
- Entregáveis concretos — ATENDE
- Contrato de entrada, saída e erros — ATENDE (entrada: caminho do arquivo de tarefa; saída: estrutura da tarefa; erros: `E_PARSE`)
- Testes obrigatórios — ATENDE
- Critério de aceitação objetivo — ATENDE
- Dependências declaradas explicitamente — ATENDE
- Ausência de decisões pendentes para o implementador — ATENDE
