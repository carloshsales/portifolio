---
description: Arquiva uma mudança do RawSpec v2 quando elegível
argument-hint: [CHANGE-ID]
---

# /archivespec

Arquiva a mudança inteira em `specs/changes/archive/NNN-slug/`.

## Regras

- Só archive quando todas as tarefas estiverem em `tasks/archive/` com `Status: ARCHIVED`.
- Exija todos os planos de ação em `RESOLVED`.
- Pergunte a aprovação do usuário antes de arquivar. Sem aprovação explícita, não mova.
- Sem argumento, verifique a única mudança elegível; se houver mais de uma, pergunte ao usuário.
- Mudança já arquivada não é movida de novo.
- Nunca faça `git commit` nem `git push`.

## Como executar

```bash
node scripts/rawspec-v2-cli.mjs check-archive-change 003-rawspec-v2
node scripts/rawspec-v2-cli.mjs archive-change 003-rawspec-v2 --approved
```
