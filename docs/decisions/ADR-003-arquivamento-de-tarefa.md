# ADR-003: Arquivamento individual de tarefa

- Status: Accepted
- Data: 2026-11-15

## Contexto

A change 002 definia arquivamento por mudança inteira e proibia o arquivamento individual de tarefas. O usuário solicitou que tarefas concluídas e aprovadas sejam arquivadas individualmente.

## Alternativas consideradas

1. Manter o arquivamento apenas por mudança.
2. Mover a tarefa de arquivamento para um arquivo de arquivo dentro da mudança.
3. Apenas marcar a tarefa como arquivada, sem mover o arquivo.

## Decisão

Mover a tarefa de arquivamento para `specs/changes/NNN-slug/tasks/archive/TASK-NNN.md`, com `Status: ARCHIVED` e `- Arquivada em: YYYY-MM-DD`.

## Justificativa

- Preserva o histórico da tarefa sem acoplá-la às tarefas em aberto.
- Permite arquivamento gradual, tarefa a tarefa.
- Mantém a mudança aberta para as tarefas restantes.
- Movimentação atômica e recuperável.

## Consequências

- O ciclo de vida da tarefa ganha o estado `ARCHIVED`.
- Uma mudança é arquivada quando todas as suas tarefas estiverem arquivadas.
- A mudança arquivada vai para `specs/changes/archive/NNN-slug/`.
- O histórico de tarefas concluídas permanece rastreável.
