# TASK-006 — Documentar o orquestrador e registar o ADR

- Change: 006-agent-orchestrator
- Status: PENDING
- Depende de: TASK-005
- Início: —
- Verificação: PENDING
- Evidência: —
- Plano de ação: none

## Objetivo

Documentar a tabela de routing, os gates, a política de permissões e a economia de
tokens, e registar a decisão numa ADR.

## Arquivos

- `docs/orquestrador.md` (criação)
- `docs/decisions/ADR-007-orquestrador-de-agentes.md` (criação)
- `docs/history.md` (entrada de decisão)
- `README.md` (referência ao novo documento)

## Entregáveis

- `docs/orquestrador.md` com a tabela de routing de `design.md` §4.1, uma linha por agente, com provider, modelo, variante e custo de input, output e cache read.
- `docs/orquestrador.md` com o score medido de cada modelo no bake-off e a ligação a `bakeoff/README.md`.
- `docs/orquestrador.md` com as faixas T0 a T2 e a regra de que `gpt-5.5`, `gpt-5.5-pro` e `gemini-3.1-pro` estão excluídos do routing.
- `docs/orquestrador.md` com a regra de que todos os modelos são do provider `opencode-go`, e a razão.
- `docs/orquestrador.md` com as três regras de escalonamento de `design.md` §4.3.
- `docs/orquestrador.md` com as cinco condições do push automático de `design.md` §5.2.
- `docs/orquestrador.md` com a economia de tokens de `design.md` §8, incluindo o custo por task e o orçamento de 30 execuções.
- `docs/orquestrador.md` com um diagrama do pipeline em texto.
- ADR-007 com `Status`, `Contexto`, `Alternativas consideradas`, `Decisão`, `Justificativa` e `Consequências`.
- Entrada em `docs/history.md` do tipo `Decisão`, a registar o orquestrador e as oito decisões confirmadas.
- `README.md` com uma referência a `docs/orquestrador.md`.

## Regras

- A ADR registra as decisões confirmadas pelo utilizador, incluindo a exclusão do tier de arbitragem por restrição orçamental e a prioridade da qualidade sobre a latência.
- A ADR regista que o routing foi fundamentado por medição, com o bake-off como evidência, e não por tabela de preços.
- As alternativas consideradas na ADR incluem: usar apenas os agentes nativos sem configuração, um orquestrador em código próprio, e um plugin do OpenCode.
- A ADR regista que a solução escolhida é configuração nativa, reversível e sem dependências.
- A tabela de routing no documento reproduz a de `design.md` §4.1 sem divergência de custos nem de scores.
- A entrada de histórico segue o formato de `docs/rawspec-v2.md` §6.1 e é acrescentada ao final do ficheiro.
- O documento escreve-se em português, no registo do repositório.

## Testes

- `docs/orquestrador.md` contém uma entrada por agente, com os quatro campos de custo.
- Cada modelo listado em `docs/orquestrador.md` pertence ao provider `opencode-go`.
- Os três modelos excluídos do routing estão nomeados no documento.
- O score medido de cada modelo no documento coincide com `bakeoff/README.md`.
- A ADR-007 tem as seis secções exigidas por `docs/rawspec-v2.md` §6.2.
- A entrada de `docs/history.md` segue o formato de `docs/rawspec-v2.md` §6.1, com os seis campos.
- A entrada é a última do ficheiro.
- `pnpm exec prettier --check docs README.md` passa.
- `pnpm lint`, `pnpm typecheck` e `pnpm test` passam.

## Aceitação

O routing, os gates e a economia de tokens estão documentados, a decisão está registada em ADR e histórico, e o `README.md` refere o novo documento.

## Checklist de clareza

- Objetivo único e verificável — ATENDE
- Arquivos afetados — ATENDE
- Entregáveis concretos — ATENDE
- Contrato de entrada, saída e erros — ATENDE (entrada: `design.md` §4.1, §4.3, §5.2 e §8; saída: documento, ADR e entrada de histórico; erros: divergência de custos entre o documento e o design é corrigida a favor do design)
- Testes obrigatórios — ATENDE
- Critério de aceitação objetivo — ATENDE
- Dependências declaradas explicitamente — ATENDE
- Ausência de decisões pendentes para o implementador — ATENDE
