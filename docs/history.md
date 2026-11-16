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
