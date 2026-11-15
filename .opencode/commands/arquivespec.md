---
description: Arquiva uma tarefa do RawSpec v2 após aprovação
argument-hint: TASK-ID [--change CHANGE-ID]
---

# /arquivespec

Arquiva uma tarefa em `tasks/archive/TASK-NNN.md` e commita o arquivamento na branch da tarefa.

## Regras

- Exija `Status: COMPLETED` e `Verificação: VERIFIED`, sem plano de ação não resolvido.
- Pergunte a aprovação do usuário antes de arquivar. Sem aprovação explícita, não mova.
- Tarefa já arquivada não é movida de novo.
- Depois de arquivar, use `commit-task` para commitar e pushar o arquivamento.
- Se as verificações falharem, nenhum commit é feito.
- Os hooks do Husky rodam no commit e no push.

## Como executar

```bash
node scripts/rawspec-v2-cli.mjs check-archive-task TASK-001 --change 003-rawspec-v2
node scripts/rawspec-v2-cli.mjs archive-task TASK-001 --change 003-rawspec-v2 --approved
node scripts/rawspec-v2-cli.mjs commit-task TASK-001 --change 003-rawspec-v2
```
