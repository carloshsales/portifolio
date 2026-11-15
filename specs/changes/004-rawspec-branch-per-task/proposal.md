# Change 004 — Branch por tarefa e commit/push automáticos

- Status: PENDING APPROVAL
- Tipo: Melhoria de processo de engenharia
- Prioridade: Alta
- Data: 2026-11-15
- Relacionada: `003-rawspec-v2` (arquivada)

## 1. Objetivo

Garantir que toda tarefa seja executada em sua própria branch e que, quando as verificações passarem, o commit e o push sejam feitos automaticamente, respeitando os hooks do Husky.

## 2. Problema

As tarefas eram executadas diretamente na branch corrente, sem isolamento por tarefa. Não havia automação de commit e push após a verificação, e o trabalho podia se misturar a alterações não relacionadas.

## 3. Escopo

### 3.1 Incluído

- Nomenclatura de branch `task/NNN-NNN-slug`.
- Criação da branch no início da tarefa (`/startspec`).
- Commit e push automáticos ao concluir a tarefa, após as verificações (`/continuespec`).
- Comandos `create-branch` e `commit-task` no CLI.
- Atualização de `/startspec` e `/continuespec`.
- ADR-005 e documentação da regra.
- Testes em repositório temporário.

### 3.2 Fora do escopo

- Alterar os hooks do Husky.
- Criar pull requests automaticamente.
- Renomear branches existentes.
- Alterar a nomenclatura de branches de mudanças.

## 4. Comportamento proposto

### 4.1 Branch

Toda tarefa recebe uma branch `task/NNN-NNN-slug`, onde `NNN` é o prefixo numérico da mudança, `NNN` é o número da tarefa e `slug` é o título da tarefa normalizado.

A branch é criada no início da tarefa. Se já existir, o comando informa `E_BRANCH_EXISTS` e não substitui.

### 4.2 Commit e push

Ao concluir a tarefa com `COMPLETED` + `VERIFIED`, o comando executa as verificações (`pnpm typecheck`, `pnpm test`, `pnpm build`). Se passarem, faz `git add -A`, `git commit` com a mensagem gerada e `git push -u origin <branch>`.

Os hooks do Husky permanecem obrigatórios: `pre-commit` (lint-staged) e `pre-push` (typecheck, test, build).

Se as verificações falharem, nenhum commit é feito.

### 4.3 Arquivamento

O arquivamento de tarefa é uma ação administrativa que também gera commit e push, mantendo a branch da tarefa.

## 5. Requisitos

### 5.1 Funcionais

- **RF-01** — Toda tarefa em execução tem uma branch própria `task/NNN-NNN-slug`.
- **RF-02** — `/startspec` cria a branch antes de iniciar a tarefa.
- **RF-03** — `/continuespec` conclui a tarefa e, se as verificações passarem, faz commit e push.
- **RF-04** — A mensagem de commit segue o formato Conventional Commits com mudança, tarefa, testes, evidência e plano de ação.
- **RF-05** — Os hooks do Husky são sempre executados no commit e no push.
- **RF-06** — Operações Git limitam-se ao repositório e à branch da tarefa.
- **RF-07** — Falha de verificação impede o commit.
- **RF-08** — A regra é documentada em `docs/rawspec-v2.md` e em ADR-005.

### 5.2 Não funcionais

- **RNF-01** — Sem dependências novas de runtime.
- **RNF-02** — Compartilha o helper `scripts/rawspec-v2.mjs`.
- **RNF-03** — Testes em repositório temporário, sem affectar o repositório real.
- **RNF-04** — Nenhuma operação destrutiva.

## 6. Critérios de aceitação

- `/startspec` cria a branch `task/NNN-NNN-slug` no início da tarefa.
- `/continuespec` executa as verificações e, se passarem, commita e envia.
- A mensagem de commit segue o formato definido.
- Os hooks do Husky rodam no commit e no push.
- Falha de verificação impede o commit.
- A regra está documentada.
- `pnpm lint`, `pnpm typecheck`, `pnpm test` e `pnpm build` passam.

## 7. Riscos e mitigação

| Risco | Mitigação |
|---|---|
| Branch já existente. | Informar `E_BRANCH_EXISTS` e não substituir. |
| Verificações falharem. | Bloquear o commit e reportar o erro. |
| Hook de push falhar após o commit. | O commit permanece; corrigir e pushar novamente. |
| Alteração não relacionada na árvore. | O comando orienta manter a árvore limpa; `git add -A` é-documentado. |
| Branch de tarefa esquecida. | A branch permanece para rastreabilidade. |

## 8. Decisões confirmadas

1. Nomenclatura `task/NNN-NNN-slug`.
2. Branch criada no início da tarefa.
3. Commit e push automáticos ao concluir, se as verificações passarem.
4. Hooks do Husky permanecem obrigatórios.
5. O trabalho atual não commitado foi movido para a branch `task/003-rawspec-v2` e enviado.

## 9. Aprovação

Esta proposta depende de aprovação humana antes do início da implementação.
