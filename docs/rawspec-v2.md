# RawSpec v2

Referência do formato das especificações: uma tarefa por arquivo, arquivamento individual após aprovação, histórico obrigatório, baixo acoplamento e total modificabilidade.

## 1. Princípios

1. Markdown versionado é a única fonte de verdade.
2. Uma tarefa por arquivo.
3. Aprovação é humana.
4. Ambiguidade é resolvida pelo usuário.
5. Escrita mínima e atômica.
6. Sem destruição.
7. Commit e push automáticos só na sequência da branch por tarefa (§15 e ADR-005), com os gates cumpridos e sem `--no-verify`.
8. Histórico obrigatório e append-only.
9. Baixo acoplamento: um único parser compartilhado.
10. Modificabilidade: templates e documentação versionados.

## 2. Layout

```text
specs/
  changes/
    NNN-slug/
      proposal.md
      design.md              (opcional)
      tasks/
        TASK-001.md
        archive/
          TASK-001.md
      action-plans/
        TASK-001-YYYY-MM-DD-slug.md
    archive/
      NNN-slug/
  templates/
    task.md
    proposal.md
    design.md
    action-plan.md
    history-entry.md
docs/
  history.md
  decisions/
    ADR-NNN-slug.md
scripts/
  rawspec-v2.mjs
  rawspec-v2.test.mjs
.opencode/
  commands/
```

## 3. Tarefa

### 3.1 Arquivo

`specs/changes/NNN-slug/tasks/TASK-NNN.md`

### 3.2 Campos

```markdown
# TASK-NNN — Título

- Change: NNN-slug
- Status: PENDING
- Depende de: nenhuma
- Início: —
- Verificação: PENDING
- Evidência: —
- Plano de ação: none
```

| Campo | Obrigatório | Valores |
|---|---|---|
| `Change` | Sim | identificador da mudança |
| `Status` | Não (default `PENDING`) | `PENDING`, `IN PROGRESS`, `VERIFYING`, `COMPLETED`, `ARCHIVED` |
| `Depende de` | Sim | `TASK-NNN`, lista separada por vírgulas, `nenhuma` ou `—` |
| `Início` | Não | `YYYY-MM-DD` ou `—` |
| `Verificação` | Não (default `PENDING`) | `PENDING`, `VERIFIED`, `FAILED` |
| `Evidência` | Não | texto ou `—` |
| `Plano de ação` | Não | caminho ou `none` |
| `Arquivada em` | Não | `YYYY-MM-DD`, incluído ao arquivar |

### 3.3 Ciclo de vida

```text
PENDING -> IN PROGRESS -> VERIFYING -> COMPLETED -> ARCHIVED
```

Falha de verificação: `VERIFYING` volta para `IN PROGRESS` com `Verificação: FAILED (data) — motivo`.

### 3.4 Conteúdo

Seções: `Objetivo`, `Arquivos`, `Entregáveis`, `Regras`, `Testes`, `Aceitação`, `Checklist de clareza`.

## 4. Arquivamento de tarefa

Pré-condições:

- `Status: COMPLETED` e `Verificação: VERIFIED`;
- nenhum plano de ação não resolvido;
- aprovação humana explícita.

Sequência:

1. Validar as pré-condições.
2. Obter a aprovação do usuário.
3. Marcar `Status: ARCHIVED` e `- Arquivada em: YYYY-MM-DD`.
4. Mover atomicamente para `tasks/archive/TASK-NNN.md`.
5. Se não restarem tarefas em aberto, arquivar a mudança.

## 5. Mudança

### 5.1 Status

`proposal.md`: `PENDING APPROVAL`, `APPROVED`, `SUPERSEDED`, `ARCHIVED`.

### 5.2 Arquivamento

Pré-condições:

- Todas as tarefas em `tasks/archive/` com `Status: ARCHIVED`;
- Todos os planos de ação em `RESOLVED`;
- Aprovação humana explícita.

A mudança vai para `specs/changes/archive/NNN-slug/` e o `proposal.md` recebe `Status: ARCHIVED` e `- Arquivada em: YYYY-MM-DD`.

## 6. Histórico e decisões

### 6.1 `docs/history.md`

Append-only. Nunca reescrever entradas. Formato:

```markdown
## YYYY-MM-DD — <Tipo> — <Título>

- Autor: <nome>
- Origem: <sessão ou comando>
- Decisão: <texto>
- Motivo: <texto>
- Impacto: <texto>
- Evidência: <texto>
```

Tipos: `Decisão`, `Evento`, `Detalhe`.

### 6.2 ADRs

`docs/decisions/ADR-NNN-slug.md` com `Status`, `Contexto`, `Alternativas consideradas`, `Decisão`, `Justificativa` e `Consequências`.

## 7. Comandos

| Comando | Responsabilidade |
|---|---|
| `/startspec [TASK-ID] [--change CHANGE-ID]` | Inicia tarefa `PENDING`. |
| `/continuespec [TASK-ID] [--change CHANGE-ID]` | Continua, regista a evidência de verificação e conclui com `commit-task`, que abre o pull request. |
| `/arquivespec TASK-ID [--change CHANGE-ID]` | Arquiva tarefa após aprovação. |
| `/archivespec [CHANGE-ID]` | Arquiva mudança elegível. |
| `/logspec ...` | Registra histórico. |

Regras comuns: resolver antes de agir, perguntar em ambiguidade, validar aprovação e dependências, nunca alterar aprovação, nunca fazer commit ou push fora do `commit-task` (§15).

## 8. Migração de mudanças legadas

- Dividir `tasks.md` em `tasks/TASK-NNN.md`.
- Preservar `Status`, `Verificação`, `Evidência`, `Plano de ação` e conteúdo.
- Derivar `Depende de` pela ordem do arquivo.
- Mover tarefas `COMPLETED` para `tasks/archive/`.
- Remover `tasks.md` após validação pelo parser v2.

## 9. Política de Git

- Nenhum commit ou push automático sem a sequência da branch por tarefa (ADR-005).
- Staging apenas em caminhos exactos: os declarados na secção `## Arquivos` da task e os ficheiros de especificação que a CLI actualizou.
- Um ficheiro tocado fora do âmbito bloqueia o commit com `E_SCOPE_VIOLATION`.
- Nenhuma reescrita de histórico.

## 10. Verificações

Automáticas, executadas pelo `commit-task` por esta ordem (§15.2):

1. `pnpm lint`
2. `pnpm typecheck`
3. `pnpm test`
4. `pnpm build`

Manuais, executadas pelo agente `executor` no fluxo padrão, antes da revisão e do registo, por esta ordem:

1. `pnpm test`
2. `pnpm test:e2e`

`pnpm test:e2e` executa `pnpm build` antes do Playwright, porque o `vite preview` serve `dist/`, que é ignorado pelo Git e não existe num clone novo.

O `executor` devolve a evidência de cada comando: o comando exacto, o código de saída e a saída relevante. O verificador avalia-a sem executar shell. Os hooks do Husky podem repetir parte das verificações automáticas (§15.3).

A formatação com Prettier é aplicada pelo hook `pre-commit` (lint-staged) aos arquivos preparados; não é uma verificação manual.

## 11. CLI e exemplos

Todas as operações usam `scripts/rawspec-v2-cli.mjs`, que chama o helper compartilhado `scripts/rawspec-v2.mjs`.

```bash
# consulta
node scripts/rawspec-v2-cli.mjs resolve TASK-005 --change 001-portfolio-mvp
node scripts/rawspec-v2-cli.mjs next --change 001-portfolio-mvp
node scripts/rawspec-v2-cli.mjs open

# execução
node scripts/rawspec-v2-cli.mjs start TASK-005 --change 001-portfolio-mvp
node scripts/rawspec-v2-cli.mjs begin-verify TASK-005
node scripts/rawspec-v2-cli.mjs verify TASK-005 --evidence "testes aprovados"
node scripts/rawspec-v2-cli.mjs fail TASK-005 --evidence "lint falhou"
node scripts/rawspec-v2-cli.mjs commit-message TASK-005
node scripts/rawspec-v2-cli.mjs commit-task TASK-005 --change 001-portfolio-mvp
node scripts/rawspec-v2-cli.mjs open-pr TASK-005 --change 001-portfolio-mvp

# arquivamento
node scripts/rawspec-v2-cli.mjs check-archive-task TASK-005
node scripts/rawspec-v2-cli.mjs archive-task TASK-005 --approved
node scripts/rawspec-v2-cli.mjs check-archive-change 001-portfolio-mvp
node scripts/rawspec-v2-cli.mjs archive-change 001-portfolio-mvp --approved

# migração e histórico
node scripts/rawspec-v2-cli.mjs migrate-change 001-portfolio-mvp
node scripts/rawspec-v2-cli.mjs log --type "Decisão" --title "Título" --message "Texto"
```

## 12. Mensagem de commit

Formato gerado por `commit-message`:

```text
<type>(rawspec): <summary>

Change: <change-id>
Task: <TASK-ID>
Tests: <comandos executados>
Evidence: <resumo do resultado>
Action-Plan: <caminho ou none>
```

`type` aceita `feat`, `fix`, `refactor`, `test`, `docs`, `chore` e `build`. A mensagem é uma saída do comando; nenhum commit é executado. No `commit-task`, a linha `Tests:` lista as verificações efetivamente executadas, por ordem.

## 13. Catálogo de erros

| Código | Significado |
|---|---|
| `E_ARGS` | Argumento inválido ou flag desconhecida. |
| `E_PARSE` | Estrutura RawSpec malformada ou formato legado não migrado. |
| `E_TASK_NOT_FOUND` | Tarefa inexistente. |
| `E_TASK_AMBIGUOUS` | Mesmo ID em mais de uma mudança. |
| `E_TASK_ARCHIVED` | Tarefa só existe em arquivo. |
| `E_CHANGE_NOT_FOUND` | Mudança inexistente. |
| `E_CHANGE_AMBIGUOUS` | Mais de uma mudança corresponde ao identificador. |
| `E_CHANGE_NOT_APPROVED` | Mudança não aprovada. |
| `E_DEPENDENCY_PENDING` | Dependência não concluída/verificada. |
| `E_DEPENDENCY_UNDECLARED` | Tarefa sem `Depende de`. |
| `E_DEPENDENCY_UNKNOWN` | Dependência inexistente. |
| `E_DEPENDENCY_CYCLE` | Autodependência ou ciclo. |
| `E_TASK_STATE` | Estado de task inválido; `details.reason` identifica a causa, incluindo `task_not_verified`, `branch_mismatch`, `commit_metadata_mismatch`, `no_eligible_commit`, `merge_commit_ineligible`, `no_changes_to_commit` e `merge_in_progress`. |
| `E_EVIDENCE_REQUIRED` | Verificação sem evidência. |
| `E_APPROVAL_REQUIRED` | Aprovação humana ausente. |
| `E_ARCHIVE_TASK_BLOCKED` | Tarefa não elegível para arquivamento. |
| `E_ARCHIVE_CHANGE_BLOCKED` | Mudança não elegível para arquivamento. |
| `E_ARCHIVE_STATE_UNKNOWN` | Destino de arquivamento ambíguo. |
| `E_COMMIT_MESSAGE_BLOCKED` | Tarefa incompleta para gerar commit. |
| `E_ACTION_PLAN_UNRESOLVED` | Plano de ação não resolvido. |
| `E_PATH_ESCAPE` | Caminho fora do repositório. |
| `E_IO` | Falha de gravação atômica. |
| `E_HISTORY_INVALID` | Entrada de histórico inválida. |
| `E_ADR_EXISTS` | ADR duplicado. |
| `E_SCOPE_VIOLATION` | Há ficheiros tocados fora do âmbito declarado na secção `## Arquivos` da task. |
| `E_GIT_ERROR` | Comando Git falhou; no publish-existing, `details.reason` distingue `remote_not_found`, `remote_unavailable`, `remote_ahead` e `remote_diverged`. |
| `E_PR_UNAVAILABLE` | O GitHub CLI está ausente ou indisponível, a procura de pull request falhou, a resposta é inválida ou o URL do remote não identifica um repositório GitHub suportado. |
| `E_PR_CREATE_FAILED` | O GitHub CLI executou a criação, mas a criação do pull request falhou ou não devolveu uma URL legível. |

Os erros de pull request terminam a CLI com o código de saída `8`. Todos os
outros erros mantêm os códigos da secção anterior.

## 14. Validação ponta a ponta

A suíte de testes inclui um fluxo completo em diretório temporário que:

1. inicia uma tarefa;
2. marcação para verificação;
3. conclui com evidência;
4. arquiva a tarefa;
5. repete para a tarefa seguinte;
6. arquiva a mudança quando todas estiverem arquivadas.

Executar `pnpm test` valida esse fluxo sem escrever em `specs/changes/` real.

## 15. Branch por tarefa e commit/push

Toda tarefa é executada em sua própria branch e, ao concluir, pode ser commitada e enviada automaticamente.

### 15.1 Nomenclatura

```text
task/<prefixo-da-mudança>-<número-da-tarefa>-<slug-do-título>
```

Exemplo: `task/001-005-implementar-secao-inicial`.

### 15.2 Fluxo

1. `/startspec` resolve a tarefa e cria a branch com `create-branch`.
2. A tarefa é iniciada com `start`.
3. Ao concluir a implementação, a tarefa passa a `VERIFYING` com `begin-verify`. O agente `executor` executa `pnpm test` e `pnpm test:e2e`, por esta ordem, e devolve a evidência. O verificador avalia-a sem executar shell.
4. Depois das revisões, o `guardiao` regista a verificação com `verify` (`COMPLETED` + `VERIFIED`) e executa `commit-task`.
5. `commit-task` roda `pnpm lint`, `pnpm typecheck`, `pnpm test` e `pnpm build`, por esta ordem. Se uma falhar, para e não há commit nem push.
6. Se passarem, faz o gate de âmbito. Com alterações, faz `git add` com caminhos explícitos, `git commit` com a mensagem gerada e `git push -u origin <branch>`. Com a worktree limpa, aplica o publish-existing (§15.7), sem criar commit.
7. Depois de um push bem-sucedido, ou quando o remote já aponta para `HEAD`, a automação abre ou reutiliza o pull request da branch para `main` (§15.6–15.7).
8. O relatório indica a branch, o resultado do push, o URL do pull request e a próxima task a realizar.
9. A próxima task é obtida com `node scripts/rawspec-v2-cli.mjs next`, primeiro na change da task e depois nas restantes changes aprovadas. É informação para o utilizador: não altera o estado de nenhuma task.

Se a evidência falhar ou uma revisão reprovar, o `guardiao` regista `fail` com o motivo, e a tarefa volta a `IN PROGRESS`.

### 15.2.1 Gate de âmbito

O `commit-task` compara os ficheiros tocados com o âmbito da task:

- os ficheiros declarados na secção `## Arquivos`;
- os ficheiros de especificação que a CLI actualizou: o ficheiro da task, o plano de acção e `docs/history.md`.

Um ficheiro fora do âmbito bloqueia o commit com `E_SCOPE_VIOLATION`, que lista os ficheiros culpados. Nada é descartado: a decisão sobre cada ficheiro é do utilizador.

O gate existe porque as permissões de caminho do OpenCode não são uma barreira. Uma escrita feita por shell contorna a negação de edição, e o gate é aplicado depois da acção e antes do commit.

### 15.3 Hooks do Husky

- `pre-commit`: `lint-staged` (ESLint + Prettier nos arquivos staged).
- `pre-push`: `pnpm typecheck`, `pnpm test`, `pnpm build`.

Os hooks são sempre executados, podem repetir verificações já feitas pelo `commit-task` e bloqueiam commit ou push em caso de falha. Não são contornados com `--no-verify`.

### 15.4 Regras

- A branch é criada antes de iniciar a tarefa.
- Branch existente retorna `E_BRANCH_EXISTS` e não é substituída.
- Falha de verificação impede o commit.
- O arquivamento de tarefa também é commitado na mesma branch.
- Nenhuma operação destrutiva é executada.

### 15.5 Erros

| Código | Significado |
|---|---|
| `E_BRANCH_EXISTS` | A branch da tarefa já existe. |
| `E_GIT_ERROR` | Comando Git falhou; no publish-existing, `details.reason` distingue `remote_not_found`, `remote_unavailable`, `remote_ahead` e `remote_diverged`. |
| `E_CHECKS_FAILED` | `lint`, `typecheck`, `test` ou `build` falhou. |
| `E_TASK_STATE` | A tarefa não está concluída e verificada ou falhou uma condição de elegibilidade do publish-existing; consulte `details.reason`. |

### 15.6 Pull request automático

Depois do commit e do push bem-sucedidos, o `commit-task` abre o pull request da
branch da tarefa para `main`, com o GitHub CLI:

```bash
gh pr create --base main --head <branch> --title "<título>" --body "<corpo>"
```

Regras:

- O pull request é sempre aberto para `main`, com `--base` e `--head` explícitos.
- A criação é idempotente. Antes de criar, o `commit-task` procura um pull request
  aberto para a branch, com `gh pr list --head <branch> --base main --state open
  --json number,url,state,title`; se existir, devolve o URL, o número e o título
  existentes, com `status: existing`, e não cria duplicado.
- A resposta da procura tem de ser válida. Só um array JSON válido e vazio
  significa "não há pull request". Uma resposta inválida — saída vazia, JSON
  inválido, JSON que não é um array, ou um array com elementos malformados — é
  reportada com `E_PR_UNAVAILABLE`, e a criação não prossegue. Sem esta guarda, uma
  resposta inválida seria lida como "não há pull request" e criaria um duplicado.
- A distinção entre `E_PR_UNAVAILABLE` e `E_PR_CREATE_FAILED` segue a fase da
  operação: procura, execução ou disponibilidade do `gh` são indisponibilidade;
  uma falha de `gh pr create` depois de o processo ter sido executado é falha de
  criação. A ausência do `gh` durante a criação também é `E_PR_UNAVAILABLE`.
- Cada elemento da lista é validado antes de ser aceite: `url` tem de ser uma
  string não vazia, `number` tem de ser um inteiro positivo, e `state` e `title`
  têm de ser strings quando presentes. O `number` é validado pelo tipo, sem
  coerção: `null`, `true`, `false`, a string vazia, uma string numérica, `0`, um
  número negativo e um decimal são todos recusados com `E_PR_UNAVAILABLE` e
  `reason: malformed_entry`. Sem esta validação, um pull request inexistente
  seria reportado como existente.
- O pull request nunca é fundido automaticamente. A revisão e a integração são
  decisões do utilizador.
- O `commit-task` só abre o pull request depois de o push ter sido bem-sucedido.
  Sem push, não há pull request.
- A flag `--no-pr` desactiva a abertura automática. O comando `open-pr` abre o
  pull request de uma tarefa à parte, com o mesmo comportamento idempotente.
- As flags booleanas da CLI (`--no-push`, `--no-pr`, `--approved`, `--adr`)
  aceitam a forma explícita `--flag=true` e `--flag=false`. Sem o sufixo, a
  flag é verdadeira. Nenhuma delas consome o argumento seguinte.
- Um pull request da branch base para ela própria é recusado com `E_ARGS`, antes
  de qualquer chamada ao GitHub CLI.

Falha do pull request:

- Se o `gh` estiver ausente ou indisponível, a procura falhar, ou a resposta da
  procura for inválida, o erro é reportado com `E_PR_UNAVAILABLE`.
- Se o `gh` tiver executado `pr create` e a criação falhar ou não devolver uma
  URL legível, o erro é reportado com `E_PR_CREATE_FAILED`.
- A falha **não** desfaz o commit nem o push, e **não** reprova a verificação da
  tarefa. O resultado do `commit-task` traz `pullRequest.status` com o valor
  `failed` e o erro correspondente.

O `commit-task` devolve no seu resultado:

```json
{
  "branch": "task/001-004-titulo",
  "commit": "b21a55c",
  "pushed": true,
  "pullRequest": {
    "status": "created",
    "url": "https://github.com/carloshsales/portifolio/pull/20",
    "number": 20,
    "branch": "task/001-004-titulo",
    "base": "main",
    "title": "001-portfolio-mvp — TASK-004 — Título"
  }
}
```

`status` aceita `created`, `existing` e `failed`. Com `existing`, o `title` é o
título do pull request já aberto.

### 15.7 Publicação idempotente de commit existente

O `commit-task` preserva o fluxo staged normal. Quando `git status
--porcelain --untracked-files=all` indica uma árvore limpa, pode publicar um
commit existente da task, sem executar `git add` nem `git commit`. Esta via
existe para recuperar commits RawSpec locais que ficaram sem push; a falha
anterior ocorria porque o fluxo tentava `git commit` sem ficheiros staged, e o
hook `pre-commit` falhava no `lint-staged` antes de chegar ao push.

Pré-condições cumulativas:

- task `COMPLETED` e `VERIFIED`;
- branch corrente igual à branch canónica da task; se `--branch` for dado,
  também tem de corresponder à branch corrente;
- nenhum `MERGE_HEAD`;
- `HEAD` é um commit da task com exactamente um `Change: <change-id>` e um
  `Task: <task-id>` nos metadados da mensagem;
- todos os commits a publicar têm esses metadados, não são commits de merge e
  alteram apenas caminhos declarados em `## Arquivos` ou ficheiros de
  especificação permitidos pelo gate;
- remote configurado e fetch verificável.

Antes de decidir o push, o helper consulta o remote com `git ls-remote` e busca
apenas o ref de que precisa. Se a branch remota da task existir, busca o ref
exacto e usa-o como base. Se não existir, usa exclusivamente
`refs/remotes/<remote>/main`; não recua para `main` local. O fetch dirigido ao
ref exacto é também a prova de que o remote está disponível: um fetch que falha
significa que o remote não pode ser verificado. Um remote ou ref indisponível
falha fechado, sem push nem PR. A validação do range é determinística: todos os
commits em `<base>..HEAD` são examinados.

Comportamento do estado remoto:

- Branch remota ausente e range vazio: `E_TASK_STATE` com
  `details.reason: no_eligible_commit`; não cria commit vazio, push ou PR.
- Branch remota ausente e range elegível: publica o `HEAD` existente com
  `git push -u <remote> <branch>`.
- Branch remota ancestral de `HEAD`: valida e publica apenas o avanço
  fast-forward.
- Branch remota igual a `HEAD`: já publicado; não repete o push (`pushed:
  false`), mas procura/cria o PR de forma idempotente. O PR continua a ser
  aberto porque a branch já está publicada: o que se repete é a publicação, não
  a abertura do pull request.
- Branch remota à frente ou divergente: `E_GIT_ERROR` com
  `remote_ahead` ou `remote_diverged`; nunca faz force-push nem abre PR.
- Commit de merge no range: `E_TASK_STATE` com
  `merge_commit_ineligible`; caminho fora do âmbito: `E_SCOPE_VIOLATION`.

O push usa o hook `pre-push` normal. O caminho limpo não chama `git commit`,
portanto não dispara `lint-staged` sem staged files. `--no-push` suprime push e
PR e, com isso, todo o contacto com o remote: não há `git fetch`, nem
inspecção do estado remoto, porque sem publicação não há nada a preparar. Com
`--no-push`, a elegibilidade é validada apenas localmente, sobre o `HEAD` e o
seu diff. `--no-pr` suprime apenas o PR, mantendo o push e a inspecção do
remote.

O caminho com alterações continua a executar checks, gate, staging explícito,
commit e push; alterações fora do âmbito continuam a bloquear com
`E_SCOPE_VIOLATION`, e ausência de alterações committable no âmbito devolve
`E_TASK_STATE` com `details.reason: no_changes_to_commit`. Uma alteração já
presente no índice conta como alteração: o caminho limpo só é considerado
quando o índice e a worktree estão ambos sem alterações.

Nos PRs de `commit-task`, `--remote` determina tanto fetch/push como o repositório
GitHub. URLs HTTPS e SSH suportados são convertidos para `owner/repo` e passados
explicitamente em `gh pr list/create --repo owner/repo`. O owner e o nome do
repositório são validados antes de serem passados ao GitHub CLI. Um remote com
vários URLs usa o primeiro que identifique um repositório GitHub. Remote não
GitHub, URL não suportado ou `gh` indisponível produzem
`pullRequest.status: failed` com `E_PR_UNAVAILABLE`, sem desfazer um push
bem-sucedido. A falha de criação depois de uma chamada válida mantém a
classificação `E_PR_CREATE_FAILED`.

Se o remote mudar entre a inspecção e o push, o push falha e o estado remoto é
reinspeccionado. Se o remote tiver ficado à frente ou divergido, o erro
reportado é `remote_ahead` ou `remote_diverged`, e não um erro Git genérico.

O resultado de sucesso mantém o formato:

```json
{
  "branch": "task/014-001-publicar-commit-existente-elegivel-com-commit-task-idempoten",
  "commit": "abc1234",
  "pushed": true,
  "pullRequest": null
}
```
