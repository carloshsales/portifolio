# TASK-006 — Implementar /logspec e registro de histórico

- Change: 003-rawspec-v2
- Status: ARCHIVED
- Depende de: TASK-002
- Início: 2026-11-15
- Verificação: VERIFIED (2026-11-15) — `appendHistory` e `createAdrSkeleton` implementados; `scripts/rawspec-v2-cli.mjs` criado; `.opencode/commands/logspec.md` criado; 69 testes do módulo passando; `prettier --check`, `pnpm lint`, `pnpm typecheck`, `pnpm test` (111 testes) e `pnpm build` aprovados; smoke test da CLI sem argumentos exibe o uso.
- Evidência: implementação, testes e comando em `scripts/` e `.opencode/commands/`; verificações executadas em 2026-11-15.
- Arquivada em: 2026-11-15
- Plano de ação: none

## Objetivo

Implementar o registro de histórico append-only e o comando `/logspec`.

## Arquivos

- `scripts/rawspec-v2.mjs`
- `scripts/rawspec-v2.test.mjs`
- `.opencode/commands/logspec.md` (criação)

## Entregáveis

- `appendHistory(entry)` validando e acrescentando uma entrada ao final de `docs/history.md`.
- `createAdrSkeleton({ id, title })` criando um ADR em `docs/decisions/` com `Status: Proposed`.
- `/logspec` com flags `--type`, `--title`, `--message`, `--origin`, `--impact`, `--evidence` e `--adr`.
- Validação de campos obrigatórios e tipos permitidos (`Decisão`, `Evento`, `Detalhe`).
- Escrita confinada a `docs/history.md` e `docs/decisions/`.

## Regras

- `history.md` nunca é reescrito; apenas acrescentado.
- Campos obrigatórios: data, tipo, título, autor, origem, mensagem, motivo, impacto, evidência.
- Tipo inválido retorna `E_HISTORY_INVALID`.
- Caminho fora de `docs/` retorna `E_PATH_ESCAPE`.
- `--adr` cria esqueleto e referencia no histórico.
- Nenhum commit ou push.

## Testes

- Acrescentar entrada válida ao histórico.
- Entrada com tipo inválido é recusada.
- Entrada com campo obrigatório ausente é recusada.
- `history.md` existente não é reescrito.
- `--adr` cria ADR com Status `Proposed`.
- Caminho fora de `docs/` é recusado.
- Autor e data são registrados.

## Aceitação

- `/logspec` registra entradas válidas e recusa inválidas.
- `history.md` permanece append-only.
- ADR esqueleto é criado quando solicitado.

## Checklist de clareza

- Objetivo único e verificável — ATENDE
- Arquivos afetados — ATENDE
- Entregáveis concretos — ATENDE
- Contrato de entrada, saída e erros — ATENDE (entrada: flags do comando; saída: entrada no histórico e opcionalmente ADR; erros: `E_HISTORY_INVALID`, `E_PATH_ESCAPE`, `E_ARGS`)
- Testes obrigatórios — ATENDE
- Critério de aceitação objetivo — ATENDE
- Dependências declaradas explicitamente — ATENDE
- Ausência de decisões pendentes para o implementador — ATENDE
