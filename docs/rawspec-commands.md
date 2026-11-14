# Comandos RawSpec

Documentação de uso, diagnóstico e políticas dos três comandos RawSpec: `/startspec`, `/continuespec` e `/arquivespec`.

> **Estado atual:** os três comandos ainda **não existem**. Este documento é criado pela `TASK-001` da change `002-rawspec-task-commands` para registrar o baseline e congelar o contrato de comportamento. A seção “Baseline” será complementada pela `TASK-010` com argumentos, exemplos e catálogo de erros.

## Baseline

### Inventário do repositório

Verificado em `2026-11-13`, antes de qualquer implementação:

| Item | Situação observada |
|---|---|
| `.opencode/` | Não existe. |
| `.opencode/commands/` | Não existe. |
| `/startspec`, `/continuespec`, `/arquivespec` | Não existem; serão criados por esta change. |
| `scripts/rawspec.mjs` | Não existe; será criado por esta change. |
| `scripts/rawspec.test.mjs` | Não existe; será criado por esta change. |
| `docs/rawspec-commands.md` | Este arquivo; criado pela `TASK-001` e complementado pela `TASK-010`. |
| `specs/changes/001-portfolio-mvp/` | Existe, com `proposal.md`, `design.md` e `tasks.md`. Somente leitura. |
| `specs/changes/archive/` | Existe e está vazio. |
| `specs/changes/002-rawspec-task-commands/` | Existe, com `proposal.md`, `design.md` e `tasks.md`. |

Não há comando legado versionado a preservar: a criação de mudanças continua sendo feita pelo fluxo atual baseado em `specs/changes/NNN-slug/`.

### Contrato de comportamento congelado

Os comandos operam sobre `TASK-NNN` de mudanças RawSpec em Markdown, sob `specs/changes/`. O Markdown permanece a única fonte de verdade, e a aprovação continua sendo uma ação humana registrada nos documentos da mudança.

#### `/startspec [TASK-ID] [--change CHANGE-ID]`

Inicia a execução de uma tarefa.

- **Com `TASK-ID`:** localiza a tarefa, pergunta ao usuário em caso de ambiguidade, valida aprovação e dependências, exige `Status: PENDING`, muda para `IN PROGRESS` e registra a data em `Início`.
- **Sem argumento:** seleciona a próxima tarefa `PENDING` da mudança aprovada escolhida.
- **Com tarefa já aberta:** pergunta se deseja iniciar outra. Se o usuário recusar, o comando interrompe e orienta o uso de `/continuespec` para concluir a tarefa aberta.
- **Decisão confirmada:** `/startspec` sem argumento inicia a próxima tarefa pendente, e não cria mudança nova.

#### `/continuespec [TASK-ID] [--change CHANGE-ID]`

Retoma uma tarefa existente.

- Recupera o estado atual, revalida aprovação e dependências e continua a execução conforme o estado.
- **Sem argumento:** continua a única tarefa aberta; se houver mais de uma, pergunta ao usuário.
- Se a tarefa estiver `PENDING`, orienta o uso de `/startspec TASK-ID`.
- Se a tarefa já estiver `COMPLETED` e `VERIFIED`, informa que não há pendências e não reinicia.

#### `/arquivespec [CHANGE-ID]`

Arquiva a **mudança inteira**, nunca uma tarefa isolada.

- Exige todas as tarefas com `Status: COMPLETED` e `Verificação: VERIFIED`, e todos os planos de ação em `RESOLVED`.
- Recusa `TASK-ID` como argumento.
- Sem argumento, arquiva a única mudança elegível; havendo mais de uma, pergunta ao usuário.

### Decisões confirmadas

1. **Aprovação humana obrigatória.** `proposal.md`, `tasks.md` e, quando existir, `design.md` precisam estar `APPROVED`. Nenhum comando altera o status de aprovação.
2. **Ambiguidade é sempre levada ao usuário.** O comando apresenta as candidatas e a escolha é do usuário; nunca escolhe sozinho.
3. **Pergunta de concorrência.** Quando existe tarefa aberta e o usuário pede iniciar outra, o comando pergunta antes de prosseguir.
4. **Dependências explícitas.** Mudanças novas exigem `Depende de` em todas as tarefas; a ausência é erro (`E_DEPENDENCY_UNDECLARED`) e nunca vira dependência implícita.
5. **Modo legado sequencial.** A change `001-portfolio-mvp` não declara `Depende de` e não será alterada. Por decisão explícita, nela as tarefas são sequenciais. A origem da dependência é exibida ao usuário como `dependencySource: legacy-sequential`.
6. **Evidência obrigatória.** Só é possível registrar `Verificação: VERIFIED` com evidência das verificações executadas.
7. **Mensagem de commit ao final de cada tarefa.** A mensagem é uma saída do comando, em padrão Conventional Commits, com mudança, tarefa, testes, evidência e plano de ação. O commit continua sendo humano; o comando não executa `git commit` nem `git push`.
8. **Plano de ação apenas para risco real.** Problemas técnicos, riscos reais, conflitos de requisitos, segurança, integridade ou condições que possam comprometer o projeto exigem plano de ação, com aceite humano antes de continuar. Cancelamento do usuário, recusa de escolha, ambiguidade pendente de resposta e interrupção normal apenas interrompem o comando, sem criar plano.
9. **Planos de ação bloqueiam.** Uma tarefa não é concluída enquanto houver plano não resolvido, e o arquivamento é bloqueado enquanto houver plano de ação pendente, aceito, em execução ou rejeitado.
10. **Nenhuma alteração destrutiva.** Não apagar tarefas, mudanças ou histórico; não executar `rebase` nem reescrita de histórico.

### Política de Git

- `git add` é permitido **somente durante o arquivamento** e **apenas em caminhos exatos** do manifesto de arquivos da mudança, um caminho por vez.
- **Não** usar `git add -A`, não usar diretório e não usar glob.
- Antes de qualquer operação de Git, o estado `staged` e `unstaged` dos caminhos do manifesto é inspecionado. Se houver alteração rastreada preexistente, o comando para e pede decisão explícita: commitar, fazer stash, cancelar ou autorizar a inclusão.
- Arquivos não rastreados dentro da mudança fazem parte do manifesto, mas só são staged após confirmação explícita da lista de caminhos.
- `git commit` e `git push` são **proibidos** em qualquer comando.
- O histórico Git é preservado pela remoção e adição dos mesmos conteúdos; o commit humano permite que o Git detecte o rename.

### Política de arquivamento

- O arquivamento valida **por completo** — aprovação, tarefas, planos de ação, destino e confinamento de caminhos — antes de qualquer movimentação e antes de qualquer operação de Git. Se uma validação falhar, nada é movido e nenhum `git add` é executado.
- A mudança é movida com uma **única operação atômica de rename** no mesmo volume. Não mover arquivo por arquivo e não usar `git mv`.
- Antes do rename, o comando grava `archive-state.json` dentro da própria mudança com `state: ARCHIVING`, como marcação write-ahead do movimento. O arquivo viaja com a mudança durante o rename.
- Depois do rename, o `proposal.md` do destino é finalizado com `Status: ARCHIVED`, `- Arquivada em: YYYY-MM-DD` e `- Staging Git: PENDING`; **só então** o `archive-state.json` é atualizado para `state: ARCHIVED`.
- Ao concluir o staging, o marcador `Staging Git: DONE` é escrito e o caminho exato do `proposal.md` arquivado é re-stagiado, para que a versão final do documento também fique no staging. A convergência é verificada contra o índice Git antes de reportar sucesso.
- **Recuperação idempotente:** quando o destino já existe, o comando nunca renomeia de novo. Com `archive-state.json` em `ARCHIVING` e a origem ausente, a operação é tratada como interrompida, independentemente de o `proposal.md` já ter sido atualizado: a recuperação completa de forma idempotente os dois marcadores, `proposal.md` primeiro e `archive-state.json` depois, e só então segue para o staging.
- Um destino existente sem `archive-state.json` e sem `Status: ARCHIVED` é estado realmente desconhecido: o comando para com `E_ARCHIVE_STATE_UNKNOWN` e não apaga, move nem reseta nada.
- A origem e o destino são resolvidos com caminho real. São recusados `..`, caminhos absolutos, links simbólicos que escapem a mudança e qualquer caminho fora de `specs/changes/`.

### Decisões de implementação em aberto

Duas decisões de implementação continuam pendentes de confirmação explícita do usuário e foram registradas aqui para não se perderem:

1. **`archive-state.json` como parte do formato RawSpec.** A marcação write-ahead é gravada dentro da própria mudança, o que adiciona um artefato ao formato do diretório de mudança.
2. **`Staging Git` permanece no `proposal.md`.** O estado do movimento fica apenas no `archive-state.json`, evitando duplicar a mesma informação em dois lugares.

Ambas já estão refletidas no `design.md` da change `002-rawspec-task-commands` e podem ser revertidas sem alterar o escopo funcional.

### Testes previstos

Verificação manual de que `.opencode/commands/` não existe antes da implementação — **confirmado em `2026-11-13`**.

## Uso dos comandos

Os três comandos ficam em `.opencode/commands/`. Toda a leitura, validação e
escrita é feita pelo helper compartilhado `scripts/rawspec.mjs`; os comandos
apenas orquestram a narrativa, as perguntas ao usuário e as chamadas ao helper.

```bash
node scripts/rawspec.mjs <comando> [argumentos] [--json]
```

### Argumentos

| Comando | Argumento | Flag | Efeito |
|---|---|---|---|
| `/startspec` | `TASK-ID` opcional | `--change CHANGE-ID` | Restringe a busca a uma mudança. |
| `/continuespec` | `TASK-ID` opcional | `--change CHANGE-ID` | Restringe a busca a uma mudança. |
| `/arquivespec` | `CHANGE-ID` opcional | — | Arquiva a mudança inteira. |

Identificadores aceitos:

- Tarefa: `TASK-003`, `TASK-3`, `task-003`. São normalizados para `TASK-NNN`.
- Mudança: `001`, `001-portfolio-mvp`, `portfolio-mvp`. O prefixo numérico e o
  slug são comparados; mais de uma correspondência vira pergunta ao usuário.

### Catálogo de erros

| Código | Quando ocorre | Ação esperada |
|---|---|---|
| `E_ARGS` | Argumento malformado ou flag desconhecida. | Corrigir a invocação. |
| `E_TASK_NOT_FOUND` | Nenhuma tarefa ativa com o ID. | Conferir o ID ou a mudança. |
| `E_TASK_AMBIGUOUS` | Mesmo ID em mais de uma mudança. | Perguntar ao usuário qual usar. |
| `E_TASK_ARCHIVED` | Tarefa existe apenas em mudança arquivada. | Não reabrir; criar nova mudança se necessário. |
| `E_CHANGE_NOT_FOUND` | Nenhuma mudança com o identificador informado. | Conferir o identificador. |
| `E_CHANGE_NOT_APPROVED` | `proposal`, `design` ou `tasks` não aprovados. | Solicitar aprovação humana. |
| `E_DEPENDENCY_PENDING` | Dependência não concluída e verificada. | Executar as dependências primeiro. |
| `E_DEPENDENCY_CYCLE` | Ciclo no grafo. | Corrigir `Depende de`. |
| `E_DEPENDENCY_UNKNOWN` | Dependência inexistente. | Corrigir `Depende de`. |
| `E_DEPENDENCY_UNDECLARED` | Mudança nova tem tarefa sem `Depende de`. | Declarar `Depende de` ou `nenhuma` em todas as tarefas. |
| `E_TASK_STATE` | Transição inválida para o estado atual. | Usar o comando correto. |
| `E_EVIDENCE_REQUIRED` | Tentativa de `VERIFIED` sem evidência. | Executar e registrar as verificações. |
| `E_NOTHING_TO_START` | Nenhuma tarefa pendente. | Informar que não há trabalho a iniciar. |
| `E_NO_OPEN_TASK` | `/continuespec` sem tarefa aberta. | Usar `/startspec`. |
| `E_ARCHIVE_TASK_SCOPE` | `TASK-ID` passado para `/arquivespec`. | Arquivar a mudança inteira. |
| `E_ARCHIVE_PENDING_TASKS` | Existe tarefa não concluída/verificada. | Concluir as tarefas listadas. |
| `E_ARCHIVE_DESTINATION_EXISTS` | Destino já existe. | Resolver conflito manualmente. |
| `E_CHANGE_AMBIGUOUS` | Mais de uma mudança elegível. | Perguntar ao usuário qual usar. |
| `E_NO_ELIGIBLE_CHANGE` | Nenhuma mudança elegível. | Informar a mudança ou concluir tarefas. |
| `E_PARSE` | Estrutura RawSpec malformada conforme a lista fechada. | Corrigir a estrutura indicada. |
| `E_PATH_ESCAPE` | Caminho fora da mudança ou de `specs/changes/`. | Corrigir a invocação. |
| `E_GIT_DIRTY` | Caminhos do manifesto têm alterações rastreadas preexistentes. | Parar antes de mover e pedir decisão. |
| `E_ARCHIVE_MOVE_FAILED` | Rename atômico falhou. | Corrigir o motivo e repetir a validação. |
| `E_ARCHIVE_STATE_UNKNOWN` | Destino existe sem marcadores reconhecíveis. | Não mover, apagar ou resetar; corrigir manualmente. |
| `E_ACTION_PLAN_UNRESOLVED` | Tarefa tem plano de ação não resolvido. | Solicitar aceite e concluir o plano. |
| `E_ACTION_PLAN_PENDING` | Arquivamento com plano não resolvido. | Resolver o plano com aceite humano. |
| `E_ACTION_PLAN_REJECTED` | Usuário rejeitou o plano de ação. | Manter a tarefa aberta e reavaliar o risco. |
| `E_COMMIT_MESSAGE_BLOCKED` | Tentativa de gerar mensagem para tarefa incompleta. | Concluir a tarefa e resolver planos antes. |
| `E_GIT_ADD_FAILED` | `git add` falhou após a movimentação. | Marcar `Staging Git: FAILED`; retomar apenas o staging. |

Códigos de saída do helper:

| Código | Significado |
|---|---|
| `0` | Sucesso. |
| `2` | Argumentos inválidos. |
| `3` | Tarefa ou mudança não encontrada. |
| `4` | Ambiguidade. |
| `5` | Gate de aprovação, dependência ou estado não atendido. |
| `6` | Erro de parsing. |
| `7` | Erro de I/O ou de Git. |

Interrupção por escolha do usuário não é erro: o comando informa "Interrompido
pelo usuário" e não altera arquivos.

## Modelo de status

### Mudança

O status é lido no cabeçalho de cada documento, antes do primeiro título `##`.
Com ou sem negrito:

```markdown
- Status: APPROVED
```

Regra de aprovação:

```text
proposal.md = APPROVED
tasks.md    = APPROVED
design.md   = APPROVED, quando o arquivo existir
```

Nenhum comando altera esses campos. A aprovação continua sendo uma ação humana.

### Tarefa

```markdown
### TASK-003 — Configurar estilos globais

- **Status:** PENDING
- **Depende de:** TASK-002
- **Início:** 2026-11-12
- **Verificação:** VERIFIED (2026-11-12) — lint, typecheck, testes e build aprovados.
- **Plano de ação:** specs/changes/002-rawspec-task-commands/action-plans/TASK-003-2026-11-12-build-failure.md
```

| Estado | Significado |
|---|---|
| `PENDING` | Ainda não iniciada. |
| `IN PROGRESS` | Em execução. |
| `VERIFYING` | Implementação concluída; verificações em andamento. |
| `COMPLETED` | Implementação e verificação concluídas. |
| `FAILED` | Usado apenas em `Verificação`, quando uma checagem falhou. |

Invariante de conclusão:

```text
Tarefa concluída = Status: COMPLETED E Verificação: VERIFIED
```

Fluxo: `PENDING → IN PROGRESS → VERIFYING → COMPLETED`. A falha de
verificação devolve a tarefa para `IN PROGRESS` com `Verificação: FAILED`.

## Dependências

### Modo explícito

Mudanças novas exigem `Depende de` em **todas** as tarefas. A ausência é erro
`E_DEPENDENCY_UNDECLARED` e nunca vira dependência implícita.

```markdown
- **Depende de:** TASK-001, TASK-002
```

`Depende de: nenhuma` ou `Depende de: —` significa sem dependências e conta
como declaração explícita.

### Modo legado sequencial

A change 001 não declara `Depende de` e não será alterada. Por decisão
explícita, nela as tarefas são sequenciais: cada tarefa depende da anterior
na ordem do arquivo. A origem é exibida ao usuário como
`dependencySource: legacy-sequential`.

O modo legado é aplicado **apenas** à change 001, por allowlist explícita no
helper (`LEGACY_SEQUENTIAL_CHANGES`). Nenhuma mudança nova entra em modo
legado por omitir o campo.

### `dependencySource`

| Valor | Significado |
|---|---|
| `explicit` | Dependências declaradas no campo `Depende de`. |
| `legacy-sequential` | Dependência herdada da tarefa anterior, só na change 001. |
| `none` | Sem dependência, declarada explicitamente ou por ser a primeira tarefa. |
| `undeclared` | Campo ausente em mudança nova; o gate devolve `E_DEPENDENCY_UNDECLARED`. |

## Estruturas malformadas

O parser rejeita com `E_PARSE` a lista fechada:

- `tasks.md` ausente, ilegível ou não decodificável como UTF-8;
- arquivo sem nenhuma tarefa reconhecível;
- cabeçalho que aparenta ser tarefa mas não contém `TASK-NNN`;
- cabeçalho de tarefa sem `— Título` com título não vazio;
- `TASK-NNN` duplicado no mesmo arquivo;
- identificador em `Depende de` fora do padrão `TASK-\d+`;
- `Status` fora de `PENDING`, `IN PROGRESS`, `VERIFYING` ou `COMPLETED`;
- `Verificação` fora de `PENDING`, `VERIFIED` ou `FAILED`;
- bloco de código cercado não fechado;
- estrutura que impeça identificar os limites da tarefa.

O parser nunca adivinha identificador, título ou limite ausente. Markdown
comum fora das seções de tarefa é ignorado.

## Comportamento de `/startspec`

### Sem argumento

1. Lista as tarefas abertas (`IN PROGRESS` ou `VERIFYING`).
2. Se houver, **pergunta**: "Deseja iniciar outra tarefa enquanto estas estão em
   execução?"
   - Se a resposta for negativa, interrompe sem alterar estado e orienta
     `/continuespec TASK-ID`.
   - Se for afirmativa, continua.
3. Lista as mudanças não arquivadas com tarefas `PENDING`.
4. Se houver pendências apenas em mudanças não aprovadas, falha com
   `E_CHANGE_NOT_APPROVED`, listando cada mudança e o documento que falta.
5. Se houver mais de uma mudança aprovada com `PENDING`, **pergunta** qual usar.
6. Seleciona a primeira `PENDING` da mudança escolhida, sem pular tarefas
   bloqueadas.
7. Segue com os gates e inicia a tarefa.

### Com `TASK-ID`

1. Normaliza e resolve a tarefa.
2. Se houver ambiguidade, **pergunta** ao usuário.
3. Se houver tarefa aberta diferente da alvo, **pergunta** se deseja iniciar
   outra.
4. Valida aprovação e dependências, exibindo a origem de cada dependência.
5. Exige `Status: PENDING`.
6. Muda para `IN PROGRESS` e registra a data em `Início`.
7. Executa a tarefa e registra as evidências.

### Pergunta de concorrência

A pergunta existe mesmo com apenas uma tarefa aberta:

```text
Há uma tarefa em execução:

  TASK-007 — Implementar seção de habilidades (IN PROGRESS) [002-rawspec-task-commands]

Deseja iniciar outra tarefa enquanto estas estão em execução? (s/n)
```

Resposta negativa:

```text
Interrompido pelo usuário. Nenhum arquivo foi alterado.
Use /continuespec TASK-007 para concluir a tarefa aberta.
```

### Pergunta de ambiguidade

```text
TASK-003 existe em mais de uma mudança:

  1. 001-portfolio-mvp  — Configurar estilos globais (COMPLETED)
     specs/changes/001-portfolio-mvp/tasks.md:32
  2. 002-rawspec-task-commands — Implementar resolução de TASK para mudança (PENDING)
     specs/changes/002-rawspec-task-commands/tasks.md:129

Qual mudança usar? Use --change CHANGE-ID para escolher sem pergunta.
```

### Exemplos de sucesso

```text
$ /startspec TASK-003 --change 002-rawspec-task-commands

Tarefa: TASK-003 — Implementar resolução de TASK para mudança
Status: IN PROGRESS / PENDING
Mudança: 002-rawspec-task-commands
Depende de: TASK-002
Origem: explicit
```

```text
$ /startspec TASK-003 --change 001-portfolio-mvp

Tarefa: TASK-003 — Configurar estilos globais
Status: COMPLETED / VERIFIED
Mudança: 001-portfolio-mvp
Depende de: TASK-002
Origem: legacy-sequential
```

### Exemplos de erro

```text
$ /startspec TASK-999

Erro E_TASK_NOT_FOUND: Tarefa não encontrada: TASK-999
```

```text
$ /startspec TASK-003

Erro E_TASK_AMBIGUOUS: Tarefa TASK-003 existe em mais de uma mudança
```

```text
$ /startspec TASK-004 --change 002-rawspec-task-commands

Erro E_DEPENDENCY_PENDING: Dependências pendentes para TASK-004: TASK-003
```

## Comportamento de `/continuespec`

Sem argumento, continua a única tarefa aberta. Havendo mais de uma, pergunta
qual continuar. Não havendo nenhuma, falha com `E_NO_OPEN_TASK` e sugere
`/startspec`.

| Estado encontrado | Ação |
|---|---|
| `PENDING` | Orienta `/startspec TASK-ID`. Não continua. |
| `IN PROGRESS` | Continua a implementação; ao concluir, muda para `VERIFYING`. |
| `VERIFYING` | Executa as verificações e registra a evidência. |
| `COMPLETED` + `VERIFIED` | Informa que não há pendências. Não reinicia. |

## Evidência

`Verificação: VERIFIED` só é registrado com evidência real das verificações
executadas. Sem evidência, o helper devolve `E_EVIDENCE_REQUIRED`.

```markdown
- **Verificação:** VERIFIED (2026-11-13) — `pnpm lint`, `pnpm typecheck`, `pnpm test` e `pnpm build` aprovados.
```

Quando uma verificação falha e não pode ser corrigida no escopo da tarefa, a
tarefa permanece aberta:

```markdown
- **Status:** IN PROGRESS
- **Verificação:** FAILED (2026-11-13) — build quebrado pelo passo de migração.
```

## Mensagem de commit

Ao final de cada tarefa concluída, o comando apresenta a mensagem pronta e
copiável. **O commit continua sendo humano:** o comando não executa
`git commit` nem `git push`.

Formato:

```text
<type>(<scope>): <summary>

Change: <change-id>
Task: <TASK-ID>
Tests: <comandos executados>
Evidence: <resumo do resultado>
Action-Plan: <caminho do plano ou "none">
```

Tipos aceitos: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `build`.

Exemplos:

```text
feat(rawspec): add task-based start command

Change: 002-rawspec-task-commands
Task: TASK-009
Tests: pnpm lint; pnpm typecheck; pnpm test; pnpm build
Evidence: all checks passed
Action-Plan: none
```

```text
fix(rawspec): write archive state before rename

Change: 002-rawspec-task-commands
Task: TASK-008
Tests: pnpm lint; pnpm typecheck; pnpm test; pnpm build
Evidence: 60 testes do helper de fluxo aprovados
Action-Plan: specs/changes/002-rawspec-task-commands/action-plans/TASK-008-2026-11-13-staging-convergence.md
```

A mensagem só é gerada para tarefa `COMPLETED` + `VERIFIED` sem plano de ação
não resolvido. Caso contrário, o helper devolve `E_COMMIT_MESSAGE_BLOCKED` ou
`E_ACTION_PLAN_UNRESOLVED`.

## Planos de ação

### Gatilhos

Criam plano de ação:

- falha de lint, typecheck, teste ou build que não possa ser corrigida no
  escopo da tarefa;
- alteração inesperada em arquivo fora do escopo;
- conflito de dependência, arquitetura ou requisito;
- risco de perda de dados, segurança, privacidade, acessibilidade ou
  desempenho;
- necessidade de mudança de escopo;
- falha repetida na mesma verificação após duas tentativas de correção;
- risco de afetar a change 001 ou outra mudança;
- risco de Git: conflito, alteração não commitada do usuário, branch
  inadequado ou perda de histórico;
- impossibilidade de produzir evidência de verificação.

**Não** criam plano de ação:

- cancelamento do usuário;
- recusa de escolha;
- ambiguidade ainda pendente de resposta;
- interrupção normal do comando.

Nesses casos o comando apenas interrompe, informa o motivo e não altera
arquivos.

### Local

```text
specs/changes/NNN-slug/action-plans/TASK-NNN-YYYY-MM-DD-slug.md
```

O diretório `action-plans/` é criado sob demanda e só existe quando há um
plano.

### Status

| Status | Significado |
|---|---|
| `PENDING ACCEPTANCE` | Criado e aguardando decisão humana. |
| `ACCEPTED` | Aceito pelo usuário; pode ser executado. |
| `IN EXECUTION` | Correção em andamento. |
| `RESOLVED` | Risco tratado e validado. |
| `REJECTED` | Usuário recusou o plano; o risco permanece. |

`ACCEPTED` e `REJECTED` são decisões humanas e só são registrados após
resposta explícita do usuário.

### Template

```markdown
# Plano de Ação — TASK-NNN — Título

- Status: PENDING ACCEPTANCE
- Change: NNN-slug
- Task: TASK-NNN
- Data: YYYY-MM-DD
- Severidade: BAIXA | MEDIA | ALTA | CRITICA
- Origem: descrição curta

## 1. Problema ou risco
## 2. Impacto se não tratado
## 3. Evidências
## 4. Opções consideradas
## 5. Ação recomendada
## 6. Passos de execução
## 7. Validação
## 8. Rollback
## 9. Critérios de aceite
## 10. Aprovação
- Decisão:
- Data:
- Observações:
```

### Fluxo de aceite, rejeição e resolução

1. A ação arriscada é interrompida antes de continuar.
2. O plano é criado com `Status: PENDING ACCEPTANCE` e o caminho é registrado
   em `- **Plano de ação:**` na tarefa.
3. O plano é apresentado ao usuário e o aceite é solicitado explicitamente.
4. Aceito: registra `ACCEPTED`, executa a ação e, após validar, registra
   `RESOLVED`.
5. Rejeitado: registra `REJECTED`, mantém a tarefa aberta e para. Não há
   mensagem de commit de conclusão.
6. Resolvido: a tarefa volta a ser elegível para conclusão.

### Bloqueio

Uma tarefa não é concluída enquanto houver plano `PENDING ACCEPTANCE`,
`ACCEPTED`, `IN EXECUTION` ou `REJECTED`. O arquivamento da mudança é
bloqueado enquanto houver qualquer plano não resolvido.

## Arquivamento

### Escopo

O arquivamento é sempre da **mudança inteira**. `/arquivespec TASK-003` é
recusado com `E_ARCHIVE_TASK_SCOPE`.

### Validação completa antes de mover

Todas as pré-condições são verificadas antes de qualquer movimentação e antes
de qualquer operação de Git. Se qualquer uma falhar, **nenhum arquivo é movido
e nenhum `git add` é executado**.

1. Mudança aprovada.
2. `tasks.md` com pelo menos uma tarefa.
3. Todas as tarefas com `Status: COMPLETED` e `Verificação: VERIFIED`.
4. Todos os planos de ação com `Status: RESOLVED`.
5. Destino `specs/changes/archive/NNN-slug` inexistente.
6. Origem e destino confinados à mudança correta, sem `..`, caminho absoluto ou
   link simbólico que escape.
7. Estado Git inspecionado nos caminhos do manifesto e no destino.

### Inspeção do estado Git

`git status --porcelain` é executado restrito aos caminhos do manifesto e ao
destino.

- Alteração **rastreada** preexistente em arquivo do manifesto: o arquivamento
  para **antes de mover**, com `E_GIT_DIRTY`, e o comando apresenta a lista e
  pede decisão explícita: commitar, fazer stash, cancelar ou autorizar a
  inclusão. Sem decisão, nada é movido.
- Arquivos **não rastreados** dentro da mudança fazem parte do manifesto, mas
  só são staged após a confirmação explícita da lista exata de caminhos.

### Autorização da lista exata

Antes do staging, o comando apresenta a lista exata de arquivos que serão
staged, incluindo o `archive-state.json` que será criado.

- Autorizado: o staging é executado.
- Recusado: a mudança é arquivada com `Staging Git: SKIPPED` e nenhum
  `git add` é executado.
- Cancelado: nada é movido.

### Política de Git

- `git add` é permitido **somente durante o arquivamento** e **apenas em
  caminhos exatos** do manifesto, um caminho por vez.
- Não usar `git add -A`, não usar diretório e não usar glob.
- `git commit` e `git push` são **proibidos** em qualquer comando.
- `git rebase` e `git reset` não são executados.
- O histórico Git é preservado pela remoção e adição dos mesmos conteúdos; o
  commit humano permite que o Git detecte o rename.

### Rename atômico e marcadores

A mudança é movida com uma **única operação atômica de rename** no mesmo
volume. Não mover arquivo por arquivo e não usar `git mv`.

Ordem obrigatória de finalização:

```text
archive-state.json (ARCHIVING) → rename → proposal.md → archive-state.json (ARCHIVED) → staging
```

Marcadores gravados no `proposal.md` do destino:

```markdown
- Status: ARCHIVED
- Arquivada em: YYYY-MM-DD
- Staging Git: PENDING
```

Valores de `Staging Git`: `PENDING`, `FAILED`, `DONE`, `SKIPPED`.

### `archive-state.json`

Arquivo gravado dentro da própria mudança, como marcação write-ahead do
movimento. É criado pelo comando, nunca editado à mão.

```json
{
  "change": "002-rawspec-task-commands",
  "state": "ARCHIVING",
  "destination": "specs/changes/archive/002-rawspec-task-commands",
  "startedAt": "2026-11-12T10:00:00Z"
}
```

| Estado | Significado |
|---|---|
| `ARCHIVING` | A intenção de mover foi persistida; o `proposal.md` ainda pode não estar finalizado. |
| `ARCHIVED` | O rename foi concluído e o `proposal.md` do destino já está finalizado. |

O arquivo viaja com a mudança durante o rename, portanto sua presença no
destino prova que o movimento foi feito por este fluxo. Entrada inválida ou
ilegível é tratada como estado desconheado.

### Garantia de staging

O sucesso do arquivamento exige que a **versão final** do `proposal.md`
arquivado, com `Status: ARCHIVED` e `Staging Git: DONE`, esteja no índice Git.
A convergência é verificada contra o índice antes de reportar sucesso; se o
índice não contiver o marcador final, o caminho exato é re-stagiado e a
verificação é repetida. Se ainda assim não convergir, o resultado é
`Staging Git: FAILED` e `E_GIT_ADD_FAILED`.

### Tabela de estados do arquivamento

| Origem | Destino | `archive-state.json` | `proposal.md` | Interpretação | Ação |
|---|---|---|---|---|---|
| Existe | Não existe | Ausente | — | Ainda não arquivada. | Validar e arquivar do início. |
| Existe | Não existe | `ARCHIVING` | — | Intenção gravada, rename não ocorreu. | Remover o arquivo de estado, revalidar e arquivar de novo. |
| Existe | Existe | Qualquer | — | Conflito. | `E_ARCHIVE_DESTINATION_EXISTS`; não mover. |
| Não existe | Existe | `ARCHIVING` | Com ou sem `Status: ARCHIVED` | Interrompido entre o rename e a finalização. | Completar os dois marcadores de forma idempotente e seguir para o staging. **Nunca mover de novo.** |
| Não existe | Existe | `ARCHIVED` | Qualquer | Movimentação concluída e destino finalizado. | Nunca mover de novo; convergir o staging. |
| Não existe | Existe | Ausente | Com `Status: ARCHIVED` | Movimentação concluída sem arquivo de estado. | Nunca mover de novo; convergir o staging. |
| Não existe | Existe | Ausente | Sem `Status: ARCHIVED` | Estado desconhecido. | `E_ARCHIVE_STATE_UNKNOWN`; corrigir manualmente. |
| Não existe | Não existe | — | — | Mudança não encontrada. | `E_CHANGE_NOT_FOUND`. |

### Recuperação

A recuperação é idempotente: reexecutar repete apenas escritas de marcador e
staging de caminhos exatos. Ela:

- completa `Status: ARCHIVED` e `- Arquivada em:` no `proposal.md`,
  preservando a data já existente;
- escreve `- Staging Git:` quando ausente, `PENDING` ou `FAILED`, e preserva
  `DONE` ou `SKIPPED`;
- atualiza o `archive-state.json` para `state: ARCHIVED`;
- segue para o staging dos caminhos exatos.

A ordem de finalização é sempre `proposal.md` antes de `archive-state.json`. O
`archive-state.json` nunca passa a `ARCHIVED` antes de o `proposal.md` estar
finalizado; a recíproca não vale, porque `proposal.md` finalizado com
`archive-state.json` em `ARCHIVING` é um estado intermediário válido e
recuperável.

Com `Staging Git` em `PENDING` ou `FAILED`, a retomada executa **apenas** o
staging. Com `DONE` e convergência confirmada, o arquivamento é reportado como
concluído. Com `SKIPPED`, o comando informa que o arquivamento foi concluído
sem staging e oferece o staging como ação opcional.

A recuperação nunca executa `git reset`, `git checkout`, `git commit` ou
`git push`.

### Caminhos

A origem e o destino são resolvidos com caminho real. São recusados `..`,
caminhos absolutos, links simbólicos que escapem da mudança e qualquer
caminho fora de `specs/changes/`. O destino é exatamente
`specs/changes/archive/NNN-slug`.

## Solução de ambiguidade com `--change`

Quando a mesma `TASK-ID` existe em mais de uma mudança, `--change` evita a
pergunta:

```bash
node scripts/rawspec.mjs resolve TASK-003 --change 001-portfolio-mvp --json
node scripts/rawspec.mjs start TASK-003 --change 002-rawspec-task-commands --json
```

## Helper compartilhado

### Comandos do helper

```bash
node scripts/rawspec.mjs resolve TASK-003 [--change CHANGE-ID] [--json]
node scripts/rawspec.mjs next [--change CHANGE-ID] [--json]
node scripts/rawspec.mjs open [--change CHANGE-ID] [--json]
node scripts/rawspec.mjs pending-changes [--json]
node scripts/rawspec.mjs start TASK-003 [--change CHANGE-ID]
node scripts/rawspec.mjs begin-verify TASK-003 [--change CHANGE-ID]
node scripts/rawspec.mjs verify TASK-003 --evidence "..." [--change CHANGE-ID]
node scripts/rawspec.mjs fail TASK-003 --evidence "..." [--change CHANGE-ID]
node scripts/rawspec.mjs commit-message TASK-003 [--change CHANGE-ID]
node scripts/rawspec.mjs action-plan TASK-003 --slug build-failure --severity ALTA
node scripts/rawspec.mjs check-action-plans [CHANGE-ID]
node scripts/rawspec.mjs resolve-action-plan <PATH> --evidence "..."
node scripts/rawspec.mjs check-archive [CHANGE-ID]
node scripts/rawspec.mjs archive [CHANGE-ID] [--no-stage]
```

| Comando | Escreve? | Responsabilidade |
|---|---|---|
| `resolve` | Não | Resolver uma tarefa explícita e imprimir o estado em JSON. |
| `next` | Não | Retornar a próxima tarefa pendente e as candidatas. |
| `open` | Não | Retornar as tarefas abertas. |
| `pending-changes` | Não | Retornar as mudanças com tarefas pendentes e o estado de aprovação. |
| `start` | Sim | Validar os gates e mudar `PENDING` para `IN PROGRESS`. |
| `begin-verify` | Sim | Mudar `IN PROGRESS` para `VERIFYING`. |
| `verify` | Sim | Exigir evidência e mudar para `COMPLETED` + `VERIFIED`. |
| `fail` | Sim | Registrar falha e manter a tarefa aberta. |
| `commit-message` | Não | Gerar a mensagem de commit da tarefa concluída. |
| `action-plan` | Sim | Criar o plano de ação com `PENDING ACCEPTANCE`. |
| `check-action-plans` | Não | Listar os planos não resolvidos da mudança. |
| `resolve-action-plan` | Sim | Marcar um plano como `RESOLVED` após validação. |
| `check-archive` | Não | Listar pendências e identificar arquivamento já movido. |
| `archive` | Sim | Validar, inspecionar Git, mover atomicamente e stagear os caminhos exatos. |

### Formato de saída

```json
{
  "status": "ok",
  "change": {
    "id": "001-portfolio-mvp",
    "path": "specs/changes/001-portfolio-mvp",
    "approved": true,
    "legacySequential": true
  },
  "task": {
    "id": "TASK-003",
    "title": "Configurar estilos globais",
    "status": "PENDING",
    "verification": "PENDING",
    "dependencies": ["TASK-002"],
    "dependencySource": "legacy-sequential",
    "actionPlan": null,
    "file": "specs/changes/001-portfolio-mvp/tasks.md",
    "startLine": 32
  }
}
```

Em ambiguidade, o código é `4` e a saída traz as candidatas:

```json
{
  "status": "error",
  "code": "E_TASK_AMBIGUOUS",
  "message": "Tarefa TASK-003 existe em mais de uma mudança",
  "details": {
    "candidates": [
      {
        "change": "001-portfolio-mvp",
        "id": "TASK-003",
        "title": "Configurar estilos globais",
        "status": "COMPLETED",
        "file": "specs/changes/001-portfolio-mvp/tasks.md",
        "startLine": 32
      }
    ]
  }
}
```

