---
description: Arquiva uma tarefa do RawSpec v2 após aprovação
argument-hint: TASK-ID [--change CHANGE-ID]
---

# /arquivespec

Arquiva uma tarefa em `tasks/archive/TASK-NNN.md`.

## Regras

- Exija `Status: COMPLETED` e `Verificação: VERIFIED`, sem plano de ação não resolvido.
- Pergunte a aprovação do usuário antes de arquivar. Sem aprovação explícita, não mova.
- Tarefa já arquivada não é movida de novo.
- Nunca faça `git commit` nem `git push`.

## Como executar

```bash
node scripts/rawspec-v2-cli.mjs check-archive-task TASK-001 --change 003-rawspec-v2
node scripts/rawspec-v2-cli.mjs archive-task TASK-001 --change 003-rawspec-v2 --approved
```
