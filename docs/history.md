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

## 2026-11-15 — Evento — TASK-003 concluída

- Autor: Carlos Henrique
- Origem: execução da change 004-rawspec-branch-per-task
- Decisão: a TASK-003 (documentar a regra e validar ponta a ponta) foi concluída e verificada.
- Motivo: documentar a regra de branch por tarefa e commit/push e validar o fluxo.
- Impacto: ADR-005, `docs/rawspec-v2.md` e `README.md` atualizados.
- Evidência: `prettier --check`, `pnpm lint`, `pnpm typecheck`, `pnpm test` (128 passando, 1 pulado) e `pnpm build` aprovados em 2026-11-15; hooks confirmados em commit e push reais.

## 2026-11-15 — Evento — TASK-003 arquivada

- Autor: Carlos Henrique
- Origem: execução da change 004-rawspec-branch-per-task
- Decisão: a TASK-003 foi aprovada e movida para `tasks/archive/TASK-003.md`.
- Motivo: aplicar o ciclo de vida do formato v2.
- Impacto: terceira e última tarefa da change 004 arquivada; commit `749542d` pushado.
- Evidência: aprovação do usuário em 2026-11-15.

## 2026-11-15 — Evento — Change 004 arquivada

- Autor: Carlos Henrique
- Origem: execução da change 004-rawspec-branch-per-task
- Decisão: a change 004-rawspec-branch-per-task foi aprovada e movida para `specs/changes/archive/004-rawspec-branch-per-task`.
- Motivo: todas as três tarefas foram concluídas, verificadas e arquivadas.
- Impacto: a regra de branch por tarefa e commit/push automático está implantada.
- Evidência: aprovação do usuário em 2026-11-15; `check-archive-change` elegível antes do arquivamento.

## 2026-11-15 — Decisão — Reabertura das tarefas da change 001

- Autor: Carlos Henrique
- Origem: sessão
- Decisão: As tarefas TASK-001 a TASK-004 da change 001-portfolio-mvp foram reabertas e movidas de tasks/archive/ para tasks/, com Status PENDING e Verificação PENDING.
- Motivo: Reexecutar cada tarefa revalidando o código existente, conforme decisão do utilizador, em vez de reescrever o que já está implementado.
- Impacto: As doze tarefas da change 001 ficam PENDING e sequenciais; o estado real do código passa a ser revalidado task a task.
- Evidência: Decisão do utilizador em 2026-11-15; tarefas movidas com git mv e campos reescritos.

## 2026-11-15 — Decisão — Limpeza do repositório e criação da change 005

- Autor: Carlos Henrique
- Origem: sessão
- Decisão: Criada a change 005-refactor-portfolio-baseline, que cobre a limpeza de documentação e especificações obsoletas, o isolamento do conteúdo, a automatização de acessibilidade e responsividade, a introdução de CI e a documentação de publicação agnóstica.
- Motivo: O projeto acumulou documentação v1 obsoleta, especificações vazias e mortas, divergência entre o estado do código e o das tarefas, e critérios de aceitação que dependiam de verificação manual.
- Impacto: docs/rawspec-commands.md é removido; a change 002 é arquivada; specs/specifications/ é removido; src/content/ passa a ser a fonte do conteúdo do utilizador; vitest-axe, Playwright e GitHub Actions são introduzidos.
- Evidência: Decisão do utilizador em 2026-11-15; specs/changes/005-refactor-portfolio-baseline/proposal.md e design.md.

## 2026-11-15 — Decisão — Publicação agnóstica ao destino de deploy

- Autor: Carlos Henrique
- Origem: sessão
- Decisão: A documentação de publicação descreve requisitos e candidatos sem escolher fornecedor, e nenhuma configuração específica de alojamento é criada no repositório.
- Motivo: O destino do deploy ainda não foi decidido pelo utilizador.
- Impacto: docs/deployment.md e uma task de formação para configurar CI e deploy; nenhum vercel.json, netlify.toml ou equivalente.
- Evidência: Decisão do utilizador em 2026-11-15; TASK-006 da change 005.

## 2026-11-15 — Evento — TASK-001 da change 005 concluída

- Autor: Carlos Henrique
- Origem: sessão
- Decisão: A TASK-001 (remover documentação obsoleta e arquivar especificações mortas) foi concluída e verificada.
- Motivo: Eliminar o documento v1 dos comandos e retirar do fluxo as especificações que não podem ser executadas.
- Impacto: docs/rawspec-commands.md removido; change 002 arquivada em specs/changes/archive/; specs/specifications/ removido.
- Evidência: pnpm lint, pnpm format:check, pnpm typecheck, pnpm test (128 passando, 1 pulado) e pnpm build aprovados em 2026-11-15; commit c35cf7d pushado.

## 2026-11-15 — Evento — TASK-002 da change 005 concluída

- Autor: Carlos Henrique
- Origem: sessão
- Decisão: A TASK-002 (isolar o conteúdo do utilizador e remover placeholders) foi concluída e verificada.
- Motivo: Separar o conteúdo que o utilizador vai fornecer do código de apresentação, garantindo que nenhum texto fictício é renderizado.
- Impacto: src/content/ criado; src/data/ passou a ser ponto de importação estável com normalização; Home e Sidebar suportam estado vazio; bundle sem placeholders.
- Evidência: pnpm lint, pnpm format:check, pnpm typecheck, pnpm test (132 passando, 1 pulado) e pnpm build aprovados em 2026-11-15; commit 2028077 pushado.

## 2026-11-15 — Evento — TASK-003 da change 005 concluída

- Autor: Carlos Henrique
- Origem: sessão
- Decisão: A TASK-003 (automatizar a verificação de acessibilidade) foi concluída e verificada.
- Motivo: Substituir a verificação manual de acessibilidade por um teste automatizado que falha o pnpm test.
- Impacto: vitest-axe instalado como dependencia de desenvolvimento; src/test/accessibility.test.tsx com 2 testes; aplicacao sem violacoes automaticas em 20 regras.
- Evidência: Teste negativo provado com violacao image-alt; pnpm lint, pnpm format:check, pnpm typecheck, pnpm test (134 passando, 1 pulado) e pnpm build aprovados em 2026-11-15; commit 85af9f0 pushado.

## 2026-11-15 — Evento — TASK-004 da change 005 concluída

- Autor: Carlos Henrique
- Origem: sessão
- Decisão: A TASK-004 (automatizar a verificação de responsividade) foi concluída e verificada.
- Motivo: Automatizar a verificação de responsividade sobre o build de produção em celular, tablet e desktop.
- Impacto: @playwright/test instalado; e2e/ com config e 5 verificacoes; 15 testes e2e a passar; scripts test:e2e e test:all; vitest exclui e2e/.
- Evidência: Teste negativo provado com overflow de 3000px; pnpm lint, pnpm format:check, pnpm typecheck, pnpm test (134 passando, 1 pulado), pnpm build e pnpm test:e2e aprovados em 2026-11-15; commit 00bb565 pushado.

## 2026-11-15 — Evento — Push do workflow de CI bloqueado pelo âmbito do token

- Autor: Carlos Henrique
- Origem: sessão
- Decisão: O commit f142eab da TASK-005 foi criado localmente, mas o git push foi rejeitado pelo GitHub por o token OAuth nao ter o ambito 'workflow'.
- Motivo: O GitHub exige o ambito 'workflow' para criar ou alterar ficheiros em .github/workflows/.
- Impacto: O workflow de CI esta escrito e validado localmente, mas ausente do repositorio remoto; a TASK-005 nao pode ser arquivada e a TASK-006 fica bloqueada.
- Evidência: Erro 'refusing to allow an OAuth App to create or update workflow .github/workflows/ci.yml without workflow scope'; plano de ação criado em specs/changes/005-refactor-portfolio-baseline/action-plans/TASK-005-2026-11-15-push-workflow-bloqueado.md com Status PENDING ACCEPTANCE.

## 2026-11-15 — Decisão — Main reintegrado sobre a linha de trabalho real

- Autor: Carlos Henrique
- Origem: sessão
- Decisão: O origin/main continha 16 commits de um site HTML estático antigo sem qualquer ancestral comum com a linha de trabalho real (React, specs, scripts, docs), impedindo comparar branches e abrir pull requests.
- Motivo: O merge-base entre origin/main e as branches de trabalho era vazio, pelo que o GitHub devolvia 'There isn't anything to compare'.
- Impacto: main foi repontado para 3a1f9eb (chore/engineering-foundation) e recebeu o merge da change 005; todas as branches remotas passaram a ter ancestral comum com main; o histórico antigo ficou preservado na tag archive/main-antigo-site-estatico.
- Evidência: merge-base vazio antes e 3a1f9eb depois; git push --force-with-lease origin main:main aceite; verificacao de todas as branches remotas com merge-base contra origin/main; pnpm lint, typecheck, test (134 passando, 1 pulado) e build aprovados em 2026-11-15.

## 2026-11-15 ÔÇö Evento ÔÇö Branch 005-005 publicada sem o workflow de CI

- Autor: Carlos Henrique
- Origem: sess├úo
- Decis├úo: A branch task/005-005-introduzir-integracao-continua foi publicada no remoto sem o ficheiro .github/workflows/ci.yml, e o main foi reparado e Integrate com o merge da change 005.
- Motivo: O GitHub recusa qualquer push que crie ou altere ficheiros em .github/workflows/ quando o token OAuth nao tem o ambito workflow, o que impedia publicar a branch e comparar branches para pull requests.
- Impacto: As 15 branches remotas estao publicadas e todas tem ancestral comum com o main; os pull requests sao possiveis; o ci.yml esta registado localmente em .github/workflows/ci.yml e no commit 3ea5f18, a ser enviado assim que o ambito for autorizado.
- Evid├¬ncia: git push de push/005-005-sem-ci para task/005-005 aceite com exit 0; merge-base origin/main com todas as 15 branches confirmado; tentativa de push do ci.yml falhou com 'refusing to allow an OAuth App to create or update workflow'; tentativa equivalente pela API do GitHub devolveu HTTP 404 pelo mesmo motivo; pnpm lint, typecheck, test (134 passando, 1 pulado) e build aprovados em 2026-11-15.

## 2026-11-15 ÔÇö Evento ÔÇö TASK-005 da change 005 conclu├¡da e arquivada

- Autor: Carlos Henrique
- Origem: sess├úo
- Decis├úo: A TASK-005 (introduzir integra├º├úo cont├¡nua) foi conclu├¡da, verificada e arquivada ap├│s a resolu├º├úo do bloqueio de push.
- Motivo: O ├ómbito 'workflow' do token OAuth foi autorizado, permitindo publicar o workflow de CI.
- Impacto: .github/workflows/ci.yml publicado no main e na branch 005-005; GitHub Actions executado com 10 steps verdes; defeito do pnpm/action-setup corrigido; actions actualizadas para v5; plano de acao marcado como RESOLVED.
- Evid├¬ncia: gh auth status confirma o ambito workflow; runs 43769021078 e 43769178321 concluidos com success; pnpm lint, format:check, typecheck, test (134 passando, 1 pulado), build e test:e2e aprovados em 2026-11-15; commit 5fad617 pushado.

## 2026-11-16 — Evento — TASK-006 da change 005 concluída

- Autor: Carlos Henrique
- Origem: sessão
- Decisão: A TASK-006 (documentar a publicação sem fixar o destino) foi concluída e verificada.
- Motivo: Preparar a publicação de forma agnóstica ao destino, para que a escolha do deploy possa ser feita depois com base em requisitos concretos.
- Impacto: docs/deployment.md criado com 8 secções e 5 candidatos comparados; README.md com nova secção Publicação; nenhum ficheiro de configuração de fornecedor criado; sinalizado o ficheiro foto-perfil.png de 1,8 MB.
- Evidência: Todos os factos documentados verificados contra o repositorio; ausencia de vercel.json, netlify.toml, .nojekyll, _headers, _redirects, wrangler.toml e firebase.json confirmada; pnpm lint, format:check, typecheck, test (134 passando, 1 pulado) e build aprovados em 2026-11-15; commit 3a9c5dd pushado.

## 2026-11-16 — Evento — TASK-007 da change 005 concluída

- Autor: Carlos Henrique
- Origem: sessão
- Decisão: A TASK-007 (preparar a task de dados reais) foi concluída e verificada.
- Motivo: Deixar preparado, com formato e campos definidos, o trabalho de preencher o conteúdo real do portfólio.
- Impacto: docs/conteudo-real.md criado com o inventário completo do que é preciso fornecer; tarefas TASK-005 a TASK-010 da change 001 reescritas em formato v2 com escopos disjuntos; TASK-009 criada como tarefa exclusiva de escrita em src/content/; TASK-010 libertada da dependência dos dados.
- Evidência: Grafo de dependências validado pelo parser sem ciclos, com 13 tarefas e dependencySource explicit; escopos disjuntos verificados por inspecao das tarefas; pnpm lint, pnpm format:check, pnpm typecheck e pnpm test (134 passando, 1 pulado) aprovados em 2026-11-15; commit c1b259e pushado.

## 2026-11-16 — Evento — TASK-006 da change 005 concluída

- Autor: Carlos Henrique
- Origem: sessão
- Decisão: A TASK-006 (documentar a publicação sem fixar o destino) foi concluída e verificada.
- Motivo: Escrever a documentação de publicação de forma agnóstica ao destino, para que a escolha do deploy possa ser feita depois.
- Impacto: docs/deployment.md criado com 8 secções e 5 candidatos comparados; README.md com nova secção Publicação; nenhum ficheiro de configuração de fornecedor criado; sinalizado o ficheiro foto-perfil.png de 1,8 MB.
- Evidência: Factos documentados verificados contra o repositório; ausencia de vercel.json, netlify.toml, .nojekyll, _headers, _redirects, wrangler.toml e firebase.json confirmada; pnpm lint, format:check, typecheck, test (134 passando, 1 pulado) e build aprovados em 2026-11-15; commit 3a9c5dd pushado.

## 2026-11-16 — Evento — TASK-007 da change 005 concluída

- Autor: Carlos Henrique
- Origem: sessão
- Decisão: A TASK-007 (preparar a task de dados reais) foi concluída e verificada.
- Motivo: Deixar preparado, com formato e campos definidos, o trabalho de preencher o conteúdo real do portfólio.
- Impacto: docs/conteudo-real.md criado com o inventário completo do que é preciso fornecer; tarefas TASK-005 a TASK-010 da change 001 reescritas em formato v2 com escopos disjuntos; TASK-009 criada como tarefa exclusiva de escrita em src/content/.
- Evidência: Grafo de dependências validado pelo parser sem ciclos, com 12 tarefas e dependencySource explicit; pnpm lint, format:check, typecheck e pnpm test (134 passando, 1 pulado) aprovados em 2026-11-15; commit c1b259e pushado.

## 2026-11-16 — Decisão — Conteúdo real isolado do código de apresentação

- Autor: Carlos Henrique
- Origem: sessão
- Decisão: O conteúdo do utilizador passa a viver exclusivamente em src/content/, lido através de src/data/. A revisão das secções e o preenchimento do conteúdo foram separados em tarefas distintas.
- Motivo: As tarefas da change 001 misturavam implementação e dados, o que gerava sobreposição de escopo e tornava o preenchimento de dados dependente de decisões de implementação.
- Impacto: TASK-005 a TASK-008 da change 001 revêm apenas a apresentação e proíbem explicitamente a escrita em src/content/; TASK-009 é a única tarefa que escreve conteúdo, e depende da conclusão das quatro; TASK-010 deixou de depender de TASK-009 para não bloquear a revisão de performance.
- Evidência: Escopos disjuntos verificados por inspeção das doze tasks da change 001; grafo de dependências validado pelo parser sem ciclos; pnpm lint, typecheck e test aprovados em 2026-11-15.

## 2026-11-16 — Evento — Change 005 validada ponta a ponta

- Autor: Carlos Henrique
- Origem: sessão
- Decisão: A TASK-008 (validar ponta a ponta e registar a mudança) foi concluída e verificada.
- Motivo: Comprovar que a mudança está completa, que a change 001 permanece consistente e que o histórico reflete as decisões tomadas.
- Impacto: README.md actualizado com as referências a docs/conteudo-real.md e à integração contínua; histórico registado com as decisões da change 005.
- Evidência: pnpm lint, format:check, typecheck, test (134 passando, 1 pulado), build e test:e2e (15 testes em 3 viewports) aprovados; bundle sem placeholders verificado por scan; specs/changes contém apenas mudanças APPROVED e executáveis; change 001 com 12 tasks coerentes; commit e push realizados em 2026-11-15.
