---
description: Avalia a clareza de uma tarefa RawSpec contra os dez critérios, sem tocar em ficheiros
agent: analista-clareza
model: opencode-go/gpt-6-luna#max
subagent: true
---

# /clarity

Avalia a clareza de uma tarefa RawSpec v2 e devolve a pontuação, sem escrever
nada.

`TASK-ID` identifica a task a avaliar, por exemplo `TASK-005`.

## Execução

1. Resolve a task:

   ```bash
   node scripts/rawspec-v2-cli.mjs resolve $ARGUMENTS
   ```

2. Lê o ficheiro da task em `specs/changes/NNN-slug/tasks/TASK-NNN.md`.

3. Lê as dependências declaradas, para verificar que a relação é verdadeira.

4. Avalia os dez critérios de `docs/projeto.md` §8.5.

5. Devolve a pontuação com as evidências.

## Regras

- Não escrevas, não cries e não apagues ficheiros. Este comando é de leitura.
- Não faças commit nem push.
- Não implementes. A avaliação é o objectivo.
- A pontuação não substitui a aprovação humana. É um filtro.
- Uma contradição ou uma decisão crítica em aberto bloqueia a aprovação. Não a
  pontues por sympathy: regista-a como bloqueio.

## Formato de saída

```text
TAREFA: <id> — <título>
PONTUACAO: <total>/100
CRITERIOS:
  1. <nome> — <n>/10 — <justificação>
  ...
  10. <nome> — <n>/10 — <justificação>
BLOQUEIOS:
  - <critério> | <motivo> | <o que falta decidir>
RECOMENDACAO: <o que fazer a seguir>
```

Se não houver bloqueios, escreve `BLOQUEIOS: nenhum`.
