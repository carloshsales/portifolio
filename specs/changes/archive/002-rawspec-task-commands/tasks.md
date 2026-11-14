# Plano de Implementação — 002 Fluxo RawSpec orientado por tarefa

**Status:** APPROVED  
**Execução:** IN PROGRESS  
**Base:** `proposal.md` e `design.md`

## Critério de clareza

Não há cálculo percentual de clareza. Cada tarefa traz sua própria checklist com os oito critérios abaixo, marcada item a item.

1. Objetivo único e verificável.
2. Arquivos afetados.
3. Entregáveis concretos.
4. Contrato de entrada, saída e erros.
5. Testes obrigatórios.
6. Critério de aceitação objetivo.
7. Dependências declaradas explicitamente.
8. Ausência de decisões pendentes para o implementador.

Valores permitidos por item:

| Valor | Significado |
|---|---|
| `ATENDE` | O critério incide e é atendido pela tarefa como está escrita. |
| `NÃO SE APLICA` | O critério não incide sobre a tarefa; exige justificativa na mesma linha. |
| `NÃO ATENDE` | O critério incide e não é atendido. |

Regras da revisão:

- Todo item `NÃO SE APLICA` precisa de justificativa objetiva que explique por que o critério não incide.
- Todo item `NÃO ATENDE` impede a aprovação da tarefa e da mudança; não há nota ou percentual para compensar.
- Tarefa sem checklist é tratada como pendente de revisão.

## Fase 1 — Baseline e modelo

### TASK-001 — Confirmar baseline e contrato de comportamento
- **Status:** COMPLETED
- **Depende de:** nenhuma
- **Início:** 2026-11-13
- **Verificação:** VERIFIED (2026-11-13) — `docs/rawspec-commands.md` criado com a seção “Baseline”; inventário confirmado (`.opencode/` e `.opencode/commands/` inexistentes, `specs/changes/archive/` vazio, `docs/rawspec-commands.md` ausente antes da tarefa); contrato, decisões confirmadas, política de Git e política de arquivamento registrados; Prettier aprovado; change 001 intacta e nenhum comando criado.
- **Objetivo:** criar `docs/rawspec-commands.md`, registrar que os comandos não existem e congelar o contrato que será implementado.
- **Arquivos:** `docs/rawspec-commands.md` (criação do arquivo, com a seção “Baseline”).
- **Entregáveis:**
  - Inventário confirmando a ausência de `.opencode/commands/`.
  - Registro das decisões: `/startspec` sem argumento inicia a próxima tarefa pendente.
  - Registro da pergunta obrigatória quando existe tarefa aberta.
  - Registro da pergunta obrigatória em caso de ambiguidade.
  - Registro da política de Git: `git add` permitido somente em caminhos exatos do manifesto; commit e push proibidos.
  - Registro da mensagem de commit ao final de cada tarefa.
  - Registro da obrigatoriedade de plano de ação apenas para riscos reais.
- **Regras:**
  - Criar `docs/rawspec-commands.md`; a TASK-010 complementa o mesmo arquivo e não o recria.
  - Não criar comandos nesta tarefa.
  - Não alterar a change 001.
  - Não tomar decisões novas; apenas registrar as decisões confirmadas.
  - Registrar a convenção de dependências explícitas e o modo legado sequencial da change 001.
  - Registrar que o arquivamento valida tudo antes de mover e confina os caminhos à mudança.
- **Testes:** verificação manual de que `.opencode/commands/` não existe antes da implementação.
- **Aceitação:** `docs/rawspec-commands.md` existe, contém a seção “Baseline” com inventário, contrato e decisões confirmadas, e não altera arquivos da change 001.
- **Checklist de clareza:**
  - Objetivo único e verificável — ATENDE
  - Arquivos afetados — ATENDE
  - Entregáveis concretos — ATENDE
  - Contrato de entrada, saída e erros — NÃO SE APLICA (tarefa documental: não expõe interface; as entradas são as decisões confirmadas do design e a saída é o arquivo `docs/rawspec-commands.md`)
  - Testes obrigatórios — ATENDE
  - Critério de aceitação objetivo — ATENDE
  - Dependências declaradas explicitamente — ATENDE
  - Ausência de decisões pendentes para o implementador — ATENDE

### TASK-002 — Implementar parser de mudanças e tarefas
- **Status:** COMPLETED
- **Depende de:** TASK-001
- **Início:** 2026-11-13
- **Verificação:** VERIFIED (2026-11-13) — `scripts/rawspec.mjs` e `scripts/rawspec.test.mjs` criados; 38 testes do helper passando; leitura da change 001 e da change 002 confirmadas em execução real (11 tarefas, dependências e `dependencySource` corretos); todos os casos de `E_PARSE` previstos cobertos; `pnpm lint`, `pnpm typecheck`, `pnpm test` (39 testes) e `pnpm build` aprovados; Prettier aprovado; change 001 intacta.
- **Objetivo:** criar o modelo de leitura dos arquivos Markdown do RawSpec.
- **Arquivos:**
  - `scripts/rawspec.mjs`
  - `scripts/rawspec.test.mjs`
- **Entregáveis:**
  - `parseChange(changeDir)` lendo `proposal.md`, `design.md` e `tasks.md`.
  - `parseTasks(tasksPath)` retornando status da mudança e lista de tarefas.
  - `normalizeTaskId(raw)` e `normalizeChangeId(raw, changes)`.
  - `RawspecError` com `code`, `message` e `details`.
  - Estrutura de tarefa com `id`, `title`, `status`, `verification`, `evidence`, `dependencies`, `dependencySource`, `actionPlan`, `file`, `startLine`, `endLine`.
  - `validateTaskStructure(tasksDoc)` para rejeitar estruturas malformadas com `E_PARSE`.
- **Regras:**
  - Status da mudança é lido apenas antes do primeiro título `##`.
  - `Status` ausente na tarefa equivale a `PENDING`.
  - `Verificação` ausente equivale a `PENDING`.
  - `Plano de ação` ausente equivale a `null`.
  - O parser não escreve arquivos.
  - Preservar UTF-8 e não normalizar o conteúdo original.
  - Não adicionar dependências de runtime.
  - Markdown genérico fora das seções de tarefa é ignorado; o parser não tenta validar Markdown como um todo.
  - Rejeitar com `E_PARSE`: `tasks.md` ausente ou ilegível; arquivo sem nenhuma tarefa; cabeçalho de seção que aparenta ser tarefa mas não contém `TASK-NNN`; cabeçalho sem `— Título` não vazio; `TASK-NNN` duplicado no mesmo arquivo; identificador em `Depende de` fora do padrão `TASK-\d+`; `Status` fora de `PENDING`, `IN PROGRESS`, `VERIFYING` ou `COMPLETED`; `Verificação` fora de `PENDING`, `VERIFIED` ou `FAILED`; bloco de código cercado não fechado; estrutura que impeça identificar os limites da tarefa; conteúdo que não pode ser lido como UTF-8.
  - Uma tarefa começa em `### TASK-NNN — Título` e termina no próximo título `##` ou `###`.
  - Títulos `###` sem o token `TASK` são conteúdo da tarefa anterior; cabeçalhos dentro de blocos de código são ignorados.
- **Testes:**
  - Leitura da change 001.
  - Status com e sem negrito.
  - Tarefa sem status, sem verificação e sem plano de ação.
  - Normalização `TASK-3` → `TASK-003`.
  - Mudança com `design.md` ausente.
  - `tasks.md` ausente retorna `E_PARSE`.
  - Arquivo sem tarefas retorna `E_PARSE`.
  - Cabeçalho `### TASK — Título` sem ID retorna `E_PARSE`.
  - Cabeçalho `### TASK-001` sem título retorna `E_PARSE`.
  - `TASK-001` duplicado no mesmo arquivo retorna `E_PARSE`.
  - `Depende de: TASK-AB` retorna `E_PARSE`.
  - `Status: CONCLUIDA` retorna `E_PARSE`.
  - `Verificação: OK` retorna `E_PARSE`.
  - Bloco de código cercado não fechado retorna `E_PARSE`.
  - Conteúdo UTF-8 inválido retorna `E_PARSE`.
  - Markdown comum fora das tarefas é ignorado sem erro.
  - Título `###` sem `TASK` não encerra a tarefa anterior.
- **Aceitação:** os testes de parsing passam, as estruturas malformadas listadas retornam `E_PARSE`, o parser interrompe sem adivinhar e a change 001 é lida sem alteração.
- **Checklist de clareza:**
  - Objetivo único e verificável — ATENDE
  - Arquivos afetados — ATENDE
  - Entregáveis concretos — ATENDE
  - Contrato de entrada, saída e erros — ATENDE (entradas: `proposal.md`, `design.md` e `tasks.md`; saída: estrutura de mudança e lista de tarefas; erros: `E_PARSE`)
  - Testes obrigatórios — ATENDE
  - Critério de aceitação objetivo — ATENDE
  - Dependências declaradas explicitamente — ATENDE
  - Ausência de decisões pendentes para o implementador — ATENDE

## Fase 2 — Resolução e seleção

### TASK-003 — Implementar resolução de TASK para mudança
- **Status:** COMPLETED
- **Verificação:** VERIFIED (2026-11-13) — resolveTask, listActiveChanges, listArchivedChanges, resolveChange, CLI resolve e normalizacao de ID implementados; ambiguidade E_TASK_AMBIGUOUS com candidatas; E_TASK_NOT_FOUND e E_TASK_ARCHIVED cobertos; 60 testes do helper de fluxo aprovados; lint, typecheck, test e build aprovados; change 001 intacta.
- **Início:** 2026-11-13
- **Depende de:** TASK-002
- **Objetivo:** localizar uma tarefa explícita e a mudança à qual pertence.
- **Arquivos:**
  - `scripts/rawspec.mjs`
  - `scripts/rawspec.test.mjs`
- **Entregáveis:**
  - `resolveTask(taskId, { repoRoot, changeId })`.
  - `listActiveChanges(repoRoot)`.
  - Busca em `specs/changes/*/tasks.md`, excluindo `archive/`.
  - Retorno de candidatas em ambiguidade, sem escolher automaticamente.
  - Comando CLI `resolve TASK-ID [--change CHANGE-ID] [--json]`.
- **Regras:**
  - `--change` restringe a busca.
  - Tarefa em mudança arquivada retorna `E_TASK_ARCHIVED`.
  - Tarefa inexistente retorna `E_TASK_NOT_FOUND`.
  - Ambiguidade retorna `E_TASK_AMBIGUOUS` com mudança, título, status, arquivo e linha.
  - Nenhum caminho pode escapar de `specs/changes/`.
- **Testes:**
  - Resolução única.
  - Resolução com `--change`.
  - Ambiguidade entre duas mudanças.
  - Tarefa inexistente.
  - Tarefa apenas arquivada.
  - Normalização de ID.
  - Caminho fora de `specs/changes/`.
- **Aceitação:** `resolve TASK-003` identifica a change 001 sem escrever nela; os casos de erro retornam os códigos previstos.
- **Checklist de clareza:**
  - Objetivo único e verificável — ATENDE
  - Arquivos afetados — ATENDE
  - Entregáveis concretos — ATENDE
  - Contrato de entrada, saída e erros — ATENDE (entrada: `TASK-ID` e `--change`; saída: tarefa e mudança resolvidas; erros: `E_TASK_NOT_FOUND`, `E_TASK_AMBIGUOUS`, `E_TASK_ARCHIVED`, `E_PATH_ESCAPE`)
  - Testes obrigatórios — ATENDE
  - Critério de aceitação objetivo — ATENDE
  - Dependências declaradas explicitamente — ATENDE
  - Ausência de decisões pendentes para o implementador — ATENDE

### TASK-004 — Implementar seleção da próxima tarefa e tarefas abertas
- **Status:** COMPLETED
- **Verificação:** VERIFIED (2026-11-13) — listOpenTasks, listPendingChanges e selectNextTask implementados com CLI next, open e pending-changes; next nao pula tarefa bloqueada e retorna E_DEPENDENCY_PENDING; E_NOTHING_TO_START e E_CHANGE_NOT_APPROVED cobertos; 60 testes do helper de fluxo aprovados; lint, typecheck, test e build aprovados.
- **Início:** 2026-11-13
- **Depende de:** TASK-003
- **Objetivo:** fornecer os dados para `/startspec` sem argumento e `/continuespec` sem argumento.
- **Arquivos:**
  - `scripts/rawspec.mjs`
  - `scripts/rawspec.test.mjs`
- **Entregáveis:**
  - `listOpenTasks(repoRoot)` retornando tarefas `IN PROGRESS` e `VERIFYING`.
  - `listPendingChanges(repoRoot)` retornando mudanças não arquivadas com tarefas `PENDING`, incluindo o status de aprovação.
  - `selectNextTask(repoRoot, { changeId })` retornando a primeira `PENDING` da mudança escolhida.
  - Comandos CLI `next [--change CHANGE-ID] [--json]` e `open [--change CHANGE-ID] [--json]`.
- **Regras:**
  - Tarefa aberta é `IN PROGRESS` ou `VERIFYING`.
  - `next` não pula tarefas bloqueadas.
  - Se a primeira `PENDING` tiver dependência pendente, retornar `E_DEPENDENCY_PENDING`.
  - Se não houver `PENDING`, retornar `E_NOTHING_TO_START`.
  - Se houver tarefas pendentes apenas em mudanças não aprovadas, retornar `E_CHANGE_NOT_APPROVED`.
  - Se houver mais de uma mudança aprovada com `PENDING`, retornar candidatas para o comando perguntar.
  - Nenhuma escrita nesta tarefa.
- **Testes:**
  - `next` retorna a primeira `PENDING`.
  - `next` retorna múltiplas mudanças candidatas.
  - `next` sem tarefas pendentes.
  - `next` com primeira tarefa bloqueada.
  - `next` com pendências apenas em mudança não aprovada.
  - `open` retorna uma tarefa aberta.
  - `open` retorna múltiplas tarefas abertas.
  - `open` sem tarefas abertas.
- **Aceitação:** `next` e `open` retornam os dados corretos para as perguntas de `/startspec` e `/continuespec`, sem escrever arquivos.
- **Checklist de clareza:**
  - Objetivo único e verificável — ATENDE
  - Arquivos afetados — ATENDE
  - Entregáveis concretos — ATENDE
  - Contrato de entrada, saída e erros — ATENDE (entrada: repositório e `--change` opcional; saída: lista de tarefas abertas e próxima tarefa candidata; erros: `E_NOTHING_TO_START`, `E_CHANGE_NOT_APPROVED`, `E_DEPENDENCY_PENDING`)
  - Testes obrigatórios — ATENDE
  - Critério de aceitação objetivo — ATENDE
  - Dependências declaradas explicitamente — ATENDE
  - Ausência de decisões pendentes para o implementador — ATENDE

## Fase 3 — Gates e execução

### TASK-005 — Implementar gates de aprovação e dependências
- **Status:** COMPLETED
- **Verificação:** VERIFIED (2026-11-13) — validateChangeApproval, buildDependencyGraph, validateDependencies e allowlist isLegacySequentialChange implementados; E_CHANGE_NOT_APPROVED, E_DEPENDENCY_UNDECLARED, E_DEPENDENCY_UNKNOWN, E_DEPENDENCY_CYCLE e E_DEPENDENCY_PENDING cobertos; originem legacy-sequential exibida; 60 testes do helper de fluxo aprovados; lint, typecheck, test e build aprovados.
- **Início:** 2026-11-13
- **Depende de:** TASK-003
- **Objetivo:** impedir execução de tarefa em mudança não aprovada ou com dependência pendente.
- **Arquivos:**
  - `scripts/rawspec.mjs`
  - `scripts/rawspec.test.mjs`
- **Entregáveis:**
  - `validateChangeApproval(change)`.
  - `buildDependencyGraph(tasks)`.
  - `validateDependencies(task, tasks)`.
  - Classificação de `dependencySource` como `explicit`, `legacy-sequential` ou `none`.
  - `isLegacySequentialChange(changeRef)` com allowlist documentada contendo apenas `001-portfolio-mvp`.
  - Detecção de dependência inexistente, autodependência, ciclo e dependência não declarada.
- **Regras:**
  - `proposal.md`, `tasks.md` e, quando existir, `design.md` devem estar `APPROVED`.
  - Mudanças novas exigem `Depende de` em todas as tarefas; qualquer omissão retorna `E_DEPENDENCY_UNDECLARED`.
  - O modo legado sequencial é aplicado somente à change 001, por allowlist explícita; nenhuma outra mudança entra em modo legado por omitir o campo.
  - Na change 001, a dependência é a tarefa anterior na ordem do arquivo.
  - A primeira tarefa do modo legado não tem dependência padrão.
  - `Depende de: nenhuma` ou `—` significa sem dependência e conta como declaração explícita.
  - Dependências precisam estar `COMPLETED` + `VERIFIED`.
  - `resolve`, `next` e `start` exibem a lista de dependências e sua origem antes de executar.
  - Erros retornam lista completa de pendências.
- **Testes:**
  - Mudança aprovada.
  - `proposal` não aprovado.
  - `design` existente e não aprovado.
  - `tasks` não aprovado.
  - Dependências explícitas completas.
  - Omissão de `Depende de` em mudança nova retorna `E_DEPENDENCY_UNDECLARED`.
  - Mudança nova sem nenhum `Depende de` também retorna `E_DEPENDENCY_UNDECLARED`, sem modo legado.
  - Modo legado sequencial aplicado somente à change 001.
  - Origem `legacy-sequential` exibida ao usuário.
  - Dependência inexistente.
  - Autodependência.
  - Ciclo.
  - Dependência não concluída.
- **Aceitação:** tarefa de mudança não aprovada, com dependência não declarada ou com dependência pendente é recusada com mensagem, origem da dependência e lista de pendências.
- **Checklist de clareza:**
  - Objetivo único e verificável — ATENDE
  - Arquivos afetados — ATENDE
  - Entregáveis concretos — ATENDE
  - Contrato de entrada, saída e erros — ATENDE (entrada: mudança e tarefa; saída: aprovação validada e dependências com origem; erros: `E_CHANGE_NOT_APPROVED`, `E_DEPENDENCY_UNDECLARED`, `E_DEPENDENCY_UNKNOWN`, `E_DEPENDENCY_CYCLE`, `E_DEPENDENCY_PENDING`)
  - Testes obrigatórios — ATENDE
  - Critério de aceitação objetivo — ATENDE
  - Dependências declaradas explicitamente — ATENDE
  - Ausência de decisões pendentes para o implementador — ATENDE

### TASK-006 — Implementar transições de estado da tarefa
- **Status:** COMPLETED
- **Verificação:** VERIFIED (2026-11-13) — startTask, beginVerification, verifyTask e failTask implementados com escrita atomica e preservacao de EOL e do conteudo restante; E_TASK_STATE e E_EVIDENCE_REQUIRED cobertos; fail registra FAILED e mantem a tarefa aberta; 60 testes do helper de fluxo aprovados; lint, typecheck, test e build aprovados.
- **Início:** 2026-11-13
- **Depende de:** TASK-005
- **Objetivo:** permitir iniciar, continuar, verificar e registrar falha de uma tarefa.
- **Arquivos:**
  - `scripts/rawspec.mjs`
  - `scripts/rawspec.test.mjs`
- **Entregáveis:**
  - `startTask(taskRef)` de `PENDING` para `IN PROGRESS`, com `Início`.
  - `beginVerification(taskRef)` de `IN PROGRESS` para `VERIFYING`.
  - `verifyTask(taskRef, evidence)` de `VERIFYING` para `COMPLETED` + `VERIFIED`.
  - `failTask(taskRef, evidence)` registrando `Verificação: FAILED` e mudando o status para `IN PROGRESS`.
  - Escrita atômica com preservação de EOL e conteúdo restante.
- **Regras:**
  - `verify` exige evidência não vazia.
  - Transições inválidas retornam `E_TASK_STATE`.
  - `verify` grava `VERIFIED (YYYY-MM-DD) — evidência`.
  - `fail` não marca a tarefa como concluída.
  - Aprovação da mudança nunca é alterada.
  - Em erro de escrita, restaurar o conteúdo original.
- **Testes:**
  - `PENDING` → `IN PROGRESS`.
  - `IN PROGRESS` → `VERIFYING`.
  - `VERIFYING` → `COMPLETED` + `VERIFIED`.
  - `verify` sem evidência.
  - `fail` registra `FAILED` e volta para `IN PROGRESS`.
  - Transição inválida.
  - Preservação de CRLF e LF.
  - Restauração após erro simulado.
- **Aceitação:** o ciclo completo funciona; transições inválidas e evidência ausente são recusadas.
- **Checklist de clareza:**
  - Objetivo único e verificável — ATENDE
  - Arquivos afetados — ATENDE
  - Entregáveis concretos — ATENDE
  - Contrato de entrada, saída e erros — ATENDE (entrada: referência da tarefa e evidência; saída: arquivo de tarefa atualizado com status, início e verificação; erros: `E_TASK_STATE`, `E_EVIDENCE_REQUIRED`)
  - Testes obrigatórios — ATENDE
  - Critério de aceitação objetivo — ATENDE
  - Dependências declaradas explicitamente — ATENDE
  - Ausência de decisões pendentes para o implementador — ATENDE

### TASK-007 — Implementar mensagem de commit e planos de ação
- **Status:** COMPLETED
- **Verificação:** VERIFIED (2026-11-13) — buildCommitMessage, createActionPlan, checkActionPlans e resolveActionPlan implementados com CLI commit-message, action-plan, check-action-plans e resolve-action-plan; E_COMMIT_MESSAGE_BLOCKED e E_ACTION_PLAN_UNRESOLVED cobertos; planos bloqueiam a conclusao ate RESOLVED; 60 testes do helper de fluxo aprovados; lint, typecheck, test e build aprovados.
- **Início:** 2026-11-13
- **Depende de:** TASK-006
- **Objetivo:** fechar cada tarefa com mensagem de commit e tratar riscos com plano de ação para aceite.
- **Arquivos:**
  - `scripts/rawspec.mjs`
  - `scripts/rawspec.test.mjs`
- **Entregáveis:**
  - `buildCommitMessage(taskRef)` com tipo, escopo, resumo, mudança, tarefa, testes, evidência e plano de ação.
  - `createActionPlan(taskRef, payload)` criando o arquivo em `action-plans/` com `PENDING ACCEPTANCE`.
  - `checkActionPlans(changeRef)` listando planos não resolvidos.
  - `resolveActionPlan(path, evidence)` marcando `RESOLVED`.
  - Comandos CLI `commit-message`, `action-plan`, `check-action-plans` e `resolve-action-plan`.
- **Regras:**
  - Mensagem de commit só é gerada para tarefa `COMPLETED` + `VERIFIED` e sem plano não resolvido.
  - Formato: `<type>(<scope>): <summary>` + corpo com `Change`, `Task`, `Tests`, `Evidence`, `Action-Plan`.
  - `type` limitado a `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `build`.
  - Nenhum `git commit` ou `git push` é executado.
  - Plano de ação usa template definido no design.
  - `PENDING ACCEPTANCE`, `ACCEPTED`, `IN EXECUTION` e `REJECTED` bloqueiam a conclusão da tarefa.
  - `RESOLVED` libera a mensagem de commit.
  - `ACCEPTED` e `REJECTED` só podem ser registrados após resposta explícita do usuário.
  - Caminho do plano deve ficar dentro de `specs/changes/NNN-slug/action-plans/`.
  - Plano de ação é reservado a problema técnico, risco real, conflito de requisito, segurança, integridade ou condição que possa comprometer o projeto.
  - Cancelamento, recusa de escolha, ambiguidade pendente ou interrupção normal não criam plano; apenas interrompem o comando.
- **Testes:**
  - Mensagem gerada para tarefa concluída.
  - Mensagem recusada para tarefa incompleta.
  - Mensagem inclui `Action-Plan: none`.
  - Mensagem inclui caminho de plano resolvido.
  - Criação de plano com status e caminho corretos.
  - Plano `PENDING ACCEPTANCE` bloqueia conclusão.
  - Plano `REJECTED` mantém tarefa aberta.
  - Plano `RESOLVED` libera mensagem.
  - Caminho fora de `action-plans/` recusado.
  - Cancelamento do usuário não cria plano de ação.
- **Aceitação:** toda tarefa concluída produz mensagem de commit; todo risco gera plano de ação com aceite humano e bloqueio até resolução.
- **Checklist de clareza:**
  - Objetivo único e verificável — ATENDE
  - Arquivos afetados — ATENDE
  - Entregáveis concretos — ATENDE
  - Contrato de entrada, saída e erros — ATENDE (entrada: referência da tarefa e payload do plano; saída: mensagem de commit e arquivo de plano em `action-plans/`; erros: `E_COMMIT_MESSAGE_BLOCKED`, `E_ACTION_PLAN_UNRESOLVED`, `E_ACTION_PLAN_REJECTED`, `E_PATH_ESCAPE`)
  - Testes obrigatórios — ATENDE
  - Critério de aceitação objetivo — ATENDE
  - Dependências declaradas explicitamente — ATENDE
  - Ausência de decisões pendentes para o implementador — ATENDE

## Fase 4 — Arquivamento, comandos e validação

### TASK-008 — Implementar validação e arquivamento por mudança
- **Status:** COMPLETED
- **Verificação:** VERIFIED (2026-11-13) — checkArchive, assertConfinedPath, buildArchiveManifest, inspectGitState, writeArchiveState, readArchiveState, archiveChange, writeProposalArchiveMarkers, stageArchive e recoverArchive implementados com CLI check-archive e archive; rename atomico com archive-state.json write-ahead antes do rename; recuperacao idempotente com proposal.md antes de archive-state.json; E_ARCHIVE_PENDING_TASKS, E_ACTION_PLAN_PENDING, E_GIT_DIRTY, E_ARCHIVE_DESTINATION_EXISTS, E_ARCHIVE_STATE_UNKNOWN e E_ARCHIVE_TASK_SCOPE cobertos; 60 testes do helper de fluxo aprovados; lint, typecheck, test e build aprovados.
- **Início:** 2026-11-13
- **Depende de:** TASK-006, TASK-007
- **Objetivo:** arquivar somente a mudança inteira, com tarefas e planos concluídos.
- **Arquivos:**
  - `scripts/rawspec.mjs`
  - `scripts/rawspec.test.mjs`
- **Entregáveis:**
  - `checkArchive(changeRef)` com lista de tarefas, planos pendentes, estado de staging e arquivamento já movido.
  - `validateArchivePreconditions(changeRef)` executado por completo antes de qualquer movimentação e de qualquer operação de Git.
  - `assertConfinedPath(path, expectedRoot)` para validar origem e destino com caminho real.
  - `buildArchiveManifest(changeRef)` com a lista exata de arquivos da mudança.
  - `inspectGitState(manifest)` usando `git status --porcelain` restrito aos caminhos do manifesto e ao destino.
  - `writeArchiveState(changeDir, state)` gravando `archive-state.json` de forma atômica com `state: ARCHIVING` ou `ARCHIVED`.
  - `readArchiveState(changeDir)` retornando o estado persistido ou `null`.
  - `archiveChange(changeRef)` movendo o diretório com um único rename atômico para `specs/changes/archive/NNN-slug`.
  - `writeProposalArchiveMarkers(changeDir, staging)` finalizando o `proposal.md` com `Status: ARCHIVED`, `- Arquivada em: YYYY-MM-DD` e `- Staging Git: PENDING|FAILED|DONE|SKIPPED`.
  - `finalizeArchivedChange(changeDir)` completando o `proposal.md` primeiro e atualizando o `archive-state.json` para `state: ARCHIVED` depois.
  - `stageArchive(manifest)` executando `git add` em um caminho exato por vez, sem diretório nem glob.
  - `stageArchiveProposal(changeDir)` re-stagiando o caminho exato do `proposal.md` arquivado após a escrita do marcador final.
  - `verifyStagedState(manifest)` conferindo no índice Git se o `proposal.md` final e todos os caminhos do manifesto estão staged.
  - `recoverArchive(changeRef)` que identifica movimentação já concluída ou interrompida e retoma somente finalização e staging.
  - Comandos CLI `check-archive` e `archive`.
- **Regras:**
  - Concluir todas as validações e a inspeção de Git antes de qualquer movimentação; se qualquer validação falhar, nenhum arquivo é movido e nenhum `git add` é executado.
  - Validar aprovação, ao menos uma tarefa, todas as tarefas `COMPLETED` + `VERIFIED`, todos os planos `RESOLVED`, destino inexistente e confinamento de caminhos.
  - Resolver origem e destino com caminho real e exigir que a origem esteja dentro de `specs/changes/NNN-slug` e o destino seja exatamente `specs/changes/archive/NNN-slug`.
  - Recusar `..`, caminhos absolutos, links simbólicos que escapem da mudança e qualquer caminho fora de `specs/changes/`.
  - Recusar `TASK-ID`.
  - Não fazer commit, push, rebase ou reset.
  - Se houver alteração staged ou unstaged em arquivo rastreado do manifesto, parar antes de mover e pedir decisão explícita; sem decisão, não mover nem fazer staging.
  - Apresentar a lista exata de arquivos do manifesto e pedir autorização antes do staging; recusa arquiva com `Staging Git: SKIPPED`.
  - Gravar `archive-state.json` com `state: ARCHIVING` antes do rename; é a marcação write-ahead do movimento.
  - Incluir o `archive-state.json` no manifesto antes do staging, porque ele passa a fazer parte da mudança.
  - Mover o diretório com uma única operação atômica de rename no mesmo volume; não mover arquivo por arquivo e não usar `git mv`.
  - Se o rename falhar, abortar sem movimentação parcial, remover o `archive-state.json` gravado e informar `E_ARCHIVE_MOVE_FAILED`.
  - Após o rename, finalizar o `proposal.md` do destino com `Status: ARCHIVED`, `- Arquivada em:` e `Staging Git: PENDING`; o `archive-state.json` permanece em `ARCHIVING` neste ponto.
  - Atualizar o `archive-state.json` para `state: ARCHIVED` somente depois da finalização do `proposal.md`.
  - Executar `git add` somente após a movimentação concluída, apenas nos caminhos exatos do manifesto, um por vez, incluindo a remoção dos caminhos de origem rastreados.
  - Não usar `git add -A` em diretório, glob ou caminho fora do manifesto.
  - Após o staging concluir, escrever `Staging Git: DONE` e re-stagiar o caminho exato do `proposal.md` arquivado, para que a versão final também fique staged.
  - Verificar a convergência contra o índice Git antes de reportar sucesso; se o `proposal.md` final não estiver staged, registrar `Staging Git: FAILED` e informar `E_GIT_ADD_FAILED`.
  - Se o staging falhar, registrar `Staging Git: FAILED`, manter a mudança movida e informar `E_GIT_ADD_FAILED`; não reverter nem mover novamente.
  - Se a origem não existe e o destino existe com `archive-state.json` em `ARCHIVING`, o rename ocorreu, independentemente de o `proposal.md` já estar ou não finalizado: completar de forma idempotente os dois marcadores, `proposal.md` primeiro e `archive-state.json` depois, e só então seguir para o staging, sem mover de novo.
  - A recuperação preserva a data de arquivamento já existente no `proposal.md` e não rebaixa um marcador `Staging Git` já `DONE` ou `SKIPPED`.
  - Se a origem existe e o destino não existe com `archive-state.json` em `ARCHIVING`, o rename não ocorreu: remover o arquivo de estado, revalidar e arquivar de novo.
  - Se origem não existe e destino existe com `Status: ARCHIVED`, não mover novamente; concluir staging `PENDING` ou `FAILED` e reportar `DONE`/`SKIPPED` como concluído.
  - Se destino existe sem `archive-state.json` e sem `Status: ARCHIVED`, ou com `archive-state.json` ilegível, retornar `E_ARCHIVE_STATE_UNKNOWN` e não apagar, mover ou resetar.
  - A recuperação é idempotente: reexecutar repete apenas escritas de marcador e staging de caminhos exatos.
- **Testes:**
  - Arquivamento bloqueado por `PENDING`.
  - Arquivamento bloqueado por `COMPLETED` sem `VERIFIED`.
  - Arquivamento bloqueado por `FAILED`.
  - Arquivamento bloqueado por plano `PENDING ACCEPTANCE`.
  - Arquivamento bloqueado por plano `REJECTED`.
  - Arquivamento permitido com todos os planos `RESOLVED`.
  - Falha de validação não move nenhum arquivo.
  - Caminho com `..` é recusado antes da movimentação.
  - Caminho absoluto é recusado antes da movimentação.
  - Link simbólico que escapa da mudança é recusado.
  - Destino existente é recusado antes da movimentação.
  - Arquivamento bem-sucedido move o diretório com rename atômico.
  - Conteúdo, `action-plans/` e evidências preservados.
  - `git add` executado apenas nos caminhos exatos do manifesto em repositório temporário.
  - `git add` não é executado quando a validação falha.
  - Falha simulada de rename atômico não move arquivos, não executa `git add` e remove o `archive-state.json`.
  - Alteração rastreada preexistente bloqueia o arquivamento antes de mover.
  - Arquivos não rastreados só são staged após confirmação da lista exata.
  - Recusa de staging arquiva com `Staging Git: SKIPPED`.
  - Falha simulada de `git add` marca `Staging Git: FAILED` e não move novamente.
  - Retomada com staging `PENDING` ou `FAILED` executa apenas o staging.
  - Arquivamento já movido com staging `DONE` é reportado como concluído.
  - Destino sem marcador retorna `E_ARCHIVE_STATE_UNKNOWN` sem mover nem apagar.
  - `TASK-ID` recusado.
  - `archive-state.json` é gravado com `state: ARCHIVING` antes do rename e atualizado para `state: ARCHIVED` somente depois da finalização do `proposal.md`.
  - Interrupção simulada imediatamente antes do rename deixa a origem com `ARCHIVING`; a recuperação remove o arquivo de estado, revalida e permite arquivar de novo.
  - Interrupção simulada imediatamente depois do rename e antes de finalizar o `proposal.md` deixa o destino com `archive-state.json` em `ARCHIVING` e `proposal.md` sem `Status: ARCHIVED`; a recuperação completa os dois marcadores sem mover de novo.
  - Interrupção simulada depois de finalizar o `proposal.md` e antes de atualizar o `archive-state.json` deixa o destino com `proposal.md` em `Status: ARCHIVED` e `archive-state.json` em `ARCHIVING`; a recuperação trata o caso como interrompido, independentemente do `proposal.md` já atualizado, e completa os dois marcadores sem mover de novo.
  - Interrupção simulada depois de atualizar o `archive-state.json` e antes do staging deixa `archive-state.json` em `ARCHIVED` e `Staging Git: PENDING`; a recuperação executa apenas o staging.
  - Interrupção simulada no meio do staging deixa `Staging Git: FAILED`; a recuperação retoma apenas o staging dos caminhos exatos.
  - A recuperação com `ARCHIVING` e origem ausente nunca repete o rename, mesmo com o `proposal.md` já finalizado.
  - A recuperação com `ARCHIVING` e origem ausente preserva a data de arquivamento já existente no `proposal.md`.
  - A recuperação com `ARCHIVING` e origem ausente não rebaixa um marcador `Staging Git` já `DONE` ou `SKIPPED`.
  - `archive-state.json` nunca passa a `ARCHIVED` antes de o `proposal.md` estar finalizado.
  - O `proposal.md` arquivado com `Status: ARCHIVED` e `Staging Git: DONE` aparece staged, confirmado por `git show :caminho`.
  - O `proposal.md` arquivado não fica pendente como alteração unstaged depois do arquivamento.
  - Convergência: quando o índice não contém `Staging Git: DONE`, o caminho exato do `proposal.md` é re-stagiado.
  - Duas execuções seguidas de recuperação não movem a mudança duas vezes e não duplicam staging.
- **Aceitação:** mudança incompleta, com plano não resolvido, com alteração preexistente não decidida ou com caminho inseguro não é arquivada e não sofre movimentação; mudança completa é validada por inteiro, movida atomicamente, marcada de forma recuperável, staged apenas nos caminhos exatos confirmados, com o `proposal.md` final contido no staging, e uma repetição não move novamente, sem commit/push.
- **Checklist de clareza:**
  - Objetivo único e verificável — ATENDE
  - Arquivos afetados — ATENDE
  - Entregáveis concretos — ATENDE
  - Contrato de entrada, saída e erros — ATENDE (entrada: referência da mudança; saída: mudança arquivada em `specs/changes/archive/NNN-slug` com marcadores e caminhos staged; erros: `E_ARCHIVE_TASK_SCOPE`, `E_ARCHIVE_PENDING_TASKS`, `E_ARCHIVE_DESTINATION_EXISTS`, `E_ARCHIVE_MOVE_FAILED`, `E_ARCHIVE_STATE_UNKNOWN`, `E_GIT_DIRTY`, `E_GIT_ADD_FAILED`, `E_PATH_ESCAPE`)
  - Testes obrigatórios — ATENDE
  - Critério de aceitação objetivo — ATENDE
  - Dependências declaradas explicitamente — ATENDE
  - Ausência de decisões pendentes para o implementador — ATENDE

### TASK-009 — Criar os três comandos OpenCode
- **Status:** COMPLETED
- **Verificação:** VERIFIED (2026-11-13) — Comandos startspec.md, continuespec.md e arquivespec.md criados em .opencode/commands/ com frontmatter description e argument-hint; instrucoes de pergunta em ambiguidade e concorrencia, plano de acao com aceite humano, mensagem de commit ao final, origem das dependencias, validacao completa do arquivamento e recuperacao idempotente do archive-state.json; helper compartilhado usado sem reimplementar parsing; 60 testes do helper de fluxo aprovados; lint, typecheck, test e build aprovados.
- **Início:** 2026-11-13
- **Depende de:** TASK-004, TASK-006, TASK-007, TASK-008
- **Objetivo:** expor o fluxo por meio de exatamente três comandos.
- **Arquivos:**
  - `.opencode/commands/startspec.md`
  - `.opencode/commands/continuespec.md`
  - `.opencode/commands/arquivespec.md`
- **Entregáveis:**
  - Frontmatter com `description` e `argument-hint`.
  - `/startspec [TASK-ID] [--change CHANGE-ID]`.
  - `/continuespec [TASK-ID] [--change CHANGE-ID]`.
  - `/arquivespec [CHANGE-ID]`.
  - Instruções explícitas para perguntar ao usuário em ambiguidade e concorrência.
  - Instruções para criar plano de ação e pedir aceite quando houver risco.
  - Instruções para gerar a mensagem de commit ao final da tarefa.
  - Instruções para exibir a origem das dependências, incluindo o modo legado sequencial.
  - Instruções para validar todo o arquivamento, inspecionar o estado Git e pedir decisão antes de mover.
  - Instruções para pedir autorização da lista exata de arquivos antes do staging e para retomar apenas staging `PENDING` ou `FAILED`.
  - Instruções para reconhecer um arquivamento interrompido pelo `archive-state.json` e concluí-lo sem mover a mudança de novo, completando `proposal.md` e `archive-state.json` de forma idempotente.
  - Instruções para só reportar sucesso quando a versão final do `proposal.md` arquivado estiver staged.
  - Chamadas ao helper compartilhado, sem reimplementar parsing.
- **Regras:**
  - `/startspec` sem argumento inicia a próxima tarefa pendente.
  - Se houver tarefa aberta, perguntar antes de iniciar outra; recusa interrompe e orienta `/continuespec`.
  - Ambiguidade de `TASK` ou mudança sempre pergunta ao usuário.
  - `/continuespec` sem argumento continua a única tarefa aberta; com várias, pergunta.
  - `/arquivespec` recusa `TASK-ID` e exige planos resolvidos.
  - `/arquivespec` não move novamente uma mudança já arquivada; finalize marcadores e retoma apenas o staging pendente.
  - Nenhum comando altera status de aprovação.
  - Nenhum comando adicional é criado.
  - Nenhum comando faz commit ou push; `git add` é permitido somente no arquivamento e apenas em caminhos exatos do manifesto.
  - Ao final de cada tarefa, o comando apresenta a mensagem de commit.
  - Risco real detectado interrompe a tarefa até aceite do plano; cancelamento ou ambiguidade pendente apenas interrompe.
- **Testes:**
  - Validação manual dos argumentos e mensagens.
  - Teste do parser de argumentos do helper para `TASK-ID`, `--change`, ausência e argumento inválido.
  - Smoke test com a change 001 em modo somente leitura.
  - Verificação de que cada comando referencia o template de plano de ação e o formato de commit.
- **Aceitação:** os três comandos existem, perguntam nos casos exigidos, tratam riscos com plano de ação e entregam a mensagem de commit ao final da tarefa.
- **Checklist de clareza:**
  - Objetivo único e verificável — ATENDE
  - Arquivos afetados — ATENDE
  - Entregáveis concretos — ATENDE
  - Contrato de entrada, saída e erros — ATENDE (entrada: argumentos `TASK-ID`, `--change` e `CHANGE-ID`; saída: narrativa do comando, pergunta ao usuário e mensagem de commit; erros: os códigos do catálogo do design)
  - Testes obrigatórios — ATENDE
  - Critério de aceitação objetivo — ATENDE
  - Dependências declaradas explicitamente — ATENDE
  - Ausência de decisões pendentes para o implementador — ATENDE

### TASK-010 — Documentar argumentos, comportamento, erros e exemplos
- **Status:** COMPLETED
- **Verificação:** VERIFIED (2026-11-13) — docs/rawspec-commands.md complementado com argumentos, flags, comportamento dos tres comandos, perguntas de concorrencia e ambiguidade com exemplos, catalogo de erros e codigos de saida, modelo de status, dependencias explicitas e modo legado, estruturas malformadas, regra de aprovacao e evidencia, formato de mensagem de commit com exemplos, gatilhos e template de plano de acao com fluxo de aceite, politica de arquivamento com tabela de estados e recuperacao, archive-state.json e garantia de staging; 60 testes do helper de fluxo aprovados; lint, typecheck, test e build aprovados.
- **Início:** 2026-11-13
- **Depende de:** TASK-009
- **Objetivo:** complementar `docs/rawspec-commands.md` para que qualquer pessoa use e diagnostique os comandos sem ler o código.
- **Arquivos:** `docs/rawspec-commands.md` (complementação do arquivo criado na TASK-001, sem recriá-lo).
- **Entregáveis:**
  - Complementação da seção “Baseline” criada na TASK-001, sem duplicar conteúdo.
  - Argumentos e flags dos três comandos.
  - Comportamento de `/startspec` sem argumento.
  - Pergunta de concorrência com exemplo.
  - Pergunta de ambiguidade com exemplo.
  - Exemplos de sucesso.
  - Exemplos de erro.
  - Modelo de status da mudança e da tarefa.
  - Regras de dependência explícita.
  - Modo legado sequencial da change 001 e significado de `dependencySource`.
  - Estruturas malformadas rejeitadas com `E_PARSE`.
  - Regra de aprovação humana.
  - Regra de evidência.
  - Formato da mensagem de commit.
  - Exemplos de mensagem de commit.
  - Gatilhos de problema ou risco.
  - Template de plano de ação.
  - Fluxo de aceite, rejeição e resolução do plano.
  - Regra de bloqueio de arquivamento por plano não resolvido.
  - Política de arquivamento.
  - Validação completa antes de qualquer movimentação e confinamento de caminhos.
  - Inspeção do estado Git, decisão sobre alterações preexistentes e autorização da lista exata do manifesto.
  - Política de Git: `git add` permitido somente em caminhos exatos; commit e push proibidos.
  - Rename atômico, marcadores `Staging Git: PENDING|FAILED|DONE|SKIPPED` e recuperação idempotente.
  - `archive-state.json` como marcação write-ahead do movimento, com estados `ARCHIVING` e `ARCHIVED`.
  - A ordem de finalização dos marcadores, `proposal.md` antes de `archive-state.json`, e a ordem de recuperação em cada estado intermediário.
  - Garantia de que a versão final do `proposal.md` arquivado, com `Staging Git: DONE`, fica staged, verificada contra o índice Git.
  - Tabela de estados do arquivamento e o que fazer em cada um, incluindo a recuperação após interrupção.
  - Gatilhos reais de plano de ação e casos que apenas interrompem, como cancelamento.
  - Solução de ambiguidade com `--change`.
- **Regras:**
  - Complementar o arquivo criado na TASK-001; não recriar nem duplicar a seção “Baseline”.
  - Exemplos devem ser copiáveis e coerentes com o comportamento implementado.
  - Mensagens de erro devem corresponder ao catálogo do design.
  - Não documentar comandos inexistentes.
- **Testes:** conferência manual de cada exemplo contra os testes do helper.
- **Aceitação:** a documentação complementa o arquivo da TASK-001 e cobre todos os argumentos, comportamentos, erros, dependências explícitas e legadas, mensagens de commit, planos de ação e segurança do arquivamento, sem contradizer o design.
- **Checklist de clareza:**
  - Objetivo único e verificável — ATENDE
  - Arquivos afetados — ATENDE
  - Entregáveis concretos — ATENDE
  - Contrato de entrada, saída e erros — NÃO SE APLICA (tarefa documental: não expõe interface; a entrada é o comportamento implementado e testado do helper, e a saída é a seção complementar de `docs/rawspec-commands.md`)
  - Testes obrigatórios — ATENDE
  - Critério de aceitação objetivo — ATENDE
  - Dependências declaradas explicitamente — ATENDE
  - Ausência de decisões pendentes para o implementador — ATENDE

### TASK-011 — Validar ponta a ponta e confirmar integridade da change 001
- **Status:** COMPLETED
- **Verificação:** VERIFIED (2026-11-13) — pnpm lint, pnpm typecheck, pnpm test (99 testes) e pnpm build aprovados; resolve TASK-003 e resolve TASK-004 contra a change 001 em modo somente leitura com dependencySource legacy-sequential; next e open contra a change 001 confirmados; check-archive 001-portfolio-mvp lista as 9 tarefas pendentes; transicoes, mensagem de commit, plano de acao e arquivamento testados apenas em diretorios temporarios; falha de validacao de arquivamento nao move arquivos nem executa git add; proposal.md arquivado com Staging Git DONE aparece staged e nao como alteracao unstaged; recuperacao apos interrupcao antes e depois do rename conclui o arquivamento sem mover a mudanca de novo; git diff -- specs/changes/001-portfolio-mvp vazio; nenhum commit ou push criado; Prettier aprovado.
- **Início:** 2026-11-13
- **Depende de:** TASK-010
- **Objetivo:** provar que a implementação funciona e não alterou a change 001.
- **Arquivos:** nenhum arquivo de produção; validação e relatório.
- **Entregáveis:**
  - Execução de `pnpm lint`.
  - Execução de `pnpm typecheck`.
  - Execução de `pnpm test`.
  - Execução de `pnpm build`.
  - `resolve TASK-003` e `resolve TASK-004` contra a change 001 em modo somente leitura.
  - `next` e `open` contra a change 001 em modo somente leitura.
  - Confirmação de que a change 001 usa `dependencySource: legacy-sequential` e exibe a origem da dependência.
  - `check-archive 001-portfolio-mvp` com as pendências atuais.
  - Testes de transição, mensagem de commit, plano de ação e arquivamento somente em diretórios temporários.
  - Teste em diretório temporário confirmando que falha de validação de arquivamento não move arquivos nem executa `git add`.
  - Teste em diretório temporário confirmando que o `proposal.md` arquivado com `Staging Git: DONE` aparece staged e não como alteração unstaged.
  - Teste em diretório temporário simulando interrupção antes e depois do rename, confirmando que a recuperação conclui o arquivamento sem mover a mudança de novo.
  - Teste em diretório temporário simulando interrupção depois de finalizar o `proposal.md` e antes de atualizar o `archive-state.json`, confirmando que a recuperação conclui o arquivamento sem mover a mudança de novo.
  - Confirmação de `git diff -- specs/changes/001-portfolio-mvp` vazio.
  - Confirmação de que não houve commit nem push.
- **Regras:**
  - Não alterar a change 001.
  - Não usar `--no-verify`.
  - Não fazer commit nem push.
  - Não corrigir falhas escondendo testes.
  - Não gerar mensagem de commit para tarefa incompleta.
- **Testes:** os comandos de verificação acima.
- **Aceitação:** todas as verificações passam, a change 001 permanece intacta e nenhum commit/push foi criado.
- **Checklist de clareza:**
  - Objetivo único e verificável — ATENDE
  - Arquivos afetados — ATENDE
  - Entregáveis concretos — ATENDE
  - Contrato de entrada, saída e erros — NÃO SE APLICA (tarefa de validação: não expõe interface; as entradas são as verificações listadas e a saída é o relatório de validação)
  - Testes obrigatórios — ATENDE
  - Critério de aceitação objetivo — ATENDE
  - Dependências declaradas explicitamente — ATENDE
  - Ausência de decisões pendentes para o implementador — ATENDE

## Regras de execução

1. Executar tarefas respeitando as dependências declaradas; no modo legado da change 001, respeitar a ordem do arquivo.
2. Não iniciar a implementação enquanto `proposal.md`, `design.md` e este `tasks.md` não estiverem `APPROVED`.
3. Não alterar a change 001.
4. Não arquivar tarefa individualmente.
5. Não marcar tarefa como verificada sem evidência.
6. Não criar comandos além dos três previstos.
7. Não fazer commit nem push sem autorização explícita.
8. `git add` é permitido somente no arquivamento, apenas em caminhos exatos do manifesto e após inspeção do estado Git.
9. Ao final de cada tarefa, apresentar a mensagem de commit.
10. Problema ou risco real que possa comprometer o projeto exige plano de ação com aceite humano antes de continuar; cancelamento ou ambiguidade pendente apenas interrompe.
11. Atualizar o status das tarefas conforme o progresso.
12. Registrar decisões técnicas relevantes.
13. No arquivamento, concluir todas as validações e a inspeção de Git antes de mover, confinar origem e destino à mudança correta, usar rename atômico e não repetir movimentação já concluída.
14. Gravar `archive-state.json` antes do rename, para que uma interrupção entre o movimento e os marcadores seja recuperável; a ordem de finalização é `proposal.md` e depois `archive-state.json`.
15. Só reportar sucesso do arquivamento quando a versão final do `proposal.md`, com `Staging Git: DONE`, estiver staged.
16. Toda tarefa deste plano traz checklist dos oito critérios de clareza; item `NÃO SE APLICA` exige justificativa e item `NÃO ATENDE` bloqueia a aprovação.
17. Rejeitar estruturas de tarefa malformadas com `E_PARSE`; não tentar interpretar Markdown ambíguo.

## Fluxo de status

`PENDING → IN PROGRESS → VERIFYING → COMPLETED`

A tarefa só é considerada concluída quando tiver `Status: COMPLETED` e `Verificação: VERIFIED`, e não houver plano de ação não resolvido.

Se uma verificação falhar, corrigir antes de concluir a tarefa.
