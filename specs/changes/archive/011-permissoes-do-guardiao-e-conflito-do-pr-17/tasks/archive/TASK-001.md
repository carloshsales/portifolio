# TASK-001 — Corrigir as permissões do guardião e resolver o conflito do PR 17

- Change: 011-permissoes-do-guardiao-e-conflito-do-pr-17
- Status: ARCHIVED
- Depende de: nenhuma
- Início: 2026-11-17
- Verificação: VERIFIED (2026-11-17) — pnpm lint exit 0; pnpm typecheck exit 0; pnpm test exit 0 (146 aprovados, 1 ignorado); pnpm test:e2e exit 0 (15 aprovados em 3 viewports); pnpm build exit 0; prettier --check aprovado; node bakeoff/validate.mjs 15/15. Verificacao funcional das permissoes em tres sessoes reais do OpenCode com o agente guardiao: git status --short --branch executou; git diff --stat executou; node scripts/rawspec-v2-cli.mjs open --change 011-permissoes-do-guardiao-e-conflito-do-pr-17 executou; node -e recusado com Permission denied: shell; git reset --hard HEAD recusado. Resolucao do conflito do PR 17 verificada byte a byte: 0 entradas em falta, 0 reescritas, ordem das 60 entradas de main preservada, entrada da TASK-003 em ultimo; git diff main -- docs/history.md = +9 -0; git merge-tree sem marcadores; gh pr view 17 reporta MERGEABLE com CI verde. Revisoes A e B aprovadas. Clareza 95/100.
- Evidência: pnpm lint exit 0; pnpm typecheck exit 0; pnpm test exit 0 (146 aprovados, 1 ignorado); pnpm test:e2e exit 0 (15 aprovados em 3 viewports); pnpm build exit 0; prettier --check aprovado; node bakeoff/validate.mjs 15/15. Verificacao funcional das permissoes em tres sessoes reais do OpenCode com o agente guardiao: git status --short --branch executou; git diff --stat executou; node scripts/rawspec-v2-cli.mjs open --change 011-permissoes-do-guardiao-e-conflito-do-pr-17 executou; node -e recusado com Permission denied: shell; git reset --hard HEAD recusado. Resolucao do conflito do PR 17 verificada byte a byte: 0 entradas em falta, 0 reescritas, ordem das 60 entradas de main preservada, entrada da TASK-003 em ultimo; git diff main -- docs/history.md = +9 -0; git merge-tree sem marcadores; gh pr view 17 reporta MERGEABLE com CI verde. Revisoes A e B aprovadas. Clareza 95/100.
- Plano de ação: none
- Arquivada em: 2026-11-17

## Objetivo

Restaurar a capacidade de execução do agente `guardião`, cujas regras de
permissão estão invertidas, e resolver o conflito de merge de `docs/history.md`
do PR 17, preservando todas as entradas do histórico.

## Contexto

Esta tarefa corrige um defeito existente. Não constrói nada de raiz: o
`guardião` já declarava as permissões de que precisa, e o `docs/history.md` já
existia com 60 entradas. O que estava errado era a **ordem** das regras de
permissão, que anulava as permissões já declaradas, e a **cauda** do
`docs/history.md`, que continha um conflito de merge por resolver. O trabalho é
de correcção e consolidação, e é verificado como tal.

O estado inicial observado, antes de qualquer alteração:

- O PR 17 (`task/001-003-configurar-estilos-globais` → `main`) está em estado
  `CONFLICTING`, com um único conflito de conteúdo em `docs/history.md`.
- O `main` tem 60 entradas em `docs/history.md`; a branch do PR 17 tem 56.

A resolução do conflito exige commit e push. O único agente com essa
autorização é o `guardião`, via `commit-task`. O seu frontmatter declara
`shell: '*'` em `deny` **depois** das seis regras específicas em `allow`. Como
a última correspondência prevalece, o `deny` geral anula todas as específicas e
o `guardião` não executa comando de shell nenhum.

Isto contraria `docs/orquestrador.md` §4.2, que determina que a regra geral
precede a específica e ilustra a regra com o `implementador`, cujo
`shell: pnpm *` em `allow` vem antes de `shell: *` em `deny`. O `guardião` é o
único agente com a ordem invertida.

A semântica é a documentada pelo OpenCode: «The last matching rule wins, so the
specific exceptions follow the broad rule» (OpenCode, *Permissions*). O exemplo
oficial é precisamente `{"action": "shell", "resource": "*", "effect": "ask"}`
seguido de `{"action": "shell", "resource": "git status *", "effect": "allow"}`.
As regras de agente são anexadas às globais, pelo que a regra geral do agente
prevalece sobre a global `git push *` em `ask` do `opencode.json`, e as
excepções específicas do agente prevalecem sobre a sua própria regra geral.

## Arquivos

- `.opencode/agents/guardiao.md` (alteração do bloco `permissions` do
  frontmatter)
- `docs/history.md` (acréscimo da entrada de registo desta task; a resolução do
  conflito de merge do PR 17 ocorre no ficheiro homónimo da branch
  `task/001-003-configurar-estilos-globais`, não neste)
- `specs/changes/011-permissoes-do-guardiao-e-conflito-do-pr-17/proposal.md`
  (preservado no commit; proposta aprovada, sem alteração de conteúdo)

## Entregáveis

- O frontmatter de `.opencode/agents/guardiao.md` declara `shell: '*'` em
  `deny` **antes** de todas as regras específicas em `allow`.
- As regras específicas em `allow` mantêm-se exactamente as seis já
  declaradas: `git status *`, `git diff *`, `git add *`, `git commit *`,
  `git push *` e `node scripts/rawspec-v2-cli.mjs *`. Nenhum comando novo é
  concedido.
- O corpo de `.opencode/agents/guardiao.md` — a sequência de registo, o gate de
  âmbito, as condições C1 a C5 e as regras — mantém-se inalterado.
- O `docs/history.md` da branch `task/001-003-configurar-estilos-globais`
  contém, por esta ordem, todas as entradas actualmente em `main` e, no fim, a
  entrada "Conclusão verificada da TASK-003" vinda do PR 17.
- Nenhuma entrada de `docs/history.md` existente é reescrita, reordenada ou
  removida, em nenhuma das duas branches. Nenhum marcador de conflito
  permanece no ficheiro.
- O `docs/history.md` desta branch contém as entradas de `main` e, por
  append, a entrada de registo desta task. A entrada "Conclusão verificada da
  TASK-003" não é replicada aqui: pertence ao PR 17 e entra no `main` quando
  esse PR for integrado.
- A branch `task/001-003-configurar-estilos-globais` é rebaseada sobre `main` e
  o PR 17 passa a `MERGEABLE`, sem ser fechado nem substituído.
- Uma entrada de registo em `docs/history.md` descreve a correcção da ordem das
  permissões e a resolução do conflito.

## Regras

- **Não alterar a TASK-003.** O seu âmbito é apenas estilos globais e
  `index.html`, e a sua conclusão e verificação são integradas pelo PR 17. O
  conteúdo da TASK-003 na branch do PR 17 é preservado tal e qual veio do
  commit original `5d4149e`, incluindo a referência a `src/main.tsx`, que é o
  ponto de importação dos estilos globais e pertence ao mesmo âmbito. Esta task
  não acrescenta, remove nem reformula nada na TASK-003.
- **Não tocar em `src/`, `index.html`, `opencode.json`, `docs/orquestrador.md`,
  `docs/projeto.md`, `AGENTS.md` ou nas ADR.**
- **Não alterar as permissões dos restantes sete agentes.**
- A correcção das permissões é uma reordenação. O conjunto de comandos
  permitidos não cresce, e o `deny` geral mantém-se, porque fecha todo o que
  não está explicitamente enumerado nas seis excepções.
- **As permissões de caminho não são uma barreira de integridade**, conforme
  medido e registado em `docs/orquestrador.md` §4.3: uma negativa de caminho
  pode ser contornada por shell, e a delegação a subagentes contorna as
  negativas de `edit` e `shell`. Por isso o `deny` geral do `guardião` não é a
  garantia de que o `commit-task` é a única via de commit e push. A garantia
  real é o gate de âmbito pós-escrita do `commit-task`, que corre antes de
  qualquer `git add` e bloqueia com `E_SCOPE_VIOLATION` qualquer ficheiro fora
  do âmbito. A garantia de que o `guardião` não commita à mão vem das suas
  próprias instruções, que proíbem explicitamente `git add`, `git commit` e
  `git push` fora do `commit-task`, e da revisão em par que precede o registo.
  Esta task não altera esse modelo: limita-se a corrigir a ordem que anulava as
  permissões já declaradas.
- O conflito resolve-se pela união das duas caudas: as entradas do `main`
  primeiro, a entrada da branch do PR 17 no fim. Não se faz merge amplo. A
  resolução é feita na branch `task/001-003-configurar-estilos-globais`, e não
  nesta branch.
- A branch `task/001-003-configurar-estilos-globais` é rebaseada sobre `main`.
  O rebase reescreve a branch local, o que é permitido por decisão humana
  explícita; o PR 17 continua aberto e é integrado pelo processo normal de pull
  request.
- **Nunca** reescrever o histórico: sem `reset --hard`, `checkout --`,
  `restore`, `clean` ou descarte de alterações. Excepção única e já aprovada
  pelo utilizador em 2026-11-17, e já executada: o rebase da branch
  `task/001-003-configurar-estilos-globais` sobre `main`, que reescreve apenas
  essa branch e nunca o `main`, e o `git push --force-with-lease` que actualiza
  essa mesma branch no remoto. O `--force-with-lease` falha com segurança se o
  remoto tiver mudado desde o último `fetch`, e o commit original ficou
  preservado em `backup/task-001-003-pr17-pre-rebase`.
- **Nunca** tocar nas worktrees `jolly-wizard` e `witty-knight`, que têm
  trabalho não commitado.
- O commit e o push são feitos pelo `guardião`, através do `commit-task`.
  Nunca com `git add`, `git commit` ou `git push` à mão, nunca com
  `--no-verify`, nunca com `git add -A`.
- O gate de âmbito do `commit-task` não pode ser contornado. Se bloquear com
  `E_SCOPE_VIOLATION`, o `guardião` reporta a lista e para.

## Testes

- A leitura do frontmatter de `.opencode/agents/guardiao.md` mostra
  `shell: '*'` em `deny` antes das seis regras específicas em `allow`, e a
  contagem de regras em `allow` é 6.
- A comparação do conjunto de recursos de permissão antes e depois mostra os
  mesmos 7 recursos: nenhum adicionado, nenhum removido.
- `git status --porcelain --untracked-files=all` na worktree de execução não
  mostra ficheiros fora do âmbito declarado na secção `## Arquivos` nem das
  especificações que a CLI actualiza (o ficheiro da task e `docs/history.md`).
- Verificação funcional das permissões, com o procedimento exacto e
  reproduzível. São três invocações, cada uma a correr da raiz do repositório:

  1. Comando permitido — tem de executar e devolver saída:

     ```bash
     opencode run --agent guardiao --model "opencode-go/beam-free" "Executa estes comandos shell e reporta o resultado de cada um: 1) git status --short --branch 2) git diff --stat 3) node scripts/rawspec-v2-cli.mjs open --change 011-permissoes-do-guardiao-e-conflito-do-pr-17. Nao faças commit nem push."
     ```

     Saída esperada: os três comandos executados, o primeiro com o estado do
     worktree, o segundo com o diff e o terceiro com o JSON da task.

  2. Comando não permitido, fora de qualquer regra do prompt — tem de ser
     recusado pela camada de permissões:

     ```bash
     opencode run --agent guardiao --model "opencode-go/beam-free" "Executa o comando shell: node -e \"console.log('teste de permissao')\". Este comando e inofensivo e nao tem nada a ver com git. Executa-o de facto e reporta o resultado."
     ```

     Saída esperada: `Error: Permission denied: shell`, e o comando não
     executado.

  3. Comando destrutivo — tem de ser recusado:

     ```bash
     opencode run --agent guardiao --model "opencode-go/beam-free" "Executa o comando shell: git reset --hard HEAD. Se for bloqueado, reporta a mensagem de bloqueio e nao tentes outra variante."
     ```

     Saída esperada: recusa, sem execução.

  A evidência é a saída transcrita das três sessões. A leitura estática do
  frontmatter não basta: confirma-se pelo efeito real. Nota: `commit-task`
  executa o Git como processo filho de Node, e não através das permissões de
  shell do agente, pelo que o `commit-task` não serve como prova do ponto 1.
- Na branch `task/001-003-configurar-estilos-globais`, a contagem de títulos
  `## ` em `docs/history.md` é 61: os 60 do `main` mais a entrada da TASK-003.
- Na branch `task/001-003-configurar-estilos-globais`,
  `Select-String` por `<<<<<<<`, `=======` e `>>>>>>>` em `docs/history.md` não
  devolve nenhuma linha.
- Na branch `task/001-003-configurar-estilos-globais`, os títulos das 60
  entradas de `main` aparecem em `docs/history.md` na mesma ordem relativa,
  seguidas da entrada "Conclusão verificada da TASK-003".
- Nesta branch, a contagem de títulos `## ` em `docs/history.md` é 61: os 60 do
  `main` mais a entrada de registo desta task.
- `gh pr view 17` reporta `MERGEABLE`.
- `pnpm lint`, `pnpm typecheck`, `pnpm test` e `pnpm build` passam, por esta
  ordem, dentro do `commit-task`.

## Aceitação

O `guardião` volta a ter capacidade de executar os comandos Git e da CLI
RawSpec que o `commit-task` exige, sem nenhum comando novo e sem shell
irrestrito; o conflito do PR 17 fica resolvido em `docs/history.md` da branch
`task/001-003-configurar-estilos-globais`, com todas as entradas preservadas e
a regra append-only intacta; e a TASK-003 permanece inalterada.

## Checklist de clareza

- Objetivo único e verificável — ATENDE (corrigir a ordem das permissões do
  guardião e resolver o conflito de `docs/history.md` do PR 17)
- Arquivos afetados — ATENDE (`.opencode/agents/guardiao.md`,
  `docs/history.md` e a `proposal.md` da change)
- Entregáveis concretos — ATENDE
- Contrato de entrada, saída e erros — ATENDE (entrada: `docs/orquestrador.md`
  §4.2 e o estado `CONFLICTING` do PR 17; saída: frontmatter com a regra geral
  antes das específicas, `docs/history.md` da branch do PR 17 sem conflito e com
  61 entradas, e `docs/history.md` desta branch com 61 entradas; erros: o gate
  de âmbito bloqueia o commit com `E_SCOPE_VIOLATION`, sem descarte de
  ficheiros)
- Testes obrigatórios — ATENDE
- Critério de aceitação objetivo — ATENDE
- Dependências declaradas explicitamente — ATENDE (nenhuma; a TASK-003 fica
  fora do âmbito e não é tocada)
- Ausência de decisões pendentes para o implementador — ATENDE
