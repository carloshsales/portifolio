# TASK-007 — Validar o orquestrador ponta a ponta e registar a mudança

- Change: 006-agent-orchestrator
- Status: PENDING
- Depende de: TASK-006
- Início: —
- Verificação: PENDING
- Evidência: —
- Plano de ação: none

## Objetivo

Verificar que o orquestrador funciona de ponta a ponta sobre uma tarefa real, que
os gates bloqueiam como previsto e que o registo da mudança reflecte o que foi
construído.

## Arquivos

- `specs/changes/006-agent-orchestrator/tasks/TASK-007.md` (actualização de estado)
- `specs/changes/006-agent-orchestrator/proposal.md` (actualização de estado)
- `specs/changes/006-agent-orchestrator/design.md` (actualização de estado)
- `docs/history.md` (entrada de evento)

## Entregáveis

- O gate de clareza avaliado sobre a TASK-005 da change 001 devolve uma pontuação com evidências, e o resultado está registado.
- Uma discrepância real entre a task e o repositório é detectada e reportada, sem escrita de ficheiros.
- Uma tentativa de escrita em `src/content/` é bloqueada sem autorização do utilizador.
- Uma tentativa de escrita fora do âmbito declarado de uma task é impedida.
- A suíte completa passa: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` e `pnpm test:e2e`.
- Entrada de evento em `docs/history.md` a registar a conclusão da change.

## Regras

- A validação corre sobre a TASK-005 da change `001-portfolio-mvp`, porque é a próxima task elegível e tem código já implementado, o que exercita o caminho de discrepância.
- A validação não altera a change 001 nem o estado das suas tasks.
- A validação não cria worktrees, conforme `docs/projeto.md` §7.3.
- Se o gate de clareza revelar que a TASK-005 precisa de reescrita, isso é reportado ao utilizador como plano de ação, e não corrigido dentro desta change.
- A verificação usa a CLI RawSpec v2 para as transições de estado, nunca edição directa dos ficheiros de task.
- O bake-off de `bakeoff/` é preservado como ferramenta de regressão: o fixture, o prompt, o scorer e os resultados medidos ficam versionados.

## Testes

- `pnpm lint` passa.
- `pnpm typecheck` passa.
- `pnpm test` passa.
- `pnpm build` passa.
- `pnpm test:e2e` passa nos três viewports.
- `pnpm exec prettier --check .` passa.
- `node scripts/rawspec-v2-cli.mjs next --change 001-portfolio-mvp` devolve a task elegível, confirmando que a change 001 está consistente.
- O grafo de dependências da change 006 é validado pelo parser sem ciclos.
- `node bakeoff/score.mjs bakeoff/results.json` executa sem erro e produz o ranking dos 10 modelos medidos.

## Aceitação

O orquestrador executa o pipeline completo sobre uma task real, bloqueia nos três gates testados, a suíte de qualidade passa e a mudança está registada.

## Checklist de clareza

- Objetivo único e verificável — ATENDE
- Arquivos afetados — ATENDE
- Entregáveis concretos — ATENDE
- Contrato de entrada, saída e erros — ATENDE (entrada: orquestrador configurado e TASK-005 elegível; saída: pipeline validado com gates verificados; erros: gate que falhe unexpectedly gera plano de ação em vez de ser silenciosamente ignorado)
- Testes obrigatórios — ATENDE
- Critério de aceitação objetivo — ATENDE
- Dependências declaradas explicitamente — ATENDE
- Ausência de decisões pendentes para o implementador — ATENDE
