# TASK-005 — Criar os comandos do orquestrador

- Change: 006-agent-orchestrator
- Status: COMPLETED
- Depende de: TASK-004
- Início: 2026-11-16
- Verificação: VERIFIED (2026-11-16) — Dois comandos criados: /orquestrar (agent orquestrador, modelo gpt-6-luna) e /clarity (agent analista-clareza, modelo gpt-6-luna, subagent true). Referencia a agentes validada contra os 8 ficheiros em .opencode/agents; erro de grafia 'analyst-clareza' corrigido para 'analista-clareza'. Teste real do /clarity sobre a TASK-005 da change 001 devolveu pontuacao 55/100 com dois bloqueios fundamentados (criterios de aceitacao subjectivos e dependencia TASK-004 por verificar) e nao escreveu qualquer ficheiro. pnpm lint, typecheck, test (134 passando, 1 pulado) e prettier aprovados em 2026-11-16
- Evidência: Dois comandos criados: /orquestrar (agent orquestrador, modelo gpt-6-luna) e /clarity (agent analista-clareza, modelo gpt-6-luna, subagent true). Referencia a agentes validada contra os 8 ficheiros em .opencode/agents; erro de grafia 'analyst-clareza' corrigido para 'analista-clareza'. Teste real do /clarity sobre a TASK-005 da change 001 devolveu pontuacao 55/100 com dois bloqueios fundamentados (criterios de aceitacao subjectivos e dependencia TASK-004 por verificar) e nao escreveu qualquer ficheiro. pnpm lint, typecheck, test (134 passando, 1 pulado) e prettier aprovados em 2026-11-16
- Plano de ação: none

## Objetivo

Criar os comandos `/orquestrar` e `/clarity`, que expõem o pipeline de seis etapas e o
gate de clareza isolado.

## Arquivos

- `.opencode/commands/orquestrar.md` (criação)
- `.opencode/commands/clarity.md` (criação)

## Entregáveis

- `/orquestrar TASK-NNN` executa a sequência de `docs/orquestrador.md` §5.1: exploração, clareza, aprovação, implementação, verificação, revisão em par, registo.
- `/orquestrar` sem argumento pergunta ao utilizador qual task executar, ou apresenta a task elegível se houver apenas uma.
- `/clarity TASK-NNN` executa apenas o gate dos 10 critérios e devolve a pontuação, sem tocar em ficheiros.
- Ambos os comandos usam `$ARGUMENTS` para o identificador da task.
- Ambos param imediatamente quando a pontuação de clareza é inferior a 90/100.
- Ambos param e perguntam ao utilizador quando detectam uma discrepância entre a task e o estado do repositório.
- `/clarity` tem `subagent: true` e corre em sessão de fundo, para não bloquear a sessão principal.
- A etapa de revisão em par invoca `revisor` e `revisor-b`, e trata a divergência entre os dois com a regra de desempate definida no design.

## Regras

- Os comandos não duplicam a lógica dos agentes. Referenciam-nos pelo nome e pelo papel.
- `/orquestrar` delega as etapas de implementação e verificação aos agentes `implementador` e `verificador`, e o registo ao `guardiao`.
- `/orquestrar` delega a revisão em par aos agentes `revisor` e `revisor-b`.
- `/clarity` delega ao `analista-clareza`.
- Nenhum comando executa `git commit` ou `git push` directamente. Essa responsabilidade é do `guardiao`.
- Nenhum comando escreve em `src/content/`.
- As instruções do comando seguem as regras de `AGENTS.md`: resumo prévio e pergunta em discrepância.

## Testes

- `/clarity TASK-005` devolve uma pontuação sobre 100 com evidências e não altera ficheiro algum.
- `/clarity` sobre uma task com dependência pendente reporta o bloqueio em vez de pontuar.
- `/orquestrar` sem argumento apresenta as tasks elegíveis.
- `/orquestrar TASK-005` apresenta o resumo antes de escrever.
- A revisão em par reporta os achados dos dois revisores, distinguindo aprovação de reprovação de ambos.
- Nenhum comando produz commit ou push: `git log` não muda durante uma execução interrompida antes da etapa de registo.
- `pnpm exec prettier --check .opencode/commands` passa.
- `pnpm lint`, `pnpm typecheck` e `pnpm test` passam.

## Aceitação

`/orquestrar` e `/clarity` executam o pipeline definido, param nos gates de clareza e de discrepância, e não cometem nem enviam nada por conta própria.

## Checklist de clareza

- Objetivo único e verificável — ATENDE
- Arquivos afetados — ATENDE
- Entregáveis concretos — ATENDE
- Contrato de entrada, saída e erros — ATENDE (entrada: identificador de task; saída: pipeline executado ou gate avaliado; erros: task inexistente, ambígua ou arquivada é reportada sem escrita)
- Testes obrigatórios — ATENDE
- Critério de aceitação objetivo — ATENDE
- Dependências declaradas explicitamente — ATENDE
- Ausência de decisões pendentes para o implementador — ATENDE
