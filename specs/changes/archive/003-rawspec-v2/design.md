# Design Técnico — RawSpec v2

**Change:** `003-rawspec-v2`
**Status:** APPROVED
**Aprovação:** 2026-11-15
**Base:** `proposal.md`

## 1. Objetivo

Definir o formato v2 das especificações: uma tarefa por arquivo, arquivamento individual após aprovação, histórico obrigatório, baixo acoplamento e total modificabilidade.

## 2. Princípios

1. **Markdown versionado é a única fonte de verdade.** Sem estado paralelo.
2. **Uma tarefa por arquivo.** Tarefas são independentes e revisionáveis isoladamente.
3. **Aprovação é humana.** Comandos leem aprovação; nunca a concedem.
4. **Ambiguidade é resolvida pelo usuário.** O comando nunca escolhe sozinho.
5. **Escrita mínima e atômica.** Preservar o restante do conteúdo.
6. **Sem destruição.** Não apagar tarefas, mudanças ou histórico.
7. **Sem commit/push automático.** No máximo staging em caminhos exatos.
8. **Histórico obrigatório e append-only.** Toda decisão, evento e detalhe relevante é registrado.
9. **Baixo acoplamento.** Um único parser compartilhado pelos comandos.
10. **Modificabilidade.** Templates, documentação e parser são versionados e podem ser alterados.

## 3. Layout v2

```text
specs/
  changes/
    NNN-slug/
      proposal.md
      design.md              (opcional)
      tasks/
        TASK-001.md
        TASK-002.md
        archive/
          TASK-001.md
      action-plans/
        TASK-001-YYYY-MM-DD-slug.md
    archive/
      NNN-slug/
        proposal.md
        design.md
        tasks/
          archive/
            TASK-001.md
  templates/
    task.md
    proposal.md
    design.md
    action-plan.md
    history-entry.md
docs/
  history.md
  decisions/
    ADR-001-rawspec-storage.md
    ADR-002-uma-tarefa-por-arquivo.md
    ADR-003-arquivamento-de-tarefa.md
    ADR-004-historico-obrigatorio.md
scripts/
  rawspec-v2.mjs
  rawspec-v2.test.mjs
.opencode/
  commands/
    startspec.md
    continuespec.md
    arquivespec.md
    archivespec.md
    logspec.md
```

## 4. Tarefa

### 4.1 Arquivo

`specs/changes/NNN-slug/tasks/TASK-NNN.md`

### 4.2 Cabeçalho e campos

```markdown
# TASK-001 — Título

- Change: 003-rawspec-v2
- Status: PENDING
- Depende de: nenhuma
- Início: —
- Verificação: PENDING
- Evidência: —
- Plano de ação: none
```

Regras:

- `Change` é obrigatório e deve corresponder à mudança que contém o arquivo.
- `Status` ausente equivale a `PENDING`.
- `Verificação` ausente equivale a `PENDING`.
- `Depende de` é obrigatório. `nenhuma` ou `—` significa sem dependência.
- `Início` e `Evidência` usam `—` quando ausentes.
- `Plano de ação` usa `none` quando ausente.
- O parser não tenta adivinhar campos; estrutura malformada retorna `E_PARSE`.

### 4.3 Status e verificação

Status da tarefa: `PENDING`, `IN PROGRESS`, `VERIFYING`, `COMPLETED`, `ARCHIVED`.

Verificação: `PENDING`, `VERIFIED`, `FAILED`.

Invariante de conclusão: `Status: COMPLETED` e `Verificação: VERIFIED`.

Invariante de arquivamento: `Status: ARCHIVED`, com `Verificação: VERIFIED` preservado.

### 4.4 Ciclo de vida

```text
PENDING
   | /startspec
   v
IN PROGRESS
   | /continuespec (implementação concluída)
   v
VERIFYING
   | /continuespec (verificações aprovadas + evidência)
   v
COMPLETED + VERIFIED
   | /arquivespec (aprovação humana)
   v
ARCHIVED
```

Falha de verificação: `VERIFYING` volta para `IN PROGRESS` com `Verificação: FAILED (data) — motivo`.

### 4.5 Conteúdo

Seções esperadas: `Objetivo`, `Arquivos`, `Entregáveis`, `Regras`, `Testes`, `Aceitação`, `Checklist de clareza`.

## 5. Arquivamento de tarefa

Pré-condições:

- `Status: COMPLETED` e `Verificação: VERIFIED`;
- nenhum plano de ação não resolvido;
- aprovação humana explícita.

Sequência:

1. Validar as pré-condições.
2. Perguntar a aprovação ao usuário.
3. Atualizar o arquivo: `Status: ARCHIVED` e `- Arquivada em: YYYY-MM-DD`.
4. Mover atomicamente para `tasks/archive/TASK-NNN.md`.
5. Se não restarem tarefas não arquivadas, arquivar a mudança.

Recuperação:

- Arquivo marcado como `ARCHIVED` ainda em `tasks/`: mover para `tasks/archive/`.
- Arquivo já em `tasks/archive/`: concluir sem mover de novo.
- Nenhum commit, push ou remoção de conteúdo.

## 6. Mudança

### 6.1 Status

`proposal.md` pode ter `PENDING APPROVAL`, `APPROVED`, `SUPERSEDED` ou `ARCHIVED`.

A mudança não tem status de execução próprio; ele é derivado das tarefas.

### 6.2 Arquivamento de mudança

Pré-condições:

- Todas as tarefas em `tasks/archive/` com `Status: ARCHIVED`;
- Todos os planos de ação em `RESOLVED`;
- Aprovação humana explícita.

Sequência:

1. Validar as pré-condições.
2. Mover atomicamente para `specs/changes/archive/NNN-slug/`.
3. Marcar `proposal.md` com `Status: ARCHIVED` e `- Arquivada em: YYYY-MM-DD`.
4. Opcional: staging dos caminhos exatos, sem commit nem push.

Recuperação:

- Destino inexistente: validar e mover.
- Destino existente com `Status: ARCHIVED`: concluir sem mover de novo.
- Destino existente sem `Status: ARCHIVED`: parar com `E_ARCHIVE_STATE_UNKNOWN`.

## 7. Histórico e decisões

### 7.1 `docs/history.md`

Append-only. Nunca reescrever entradas antigas.

Formato:

```markdown
## YYYY-MM-DD — <Tipo> — <Título>

- Autor: <nome>
- Origem: <sessão ou comando>
- Decisão: <texto>
- Motivo: <texto>
- Impacto: <texto>
- Evidência: <texto>
```

Tipos: `Decisão`, `Evento`, `Detalhe`.

### 7.2 ADRs

`docs/decisions/ADR-NNN-slug.md`, com `Status: Proposed`, `Accepted`, `Superseded` ou `Rejected`, e seções `Contexto`, `Alternativas consideradas`, `Decisão`, `Justificativa`, `Consequências`.

### 7.3 `/logspec`

Registra uma entrada em `docs/history.md`. Flags:

- `--type <Decisão|Evento|Detalhe>`
- `--title <título>`
- `--message <texto>`
- `--origin <origem>`
- `--impact <impacto>`
- `--evidence <evidência>`
- `--adr` — cria também um esqueleto de ADR

Valida campos obrigatórios, impede reescrita e confina a escrita a `docs/history.md` e `docs/decisions/`.

## 8. Comandos

| Comando | Responsabilidade |
|---|---|
| `/startspec [TASK-ID] [--change CHANGE-ID]` | Inicia tarefa `PENDING`. |
| `/continuespec [TASK-ID] [--change CHANGE-ID]` | Continua, verifica e conclui. |
| `/arquivespec TASK-ID [--change CHANGE-ID]` | Arquiva tarefa após aprovação. |
| `/archivespec [CHANGE-ID]` | Arquiva mudança elegível. |
| `/logspec ...` | Registra histórico. |

Regras comuns:

- Resolver tarefa/mudança antes de agir.
- Perguntar ao usuário em ambiguidade.
- Validar aprovação da mudança e dependências.
- Nunca alterar status de aprovação.
- Nunca fazer commit nem push.
- Gerar mensagem de commit ao concluir tarefa, sem executá-la.

## 9. Migração

### 9.1 Change `001-portfolio-mvp`

- Dividir `tasks.md` em `tasks/TASK-NNN.md`.
- Preservar `Status`, `Verificação`, `Evidência`, `Plano de ação` e conteúdo.
- Explicitar `Depende de` pela ordem do arquivo (`nenhuma` para a primeira).
- Mover tarefas `COMPLETED` para `tasks/archive/`.
- Manter `proposal.md` e `design.md`.
- Remover `tasks.md` após migração validada.

### 9.2 Change `002-rawspec-task-commands`

- Marcar `proposal.md` com `Status: SUPERSEDED` e `- Superseded by: 003-rawspec-v2`.
- Não executar as tarefas pendentes.
- Preservar `tasks.md`, `design.md` e artefatos existentes.

## 10. Helper e contratos

`scripts/rawspec-v2.mjs` exporta:

- `parseTaskFile(path)` — lê e valida um arquivo de tarefa.
- `parseChange(dir)` — lê uma mudança v2.
- `resolveTask(id, { changeId })` — resolve tarefa em `specs/changes/*/tasks/`.
- `listOpenTasks()`, `listPendingChanges()`, `selectNextTask()`.
- `validateApproval(change)`, `validateDependencies(task, change)`.
- `startTask`, `beginVerification`, `verifyTask`, `failTask`.
- `archiveTask`, `archiveChange`.
- `appendHistory(entry)`, `createAdrSkeleton(...)`.
- `RawspecError` com códigos estáveis.

Saída em JSON para integração com os comandos.

Códigos de erro: `E_ARGS`, `E_PARSE`, `E_TASK_NOT_FOUND`, `E_TASK_AMBIGUOUS`, `E_CHANGE_NOT_APPROVED`, `E_DEPENDENCY_PENDING`, `E_DEPENDENCY_UNDECLARED`, `E_DEPENDENCY_UNKNOWN`, `E_DEPENDENCY_CYCLE`, `E_TASK_STATE`, `E_EVIDENCE_REQUIRED`, `E_APPROVAL_REQUIRED`, `E_ARCHIVE_STATE_UNKNOWN`, `E_PATH_ESCAPE`, `E_HISTORY_INVALID`.

## 11. Testes

- Vitest, ambiente Node, diretórios temporários.
- Nenhum teste escreve em `specs/changes/` real.
- Cobrir parsing, resolução, gates, transições, arquivamento, histórico e migração.

## 12. Critérios de aceitação

- Formato v2 documentado e template de tarefa versionado.
- Parser v2 lê e valida um arquivo por tarefa.
- Comandos v2 existem e usam o helper compartilhado.
- Tarefa só é arquivada após `COMPLETED` + `VERIFIED` e aprovação humana.
- Mudança só é arquivada com todas as tarefas arquivadas.
- `docs/history.md` registra as decisões da sessão.
- ADRs de formato, arquivamento e histórico existem.
- Change `001` migrada e change `002` marcada como `SUPERSEDED`.
- `pnpm lint`, `pnpm typecheck`, `pnpm test` e `pnpm build` passam.
