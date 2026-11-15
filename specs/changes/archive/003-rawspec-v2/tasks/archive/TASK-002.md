# TASK-002 — Definir formato v2 e templates

- Change: 003-rawspec-v2
- Status: ARCHIVED
- Depende de: TASK-001
- Início: 2026-11-15
- Verificação: VERIFIED (2026-11-15) — cinco templates criados em `specs/templates/`; `docs/rawspec-v2.md` criado; `prettier --check`, `pnpm lint`, `pnpm typecheck`, `pnpm test` (42 testes) e `pnpm build` aprovados; mudanças existentes não alteradas.
- Evidência: templates e documento de referência em `specs/templates/` e `docs/`; verificações executadas em 2026-11-15.
- Arquivada em: 2026-11-15
- Plano de ação: none

## Objetivo

Versionar os templates do formato v2 e o documento de referência que define layout, campos, status e regras.

## Arquivos

- `specs/templates/task.md` (criação)
- `specs/templates/proposal.md` (criação)
- `specs/templates/design.md` (criação)
- `specs/templates/action-plan.md` (criação)
- `specs/templates/history-entry.md` (criação)
- `docs/rawspec-v2.md` (criação)

## Entregáveis

- Template de tarefa com cabeçalho `# TASK-NNN — Título`, campos `Change`, `Status`, `Depende de`, `Início`, `Verificação`, `Evidência`, `Plano de ação` e seções de conteúdo.
- Template de proposta, design, plano de ação e entrada de histórico.
- `docs/rawspec-v2.md` descrevendo layout, campos, status, ciclo de vida e regras de arquivamento.
- Referência cruzada com `docs/decisions/ADR-002`, `ADR-003` e `ADR-004`.

## Regras

- Templates devem refletir exatamente o design técnico.
- Campos obrigatórios e opcionais devem estar explícitos.
- Não criar código nesta tarefa.
- Não alterar mudanças existentes.

## Testes

- Verificação manual de que cada campo do design tem correspondente no template.
- Verificação de que `docs/rawspec-v2.md` descreve todo o ciclo de vida.

## Aceitação

- Os cinco templates existem e estão coerentes com o design.
- `docs/rawspec-v2.md` documenta o formato v2 completo.
- Nenhuma mudança existente foi alterada.

## Checklist de clareza

- Objetivo único e verificável — ATENDE
- Arquivos afetados — ATENDE
- Entregáveis concretos — ATENDE
- Contrato de entrada, saída e erros — NÃO SE APLICA (tarefa documental: a entrada é o design e a saída são templates e documento de referência)
- Testes obrigatórios — ATENDE
- Critério de aceitação objetivo — ATENDE
- Dependências declaradas explicitamente — ATENDE
- Ausência de decisões pendentes para o implementador — ATENDE
