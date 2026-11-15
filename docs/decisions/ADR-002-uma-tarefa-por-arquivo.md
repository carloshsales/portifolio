# ADR-002: Uma tarefa por arquivo

- Status: Accepted
- Data: 2026-11-15

## Contexto

O formato anterior concentrava todas as tarefas de uma mudança em um único `tasks.md`. Isso acoplava tarefas entre si, dificultava a revisão isolada e impedia o arquivamento individual de uma tarefa concluída.

## Alternativas consideradas

1. Manter um `tasks.md` por mudança.
2. Criar um arquivo por tarefa em `specs/changes/NNN-slug/tasks/`.
3. Criar um arquivo por fase da mudança.

## Decisão

Adotar um arquivo por tarefa em `specs/changes/NNN-slug/tasks/TASK-NNN.md`.

## Justificativa

- Baixo acoplamento entre tarefas.
- Revisão e alteração isolada.
- Arquivamento individual possível.
- Conteúdo, status e evidências preservados por tarefa.
- Compatível com o formato Markdown versionado.

## Consequências

- A change 001 deve ser migrada.
- A change 002 deve ser marcada como SUPERSEDED.
- O parser passa a ler um arquivo por tarefa.
- Torna-se possível arquivar tarefas individualmente.
