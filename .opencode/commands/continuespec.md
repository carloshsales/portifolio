---
description: Continua, regista a evidência de verificação e conclui uma tarefa do RawSpec v2
argument-hint: [TASK-ID] [--change CHANGE-ID]
---

# /continuespec

Retoma uma tarefa existente, regista a evidência de verificação e, ao concluir, faz commit e push na branch da tarefa.

## Regras

- Com `TASK-ID`: resolva e revalide aprovação e dependências.
- Sem argumento: continue a única tarefa aberta; se houver mais de uma, pergunte ao usuário.
- Se a tarefa estiver `PENDING`, oriente `/startspec TASK-ID`.
- Se estiver `IN PROGRESS`, continue a implementação e, ao concluir, use `begin-verify`.
- Se estiver `VERIFYING`, peça ao usuário a evidência de `pnpm test` e `pnpm test:e2e`, por esta ordem. Não execute esses comandos. Envie a evidência ao verificador: se ele devolver `OK`, não registre ainda e aguarde as revisões; se devolver `FALHA`, registre com `fail`; se devolver `PENDENTE`, peça o complemento indicado.
- Se uma revisão reprovar, registre com `fail` e o motivo.
- Nunca reinicie tarefa concluída ou arquivada.
- Nunca altere o status de aprovação.
- Depois de as revisões aprovarem, registre com `verify` (`COMPLETED` + `VERIFIED`) e use `commit-task`: ele executa `pnpm lint`, `pnpm typecheck`, `pnpm test` e `pnpm build`, por esta ordem. Se todos passarem, aplica o gate de âmbito, commita e pusha.
- Se qualquer verificação falhar, nenhum commit é feito.
- Os hooks do Husky permanecem ativos: `pre-commit` (lint-staged) e `pre-push` (typecheck, test, build). Podem repetir verificações já executadas. Nunca use `--no-verify`.
- Ao final, reporte a branch e o resultado do push.

## Como executar

```bash
node scripts/rawspec-v2-cli.mjs open
node scripts/rawspec-v2-cli.mjs resolve TASK-NNN --change NNN-slug
node scripts/rawspec-v2-cli.mjs begin-verify TASK-NNN --change NNN-slug
node scripts/rawspec-v2-cli.mjs verify TASK-NNN --evidence "pnpm test: exit 0; pnpm test:e2e: exit 0" --change NNN-slug
node scripts/rawspec-v2-cli.mjs commit-task TASK-NNN --change NNN-slug
```

Para registrar falha sem concluir:

```bash
node scripts/rawspec-v2-cli.mjs fail TASK-NNN --evidence "pnpm test: exit 1 — <primeira linha de erro>" --change NNN-slug
```
