---
description: Inicia a execução de uma tarefa do RawSpec v2
argument-hint: [TASK-ID] [--change CHANGE-ID]
---

# /startspec

Inicia uma tarefa `PENDING` do RawSpec v2 em sua própria branch.

## Regras

- Com `TASK-ID`: resolva a tarefa, valide aprovação da mudança e dependências, crie a branch e inicie.
- Sem argumento: use `next` para selecionar a próxima tarefa pendente.
- Se já existir tarefa aberta, pergunte ao usuário antes de iniciar outra. Se ele recusar, interrompa e oriente `/continuespec`.
- Em ambiguidade de tarefa ou de mudança, apresente as candidatas e pergunte ao usuário; nunca escolha sozinho.
- Crie a branch `task/NNN-NNN-slug` antes de iniciar.
- Se a branch já existir, informe `E_BRANCH_EXISTS` e não substitua.
- Nunca altere o status de aprovação.

## Como executar

```bash
node scripts/rawspec-v2-cli.mjs resolve TASK-NNN --change NNN-slug
node scripts/rawspec-v2-cli.mjs create-branch TASK-NNN --change NNN-slug
node scripts/rawspec-v2-cli.mjs start TASK-NNN --change NNN-slug
```

Sem argumento:

```bash
node scripts/rawspec-v2-cli.mjs open
node scripts/rawspec-v2-cli.mjs next
```

## Fechamento

Ao terminar a implementação, use `/continuespec` para passar a tarefa a `VERIFYING`. O agente `executor` executa `pnpm test` e `pnpm test:e2e`, por esta ordem, e o `verificador` avalia a evidência. Depois das revisões aprovadas, `/continuespec` regista a verificação e executa `commit-task`, que roda `pnpm lint`, `pnpm typecheck`, `pnpm test` e `pnpm build`. Se passarem, faz commit e push na branch da tarefa. No fim, reporta a próxima task a realizar, para o utilizador saber o que se segue.
