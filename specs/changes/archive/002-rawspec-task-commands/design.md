# Design Técnico — Fluxo RawSpec orientado por tarefa

**Change:** `002-rawspec-task-commands`  
**Status:** APPROVED  
**Base:** `proposal.md`

## 1. Objetivo

Definir como `/startspec`, `/continuespec` e `/arquivespec` passam a operar com `TASK-NNN`, mantendo:

- os arquivos Markdown como única fonte de verdade;
- o fluxo atual de criação e aprovação de mudanças;
- a aprovação humana;
- a rastreabilidade das tarefas;
- as evidências de verificação;
- o histórico Git;
- o arquivamento por mudança, nunca por tarefa.

## 2. Princípios

1. **Sem estado paralelo.** O estado continua em `specs/changes/*/tasks.md`.
2. **Um único resolvedor.** Os três comandos compartilham o mesmo parser e as mesmas validações.
3. **Aprovação é humana.** Comandos leem aprovação; nunca a concedem.
4. **Ambiguidade é decidida pelo usuário.** O comando nunca escolhe sozinho entre tarefas ou mudanças.
5. **Escrita mínima.** Somente as linhas de estado da tarefa são alteradas.
6. **Falha segura.** Em inconsistência, o comando para e explica.
7. **Sem destruição.** Nenhum comando apaga mudanças, tarefas ou histórico.
8. **Sem commit/push.** `git add` é permitido no arquivamento; commit e push não.

## 3. Premissas confirmadas

- Não existe `.opencode/commands/` nem versão versionada dos três comandos neste repositório.
- Os três comandos serão criados.
- `/startspec` sem argumento inicia a próxima tarefa pendente.
- Se houver tarefa aberta, o comando pergunta antes de iniciar outra.
- Ambiguidades são apresentadas ao usuário.
- `design.md` aprovado é obrigatório quando existir.
- O arquivamento pode executar `git add`, mas não commit nem push.
- Os documentos da change 001 são somente leitura.

## 4. Visão geral

```text
/startspec [TASK-ID]
        |
        v
[1] Normalizar argumento
        |
        v
[2] Verificar tarefas abertas
        |
        +--> existe tarefa aberta? --pergunta--> usuário recusa --> interrompe
        |
        v
[3] Resolver TASK ou próxima PENDING
        |
        +--> ambiguidade? --pergunta--> usuário escolhe
        |
        v
[4] Validar aprovação da change
        |
        v
[5] Validar dependências
        |
        v
[6] Validar estado da tarefa
        |
        v
[7] PENDING -> IN PROGRESS
        |
        v
[8] Executar a tarefa e registrar evidências
```

`/continuespec` reutiliza os passos 1, 3, 4 e 5 e continua a partir do estado atual.

`/arquivespec` reutiliza a resolução da change e valida todas as tarefas antes de mover o diretório.

## 5. Estrutura de arquivos

```text
.opencode/
└── commands/
    ├── startspec.md
    ├── continuespec.md
    └── arquivespec.md

scripts/
├── rawspec.mjs
└── rawspec.test.mjs

docs/
└── rawspec-commands.md
```

### 5.1 Responsabilidades

| Arquivo | Responsabilidade |
|---|---|
| `.opencode/commands/*.md` | Interface do comando: argumentos, narrativa, perguntas ao usuário e chamadas ao helper. |
| `scripts/rawspec.mjs` | Parser, resolvedor, validações, transições de estado e arquivamento. |
| `scripts/rawspec.test.mjs` | Testes automatizados do helper usando diretórios temporários. |
| `docs/rawspec-commands.md` | Documentação de uso, erros, exemplos e políticas. |

O helper não é um novo sistema de estado. Ele apenas lê e escreve os arquivos Markdown existentes de forma determinística.

## 6. Modelo de dados

### 6.1 Mudança

Uma mudança é um diretório `specs/changes/NNN-slug/` contendo:

- `proposal.md`
- `design.md` (opcional)
- `tasks.md`
- `action-plans/` (criado apenas quando houver plano de ação)
- `archive-state.json` (criado apenas durante o arquivamento, como marcação write-ahead do movimento)

Identificadores aceitos:

- `001`
- `001-portfolio-mvp`
- `portfolio-mvp`

A normalização compara o prefixo numérico e o slug. Em caso de mais de uma correspondência, o comando retorna as candidatas e pergunta ao usuário.

### 6.2 Status da mudança

Status lidos do cabeçalho de cada documento, antes do primeiro título `##`:

- `proposal.md`: `- Status: APPROVED` ou `**Status:** APPROVED`.
- `design.md`: `- Status: APPROVED` ou `**Status:** APPROVED`.
- `tasks.md`: `- Status: APPROVED` ou `**Status:** APPROVED`.

Regra de aprovação:

```text
proposal.md = APPROVED
tasks.md    = APPROVED
design.md   = APPROVED, quando o arquivo existir
```

Qualquer outro valor bloqueia a execução. Os comandos nunca escrevem nesses campos.

### 6.3 Tarefa

Cabeçalho:

```markdown
### TASK-003 — Configurar estilos globais
```

Campos reconhecidos dentro da seção da tarefa:

```markdown
- **Status:** PENDING
- **Depende de:** TASK-001, TASK-002
- **Início:** 2026-11-12
- **Verificação:** VERIFIED (2026-11-12) — lint, typecheck, testes e build aprovados.
- **Plano de ação:** specs/changes/002-rawspec-task-commands/action-plans/TASK-002-2026-11-12-build-failure.md
```

Regras:

- `Status` ausente é tratado como `PENDING`.
- `Verificação` ausente é tratada como `PENDING`.
- Mudanças novas: toda tarefa deve declarar `Depende de`; omissão em qualquer tarefa retorna `E_DEPENDENCY_UNDECLARED`, independentemente de outras tarefas.
- `Depende de: nenhuma` ou `Depende de: —` significa sem dependências e conta como declaração explícita.
- Modo legado sequencial: aplica-se somente à change 001 por allowlist documentada no helper. Nessa mudança, a ausência de `Depende de` significa dependência da tarefa anterior na ordem do arquivo.
- Nenhuma outra mudança entra em modo legado por omitir o campo.
- A origem da dependência é registrada em `dependencySource`: `explicit`, `legacy-sequential` ou `none`.
- `Plano de ação` é opcional e aponta para o plano criado quando a tarefa encontrou risco.
- A change 001 permanece compatível sem alteração e opera em modo legado sequencial.

### 6.4 Estados da tarefa

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

`COMPLETED` sem `VERIFIED`, `VERIFYING` com `FAILED` ou qualquer combinação incompleta bloqueia o arquivamento.

### 6.5 Plano de ação

Um plano de ação é um arquivo Markdown em:

```text
specs/changes/NNN-slug/action-plans/TASK-NNN-YYYY-MM-DD-slug.md
```

Status do plano:

| Status | Significado |
|---|---|
| `PENDING ACCEPTANCE` | Criado e aguardando decisão humana. |
| `ACCEPTED` | Aceito pelo usuário; pode ser executado. |
| `IN EXECUTION` | Correção em andamento. |
| `RESOLVED` | Risco tratado e validado. |
| `REJECTED` | Usuário recusou o plano; o risco permanece. |

Regras:

- O comando só pode definir `PENDING ACCEPTANCE`, `IN EXECUTION` ou `RESOLVED`.
- `ACCEPTED` e `REJECTED` representam decisão humana e devem ser registrados somente após resposta explícita do usuário.
- O plano não substitui a aprovação da mudança.
- O arquivamento exige todos os planos da mudança em `RESOLVED`.
- Um plano `REJECTED`, `PENDING ACCEPTANCE`, `ACCEPTED` ou `IN EXECUTION` bloqueia a conclusão da tarefa e o arquivamento.

### 6.6 Estruturas rejeitadas pelo parser

Markdown não tem uma definição universal de validade. O parser valida apenas a estrutura necessária ao RawSpec e ignora Markdown comum fora das seções de tarefa.

Retorna `E_PARSE` quando:

- `tasks.md` está ausente, não é um arquivo legível ou não pode ser decodificado como UTF-8;
- o arquivo não contém nenhuma tarefa reconhecível;
- um cabeçalho de seção aparenta ser tarefa mas não contém identificador `TASK-NNN`;
- um cabeçalho de tarefa não segue `### TASK-NNN — Título` com título não vazio;
- o mesmo `TASK-NNN` aparece mais de uma vez no mesmo arquivo;
- um identificador em `Depende de` está fora do padrão `TASK-\d+`;
- o campo `Status` contém valor fora de `PENDING`, `IN PROGRESS`, `VERIFYING` ou `COMPLETED`;
- o campo `Verificação` contém valor fora de `PENDING`, `VERIFIED` ou `FAILED`;
- um bloco de código cercado não é fechado, impedindo identificar com segurança os limites das tarefas;
- a estrutura do documento impede determinar onde uma tarefa começa ou termina.

Regras de fronteira:

- Uma seção de tarefa começa em `### TASK-NNN — Título` e termina no próximo título `##` ou `###`.
- Títulos `###` que não contêm o token `TASK` são conteúdo da tarefa anterior e não a encerram.
- Cabeçalhos dentro de blocos de código cercados são ignorados.
- O parser nunca tenta adivinhar um identificador, título ou limite ausente; interrompe com `E_PARSE`.

Markdown arbitrário fora das tarefas e campos não reconhecidos são ignorados. Dependência bem formada mas inexistente não é erro de parsing; retorna `E_DEPENDENCY_UNKNOWN`.

### 6.7 Arquivo de estado de arquivamento

O arquivamento grava, dentro da própria mudança, o arquivo `archive-state.json` descrito na seção 14.0. Ele é criado pelo comando, nunca editado à mão, e é a marcação write-ahead que torna o movimento recuperável.

Propriedades:

- Criado antes do rename do diretório, com `state: ARCHIVING`.
- Permanece em `ARCHIVING` depois do rename e passa a `state: ARCHIVED` somente depois que o `proposal.md` do destino está finalizado.
- Viaja com a mudança durante o rename, portanto sua presença no destino prova que o movimento foi feito por este fluxo.
- Entrada inválida ou ilegível é tratada como estado desconhecido, nunca como prova de movimento concluído.

## 7. Resolução de TASK para mudança

### 7.1 Normalização

- Aceitar `TASK-3`, `task-003` e `TASK-003`.
- Canonicalizar para `TASK-` seguido de pelo menos três dígitos.
- Rejeitar identificadores fora do padrão `TASK-\d+`.

### 7.2 Busca

1. Se `--change` foi informado, restringir a busca a essa mudança.
2. Caso contrário, varrer `specs/changes/*/tasks.md`, excluindo `specs/changes/archive/`.
3. Localizar o título exato `### TASK-NNN` em cada arquivo.
4. Se houver exatamente uma ocorrência, resolver.
5. Se houver mais de uma, retornar `E_TASK_AMBIGUOUS` com mudança, arquivo e linha de cada candidata.
6. Se não houver ocorrência ativa, verificar as mudanças arquivadas para produzir `E_TASK_ARCHIVED` quando aplicável.
7. Se não houver nenhuma ocorrência, falhar com `E_TASK_NOT_FOUND`.

A busca é determinística e não depende de branch, sessão ou arquivo de estado.

### 7.3 Interação em caso de ambiguidade

O helper não pergunta. Ele retorna as candidatas com código `4` e JSON estruturado.

O comando `/startspec`:

1. Apresenta cada candidata com mudança, título, status e caminho.
2. Pergunta qual o usuário quer usar.
3. Não inicia nada até receber a resposta.
4. Se o usuário não escolher, interrompe sem alterar estado.

`--change` é um atalho opcional para evitar a pergunta quando o usuário já sabe a mudança.

## 8. Seleção da próxima tarefa

Aplica-se a `/startspec` sem argumento.

### 8.1 Tarefas abertas

Antes de selecionar a próxima tarefa, o helper lista tarefas com status `IN PROGRESS` ou `VERIFYING` em todas as mudanças não arquivadas.

Se existir pelo menos uma:

1. O comando informa as tarefas abertas com mudança, título e status.
2. Pergunta: "Deseja iniciar outra tarefa enquanto estas estão em execução?"
3. Se a resposta for negativa, interrompe sem alterar estado e orienta `/continuespec` para concluir a tarefa aberta.
4. Se a resposta for afirmativa, continua a seleção.

A pergunta é obrigatória mesmo quando existe apenas uma tarefa aberta.

### 8.2 Mudanças candidatas

1. Considerar todas as mudanças não arquivadas com pelo menos uma tarefa `PENDING`.
2. Separar as mudanças aprovadas das não aprovadas.
3. Se houver tarefas pendentes apenas em mudanças não aprovadas, falhar com `E_CHANGE_NOT_APPROVED` listando cada mudança e o status que falta.
4. Considerar apenas as mudanças aprovadas com tarefa `PENDING`.
5. Se nenhuma mudança aprovada tiver tarefa pendente, falhar com `E_NOTHING_TO_START`.
6. Se exatamente uma mudança aprovada tiver tarefa pendente, usá-la.
7. Se mais de uma tiver tarefa pendente, apresentar as candidatas e perguntar qual usar.

### 8.3 Próxima tarefa

Dentro da mudança escolhida:

1. Selecionar a primeira tarefa `PENDING` na ordem do `tasks.md`.
2. Não pular tarefas bloqueadas.
3. Validar aprovação e dependências.
4. Se a tarefa selecionada tiver dependência pendente, parar e informar a pendência.
5. Iniciar somente após todas as validações.

## 9. Grafo de dependências

### 9.1 Construção

- Se a tarefa tem `Depende de`, usar a lista explícita e marcar `dependencySource: explicit`.
- Se a mudança não é legada e alguma tarefa omite `Depende de`, retornar `E_DEPENDENCY_UNDECLARED`; não inferir dependência.
- Se a mudança é a change 001 (allowlist `legacy-sequential` documentada), usar a tarefa imediatamente anterior na ordem do `tasks.md`, com `dependencySource: legacy-sequential`.
- A primeira tarefa do modo legado não tem dependência padrão.
- `Depende de: nenhuma` ou `—` produz `dependencySource: none`.

### 9.2 Validação

- Toda dependência deve existir na mesma mudança.
- Uma tarefa não pode depender de si mesma.
- Ciclos são rejeitados com `E_DEPENDENCY_CYCLE`.
- Cada dependência deve estar `COMPLETED` + `VERIFIED`.
- Dependências pendentes produzem `E_DEPENDENCY_PENDING` com a lista completa e a origem de cada dependência.

### 9.3 Decisão explícita

- Mudanças novas: toda tarefa deve declarar `Depende de` explicitamente. Ausência é erro, não dependência implícita.
- Change 001: é uma mudança legada, sem nenhum campo `Depende de`, e não será alterada. Nela, todas as tarefas são sequenciais por decisão explícita, e a ausência significa dependência da tarefa anterior.
- O modo legado é aplicado apenas à change 001 por uma allowlist documentada; nenhuma mudança nova entra em modo legado por omitir o campo.
- Não existe inferência de dependência em mudanças novas.
- A origem `legacy-sequential` é exibida em `resolve`, `next`, `start` e nas mensagens de erro, para que o bloqueio nunca seja inesperado.

## 10. Máquina de estados

```text
PENDING
   |
   | /startspec TASK-ID
   v
IN PROGRESS
   |
   | /continuespec TASK-ID (implementação concluída)
   v
VERIFYING
   |
   | /continuespec TASK-ID (verificações aprovadas + evidência)
   v
COMPLETED + VERIFIED
```

Falha de verificação:

```text
VERIFYING --falha--> IN PROGRESS
                         |
                         +--> Verificação: FAILED (data) — motivo
```

O comando não marca `COMPLETED` enquanto a verificação não for aprovada com evidência.

### 10.1 Fechamento de tarefa e mensagem de commit

Ao concluir uma tarefa, antes de reportar sucesso, o comando deve:

1. Confirmar `Status: COMPLETED` e `Verificação: VERIFIED`.
2. Confirmar que não há plano de ação não resolvido para a tarefa ou para a mudança.
3. Listar os arquivos alterados.
4. Reunir as verificações executadas e a evidência.
5. Gerar uma mensagem de commit em bloco copiável.
6. Informar que o commit não foi executado.

Formato da mensagem:

```text
<type>(<scope>): <summary>

Change: <change-id>
Task: <TASK-ID>
Tests: <comandos executados>
Evidence: <resumo do resultado>
Action-Plan: <caminho do plano ou "none">
```

Regras:

- `type` usa Conventional Commits: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `build`.
- `summary` é imperativo, curto e sem ponto final.
- A mensagem deve refletir somente os arquivos da tarefa.
- Nenhum `git commit` ou `git push` é executado.
- A mensagem não é gerada para tarefa incompleta, bloqueada ou com verificação `FAILED`.
- Se houver plano de ação resolvido, o caminho entra em `Action-Plan`.
- Se não houver plano, usar `Action-Plan: none`.

Exemplo:

```text
feat(rawspec): add task-based start command

Change: 002-rawspec-task-commands
Task: TASK-009
Tests: pnpm lint; pnpm typecheck; pnpm test; pnpm build
Evidence: all checks passed
Action-Plan: none
```

### 10.2 Problemas, riscos e plano de ação

O comando deve criar um plano de ação quando identificar:

- falha de lint, typecheck, teste ou build que não possa ser corrigida no escopo da tarefa;
- alteração inesperada em arquivo fora do escopo;
- conflito de dependência, arquitetura ou requisito;
- risco de perda de dados, segurança, privacidade, acessibilidade ou desempenho;
- necessidade de mudança de escopo;
- falha repetida na mesma verificação após duas tentativas de correção;
- risco de afetar a change 001 ou outra mudança;
- risco de Git: conflito, alteração não commitada do usuário, branch inadequado ou perda de histórico;
- impossibilidade de produzir evidência de verificação.

Não criar plano de ação para cancelamento do usuário, recusa de escolha, ambiguidade ainda pendente de resposta ou interrupção normal do comando. Nesses casos, apenas interromper, informar o motivo e não alterar arquivos.

Fluxo:

1. Interromper a ação arriscada antes de continuar.
2. Criar o arquivo em `specs/changes/NNN-slug/action-plans/`.
3. Preencher o template com problema, impacto, evidências, opções, recomendação, passos, validação, rollback e critérios de aceite.
4. Definir `Status: PENDING ACCEPTANCE`.
5. Registrar o caminho em `- **Plano de ação:**` na tarefa.
6. Apresentar o plano ao usuário.
7. Perguntar explicitamente se o plano é aceito.
8. Se aceito, registrar `Status: ACCEPTED` e executar.
9. Se rejeitado, registrar `Status: REJECTED`, manter a tarefa aberta e parar.
10. Após executar e validar, registrar `Status: RESOLVED`.
11. Só então retomar a tarefa e gerar a mensagem de commit.

Template mínimo:

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

O plano de ação não substitui a aprovação da mudança e não autoriza commit ou push.

## 11. Contratos dos comandos

### 11.1 `/startspec`

**Argument hint:** `[TASK-ID] [--change CHANGE-ID]`

Modo com `TASK-ID`:

1. Normalizar e resolver a tarefa.
2. Se houver ambiguidade, perguntar ao usuário.
3. Se houver tarefa aberta diferente da tarefa alvo, perguntar se deseja iniciar outra.
4. Se o usuário recusar, interromper.
5. Validar a aprovação da mudança.
6. Validar dependências e exibir a origem de cada uma (`explicit`, `legacy-sequential` ou `none`).
7. Exigir `Status: PENDING`.
8. Alterar para `IN PROGRESS`, registrando a data em `Início`.
9. Executar a tarefa conforme o `tasks.md` e o `design.md`.
10. Se surgir problema ou risco, criar plano de ação e solicitar aceite antes de continuar.
11. Executar as verificações previstas na aceitação.
12. Registrar evidências e atualizar o estado.
13. Confirmar que não há plano de ação não resolvido.
14. Gerar a mensagem de commit da tarefa.
15. Reportar arquivos alterados, verificações, mensagem de commit e próximo passo.

Modo sem argumento:

1. Listar tarefas abertas.
2. Se houver, perguntar se deseja iniciar outra.
3. Se o usuário recusar, interromper e orientar `/continuespec` para concluir a tarefa aberta.
4. Listar mudanças não arquivadas com tarefas `PENDING`.
5. Se houver pendências apenas em mudanças não aprovadas, falhar com `E_CHANGE_NOT_APPROVED`.
6. Se houver mais de uma mudança aprovada com `PENDING`, perguntar qual usar.
7. Selecionar a primeira `PENDING` da mudança escolhida.
8. Seguir os passos 5 a 15 do modo com `TASK-ID`.

Erros específicos:

- tarefa inexistente;
- tarefa ambígua;
- argumento fora do padrão;
- mudança não aprovada;
- dependência pendente;
- tarefa já `IN PROGRESS` (usar `/continuespec`);
- tarefa já concluída;
- tarefa em `VERIFYING` (usar `/continuespec`);
- nenhuma tarefa pendente.

### 11.2 `/continuespec`

**Argument hint:** `[TASK-ID] [--change CHANGE-ID]`

Modo com `TASK-ID`:

1. Normalizar e resolver a tarefa.
2. Se houver ambiguidade, perguntar ao usuário.
3. Revalidar aprovação e dependências.
4. Ler o estado atual e as pendências da tarefa.
5. Se `PENDING`, orientar `/startspec TASK-ID`.
6. Se `IN PROGRESS`, continuar a implementação; ao concluir, mudar para `VERIFYING`.
7. Se surgir problema ou risco, criar plano de ação e solicitar aceite antes de continuar.
8. Se `VERIFYING`, executar as verificações e registrar evidências.
9. Se a verificação falhar, manter a tarefa aberta e registrar `Verificação: FAILED`.
10. Se a verificação passar, registrar `COMPLETED` + `VERIFIED`.
11. Confirmar que não há plano de ação não resolvido.
12. Gerar a mensagem de commit da tarefa.
13. Reportar o que falta, a mensagem de commit e o próximo passo.

Modo sem argumento:

1. Listar tarefas abertas.
2. Se houver exatamente uma, continuar.
3. Se houver mais de uma, perguntar qual continuar.
4. Se não houver nenhuma, falhar com `E_NO_OPEN_TASK` e sugerir `/startspec`.

### 11.3 `/arquivespec`

**Argument hint:** `[CHANGE-ID]`

Passos:

1. Resolver a mudança.
2. Se houver ambiguidade, perguntar ao usuário.
3. Validar aprovação.
4. Ler todas as tarefas.
5. Exigir pelo menos uma tarefa.
6. Exigir todas as tarefas `COMPLETED` + `VERIFIED`.
7. Exigir todos os planos de ação da mudança em `RESOLVED`.
8. Recusar `TASK-ID` como argumento.
9. Validar confinamento de origem e destino, recusando `..`, caminho absoluto, link simbólico que escape e destino existente.
10. Construir o manifesto de arquivos e inspecionar o estado Git dos caminhos; se houver alteração rastreada preexistente, parar e pedir decisão.
11. Apresentar a lista exata de arquivos a serem staged e pedir autorização; se recusada, arquivar sem staging.
12. Gravar `archive-state.json` com `state: ARCHIVING` antes de mover, como marcação write-ahead.
13. Só mover o diretório com uma única operação atômica de rename após todas as validações.
14. Se o rename falhar, remover o arquivo de estado e abortar sem movimentação parcial.
15. Finalizar o `proposal.md` do destino com `Status: ARCHIVED`, `- Arquivada em:` e `Staging Git`; o `archive-state.json` permanece em `ARCHIVING`.
16. Atualizar o `archive-state.json` do destino para `state: ARCHIVED`, depois da finalização do `proposal.md`.
17. Executar `git add` somente nos caminhos exatos do manifesto, um por vez, após a movimentação.
18. Ao concluir o staging, escrever `Staging Git: DONE` e re-stagiar o caminho exato do `proposal.md` arquivado.
19. Verificar a convergência contra o índice Git e reportar `E_GIT_ADD_FAILED` se o `proposal.md` final não estiver staged.
20. Se o staging falhar, registrar `FAILED` e permitir apenas a retomada idempotente do staging, sem mover novamente.
21. Quando o destino já existir, nunca mover de novo: completar de forma idempotente os dois marcadores, `proposal.md` primeiro e `archive-state.json` depois, e convergir o staging.
22. Informar o caminho final, os arquivos staged e uma sugestão de mensagem de commit.
23. Não criar commit nem push.

Resolução sem argumento:

- considerar apenas mudanças não arquivadas;
- se exatamente uma estiver elegível, arquivar;
- se mais de uma estiver elegível, perguntar qual usar;
- se nenhuma estiver elegível, falhar com `E_ARCHIVE_PENDING_TASKS` ou `E_NO_ELIGIBLE_CHANGE`.

## 12. Helper compartilhado

### 12.1 Interface de linha de comando

```bash
node scripts/rawspec.mjs resolve TASK-003 [--change 001-portfolio-mvp] [--json]
node scripts/rawspec.mjs next [--change 001-portfolio-mvp] [--json]
node scripts/rawspec.mjs open [--change 001-portfolio-mvp] [--json]
node scripts/rawspec.mjs start TASK-003 [--change 001-portfolio-mvp]
node scripts/rawspec.mjs begin-verify TASK-003 [--change 001-portfolio-mvp]
node scripts/rawspec.mjs verify TASK-003 --evidence "..." [--change 001-portfolio-mvp]
node scripts/rawspec.mjs fail TASK-003 --evidence "..." [--change 001-portfolio-mvp]
node scripts/rawspec.mjs commit-message TASK-003 [--change 001-portfolio-mvp]
node scripts/rawspec.mjs action-plan TASK-003 --slug build-failure --severity ALTA [--change 001-portfolio-mvp]
node scripts/rawspec.mjs check-action-plans [CHANGE-ID]
node scripts/rawspec.mjs resolve-action-plan <PATH> --evidence "..."
node scripts/rawspec.mjs check-archive [CHANGE-ID]
node scripts/rawspec.mjs archive [CHANGE-ID]
```

### 12.2 Responsabilidades

| Comando | Escreve? | Responsabilidade |
|---|---|---|
| `resolve` | Não | Resolver uma tarefa explícita e imprimir estado em JSON. |
| `next` | Não | Retornar tarefas abertas e candidatas para a próxima tarefa pendente. |
| `open` | Não | Retornar tarefas abertas para `/continuespec` sem argumento. |
| `start` | Sim | Validar gates e mudar `PENDING` para `IN PROGRESS`. |
| `begin-verify` | Sim | Mudar `IN PROGRESS` para `VERIFYING`. |
| `verify` | Sim | Exigir evidência e mudar para `COMPLETED` + `VERIFIED`. |
| `fail` | Sim | Registrar falha e manter a tarefa aberta. |
| `commit-message` | Não | Gerar a mensagem de commit da tarefa concluída. |
| `action-plan` | Sim | Criar o esqueleto do plano de ação com `PENDING ACCEPTANCE`. |
| `check-action-plans` | Não | Listar planos não resolvidos da mudança. |
| `resolve-action-plan` | Sim | Marcar um plano como `RESOLVED` após validação. |
| `check-archive` | Não | Listar pendências de tarefas, planos e staging pendente; identificar arquivamento já movido. |
| `archive` | Sim | Validar, inspecionar Git, gravar a marcação write-ahead, mover atomicamente, finalizar marcadores, stage caminhos exatos e retomar staging sem mover de novo. |

### 12.3 Formato de saída do `resolve` e do `next`

```json
{
  "status": "ok",
  "change": {
    "id": "001-portfolio-mvp",
    "path": "specs/changes/001-portfolio-mvp",
    "approved": true
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

`dependencySource` aceita `explicit`, `legacy-sequential` ou `none`. O exemplo acima usa a change 001, que opera em modo legado.

Em ambiguidade:

```json
{
  "status": "ambiguous",
  "candidates": [
    {
      "change": "001-portfolio-mvp",
      "task": "TASK-003",
      "title": "Configurar estilos globais",
      "status": "COMPLETED",
      "file": "specs/changes/001-portfolio-mvp/tasks.md",
      "line": 32
    }
  ]
}
```

### 12.4 Códigos de saída

| Código | Significado |
|---|---|
| `0` | Sucesso. |
| `2` | Argumentos inválidos. |
| `3` | Tarefa ou mudança não encontrada. |
| `4` | Ambiguidade. |
| `5` | Gate de aprovação, dependência ou estado não atendido. |
| `6` | Erro de parsing. |
| `7` | Erro de I/O ou de Git. |

## 13. Catálogo de erros

Mensagens devem ser curtas, em português, e incluir o próximo passo.

| Código | Quando ocorre | Ação esperada |
|---|---|---|
| `E_ARGS` | Argumento malformado ou flag desconhecida. | Corrigir a invocação. |
| `E_TASK_NOT_FOUND` | Nenhuma tarefa ativa com o ID. | Conferir o ID ou a mudança. |
| `E_TASK_AMBIGUOUS` | Mesmo ID em mais de uma mudança. | Perguntar ao usuário qual usar. |
| `E_TASK_ARCHIVED` | Tarefa existe apenas em mudança arquivada. | Não reabrir; criar nova mudança se necessário. |
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
| `E_PARSE` | Estrutura RawSpec malformada conforme a lista fechada da seção 6.6. | Corrigir a estrutura indicada. |
| `E_PATH_ESCAPE` | Caminho fora da mudança ou de `specs/changes/`, incluindo `..`, caminho absoluto e link simbólico que escapa. | Corrigir a invocação. |
| `E_GIT_DIRTY` | Caminhos do manifesto têm alterações rastreadas preexistentes. | Parar antes de mover e pedir decisão: commit, stash, cancelar ou autorizar. |
| `E_ARCHIVE_MOVE_FAILED` | Rename atômico falhou; nenhum arquivo foi movido e nenhum `git add` foi executado. | Corrigir o motivo e repetir a validação; não tentar movimentação parcial. |
| `E_ARCHIVE_STATE_UNKNOWN` | Destino existe sem `archive-state.json` e sem `Status: ARCHIVED`, ou com `archive-state.json` ilegível. | Não mover, apagar ou resetar; corrigir manualmente. |
| `E_ACTION_PLAN_UNRESOLVED` | Tarefa tem plano de ação não resolvido. | Solicitar aceite e concluir o plano antes da tarefa. |
| `E_ACTION_PLAN_PENDING` | Arquivamento com plano não resolvido. | Resolver ou cancelar o plano com aceite humano. |
| `E_ACTION_PLAN_REJECTED` | Usuário rejeitou o plano de ação. | Manter a tarefa aberta e reavaliar o risco. |
| `E_COMMIT_MESSAGE_BLOCKED` | Tentativa de gerar mensagem para tarefa incompleta ou bloqueada. | Concluir a tarefa e resolver planos antes. |
| `E_GIT_ADD_FAILED` | `git add` falhou após a movimentação ou a convergência do staging não foi atingida. | Marcar `Staging Git: FAILED`; não mover de novo; retomar apenas o staging dos caminhos exatos. |

Interrupção por escolha do usuário não é erro. O comando informa "Interrompido pelo usuário" e não altera arquivos.

## 14. Arquivamento

### 14.0 Estado de arquivamento persistido

Antes de qualquer movimentação, o comando grava dentro da própria mudança um arquivo de estado que funciona como marcação write-ahead do movimento:

```text
specs/changes/NNN-slug/archive-state.json
```

```json
{
  "change": "002-rawspec-task-commands",
  "state": "ARCHIVING",
  "destination": "specs/changes/archive/002-rawspec-task-commands",
  "startedAt": "2026-11-12T10:00:00Z"
}
```

Regras do arquivo de estado:

- `state: ARCHIVING` significa que a intenção de mover foi persistida. O arquivo permanece em `ARCHIVING` até que o `proposal.md` do destino esteja finalizado.
- `state: ARCHIVED` significa que o rename foi concluído e o `proposal.md` do destino já foi finalizado com `Status: ARCHIVED`, data de arquivamento e marcador de staging.
- Ordem obrigatória de finalização: rename → `proposal.md` → `archive-state.json`. O `archive-state.json` só passa a `ARCHIVED` depois que o `proposal.md` está finalizado.
- O arquivo é escrito de forma atômica antes do rename e viaja com a mudança durante o rename.
- O arquivo é a prova de que o movimento foi feito por este fluxo. Sem ele e sem `Status: ARCHIVED` no `proposal.md`, um destino existente é estado desconhecido.
- Depois de um rename concluído, o arquivo é apenas atualizado para `ARCHIVED`; nunca é apagado.
- O arquivo só é removido quando o rename não chegou a ocorrer e o arquivamento é refeito do início.

### 14.1 Pré-condições

- Mudança aprovada.
- `tasks.md` com pelo menos uma tarefa.
- Todas as tarefas com `Status: COMPLETED` e `Verificação: VERIFIED`.
- Todos os planos de ação da mudança com `Status: RESOLVED`.
- Destino inexistente.
- Origem e destino confinados à mudança correta, sem `..`, caminho absoluto ou link simbólico que escape.
- Manifesto de arquivos construído a partir da mudança, sem incluir caminhos externos e incluindo o `archive-state.json` que será criado no passo 7.
- Estado Git inspecionado nos caminhos do manifesto e no destino.

Todas as pré-condições são verificadas por completo antes de qualquer movimentação e antes de qualquer operação de Git. Se qualquer uma falhar, nenhum arquivo é movido e nenhum `git add` é executado.

Se houver alterações staged ou unstaged em arquivos rastreados do manifesto, o comando para antes de mover e pede decisão explícita: commit, stash, cancelar ou autorizar a inclusão. Sem decisão, nada é movido. Arquivos não rastreados dentro da mudança fazem parte do manifesto, mas só são staged após confirmação explícita da lista de caminhos.

### 14.2 Sequência da operação

1. Revalidar aprovação, tarefas, planos, destino e caminhos imediatamente antes de mover.
2. Resolver a origem com caminho real e confirmar que está dentro de `specs/changes/NNN-slug`.
3. Resolver o destino com caminho real e confirmar que é exatamente `specs/changes/archive/NNN-slug`.
4. Recusar links simbólicos que apontem para fora da mudança.
5. Construir o manifesto com a lista exata de arquivos da mudança e com os caminhos de origem rastreados que precisam registrar remoção.
6. Inspecionar `git status --porcelain` nos caminhos do manifesto e no destino; se houver alteração rastreada preexistente, parar e pedir decisão antes de mover.
7. Apresentar a lista exata de arquivos que serão staged, incluindo o `archive-state.json` que será criado, e perguntar se o usuário autoriza. Se recusar, arquivar sem staging e registrar `Staging Git: SKIPPED`; se cancelar, não mover.
8. Gravar `archive-state.json` com `state: ARCHIVING` na origem, antes do rename, e incluí-lo no manifesto. É a marcação write-ahead do movimento.
9. Mover o diretório com uma única operação atômica de rename no mesmo volume. Não mover arquivo por arquivo.
10. Se o rename falhar, abortar sem movimentação parcial, remover o `archive-state.json` gravado no passo 8 e informar `E_ARCHIVE_MOVE_FAILED`. Rename entre volumes diferentes não é suportado.
11. Finalizar o `proposal.md` do destino com `Status: ARCHIVED`, `- Arquivada em: YYYY-MM-DD` e `- Staging Git: PENDING`, ou `SKIPPED` quando o staging não foi autorizado. O `archive-state.json` permanece em `ARCHIVING` neste ponto.
12. Atualizar o `archive-state.json` do destino para `state: ARCHIVED`. Só esta gravação vem depois da finalização do `proposal.md`.
13. Preservar `tasks.md`, `action-plans/` e as evidências como estavam.
14. Se o staging foi autorizado, revalidar o estado Git e executar `git add` somente nos caminhos exatos do manifesto:
    - arquivos do destino, um caminho por vez;
    - arquivos de origem rastreados, um caminho por vez, para registrar a remoção.
15. Não usar `git add -A` em diretório, glob ou caminho fora do manifesto.
16. Se o staging falhar, escrever `- Staging Git: FAILED` no `proposal.md`, tentar stagiar apenas esse caminho exato e informar `E_GIT_ADD_FAILED`, mantendo a mudança movida; não reverter nem mover novamente.
17. Se o staging concluir, escrever `- Staging Git: DONE` no `proposal.md` e **re-stagiar exatamente o caminho do `proposal.md` arquivado**, para que a versão final fique no índice.
18. Verificar a convergência: `git show :<destino>/proposal.md` deve conter `Status: ARCHIVED` e `Staging Git: DONE`, e `git diff --cached --name-only` deve conter todos os caminhos do manifesto. Se a verificação falhar, escrever `Staging Git: FAILED` e informar `E_GIT_ADD_FAILED`.
19. Exibir o caminho final, os arquivos staged e a sugestão de commit.

Invariante do arquivamento: quando o comando reporta sucesso, a versão final do `proposal.md` arquivado, com `Status: ARCHIVED` e `Staging Git: DONE`, está staged, e os demais caminhos do manifesto também estão staged. O índice Git é a fonte da verdade do estado de staging; o marcador em texto é apenas indicação para leitura humana.

Invariante dos marcadores: `archive-state.json` com `state: ARCHIVED` implica que o `proposal.md` do destino já está finalizado. A recíproca não vale: `proposal.md` finalizado com `archive-state.json` em `ARCHIVING` é um estado intermediário válido e recuperável.

O histórico Git é preservado pela remoção e adição dos mesmos conteúdos; o commit humano permite que o Git detecte o rename. O `git mv` não é necessário e não é usado para evitar movimentação parcial.

### 14.3 Recuperação de arquivamento

O estado é identificado pelos caminhos, pelo `archive-state.json` e pelo `proposal.md`:

| Origem | Destino | `archive-state.json` | `proposal.md` | Interpretação | Ação |
|---|---|---|---|---|---|
| Existe | Não existe | Ausente | — | Ainda não arquivada. | Validar e arquivar do início. |
| Existe | Não existe | `ARCHIVING` | — | Intenção gravada, rename não ocorreu. | Remover o arquivo de estado, revalidar e arquivar de novo. |
| Existe | Existe | Qualquer | — | Conflito. | `E_ARCHIVE_DESTINATION_EXISTS`; não mover. |
| Não existe | Existe | `ARCHIVING` | Com ou sem `Status: ARCHIVED` | Operação interrompida entre o rename e a finalização. | Completar de forma idempotente os dois marcadores e seguir para o staging. Nunca mover de novo. |
| Não existe | Existe | `ARCHIVED` | Qualquer | Movimentação concluída e destino finalizado. | Nunca mover de novo; convergir o staging. |
| Não existe | Existe | Ausente | Com `Status: ARCHIVED` | Movimentação concluída sem arquivo de estado. | Nunca mover de novo; convergir o staging. |
| Não existe | Existe | Ausente | Sem `Status: ARCHIVED` | Estado desconhecido. | `E_ARCHIVE_STATE_UNKNOWN`; corrigir manualmente. |
| Não existe | Não existe | — | — | Mudança não encontrada. | `E_CHANGE_NOT_FOUND`. |

Regras de recuperação:

- Quando o destino existe, `/arquivespec` nunca renomeia de novo.
- Com `archive-state.json` em `ARCHIVING` e origem ausente, o rename foi concluído, independentemente de o `proposal.md` já estar ou não finalizado. A recuperação completa os dois marcadores de forma idempotente, nesta ordem:
  1. garantir `Status: ARCHIVED` e `- Arquivada em:` no `proposal.md`, preservando a data já existente;
  2. garantir `- Staging Git:` no `proposal.md`, escrevendo `PENDING` quando o campo estiver ausente, `PENDING` ou `FAILED`, e preservando `DONE` ou `SKIPPED`;
  3. atualizar o `archive-state.json` para `state: ARCHIVED`;
  4. só então seguir para o staging.
- Com `archive-state.json` em `ARCHIVING` e origem presente, o rename não ocorreu: o comando remove o arquivo de estado, revalida as pré-condições e pode arquivar de novo.
- Com `Staging Git` em `PENDING` ou `FAILED`, o comando retoma apenas o staging dos caminhos exatos do manifesto.
- A convergência do staging é verificada contra o índice Git: se o conteúdo indexado do `proposal.md` arquivado não contiver `Status: ARCHIVED` e `Staging Git: DONE`, o caminho é re-stagiado e a verificação é repetida.
- Com `Staging Git` em `DONE` e convergência confirmada, informar que o arquivamento já foi concluído.
- Com `Staging Git` em `SKIPPED`, informar que o arquivamento foi concluído sem staging e oferecer o staging como ação opcional.
- Se o destino existe sem `archive-state.json` e sem `Status: ARCHIVED`, parar com `E_ARCHIVE_STATE_UNKNOWN`; não apagar, mover ou resetar.
- A recuperação é idempotente: reexecutar repete apenas escritas de marcador e staging de caminhos exatos.
- A recuperação não executa `git reset`, `git checkout`, `git commit` ou `git push`.

### 14.4 O que não fazer

- Não arquivar tarefa isolada.
- Não mover nada antes de concluir todas as validações e a inspeção de Git.
- Não mover o diretório sem gravar antes o `archive-state.json` com `state: ARCHIVING`.
- Não atualizar o `archive-state.json` para `ARCHIVED` antes de finalizar o `proposal.md` do destino.
- Não mover arquivo por arquivo nem tentar novamente uma movimentação já concluída.
- Não seguir `..`, caminho absoluto ou link simbólico que escape da mudança.
- Não fazer staging indiscriminado; não usar `git add -A` em diretório e não incluir caminhos fora do manifesto.
- Não incluir alterações preexistentes do usuário sem decisão explícita.
- Não reportar `Staging Git: DONE` sem que a versão final do `proposal.md` esteja no índice.
- Não apagar `tasks.md`, `proposal.md` ou `design.md`.
- Não reescrever o histórico.
- Não executar `git commit`, `git push`, `git rebase` ou `git reset`.
- Não mover mudança para fora de `specs/changes/archive/`.

## 15. Compatibilidade

- Não há comando legado versionado a preservar.
- A criação de mudanças continua baseada no fluxo atual de arquivos Markdown.
- `/startspec` sem argumento inicia a próxima tarefa pendente, conforme decisão do usuário.
- `/continuespec` sem argumento continua a tarefa aberta.
- `Depende de` é obrigatório em mudanças que usam dependências explícitas; omiti-lo nesse caso é erro.
- A change 001 não declara `Depende de` e opera em modo legado sequencial, com a origem exibida e documentada.
- Status aceita variações com ou sem negrito.
- A change 001 não é migrada.
- Nenhum comando novo além dos três solicitados.
- Nenhuma alteração no formato de `proposal.md`, `design.md` ou `tasks.md` da change 001.
- A mensagem de commit é uma saída do comando; o commit continua humano.
- Planos de ação são opcionais e só existem quando um risco é identificado.
- `action-plans/` é criado sob demanda e não altera mudanças existentes.

## 16. Integridade e segurança

- Validar que todos os caminhos resolvidos estão dentro de `specs/changes/`.
- Não interpolar argumentos diretamente em comandos de shell.
- Escrever de forma atômica: ler, alterar somente as linhas necessárias, gravar em arquivo temporário e renomear.
- Preservar o restante do conteúdo, incluindo títulos, listas e evidências.
- Em caso de erro após uma escrita parcial, restaurar o conteúdo original.
- Não seguir links simbólicos para fora da mudança.
- No arquivamento, concluir todas as validações e a inspeção de Git antes de qualquer movimentação.
- Resolver origem e destino com caminho real; recusar `..`, caminho absoluto e destino diferente de `specs/changes/archive/NNN-slug`.
- Inspecionar `git status` nos caminhos do manifesto; não incluir alterações preexistentes sem decisão explícita.
- Não fazer staging indiscriminado; usar apenas caminhos exatos do manifesto.
- Não usar `git add -A` em diretório, glob ou caminho fora do manifesto.
- Não executar código de terceiros.
- Nunca executar `git add` após falha de validação.
- Gravar `archive-state.json` antes do rename e nunca confiar apenas em marcador textual para saber se o movimento ocorreu.
- Manter a ordem dos marcadores: `proposal.md` antes de `archive-state.json`.
- Não reportar sucesso de arquivamento sem que a versão final do `proposal.md` esteja no índice Git.
- Verificar a convergência do staging contra o índice antes de concluir o arquivamento.
- Validar que planos de ação ficam dentro de `specs/changes/NNN-slug/action-plans/`.
- Não registrar aceite de plano sem resposta explícita do usuário.
- Não gerar mensagem de commit para tarefa incompleta ou bloqueada.

## 17. Estratégia de testes

### 17.1 Testes do helper

Usar Vitest, já disponível no projeto, com ambiente Node e diretórios temporários. Nenhum teste deve escrever em `specs/changes/` real.

Casos obrigatórios:

1. Resolver tarefa única.
2. Normalizar `TASK-3` para `TASK-003`.
3. Resolver com `--change`.
4. Retornar candidatas em ambiguidade entre mudanças.
5. Falhar em tarefa inexistente.
6. Detectar tarefa apenas em arquivo arquivado.
7. Bloquear mudança com `proposal` não aprovado.
8. Bloquear mudança com `design` existente e não aprovado.
9. Bloquear mudança com `tasks` não aprovado.
10. `tasks.md` ausente retorna `E_PARSE`.
11. Arquivo sem tarefas retorna `E_PARSE`.
12. Cabeçalho de tarefa sem `TASK-NNN` retorna `E_PARSE`.
13. `TASK-NNN` duplicado no mesmo arquivo retorna `E_PARSE`.
14. Identificador malformado em `Depende de` retorna `E_PARSE`.
15. Conteúdo UTF-8 inválido retorna `E_PARSE`.
16. Markdown comum fora das tarefas é ignorado.
17. Dependências explícitas completas são aceitas.
18. Omissão de `Depende de` em mudança nova retorna `E_DEPENDENCY_UNDECLARED`, mesmo quando nenhuma tarefa declara o campo.
19. Modo legado sequencial é aplicado somente à change 001 pela allowlist.
20. `dependencySource: legacy-sequential` é exibido ao usuário.
21. Dependência inexistente retorna `E_DEPENDENCY_UNKNOWN`.
22. Dependência de si mesma é recusada.
23. Ciclo de dependências é recusado.
24. Dependência não concluída bloqueia a execução.
25. `next` retorna a primeira tarefa `PENDING`.
26. `next` retorna todas as tarefas abertas.
27. `next` retorna múltiplas mudanças candidatas.
28. `open` retorna uma tarefa aberta.
29. `open` retorna múltiplas tarefas abertas.
30. `start` somente em `PENDING`.
31. `start` em `IN PROGRESS` orienta `/continuespec`.
32. `begin-verify` somente em `IN PROGRESS`.
33. `verify` exige evidência.
34. `verify` grava `COMPLETED` + `VERIFIED`.
35. `fail` mantém a tarefa aberta.
36. Arquivamento bloqueado por tarefa `PENDING`.
37. Arquivamento bloqueado por `COMPLETED` sem `VERIFIED`.
38. Arquivamento bloqueado por `FAILED`.
39. Arquivamento bloqueado por plano `PENDING ACCEPTANCE`.
40. Arquivamento bloqueado por plano `REJECTED`.
41. Arquivamento permitido com todos os planos `RESOLVED`.
42. Falha de validação de arquivamento não move arquivos.
43. Caminho com `..` é recusado antes da movimentação.
44. Caminho absoluto é recusado antes da movimentação.
45. Link simbólico que escapa da mudança é recusado.
46. Destino existente é recusado antes da movimentação.
47. Arquivamento bem-sucedido move o diretório e preserva o conteúdo.
48. `action-plans/` e evidências são preservados.
49. Arquivamento executa `git add` somente nos caminhos exatos da mudança em repositório temporário.
50. `git add` não é executado quando a validação falha.
51. `/arquivespec TASK-ID` é recusado.
52. Caminho fora de `specs/changes/` é recusado.
53. `commit-message` gera mensagem para tarefa `COMPLETED` + `VERIFIED`.
54. `commit-message` recusa tarefa incompleta.
55. `action-plan` cria arquivo com `PENDING ACCEPTANCE` e caminho determinístico.
56. Plano `PENDING ACCEPTANCE` bloqueia conclusão da tarefa.
57. Plano `REJECTED` mantém a tarefa aberta.
58. Plano `RESOLVED` permite gerar mensagem de commit.
59. Arquivamento bloqueado por plano `PENDING ACCEPTANCE`, `ACCEPTED`, `IN EXECUTION` ou `REJECTED`.
60. Arquivamento permitido após todos os planos estarem `RESOLVED`.
61. Falha simulada de rename atômico não move arquivos e não executa `git add`.
62. `Status` desconhecido retorna `E_PARSE`.
63. `Verificação` desconhecida retorna `E_PARSE`.
64. Cabeçalho `### TASK-001` sem título retorna `E_PARSE`.
65. Bloco de código cercado não fechado retorna `E_PARSE`.
66. Título `###` sem `TASK` não encerra a tarefa anterior.
67. Cancelamento do usuário não cria plano de ação.
68. Alteração rastreada preexistente nos caminhos do manifesto bloqueia o arquivamento antes de mover.
69. Arquivos não rastreados só são staged após confirmação da lista exata.
70. Recusa de staging arquiva com `Staging Git: SKIPPED` e não executa `git add`.
71. Staging usa somente caminhos exatos do manifesto, sem diretório ou glob.
72. Falha de `git add` marca `Staging Git: FAILED` e não move novamente.
73. Arquivamento já movido com staging `PENDING` ou `FAILED` retoma apenas o staging.
74. Arquivamento já movido com staging `DONE` é reportado como concluído sem mover de novo.
75. Destino sem `archive-state.json` e sem `Status: ARCHIVED` retorna `E_ARCHIVE_STATE_UNKNOWN` e não é movido nem apagado.
76. Após o arquivamento, a versão final do `proposal.md` arquivado com `Status: ARCHIVED` e `Staging Git: DONE` está staged, confirmada por `git show :caminho`.
77. O `proposal.md` arquivado com `Staging Git: DONE` não fica pendente como alteração unstaged.
78. `archive-state.json` é gravado com `state: ARCHIVING` antes do rename.
79. `archive-state.json` é atualizado para `state: ARCHIVED` após o rename.
80. Interrupção simulada antes do rename deixa a origem com `archive-state.json` em `ARCHIVING`; a recuperação remove o arquivo de estado e permite arquivar de novo.
81. Interrupção simulada imediatamente depois do rename e antes de finalizar o `proposal.md` deixa o destino com `archive-state.json` em `ARCHIVING` e `proposal.md` sem `Status: ARCHIVED`; a recuperação completa os dois marcadores sem mover de novo.
82. Interrupção simulada depois de finalizar o `proposal.md` e antes de atualizar o `archive-state.json` deixa o destino com `proposal.md` em `Status: ARCHIVED` e `archive-state.json` em `ARCHIVING`; a recuperação trata o caso como interrompido, independentemente do `proposal.md` já atualizado, e completa os dois marcadores sem mover de novo.
83. Interrupção simulada depois de atualizar o `archive-state.json` e antes do staging deixa `archive-state.json` em `ARCHIVED` e `Staging Git: PENDING`; a recuperação executa apenas o staging.
84. Interrupção simulada no meio do staging deixa `Staging Git: FAILED`; a recuperação retoma apenas o staging dos caminhos exatos.
85. A recuperação com `ARCHIVING` e origem ausente nunca repete o rename, mesmo com o `proposal.md` já finalizado.
86. A recuperação com `ARCHIVING` e origem ausente preserva a data de arquivamento já existente no `proposal.md`.
87. A recuperação com `ARCHIVING` e origem ausente não rebaixa um marcador `Staging Git` já `DONE` ou `SKIPPED`.
88. Destino com `archive-state.json` em `ARCHIVING` e sem `Status: ARCHIVED` não retorna `E_ARCHIVE_STATE_UNKNOWN`.
89. Destino com `archive-state.json` em `ARCHIVING` e com `Status: ARCHIVED` também não retorna `E_ARCHIVE_STATE_UNKNOWN`.
90. Destino com `archive-state.json` ilegível retorna `E_ARCHIVE_STATE_UNKNOWN` e não é apagado.
91. `archive-state.json` nunca passa a `ARCHIVED` antes de o `proposal.md` estar finalizado.
92. Convergência do staging re-stagia o caminho exato do `proposal.md` quando o índice não contém `Staging Git: DONE`.
93. Falha de convergência registra `Staging Git: FAILED` e mantém a mudança movida.
94. A recuperação é idempotente: duas execuções seguidas não movem a mudança duas vezes e não duplicam staging.
95. A recuperação nunca executa `git reset`, `git checkout`, `git commit` ou `git push`.

### 17.2 Validação manual

- Executar `resolve TASK-003` contra a change 001 em modo somente leitura.
- Executar `resolve TASK-004` e confirmar dependência `TASK-003` com `dependencySource: legacy-sequential`.
- Executar `next` e confirmar a primeira tarefa `PENDING` da change 001.
- Executar `open` e confirmar que não há tarefa aberta.
- Confirmar que `check-archive 001-portfolio-mvp` lista as tarefas pendentes.
- Em diretório temporário, confirmar que falha de validação de arquivamento não move arquivos nem executa `git add`.
- Em diretório temporário, confirmar que alteração rastreada preexistente interrompe antes da movimentação.
- Em diretório temporário, simular falha de `git add`, confirmar `Staging Git: FAILED` e retomar sem mover novamente.
- Em diretório temporário, confirmar que o `proposal.md` arquivado com `Staging Git: DONE` aparece staged e não como alteração unstaged.
- Em diretório temporário, simular interrupção entre o rename e a finalização e confirmar que a recuperação conclui o arquivamento sem mover de novo.
- Em diretório temporário, simular interrupção depois de finalizar o `proposal.md` e antes de atualizar o `archive-state.json` e confirmar que a recuperação conclui o arquivamento sem mover de novo.
- Copiar a change 001 para um diretório temporário para testar transições sem alterar o original.
- Em diretório temporário, concluir uma tarefa e confirmar que a mensagem de commit é gerada.
- Em diretório temporário, criar um plano de ação, confirmar o bloqueio e liberar após `RESOLVED`.
- Confirmar que nenhum `git commit` ou `git push` é executado.
- Comparar `git diff -- specs/changes/001-portfolio-mvp` no final; deve estar vazio.

### 17.3 Verificações do projeto

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## 18. Documentação

`docs/rawspec-commands.md` é criado na TASK-001 com a seção “Baseline” e complementado na TASK-010. O conteúdo final deve conter:

- propósito dos três comandos;
- argumentos e flags;
- comportamento de `/startspec` sem argumento;
- pergunta de concorrência quando há tarefa aberta;
- pergunta de ambiguidade de tarefa ou mudança;
- exemplos de sucesso;
- exemplos de erro;
- modelo de status da mudança e da tarefa;
- regras de dependência explícita;
- modo legado sequencial da change 001 e significado de `dependencySource`;
- estruturas malformadas rejeitadas com `E_PARSE`;
- regra de aprovação humana;
- regra de evidência;
- formato da mensagem de commit gerada ao final de cada tarefa;
- exemplos de mensagem de commit;
- gatilhos de problema ou risco;
- template de plano de ação;
- fluxo de aceite, rejeição e resolução do plano;
- regra de bloqueio de arquivamento por plano não resolvido;
- política de arquivamento, incluindo validação completa antes de mover e confinamento de caminhos;
- inspeção do estado Git, decisão sobre alterações preexistentes e staging apenas de caminhos exatos;
- recuperação idempotente de arquivamento já movido e de staging `PENDING` ou `FAILED`;
- `archive-state.json` como marcação write-ahead do movimento e seus estados `ARCHIVING` e `ARCHIVED`;
- a ordem de finalização dos marcadores, `proposal.md` antes de `archive-state.json`, e o que a recuperação faz em cada estado intermediário;
- garantia de que a versão final do `proposal.md` arquivado, com `Staging Git: DONE`, fica staged, verificada contra o índice Git;
- política de Git, incluindo `git add` permitido e commit/push proibidos;
- diferença entre modo com `TASK-ID`, modo sem argumento e modo de arquivamento por mudança;
- solução de ambiguidade com `--change`.

Cada comando também deve ter frontmatter com `description` e `argument-hint`.

## 19. Clareza das tarefas

Não há cálculo percentual de clareza. Cada tarefa do `tasks.md` traz sua própria checklist com os oito critérios abaixo, marcada item a item.

Critérios de clareza:

1. Objetivo único e verificável.
2. Arquivos afetados explicitados.
3. Entregáveis concretos.
4. Contrato de entrada, saída e erros.
5. Testes obrigatórios listados.
6. Critério de aceitação objetivo.
7. Dependências declaradas explicitamente.
8. Nenhuma decisão pendente que exija interpretação do implementador.

Valores permitidos por item:

| Valor | Significado |
|---|---|
| `ATENDE` | O critério é satisfeito pela tarefa como está escrita. |
| `NÃO SE APLICA` | O critério não incide sobre a tarefa. Exige justificativa objective na mesma linha. |
| `NÃO ATENDE` | O critério incide e não é atendido. |

Regras da revisão:

- Todo item marcado `NÃO SE APLICA` precisa de justificativa que explique por que o critério não incide, sem recorrer a "não se aplica" genérico.
- Qualquer item marcado `NÃO ATENDE` impede a aprovação da tarefa e da mudança; não há nota ou percentual para compensar.
- A checklist é obligatoria: tarefa sem checklist é tratada como pendente.
- A revisão registra as decisões item a item, permitindo identificar objetivamente quando um critério não se aplica.

## 20. Implantação

1. Criar `docs/rawspec-commands.md` com o baseline e o contrato.
2. Implementar o parser e o resolvedor com testes.
3. Implementar gates de aprovação e dependências explícitas, com modo legado documentado.
4. Implementar seleção da próxima tarefa e perguntas de concorrência.
5. Implementar transições de estado e evidências.
6. Implementar mensagem de commit e planos de ação.
7. Implementar validação prévia, inspeção de Git, rename atômico, marcação write-ahead, staging exato, convergência verificada e recuperação idempotente.
8. Criar os três comandos.
9. Complementar `docs/rawspec-commands.md`.
10. Validar com testes, build e smoke test somente leitura na change 001.

Nenhuma etapa faz commit ou push sem autorização explícita.

## 21. Decisões confirmadas

- Comandos não existem; serão criados.
- `/startspec` sem argumento inicia a próxima tarefa pendente.
- Tarefa aberta exige pergunta antes de iniciar outra.
- Ambiguidade é decidida pelo usuário.
- `design.md` aprovado é obrigatório quando existir.
- Arquivamento pode executar `git add`, mas não commit/push.
- A clareza usa checklist binário de oito critérios, sem percentual.
- Dependências são explícitas em mudanças que usam o campo; a change 001 opera em modo legado sequencial.
- O arquivamento conclui todas as validações antes de mover e confina os caminhos à mudança correta.
- O staging inspeciona o estado Git e nunca inclui alterações preexistentes sem decisão explícita.
- O arquivamento usa rename atômico e recuperação idempotente; não repete movimentação já concluída.
- O arquivamento grava `archive-state.json` antes do rename, para que uma interrupção entre o movimento e a marcação seja recuperável.
- A ordem dos marcadores é `proposal.md` antes de `archive-state.json`; o `archive-state.json` só vira `ARCHIVED` depois do `proposal.md` finalizado.
- O sucesso do arquivamento exige que a versão final do `proposal.md`, com `Staging Git: DONE`, esteja no índice Git.
- Cada tarefa do plano traz checklist própria dos oito critérios, com `ATENDE` ou `NÃO SE APLICA` justificado.
- Planos de ação são reservados a riscos reais; cancelamento e ambiguidade pendente apenas interrompem.
- Toda tarefa concluída gera mensagem de commit; o commit é executado pelo humano.
- Problema ou risco que possa comprometer o projeto gera plano de ação para aceite.
- Arquivamento exige planos de ação resolvidos.
