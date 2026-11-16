# TASK-001 — Remover documentação obsoleta e arquivar especificações mortas

- Change: 005-refactor-portfolio-baseline
- Status: ARCHIVED
- Depende de: nenhuma
- Início: 2026-11-15
- Verificação: VERIFIED (2026-11-15) — docs/rawspec-commands.md removido (git rm); change 002-rawspec-task-commands arquivada em specs/changes/archive/ com conteudo integral preservado (design.md, tasks.md, proposal.md com Status: ARCHIVED e Arquivada em: 2026-11-15); specs/specifications/ removido (3 diretorios vazios); README.md sem referencias ao documento v1; next resolve para 001 ou 005 com E_TASK_AMBIGUOUS, nunca para 002; pnpm lint, pnpm format:check, pnpm typecheck, pnpm test (128 passando, 1 pulado) e pnpm build aprovados
- Evidência: docs/rawspec-commands.md removido (git rm); change 002-rawspec-task-commands arquivada em specs/changes/archive/ com conteudo integral preservado (design.md, tasks.md, proposal.md com Status: ARCHIVED e Arquivada em: 2026-11-15); specs/specifications/ removido (3 diretorios vazios); README.md sem referencias ao documento v1; next resolve para 001 ou 005 com E_TASK_AMBIGUOUS, nunca para 002; pnpm lint, pnpm format:check, pnpm typecheck, pnpm test (128 passando, 1 pulado) e pnpm build aprovados
- Plano de ação: none
- Arquivada em: 2026-11-15

## Objetivo

Eliminar a documentação v1 dos comandos e retirar do fluxo as especificações que não podem ser executadas, deixando o repositório com uma única fonte de verdade.

## Arquivos

- `docs/rawspec-commands.md` (remoção)
- `specs/changes/002-rawspec-task-commands/` (movimento para `specs/changes/archive/`)
- `specs/specifications/engineering/` (remoção)
- `specs/specifications/portfolio/` (remoção)
- `specs/specifications/security/` (remoção)
- `README.md` (verificação de referências)

## Entregáveis

- `docs/rawspec-commands.md` removido do repositório.
- `docs/rawspec-v2.md` confirmado como referência única dos comandos.
- Change `002-rawspec-task-commands` arquivada em `specs/changes/archive/002-rawspec-task-commands/`, com `Status: ARCHIVED` e data de arquivamento no `proposal.md`.
- Conteúdo da change 002 preservado integralmente, incluindo `design.md`, `tasks.md` e as duas tarefas concluídas com as respetivas evidências.
- Diretórios `specs/specifications/*` vazios removidos.
- Nenhuma referência a `rawspec-commands.md` ou a `002-rawspec-task-commands` como documento ativo em `README.md` ou em `docs/`.

## Regras

- A change 002 é arquivada, nunca apagada. As duas tarefas concluídas e as evidências permanecem no arquivo.
- Nenhum outro ficheiro de `docs/` é removido.
- `docs/rawspec-v2.md` não é alterado.
- `specs/changes/001-portfolio-mvp/` e `specs/changes/005-refactor-portfolio-baseline/` não são tocados.
- A remoção dos diretórios vazios usa o Git, para que as mudanças fiquem registadas no histórico.
- Não fazer commit nem push sem a sequência da branch por tarefa.

## Testes

- `node scripts/rawspec-v2-cli.mjs next` resolve para a change 001 ou 005, nunca para a 002.
- `node scripts/rawspec-v2-cli.mjs list-changes` ou equivalente não devolve a 002 como ativa.
- `git status --porcelain` confirma apenas as remoções e o movimento esperados.
- `pnpm lint` e `pnpm format:check` passam.

## Aceitação

`docs/rawspec-commands.md` não existe, a change 002 está em `specs/changes/archive/` com conteúdo preservado, `specs/specifications/` deixou de existir e nenhuma referência ativa ao documento v1 permanece.

## Checklist de clareza

- Objetivo único e verificável — ATENDE
- Arquivos afetados — ATENDE
- Entregáveis concretos — ATENDE
- Contrato de entrada, saída e erros — ATENDE (entrada: ficheiros obsoletos existentes; saída: repositório sem documentação v1 e com a change 002 arquivada; erros: falha do movimento do Git propaga o erro sem alteração parcial)
- Testes obrigatórios — ATENDE
- Critério de aceitação objetivo — ATENDE
- Dependências declaradas explicitamente — ATENDE
- Ausência de decisões pendentes para o implementador — ATENDE
