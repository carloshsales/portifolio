# Change 009 — Registo do incidente de Git

- Status: ARCHIVED
- Arquivada em: 2026-11-16
- Tipo: Processo / ferramentas de desenvolvimento
- Prioridade: Alta

## 1. Objetivo

Registar em `docs/history.md` o incidente que ocorreu durante o push da TASK-013,
em que o `commit-task` corrompeu o repositório partilhado, e a correção da causa
raiz: fixar `GIT_DIR` e `GIT_WORK_TREE` em todas as operações Git do helper e da
sua suíte de testes.

## 2. Contexto

A execução do `commit-task` da TASK-013, em 2026-11-16, criou o commit correcto e
depois foi bloqueada pelo hook `pre-push`, que executa `pnpm test` a partir do
worktree. A suíte de testes do helper criava repositórios temporários com `git init`
sem isolar o `GIT_DIR`. Num worktree, `.git` é um ficheiro com a forma
`gitdir: <caminho>`, e o Git descobre o repositório por ascensão de directórios:
`git init` reinitializou o repositório partilhado em vez de criar um novo.

Os danos observados foram: `core.bare = true` na configuração partilhada, a
identidade de teste `[user] Test <test@example.com>` injectada na configuração
partilhada, a branch `task/008-013-orquestracao-verificacao-pelo-utilizador-e-push`
sobrescrita com commits de fixture, o `HEAD` do worktree deslocado para uma branch
de fixture, a branch `task/004-001-implementar-coisa` criada no repositório real e o
`author` do commit da TASK-013 attributionado a `Test <test@example.com>`.

Todos foram reparados e o commit foi pushado com a identificação correcta. A causa
raiz foi corrigida em `scripts/rawspec-v2.mjs` e em `scripts/rawspec-v2.test.mjs`,
ambos já no âmbito da TASK-013.

Esta change existe porque as regras da TASK-013 proíbem explicitamente adicionar
entradas a `docs/history.md` e criar ADRs. O incidente, o seu mecanismo e a
correcção precisam de ficar registados, e o registo faz-se aqui.

## 3. Escopo funcional

1. Acrescentar a `docs/history.md` um `Evento` que descreva o incidente, o mecanismo
   que o causou, os danos observados e a reparação.
2. Acrescentar a `docs/history.md` um `Detalhe` que descreva a correcção da causa
   raiz: a função `resolveGitDir` e a fixação de `GIT_DIR`/`GIT_WORK_TREE` em
   `runCommand` e nos helpers de teste.
3. Actualizar `docs/projeto.md` com uma nova secção `### 7.5 Isolamento do
   repositório`, criada a seguir a `### 7.4 Husky`, que registe que as operações Git
   do helper fixam `GIT_DIR` e `GIT_WORK_TREE` ao directório Git do repositório
   indicado, e que a suíte de testes usa repositórios temporários isolados com o
   mesmo mecanismo. A secção deve mencionar o risco concreto: num worktree, `.git` é
   um ficheiro `gitdir:` e `git init` reinitializa o repositório partilhado.

## 4. Fora do escopo

- Alterar a correcção já implementada em `scripts/rawspec-v2.mjs` e
  `scripts/rawspec-v2.test.mjs`.
- Criar ADRs. O incidente é um evento com uma correcção pontual, não uma decisão
  arquitectural que justifique registo próprio.
- Reverter, reescrever ou reformatar entradas existentes de `docs/history.md`.
- Implementar código de produto.

## 5. Critérios de aceitação

- `docs/history.md` contém o `Evento` do incidente e o `Detalhe` da correcção, com
  Autor, Origem, Decisão, Motivo, Impacto e Evidência.
- As entradas descrevem o mecanismo comprovado, não uma suposição.
- `docs/projeto.md` tem a secção `### 7.5 Isolamento do repositório`, que reflecte a
  fixação do directório Git nas operações do helper.
- Nenhuma entrada existente de `docs/history.md` foi alterada.
- As verificações do projecto passam.

## 6. Restrições

- Não alterar status de aprovação de mudança ou tarefa.
- Não fazer commit ou push sem todos os gates passarem.
- Não usar `--no-verify`.
- Escopo limitado aos ficheiros listados na TASK-014.
- `docs/history.md` é append-only.

## 7. Aprovação

A implementação somente poderá começar após aprovação desta proposta.
