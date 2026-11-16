# RawSpec v2

Referência do formato das especificações: uma tarefa por arquivo, arquivamento individual após aprovação, histórico obrigatório, baixo acoplamento e total modificabilidade.

## 1. Princípios

1. Markdown versionado é a única fonte de verdade.
2. Uma tarefa por arquivo.
3. Aprovação é humana.
4. Ambiguidade é resolvida pelo usuário.
5. Escrita mínima e atômica.
6. Sem destruição.
7. Sem commit ou push automático.
8. Histórico obrigatório e append-only.
9. Baixo acoplamento: um único parser compartilhado.
10. Modificabilidade: templates e documentação versionados.

## 2. Layout

```text
specs/
  changes/
    NNN-slug/
      proposal.md
      design.md              (opcional)
      tasks/
        TASK-001.md
        archive/
          TASK-001.md
      action-plans/
        TASK-001-YYYY-MM-DD-slug.md
    archive/
      NNN-slug/
  templates/
    task.md
    proposal.md
    design.md
    action-plan.md
    history-entry.md
docs/
  history.md
  decisions/
    ADR-NNN-slug.md
scripts/
  rawspec-v2.mjs
  rawspec-v2.test.mjs
.opencode/
  commands/
```

## 3. Tarefa

### 3.1 Arquivo

`specs/changes/NNN-slug/tasks/TASK-NNN.md`

### 3.2 Campos

```markdown
# TASK-NNN — Título

- Change: NNN-slug
- Status: PENDING
- Depende de: nenhuma
- Início: —
- Verificação: PENDING
- Evidência: —
- Plano de ação: none
```

| Campo | Obrigatório | Valores |
|---|---|---|
| `Change` | Sim | identificador da mudança |
| `Status` | Não (default `PENDING`) | `PENDING`, `IN PROGRESS`, `VERIFYING`, `COMPLETED`, `ARCHIVED` |
| `Depende de` | Sim | `TASK-NNN`, lista separada por vírgulas, `nenhuma` ou `—` |
| `Início` | Não | `YYYY-MM-DD` ou `—` |
| `Verificação` | Não (default `PENDING`) | `PENDING`, `VERIFIED`, `FAILED` |
| `Evidência` | Não | texto ou `—` |
| `Plano de ação` | Não | caminho ou `none` |
| `Arquivada em` | Não | `YYYY-MM-DD`, incluído ao arquivar |

### 3.3 Ciclo de vida

```text
PENDING -> IN PROGRESS -> VERIFYING -> COMPLETED -> ARCHIVED
```

Falha de verificação: `VERIFYING` volta para `IN PROGRESS` com `Verificação: FAILED (data) — motivo`.

### 3.4 Conteúdo

Seções: `Objetivo`, `Arquivos`, `Entregáveis`, `Regras`, `Testes`, `Aceitação`, `Checklist de clareza`.

## 4. Arquivamento de tarefa

Pré-condições:

- `Status: COMPLETED` e `Verificação: VERIFIED`;
- nenhum plano de ação não resolvido;
- aprovação humana explícita.

Sequência:

1. Validar as pré-condições.
2. Obter a aprovação do usuário.
3. Marcar `Status: ARCHIVED` e `- Arquivada em: YYYY-MM-DD`.
4. Mover atomicamente para `tasks/archive/TASK-NNN.md`.
5. Se não restarem tarefas em aberto, arquivar a mudança.

## 5. Mudança

### 5.1 Status

`proposal.md`: `PENDING APPROVAL`, `APPROVED`, `SUPERSEDED`, `ARCHIVED`.

### 5.2 Arquivamento

Pré-condições:

- Todas as tarefas em `tasks/archive/` com `Status: ARCHIVED`;
- Todos os planos de ação em `RESOLVED`;
- Aprovação humana explícita.

A mudança vai para `specs/changes/archive/NNN-slug/` e o `proposal.md` recebe `Status: ARCHIVED` e `- Arquivada em: YYYY-MM-DD`.

## 6. Histórico e decisões

### 6.1 `docs/history.md`

Append-only. Nunca reescrever entradas. Formato:

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

### 6.2 ADRs

`docs/decisions/ADR-NNN-slug.md` com `Status`, `Contexto`, `Alternativas consideradas`, `Decisão`, `Justificativa` e `Consequências`.

## 7. Comandos

| Comando | Responsabilidade |
|---|---|
| `/startspec [TASK-ID] [--change CHANGE-ID]` | Inicia tarefa `PENDING`. |
| `/continuespec [TASK-ID] [--change CHANGE-ID]` | Continua, verifica e conclui. |
| `/arquivespec TASK-ID [--change CHANGE-ID]` | Arquiva tarefa após aprovação. |
| `/archivespec [CHANGE-ID]` | Arquiva mudança elegível. |
| `/logspec ...` | Registra histórico. |

Regras comuns: resolver antes de agir, perguntar em ambiguidade, validar aprovação e dependências, nunca alterar aprovação, nunca fazer commit ou push.

## 8. Migração de mudanças legadas

- Dividir `tasks.md` em `tasks/TASK-NNN.md`.
- Preservar `Status`, `Verificação`, `Evidência`, `Plano de ação` e conteúdo.
- Derivar `Depende de` pela ordem do arquivo.
- Mover tarefas `COMPLETED` para `tasks/archive/`.
- Remover `tasks.md` após validação pelo parser v2.

## 9. Política de Git

- Nenhum commit ou push automático sem a sequência da branch por tarefa (ADR-005).
- Staging apenas em caminhos exactos: os declarados na secção `## Arquivos` da task e os ficheiros de especificação que a CLI actualizou.
- Um ficheiro tocado fora do âmbito bloqueia o commit com `E_SCOPE_VIOLATION`.
- Nenhuma reescrita de histórico.

## 10. Verificações

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- `pnpm exec prettier --check` nos arquivos alterados

## 11. CLI e exemplos

Todas as operações usam `scripts/rawspec-v2-cli.mjs`, que chama o helper compartilhado `scripts/rawspec-v2.mjs`.

```bash
# consulta
node scripts/rawspec-v2-cli.mjs resolve TASK-005 --change 001-portfolio-mvp
node scripts/rawspec-v2-cli.mjs next --change 001-portfolio-mvp
node scripts/rawspec-v2-cli.mjs open

# execução
node scripts/rawspec-v2-cli.mjs start TASK-005 --change 001-portfolio-mvp
node scripts/rawspec-v2-cli.mjs begin-verify TASK-005
node scripts/rawspec-v2-cli.mjs verify TASK-005 --evidence "testes aprovados"
node scripts/rawspec-v2-cli.mjs fail TASK-005 --evidence "lint falhou"
node scripts/rawspec-v2-cli.mjs commit-message TASK-005

# arquivamento
node scripts/rawspec-v2-cli.mjs check-archive-task TASK-005
node scripts/rawspec-v2-cli.mjs archive-task TASK-005 --approved
node scripts/rawspec-v2-cli.mjs check-archive-change 001-portfolio-mvp
node scripts/rawspec-v2-cli.mjs archive-change 001-portfolio-mvp --approved

# migração e histórico
node scripts/rawspec-v2-cli.mjs migrate-change 001-portfolio-mvp
node scripts/rawspec-v2-cli.mjs log --type "Decisão" --title "Título" --message "Texto"
```

## 12. Mensagem de commit

Formato gerado por `commit-message`:

```text
<type>(rawspec): <summary>

Change: <change-id>
Task: <TASK-ID>
Tests: <comandos executados>
Evidence: <resumo do resultado>
Action-Plan: <caminho ou none>
```

`type` aceita `feat`, `fix`, `refactor`, `test`, `docs`, `chore` e `build`. A mensagem é uma saída do comando; nenhum commit é executado.

## 13. Catálogo de erros

| Código | Significado |
|---|---|
| `E_ARGS` | Argumento inválido ou flag desconhecida. |
| `E_PARSE` | Estrutura RawSpec malformada ou formato legado não migrado. |
| `E_TASK_NOT_FOUND` | Tarefa inexistente. |
| `E_TASK_AMBIGUOUS` | Mesmo ID em mais de uma mudança. |
| `E_TASK_ARCHIVED` | Tarefa só existe em arquivo. |
| `E_CHANGE_NOT_FOUND` | Mudança inexistente. |
| `E_CHANGE_AMBIGUOUS` | Mais de uma mudança corresponde ao identificador. |
| `E_CHANGE_NOT_APPROVED` | Mudança não aprovada. |
| `E_DEPENDENCY_PENDING` | Dependência não concluída/verificada. |
| `E_DEPENDENCY_UNDECLARED` | Tarefa sem `Depende de`. |
| `E_DEPENDENCY_UNKNOWN` | Dependência inexistente. |
| `E_DEPENDENCY_CYCLE` | Autodependência ou ciclo. |
| `E_TASK_STATE` | Transição de estado inválida. |
| `E_EVIDENCE_REQUIRED` | Verificação sem evidência. |
| `E_APPROVAL_REQUIRED` | Aprovação humana ausente. |
| `E_ARCHIVE_TASK_BLOCKED` | Tarefa não elegível para arquivamento. |
| `E_ARCHIVE_CHANGE_BLOCKED` | Mudança não elegível para arquivamento. |
| `E_ARCHIVE_STATE_UNKNOWN` | Destino de arquivamento ambíguo. |
| `E_COMMIT_MESSAGE_BLOCKED` | Tarefa incompleta para gerar commit. |
| `E_ACTION_PLAN_UNRESOLVED` | Plano de ação não resolvido. |
| `E_PATH_ESCAPE` | Caminho fora do repositório. |
| `E_IO` | Falha de gravação atômica. |
| `E_HISTORY_INVALID` | Entrada de histórico inválida. |
| `E_ADR_EXISTS` | ADR duplicado. |
| `E_SCOPE_VIOLATION` | Há ficheiros tocados fora do âmbito declarado na secção `## Arquivos` da task. |

## 14. Validação ponta a ponta

A suíte de testes inclui um fluxo completo em diretório temporário que:

1. inicia uma tarefa;
2. marcação para verificação;
3. conclui com evidência;
4. arquiva a tarefa;
5. repete para a tarefa seguinte;
6. arquiva a mudança quando todas estiverem arquivadas.

Executar `pnpm test` valida esse fluxo sem escrever em `specs/changes/` real.

## 15. Branch por tarefa e commit/push

Toda tarefa é executada em sua própria branch e, ao concluir, pode ser commitada e enviada automaticamente.

### 15.1 Nomenclatura

```text
task/<prefixo-da-mudança>-<número-da-tarefa>-<slug-do-título>
```

Exemplo: `task/001-005-implementar-secao-inicial`.

### 15.2 Fluxo

1. `/startspec` resolve a tarefa e cria a branch com `create-branch`.
2. A tarefa é iniciada com `start`.
3. Ao atingir `COMPLETED` + `VERIFIED`, `/continuespec` executa `commit-task`.
4. `commit-task` roda `pnpm typecheck`, `pnpm test` e `pnpm build`.
5. Se passarem, faz o gate de âmbito, faz `git add` com caminhos explícitos, `git commit` com a mensagem gerada e `git push -u origin <branch>`.

### 15.2.1 Gate de âmbito

O `commit-task` compara os ficheiros tocados com o âmbito da task:

- os ficheiros declarados na secção `## Arquivos`;
- os ficheiros de especificação que a CLI actualizou: o ficheiro da task, o plano de acção e `docs/history.md`.

Um ficheiro fora do âmbito bloqueia o commit com `E_SCOPE_VIOLATION`, que lista os ficheiros culpados. Nada é descartado: a decisão sobre cada ficheiro é do utilizador.

O gate existe porque as permissões de caminho do OpenCode não são uma barreira. Uma escrita feita por shell contorna a negação de edição, e o gate é aplicado depois da acção e antes do commit.

### 15.3 Hooks do Husky

- `pre-commit`: `lint-staged` (ESLint + Prettier nos arquivos staged).
- `pre-push`: `pnpm typecheck`, `pnpm test`, `pnpm build`.

Os hooks são sempre executados e bloqueiam commit ou push em caso de falha.

### 15.4 Regras

- A branch é criada antes de iniciar a tarefa.
- Branch existente retorna `E_BRANCH_EXISTS` e não é substituída.
- Falha de verificação impede o commit.
- O arquivamento de tarefa também é commitado na mesma branch.
- Nenhuma operação destrutiva é executada.

### 15.5 Erros

| Código | Significado |
|---|---|
| `E_BRANCH_EXISTS` | A branch da tarefa já existe. |
| `E_GIT_ERROR` | Comando Git falhou. |
| `E_CHECKS_FAILED` | `typecheck`, `test` ou `build` falhou. |
| `E_TASK_STATE` | A tarefa não está concluída e verificada. |

