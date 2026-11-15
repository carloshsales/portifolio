# Comandos RawSpec

Documentação de uso, diagnóstico e políticas dos três comandos RawSpec: `/startspec`, `/continuespec` e `/arquivespec`.

> **Estado atual:** os três comandos ainda **não existem**. Este documento é criado pela `TASK-001` da change `002-rawspec-task-commands` para registrar o baseline e congelar o contrato de comportamento. A seção “Baseline” será complementada pela `TASK-010` com argumentos, exemplos e catálogo de erros.

## Baseline

### Inventário do repositório

Verificado em `2026-11-13`, antes de qualquer implementação:

| Item | Situação observada |
|---|---|
| `.opencode/` | Não existe. |
| `.opencode/commands/` | Não existe. |
| `/startspec`, `/continuespec`, `/arquivespec` | Não existem; serão criados por esta change. |
| `scripts/rawspec.mjs` | Não existe; será criado por esta change. |
| `scripts/rawspec.test.mjs` | Não existe; será criado por esta change. |
| `docs/rawspec-commands.md` | Este arquivo; criado pela `TASK-001` e complementado pela `TASK-010`. |
| `specs/changes/001-portfolio-mvp/` | Existe, com `proposal.md`, `design.md` e `tasks.md`. Somente leitura. |
| `specs/changes/archive/` | Existe e está vazio. |
| `specs/changes/002-rawspec-task-commands/` | Existe, com `proposal.md`, `design.md` e `tasks.md`. |

Não há comando legado versionado a preservar: a criação de mudanças continua sendo feita pelo fluxo atual baseado em `specs/changes/NNN-slug/`.

### Contrato de comportamento congelado

Os comandos operam sobre `TASK-NNN` de mudanças RawSpec em Markdown, sob `specs/changes/`. O Markdown permanece a única fonte de verdade, e a aprovação continua sendo uma ação humana registrada nos documentos da mudança.

#### `/startspec [TASK-ID] [--change CHANGE-ID]`

Inicia a execução de uma tarefa.

- **Com `TASK-ID`:** localiza a tarefa, pergunta ao usuário em caso de ambiguidade, valida aprovação e dependências, exige `Status: PENDING`, muda para `IN PROGRESS` e registra a data em `Início`.
- **Sem argumento:** seleciona a próxima tarefa `PENDING` da mudança aprovada escolhida.
- **Com tarefa já aberta:** pergunta se deseja iniciar outra. Se o usuário recusar, o comando interrompe e orienta o uso de `/continuespec` para concluir a tarefa aberta.
- **Decisão confirmada:** `/startspec` sem argumento inicia a próxima tarefa pendente, e não cria mudança nova.

#### `/continuespec [TASK-ID] [--change CHANGE-ID]`

Retoma uma tarefa existente.

- Recupera o estado atual, revalida aprovação e dependências e continua a execução conforme o estado.
- **Sem argumento:** continua a única tarefa aberta; se houver mais de uma, pergunta ao usuário.
- Se a tarefa estiver `PENDING`, orienta o uso de `/startspec TASK-ID`.
- Se a tarefa já estiver `COMPLETED` e `VERIFIED`, informa que não há pendências e não reinicia.

#### `/arquivespec [CHANGE-ID]`

Arquiva a **mudança inteira**, nunca uma tarefa isolada.

- Exige todas as tarefas com `Status: COMPLETED` e `Verificação: VERIFIED`, e todos os planos de ação em `RESOLVED`.
- Recusa `TASK-ID` como argumento.
- Sem argumento, arquiva a única mudança elegível; havendo mais de uma, pergunta ao usuário.

### Decisões confirmadas

1. **Aprovação humana obrigatória.** `proposal.md`, `tasks.md` e, quando existir, `design.md` precisam estar `APPROVED`. Nenhum comando altera o status de aprovação.
2. **Ambiguidade é sempre levada ao usuário.** O comando apresenta as candidatas e a escolha é do usuário; nunca escolhe sozinho.
3. **Pergunta de concorrência.** Quando existe tarefa aberta e o usuário pede iniciar outra, o comando pergunta antes de prosseguir.
4. **Dependências explícitas.** Mudanças novas exigem `Depende de` em todas as tarefas; a ausência é erro (`E_DEPENDENCY_UNDECLARED`) e nunca vira dependência implícita.
5. **Modo legado sequencial.** A change `001-portfolio-mvp` não declara `Depende de` e não será alterada. Por decisão explícita, nela as tarefas são sequenciais. A origem da dependência é exibida ao usuário como `dependencySource: legacy-sequential`.
6. **Evidência obrigatória.** Só é possível registrar `Verificação: VERIFIED` com evidência das verificações executadas.
7. **Mensagem de commit ao final de cada tarefa.** A mensagem é uma saída do comando, em padrão Conventional Commits, com mudança, tarefa, testes, evidência e plano de ação. O commit continua sendo humano; o comando não executa `git commit` nem `git push`.
8. **Plano de ação apenas para risco real.** Problemas técnicos, riscos reais, conflitos de requisitos, segurança, integridade ou condições que possam comprometer o projeto exigem plano de ação, com aceite humano antes de continuar. Cancelamento do usuário, recusa de escolha, ambiguidade pendente de resposta e interrupção normal apenas interrompem o comando, sem criar plano.
9. **Planos de ação bloqueiam.** Uma tarefa não é concluída enquanto houver plano não resolvido, e o arquivamento é bloqueado enquanto houver plano de ação pendente, aceito, em execução ou rejeitado.
10. **Nenhuma alteração destrutiva.** Não apagar tarefas, mudanças ou histórico; não executar `rebase` nem reescrita de histórico.

### Política de Git

- `git add` é permitido **somente durante o arquivamento** e **apenas em caminhos exatos** do manifesto de arquivos da mudança, um caminho por vez.
- **Não** usar `git add -A`, não usar diretório e não usar glob.
- Antes de qualquer operação de Git, o estado `staged` e `unstaged` dos caminhos do manifesto é inspecionado. Se houver alteração rastreada preexistente, o comando para e pede decisão explícita: commitar, fazer stash, cancelar ou autorizar a inclusão.
- Arquivos não rastreados dentro da mudança fazem parte do manifesto, mas só são staged após confirmação explícita da lista de caminhos.
- `git commit` e `git push` são **proibidos** em qualquer comando.
- O histórico Git é preservado pela remoção e adição dos mesmos conteúdos; o commit humano permite que o Git detecte o rename.

### Política de arquivamento

- O arquivamento valida **por completo** — aprovação, tarefas, planos de ação, destino e confinamento de caminhos — antes de qualquer movimentação e antes de qualquer operação de Git. Se uma validação falhar, nada é movido e nenhum `git add` é executado.
- A mudança é movida com uma **única operação atômica de rename** no mesmo volume. Não mover arquivo por arquivo e não usar `git mv`.
- Antes do rename, o comando grava `archive-state.json` dentro da própria mudança com `state: ARCHIVING`, como marcação write-ahead do movimento. O arquivo viaja com a mudança durante o rename.
- Depois do rename, o `proposal.md` do destino é finalizado com `Status: ARCHIVED`, `- Arquivada em: YYYY-MM-DD` e `- Staging Git: PENDING`; **só então** o `archive-state.json` é atualizado para `state: ARCHIVED`.
- Ao concluir o staging, o marcador `Staging Git: DONE` é escrito e o caminho exato do `proposal.md` arquivado é re-stagiado, para que a versão final do documento também fique no staging. A convergência é verificada contra o índice Git antes de reportar sucesso.
- **Recuperação idempotente:** quando o destino já existe, o comando nunca renomeia de novo. Com `archive-state.json` em `ARCHIVING` e a origem ausente, a operação é tratada como interrompida, independentemente de o `proposal.md` já ter sido atualizado: a recuperação completa de forma idempotente os dois marcadores, `proposal.md` primeiro e `archive-state.json` depois, e só então segue para o staging.
- Um destino existente sem `archive-state.json` e sem `Status: ARCHIVED` é estado realmente desconhecido: o comando para com `E_ARCHIVE_STATE_UNKNOWN` e não apaga, move nem reseta nada.
- A origem e o destino são resolvidos com caminho real. São recusados `..`, caminhos absolutos, links simbólicos que escapem a mudança e qualquer caminho fora de `specs/changes/`.

### Decisões de implementação em aberto

Duas decisões de implementação continuam pendentes de confirmação explícita do usuário e foram registradas aqui para não se perderem:

1. **`archive-state.json` como parte do formato RawSpec.** A marcação write-ahead é gravada dentro da própria mudança, o que adiciona um artefato ao formato do diretório de mudança.
2. **`Staging Git` permanece no `proposal.md`.** O estado do movimento fica apenas no `archive-state.json`, evitando duplicar a mesma informação em dois lugares.

Ambas já estão refletidas no `design.md` da change `002-rawspec-task-commands` e podem ser revertidas sem alterar o escopo funcional.

### Testes previstos

Verificação manual de que `.opencode/commands/` não existe antes da implementação — **confirmado em `2026-11-13`**.
