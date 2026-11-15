# TASK-001 — Implementar branch e commit/push no helper e CLI

- Change: 004-rawspec-branch-per-task
- Status: COMPLETED
- Depende de: nenhuma
- Início: 2026-11-15
- Verificação: VERIFIED (2026-11-15) — `runChecks`, `createTaskBranch` e `commitAndPushTask` implementados; CLI `create-branch` e `commit-task`; 87 testes do módulo passando; testes de Git em repositório temporário; `prettier --check`, `pnpm lint`, `pnpm typecheck`, `pnpm test` (128 passando, 1 pulado) e `pnpm build` aprovados; repositório real intocado pelos testes.
- Evidência: implementação e testes em `scripts/`; verificações executadas em 2026-11-15.
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
