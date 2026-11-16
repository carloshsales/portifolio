# TASK-001 — Corrigir o staging do commit-task

- Change: 007-consistencia-do-projecto
- Status: COMPLETED
- Depende de: nenhuma
- Início: 2026-11-16
- Verificação: VERIFIED (2026-11-16) — commit-task deixa de executar git add -A: o staging passa a usar caminhos explicitos, um git add por ficheiro. Gate de ambito implementado com git status --porcelain --untracked-files=all, a comparar contra a secao ## Arquivos da task e os ficheiros de especificacao que a CLI actualiza; ficheiros fora do ambito bloqueiam o commit com E_SCOPE_VIOLATION, que lista os culpados, sem descartar trabalho. Novo codigo E_SCOPE_VIOLATION documentado em docs/rawspec-v2.md, com a politica de staging e o gate descritos na secao 15.2.1. Parser passa a extrair a secao ## Arquivos para scope.files. 7 testes novos: 3 de extracao do ambito e 4 de comportamento do gate; 94 testes do helper e 141 do projecto passam em 2026-11-16; pnpm lint, typecheck, test, build e prettier aprovados
- Evidência: commit-task deixa de executar git add -A: o staging passa a usar caminhos explicitos, um git add por ficheiro. Gate de ambito implementado com git status --porcelain --untracked-files=all, a comparar contra a secao ## Arquivos da task e os ficheiros de especificacao que a CLI actualiza; ficheiros fora do ambito bloqueiam o commit com E_SCOPE_VIOLATION, que lista os culpados, sem descartar trabalho. Novo codigo E_SCOPE_VIOLATION documentado em docs/rawspec-v2.md, com a politica de staging e o gate descritos na secao 15.2.1. Parser passa a extrair a secao ## Arquivos para scope.files. 7 testes novos: 3 de extracao do ambito e 4 de comportamento do gate; 94 testes do helper e 141 do projecto passam em 2026-11-16; pnpm lint, typecheck, test, build e prettier aprovados
- Plano de ação: none

## Objetivo

Substituir o `git add -A` do `commit-task` por staging restrito ao âmbito
declarado na task, bloqueando o commit quando há ficheiros fora do âmbito.

## Arquivos

- `scripts/rawspec-v2.mjs` (alteração)
- `scripts/rawspec-v2.test.mjs` (alteração)
- `docs/rawspec-v2.md` (alteração)

## Entregáveis

- O parser extrai a secção `## Arquivos` da task para `scope.files`, com o caminho de cada entrada, sem o qualificador entre parênteses.
- `commitAndPushTask` faz staging apenas dos ficheiros dentro do âmbito, com caminhos explícitos.
- Os ficheiros de especificação alterados pela CLI — o ficheiro da task, o plano de acção e o histórico — são commited.
- Um ficheiro tocado fora do âmbito bloqueia o commit com `E_SCOPE_VIOLATION`, que lista os ficheiros culpados.
- `scripts/rawspec-v2.mjs` não contém a sequência `git add -A`.
- A política de Git e o gate de âmbito estão documentados em `docs/rawspec-v2.md` §9 e §15.2.1, e o código `E_SCOPE_VIOLATION` no catálogo de erros.
- Testes que cobrem a extracção do âmbito, o staging restrito e o bloqueio.

## Regras

- A alteração fica confinada a `scripts/rawspec-v2.mjs` e ao seu ficheiro de testes.
- A assinatura de `commitAndPushTask` e o seu retorno não mudam.
- A ordem das operações mantém-se: estado, verificações, mensagem, âmbito, staging, commit, push.
- O gate de âmbito corre antes do staging, para que nada seja commited quando o gate falha.
- Um ficheiro fora do âmbito nunca é descartado. O commit é bloqueado e a lista é reportada.
- Os erros novos seguem a estrutura dos existentes, com `code`, `message` e `details`.
- Os testes usam directórios temporários, como os restantes, e não tocam o repositório real.

## Testes

- `parseTaskFile` devolve `scope.files` com os caminhos de `## Arquivos`.
- Uma task sem `## Arquivos` devolve `scope.files` vazio.
- O qualificador entre parênteses não entra no caminho.
- `commit-task` commite os ficheiros do âmbito e não os de fora.
- `commit-task` commite o ficheiro da task.
- Uma escrita fora do âmbito faz `commit-task` falhar com `E_SCOPE_VIOLATION`, e o erro lista o ficheiro.
- `grep -c "add', '-A'" scripts/rawspec-v2.mjs` devolve 0.
- `pnpm lint`, `pnpm typecheck` e `pnpm test` passam.

## Aceitação

O `commit-task` faz staging restrito ao âmbito da task e bloqueia o commit quando há ficheiros fora do âmbito.

## Checklist de clareza

- Objetivo único e verificável — ATENDE
- Arquivos afetados — ATENDE
- Entregáveis concretos — ATENDE
- Contrato de entrada, saída e erros — ATENDE (entrada: task `COMPLETED` + `VERIFIED` e a lista de `## Arquivos`; saída: commit e push dos ficheiros do âmbito; erros: `E_SCOPE_VIOLATION` com a lista dos ficheiros fora do âmbito)
- Testes obrigatórios — ATENDE
- Critério de aceitação objetivo — ATENDE
- Dependências declaradas explicitamente — ATENDE
- Ausência de decisões pendentes para o implementador — ATENDE
