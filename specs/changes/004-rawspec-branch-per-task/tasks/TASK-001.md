# TASK-001 — Implementar branch e commit/push no helper e CLI

- Change: 004-rawspec-branch-per-task
- Status: PENDING
- Depende de: nenhuma
- Início: —
- Verificação: PENDING
- Evidência: —
- Plano de ação: none

## Objetivo

Implementar `createTaskBranch`, `commitAndPushTask` e `runChecks` no helper v2 e expor `create-branch` e `commit-task` no CLI.

## Arquivos

- `scripts/rawspec-v2.mjs`
- `scripts/rawspec-v2.test.mjs`
- `scripts/rawspec-v2-cli.mjs`

## Entregáveis

- `createTaskBranch(repoRoot, taskId, { changeId })` criando `task/NNN-NNN-slug`.
- `commitAndPushTask(repoRoot, taskId, { changeId, branch, remote, push })`.
- `runChecks(repoRoot)` executando typecheck, test e build.
- Verificações antes do commit; falha lança `E_CHECKS_FAILED`.
- CLI `create-branch` e `commit-task`.
- Testes em repositório Git temporário.

## Regras

- Operações Git confinadas a `repoRoot`.
- Branch existente retorna `E_BRANCH_EXISTS`.
- Falha de Git retorna `E_GIT_ERROR`.
- Exigir `COMPLETED` + `VERIFIED` para commitar.
- Não executar operações destrutivas.
- Sem dependências novas de runtime.

## Testes

- Criar branch com nomenclatura correta.
- Recusar branch existente.
- Commitar com a mensagem gerada.
- Não commitar quando verificações falham.
- Push quando `push: true` e há remote.
- Repositório real intocado.

## Aceitação

- Os dois subcomandos existem e funcionam.
- Os testes passam em repositório temporário.
- O repositório real não é alterado pelos testes.

## Checklist de clareza

- Objetivo único e verificável — ATENDE
- Arquivos afetados — ATENDE
- Entregáveis concretos — ATENDE
- Contrato de entrada, saída e erros — ATENDE (entrada: tarefa e opções; saída: branch e commit; erros: `E_BRANCH_EXISTS`, `E_GIT_ERROR`, `E_CHECKS_FAILED`, `E_TASK_STATE`)
- Testes obrigatórios — ATENDE
- Critério de aceitação objetivo — ATENDE
- Dependências declaradas explicitamente — ATENDE
- Ausência de decisões pendentes para o implementador — ATENDE
