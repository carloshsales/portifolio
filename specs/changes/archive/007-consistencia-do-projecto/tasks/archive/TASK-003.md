# TASK-003 — Validar a correcção e registar a mudança

- Change: 007-consistencia-do-projecto
- Status: ARCHIVED
- Depende de: TASK-001, TASK-002
- Início: 2026-11-16
- Verificação: VERIFIED (2026-11-16) — Validacao do gate de ambito: uma escrita deliberada em src/test/fora-do-ambito.ts, que nao consta da secao ## Arquivos da TASK-003, foi detectada pelo commit-task e listada como outOfScope, sem alterar o repositorio. Suite completa aprovada: pnpm lint, typecheck, test (141 passando, 1 pulado), build, test:e2e (15 em 3 viewports) e prettier --check.
- Evidência: Validacao do gate de ambito: uma escrita deliberada em src/test/fora-do-ambito.ts, que nao consta da secao ## Arquivos da TASK-003, foi detectada pelo commit-task e listada como outOfScope, sem alterar o repositorio. Suite completa aprovada: pnpm lint, typecheck, test (141 passando, 1 pulado), build, test:e2e (15 em 3 viewports) e prettier --check.
- Plano de ação: none
- Arquivada em: 2026-11-16

## Objetivo

Verificar que o staging restrito ao âmbito funciona numa task real, que o
comportamento do `commit-task` é o esperado e que a mudança está registada.

## Arquivos

- `specs/changes/007-consistencia-do-projecto/tasks/TASK-003.md` (actualização de estado)
- `specs/changes/007-consistencia-do-projecto/proposal.md` (actualização de estado)
- `specs/changes/007-consistencia-do-projecto/design.md` (actualização de estado)
- `specs/changes/007-consistencia-do-projecto/tasks/TASK-001.md` (actualização de estado)
- `specs/changes/007-consistencia-do-projecto/tasks/TASK-002.md` (actualização de estado)
- `docs/history.md` (entrada de evento)
- `bakeoff/check-agents.mjs` (formatação, se necessária)
- `bakeoff/check-content-gate.mjs` (formatação, se necessária)

## Entregáveis

- Uma execução real de `commit-task` numa task de teste confirma que só os ficheiros do âmbito são commited.
- Uma escrita deliberada fora do âmbito bloqueia o commit com `E_SCOPE_VIOLATION` e não altera o repositório.
- A suíte completa passa: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` e `pnpm test:e2e`.
- Entrada de evento em `docs/history.md` a registar a conclusão da mudança.
- Os dois ficheiros de `bakeoff/` que a suite de qualidade sinalizou depois de integrados no `main` estão formatados.

## Regras

- A validação corre num directório temporário, para não alterar o repositório real com uma task de teste.
- A validação não altera a change 001 nem o estado das suas tasks.
- A validação não cria worktrees, conforme `docs/projeto.md` §7.3.
- As transições de estado usam a CLI RawSpec v2, nunca edição directa dos ficheiros de task.
- O histórico é append-only: a entrada é acrescentada ao final.

## Testes

- `pnpm lint` passa.
- `pnpm typecheck` passa.
- `pnpm test` passa.
- `pnpm build` passa.
- `pnpm test:e2e` passa nos três viewports.
- `pnpm exec prettier --check .` passa.
- `node scripts/rawspec-v2-cli.mjs next --change 001-portfolio-mvp` devolve a task elegível, confirmando que a change 001 continua consistente.
- O grafo de dependências da change 007 é validado pelo parser sem ciclos.

## Aceitação

O `commit-task` faz staging restrito ao âmbito, bloqueia escritas fora do âmbito, a documentação está coerente e a suíte de qualidade passa.

## Checklist de clareza

- Objetivo único e verificável — ATENDE
- Arquivos afetados — ATENDE
- Entregáveis concretos — ATENDE
- Contrato de entrada, saída e erros — ATENDE (entrada: o `commit-task` corrigido; saída: comportamento verificado em directório temporário; erros: uma divergência de comportamento gera plano de acção em vez de ser ignorada)
- Testes obrigatórios — ATENDE
- Critério de aceitação objetivo — ATENDE
- Dependências declaradas explicitamente — ATENDE
- Ausência de decisões pendentes para o implementador — ATENDE
