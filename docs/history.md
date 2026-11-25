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

## 2026-11-15 — Evento — Branch 005-005 publicada sem o workflow de CI

- Autor: Carlos Henrique
- Origem: sess├úo
- Decis├úo: A branch task/005-005-introduzir-integracao-continua foi publicada no remoto sem o ficheiro .github/workflows/ci.yml, e o main foi reparado e Integrate com o merge da change 005.
- Motivo: O GitHub recusa qualquer push que crie ou altere ficheiros em .github/workflows/ quando o token OAuth nao tem o ambito workflow, o que impedia publicar a branch e comparar branches para pull requests.
- Impacto: As 15 branches remotas estao publicadas e todas tem ancestral comum com o main; os pull requests sao possiveis; o ci.yml esta registado localmente em .github/workflows/ci.yml e no commit 3ea5f18, a ser enviado assim que o ambito for autorizado.
- Evid├¬ncia: git push de push/005-005-sem-ci para task/005-005 aceite com exit 0; merge-base origin/main com todas as 15 branches confirmado; tentativa de push do ci.yml falhou com 'refusing to allow an OAuth App to create or update workflow'; tentativa equivalente pela API do GitHub devolveu HTTP 404 pelo mesmo motivo; pnpm lint, typecheck, test (134 passando, 1 pulado) e build aprovados em 2026-11-15.

## 2026-11-15 — Evento — TASK-005 da change 005 conclu├¡da e arquivada

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

## 2026-11-16 — Evento — Change 005 arquivada

- Autor: Carlos Henrique
- Origem: sessão
- Decisão: A change 005-refactor-portfolio-baseline foi aprovada e movida para specs/changes/archive/005-refactor-portfolio-baseline.
- Motivo: Todas as oito tarefas foram concluídas, verificadas e arquivadas.
- Impacto: A mudança de baseline do portfólio está concluída e preservada no arquivo; a change 001-portfolio-mvp passa a ser a única mudança ativa.
- Evidência: check-archive-change elegivel antes do arquivamento; pnpm lint, format:check, typecheck, test (134 passando, 1 pulado), build e test:e2e aprovados em 2026-11-15.

## 2026-11-16 — Decisão — TASK-001 a TASK-004 da change 001 reescritas como revisão do código existente

- Autor: Carlos Henrique
- Origem: sessão
- Decisão: As quatro tarefas foram reescritas em formato v2 para passarem a ser tarefas de revisão e consolidação do código já implementado, em vez de construção a partir de raiz. A aplicação React + TypeScript + Vite, o TypeScript Strict, a cadeia de qualidade com ESLint, Vitest, Testing Library e Husky, os tokens e estilos globais e a estrutura de navegação já estavam implementados no repositório, introduzidos no commit inicial 3a1f9eb e consolidados durante a change 005-refactor-portfolio-baseline. O grafo de dependências PENDING -> TASK-002 -> TASK-003 -> TASK-004 -> TASK-005 foi preservado e o conteúdo de cada tarefa foi reescrito com objetivo, arquivos, entregáveis, regras, testes e aceitação concretos, seguindo o mesmo formato de TASK-005 a TASK-008.
- Motivo: O código real estava mais avançado do que o registado nas tarefas, o que bloqueava toda a cadeia de dependências e tornava a execução das tarefas um exercício de falsificação de trabalho.
- Impacto: TASK-001, TASK-002, TASK-003 e TASK-004 reescritas em formato v2; conteúdo de src/content/ permanece intocado e pertence a TASK-009; nenhuma dependência ou script alterado.
- Evidência: node scripts/rawspec-v2-cli.mjs next --change 001-portfolio-mvp aponta para TASK-002 com E_DEPENDENCY_PENDING para TASK-001 após a conclusão; resolve de TASK-001 e TASK-004 confirma o grafo intacto; pnpm exec prettier --check nos ficheiros das tarefas aprovado; pnpm typecheck, pnpm lint, pnpm test (134 passando, 1 pulado) e pnpm build aprovados em 2026-11-16.

## 2026-11-16 — Decisão — Documentação geral do projeto registada em docs/projeto.md

- Autor: Carlos Henrique
- Origem: sessão
- Decisão: A documentação geral do projeto foi registada em docs/projeto.md, num ficheiro separado das especificações. O documento cobre visão, âmbito, identidade visual, stack, prioridades e princípios de trabalho, e é a referência a consultar para melhorar o teor das perguntas e decisões. O conteúdo foi reconciliado com o estado real do repositório: as 4 secções implementadas em vez das 6 descritas inicialmente, Nunito Sans em vez de Inter, o estado verificado das 12 tarefas da change 001, a change 002 já arquivada, o ciclo de vida de 8 estados do RawSpec v2 e o repositório carloshsales/portifolio. As secções Jogos, Artigos e Experimentos ficam registadas como planeadas.
- Motivo: O repositório tinha a documentação do processo, o histórico e as decisões, mas não tinha um documento de referência do produto. A documentação enviada pelo utilizador divergia do código implementado em pontos de âmbito, design e estado.
- Impacto: docs/projeto.md criado com 737 linhas; README.md com referência ao novo documento; AGENTS.md com ponteiro para docs/projeto.md e convenção de idioma; src/sections/Home/Home.tsx e src/sections/Contact/Contact.tsx com o texto visível uniformizado em português brasileiro. specs/ e o formato RawSpec v2 não foram alterados.
- Evidência: Estado verificado no repositório antes da escrita: src/sections/ contém Home, Projects, Skills e Contact; src/components/Sidebar.tsx define 4 itens de navegação; src/styles/tokens.css usa Nunito Sans; specs/changes/archive/ contém as changes 002 a 005; em main as 12 tarefas da change 001 estão PENDING, com a TASK-001 concluída e arquivada apenas na branch task/001-001-inicializar-aplicacao; pnpm typecheck, pnpm lint, pnpm test (134 passando, 1 pulado), pnpm test:e2e (15 passando em 3 viewports), pnpm build e pnpm exec prettier --check . aprovados em 2026-11-16.

## 2026-11-16 — Decisão — AGENTS.md com regras de execução para agentes

- Autor: Carlos Henrique
- Origem: sessão
- Decisão: Foi criado o ficheiro AGENTS.md na raiz do repositório, com as regras de execução a que os agentes ficam sujeitos ao trabalhar neste projeto. A regra principal exige que, ao ser pedido a execução de uma tarefa, o agente apresente primeiro um resumo do que será realizado e que, havendo discrepâncias entre a tarefa e o estado real do repositório, pergunte ao utilizador antes de agir. O ficheiro documenta ainda o princípio de não falsificação, as regras de workflow do RawSpec v2, os comandos de verificação, os comandos RawSpec e as convenções do repositório.
- Motivo: Sem um resumo prévio e sem o tratamento explícito de discrepâncias, havia risco de o agente executar trabalho divergente do pretendido, ou de marcar como concluída uma tarefa cujo trabalho não tinha sido feito. O ficheiro é lido automaticamente pelo OpenCode em todas as sessões do projeto, o que torna a regra aplicável sem depender de comandos específicos.
- Impacto: AGENTS.md criado na raiz do repositório; referência a docs/projeto.md e convenção de idioma da interface em português brasileiro acrescentadas posteriormente. O ficheiro vive na branch chore/agent-rules, com pull request próprio, por não pertencer ao âmbito de nenhuma TASK-NNN da change 001.
- Evidência: pnpm exec prettier --check AGENTS.md aprovado; CI do pull request #1 aprovado nas duas execuções; hooks pre-commit e pre-push verificados a executar após a correcção do core.hooksPath do Git, que estava corrompido para --version/_ em Windows e deixou os hooks de qualidade desativados.

## 2026-11-16 - Decisao - Orquestrador de agentes por configuracao nativa

- Autor: Carlos Henrique
- Origem: sessao
- Decisao: Adoptada uma change 006-agent-orchestrator que define o orquestrador de agentes do projecto como configuracao nativa do OpenCode, sem codigo proprio, plugins nem servicos adicionais. O routing de modelos foi medido num bake-off sobre a TASK-005 real, com cinco defeitos plantados num fixture e pontuacao por correspondencia semantica: gpt-6-luna para orquestracao, clareza e revisao; claude-haiku-5-5 para implementacao e verificacao; beam-free para exploracao e registo; kimi-k2.7-code como segunda opiniao de revisao. Todos os modelos sao do provider opencode-go. Oito agentes foram criados, com revisao em par, dois comandos (/orquestrar e /clarity) e push automatico sujeito a cinco condicoes cumulativas.
- Motivo: O processo RawSpec v2 ja existia e era maduro, mas faltava a camada que o liga aos agentes. O routing por tabela de preco sem medicao era supeito, e o bake-off mostrou que a precisao separa os modelos onde o recall nao separa: sete dos dez candidatos encontraram 80% dos defeitos, mas dois produziram 9 e 12 falsos positivos. A revisao em par foi escolhida pelo utilizador com conhecimento da sua limitacao de independencia, porque o custo adicional e irrelevante face ao orcamento.
- Impacto: opencode.json criado com permissoes globais e cache de uma hora; oito agentes em .opencode/agents com as permissoes ja corrigidas pela verificacao; dois comandos novos; docs/orquestrador.md criado; ADR-007 registada. Duas limitacoes do modelo de permissoes do OpenCode foram verificadas empiricamente e documentadas: a escrita por shell contorna a negativa de caminho, e a delegacao a subagentes contorna as negativas de edit e shell. A correccao foi a negacao de subagent nos cinco agentes de leitura, combinada com um gate de ambito pos-escrita baseado em git status --porcelain. A regra edit sobre specs/** foi removida por ser contraproducente. O custo por task desceu de 0,65 para 0,0229.
- Evidencia: bake-off com 10 modelos medidos em bakeoff/README.md e bakeoff/results.json; node bakeoff/check-agents.mjs confirma 8/8 agentes descobertos; node bakeoff/check-permissions.mjs confirma 6/6 casos de permissao, verificados pelo estado do sistema de ficheiros e nao pela narracao do agente; node bakeoff/check-content-gate.mjs confirma o bloqueio de src/content/; teste real do /clarity sobre a TASK-005 devolveu 55/100 com dois bloqueios fundamentados sem escrever ficheiros; config validada contra https://opencode.ai/config.json sem chaves desconhecidas; cache write de 7475 tokens confirmado em sessao real; pnpm lint, typecheck, test (134 passando, 1 pulado), build, test:e2e e prettier aprovados em 2026-11-16.

## 2026-11-16 - Evento - Change 006 arquivada

- Autor: Carlos Henrique
- Origem: sessao
- Decisao: A change 006-agent-orchestrator foi aprovada, as sete tarefas foram concluidas, verificadas e arquivadas individualmente, e a mudanca foi arquivada em specs/changes/archive/006-agent-orchestrator. O plano de acao TASK-003-2026-11-16-limitacao-das-permissoes-de-caminho foi resolvido, com a documentacao da limitacao segunda da delegacao a subagentes acrescentada na secao 6.1.
- Motivo: Todas as tarefas estavam COMPLETED e VERIFIED, o grafo de dependencias validado sem ciclos, a suite de qualidade aprovada e a validacao ponta a ponta com 14/14 verificacoes conformes. O plano de acao deixou de estar pendente depois de o gate de ambito ter sido implementado e testado.
- Impacto: A change 006 passa a ser a segunda unica change activa no projecto, a par da 001-portfolio-mvp. O orquestrador de agentes fica disponivel para a execucao da change 001. Nenhum ficheiro da aplicacao foi alterado por esta change: opencode.json, .opencode/agents, .opencode/commands, docs/orquestrador.md, ADR-007 e os scripts de verificacao em bakeoff/.
- Evidencia: check-archive-change reportou eligible true sem blockers antes do arquivamento; as sete tarefas foram arquivadas com archive-task --approved; node bakeoff/validate.mjs devolve 14/14; node bakeoff/check-permissions.mjs devolve 6/6; node bakeoff/check-scope-gate.mjs devolve PASS; pnpm lint, typecheck, test (134 passando, 1 pulado), build, test:e2e (15 em 3 viewports) e prettier aprovados em 2026-11-16.
## 2026-11-16 - Decisao - Commit-task com staging restrito ao ambito da task

- Autor: Carlos Henrique
- Origem: sessao
- Decisao: O commit-task deixou de executar git add -A. Passa a fazer staging apenas dos ficheiros declarados na secao ## Arquivos da task e dos ficheiros de especificacao que a CLI actualiza: o ficheiro da task, o plano de acao e docs/history.md. Um ficheiro tocado fora do ambito bloqueia o commit com o novo codigo E_SCOPE_VIOLATION, que lista os ficheiros culpados sem descartar trabalho. Em paralelo, as secoes 6.3 e 7.3 de docs/projeto.md foram reescritas: a 6.3 passa a descrever o orquestrador de agentes e a 7.3 passa a ser coerente com a ADR-005, o que obrigou a corrigir tambem o principio 11 da secao 12.
- Motivo: docs/rawspec-v2.md secao 9 e docs/projeto.md secao 7.3 determinavam staging apenas em caminhos exactos e proibiam git add -A. O commit de5ef71 levou 32 ficheiros em vez dos 3 declarados na TASK-001, o que quebrava a rastreabilidade que o RawSpec v2 existe para garantir. As secoes 6.3 e 7.3 divergiam do estado real do projecto: a 6.3 afirmava que a preferencia era nao construir um orquestrador, que ja existe, e a 7.3 exigia autorizacao explicita para commit e push, em contradicao com a ADR-005.
- Impacto: scripts/rawspec-v2.mjs passa a extrair a secao ## Arquivos para scope.files e a aplicar o gate de ambito antes do staging; novo codigo E_SCOPE_VIOLATION documentado em docs/rawspec-v2.md, com a politica de staging e o gate descritos na secao 15.2.1; 7 testes novos. docs/projeto.md secoes 6.3, 7.3 e principio 11 da secao 12 reescritos. As secoes 6.2, 7.1, 7.2 e 7.4 nao foram alteradas.
- Evidencia: Validacao real em 2026-11-16: uma escrita em src/test/fora-do-ambito.ts, que nao consta do ambito da TASK-003, foi detectada pelo commit-task e listada em outOfScope, com o commit bloqueado e o repositorio intacto. 94 testes do helper e 141 do projecto passam; 7 testes novos cobrem a extracao do ambito, o staging restrito e o bloqueio. pnpm lint, typecheck, test, build, test:e2e (15 em 3 viewports) e prettier --check aprovados.
## 2026-11-16 - Evento - Change 007 arquivada

- Autor: Carlos Henrique
- Origem: sessao
- Decisao: A change 007-consistencia-do-projecto foi aprovada, as tres tarefas foram concluidas, verificadas e arquivadas individualmente, e a mudanca foi arquivada em specs/changes/archive/007-consistencia-do-projecto.
- Motivo: As tres tarefas estavam COMPLETED e VERIFIED, a suite de qualidade passou e o gate de ambito foi validado numa execucao real, com o commit bloqueado e o repositorio intacto.
- Impacto: O commit-task passou a fazer staging restrito ao ambito da task, com o novo codigo E_SCOPE_VIOLATION. docs/projeto.md esta coerente com o orquestrador e com a ADR-005. Nenhum ficheiro da aplicacao foi alterado.
- Evidencia: node scripts/rawspec-v2-cli.mjs check-archive-change reportou eligible true sem blockers antes do arquivamento; validacao real com src/test/fora-do-ambito.ts detectado em outOfScope e commit bloqueado; 141 testes passam com 7 novos; pnpm lint, typecheck, test, build, test:e2e (15 em 3 viewports) e prettier --check aprovados em 2026-11-16.

## 2026-11-16 — Evento — Conclusão TASK-002 — Configurar qualidade e Git Hooks

- Autor: Carlos Henrique
- Origem: sessão
- Decisão: TASK-002 concluída e verificada: centralizado lint-staged no package.json e atualizado o hook pre-commit; lint, typecheck, testes, formatação, build, E2E e teste de bloqueio do hook passaram. Revisão em par aprovada. Commit/push pendentes por indisponibilidade do guardiao com acesso Git.
- Motivo: TASK-002 concluída e verificada: centralizado lint-staged no package.json e atualizado o hook pre-commit; lint, typecheck, testes, formatação, build, E2E e teste de bloqueio do hook passaram. Revisão em par aprovada. Commit/push pendentes por indisponibilidade do guardiao com acesso Git.
- Impacto: não informado
- Evidência: não informada

## 2026-11-16 — Evento — commit-task corrompeu o repositório partilhado durante o push da TASK-013

- Autor: Carlos Henrique
- Origem: sessão
- Decisão: O commit-task da TASK-013 criou o commit correcto e o push foi bloqueado pelo hook pre-push, que executa pnpm test a partir do worktree. A suíte de testes do helper criava repositórios temporários com git init sem isolar o GIT_DIR. Num worktree, .git é um ficheiro com a forma gitdir: <caminho>, e o Git descobre o repositório por ascensão de diretórios, pelo que git init reinitializou o repositório partilhado em vez de criar um novo. Os danos observados foram: core.bare = true na configuração partilhada; a identidade de teste [user] Test <test@example.com> injectada na configuração partilhada; a branch task/008-013-orquestracao-verificacao-pelo-utilizador-e-push sobrescrita com commits de fixture; o HEAD do worktree deslocado para a branch de fixture task/004-001-implementar-coisa; a branch task/004-001-implementar-coisa criada no repositório real; e o author do commit atribuído a Test <test@example.com> em vez da identidade do utilizador. Todos foram reparados e o commit foi pushado com a identidade correcta.
- Motivo: As operações Git do helper eram executadas com cwd no repositório indicado, sem fixar GIT_DIR. Num worktree o .git é um ficheiro, e o Git resolve o repositório partilhado em vez do repositório indicado. O hook pre-push executa a suíte de testes dentro do worktree, o que permitiu que os comandos git dos testes escrevessem no repositório real. O push foi bloqueado pelo hook porque os testes falharam, o que impediu o push de commits de fixture para o remoto.
- Impacto: O repositório partilhado ficou com core.bare = true e com a identidade de teste na configuração, e a branch da TASK-013 foi sobrescrita com commits de fixture. A reparação restaurou core.bare = false, removeu a identidade de teste da configuração local, repôs a branch no commit correcto, repôs o HEAD do worktree e eliminou a branch de fixture. A causa raiz foi corrigida em scripts/rawspec-v2.mjs e scripts/rawspec-v2.test.mjs, no commit 211a64e. A change 008 e a TASK-013 mantêm o registo em specs/changes/008-orquestracao-verificacao-e-push, e o commit foi pushado para origin/task/008-013-orquestracao-verificacao-pelo-utilizador-e-push.
- Evidência: Reprodução directa em 2026-11-16: num directório com um ficheiro .git com a forma gitdir:, git init devolveu Reinitialized existing Git repository in <repo>/.git/worktrees/008-orquestracao-verificacao-e-push/. Com --separate-git-dir, git init devolveu fatal: unable to move <repo>/.git to .../gitdir-14qSb8: Permission denied. O reflog do worktree registou os commits de fixture entre as 19:08:55 e as 19:08:59, e o commit legítimo bb7bf35 foi criado às 19:08:43. A suíte de testes corre com o cwd no worktree e, com a correcção aplicada, os 99 testes do helper passam sem alterar core.bare, sem criar branches de fixture e sem modificar o HEAD do worktree.

## 2026-11-16 — Detalhe — Isolamento do directório Git nas operações do helper e da suíte de testes

- Autor: Carlos Henrique
- Origem: sessão
- Decisão: Todas as operações Git do helper fixam GIT_DIR e GIT_WORK_TREE ao repositório indicado, em vez de o descobrirem por ascensão de directórios. A nova função resolveGitDir, em scripts/rawspec-v2.mjs, resolve o directório Git do repositório tanto quando .git é um directório como quando é um ficheiro gitdir: de um worktree, e runCommand aplica-o a cada execução. Na suíte de testes, os helpers git, initRepo e initBareRepo em scripts/rawspec-v2.test.mjs passam a executar com GIT_DIR e GIT_WORK_TREE fixos ao repositório de teste, e os repositórios temporários são criados com um directório Git isolado.
- Motivo: Sem a fixação explícita do directório Git, qualquer comando Git executado a partir de um worktree escreve no repositório partilhado, porque o Git segue o ficheiro .git em vez de criar um repositório novo. A correcção torna o directório Git explícito em todos os pontos de entrada, de modo a que o destino deixe de depender de onde o comando é executado.
- Impacto: scripts/rawspec-v2.mjs ganha a função resolveGitDir e runCommand passa a definir GIT_DIR e GIT_WORK_TREE; scripts/rawspec-v2.test.mjs passa a isolar os comandos Git dos repositórios de teste. docs/projeto.md ganha a secção 7.5 Isolamento do repositório, que documenta a política e o risco. A correcção está no commit 211a64e, na branch task/008-013-orquestracao-verificacao-pelo-utilizador-e-push.
- Evidência: Verificado em 2026-11-16: com a correcção aplicada, os 99 testes de scripts/rawspec-v2.test.mjs executados com o cwd no worktree passam e o repositório mantém core.bare = false, o HEAD em 211a64e, a branch task/008-013 intacta e nenhuma branch de fixture criada. O push da TASK-013 passou com o hook pre-push a correr typecheck, os 146 testes e o build. pnpm lint, typecheck, test, build, test:e2e (15 em 3 viewports) e prettier --check aprovados.

## 2026-11-16 — Evento — Change 009 arquivada

- Autor: Carlos Henrique
- Origem: sessão
- Decisão: A change 009-registro-do-incidente-de-git foi aprovada, a TASK-014 foi concluída, verificada e arquivada individualmente, e a mudança foi arquivada em specs/changes/archive/009-registro-do-incidente-de-git.
- Motivo: As regras da TASK-013 proibiam explicitamente adicionar entradas a docs/history.md e criar ADRs, pelo que o incidente e a correcção da causa raiz não podiam ser registados naquela tarefa. A change 009 criou uma tarefa própria exclusivamente para esse registo.
- Impacto: docs/history.md tem duas entradas novas: um Evento sobre o incidente em que o commit-task corrompeu o repositório partilhado durante o push da TASK-013, e um Detalhe sobre a correcção da causa raiz. docs/projeto.md ganha a secção 7.5 Isolamento do repositório, que documenta a fixação de GIT_DIR e GIT_WORK_TREE e o risco de git init num worktree. A causa raiz já estava corrigida em scripts/rawspec-v2.mjs e scripts/rawspec-v2.test.mjs no commit 211a64e, que pertence à change 008 e continua por integrar no main.
- Evidência: node scripts/rawspec-v2-cli.mjs check-archive-change reportou eligible true sem blockers antes do arquivamento; a TASK-014 foi arquivada com archive-task --approved e a change 009 com archive-change --approved. O commit 0a7ceb2 contém os quatro ficheiros do âmbito e foi pushado para origin/task/009-014-registar-o-incidente-de-git. pnpm test (146 aprovados, 1 ignorado), pnpm test:e2e (15 aprovados em 3 viewports), pnpm lint, typecheck e prettier --check aprovados em 2026-11-16.

## 2026-11-16 — Evento — Change 008 arquivada

- Autor: Carlos Henrique
- Origem: sessão
- Decisão: A change 008-orquestracao-verificacao-e-push foi aprovada, a TASK-013 foi concluída, verificada e arquivada individualmente, e a mudança foi arquivada em specs/changes/archive/008-orquestracao-verificacao-e-push.
- Motivo: A TASK-013 implementou a nova divisão de responsabilidades entre o utilizador, o orquestrador, o verificador e o guardião, e a ordem de checks no commit-task. Durante o push dessa tarefa, o commit-task corrompeu o repositório partilhado, o que obrigou a reparar a configuração Git, a branch e o HEAD do worktree, e a corrigir a causa raiz no helper. A TASK-014, na change 009, registou o incidente e a correção.
- Impacto: No fluxo padrão, o utilizador executa manualmente apenas pnpm test e pnpm test:e2e, por esta ordem, e envia a evidência; o verificador avalia a evidência sem executar shell; depois das revisões, o guardião executa o commit-task, que corre pnpm lint, pnpm typecheck, pnpm test e pnpm build por esta ordem e reporta a branch e o resultado do push. package.json passou a correr pnpm build antes do Playwright, para que pnpm test:e2e funcione de raiz. scripts/rawspec-v2.mjs e scripts/rawspec-v2.test.mjs passaram a fixar GIT_DIR e GIT_WORK_TREE, o que impede que uma execução a partir de um worktree escreva no repositório partilhado. Os treze ficheiros de classificação foram revistos, a contradição entre o princípio 7 e a secção 15 de docs/rawspec-v2.md foi resolvida, e a TASK-014 registou o incidente e a correção na change 009.
- Evidência: node scripts/rawspec-v2-cli.mjs check-archive-change reportou eligible true sem blockers antes do arquivamento; a TASK-013 foi arquivada com archive-task --approved e a change 008 com archive-change --approved. O commit 211a64e contém os quinze ficheiros do âmbito e foi pushado para origin/task/008-013-orquestracao-verificacao-pelo-utilizador-e-push; a reparação do incidente e a correcção da causa raiz estão no mesmo commit. pnpm test (146 aprovados, 1 ignorado), pnpm test:e2e (15 aprovados em 3 viewports), pnpm lint, typecheck e prettier --check aprovados em 2026-11-16.

## 2026-11-17 — Evento — Change 010 arquivada

- Autor: Carlos Henrique
- Origem: sessão
- Decisão: A change 010-corrigir-o-ttl-de-cache-do-provider foi aprovada, a TASK-015 foi concluída, verificada e arquivada individualmente, e a mudança foi arquivada em specs/changes/archive/010-corrigir-o-ttl-de-cache-do-provider.
- Motivo: O provider opencode-go aceita apenas prompt_cache_options.ttl = 30m. O cliente aceita 1h, porque o seu esquema valida contra /^\d+(ms|s|m|h|d)$/, mas o provider rejeita-o. A configuração do projecto definia 1h, o que fazia falhar toda a chamada de subagente ao opencode-go, enquanto a sessão principal não era afectada por não enviar prompt_cache_options. O bug bloqueou o guardião e obrigou a usar o provider opencode nas revisões durante a TASK-013.
- Impacto: opencode.json passa a definir providers.opencode-go.settings.cache.ttl como 30m, o único valor aceite pelo provider. As permissões e experimental.todo do ficheiro mantêm-se intactos. O valor é lido ao arranque da sessão, pelo que o efeito só é visível em sessões novas.
- Evidência: Verificado em 2026-11-17: antes da correcção, uma sessão nova com opencode run invoca um subagente guardiao via opencode-go e falha com Invalid value for 'prompt_cache_options.ttl'; depois da correcção, a mesma invocação devolve OK sem erro. A função que constrói o pedido transforma 24h em prompt_cache_retention e qualquer outro valor em prompt_cache_options.ttl. pnpm test (146 aprovados, 1 ignorado), pnpm test:e2e (15 aprovados em 3 viewports), pnpm lint, typecheck e prettier --check aprovados. O commit 5dd3d5d foi pushado e integrado em main pelo PR 16, com o CI verde.

## 2026-11-16 — Evento — Conclusão verificada da TASK-003

- Autor: orquestrador
- Origem: /orquestrar TASK-003
- Decisão: TASK-003 concluída e verificada. A revisão confirmou que a camada de estilos existente já satisfaz os critérios atualizados, sem alterações de código. O registo foi feito pela CLI após verificação e revisão em par; commit/push ainda dependem do guardião.
- Motivo: Os cinco ficheiros do âmbito já cumpriam os entregáveis; a task foi esclarecida para descrever revisão e consolidação, e os checks automatizados e de browser passaram.
- Impacto: TASK-003 marcada COMPLETED/VERIFIED; sem impacto em código de produto. Commit/push da branch task/001-003-configurar-estilos-globais continuam pendentes.
- Evidência: Clareza 95/100; pnpm lint, typecheck, test (141 passed, 1 skipped), build, test:e2e (15 passed), format:check; 106 usos var() em 32 tokens declarados; browser Playwright confirmou paleta, tipografia, foco, reduced motion e sem overflow em 375/768/1280; revisores A e B aprovados.

## 2026-11-17 — Decisão — Ordem das permissões do guardião corrigida e conflito do PR 17 resolvido

- Autor: Carlos Henrique
- Origem: sessão
- Decisão: O frontmatter de .opencode/agents/guardiao.md declarava a regra geral shell: '*' em deny depois das seis regras específicas em allow. Como a última correspondência prevalece, o deny geral anulava todas as específicas e o guardião não executava comando de shell nenhum. A regra geral passou para o primeiro lugar e as seis regras específicas mantiveram-se, sem qualquer comando novo. Em paralelo, o conflito de merge do PR 17 em docs/history.md foi resolvido pela união das duas caudas: as 60 entradas de main mantidas na ordem, com a entrada da TASK-003 acrescentada no fim. A branch task/001-003-configurar-estilos-globais foi rebaseada sobre main e o PR 17 passou a MERGEABLE.
- Motivo: A ordem invertida anulava as permissões do guardião e impedia-o de fazer commit e push, o que explica o registo de 2026-11-16 de que o commit e o push da TASK-002 ficaram pendentes por indisponibilidade do guardião com acesso Git. A regra de docs/orquestrador.md 4.2 determina que, dentro de cada agente, a regra geral precede a específica, e o guardião era o único agente com a ordem invertida. O conflito do PR 17 bloqueava a integração da conclusão verificada da TASK-003.
- Impacto: As permissões de .opencode/agents/guardiao.md passam a permitir git status, git diff, git add, git commit, git push e node scripts/rawspec-v2-cli.mjs, mantendo o deny geral que fecha todo o resto. docs/history.md ganha uma entrada, por append, e conserva as 60 entradas anteriores sem reescrita. O commit da TASK-003 na branch do PR 17 passou de 5d4149e para 21b994f, com o commit original preservado em backup/task-001-003-pr17-pre-rebase. Nenhum ficheiro de produto foi alterado e a TASK-003 mantém o âmbito de estilos globais e index.html.
- Evidência: Verificado em 2026-11-17: a leitura do frontmatter confirma 7 regras, com a regra geral em deny na posição 1 e 6 regras allow depois, contra 7 recursos com os mesmos nomes antes e depois, o que prova reordenação sem comandos novos. A verificação funcional confirma o efeito real, em três sessões do OpenCode com o agente guardiao: git status --short --branch executou e devolveu o estado do worktree; git diff --stat executou e devolveu o diff de 2 ficheiros; node scripts/rawspec-v2-cli.mjs open --change 011-permissoes-do-guardiao-e-conflito-do-pr-17 executou e devolveu o JSON da task; node -e "console.log('teste de permissao')" foi recusado pela camada de permissões com Error: Permission denied: shell, sem executar; git reset --hard HEAD foi recusado, sem executar. A resolução do conflito foi comparada byte a byte com as duas pontas: 0 entradas de main em falta, 0 entradas da branch em falta, 0 entradas reescritas, ordem das 60 entradas de main preservada nas primeiras 60 posições e a entrada da TASK-003 na última posição. O git diff main -- docs/history.md mostra 9 linhas adicionadas e 0 removidas. O git merge-tree de main com a branch rebaseada devolve saída sem marcadores de conflito, e gh pr view 17 reporta MERGEABLE com CI verde. pnpm lint, typecheck, test (146 aprovados, 1 ignorado), build, test:e2e (15 aprovados) e prettier --check aprovados.

## 2026-11-17 — Evento — Change 011 arquivada

- Autor: Carlos Henrique
- Origem: sessão
- Decisão: A change 011-permissoes-do-guardiao-e-conflito-do-pr-17 foi aprovada, a TASK-001 foi concluída, verificada e arquivada individualmente, e a mudança foi arquivada em specs/changes/archive/011-permissoes-do-guardiao-e-conflito-do-pr-17.
- Motivo: A TASK-001 corrigiu a ordem das permissões do guardião e resolveu o conflito de docs/history.md do PR 17. Com a TASK-001 arquivada, o check-archive-change deixou de reportar bloqueios e a change ficou elegível para arquivamento.
- Impacto: O agent guardião passa a executar git status, git diff, git add, git commit, git push e node scripts/rawspec-v2-cli.mjs, com o deny geral em deny na primeira posição a fechar todo o resto. O conflito do PR 17 fica resolvido em docs/history.md, com as entradas existentes preservadas e a regra append-only intacta. A TASK-003 entra no main com o registo da sua conclusão e verificação. A change 011 e a única change arquivada deste ciclo, e a change 001-portfolio-mvp passa a ser a única change activa do projecto.
- Evidência: node scripts/rawspec-v2-cli.mjs check-archive-change reportou eligible true sem blockers antes do arquivamento; a TASK-001 foi arquivada com archive-task --approved e a change 011 com archive-change --approved; check-archive-change reporta archived true e o comando open devolve lista vazia. O commit 6ff49f9 foi pushado e integrado no main pelo PR 18, com o CI verde, e a merge 0b200a1, que integra o PR 17. pnpm lint, typecheck, test (146 aprovados, 1 ignorado) e prettier --check aprovados; node bakeoff/validate.mjs 15/15.

## 2026-11-17 — Evento — TASK-001 concluída

- Autor: Carlos Henrique
- Origem: execução da change 012-pull-request-automatico
- Decisão: A TASK-001 (automatizar a criação de pull requests) foi concluída e verificada. O `commit-task` passa a abrir o pull request da branch da tarefa para `main`, depois do push bem-sucedido, com `gh pr create --base main --head <branch>`, de forma idempotente e sem merge automático.
- Motivo: A abertura do pull request era um passo manual fora do fluxo RawSpec, o que impedia o `commit-task` de reportar o pull request e permitia a criação de pull requests duplicados para a mesma branch. A criação automática torna a abertura rastreável pela tarefa, e a idempotência por procura evita duplicados. O merge continua a ser uma decisão do utilizador.
- Impacto: `scripts/rawspec-v2.mjs` ganha `openPullRequest`, `findPullRequest`, `buildPullRequestContent`, `resolveGhExecutable` e `runExternalCommand`, e `commitAndPushTask` passa a devolver `pullRequest` com `status` entre `created`, `existing` e `failed`. `scripts/rawspec-v2-cli.mjs` ganha o comando `open-pr` e a flag `--no-pr`, e o parsing das flags booleanas deixa de consumir o argumento seguinte. Os erros `E_PR_UNAVAILABLE` e `E_PR_CREATE_FAILED` terminam com código de saída `8`, e `E_ARGS` recusa um pull request da base para ela própria. A falha do pull request não desfaz o commit nem o push e não reprova a verificação da tarefa. `docs/rawspec-v2.md` documenta a automação em §15.6, e `AGENTS.md`, `.opencode/agents/guardiao.md`, `.opencode/commands/continuespec.md` e `.opencode/commands/orquestrar.md` descrevem a abertura automática, a idempotência, a ausência de merge automático e o campo `PR:` no reporte. A decisão ficou registada na ADR-008.
- Evidência: Verificado em 2026-11-17: pnpm test exit 0, 6 ficheiros, 258 aprovados | 1 ignorado (259); pnpm test:e2e exit 0, com build aprovado, 61 aprovados | 2 ignorados (63); pnpm lint, pnpm typecheck, pnpm build e pnpm format:check aprovados. Avisos jsdom canvas não bloqueantes. Revisão A e revisão B aprovadas, sem achados de alta ou média gravidade. A cobertura de testes da automação está em `scripts/rawspec-v2.test.mjs` e `scripts/rawspec-v2-cli.test.mjs`, com executáveis `gh` e `pnpm` falsos no `PATH` e sem acesso à rede.

## 2026-11-18 — Evento — Conclusao TASK-005 - Implementar secao inicial

- Autor: Carlos Henrique
- Origem: sessão
- Decisão: Autor: Carlos Henrique. Origem: execucao da change 001-portfolio-mvp. Decisao: A TASK-005 (implementar secao inicial) foi concluida, verificada e esta pronta para commit. A secao inicial e a barra lateral apresentam identidade real a partir de src/data/profile.ts, sem texto ficticio; a fotografia so e renderizada quando profile.name existe, com texto alternativo 'Fotografia de <nome>'; as chamadas para acao sao condicionadas a existencia de projetos e canais de contacto. Motivo: Rever e completar a secao inicial ja implementada, garantindo que a identidade profissional, a fotografia e as chamadas para acao refletem apenas conteudo real e respeitam a identidade visual aprovada. Impacto: src/sections/Home/Home.tsx, src/sections/Home/Home.module.css, src/components/Sidebar.tsx, src/components/Sidebar.module.css, src/test/content.test.tsx, src/App.test.tsx, e2e/responsive.spec.ts e src/data/profile.ts foram revistos. Foi introduzido em src/data/profile.ts um mecanismo de injecao de perfil para testes end-to-end atraves de window.__PORTFOLIO_PROFILE__; sem esse global, o conteudo real de src/content/profile.ts e usado. Os achados remanescentes (foco do CTA primario, override de window.__PORTFOLIO_PROFILE__ em producao, validacao de protocolo das URLs de contacto, trim dos campos, fallback do teste de desempate, regex permissiva, teste E2E da barra lateral, iteracao pixel-a-pixel, casts frageis) foram adiados pelo utilizador para a TASK-009 ou tasks posteriores. Evidencia: pnpm test exit 0 (265 passados / 1 skipped, 6 ficheiros de teste, duracao 70.26s, avisos jsdom de HTMLCanvasElement.getContext() nao bloqueantes); pnpm test:e2e exit 0 (build de producao concluido, 75 testes com 6 workers, 73 passados / 2 skipped). Nas rondas anteriores a verificacao passou mas as revisoes A e B reprovaram; os achados corrigidos foram o desacoplamento dos testes face ao conteudo real (mock de src/data/profile com perfil sem nome em src/test/content.test.tsx e src/App.test.tsx) e a limpeza/import dos mocks em src/App.test.tsx (helper renderApp com import dinamico, vi.resetModules em beforeEach, vi.doUnmock em afterEach). Revisoes A e B finais aprovadas sem achados bloqueantes.
- Motivo: Autor: Carlos Henrique. Origem: execucao da change 001-portfolio-mvp. Decisao: A TASK-005 (implementar secao inicial) foi concluida, verificada e esta pronta para commit. A secao inicial e a barra lateral apresentam identidade real a partir de src/data/profile.ts, sem texto ficticio; a fotografia so e renderizada quando profile.name existe, com texto alternativo 'Fotografia de <nome>'; as chamadas para acao sao condicionadas a existencia de projetos e canais de contacto. Motivo: Rever e completar a secao inicial ja implementada, garantindo que a identidade profissional, a fotografia e as chamadas para acao refletem apenas conteudo real e respeitam a identidade visual aprovada. Impacto: src/sections/Home/Home.tsx, src/sections/Home/Home.module.css, src/components/Sidebar.tsx, src/components/Sidebar.module.css, src/test/content.test.tsx, src/App.test.tsx, e2e/responsive.spec.ts e src/data/profile.ts foram revistos. Foi introduzido em src/data/profile.ts um mecanismo de injecao de perfil para testes end-to-end atraves de window.__PORTFOLIO_PROFILE__; sem esse global, o conteudo real de src/content/profile.ts e usado. Os achados remanescentes (foco do CTA primario, override de window.__PORTFOLIO_PROFILE__ em producao, validacao de protocolo das URLs de contacto, trim dos campos, fallback do teste de desempate, regex permissiva, teste E2E da barra lateral, iteracao pixel-a-pixel, casts frageis) foram adiados pelo utilizador para a TASK-009 ou tasks posteriores. Evidencia: pnpm test exit 0 (265 passados / 1 skipped, 6 ficheiros de teste, duracao 70.26s, avisos jsdom de HTMLCanvasElement.getContext() nao bloqueantes); pnpm test:e2e exit 0 (build de producao concluido, 75 testes com 6 workers, 73 passados / 2 skipped). Nas rondas anteriores a verificacao passou mas as revisoes A e B reprovaram; os achados corrigidos foram o desacoplamento dos testes face ao conteudo real (mock de src/data/profile com perfil sem nome em src/test/content.test.tsx e src/App.test.tsx) e a limpeza/import dos mocks em src/App.test.tsx (helper renderApp com import dinamico, vi.resetModules em beforeEach, vi.doUnmock em afterEach). Revisoes A e B finais aprovadas sem achados bloqueantes.
- Impacto: não informado
- Evidência: não informada
## 2026-11-24 - Decisao - Routing do orquestrador migra de gpt-6-luna para minimax-m3

- Autor: Carlos Henrique
- Origem: sessao OpenCode
- Decisao: O gpt-6-luna saiu do routing de modelos do orquestrador. O minimax-m3 (opencode-go/minimax-m3) ocupa as tres etapas que o gpt-6-luna ocupava, com as mesmas variantes de effort: orquestracao (orquestrador, high), clareza (analista-clareza, max) e revisao A (revisor, max). As restantes cinco etapas mantem o modelo actual: beam-free na exploracao e no registo, claude-haiku-5-5 na implementacao e na verificacao, e kimi-k2.7-code na revisao B.
- Motivo: Decisao do utilizador. O minimax-m3 tem recall de 100% contra 80% do gpt-6-luna, e encontra defeitos que o gpt-6-luna nao via. O custo e explicito: 12 falsos positivos contra 1, e um custo por revisao de $0,0134 contra $0,0018. A troca foi registada como decisao do utilizador e nao como conclusao da medicao, porque o bake-off continua a apontar o gpt-6-luna como o melhor equilibrio (83,5 contra 76,5 de score).
- Impacto: .opencode/agents/orquestrador.md, .opencode/agents/analista-clareza.md, .opencode/agents/revisor.md, .opencode/commands/orquestrar.md e .opencode/commands/clarity.md passam a usar opencode-go/minimax-m3. docs/orquestrador.md actualiza a tabela de routing (secao 2), as faixas de escalonamento (2.1), a ressalva de independência da revisão em par (5.1) e a tabela de custos (6). bakeoff/calc-cost.mjs e bakeoff/validate.mjs passam a somar minimax-m3 em lugar de gpt-6-luna. bakeoff/README.md regista que o gpt-6-luna foi o melhor equilibrio na medição e que saiu do routing. A decisao ficou registada na ADR-009; a ADR-007 e a change 006 arquivada permanecem intactas como registo historico.
- Evidencia: node bakeoff/validate.mjs 14/15 conformes, com a verificacao de custos a confirmar 0,0576 contra a medicao 0,0576; node bakeoff/check-agents.mjs 8/8 agentes descobertos; node bakeoff/check-content-gate.mjs PASS. A unica verificacao FALHA (docs/history.md com entradas duplicadas) e pre-existente no HEAD, com "TASK-001 concluida" registada em duas entradas de changes diferentes, e nao foi introduzida por esta mudanca. Preco de catalogo do minimax-m3 em opencode-go confirmado no catalogo models.dev: $0,30 input, $1,20 output e $0,06 cache read por milhao de tokens.
## 2026-11-24 - Decisao - Verificacao manual passa a ser executada por agente

- Autor: Carlos Henrique
- Origem: sessao OpenCode
- Decisao: As verificacoes manuais do projecto passam a ser executadas por um agente novo, o executor, e nao pelo utilizador. O executor corre exactamente dois comandos, por esta ordem, pnpm test e pnpm test:e2e, e devolve ao verificador a evidencia de cada um: o comando exacto, o codigo de saida e a saida relevante. O verificador continua sem shell e avalia a evidencia recebida. O gate de verificacao deixa de ser um passo manual.
- Motivo: Decisao do utilizador. A verificacao manual era o passo mais lento e mais fragil do pipeline: bloqueava a execucao a espera de o utilizador correr dois comandos e reportar, e o verificador avaliava evidencia de segunda mao, dependente da disciplina de quem a escrevia. A separacao entre executor e verificador preserva a independencia do gate: um executa, o outro avalia, e o verificador continua a poder reprovar a evidencia sem nunca a ter produzido.
- Impacto: .opencode/agents/executor.md e criado, com edit deny, shell allow para pnpm test e pnpm test:e2e sem wildcard, shell deny em geral e subagent deny. .opencode/agents/verificador.md passa a avaliar a evidencia do executor e distingue a ausencia de execucao, que e FALHA, da evidencia em falta, que e EM FALTA. .opencode/agents/orquestrador.md invoca o executor na etapa de verificacao. .opencode/agents/implementador.md distingue as suas verificacoes de task da verificacao global do pipeline. Os comandos /orquestrar, /continuespec e /startspec foram actualizados. AGENTS.md reescreve a divisao de responsabilidades: o utilizador deixa de executar comandos de verificacao e passa a intervir apenas em decisoes de ambito, discrepancias e desempates de revisao. docs/orquestrador.md actualiza as secoes 2, 3, 4.2, 4.3, 5 e 7, e passa de oito para nove agentes. docs/rawspec-v2.md actualiza as secoes 10 e 15. bakeoff/validate.mjs passa a verificar nove agentes e inclui uma verificacao nova que confirma que o executor permite apenas os dois comandos de verificacao e nao escreve. bakeoff/check-agents.mjs inclui o executor. bakeoff/check-permissions.mjs inclui um caso em que o executor nao escreve ficheiros e dois casos em que corre os comandos de verificacao. bakeoff/calc-cost.mjs e bakeoff/validate.mjs passam a contar a etapa do executor, e o custo por task subiu de 0,0576 para 0,0593. A decisao ficou registada na ADR-010; a ADR-007 e a change 006 arquivada permanecem intactas como registo historico.

## 2026-11-24 - Detalhe - Permissoes do executor corrigidas e comandos de leitura liberados

- Autor: Carlos Henrique
- Origem: sessao OpenCode
- Decisao: O executor passa a poder correr seis comandos, todos de leitura: pnpm test, pnpm test:e2e, pnpm lint, pnpm typecheck, pnpm format:check e pnpm build. Fica de fora pnpm lint:fix e pnpm format, porque reescrevem ficheiros, e pnpm dev e pnpm preview, porque sao servidores que bloqueiam o processo. A libertao aplica-se apenas ao executor; os cinco agentes de leitura mantem shell deny.
- Motivo: Decisao do utilizador. Os comandos de leitura supplementares sao seguros porque nao alteram os ficheiros do projecto, e dao ao executor a capacidade de diagnosticar a causa de uma falha com a primeira linha de erro. A medicao por matriz de permissoes revelou dois factos que a configuracao inicial tinha errados: primeiro, a ordem das regras shell e load-bearing, porque a ultima regra que corresponde prevalece, e as allow estavam antes do deny geral, o que anulava todas as permissoes; segundo, negar edit e subagent em conjunto remove a ferramenta de shell por completo, deixando o agente com No tool named shell is currently available, sem executar nada. Por isso o executor tem edit deny e nao tem subagent deny, e a regra shell deny geral vem antes das allow especificas.
- Impacto: .opencode/agents/executor.md passa a permitir os seis comandos de leitura, com a ordem correcta das regras shell, e documenta a nota sobre as permissoes. docs/orquestrador.md ganha a seccao 4.4 com as duas limitacoes medidas e a matriz. docs/decisions/ADR-010-verificacao-executada-por-agente.md regista as permissoes finais, a medicao e as consequencias negativas. bakeoff/validate.mjs ganha uma verificacao que confirma que a regra shell deny vem antes dos allow, porque a ordem inversa falha sem erro visivel. bakeoff/check-permissions.mjs foi corrigido: passava porPASS com o comando recusado, porque se apoiava no codigo de saida do processo, e um comando negado tambem produz codigo 0; passa agora a procurar a assinatura da negacao e a exigir evidencia real de execucao, com a assinatura de cada programa verificada.
- Evidencia: A matriz de permissoes foi medida com node, executando o agente executor com cada combinacao: so shell executa pnpm lint, shell com edit deny executa, shell com subagent deny executa, e shell com edit deny e subagent deny nao executa. A correcao da ordem foi confirmada por execucao real: pnpm lint devolveu eslint . sem erros, pnpm typecheck devolveu tsc --noEmit sem erros, e pnpm test devolveu vitest run com 265 aprovados e 1 ignorado em 6 ficheiros, o mesmo estado conhecido do projecto. node bakeoff/validate.mjs 16/17 conformes, incluindo a verificacao nova da ordem das regras. A unica verificacao FALHA (docs/history.md com entradas duplicadas) e pre-existente no HEAD e nao foi introduzida por esta mudanca.
- Evidencia: node bakeoff/validate.mjs 15/16 conformes, incluindo a verificacao nova do executor, shell limitado a pnpm test e pnpm test:e2e, sem escrita. A unica verificacao FALHA (docs/history.md com entradas duplicadas) e pre-existente no HEAD, com TASK-001 concluida registada em duas entradas de changes diferentes, e nao foi introduzida por esta mudanca. pnpm lint, pnpm typecheck e pnpm format:check aprovados. A execucao real dos comandos pelo executor e verificada por node bakeoff/check-permissions.mjs.
## 2026-11-24 - Decisao - O orquestrador indica a proxima task ao terminar cada tarefa

- Autor: Carlos Henrique
- Origem: sessao OpenCode
- Decisao: Quando uma task termina, o guardiao identifica a proxima task a realizar e devolve-a no campo PROXIMA da sua saida. O orquestrador apresenta esse campo ao utilizador. A procura usa node scripts/rawspec-v2-cli.mjs next --change NNN-slug, primeiro na change da task que acabou de terminar, e depois node scripts/rawspec-v2-cli.mjs next, que percorre todas as changes aprovadas.
- Motivo: Decisao do utilizador, com o objectivo de terminar a primeira parte do portfolio sem interrupcoes. O grafo de dependencias e a CLI ja resolvia a questao; faltava liga-los ao fim do pipeline. A escolha do guardiao como actor foi porque e ele quem acaba a task e sabe que o commit e o push correram, e porque ja tem permissao para a CLI RawSpec, o que nao exige mudar permissoes.
- Impacto: .opencode/agents/guardiao.md ganha a seccao "Proxima task", com a ordem de procura, os quatro resultados possiveis e a proibicao de implementar ou alterar o estado da task seguinte. .opencode/agents/orquestrador.md apresenta o campo PROXIMA no passo 8 e no formato de saida. .opencode/commands/continuespec.md, /orquestrar.md e /startspec.md foram actualizados. docs/rawspec-v2.md actualiza o passo 15.2. docs/orquestrador.md ganha a seccao 5.3 e a tabela de agentes passa a descrever o guardiao como responsavel pela proxima task. docs/projeto.md regista a referencia. bakeoff/validate.mjs ganha uma verificacao que confirma que o guardiao e o orquestrador referem a proxima task, que a CLI e usada, que a ambiguidade e a ausencia de proxima task sao tratadas e que a proxima task e apenas informacao. A decisao ficou registada na ADR-011.
- Evidencia: node scripts/rawspec-v2-cli.mjs next --change 001-portfolio-mvp devolveu a chave task com TASK-006, Implementar secao de projetos, e o comando next sem change devolveu a mesma change. node bakeoff/validate.mjs 17/18 conformes, incluindo a verificacao nova. A unica verificacao FALHA (docs/history.md com entradas duplicadas) e pre-existente no HEAD e nao foi introduzida por esta mudanca. pnpm lint, pnpm typecheck e pnpm format:check aprovados.
## 2026-11-24 - Detalhe - Corrigida a variante invalida do minimax-m3 no routing

- Autor: Carlos Henrique
- Origem: sessao OpenCode
- Decisao: As cinco declaracoes que usavam opencode-go/minimax-m3#high ou #max passam a usar o modelo sem variante. Sao o agente orquestrador, o agente analista-clareza, o agente revisor e os comandos /orquestrar e /clarity.
- Motivo: O comando /orquestrar TASK-006 falhou com "Variant unavailable for opencode-go/minimax-m3: high". A medicao do catalogo models.dev mostrou que o minimax-m3 declara reasoning_options apenas como toggle, sem effort, pelo que nao tem variantes de effort; o gpt-6-luna que ocupava as mesmas etapas declara effort e aceitava #high e #max. A variante nunca foi um controlo de effort real para este modelo, era uma sintaxe herdada do modelo anterior.
- Impacto: .opencode/agents/orquestrador.md, .opencode/agents/analista-clareza.md, .opencode/agents/revisor.md, .opencode/commands/orquestrar.md e .opencode/commands/clarity.md deixam de declarar variante. docs/orquestrador.md documenta que as variantes so existem para modelos com reasoning_options de tipo effort, e lista quais. docs/decisions/ADR-009-routing-minimax-m3.md regista que o minimax-m3 e usado sem variante de effort. bakeoff/validate.mjs ganha uma verificacao que resolve cada modelo e variante declarados nos nove agentes e nos dois comandos contra o catalogo models.dev, e falha se algum nao resolver.
- Evidencia: A verificacao foi validada reintroduzindo o erro: com minimax-m3#max no revisor, a verificacao falhou, e com a correccao passa. As onze declaracoes resolvem, com seis modelos distintos. Os tres agentes com minimax-m3 carregam com o modelo declarado. node bakeoff/check-agents.mjs 9/9. node bakeoff/validate.mjs 18/19 conformes. A unica verificacao FALHA (docs/history.md com entradas duplicadas) e pre-existente no HEAD.
## 2026-11-24 - Detalhe - Cache TTL por modelo corrige os agentes claude-haiku-5-5

- Autor: Carlos Henrique
- Origem: sessao OpenCode
- Decisao: A configuracao mantem cache.ttl de 30m ao nivel do provider opencode-go e acrescenta um override ao nivel do modelo, com cache.ttl de 5m para o claude-haiku-5-5.
- Motivo: Os tres agentes que usam claude-haiku-5-5, implementador, executor e verificador, falhavam em cada pedido com "Upstream request failed: invalid_request_error, tools.N.custom.cache_control.ephemeral.ttl: Input should be 5m or 1h". A causa era o cache.ttl de 30m herdado da configuracao. A medicao mostrou que a exigencia e oposta por modelo: o beam-free aceita exactamente 30m e rejeita qualquer outro valor, com "Invalid value for prompt_cache_options.ttl", e o claude-haiku-5-5 aceita apenas 5m ou 1h. Um TTL unico ao nivel do provider nao serve os dois, pelo que o modelo que discorda precisa de um override ao nivel do modelo.
- Impacto: opencode.json ganha o bloco models.claude-haiku-5-5 com settings.cache.ttl de 5m. docs/orquestrador.md ganha a seccao 2.1, Cache TTL por modelo, com a tabela dos valores aceitos por modelo e o exemplo de configuracao. bakeoff/validate.mjs ganha uma verificacao que confirma o TTL do provider, o override do claude-haiku-5-5 e a coerencia dos restantes overrides.
- Evidencia: A correccao foi verificada por execucao real dos nove agentes com o modelo que cada um declara: 9/9 carregam e respondem. Antes da correccao, tres agents com claude-haiku-5-5 falhavam; com o TTL do provider a 5m, os dois agentes beam-free passavam a falhar, o que confirmou a exigencia oposta e motivou o override por modelo. node bakeoff/validate.mjs 19/20 conformes, incluindo a verificacao nova do TTL. A unica verificacao FALHA (docs/history.md com entradas duplicadas) e pre-existente no HEAD.


## 2026-11-24 — Decisão — Publicação idempotente de commit existente no commit-task

- Autor: Carlos Henrique
- Origem: sessão
- Decisão: O commit-task passou a publicar, de forma idempotente, um commit de task já existente localmente quando a worktree e o índice estão limpos, sem criar commit vazio. O caminho limpo valida a elegibilidade (task COMPLETED+VERIFIED, branch canónica, ausência de MERGE_HEAD, metadados Change:/Task: exactos em todos os commits do range e gate de âmbito por commit), consulta o remote com git ls-remote e busca apenas o ref exacto de que precisa, e decide o push pelo estado remoto (ausente, igual a HEAD, ancestral, à frente ou divergido), falhando fechado com E_GIT_ERROR e uma razão explícita. O pre-push hook permanece activo, o PR é idempotente e resolve owner/repo a partir de URLs HTTPS ou SSH, e --no-push não contacta o remote. O fluxo normal com alterações fica preservado, com staging explícito e sem git add -A.
- Motivo: A falha lint-staged could not find any staged files impedia a publicação de commits RawSpec já existentes; o commit-task não tinha via suportada para os publicar.
- Impacto: O commit-task recupera commits locais elegíveis sem push, sem commit vazio e sem contornar hooks; o fluxo com alterações staged não muda.
- Evidência: pnpm test: 307 passed | 1 skipped (308) em 6 ficheiros, exit 0 (2026-11-24); pnpm test:e2e: 73 passed | 2 skipped (75), exit 0 (2026-11-24). Revisões A e B aplicadas: cobertura de alterações staged, checks antes do push, gate de âmbito e metadados em todo o range, --no-push sem rede, URLs múltiplos, validação de owner/repo, validação de branch e separadores --, E_PR_CREATE_FAILED e reinspecção do remote em caso de corrida TOCTOU.

## 2026-11-25 — Decisão — TASK-006

- Autor: Carlos Henrique
- Origem: sessão
- Decisão: Normalizacao projects.ts, role list, padding zero, 13 testes. Branch nova por causa de execucao anterior orfa.
- Motivo: Normalizacao projects.ts, role list, padding zero, 13 testes. Branch nova por causa de execucao anterior orfa.
- Impacto: não informado
- Evidência: não informada

## 2026-11-25 — Evento — Arquivamento TASK-006

- Autor: Carlos Henrique
- Origem: sessão
- Decisão: TASK-006 concluida e arquivada.
- Motivo: TASK-006 concluida e arquivada.
- Impacto: não informado
- Evidência: não informada

## 2026-11-25 — Evento — Detalhes do arquivamento TASK-006

- Autor: Carlos Henrique
- Origem: sessão
- Decisão: Entregas: normalizacao de src/data/projects.ts remove projetos sem titulo/descricao/tecnologias, remove tecnologias vazias, remove URLs vazias ou sem http(s)://. rel=noreferrer noopener nos links. role=list nas duas listas. padding 0 em .list e .techList. 13 testes novos. Verificacao: pnpm test 6 ficheiros 278 passed 1 skipped de 279. pnpm test:e2e 75 testes 73 passed 2 skipped. Revisoes A e B aprovadas na 2. volta. Decisao: corrigir role=list apenas na secao de projetos; Skills Contact e Sidebar para TASK-007 TASK-008 TASK-004. Dividas: src/data/profile.ts nao valida protocolo das URLs de contacto; teste e2e compara href sem trim().
- Motivo: Entregas: normalizacao de src/data/projects.ts remove projetos sem titulo/descricao/tecnologias, remove tecnologias vazias, remove URLs vazias ou sem http(s)://. rel=noreferrer noopener nos links. role=list nas duas listas. padding 0 em .list e .techList. 13 testes novos. Verificacao: pnpm test 6 ficheiros 278 passed 1 skipped de 279. pnpm test:e2e 75 testes 73 passed 2 skipped. Revisoes A e B aprovadas na 2. volta. Decisao: corrigir role=list apenas na secao de projetos; Skills Contact e Sidebar para TASK-007 TASK-008 TASK-004. Dividas: src/data/profile.ts nao valida protocolo das URLs de contacto; teste e2e compara href sem trim().
- Impacto: não informado
- Evidência: não informada

## 2026-11-25 — Evento — TASK-001 integrada: agente executor, cache TTL por modelo e documentação do orquestrador

- Autor: Carlos Henrique
- Origem: sessão
- Decisão: Origem: stash sessoes-anteriores-pre-TASK-006 (unica copia do trabalho), recuperado apos arquivamento da TASK-006. Entregue: novo agente executor (pnpm test e pnpm test:e2e com evidencia); verificador distingue ausencia de execucao de evidencia em falta; orquestrador invoca o executor incondicionalmente; guardiao devolve PROXIMA; AGENTS.md, docs/orquestrador.md, docs/projeto.md, docs/rawspec-v2.md e README.md actualizados com fluxo por agente, nove agentes, custos medidos e cache TTL por modelo; opencode.json com override cache.ttl 5m para claude-haiku-5-5; ADR-009 (routing minimax-m3), ADR-010 (verificacao por agente), ADR-011 (proxima task). Correccoes da revisao em par: custo por task 0.0229 para 0.0593; envio incondicional da evidencia ao verificador; 17 para 20 verificacoes; reordenacao das seccoes 5.1-5.3; check-permissions.mjs com 6 comandos de leitura e 2 proibidos, captura de stderr e precedencia da recusa. Validacoes: check-permissions 15/15; validate 19/20 (falha pre-existente no HEAD); check-agents 9/9; calc-cost conforme. Conflito em docs/rawspec-v2.md sec. 15.2 resolvido mantendo ambos os lados. Verificacao: pnpm test 6 ficheiros/320 passed (1 skipped), pnpm test:e2e 73 passed (2 skipped). Revisao em par aprovada em duas voltas.
- Motivo: Origem: stash sessoes-anteriores-pre-TASK-006 (unica copia do trabalho), recuperado apos arquivamento da TASK-006. Entregue: novo agente executor (pnpm test e pnpm test:e2e com evidencia); verificador distingue ausencia de execucao de evidencia em falta; orquestrador invoca o executor incondicionalmente; guardiao devolve PROXIMA; AGENTS.md, docs/orquestrador.md, docs/projeto.md, docs/rawspec-v2.md e README.md actualizados com fluxo por agente, nove agentes, custos medidos e cache TTL por modelo; opencode.json com override cache.ttl 5m para claude-haiku-5-5; ADR-009 (routing minimax-m3), ADR-010 (verificacao por agente), ADR-011 (proxima task). Correccoes da revisao em par: custo por task 0.0229 para 0.0593; envio incondicional da evidencia ao verificador; 17 para 20 verificacoes; reordenacao das seccoes 5.1-5.3; check-permissions.mjs com 6 comandos de leitura e 2 proibidos, captura de stderr e precedencia da recusa. Validacoes: check-permissions 15/15; validate 19/20 (falha pre-existente no HEAD); check-agents 9/9; calc-cost conforme. Conflito em docs/rawspec-v2.md sec. 15.2 resolvido mantendo ambos os lados. Verificacao: pnpm test 6 ficheiros/320 passed (1 skipped), pnpm test:e2e 73 passed (2 skipped). Revisao em par aprovada em duas voltas.
- Impacto: não informado
- Evidência: não informada

## 2026-11-25 — Decisão — TASK-008 — Rever e completar a seção de contato

- Autor: guardião (em nome do utilizador)
- Origem: TASK-008 (change 001-portfolio-mvp), reescrita de "Implementar" para "Rever e completar" pelo mesmo critério aplicado à TASK-006 e à TASK-007.
- Decisão: Registar a TASK-008 como COMPLETED e VERIFIED, com a exceção da via 2 aceite. Aprovar o desempate das revisões em par: achados 1, 2 e 4 do revisor-b registados como aceites; achado 3 (normalização aceitava mailto: sem endereço e https:// sem host) corrigido, com efeito colateral adicional: a detecção de mailto: no componente passou a ser case-insensitive, alinhando o componente com a camada de dados. Registar como dívida conhecida os dois achados baixos finais do revisor-b (regex WEB_URL_PATTERN não ancorada no fim; aceita https:///), e a dívida equivalente em src/data/projects.ts:19 (https:// sem host aceite), a resolver na task de projetos.
- Motivo: O verificador devolveu OK em duas rondas (ronda 1: pnpm test 339 passed | 1 skipped; pnpm test:e2e 76 passed | 2 skipped; ronda 2: 343 passed | 1 skipped; 76 passed | 2 skipped). A evidência real dos códigos de saída não pôde ser capturada porque o tool de shell do agente executor recusa comandos compostos (permission.rejected: Permission denied: shell), mesmo após 3 formulações de permissão em sessões novas; a configuração foi revertida ao estado original. O utilizador autorizou explicitamente (via 2) aceitar os resumos de sucesso como evidência, exceção que se aplica apenas a esta task e não é precedente. O risco residual fica coberto pelo commit-task, que volta a correr pnpm test e pnpm build com código de saída real. As revisões em par da 2.ª ronda aprovaram: o revisor sem achados de severidade alta ou média; o revisor-b com dois achados baixos e opcionais, não bloqueantes. Clareza 93/100 (reavaliada pelo analista-clareza; era 55/100 na versão original).
- Impacto: A seção de contato passa a estar revista e completa, com dados normalizados em src/data/profile.ts e testes em src/test/content.test.tsx, src/App.test.tsx, src/test/accessibility.test.tsx e e2e/responsive.spec.ts. src/content/profile.ts não foi alterado (conteúdo do utilizador preservado). Dívida conhecida registada para resolução futura na task de projetos (regex WEB_URL_PATTERN e src/data/projects.ts:19).
- Evidência: Ronda 1: pnpm test -> 6 ficheiros passed, 339 passed | 1 skipped (340), 116.69s. pnpm test:e2e -> build de produção OK (37 módulos, built in 216ms), Playwright 78 testes, 76 passed, 2 skipped, 15.3s. Ronda 2: pnpm test -> 6 ficheiros passed, 343 passed | 1 skipped (344), 106.23s. pnpm test:e2e -> build OK (built in 220ms), 78 testes, 76 passed, 2 skipped, 17.7s. Exceção via 2: tool de shell do executor recusa comandos compostos (permission.rejected: Permission denied: shell); 3 formulações testadas em sessões novas; configuração revertida ao original; verificador aceitou os resumos de sucesso como evidência. Desempate: achados 1, 2 e 4 aceites; achado 3 corrigido (normalização case-insensitive de mailto: no componente e na camada de dados). Achados baixos finais do revisor-b: regex não ancorada no fim; aceita https:///; dívida equivalente em src/data/projects.ts:19.

- Autor: Carlos Henrique
- Origem: sessão
- Decisão: TASK-006 adiou para esta task a correção de role=list e padding:0 nas listas de Skills, Contact e Sidebar. Esta task executou a parte de Skills: role=list em Skills.tsx, padding:0 em Skills.module.css, normalização em src/data/skills.ts (normalizeText, normalizeSkillGroup) seguindo padrão de projects.ts, e 8 testes novos (5 content, 1 App, 2 accessibility). Verificação: pnpm test 328 passed 1 skipped; pnpm test:e2e 73 passed 2 skipped. Decisões do utilizador: sem aria-label na lista de habilidades (contexto dado pelo h3 da categoria); task reescrita de implementar para rever e completar porque a seção existia desde bootstrap 943fe07. Dívidas: Contact e Sidebar mantêm padrão anterior (TASK-008 e TASK-004); normalização não deduplica títulos nem habilidades (TASK-009 deve garantir unicidade); normalizeText duplicado entre projects.ts e skills.ts, pede módulo partilhado.
- Motivo: TASK-006 adiou para esta task a correção de role=list e padding:0 nas listas de Skills, Contact e Sidebar. Esta task executou a parte de Skills: role=list em Skills.tsx, padding:0 em Skills.module.css, normalização em src/data/skills.ts (normalizeText, normalizeSkillGroup) seguindo padrão de projects.ts, e 8 testes novos (5 content, 1 App, 2 accessibility). Verificação: pnpm test 328 passed 1 skipped; pnpm test:e2e 73 passed 2 skipped. Decisões do utilizador: sem aria-label na lista de habilidades (contexto dado pelo h3 da categoria); task reescrita de implementar para rever e completar porque a seção existia desde bootstrap 943fe07. Dívidas: Contact e Sidebar mantêm padrão anterior (TASK-008 e TASK-004); normalização não deduplica títulos nem habilidades (TASK-009 deve garantir unicidade); normalizeText duplicado entre projects.ts e skills.ts, pede módulo partilhado.
- Impacto: não informado
- Evidência: não informada

## 2026-11-25 — Evento — Arquivamento das tasks concluidas da change 001

- Autor: Carlos Henrique
- Origem: sessão
- Decisão: Arquivamento individual das seis tasks concluidas que ainda nao estavam arquivadas: TASK-002 (Configurar qualidade e Git Hooks), TASK-003 (Configurar estilos globais), TASK-004 (Rever e corrigir a estrutura de navegacao), TASK-005 (Implementar secao inicial), TASK-007 (Rever e completar a secao de habilidades) e TASK-008 (Rever e completar a secao de contato). Todas tinham Status COMPLETED e Verificacao VERIFIED, plano de acao none, e foram verificadas elegiveis pelo check-archive-task sem bloqueadores. A TASK-001 e a TASK-006 ja estavam arquivadas.
- Motivo: O docs/rawspec-v2.md secao 4 preve o arquivamento individual de cada task concluida, e a change 001 mantinha seis tasks concluidas em tasks/ em vez de tasks/archive/, divergindo do estado real.
- Impacto: As oito tasks concluidas da change 001 ficam arquivadas em specs/changes/001-portfolio-mvp/tasks/archive/, com Status ARCHIVED e a data de arquivamento registada. As quatro tasks pendentes (TASK-009 a TASK-012) permanecem em tasks/. O grafo de dependencias mantem-se resolvivel: o helper valida dependencias com listTaskFiles(includeArchived: true) e trata ARCHIVED como dependencia satisfeita, pelo que a TASK-009 arrancou com sucesso apos o arquivamento e foi de seguida reposta em PENDING. A change 001 continua nao arquivada, por as quatro tasks pendentes.
- Evidência: check-archive-task reporte eligible=true e blockers=[] para TASK-002 a TASK-005, TASK-007 e TASK-008; start TASK-009 teve sucesso apos o arquivamento das oito tasks, confirmando que as dependencias arquivadas nao bloqueiam; next --change 001-portfolio-mvp devolve TASK-009 como proxima task elegivel.


## 2026-11-23 — Evento — TASK-013 concluida: diagnostico-first falha lint-staged nao reproduzida

- Autor: Carlos Henrique
- Origem: sessão
- Decisão: Autor Carlos Henrique. Origem sessao. Decisao TASK-013 concluida e verificada. Diagnostico-first da falha lint-staged nao reproduziu a falha original; fixture real confirma hook Markdown-only funciona; nenhum codigo de producao corrigido. Correccoes de revisao limitadas ao teste scripts/rawspec-v2-cli.test.mjs. Revisores A e B APROVADOS sem achados. Incidente de processo: mutacao temporaria com --no-verify em scripts/rawspec-v2.mjs por agente alternativo, depois restaurada; HEAD sem commit novo, diff de producao vazio, sem staging/push, apenas nao rastreados esperados; utilizadora autorizou retomar. Nao se usou --no-verify neste registo. Evidencia: pnpm test 6 ficheiros, 160 passed, 1 skipped (161), 45.14s, 14/14 scripts/rawspec-v2-cli.test.mjs; pnpm test:e2e build passou, 15 passed, 0 falhas (7.6s).
- Motivo: Autor Carlos Henrique. Origem sessao. Decisao TASK-013 concluida e verificada. Diagnostico-first da falha lint-staged nao reproduziu a falha original; fixture real confirma hook Markdown-only funciona; nenhum codigo de producao corrigido. Correccoes de revisao limitadas ao teste scripts/rawspec-v2-cli.test.mjs. Revisores A e B APROVADOS sem achados. Incidente de processo: mutacao temporaria com --no-verify em scripts/rawspec-v2.mjs por agente alternativo, depois restaurada; HEAD sem commit novo, diff de producao vazio, sem staging/push, apenas nao rastreados esperados; utilizadora autorizou retomar. Nao se usou --no-verify neste registo. Evidencia: pnpm test 6 ficheiros, 160 passed, 1 skipped (161), 45.14s, 14/14 scripts/rawspec-v2-cli.test.mjs; pnpm test:e2e build passou, 15 passed, 0 falhas (7.6s).
- Impacto: não informado
- Evidência: não informada
