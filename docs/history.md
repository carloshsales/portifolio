# Histórico do projeto

Registro append-only de decisões, eventos e detalhes relevantes. Entradas nunca são reescritas; novas ocorrências são adicionadas ao final.

## 2026-11-15 — Evento — Sessão de melhoria das especificações

- Autor: Carlos Henrique
- Origem: sessão OpenCode
- Decisão: realizar perguntas para melhorar o fluxo e as ideias do projeto antes de alterar as specs.
- Motivo: garantir que o novo formato atenda às necessidades reais de rastreabilidade e modificabilidade.
- Impacto: definiu as decisões registradas abaixo e a criação da change 003-rawspec-v2.
- Evidência: respostas do usuário em 2026-11-15.

## 2026-11-15 — Decisão — Uma tarefa por arquivo

- Autor: Carlos Henrique
- Origem: sessão OpenCode
- Decisão: cada tarefa passa a ser um arquivo independente em `specs/changes/NNN-slug/tasks/TASK-NNN.md`.
- Motivo: baixo acoplamento, revisão isolada e possibilidade de arquivamento individual.
- Impacto: change 001 migrada; change 002 marcada como SUPERSEDED; parser v2 criado.
- Evidência: resposta do usuário em 2026-11-15; ADR-002.

## 2026-11-15 — Decisão — Arquivamento individual de tarefa

- Autor: Carlos Henrique
- Origem: sessão OpenCode
- Decisão: tarefas concluídas e aprovadas são movidas para `tasks/archive/TASK-NNN.md`.
- Motivo: manter o histórico de tarefas concluídas sem acoplá-las às tarefas em aberto.
- Impacto: o ciclo de vida da tarefa ganha o estado ARCHIVED.
- Evidência: resposta do usuário em 2026-11-15; ADR-003.

## 2026-11-15 — Decisão — Histórico obrigatório

- Autor: Carlos Henrique
- Origem: sessão OpenCode
- Decisão: `docs/history.md` append-only e ADRs em `docs/decisions/` passam a registrar decisões, eventos e detalhes.
- Motivo: garantir que nada se perca e que tudo seja documentado.
- Impacto: `/logspec` criado; ADR-002, ADR-003 e ADR-004.
- Evidência: resposta do usuário em 2026-11-15; ADR-004.

## 2026-11-15 — Decisão — Change 002 cedida (SUPERSEDED)

- Autor: Carlos Henrique
- Origem: sessão OpenCode
- Decisão: a change 002-rawspec-task-commands é marcada como SUPERSEDED e mantida; suas tasks pendentes não serão executadas.
- Motivo: o formato v2 substitui o modelo de arquivamento por mudança inteira.
- Impacto: change 002 preservada como histórico; comandos reimplementados sob o formato v2.
- Evidência: resposta do usuário em 2026-11-15.

## 2026-11-15 — Decisão — Migração da change 001

- Autor: Carlos Henrique
- Origem: sessão OpenCode
- Decisão: a change 001-portfolio-mvp é migrada para o formato v2, preservando status e evidências.
- Motivo: manter uma única fonte de verdade e um único formato ativo.
- Impacto: `tasks.md` dividido em arquivos; tarefas concluídas em `tasks/archive/`.
- Evidência: resposta do usuário em 2026-11-15.

## 2026-11-15 — Decisão — Arquivamento automático da mudança

- Autor: Carlos Henrique
- Origem: sessão OpenCode
- Decisão: quando todas as tarefas de uma mudança forem arquivadas, a mudança é arquivada em `specs/changes/archive/`.
- Motivo: evitar mudanças vazias ou esquecidas.
- Impacto: ciclo de vida da mudança definido.
- Evidência: resposta do usuário em 2026-11-15.

## 2026-11-15 — Decisão — Aprovação da change 003

- Autor: Carlos Henrique
- Origem: sessão OpenCode
- Decisão: a change 003-rawspec-v2 foi aprovada e a TASK-001 iniciada.
- Motivo: iniciar a implementação do formato v2.
- Impacto: `proposal.md` e `design.md` marcados como APPROVED.
- Evidência: resposta do usuário em 2026-11-15.

## 2026-11-15 — Evento — TASK-001 concluída

- Autor: Carlos Henrique
- Origem: execução da change 003-rawspec-v2
- Decisão: a TASK-001 (registrar histórico e decisões da sessão) foi concluída e verificada.
- Motivo: concluir a primeira tarefa do formato v2.
- Impacto: `docs/history.md`, ADR-002, ADR-003 e ADR-004 criados.
- Evidência: `prettier --check`, `pnpm lint`, `pnpm typecheck`, `pnpm test` (42 testes) e `pnpm build` aprovados em 2026-11-15.

## 2026-11-15 — Evento — TASK-001 arquivada

- Autor: Carlos Henrique
- Origem: execução da change 003-rawspec-v2
- Decisão: a TASK-001 foi aprovada e movida para `tasks/archive/TASK-001.md`.
- Motivo: aplicar o ciclo de vida do formato v2.
- Impacto: primeira tarefa arquivada da change 003.
- Evidência: aprovação do usuário em 2026-11-15.

## 2026-11-15 — Evento — TASK-002 concluída

- Autor: Carlos Henrique
- Origem: execução da change 003-rawspec-v2
- Decisão: a TASK-002 (definir formato v2 e templates) foi concluída e verificada.
- Motivo: versionar os templates e a referência do formato v2.
- Impacto: `specs/templates/*.md` e `docs/rawspec-v2.md` criados.
- Evidência: `prettier --check`, `pnpm lint`, `pnpm typecheck`, `pnpm test` (42 testes) e `pnpm build` aprovados em 2026-11-15.

## 2026-11-15 — Evento — TASK-002 arquivada

- Autor: Carlos Henrique
- Origem: execução da change 003-rawspec-v2
- Decisão: a TASK-002 foi aprovada e movida para `tasks/archive/TASK-002.md`.
- Motivo: aplicar o ciclo de vida do formato v2.
- Impacto: segunda tarefa arquivada da change 003.
- Evidência: aprovação do usuário em 2026-11-15.

## 2026-11-15 — Evento — TASK-003 concluída

- Autor: Carlos Henrique
- Origem: execução da change 003-rawspec-v2
- Decisão: a TASK-003 (implementar parser v2) foi concluída e verificada.
- Motivo: habilitar a leitura de uma tarefa por arquivo.
- Impacto: `scripts/rawspec-v2.mjs` e `scripts/rawspec-v2.test.mjs` criados com 24 testes.
- Evidência: `prettier --check`, `pnpm lint`, `pnpm typecheck`, `pnpm test` (66 testes) e `pnpm build` aprovados em 2026-11-15.

## 2026-11-15 — Evento — TASK-003 arquivada

- Autor: Carlos Henrique
- Origem: execução da change 003-rawspec-v2
- Decisão: a TASK-003 foi aprovada e movida para `tasks/archive/TASK-003.md`.
- Motivo: aplicar o ciclo de vida do formato v2.
- Impacto: terceira tarefa arquivada da change 003.
- Evidência: aprovação do usuário em 2026-11-15.

## 2026-11-15 — Evento — TASK-004 concluída

- Autor: Carlos Henrique
- Origem: execução da change 003-rawspec-v2
- Decisão: a TASK-004 (implementar resolução, gates e transições) foi concluída e verificada.
- Motivo: habilitar resolução de tarefas, validação de aprovação e dependências e transições de estado.
- Impacto: `resolveTask`, `selectNextTask`, `validateDependencies`, `startTask`, `beginVerification`, `verifyTask`, `failTask` e `updateTaskFile` implementados.
- Evidência: `prettier --check`, `pnpm lint`, `pnpm typecheck`, `pnpm test` (90 testes) e `pnpm build` aprovados em 2026-11-15.

## 2026-11-15 — Evento — TASK-004 arquivada

- Autor: Carlos Henrique
- Origem: execução da change 003-rawspec-v2
- Decisão: a TASK-004 foi aprovada e movida para `tasks/archive/TASK-004.md`.
- Motivo: aplicar o ciclo de vida do formato v2.
- Impacto: quarta tarefa arquivada da change 003.
- Evidência: aprovação do usuário em 2026-11-15.

## 2026-11-15 — Evento — TASK-005 concluída

- Autor: Carlos Henrique
- Origem: execução da change 003-rawspec-v2
- Decisão: a TASK-005 (implementar arquivamento de tarefa e mudança) foi concluída e verificada.
- Motivo: habilitar o arquivamento individual e o arquivamento da mudança.
- Impacto: `archiveTask`, `archiveChange`, `checkArchiveTask` e `checkArchiveChange` implementados.
- Evidência: `prettier --check`, `pnpm lint`, `pnpm typecheck`, `pnpm test` (104 testes) e `pnpm build` aprovados em 2026-11-15.

## 2026-11-15 — Evento — TASK-005 arquivada

- Autor: Carlos Henrique
- Origem: execução da change 003-rawspec-v2
- Decisão: a TASK-005 foi aprovada e movida para `tasks/archive/TASK-005.md`.
- Motivo: aplicar o ciclo de vida do formato v2.
- Impacto: quinta tarefa arquivada da change 003.
- Evidência: aprovação do usuário em 2026-11-15.

## 2026-11-15 — Evento — TASK-006 concluída

- Autor: Carlos Henrique
- Origem: execução da change 003-rawspec-v2
- Decisão: a TASK-006 (implementar /logspec e registro de histórico) foi concluída e verificada.
- Motivo: habilitar o registro obrigatório de decisões, eventos e detalhes.
- Impacto: `appendHistory`, `createAdrSkeleton`, `scripts/rawspec-v2-cli.mjs` e `.opencode/commands/logspec.md` criados.
- Evidência: `prettier --check`, `pnpm lint`, `pnpm typecheck`, `pnpm test` (111 testes) e `pnpm build` aprovados em 2026-11-15.

## 2026-11-15 — Evento — TASK-006 arquivada

- Autor: Carlos Henrique
- Origem: execução da change 003-rawspec-v2
- Decisão: a TASK-006 foi aprovada e movida para `tasks/archive/TASK-006.md`.
- Motivo: aplicar o ciclo de vida do formato v2.
- Impacto: sexta tarefa arquivada da change 003.
- Evidência: aprovação do usuário em 2026-11-15.

## 2026-11-15 — Evento — TASK-007 concluída

- Autor: Carlos Henrique
- Origem: execução da change 003-rawspec-v2
- Decisão: a TASK-007 (criar os comandos v2) foi concluída e verificada.
- Motivo: expor o fluxo v2 por comandos que usam o helper compartilhado.
- Impacto: `/startspec`, `/continuespec`, `/arquivespec` e `/archivespec` criados; CLI ampliado.
- Evidência: `prettier --check`, `pnpm lint`, `pnpm typecheck`, `pnpm test` (118 testes) e `pnpm build` aprovados em 2026-11-15; smoke test da CLI bem-sucedido.

## 2026-11-15 — Evento — TASK-007 arquivada

- Autor: Carlos Henrique
- Origem: execução da change 003-rawspec-v2
- Decisão: a TASK-007 foi aprovada e movida para `tasks/archive/TASK-007.md`.
- Motivo: aplicar o ciclo de vida do formato v2.
- Impacto: sétima tarefa arquivada da change 003.
- Evidência: aprovação do usuário em 2026-11-15.

## 2026-11-15 — Evento — TASK-008 concluída

- Autor: Carlos Henrique
- Origem: execução da change 003-rawspec-v2
- Decisão: a TASK-008 (migrar change 001 e marcar change 002) foi concluída e verificada.
- Motivo: migrar a change 001 para o formato v2 e cessar a change 002.
- Impacto: change 001 com 12 tarefas migradas (4 arquivadas, 8 ativas); change 002 marcada como SUPERSEDED.
- Evidência: `migrateLegacyChange` implementado e testado; `next --change 001-portfolio-mvp` retorna TASK-005; `prettier --check`, `pnpm lint`, `pnpm typecheck`, `pnpm test` (121 passando, 1 pulado) e `pnpm build` aprovados em 2026-11-15.

## 2026-11-15 — Evento — TASK-008 arquivada

- Autor: Carlos Henrique
- Origem: execução da change 003-rawspec-v2
- Decisão: a TASK-008 foi aprovada e movida para `tasks/archive/TASK-008.md`.
- Motivo: aplicar o ciclo de vida do formato v2.
- Impacto: oitava tarefa arquivada da change 003.
- Evidência: aprovação do usuário em 2026-11-15.

## 2026-11-15 — Evento — TASK-009 concluída

- Autor: Carlos Henrique
- Origem: execução da change 003-rawspec-v2
- Decisão: a TASK-009 (documentar e validar ponta a ponta) foi concluída e verificada.
- Motivo: finalizar a referência do formato v2 e validar o fluxo completo.
- Impacto: `docs/rawspec-v2.md` complementado; `README.md` atualizado; teste ponta a ponta adicionado.
- Evidência: `prettier --check`, `pnpm lint`, `pnpm typecheck`, `pnpm test` (122 passando, 1 pulado) e `pnpm build` aprovados em 2026-11-15.

## 2026-11-15 — Evento — TASK-009 arquivada

- Autor: Carlos Henrique
- Origem: execução da change 003-rawspec-v2
- Decisão: a TASK-009 foi aprovada e movida para `tasks/archive/TASK-009.md`.
- Motivo: aplicar o ciclo de vida do formato v2.
- Impacto: nona e última tarefa arquivada da change 003.
- Evidência: aprovação do usuário em 2026-11-15.

## 2026-11-15 — Evento — Change 003 arquivada

- Autor: Carlos Henrique
- Origem: execução da change 003-rawspec-v2
- Decisão: a change 003-rawspec-v2 foi aprovada e movida para `specs/changes/archive/003-rawspec-v2`.
- Motivo: todas as nove tarefas foram concluídas, verificadas e arquivadas.
- Impacto: a mudança de formato v2 está concluída e preservada no arquivo.
- Evidência: aprovação do usuário em 2026-11-15; `check-archive-change` elegível antes do arquivamento.

## 2026-11-15 — Decisão — Branch por tarefa e commit/push automáticos

- Autor: Carlos Henrique
- Origem: sessão OpenCode
- Decisão: toda tarefa deve ter sua própria branch, criada no início; se os testes passarem, o commit e o push podem ser feitos automaticamente, seguindo as regras do Husky.
- Motivo: isolar o trabalho de cada tarefa e manter o histórico Git confiável.
- Impacto: `/startspec` cria a branch `task/NNN-NNN-slug`; `/continuespec` conclui, verifica e, se passar, faz commit e push; hooks `pre-commit` (lint-staged) e `pre-push` (typecheck, test, build) permanecem obrigatórios.
- Evidência: respostas do usuário em 2026-11-15; change 004.

## 2026-11-15 — Evento — Trabalho da change 003 em branch própria

- Autor: Carlos Henrique
- Origem: sessão OpenCode
- Decisão: o trabalho não commitado da change 003 foi movido para a branch `task/003-rawspec-v2` e enviado.
- Motivo: aplicar a regra de branch isolada ao trabalho existente.
- Impacto: commit `feat(rawspec): deliver v2 spec format and migrate changes` pushado para `origin`.
- Evidência: `git push -u origin task/003-rawspec-v2` concluído em 2026-11-15, com hooks passados.

## 2026-11-15 — Evento — Change 004 aprovada

- Autor: Carlos Henrique
- Origem: sessão OpenCode
- Decisão: a change 004-rawspec-branch-per-task foi aprovada e a TASK-001 iniciada em branch própria.
- Motivo: implementar a regra de branch por tarefa e commit/push automático.
- Impacto: branch `task/004-001-implementar-branch-e-commit-push-no-helper-e-cli` criada a partir de `task/004-rawspec-branch-per-task`.
- Evidência: aprovação do usuário em 2026-11-15.

## 2026-11-15 — Evento — TASK-001 concluída

- Autor: Carlos Henrique
- Origem: execução da change 004-rawspec-branch-per-task
- Decisão: a TASK-001 (implementar branch e commit/push no helper e CLI) foi concluída e verificada.
- Motivo: habilitar branch por tarefa e commit/push automático.
- Impacto: `runChecks`, `createTaskBranch`, `commitAndPushTask` e subcomandos `create-branch` e `commit-task`.
- Evidência: 87 testes do módulo passando; `prettier --check`, `pnpm lint`, `pnpm typecheck`, `pnpm test` (128 passando, 1 pulado) e `pnpm build` aprovados em 2026-11-15.

## 2026-11-15 — Evento — TASK-001 arquivada

- Autor: Carlos Henrique
- Origem: execução da change 004-rawspec-branch-per-task
- Decisão: a TASK-001 foi aprovada e movida para `tasks/archive/TASK-001.md`.
- Motivo: aplicar o ciclo de vida do formato v2.
- Impacto: primeira tarefa da change 004 arquivada; commit `950df21` pushado.
- Evidência: aprovação do usuário em 2026-11-15.

## 2026-11-15 — Evento — TASK-002 concluída

- Autor: Carlos Henrique
- Origem: execução da change 004-rawspec-branch-per-task
- Decisão: a TASK-002 (atualizar /startspec e /continuespec) foi concluída e verificada.
- Motivo: orientar os comandos a usar branch por tarefa e commit/push automático.
- Impacto: `/startspec`, `/continuespec` e `/arquivespec` atualizados.
- Evidência: `prettier --check`, `pnpm lint`, `pnpm typecheck`, `pnpm test` (128 passando, 1 pulado) e `pnpm build` aprovados em 2026-11-15.

## 2026-11-15 — Evento — TASK-002 arquivada

- Autor: Carlos Henrique
- Origem: execução da change 004-rawspec-branch-per-task
- Decisão: a TASK-002 foi aprovada e movida para `tasks/archive/TASK-002.md`.
- Motivo: aplicar o ciclo de vida do formato v2.
- Impacto: segunda tarefa da change 004 arquivada; commit `4a6da6e` pushado.
- Evidência: aprovação do usuário em 2026-11-15.
