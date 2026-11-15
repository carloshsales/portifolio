# TASK-004 — Implementar resolução, gates e transições

- Change: 003-rawspec-v2
- Status: ARCHIVED
- Depende de: TASK-003
- Início: 2026-11-15
- Verificação: VERIFIED (2026-11-15) — `resolveTask`, `listOpenTasks`, `listPendingChanges`, `selectNextTask`, `validateChangeApproval`, `buildDependencyGraph`, `validateDependencies`, `startTask`, `beginVerification`, `verifyTask`, `failTask` e `updateTaskFile` implementados; 48 testes do módulo passando; `prettier --check`, `pnpm lint`, `pnpm typecheck`, `pnpm test` (90 testes) e `pnpm build` aprovados; escrita atômica testada com falha simulada e preservação de LF/CRLF.
- Evidência: implementação e testes em `scripts/rawspec-v2.mjs` e `scripts/rawspec-v2.test.mjs`; verificações executadas em 2026-11-15.
- Arquivada em: 2026-11-15
- Plano de ação: none

## Objetivo

Implementar resolução de tarefas, validação de aprovação e dependências, seleção da próxima tarefa e transições de estado.

## Arquivos

- `scripts/rawspec-v2.mjs`
- `scripts/rawspec-v2.test.mjs`

## Entregáveis

- `resolveTask(taskId, { repoRoot, changeId })` buscando em `specs/changes/*/tasks/*.md`, excluindo `archive/` e `specs/changes/archive/`.
- `listOpenTasks(repoRoot)` retornando tarefas `IN PROGRESS` e `VERIFYING`.
- `listPendingChanges(repoRoot)` retornando mudanças aprovadas com tarefas `PENDING`.
- `selectNextTask(repoRoot, { changeId })` retornando a primeira `PENDING` não bloqueada.
- `validateChangeApproval(change)` exigindo `proposal.md` e `tasks.md` `APPROVED`, e `design.md` `APPROVED` quando existir.
- `buildDependencyGraph(tasks)` e `validateDependencies(task, tasks)`.
- `startTask`, `beginVerification`, `verifyTask`, `failTask` com escrita atômica e preservação de EOL.
- Exibição de `dependencySource` (`explicit`, `none`).

## Regras

- Tarefa em mudança arquivada retorna `E_TASK_ARCHIVED`.
- Tarefa inexistente retorna `E_TASK_NOT_FOUND`.
- Ambiguidade retorna `E_TASK_AMBIGUOUS` com candidatas.
- Mudança não aprovada retorna `E_CHANGE_NOT_APPROVED`.
- Dependência pendente retorna `E_DEPENDENCY_PENDING` com lista completa.
- Dependência inexistente retorna `E_DEPENDENCY_UNKNOWN`.
- Autodependência e ciclo retornam `E_DEPENDENCY_CYCLE`.
- `verifyTask` exige evidência não vazia.
- Transição inválida retorna `E_TASK_STATE`.
- `failTask` registra `Verificação: FAILED` e volta para `IN PROGRESS`.
- Nenhum comando altera status de aprovação.

## Testes

- Resolução única e com `--change`.
- Ambiguidade entre duas mudanças.
- Tarefa inexistente e tarefa arquivada.
- `selectNextTask` retorna a primeira `PENDING`.
- Primeira `PENDING` bloqueada retorna `E_DEPENDENCY_PENDING`.
- Nenhuma tarefa pendente retorna `E_NOTHING_TO_START`.
- Mudança não aprovada é recusada.
- Dependências explícitas completas, pendentes, inexistentes, autodependência e ciclo.
- `PENDING -> IN PROGRESS -> VERIFYING -> COMPLETED + VERIFIED`.
- `verify` sem evidência retorna `E_EVIDENCE_REQUIRED`.
- `fail` mantém a tarefa aberta.
- Preservação de LF e CRLF.
- Escrita atômica restaura conteúdo em erro simulado.

## Aceitação

- Resolução, gates e transições funcionam.
- Casos de erro retornam os códigos previstos.
- A change 003 não é escrita durante os testes.

## Checklist de clareza

- Objetivo único e verificável — ATENDE
- Arquivos afetados — ATENDE
- Entregáveis concretos — ATENDE
- Contrato de entrada, saída e erros — ATENDE (entrada: identificador de tarefa e evidência; saída: estado e lista de pendências; erros: `E_TASK_NOT_FOUND`, `E_TASK_AMBIGUOUS`, `E_TASK_ARCHIVED`, `E_CHANGE_NOT_APPROVED`, `E_DEPENDENCY_PENDING`, `E_DEPENDENCY_UNKNOWN`, `E_DEPENDENCY_CYCLE`, `E_DEPENDENCY_UNDECLARED`, `E_TASK_STATE`, `E_EVIDENCE_REQUIRED`)
- Testes obrigatórios — ATENDE
- Critério de aceitação objetivo — ATENDE
- Dependências declaradas explicitamente — ATENDE
- Ausência de decisões pendentes para o implementador — ATENDE
