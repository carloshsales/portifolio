# Design Técnico — Branch por tarefa e commit/push automáticos

**Change:** `004-rawspec-branch-per-task`
**Status:** PENDING APPROVAL
**Base:** `proposal.md`

## 1. Objetivo

Definir como cada tarefa passa a ter uma branch própria e como o commit e o push passam a ser feitos automaticamente após as verificações.

## 2. Princípios

1. Uma tarefa, uma branch.
2. Isolamento: a branch é criada no início da tarefa.
3. Qualidade: verificações antes do commit.
4. Husky: hooks sempre executados.
5. Confinamento: operações Git limitadas ao repositório.
6. Sem operações destrutivas.

## 3. Nomenclatura

```text
task/<prefixo-da-mudança>-<número-da-tarefa>-<slug-do-título>
```

Exemplo: `task/001-005-implementar-secao-inicial`.

O slug é derivado do título da tarefa, em minúsculas, com acentos removidos e separadores por `-`.

## 4. Helper

`scripts/rawspec-v2.mjs` passa a exportar:

- `createTaskBranch(repoRoot, taskId, { changeId })` — resolve a tarefa, monta o nome da branch, verifica se já existe e executa `git checkout -b`.
- `commitAndPushTask(repoRoot, taskId, { changeId, branch, remote = 'origin', push = true })` — exige `COMPLETED` + `VERIFIED`, gera a mensagem, executa `git add -A`, `git commit -m <mensagem>` e, se `push`, `git push -u origin <branch>`.
- `runChecks(repoRoot)` — executa `pnpm typecheck`, `pnpm test` e `pnpm build`.

As operações Git usam `cwd: repoRoot` e não alteram a configuração global.

### 4.1 Verificações

`commitAndPushTask` executa `runChecks` antes do commit. Se qualquer verificação falhar, lança `E_CHECKS_FAILED` e não commita.

## 5. CLI

Novos subcomandos:

```bash
node scripts/rawspec-v2-cli.mjs create-branch TASK-ID [--change CHANGE-ID]
node scripts/rawspec-v2-cli.mjs commit-task TASK-ID [--change CHANGE-ID] [--branch NAME] [--no-push]
```

`commit-task` usa a branch da tarefa quando `--branch` não é informado.

## 6. Comandos

### 6.1 `/startspec`

1. Resolve a tarefa.
2. Cria a branch `task/NNN-NNN-slug` com `create-branch`.
3. Inicia a tarefa com `start`.
4. Se a branch já existir, informa e não substitui.

### 6.2 `/continuespec`

1. Resolve e revalida a tarefa.
2. Executa verificação ou conclusão.
3. Se `COMPLETED` + `VERIFIED`, executa `commit-task`.
4. O commit e o push disparam os hooks do Husky.
5. Se as verificações falharem, nenhum commit é feito.

### 6.3 `/arquivespec`

Arquiva a tarefa e executa `commit-task` para registrar o arquivamento na mesma branch.

## 7. Erros

| Código | Quando ocorre | Ação esperada |
|---|---|---|
| `E_BRANCH_EXISTS` | A branch da tarefa já existe. | Não substituir; informar. |
| `E_GIT_ERROR` | Comando Git falhou. | Reportar a saída e o estado. |
| `E_CHECKS_FAILED` | typecheck, test ou build falhou. | Não commitar; corrigir. |
| `E_TASK_STATE` | Tarefa não está concluída/verificada. | Concluir a tarefa antes. |

## 8. Testes

- Repositório Git temporário com commit base.
- `createTaskBranch` cria a branch com o nome correto.
- `createTaskBranch` recusa branch existente.
- `commitAndPushTask` commita com a mensagem gerada.
- `commitAndPushTask` não commita quando as verificações falham.
- `commitAndPushTask` faz push quando `push: true` e há remote.
- Nenhuma operação afeta o repositório real.

## 9. Critérios de aceite

- Branch criada no início da tarefa.
- Commit e push automáticos após verificações.
- Hooks do Husky executados.
- Falha de verificação impede o commit.
- Regra documentada.
