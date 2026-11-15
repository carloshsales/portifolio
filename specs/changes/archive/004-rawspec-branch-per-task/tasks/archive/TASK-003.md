# TASK-003 — Documentar a regra e validar ponta a ponta

- Change: 004-rawspec-branch-per-task
- Status: ARCHIVED
- Depende de: TASK-002
- Início: 2026-11-15
- Verificação: VERIFIED (2026-11-15) — ADR-005 criado; `docs/rawspec-v2.md` e `README.md` documentam a regra de branch e commit/push; 87 testes do módulo passando; `prettier --check`, `pnpm lint`, `pnpm typecheck`, `pnpm test` (128 passando, 1 pulado) e `pnpm build` aprovados; hooks do Husky confirmados em commit e push reais.
- Evidência: ADR e documentação em `docs/` e `README.md`; verificações executadas em 2026-11-15.
- Plano de ação: none
- Arquivada em: 2026-11-15

## Objetivo

Documentar a regra de branch por tarefa e commit/push, e validar o fluxo completo.

## Arquivos

- `docs/decisions/ADR-005-branch-por-tarefa.md` (criação)
- `docs/rawspec-v2.md` (complementação)
- `README.md` (complementação)

## Entregáveis

- ADR-005 com a decisão, alternativas, justificativa e consequências.
- Seção sobre branch e commit/push em `docs/rawspec-v2.md`.
- Atualização do `README.md`.
- Validação ponta a ponta do fluxo com branch, commit e push.

## Regras

- Não alterar os hooks do Husky.
- Exemplos copiáveis e coerentes.
- Nenhum comando executa operação destrutiva.

## Testes

- Executar `pnpm lint`.
- Executar `pnpm typecheck`.
- Executar `pnpm test`.
- Executar `pnpm build`.
- Validar o fluxo em repositório temporário.
- Confirmar que os hooks rodam no commit e no push.

## Aceitação

- A regra está documentada e o fluxo validado.
- Todas as verificações passam.

## Checklist de clareza

- Objetivo único e verificável — ATENDE
- Arquivos afetados — ATENDE
- Entregáveis concretos — ATENDE
- Contrato de entrada, saída e erros — NÃO SE APLICA (tarefa documental e de validação: a entrada é a implementação testada e a saída é a documentação e o relatório)
- Testes obrigatórios — ATENDE
- Critério de aceitação objetivo — ATENDE
- Dependências declaradas explicitamente — ATENDE
- Ausência de decisões pendentes para o implementador — ATENDE
