# TASK-002 — Actualizar as secções 6.3 e 7.3 de docs/projeto.md

- Change: 007-consistencia-do-projecto
- Status: ARCHIVED
- Depende de: TASK-001
- Início: 2026-11-16
- Verificação: VERIFIED (2026-11-16) — Secao 6.3 reescrita: descreve o orquestrador com os 8 agentes (todos verificados como presentes no documento), o pipeline de 8 etapas, o routing medido e o custo de 0,0229 por task, igual ao de docs/orquestrador.md. A frase 'sem construir um orquestrador personalizado' deixou de existir. Secao 7.3 reescrita: descreve a regra da ADR-005 com as 5 condicoes e mantem as proibicoes explicitas, incluindo a prohibition de git add -A indiscriminada. Principio 11 da secao 12, que ainda exigia autorizacao explicita para commit e push, foi alinhado com a ADR-005. Secoes 6.2, 7.1, 7.2 e 7.4 nao alteradas. pnpm lint, typecheck, test (141 passando, 1 pulado) e prettier aprovados em 2026-11-16
- Evidência: Secao 6.3 reescrita: descreve o orquestrador com os 8 agentes (todos verificados como presentes no documento), o pipeline de 8 etapas, o routing medido e o custo de 0,0229 por task, igual ao de docs/orquestrador.md. A frase 'sem construir um orquestrador personalizado' deixou de existir. Secao 7.3 reescrita: descreve a regra da ADR-005 com as 5 condicoes e mantem as proibicoes explicitas, incluindo a prohibition de git add -A indiscriminada. Principio 11 da secao 12, que ainda exigia autorizacao explicita para commit e push, foi alinhado com a ADR-005. Secoes 6.2, 7.1, 7.2 e 7.4 nao alteradas. pnpm lint, typecheck, test (141 passando, 1 pulado) e prettier aprovados em 2026-11-16
- Plano de ação: none
- Arquivada em: 2026-11-16

## Objetivo

Alinhar `docs/projeto.md` com o estado real do projecto: a secção 6.3 passa a
descrever o orquestrador existente e a secção 7.3 passa a ser coerente com a
ADR-005.

## Arquivos

- `docs/projeto.md` (alteração)

## Entregáveis

- A secção 6.3 descreve o orquestrador de agentes: os oito agentes, o pipeline de oito etapas, o routing de modelos por etapa e o custo medido por task.
- A secção 6.3 remete para `docs/orquestrador.md` e para a ADR-007.
- A secção 7.3 deixa de exigir autorização explícita para commit e push, e passa a descrever a regra da ADR-005 com as cinco condições.
- A secção 7.3 mantém as proibições explícitas: `--no-verify`, `reset --hard`, `clean`, `checkout --` e `add -A` indiscriminado.
- As secções 6.2, 7.1, 7.2 e 7.4 não são alteradas.

## Regras

- Cada afirmação nova é verificada contra o repositório antes de ser escrita.
- A secção 6.3 mantém a referência a `docs/projeto.md` como documento de referência do projecto, sem se substituir por `docs/orquestrador.md`.
- Os números citados — custo por task, número de agentes, número de etapas — são os de `docs/orquestrador.md` e de `bakeoff/results.json`.
- O registo do documento mantém-se: português europeu.
- Nenhum outro ficheiro é alterado.

## Testes

- A secção 6.3 menciona os oito agentes e o pipeline.
- A secção 6.3 não contém a frase "sem construir um orquestrador personalizado".
- A secção 7.3 não contém a frase "não executar commits ou pushes sem autorização explícita".
- A secção 7.3 remete para a ADR-005 e para as cinco condições.
- O custo por task citado em 6.3 é igual ao de `docs/orquestrador.md`.
- `pnpm exec prettier --check docs/projeto.md` passa.
- `pnpm lint`, `pnpm typecheck` e `pnpm test` passam.

## Aceitação

As secções 6.3 e 7.3 de `docs/projeto.md` descrevem o estado real do projecto e não contradizem as ADRs.

## Checklist de clareza

- Objetivo único e verificável — ATENDE
- Arquivos afetados — ATENDE
- Entregáveis concretos — ATENDE
- Contrato de entrada, saída e erros — ATENDE (entrada: `docs/orquestrador.md`, ADR-005, ADR-007 e `bakeoff/results.json`; saída: as duas secções reescritas; erros: um número divergente da fonte é corrigido a favor da fonte)
- Testes obrigatórios — ATENDE
- Critério de aceitação objetivo — ATENDE
- Dependências declaradas explicitamente — ATENDE
- Ausência de decisões pendentes para o implementador — ATENDE
