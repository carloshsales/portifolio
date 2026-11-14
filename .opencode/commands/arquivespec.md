---
description: Arquiva uma mudança RawSpec inteira, com todas as tarefas concluídas e verificadas
argument-hint: '[CHANGE-ID]'
---

# /arquivespec

Arquiva a **mudança inteira** de uma RawSpec, movendo-a para
`specs/changes/archive/`.

## Uso

```text
/arquivespec                    # única mudança elegível
/arquivespec 002-rawspec-...    # mudança específica
```

## Ferramenta

Toda a leitura, validação e escrita é feita pelo helper compartilhado. Não
reimplemente parsing, validação nem operação de Git neste comando.

```bash
node scripts/rawspec.mjs check-archive CHANGE-ID --json
node scripts/rawspec.mjs archive CHANGE-ID --json
node scripts/rawspec.mjs check-action-plans CHANGE-ID --json
```

## Escopo

O arquivamento é **sempre da mudança inteira**, nunca de uma tarefa isolada.

- `TASK-ID` como argumento é recusado com `E_ARCHIVE_TASK_SCOPE`.
- Não existe modo de arquivar uma única tarefa.

## Fluxo

### 1. Resolver a mudança

**Sem argumento:** rode `check-archive --json`.

- Se exatamente uma mudança for elegível, use-a.
- Se mais de uma for elegível, apresente as candidatas e **pergunte ao usuário
  qual arquivar**. Não escolha.
- Se nenhuma for elegível, falhe com `E_ARCHIVE_PENDING_TASKS` ou
  `E_NO_ELIGIBLE_CHANGE`, listando as pendências.

**Com `CHANGE-ID`:** rode `check-archive CHANGE-ID --json` e apresente o
relatório.

### 2. Validar tudo antes de mover

O helper valida **por completo** antes de qualquer movimentação e antes de
qualquer operação de Git. Apresente o relatório:

- **Aprovação:** `proposal.md`, `tasks.md` e, quando existir, `design.md` devem
  estar `APPROVED`. Os comandos nunca concedem aprovação.
- **Tarefas:** todas devem estar `Status: COMPLETED` **e**
  `Verificação: VERIFIED`. `PENDING`, `IN PROGRESS`, `VERIFYING` ou
  `COMPLETED` sem `VERIFIED` bloqueiam.
- **Planos de ação:** todos devem estar `RESOLVED`. `PENDING ACCEPTANCE`,
  `ACCEPTED`, `IN EXECUTION` e `REJECTED` bloqueiam o arquivamento.
- **Destino:** `specs/changes/archive/CHANGE-ID` precisa estar inexistente.
- **Caminhos:** origem e destino são confinados à mudança correta.

Se qualquer validação falhar, **nada é movido e nenhum `git add` é executado.**

### 3. Inspecionar o estado Git

O helper inspeciona `git status --porcelain` restrito aos caminhos do manifesto
e ao destino.

- Se houver **alteração rastreada preexistente** em arquivo do manifesto, o
  helper para com `E_GIT_DIRTY` **antes de mover**. Apresente a lista e
  **peça decisão explícita**: commitar, fazer stash, cancelar ou autorizar a
  inclusão.
- Sem decisão, **não mova e não faça staging**.

### 4. Pedir autorização da lista exata

Apresente a **lista exata de arquivos** que serão staged, incluindo o
`archive-state.json` que será criado, e **peça autorização**.

- Autorizado: o helper executa o staging.
- Recusado: o helper arquiva com `Staging Git: SKIPPED` e não executa
  `git add`.
- Cancelado: nada é movido.

Arquivos não rastreados dentro da mudança fazem parte do manifesto, mas só são
staged após a confirmação explícita da lista.

### 5. Executar o arquivamento

Rode `archive CHANGE-ID --json`.

O helper executa, nesta ordem:

1. `archive-state.json` gravado com `state: ARCHIVING` na origem, antes do
   rename, como marcação write-ahead.
2. **Um único rename atômico** do diretório, no mesmo volume. Não move arquivo
   por arquivo e não usa `git mv`.
3. `proposal.md` do destino finalizado com `Status: ARCHIVED`,
   `- Arquivada em: YYYY-MM-DD` e `- Staging Git: PENDING`.
4. `archive-state.json` atualizado para `state: ARCHIVED` — **somente depois**
   do `proposal.md`.
5. `git add` **somente** nos caminhos exatos do manifesto, um por vez,
   incluindo os caminhos de origem rastreados para registrar a remoção.
6. `- Staging Git: DONE` gravado e o caminho exato do `proposal.md` arquivado
   re-stagiado, para que a versão final fique no índice.
7. Convergência verificada contra o índice Git.

Se o rename falhar, o helper remove o `archive-state.json` gravado e informa
`E_ARCHIVE_MOVE_FAILED`, sem movimentação parcial e sem `git add`.

Se o staging falhar, o helper grava `Staging Git: FAILED`, mantém a mudança
movida e informa `E_GIT_ADD_FAILED`. **Não mova de novo.** Basta reexecutar
para retomar apenas o staging.

### 6. Recuperar um arquivamento interrompido

Rode `check-archive CHANGE-ID --json` e leia `archive-state.json` e os
marcadores do `proposal.md`.

| Origem     | Destino    | Estado                                             | Ação                                                                                                                                                                  |
| ---------- | ---------- | -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Existe     | Não existe | `ARCHIVING`                                        | O rename não ocorreu. Remova o arquivo de estado, revalide e arquive de novo.                                                                                         |
| Não existe | Existe     | `ARCHIVING`                                        | Interrompido entre o rename e a finalização. Complete os dois marcadores de forma idempotente, `proposal.md` primeiro, e siga para o staging. **Nunca mova de novo.** |
| Não existe | Existe     | `ARCHIVED`                                         | Movimentação concluída. Converja apenas o staging.                                                                                                                    |
| Não existe | Existe     | `ARCHIVED` no `proposal.md`, sem arquivo de estado | Movimentação concluída. Converja apenas o staging.                                                                                                                    |
| Não existe | Existe     | Sem marcadores                                     | `E_ARCHIVE_STATE_UNKNOWN`. **Não apague, mova ou resete nada.**                                                                                                       |

A recuperação é idempotente: reexecutar repete apenas escritas de marcador e
staging de caminhos exatos. Ela preserva a data de arquivamento já existente
e não rebaixa um marcador `Staging Git` já `DONE` ou `SKIPPED`.

Rode `archive CHANGE-ID --json` para retomar. O helper reconhece o estado
interrompido e **não move a mudança de novo**.

### 7. Reportar

Apresente:

- o caminho final da mudança arquivada;
- os arquivos staged;
- o marcador final de staging;
- uma sugestão de mensagem de commit.

**Não execute `git commit` nem `git push`.** O arquivamento não cria commit nem
push. O histórico Git é preservado pela remoção e adição dos mesmos conteúdos.

## Erros comuns

| Código                         | O que fazer                                               |
| ------------------------------ | --------------------------------------------------------- |
| `E_ARCHIVE_TASK_SCOPE`         | Arquivar a mudança inteira, não a tarefa.                 |
| `E_ARCHIVE_PENDING_TASKS`      | Concluir as tarefas listadas.                             |
| `E_ACTION_PLAN_PENDING`        | Resolver os planos de ação com aceite humano.             |
| `E_ARCHIVE_DESTINATION_EXISTS` | Resolver o conflito do destino manualmente.               |
| `E_GIT_DIRTY`                  | Decidir sobre as alterações preexistentes antes de mover. |
| `E_ARCHIVE_MOVE_FAILED`        | Corrigir o motivo e repetir a validação.                  |
| `E_ARCHIVE_STATE_UNKNOWN`      | Corrigir manualmente. Não apagar nem resetar.             |
| `E_GIT_ADD_FAILED`             | Retomar apenas o staging; não mover de novo.              |

## Regras

- Nunca altere o status de aprovação de `proposal.md`, `design.md` ou
  `tasks.md`.
- Nunca arquive uma tarefa isolada.
- Nunca use `git add -A`, nem staging de diretório, glob ou caminho fora do
  manifesto.
- Nunca execute `git commit`, `git push`, `git rebase` ou `git reset`.
- Não crie outros comandos.
