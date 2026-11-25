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
- Se estiver `VERIFYING`, invoque o agente `executor` para executar `pnpm test` e `pnpm test:e2e`, por esta ordem. Não execute esses comandos tu próprio. Envie a evidência ao verificador: se ele devolver `OK`, não registre ainda e aguarde as revisões; se devolver `FALHA`, registre com `fail`; se devolver `PENDENTE`, invoque de novo o `executor` para repetir o que falta.
- Se uma revisão reprovar, registre com `fail` e o motivo.
- Nunca reinicie tarefa concluída ou arquivada.
- Nunca altere o status de aprovação.
- Depois de as revisões aprovarem, registre com `verify` (`COMPLETED` + `VERIFIED`) e use `commit-task`: ele executa `pnpm lint`, `pnpm typecheck`, `pnpm test` e `pnpm build`, por esta ordem. Se todos passarem, aplica o gate de âmbito, commita e pusha.
- Depois do push, o `commit-task` abre o pull request da branch da tarefa para `main`, com `gh pr create --base main --head <branch>`. A criação é idempotente: se já existir um pull request aberto para a branch, o URL existente é reportado e nenhum duplicado é criado. O pull request nunca é fundido automaticamente.
- Se o `gh` não estiver disponível, a autenticação falhar, ou a criação do pull request falhar, reporte o erro exacto. O commit e o push permanecem válidos, e a verificação da tarefa não é reprovada por causa do pull request.
- Se qualquer verificação falhar, nenhum commit é feito.
- Os hooks do Husky permanecem ativos: `pre-commit` (lint-staged) e `pre-push` (typecheck, test, build). Podem repetir verificações já executadas. Nunca use `--no-verify`.
- Ao final, reporte a branch, o resultado do push, o URL e o estado do pull request.
- Ao final, reporte também a próxima task a realizar: peça-a ao `guardiao`, que a consulta com `node scripts/rawspec-v2-cli.mjs next`. Use o formato `PROXIMA: <id> — <título>`, ou `PROXIMA: nenhuma — a change NNN-slug está completa` quando não houver. É informação: não implemente a próxima task nem alteres o seu estado.

## Como executar

```bash
node scripts/rawspec-v2-cli.mjs open
node scripts/rawspec-v2-cli.mjs resolve TASK-NNN --change NNN-slug
node scripts/rawspec-v2-cli.mjs begin-verify TASK-NNN --change NNN-slug
node scripts/rawspec-v2-cli.mjs verify TASK-NNN --evidence "pnpm test: exit 0; pnpm test:e2e: exit 0" --change NNN-slug
node scripts/rawspec-v2-cli.mjs commit-task TASK-NNN --change NNN-slug
```

O `commit-task` abre o pull request depois do push. Para abrir o pull request
à parte, quando o `commit-task` correu sem push:

```bash
node scripts/rawspec-v2-cli.mjs open-pr TASK-NNN --change NNN-slug
```

Para registrar falha sem concluir:

```bash
node scripts/rawspec-v2-cli.mjs fail TASK-NNN --evidence "pnpm test: exit 1 — <primeira linha de erro>" --change NNN-slug
```
