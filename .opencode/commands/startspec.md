---
description: Inicia a execução de uma tarefa do RawSpec v2
argument-hint: [TASK-ID] [--change CHANGE-ID]
---

# /startspec

Inicia uma tarefa `PENDING` do RawSpec v2.

## Regras

- Com `TASK-ID`: resolva a tarefa, valide aprovação da mudança e dependências, e inicie.
- Sem argumento: use `next` para selecionar a próxima tarefa pendente.
- Se já existir tarefa aberta, pergunte ao usuário antes de iniciar outra. Se ele recusar, interrompa e oriente `/continuespec`.
- Em ambiguidade de tarefa ou de mudança, apresente as candidatas e pergunte ao usuário; nunca escolha sozinho.
- Nunca altere o status de aprovação.
- Nunca faça `git commit` nem `git push`.

## Como executar

```bash
node scripts/rawspec-v2-cli.mjs resolve TASK-001 --change 003-rawspec-v2
node scripts/rawspec-v2-cli.mjs start TASK-001 --change 003-rawspec-v2
```

Sem argumento:

```bash
node scripts/rawspec-v2-cli.mjs open
node scripts/rawspec-v2-cli.mjs next
```

## Fechamento

Ao concluir a tarefa, apresente o que foi implementado, os arquivos alterados, as verificações executadas e uma mensagem de commit pronta, sem executá-la:

```bash
node scripts/rawspec-v2-cli.mjs commit-message TASK-001 --change 003-rawspec-v2
```
