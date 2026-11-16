# TASK-004 — Criar os agentes especializados

- Change: 006-agent-orchestrator
- Status: PENDING
- Depende de: TASK-003
- Início: —
- Verificação: PENDING
- Evidência: —
- Plano de ação: none

## Objetivo

Criar os oito agentes do orquestrador em `.opencode/agents/`, cada um com modelo,
variante, permissões e prompt de sistema coerentes com a tabela de routing.

## Arquivos

- `.opencode/agents/orquestrador.md` (criação)
- `.opencode/agents/explorador.md` (criação)
- `.opencode/agents/analista-clareza.md` (criação)
- `.opencode/agents/implementador.md` (criação)
- `.opencode/agents/revisor.md` (criação)
- `.opencode/agents/revisor-b.md` (criação)
- `.opencode/agents/verificador.md` (criação)
- `.opencode/agents/guardiao.md` (criação)

## Entregáveis

- Oito ficheiros Markdown em `.opencode/agents/`, com frontmatter `description`, `mode`, `model` e `permissions`.
- Cada agente tem um `description` que explica quando deve ser lançado, porque o OpenCode usa esse texto para escolher o agente.
- `explorador`, `analista-clareza`, `revisor`, `revisor-b` e `verificador` não conseguem escrever ficheiros.
- `implementador` escreve em `src/**` e precisa de autorização em `src/content/**`.
- `guardiao` tem permissão de `git add`, `git commit` e `git push`, e de escrita em `specs/**` apenas através da CLI RawSpec.
- `orquestrador` tem `shell` em `ask`.
- `guardiao` implementa o gate de âmbito: antes de qualquer `git add`, compara `git status --porcelain` com a lista de `## Arquivos` da task e bloqueia o commit se houver ficheiros fora do âmbito.
- Cada agente tem `steps` definido, para limitar custo e evitar execuções sem fim.
- O corpo de cada ficheiro é o prompt de sistema do agente, em português, e descreve o formato de saída `ESTADO / MOTIVO / EVIDENCIA / ARQUIVOS`.
- `revisor` e `revisor-b` têm prompts distintos, com instruções de foco diferentes, para reduzir a correlação entre os achados.

## Regras

- Os modelos e as variantes são os da tabela de routing de `docs/orquestrador.md` §4.1, sem alteração. Todos pertencem ao provider `opencode-go`.
- As variantes de effort são `max` ou `high`, nunca `low` ou `medium`. A prioridade é qualidade, não latência.
- `orquestrador` é `mode: primary`. Os restantes sete são `mode: subagent`.
- As permissões de agente são anexadas às globais de `opencode.json` e a última correspondência prevalece. As regras de agente são mais específicas do que as globais.
- As permissões de escrita são declaradas por glob de caminho, não por `resource: "*"` com `allow`.
- O `guardiao` escreve em `specs/**` apenas através de `scripts/rawspec-v2-cli.mjs`, e o seu prompt diz isso explicitamente.
- Nenhum agente tem permissão de `webfetch` ou `websearch` que não seja estritamente necessária. A exploração é local.
- O `prompt` de cada agente cita `docs/projeto.md` e `AGENTS.md` como referência, sem os copiar.
- Nenhum agente usa um modelo que exija consentimento adicional da conta, nem do provider `opencode` (Personal), que não tem créditos.
- O `revisor-b` usa `kimi-k2.7-code`, que não tem variantes de effort. O frontmatter declara o modelo sem variante.

## Testes

- Os oito agentes aparecem na listagem de agentes do OpenCode, cada um com o modelo esperado.
- Uma invocação do `explorador` que tente escrever um ficheiro é bloqueada pela permissão.
- Uma invocação do `implementador` que escreva em `src/**` tem sucesso; a mesma tentativa em `src/content/**` pede autorização.
- Uma invocação do `verificador` que corra `pnpm test` tem sucesso; a mesma que tente `git commit` é bloqueada.
- O `revisor` e o `revisor-b` são agentes distintos, com modelos distintos e prompts distintos.
- `pnpm exec prettier --check .opencode/agents` passa.
- `pnpm lint`, `pnpm typecheck` e `pnpm test` passam.

## Aceitação

Os oito agentes existem, são descobertos pelo OpenCode, e cada um tem o modelo, as permissões e o prompt de sistema definidos na tabela de routing.

## Checklist de clareza

- Objetivo único e verificável — ATENDE
- Arquivos afetados — ATENDE
- Entregáveis concretos — ATENDE
- Contrato de entrada, saída e erros — ATENDE (entrada: `docs/orquestrador.md` §4.1 e §5.3; saída: oito agentes com modelo e permissões; erros: modelo inexistente ou variante inválida impedem o carregamento do agente)
- Testes obrigatórios — ATENDE
- Critério de aceitação objetivo — ATENDE
- Dependências declaradas explicitamente — ATENDE
- Ausência de decisões pendentes para o implementador — ATENDE
