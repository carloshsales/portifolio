# TASK-005 — Implementar arquivamento de tarefa e mudança

- Change: 003-rawspec-v2
- Status: ARCHIVED
- Depende de: TASK-004
- Início: 2026-11-15
- Verificação: VERIFIED (2026-11-15) — `archiveTask`, `archiveChange`, `checkArchiveTask`, `checkArchiveChange`, `resolveWithinRepo` e `setDocumentField` implementados; 62 testes do módulo passando; `prettier --check`, `pnpm lint`, `pnpm typecheck`, `pnpm test` (104 testes) e `pnpm build` aprovados; movimentação atômica e idempotente testadas.
- Evidência: implementação e testes em `scripts/rawspec-v2.mjs` e `scripts/rawspec-v2.test.mjs`; verificações executadas em 2026-11-15.
- Arquivada em: 2026-11-15
- Plano de ação: none

## Objetivo

Implementar o arquivamento individual de tarefa e o arquivamento da mudança quando todas as tarefas estiverem arquivadas.

## Arquivos

- `scripts/rawspec-v2.mjs`
- `scripts/rawspec-v2.test.mjs`

## Entregáveis

- `archiveTask(taskRef, { approved })` movendo o arquivo para `tasks/archive/TASK-NNN.md` de forma atômica.
- `archiveChange(changeRef, { approved })` movendo a mudança para `specs/changes/archive/NNN-slug/`.
- `checkArchiveTask(taskRef)` e `checkArchiveChange(changeRef)` listando pendências.
- Marcação `Status: ARCHIVED` e `- Arquivada em: YYYY-MM-DD` no arquivo de tarefa.
- Marcação `Status: ARCHIVED` e `- Arquivada em: YYYY-MM-DD` no `proposal.md` da mudança.
- Recuperação idempotente: arquivo já em `archive/` não é movido de novo; destino já arquivado é concluído sem mover de novo.
- Validação completa antes de qualquer movimentação.

## Regras

- Tarefa só é arquivada com `COMPLETED` + `VERIFIED`, sem plano não resolvido e com aprovação humana.
- Mudança só é arquivada com todas as tarefas em `tasks/archive/` e planos `RESOLVED`.
- Movimentação com rename atômico no mesmo volume; nunca arquivo por arquivo.
- Falha de validação não move nada.
- Destino existente sem `Status: ARCHIVED` retorna `E_ARCHIVE_STATE_UNKNOWN`.
- Caminho com `..`, absoluto ou link simbólico que escape é recusado com `E_PATH_ESCAPE`.
- Sem commit, push, rebase ou reset.
- Staging, quando usado, somente em caminhos exatos.

## Testes

- Arquivar tarefa `COMPLETED` + `VERIFIED` move para `tasks/archive/`.
- Arquivar tarefa sem verificação é recusado.
- Arquivar tarefa com plano não resolvido é recusado.
- Arquivar tarefa sem aprovação é recusado.
- Tarefa já arquivada não é movida de novo.
- Arquivar mudança com todas as tarefas arquivadas move para `specs/changes/archive/`.
- Arquivar mudança com tarefa não arquivada é recusado.
- Falha de validação não move nenhum arquivo.
- Caminho com `..` e caminho absoluto são recusados.
- Destino sem marcador retorna `E_ARCHIVE_STATE_UNKNOWN`.
- Conteúdo e evidências preservados.

## Aceitação

- Tarefa e mudança são arquivadas somente quando elegíveis.
- Movimentação é atômica e idempotente.
- Nenhum caminho inseguro é seguido.

## Checklist de clareza

- Objetivo único e verificável — ATENDE
- Arquivos afetados — ATENDE
- Entregáveis concretos — ATENDE
- Contrato de entrada, saída e erros — ATENDE (entrada: referência da tarefa ou mudança e aprovação; saída: arquivo ou mudança arquivada; erros: `E_ARCHIVE_STATE_UNKNOWN`, `E_PATH_ESCAPE`, `E_APPROVAL_REQUIRED`, `E_DEPENDENCY_PENDING`)
- Testes obrigatórios — ATENDE
- Critério de aceitação objetivo — ATENDE
- Dependências declaradas explicitamente — ATENDE
- Ausência de decisões pendentes para o implementador — ATENDE
