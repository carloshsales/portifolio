# Change 015 — Verificação executada por agente e integração do trabalho pendente

- Status: APPROVED
- Tipo: Ferramentas de desenvolvimento
- Prioridade: Alta
- Data: 2026-11-25
- Relacionadas: `008-orquestracao-verificacao-e-push` (arquivada, revertida por esta), `010-corrigir-o-ttl-de-cache-do-provider` (arquivada, complementada por esta)

## 1. Objetivo

Integrar no `main` o trabalho de desenvolvimento que ficou pendente em sessions
anteriores, actualmente preservado num stash: o agente `executor`, que executa a
verificação manual do projecto e entrega a evidência ao `verificador`; o override
de TTL de cache por modelo em `opencode.json`; e a documentação do orquestrador
que descreve este fluxo.

## 2. Problema

Entre 2026-11-24 e 2026-11-25, três decisões de arquitectura do orquestrador foram
tomadas e implementadas, mas o trabalho nunca chegou ao `main`:

1. **A verificação manual passou a ser executada por um agente.** A change 008
   havia implementado o fluxo em que o utilizador executa `pnpm test` e
   `pnpm test:e2e` manualmente. A medição mostrou que esse passo era o mais
   lento e o mais frágil do pipeline, e que a separação entre um agente que
   executa e outro que avalia preserva a independência do gate. O agente
   `executor` foi criado para esse efeito, com a ADR-010 a registar a decisão.

2. **O cache TTL deixou de ser uniforme.** O `cache.ttl` de `30m` que o provider
   `opencode-go` aceita rejeita o `claude-haiku-5-5`, usado por três agentes.
   A correcção é um override ao nível do modelo, e não do provider.

3. **O guardião passou a indicar a próxima task.** O relatório final do pipeline
   passa a incluir o campo `PROXIMA`, com a ADR-011 a registar a decisão.

O trabalho ficou retido num stash (`stash@{0}`, mensagem
`sessoes-anteriores-pre-TASK-006`) porque o gate de âmbito do `commit-task` da
TASK-006 bloqueou o commit ao encontrar 25 ficheiros modificados que não
pertenciam àquela task. O stash é a única cópia deste trabalho: sem integração,
as decisões ficam aplicadas no `main` apenas pela via das entradas de
`docs/history.md`, sem o código, a configuração nem a documentação que as
implementam.

## 3. Contexto adicional

A execução anterior da TASK-006, retida na branch
`task/001-006-implementar-secao-de-projetos` (commit `0e4df25`), foi uma auditoria
read-only que nunca foi enviada ao remoto nem teve pull request. Esta change não
toca nessa branch nem reabre a TASK-006, que foi arquivada em 2026-11-25 com o
código integrado através do PR #26.

## 4. Escopo

### 4.1 Incluído

- **Agente `executor`** — novo agente, em `.opencode/agents/executor.md`, que
  executa `pnpm test` e `pnpm test:e2e` por esta ordem e devolve a evidência.
  Sem `edit`, com `shell` limitado aos seis comandos de leitura.
- **Permissões do `executor`** — `edit: deny` e `shell` em `allow` para os seis
  comandos de leitura, com a regra geral `deny` antes das específicas. O agente
  **não** tem `subagent: deny`, por medição: negar `edit` e `subagent` em
  conjunto remove a ferramenta de shell por completo.
- **`verificador`** — passa a avaliar a evidência enviada pelo `executor` e
  distingue a ausência de execução, que é falha, da evidência em falta, que é
  falta de evidência.
- **`orquestrador`** — invoca o `executor` na etapa de verificação e envia a
  evidência ao `verificador`.
- **`implementador`** — distingue as suas verificações de task da verificação
  global do pipeline.
- **`guardiao`** — ganha a secção "Próxima task", com a ordem de procura, os
  quatro resultados possíveis e a proibição de implementar ou alterar o estado
  da task seguinte.
- **Comandos `/orquestrar`, `/continuespec`, `/startspec` e `/clarity`** —
  alinhados com o fluxo por agente.
- **`AGENTS.md`** — a divisão de responsabilidades passa a ter o `executor` como
  agente que executa a verificação, e o utilizador passa a intervir apenas em
  decisões de âmbito, discrepâncias e desempates.
- **`opencode.json`** — override de `cache.ttl` para `5m` no modelo
  `claude-haiku-5-5`, mantendo `30m` no provider.
- **`docs/orquestrador.md`** — tabela de routing com nove agentes, tabela de
  custos, secção do cache TTL por modelo, secção sobre a ressalva de
  independência da revisão em par e a matriz de permissões.
- **`docs/projeto.md`** — referências ao `executor` e aos nove agentes.
- **`docs/rawspec-v2.md`** — secção 10 e secção 15 alinhadas com o fluxo por
  agente.
- **`README.md`** e **`bakeoff/`** — reflexos do routing, dos custos e das
  verificações de configuração.
- **ADRs** — ADR-009 (routing para o `minimax-m3`), ADR-010 (verificação
  executada por agente) e ADR-011 (próxima task ao terminar).

### 4.2 Fora do escopo

- Código de produto. Nenhuma escrita em `src/`.
- Alteração do estado de aprovação de qualquer change ou task.
- Reabertura da TASK-006 ou integração da branch órfã
  `task/001-006-implementar-secao-de-projetos`.
- Alterações em `docs/history.md`, que já contém as entradas de 2026-11-24
  registadas pelo PR #25. Esta change acrescenta apenas a sua própria entrada,
  por append.
- Qualquer alteração às permissões globais de `opencode.json` para lá do
  override de cache por modelo.
- A TASK-007 e seguintes, da change 001.

## 5. Requisitos

### 5.1 Funcionais

- O `executor` executa `pnpm test` e `pnpm test:e2e` e devolve, para cada um, o
  comando exacto, o código de saída e a saída relevante.
- O `executor` não escreve ficheiros: `edit` está em `deny`.
- O `executor` não executa comandos que reescrevam ficheiros: `pnpm lint:fix` e
  `pnpm format` ficam de fora, e `pnpm dev` e `pnpm preview` também, porque
  bloqueiam o processo.
- O `verificador` avalia a evidência sem executar shell.
- O `orquestrador` invoca o `executor` antes da revisão e do registo.
- O `guardiao` devolve a próxima task no relatório final.
- O `opencode.json` mantém `30m` no provider e define `5m` para o modelo
  `claude-haiku-5-5`.

### 5.2 Não funcionais

- Nenhuma escrita em `src/`.
- Nenhuma reescrita de histórico: sem `reset --hard`, `checkout --`, `restore`
  ou `clean`.
- Nenhum commit ou push sem os gates C1 a C5 cumpridos.
- Nunca `--no-verify`.

## 6. Critérios de aceitação

- `node bakeoff/validate.mjs` confirma a configuração, os nove agentes, os
  modelos, as permissões e a integridade do histórico.
- `node bakeoff/check-agents.mjs` descobre os nove agentes.
- `node bakeoff/check-permissions.mjs` confirma que o `executor` executa os seis
  comandos de leitura e não escreve.
- Os nove agentes carregam e respondem com o modelo que cada um declara.
- `pnpm lint`, `pnpm typecheck`, `pnpm test` e `pnpm build` passam, por esta
  ordem, dentro do `commit-task`.
- O commit é feito apenas pelo `guardião`, via `commit-task`, e o pull request
  é aberto automaticamente.
- O gate de âmbito do `commit-task` não reporta ficheiros fora do âmbito.
- `docs/history.md` conserva todas as entradas existentes e recebe uma entrada
  por append.

## 7. Riscos e mitigação

- **Risco: o gate de âmbito bloqueia o commit.** Mitigação: o âmbito da task
  declara os 25 ficheiros do stash, que são exactamente os ficheiros tocados. O
  `guardião` reporta a lista se algum ficheiro inesperado aparecer, sem
  descartar nada.
- **Risco: perda do trabalho do stash.** Mitigação: o stash só é removido
  depois de o commit correspondente estar no `origin/main`, e a aplicação é
  verificada antes do commit.
- **Risco: o override de cache TTL não surte efeito nesta sessão.** O valor é
  lido ao arranque, pelo que o efeito só aparece em sessões novas. A mitigação
  é a verificação de que a configuração é válida e resolve, não a de que o
  cache já esteja activo.
- **Risco: divergência entre o `docs/history.md` do `main` e o esperado.** As
  entradas de 2026-11-24 já estão no `main` pelo PR #25, pelo que não há
  duplicação a reintroduzir.

## 8. Decisões confirmadas

- O trabalho é integrado como change própria, e não como parte da TASK-006 ou
  TASK-007. O âmbito é transversal ao produto e não pertence a nenhuma task
  aberta da change 001.
- As três ADRs são integradas na mesma change, porque documentam decisões das
  quais o código e a configuração são implementação.
- O stash só é removido depois de o commit estar no `origin/main`.
- A verificação continua a ser executada por agente, e o utilizador não passa a
  executar `pnpm test` nem `pnpm test:e2e`.

## 9. Aprovação

Esta proposta depende de aprovação humana antes do início da implementação.
A aprovação é registada pelo utilizador, alterando `Status` para `APPROVED`.

Aprovada pelo utilizador em 2026-11-25, com a ressalva de que a TASK-007 e
seguintes ficam para uma sessão posterior.
