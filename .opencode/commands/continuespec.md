---
description: Continua, verifica e conclui uma tarefa do RawSpec v2
argument-hint: [TASK-ID] [--change CHANGE-ID]
---

# /continuespec

Retoma uma tarefa existente.

## Regras

- Com `TASK-ID`: resolva e revalide aprovação e dependências.
- Sem argumento: continue a única tarefa aberta; se houver mais de uma, pergunte ao usuário.
- Se a tarefa estiver `PENDING`, oriente `/startspec TASK-ID`.
- Se estiver `IN PROGRESS`, continue a implementação e, ao concluir, use `begin-verify`.
- Se estiver `VERIFYING`, execute as verificações e registre a evidência com `verify` ou `fail`.
- Nunca reinicie tarefa concluída ou arquivada.
- Nunca altere o status de aprovação.
- Nunca faça `git commit` nem `git push`.

## Como executar

```bash
node scripts/rawspec-v2-cli.mjs open
node scripts/rawspec-v2-cli.mjs resolve TASK-001 --change 003-rawspec-v2
node scripts/rawspec-v2-cli.mjs begin-verify TASK-001 --change 003-rawspec-v2
node scripts/rawspec-v2-cli.mjs verify TASK-001 --evidence "testes aprovados" --change 003-rawspec-v2
node scripts/rawspec-v2-cli.mjs fail TASK-001 --evidence "lint falhou" --change 003-rawspec-v2
```

## Fechamento

Ao concluir, apresente a mensagem de commit pronta, sem executá-la:

```bash
node scripts/rawspec-v2-cli.mjs commit-message TASK-001 --change 003-rawspec-v2
```
