# Change 003 — RawSpec v2: uma tarefa por arquivo

- Status: ARCHIVED
- Arquivada em: 2026-11-15
- Aprovação: 2026-11-15
- Tipo: Melhoria de processo de engenharia
- Prioridade: Alta
- Data: 2026-11-15
- Relacionadas: `001-portfolio-mvp` (será migrada), `002-rawspec-task-commands` (será SUPERSEDED)

## 1. Objetivo

Redefinir o formato das especificações para que:

- cada tarefa seja um arquivo independente, revisável e arquivável isoladamente;
- o histórico de decisões e detalhes seja obrigatório e append-only;
- o sistema tenha baixo acoplamento, alta qualidade e seja totalmente modificável;
- uma tarefa só seja arquivada após conclusão, verificação e aprovação humana.

## 2. Problema

O formato atual concentra todas as tarefas de uma mudança em um único `tasks.md`. Isso:

- acopla tarefas entre si, dificultando revisão e alteração isolada;
- impede o arquivamento individual de uma tarefa concluída;
- espalha decisões e detalhes que não têm registro consolidado;
- conflita com o desejo de arquivar tarefas individualmente após aprovação.

A change `002-rawspec-task-commands` foi desenhada para arquivamento por mudança inteira e não será concluída. Ela será marcada como `SUPERSEDED` por esta mudança.

## 3. Escopo

### 3.1 Incluído

- Formato v2 com uma tarefa por arquivo em `specs/changes/NNN-slug/tasks/`.
- Arquivamento individual de tarefa em `tasks/archive/` após `COMPLETED` + `VERIFIED` e aprovação humana.
- Arquivamento de mudança quando todas as tarefas estiverem arquivadas.
- `docs/history.md` append-only para decisões, eventos e detalhes.
- ADRs em `docs/decisions/` para decisões relevantes.
- Comando `/logspec` para registrar histórico.
- Comandos `/startspec`, `/continuespec`, `/arquivespec` e `/archivespec`.
- Migração da change `001-portfolio-mvp` para o formato v2.
- Marcar a change `002-rawspec-task-commands` como `SUPERSEDED`.
- Documentação do formato v2 e dos comandos.
- Templates versionados para tarefa, mudança e plano de ação.

### 3.2 Fora do escopo

- Alterar o conteúdo ou a interface do portfólio.
- Criar backend, banco de dados, painel ou autenticação.
- Commit ou push automático.
- Reescrever histórico Git.
- Criar comandos além dos listados.
- Alterar a change `002` além da marcação de `SUPERSEDED`.

## 4. Comportamento proposto

### 4.1 Tarefa

Cada tarefa é um arquivo `TASK-NNN.md` com cabeçalho `# TASK-NNN — Título` e campos `Change`, `Status`, `Depende de`, `Início`, `Verificação`, `Evidência` e `Plano de ação`.

Ciclo de vida:

```text
PENDING -> IN PROGRESS -> VERIFYING -> COMPLETED -> ARCHIVED
```

Uma tarefa só é arquivada quando está `COMPLETED` + `VERIFIED`, sem plano de ação não resolvido e com aprovação humana explícita.

### 4.2 Mudança

Uma mudança é arquivada quando todas as suas tarefas estiverem em `tasks/archive/` com `Status: ARCHIVED`. A mudança vai para `specs/changes/archive/NNN-slug/`.

### 4.3 Histórico

`docs/history.md` é append-only e registra decisões, eventos e detalhes com data, autor, origem, decisão, motivo, impacto e evidência. ADRs continuam registrando decisões relevantes.

### 4.4 Comandos

- `/startspec [TASK-ID] [--change CHANGE-ID]` — inicia uma tarefa.
- `/continuespec [TASK-ID] [--change CHANGE-ID]` — continua, verifica e conclui uma tarefa.
- `/arquivespec TASK-ID [--change CHANGE-ID]` — arquiva uma tarefa após aprovação.
- `/archivespec [CHANGE-ID]` — arquiva uma mudança quando elegível.
- `/logspec` — registra uma entrada no histórico.

## 5. Requisitos

### 5.1 Funcionais

- **RF-01** — Cada tarefa é um arquivo independente em `specs/changes/NNN-slug/tasks/TASK-NNN.md`.
- **RF-02** — O parser v2 lê um arquivo por tarefa e valida campos e status.
- **RF-03** — Toda tarefa declara `Depende de`; ausência é erro.
- **RF-04** — A execução exige mudança aprovada e dependências `COMPLETED` + `VERIFIED`.
- **RF-05** — Tarefa só recebe `COMPLETED` + `VERIFIED` com evidência.
- **RF-06** — Tarefa só é arquivada com `COMPLETED` + `VERIFIED`, sem plano não resolvido e com aprovação humana.
- **RF-07** — O arquivamento de tarefa move o arquivo para `tasks/archive/` de forma atômica.
- **RF-08** — Mudança é arquivada quando todas as tarefas estiverem arquivadas.
- **RF-09** — `docs/history.md` é append-only e validado por `/logspec`.
- **RF-10** — `/logspec` registra entrada com campos obrigatórios.
- **RF-11** — Comandos perguntam ao usuário em ambiguidade e nunca escolhem sozinhos.
- **RF-12** — Comandos nunca fazem commit nem push.
- **RF-13** — A change `001-portfolio-mvp` é migrada para v2 preservando status e evidências.
- **RF-14** — A change `002-rawspec-task-commands` é marcada como `SUPERSEDED`.
- **RF-15** — Templates versionados de tarefa, mudança e plano de ação.

### 5.2 Não funcionais

- **RNF-01** — Markdown versionado é a única fonte de verdade.
- **RNF-02** — Um único parser compartilhado pelos comandos.
- **RNF-03** — Sem dependências novas de runtime.
- **RNF-04** — Escrita atômica e mínima, preservando o restante do conteúdo.
- **RNF-05** — Nenhuma alteração destrutiva.
- **RNF-06** — Testes automatizados em diretórios temporários.
- **RNF-07** — Tudo pode ser modificado: templates, docs e parser versionados.

## 6. Critérios de aceitação

- O formato v2 está documentado e template de tarefa disponível.
- O parser v2 lê e valida um arquivo por tarefa.
- `/startspec`, `/continuespec`, `/arquivespec`, `/archivespec` e `/logspec` existem e usam o parser compartilhado.
- Uma tarefa só é arquivada após `COMPLETED` + `VERIFIED` e aprovação humana.
- Uma mudança só é arquivada quando todas as tarefas estiverem arquivadas.
- `docs/history.md` registra as decisões da sessão e os ADRs existem.
- A change `001-portfolio-mvp` está migrada para v2.
- A change `002-rawspec-task-commands` está marcada como `SUPERSEDED`.
- `pnpm lint`, `pnpm typecheck`, `pnpm test` e `pnpm build` passam.
- Nenhum commit ou push automático foi executado.

## 7. Riscos e mitigação

| Risco | Mitigação |
|---|---|
| Migração perder status ou evidência. | Parser de migração testado; comparação antes/depois. |
| Comandos duplicarem lógica. | Um único helper `rawspec-v2.mjs`. |
| Arquivamento interrompido. | Validação completa antes de mover; movimento atômico; recuperação idempotente. |
| Histórico reescrito ou perdido. | `history.md` append-only, validado por `/logspec`. |
| Ambiguidade de tarefa ou mudança. | Perguntar ao usuário; nunca escolher sozinho. |
| Alteração da change 002. | Apenas marcação de `SUPERSEDED`, sem reescrever tarefas. |

## 8. Decisões confirmadas

1. Uma tarefa por arquivo em `specs/changes/NNN-slug/tasks/`.
2. Tarefa arquivada em `tasks/archive/` após aprovação.
3. Histórico em `docs/history.md` + ADRs.
4. Registro de histórico via `/logspec`.
5. Change `002` marcada como `SUPERSEDED` e mantida.
6. Change `001` migrada para v2.
7. Mudança arquivada quando todas as tarefas forem arquivadas.
8. Tudo em Markdown versionado no repositório.

## 9. Aprovação

Esta proposta depende de aprovação humana antes do início da implementação.

Enquanto o status não for `APPROVED`, nenhuma tarefa desta mudança pode ser iniciada.
