# TASK-001 — Publicar commit existente elegível com commit-task idempotente

- Change: 014-publicar-commit-existente
- Status: ARCHIVED
- Depende de: nenhuma
- Início: 2026-11-24
- Verificação: VERIFIED (2026-11-24) — pnpm test: 307 passed | 1 skipped (308) em 6 ficheiros, exit 0 (2026-11-24); pnpm test:e2e: 73 passed | 2 skipped (75), exit 0 (2026-11-24). Publicação idempotente de commit existente no caminho limpo: sem commit vazio, sem force-push, pre-push activo, PR idempotente com owner/repo resolvido de URLs HTTPS e SSH, e --no-push sem contacto com o remote. Cobertura: 29 testes do caminho limpo e 21 de commit-task na CLI. Revisões A e B aplicadas e verificadas: alterações já staged seguem o fluxo normal; checks terminam antes do push; gate de âmbito e metadados Change:/Task: validados em todos os commits do range (commit inválido anterior com HEAD válido); remote ausente/igual/ancestor/ahead/divergente/indisponível; branch inválida e branch_mismatch recusados; E_PR_CREATE_FAILED preserva o push; reinspecção do remote em caso de corrida TOCTOU.
- Evidência: pnpm test: 307 passed | 1 skipped (308) em 6 ficheiros, exit 0 (2026-11-24); pnpm test:e2e: 73 passed | 2 skipped (75), exit 0 (2026-11-24). Publicação idempotente de commit existente no caminho limpo: sem commit vazio, sem force-push, pre-push activo, PR idempotente com owner/repo resolvido de URLs HTTPS e SSH, e --no-push sem contacto com o remote. Cobertura: 29 testes do caminho limpo e 21 de commit-task na CLI. Revisões A e B aplicadas e verificadas: alterações já staged seguem o fluxo normal; checks terminam antes do push; gate de âmbito e metadados Change:/Task: validados em todos os commits do range (commit inválido anterior com HEAD válido); remote ausente/igual/ancestor/ahead/divergente/indisponível; branch inválida e branch_mismatch recusados; E_PR_CREATE_FAILED preserva o push; reinspecção do remote em caso de corrida TOCTOU.
- Plano de ação: none
- Arquivada em: 2026-11-24

## Objetivo

Implementar no RawSpec uma publicação idempotente, através de `commit-task`, de um commit de task já existente localmente, quando a worktree e o índice estão limpos, sem criar commit vazio, com checks e gate de âmbito, pre-push hooks activos e PR idempotente. Reportar no-op/erro inequívoco nos casos não elegíveis. Preservar o fluxo normal com alterações staged.

## Arquivos

- `scripts/rawspec-v2.mjs` (alterar helper commit/push existente)
- `scripts/rawspec-v2-cli.mjs` (alterar apenas se necessário para resultados/erros definidos)
- `scripts/rawspec-v2.test.mjs` (regressões helper)
- `scripts/rawspec-v2-cli.test.mjs` (integração CLI/Git/hooks)
- `docs/rawspec-v2.md` (documentar comportamento)
- `docs/history.md` (append-only via RawSpec/CLI no fecho; não edição manual pelo implementador)
- `specs/changes/014-publicar-commit-existente/proposal.md` (versionar a proposta aprovada, sem alterar o conteúdo)
- `.husky/pre-push`, `.husky/pre-commit`, `package.json` (leitura/execução read-only; não alterar sem decisão humana)

## Contrato de elegibilidade

Razões de erro (details.reason):
- `E_TASK_STATE`: `task_not_verified`, `branch_mismatch` (só clean path), `commit_metadata_mismatch`, `no_eligible_commit` (remote ausente + range vazio), `merge_commit_ineligible`, `no_changes_to_commit` (dirty sem paths in-scope), `merge_in_progress`.
- `E_SCOPE_VIOLATION`: `details.outOfScope` (paths fora do scope, normal e publish-existing).
- `E_GIT_ERROR`: `remote_not_found` (alias não configurado: `git remote get-url <remote>` falha), `remote_unavailable` (remote existe mas fetch falha ou `<remote>/main` base indisponível), `remote_ahead`, `remote_diverged`.
Publish-existing só pode correr quando a worktree e o índice estão limpos e não há `MERGE_HEAD`. Adicionalmente, a task tem de estar `COMPLETED` e `VERIFIED`, a branch corrente tem de corresponder à task (`task/NNN-NNN-slug`), e o `HEAD` tem de conter um commit local gerado para o mesmo Task/Change, com metadados de commit-message validados (`Change:`/`Task:` exactos). O diff do commit tem de passar o gate de âmbito (scope + spec files).

Cálculo do range de commits elegíveis (determinístico):
- Antes de decidir publish-existing: `git fetch <remote>` actualizado. Se fetch/validação indisponível -> `E_GIT_ERROR` reason `remote_unavailable`, sem push/PR.
- Se a branch remota não existe: usar exclusivamente `refs/remotes/<remote>/main` como base do range. Se existir: fetch do ref exacto `refs/remotes/<remote>/<branch>` e base = `refs/remotes/<remote>/<branch>`. Range exacto é `<base>..HEAD`. Refs ausentes/inválidas -> fail-closed `E_GIT_ERROR` reason claro. Não existe fallback para `main` local.
- Validar TODOS os commits no range: metadata `Change:`/`Task:` exactos e diff de cada commit dentro do scope + spec files. Commit de merge no range é inelegível/fail-closed (`E_TASK_STATE` reason `merge_commit_ineligible`).
- Range vazio comporta-se de forma distinta conforme o estado remoto:
  - Branch remota ausente e `<remote>/main..HEAD` vazio -> `E_TASK_STATE` reason `no_eligible_commit`, sem commit vazio/push/PR.
  - Branch remota existente e `<remote>/<branch> == HEAD` -> já publicado: NÃO é `no_eligible_commit`; não duplicar push (`pushed:false`), mas garantir PR idempotente.
- Se a branch remota faltar, a base é exclusivamente `<remote>/main` (sem fallback para `main` local).

TODO o commit a publicar tem de ser não-merge, conter `Change:` e `Task:` exactos e ter diff dentro do scope + spec files. Se existir um commit de merge no range => `E_TASK_STATE` com `reason: merge_commit_ineligible` (fail-closed). Se os metadados, a branch ou a task forem inválidos => `E_TASK_STATE` com reason definido. Se houver ficheiros fora do scope => `E_SCOPE_VIOLATION`.

Elegível (todas cumulativas):

- Task `COMPLETED` e `VERIFIED`.
- Branch corrente corresponde à task (`task/NNN-NNN-slug`).
- `HEAD` contém um commit local gerado para o mesmo Task/Change, com metadados de commit-message validados (`Change:`/`Task:` exactos).
- O diff do commit passa o gate de âmbito (scope + spec files).
- Índice e worktree sem alterações tracked staged/unstaged nem untracked.
- Não há merge activo.

Comportamento quando elegível (clean-tree path):

- `commit-task` corre `pnpm lint` → `pnpm typecheck` → `pnpm test` → `pnpm build` e o gate de âmbito.
- Sem staged changes, NÃO chama `git commit` nem cria commit vazio.
- Executa push do commit existente com pre-push hooks activos.
- Abre ou reutiliza PR idempotente.

Push conforme estado remoto (fail-closed):

- Remote branch ausente: base do range é `<remote>/main` (exclusivamente; sem fallback para `main` local). Se `<remote>/main..HEAD` não vazio e elegível, `git push -u` do HEAD existente. Se `<remote>/main..HEAD` vazio -> `E_TASK_STATE` reason `no_eligible_commit`, sem push/PR.
- Remote branch existente: fetch do ref exacto `<remote>/<branch>` antes de decidir.
  - `<remote>/<branch> == HEAD`: já publicado; não duplicar push (`pushed:false`); garantir PR idempotente (created/existing).
  - `<remote>/<branch>` é ancestor de HEAD: validar `<remote>/<branch>..HEAD` e push fast-forward; `pushed:true` + PR.
  - HEAD é ancestor de `<remote>/<branch>`: `E_GIT_ERROR` reason `remote_ahead`; sem force-push nem PR.
  - Remoto e HEAD divergiram: `E_GIT_ERROR` reason `remote_diverged`; sem force-push nem PR.
  - Estado não verificável/fetch indisponível: `E_GIT_ERROR` reason `remote_unavailable`; sem push/PR.

Sem commit elegível:

- Task incompleta, metadados task/change incompatíveis ou branch errada: falhar com `E_TASK_STATE` claro; sem push/PR.
- Clean tree mas sem commit elegível: devolver `E_TASK_STATE` com `reason: no_eligible_commit`, sem commit vazio, push ou PR.

Árvores sujas (staged/unstaged/untracked):

- NÃO usar publish-existing; preservar fluxo staged normal, gate e hooks activos.
- Seguir fluxo normal `commit-task`: gate, staging explícito de paths autorizados, commit, push/PR.
- Out-of-scope continua `E_SCOPE_VIOLATION`.
- Nenhum `--no-verify`; o no-stage `lint-staged` não é tratado como fatal quando não há commit a criar; pre-push permanece activo.
- Se não houver alteração in-scope commitable => `E_TASK_STATE` com `reason: no_changes_to_commit`, sem commit/push/PR.

Merge activo:
- Não usar publish-existing; devolver `E_TASK_STATE` reason `merge_in_progress`, sem commit/push/PR.

Opções CLI:
- `--remote` (default `origin`): usado de forma consistente para `git fetch`, refs remotas e push. Base de comparação `<remote>/main` quando a branch remota da task não existe; branch remota da task usa `<remote>/<taskBranch>`. Fetch/ref indisponível -> `E_GIT_ERROR` reason `remote_unavailable`, sem push/PR.
- `--branch`: em publish-existing, o valor (se fornecido) tem de corresponder à branch local elegível; mismatch -> `E_TASK_STATE` reason `branch_mismatch` (apenas clean path). Dirty staged path mantém as opções existentes.
- `--no-push`: suprime push e PR no caso remote == HEAD (e em geral o push/PR).
- `--no-pr`: suprime apenas a criação/reutilização do PR.
- PR: resolver o URL do remote seleccionado (suportar HTTPS e SSH GitHub) para `owner/repo` e passar explicitamente `--repo owner/repo` a `gh pr list`/`gh pr create`; base `main`, head branch local publicada, idempotência preservada. Não criar PR manualmente. Remote não GitHub/URL não parseável ou `gh` indisponível: commit/push continuam válidos; resultado `pullRequest.status=failed` com `E_PR_UNAVAILABLE` e mensagem/details claros. Falha de criação após chamada válida: `E_PR_CREATE_FAILED`; commit/push mantêm-se.">


Checks:

- Manuais: `pnpm test`, depois `pnpm test:e2e`.
- `commit-task`: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`.

Arquivos editáveis exactos:

- `scripts/rawspec-v2.mjs`
- `scripts/rawspec-v2-cli.mjs`
- `scripts/rawspec-v2.test.mjs`
- `scripts/rawspec-v2-cli.test.mjs`
- `docs/rawspec-v2.md`
- `docs/history.md` (append-only, gerido via RawSpec/CLI no fecho; sem edição manual)
- `specs/changes/014-publicar-commit-existente/proposal.md` (versionar sem alterar o conteúdo aprovado)

Hooks/package apenas read-only; qualquer alteração exige decisão nova.

Testes (fixtures isoladas):

- commit elegível/clean local;
- sem commit elegível;
- branch/metadata errados;
- remoto ausente/igual/ancestor/ahead/divergente;
- worktree suja;
- fluxo staged normal;
- pre-push e PR idempotentes.


Diagnóstico:

- Diagnóstico real (passos, output e causa confirmada/não confirmada) fica registado no campo Evidência da task e em entrada append-only via RawSpec no fecho; se não reproduzível, parar para decisão humana.

## Entregáveis

- Implementação do diagnóstico e da publicação idempotente do commit existente.
- Sem criação de commit vazio; pre-push hooks activos; PR idempotente.
- No-op/erro claro quando não houver commit ou task elegível.
- Fluxo normal com staged changes preservado.
- Testes de regressão e integração cobrindo os cenários listados.
- Documentação do comportamento em `docs/rawspec-v2.md`.

## Regras

- Não usar `--no-verify`, nem push/PR manual fora do `commit-task`.
- Sem commits vazios, sem force-push, sem staging de ficheiros não autorizados.
- Hooks/package apenas read-only.
- `docs/history.md` é append-only e é actualizado apenas via RawSpec/CLI no fecho (entrada de histórico + commit-task); o implementador não edita manualmente. Edição manual de `docs/history.md` é proibida.
- A proposta aprovada está incluída no âmbito apenas para ser versionada, sem alteração do seu conteúdo ou estado de aprovação.
- No publish-existing clean path não chamar `git commit` (sem commit vazio e sem executar lint-staged vazio); isto não é bypass: pre-push hook permanece activo. Fluxo staged normal mantém pre-commit e pre-push activos.

## Testes

- `pnpm test` (utilizador)
- `pnpm test:e2e` (utilizador, após build)
- `commit-task` corre `pnpm lint`, `pnpm typecheck`, `pnpm test` e `pnpm build`
- Fixtures Git isoladas cobrindo: commit existente válido, metadata não correspondente, worktree suja, remote ausente/equal/ancestor/divergente, no-op sem commit elegível, fluxo staged normal, pre-push hook e PR idempotente.

## Aceitação

Condição objetiva de conclusão: `commit-task` publica com sucesso um commit local elegível existente quando a worktree/index estão limpos e a branch não está publicada, sem commit vazio, com hooks activos e PR idempotente; no-op/erro claro nos casos não elegíveis; fluxo staged preservado; testes passam.

Matriz de resultados observáveis (payload/erro para cada caso):

| Caso | Condições | Resultado observado |
|---|---|---|
| A | Clean + commit elegível + remote alias inexistente (`git remote get-url` falha) | `E_GIT_ERROR` reason `remote_not_found`; sem fetch/push/PR |
| A1 | Clean + commit elegível + remote existe mas fetch falha ou `<remote>/main` base indisponível | `E_GIT_ERROR` reason `remote_unavailable`; sem push/PR |
| A2 | Clean + commit elegível + remote ausente + branch remota da task ausente após fetch + `<remote>/main..HEAD` não vazio | checks lint→typecheck→test→build e gate passam; sem `git commit` vazio; base exclusivamente `<remote>/main`; push HEAD existente via `git push -u`; pre-push activo; PR created/existing (excepto `--no-push` suprime push e PR, `--no-pr` suprime só PR); output `{branch,commit,pushed:true,pullRequest}` |
| A0 | Clean + remote ausente (branch remota da task ausente) + `<remote>/main..HEAD` vazio | `E_TASK_STATE` reason `no_eligible_commit`; sem commit vazio/push/PR (apenas nesta condição exacta) |
| B | Remote ancestor de HEAD | validar `<remote>/<branch>..HEAD`; push fast-forward; `pushed:true` + PR |
| C | Remote == HEAD | já publicado: sem commit/push duplicado (`pushed:false`); PR idempotente created/existing, excepto `--no-push` suprime push e PR e `--no-pr` suprime só PR; NÃO é `no_eligible_commit`; `pullRequest` null se `--no-pr`/`--no-push` |
| D1 | HEAD ancestor de remote | `E_GIT_ERROR` reason `remote_ahead`; sem force-push nem PR |
| D2 | Remote e HEAD divergiram | `E_GIT_ERROR` reason `remote_diverged`; sem force-push nem PR |
| D3 | Fetch/validação indisponível com remote existente | `E_GIT_ERROR` reason `remote_unavailable`; sem push/PR |
| E | Clean sem commit elegível; task status/branch/metadata incompatíveis | `E_TASK_STATE` com reason explícito (`task_not_verified`, `branch_mismatch`, `commit_metadata_mismatch`, `merge_commit_ineligible`, `no_eligible_commit` apenas quando range vazio com remote ausente); sem commit/push/PR |
| F | Worktree suja (paths staged/unstaged/untracked) | fluxo normal commit-task (checks, gate, staging explícito, commit, push, PR); paths fora do scope → `E_SCOPE_VIOLATION` sem commit/push; sem path in-scope commitable → `E_TASK_STATE` reason `no_changes_to_commit`, sem commit/push/PR |
| G | Merge activo | `E_TASK_STATE` reason `merge_in_progress`, sem commit/push/PR |
| J | `--branch` fornecido e diferente da branch corrente/gerada para a task (clean path only) | `E_TASK_STATE` reason `branch_mismatch`, sem commit/push/PR |
| H | Merge commit no range (clean) | `E_TASK_STATE` reason `merge_commit_ineligible`; sem commit/push/PR |
| I | Out-of-scope no commit elegível | `E_SCOPE_VIOLATION`; sem commit/push/PR |
| K | `--remote` alias customizado (HTTPS) | fetch/push/refs usam o alias; base `<remote>/main` ou `<remote>/<taskBranch>`; PR resolve owner/repo do URL HTTPS e passa `--repo owner/repo` |
| L | `--remote` alias customizado (SSH GitHub) | idem, resolução owner/repo a partir do URL SSH |
| M | Remote não GitHub ou URL não parseável | commit/push continuam válidos (se elegíveis); `pullRequest.status=failed` com `E_PR_UNAVAILABLE` e mensagem/details claros |
| N | `gh` indisponível | commit/push continuam válidos (se elegíveis); `pullRequest.status=failed` com `E_PR_UNAVAILABLE` |
| O | PR já existente para a branch | idempotência: URL existente reportado, nenhum duplicado criado |
| P | PR criado com sucesso | URL do PR reportado; base `main`, head branch local publicada |
| Q | Falha de criação após chamada válida | `E_PR_CREATE_FAILED`; commit/push mantêm-se |
| R | Sem staging manual no publish-existing | nenhum `git add`/commit vazio; pre-push activo; fluxo staged normal preservado |

Result shape de sucesso (explícito): `{branch, commit, pushed, pullRequest}`. `pullRequest` é `null` quando `--no-pr` ou `--no-push`. No cenário remote == HEAD com flags normais: `pushed:false` e `pullRequest` created/existing. Falha de PR é não fatal: `pullRequest.status=failed` com erro associado (`E_PR_UNAVAILABLE`/`E_PR_CREATE_FAILED`). Erros fatais usam envelope `{error:{code,message,details}}` com `details.reason` explícito; `E_SCOPE_VIOLATION` inclui `details.outOfScope`. `branch_mismatch` ocorre apenas no clean publish-existing path; o fluxo dirty preserva a semântica existente. Distinguir reasons `E_TASK_STATE` (task/branch/metadata/commit elegibilidade) de reasons `E_GIT_ERROR` (remote/fetch/divergência).
Diagnóstico: fixture reproduz a chamada em clean-tree com commit válido; registar comando, saída e causa no campo Evidência da task e em entrada append-only `docs/history.md` através do RawSpec/CLI no fecho; nunca editar history manualmente. Se não reproduzir, parar e pedir decisão.

## Checklist de clareza

- Objetivo único e verificável — ATENDE
- Arquivos afetados — ATENDE
- Entregáveis concretos — ATENDE
- Contrato de entrada, saída e erros — ATENDE
- Testes obrigatórios — ATENDE
- Critério de aceitação objetivo — ATENDE
- Dependências declaradas explicitamente — ATENDE
- Ausência de decisões pendentes para o implementador — ATENDE
