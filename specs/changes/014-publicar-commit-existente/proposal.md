# Change 014 — Publicar commit de task já existente

- Status: APPROVED
- Tipo: Melhoria de processo
- Prioridade: Alta
- Data: 2026-11-23
- Relacionadas: `012-pull-request-automatico`, `013-...` (contexto; tasks concluídas não reabertas)

## 1. Objetivo

Permitir que o RawSpec publique, de forma idempotente, um commit de task já existente
localmente quando a worktree está limpa (sem alterações staged ou unstaged), correndo
os checks e o gate de âmbito e abrindo o pull request de forma idempotente, ou
reportando claramente um no-op/erro quando não existir commit elegível.

## 2. Problema

A TASK-001 da change 013 está COMPLETED/VERIFIED. Existem commits locais (`0b260bf`
e `6e4ef85`), mas não há branch remota nem pull request. A tentativa de `commit-task`
reportou `lint-staged could not find any staged files`; a causa exacta da ausência de
push não está confirmada. O `commit-task` actual pressupõe que existem ficheiros
staged para commitar, pelo que, quando a worktree está limpa mas há um commit válido
localmente, não existe via suportada para empurrar esse commit e abrir o pull request.

## 3. Escopo

### 3.1 Incluído

- Diagnóstico da causa real da falha `lint-staged could not find any staged files`
  (diagnóstico-first).
- Definição de uma via suportada pelo RawSpec para, após checks e gate, empurrar
  idempotentemente um commit de task já válido quando não há staged files e abrir
  o pull request idempotente.
- Reporte claro de no-op/erro quando não houver commit elegível.
- Preservação do fluxo normal com alterações staged.
- Scope potencial: `scripts/rawspec-v2.mjs`, `scripts/rawspec-v2-cli.mjs`,
  `scripts/rawspec-v2.test.mjs`, `scripts/rawspec-v2-cli.test.mjs`, documentação e
  comandos apenas se necessário; os ficheiros exactos serão definidos na task após
  aprovação.

### 3.2 Fora do escopo

- Criação de commits vazios.
- Contornar hooks (`--no-verify`).
- Push ou pull request manual fora do `commit-task`.
- Reabrir tasks concluídas das changes 012 e 013.
- Alterar estado de aprovação de mudança ou task.
- Alterações em `src/`, conteúdo, layout, tema visual.
- Reescrita de histórico.

## 4. Comportamento proposto

- O `commit-task` diagnostica a causa real antes de agir.
- Quando a worktree está limpa mas existe um commit local válido para a task, o
  `commit-task` pode empurrar esse commit (sem criar commit vazio) após correr
  `pnpm lint`, `pnpm typecheck`, `pnpm test` e `pnpm build`, por esta ordem, e
  aplicar o gate de âmbito.
- O pull request é aberto de forma idempotente (reutiliza existente; não duplica).
- Quando não há commit elegível, reporta no-op/erro claro, sem push nem pull
  request.
- O fluxo normal com alterações staged mantém-se inalterado.

## 5. Requisitos

### 5.1 Funcionais

- Confirmar a causa real da ausência de push.
- Publicar idempotentemente um commit de task já válido quando não há staged files.
- Abrir pull request idempotente após push.
- Reportar claramente no-op/erro se não houver commit elegível.
- Não criar commits vazios.
- Não contornar hooks.
- Preservar fluxo normal com alterações staged.

### 5.2 Não funcionais

- Nenhuma alteração ao estado de aprovação de mudança ou task.
- Nenhuma reescrita de histórico.
- Nenhuma chamada ao GitHub CLI por shell.
- Nenhum acesso à rede nos testes.
- Checks automáticos mantêm-se obrigatórios e anteriores ao commit/push.

## 6. Critérios de aceitação

- Causa real diagnosticada e documentada.
- Publicação idempotente do commit existente funciona quando worktree limpa.
- Pull request idempotente (sem duplicados).
- No-op/erro claro quando não há commit elegível.
- Checks/gate/hook activos.
- Sem commits vazios, sem `--no-verify`, sem push/PR manual.
- `pnpm lint`, `pnpm typecheck`, `pnpm test` e `pnpm build` passam, por esta ordem.

## 7. Riscos e mitigação

- Risco: publicar commit não elegível. Mitigação: validar task COMPLETED/VERIFIED e
  commit correspondente antes do push.
- Risco: duplicar pull request. Mitigação: idempotência por procura prévia.
- Risco: mascarar no-op como sucesso. Mitigação: reporte explícito de no-op/erro.

## 8. Decisões confirmadas

- Diagnóstico-first.
- Idempotência na publicação e no pull request.
- Sem commits vazios, sem contornar hooks, sem push/PR manual.

## 9. Aprovação

Esta proposta depende de aprovação humana antes do início da implementação.
A aprovação é registada pelo utilizador, alterando `Status` para `APPROVED`.
