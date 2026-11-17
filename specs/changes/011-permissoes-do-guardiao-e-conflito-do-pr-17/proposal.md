# Change 011 — Corrigir as permissões do guardião e resolver o conflito do PR 17

- Status: APPROVED
- Tipo: Correção
- Prioridade: Alta
- Data: 2026-11-17
- Relacionadas: `006-agent-orchestrator` (arquivada), `001-portfolio-mvp` (aprovada)

## 1. Objetivo

Restaurar a capacidade de execução do agente `guardião`, cujas permissões estão
invertidas, e resolver o conflito de merge do PR 17 em `docs/history.md`, sem
alterar o âmbito da TASK-003 e sem reescrever o histórico.

## 2. Problema

O PR 17 (`task/001-003-configurar-estilos-globais` → `main`) está em estado
`CONFLICTING` / `DIRTY`, com um conflito de conteúdo em `docs/history.md`.

A resolução do conflito exige um commit e um push. O único agente autorizado a
fazer commit e push é o `guardião`, através do `commit-task`. O `guardião`, no
entanto, está inutilizável: o seu frontmatter declara as regras de permissão com
a regra geral `shell: '*'` em `deny` **depois** das regras específicas em
`allow`. Como a última correspondência prevalece, o `deny` geral anula todas as
seis permissões específicas, e o `guardião` não consegue executar comando de
shell nenhum.

Isto explica a entrada de `docs/history.md` de 2026-11-16, que regista a TASK-002
como concluída com "Commit/push pendentes por indisponibilidade do guardiao com
acesso Git".

A inversão contraria a regra documentada em `docs/orquestrador.md` §4.2, que
determina que, dentro de cada agente, a regra geral precede a específica, e dá
como exemplo explícito o `implementador`, cujo `shell: pnpm *` em `allow` vem
**antes** de `shell: *` em `deny`. O `guardião` é o único agente com a ordem
invertida.

## 3. Escopo

### 3.1 Incluído

- Corrigir a ordem das regras de permissão em `.opencode/agents/guardiao.md`,
  mantendo o conjunto de comandos Git estritamente necessários e sem conceder
  shell irrestrito.
- Resolver o conflito de merge de `docs/history.md` do PR 17, preservando todas
  as entradas existentes e a regra append-only.
- Registar a decisão em `docs/history.md`.

### 3.2 Fora do escopo

- **A TASK-003 não é alterada.** O seu âmbito atual é apenas estilos globais e
  `index.html`, e a sua conclusão e verificação já estão registadas no PR 17.
- Alterar o estado, o âmbito ou o conteúdo de qualquer tarefa da change 001.
- Alterar as permissões globais de `opencode.json`.
- Alterar as permissões dos restantes sete agentes.
- Alterar `docs/orquestrador.md`, `docs/projeto.md`, `AGENTS.md` ou as ADR.
- Rebase, merge amplo, force-push, reescrita de histórico ou descarte de
  alterações. Excepção única, já aprovada pelo utilizador em 2026-11-17: o
  rebase da branch `task/001-003-configurar-estilos-globais` sobre `main` e o
  `--force-with-lease` que actualiza essa branch no remoto. A excepção nunca
  abrange o `main` nem qualquer outra branch.
- Tocar nas worktrees `jolly-wizard` e `witty-knight`, que têm trabalho não
  commitado.

## 4. Comportamento proposto

### 4.1 Ordem das permissões do guardião

O frontmatter de `.opencode/agents/guardiao.md` passa a declarar, por esta
ordem:

1. `shell: '*'` em `deny` — regra geral, primeira.
2. As regras específicas em `allow`, por esta ordem de precedência: `git status
   *`, `git diff *`, `git add *`, `git commit *`, `git push *`, `node
   scripts/rawspec-v2-cli.mjs *`.

Nenhuma regra nova é concedida. O conjunto de comandos permitidos é o mesmo que
o actualmente declarado; apenas a ordem passa a respeitar a semântica de "a
última correspondência prevalece". O `deny` geral continua a bloquear todo o
restante.

O corpo do ficheiro, que descreve o gate de âmbito, as condições C1 a C5 e as
regras do `commit-task`, mantém-se inalterado.

### 4.2 Resolução do conflito de `docs/history.md`

O conflito é um único bloco, no fim do ficheiro. A base comum termina na
entrada "Conclusão TASK-002 - Configurar qualidade e Git Hooks". O `main`
acrescentou cinco entradas depois dela (o incidente de Git, o isolamento do
directório Git, o arquivamento da change 009, o arquivamento da change 008 e o
arquivamento da change 010); a branch do PR 17 acrescentou uma entrada
("Conclusão verificada da TASK-003").

A resolução é a **união das duas caudas**, pela ordem:

1. As entradas do `main`, que já estão em `main`, por ordem cronológica.
2. A entrada da branch do PR 17, "Conclusão verificada da TASK-003", no fim.

Nenhuma entrada existente é reescrita, reordenada ou removida. O resultado é o
`main` actual com uma entrada acrescentada no fim, o que respeita a regra
append-only de `docs/rawspec-v2.md` §6.1.

A resolução é feita directamente sobre a branch do PR 17, com o ficheiro
conflituado escrito na forma final e sem marcadores de conflito, e não por
`git merge` amplo.

### 4.3 Fluxo de execução

O trabalho decorre numa worktree limpa da branch `task/011-001-...`, criada a
partir de `main`. O commit e o push são feitos pelo `guardião`, através do
`commit-task`, nunca à mão e nunca com `--no-verify`.

## 5. Requisitos

### 5.1 Funcionais

- O `guardião` consegue executar `git status`, `git diff`, `git add`, `git
  commit`, `git push` e `node scripts/rawspec-v2-cli.mjs *`.
- O `guardião` não consegue executar nenhum outro comando de shell.
- O `docs/history.md` da branch `task/001-003-configurar-estilos-globais`
  contém todas as entradas do `main` mais a entrada da branch do PR 17, por
  ordem, sem marcadores de conflito.
- O `docs/history.md` da branch desta change contém as entradas do `main` mais
  a entrada de registo desta change, por append.
- O PR 17 passa a estado `MERGEABLE`.

### 5.2 Não funcionais

- Nenhuma escrita em `src/`, `index.html` ou `opencode.json`.
- Nenhuma reescrita de histórico: sem `reset --hard`, `checkout --`, `restore`
  ou `clean`.
- Nenhuma alteração nas worktrees `jolly-wizard` e `witty-knight`.

## 6. Critérios de aceitação

- `.opencode/agents/guardiao.md` declara `shell: '*'` em `deny` antes das
  regras específicas em `allow`, e o conjunto de comandos permitidos não
  cresceu.
- O `docs/history.md` da branch `task/001-003-configurar-estilos-globais`
  contém todas as entradas de `main` mais a entrada da TASK-003, no fim, sem
  marcadores de conflito e sem reescrita de entradas existentes.
- O `docs/history.md` desta branch contém as entradas de `main` mais a entrada
  de registo desta change, por append, sem reescrita de entradas existentes.
- A TASK-003 está inalterada, com o mesmo âmbito: estilos globais e
  `index.html`.
- `pnpm lint`, `pnpm typecheck`, `pnpm test` e `pnpm build` passam, por esta
  ordem, dentro do `commit-task`.
- O commit é feito apenas pelo `guardião`, via `commit-task`, sem `--no-verify`.
- O gate de âmbito do `commit-task` não reporta ficheiros fora do âmbito.

## 7. Riscos e mitigação

- **Risco: o gate de âmbito bloqueia o commit.** O âmbito da TASK-001 declara
  `.opencode/agents/guardiao.md`, `docs/history.md`, o `proposal.md` da change e
  o próprio ficheiro da tarefa. Se o commit for feito numa branch onde existam
  alterações alheias ao âmbito, o gate bloqueia com `E_SCOPE_VIOLATION` e nada
  é commitado. Mitigação: a execução decorre numa worktree limpa, e o `guardião`
  reporta a lista sem contornar o gate.
- **Risco: perda de entradas do histórico.** Mitigação: a resolução é a união
  explícita das duas caudas, verificada por contagem de títulos antes e depois
  (60 entradas em `main`, 61 na branch do PR 17) e por verificação de ausência
  de marcadores.
- **Risco: agent com mais permissões do que o pretendido.** Mitigação: a
  correcção é apenas uma reordenação; nenhum comando novo é concedido e o
  `deny` geral continua a fechar o resto.
- **Risco: conflito mais amplo do que o previsto.** Mitigação: a inspecção
  prévia confirmou que o conflito se limita a `docs/history.md` e que
  `TASK-003.md` aplica sem conflito.

## 8. Decisões confirmadas

- A TASK-003 não é tocada. O registo da sua conclusão e verificação é integrado
  pelo PR 17, e o seu âmbito actual — estilos globais e `index.html` — mantém-se.
- A correcção das permissões vive numa change própria, porque o seu âmbito
  (`.opencode/agents/guardiao.md`) não pertence a nenhuma tarefa aberta.
- O `deny` geral do `guardião` mantém-se, porque fecha todo o que não está
  explicitamente enumerado nas seis excepções. A garantia de que o `commit-task`
  é a única via de commit e push não vem das permissões, que não são uma
  barreira de integridade (`docs/orquestrador.md` §4.3), mas do gate de âmbito
  pós-escrita, das instruções do próprio agente e da revisão em par.

## 9. Aprovação

Esta proposta depende de aprovação humana antes do início da implementação.
A aprovação é registada pelo utilizador, alterando `Status` para `APPROVED`.

Aprovada pelo utilizador em 2026-11-17, com a escolha da estratégia de
integração do PR 17: rebase da branch `task/001-003-configurar-estilos-globais`
sobre `main`, com resolução de `docs/history.md` nessa branch, de modo a que o
PR #17 passe a `MERGEABLE` e seja integrado pelo processo normal de pull
request.
