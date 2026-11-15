# Change 002 — Fluxo RawSpec orientado por tarefa

- Status: SUPERSEDED
- Superseded by: 003-rawspec-v2
- Tipo: Melhoria de processo de engenharia
- Prioridade: Alta
- Data: 2026-11-12
- Relacionada: `001-portfolio-mvp` (somente leitura)

## 1. Resultado da investigação

### 1.1 O que existe hoje

A investigação foi feita no repositório, nos branches locais e no worktree desta sessão.

Foi encontrado:

- `docs/decisions/ADR-001-rawspec-storage.md`, que define Markdown versionado com Git como base do RawSpec.
- `specs/changes/001-portfolio-mvp/` com `proposal.md`, `design.md` e `tasks.md`.
- `specs/changes/archive/`, ainda vazio.
- `specs/specifications/`, com diretórios ainda vazios.
- Tarefas identificadas por títulos `### TASK-NNN — Título`.
- Estado da tarefa registrado em `- **Status:**` e evidência em `- **Verificação:**`.
- Fluxo de status documentado na change 001: `PENDING → IN PROGRESS → VERIFYING → COMPLETED`.
- Regra de execução por dependências, mas sem campo explícito de dependência no formato atual.

### 1.2 Lacuna encontrada

Não existe `.opencode/commands/` no repositório, em nenhum branch local, nem no worktree desta sessão.

Também não foram encontrados arquivos de definição para `/startspec`, `/continuespec` ou `/arquivespec`.

O usuário confirmou que esses comandos não existem. Portanto, esta mudança cria os três comandos a partir das convenções RawSpec já usadas pela change 001, sem substituir um comando legado inexistente.

### 1.3 O que não será alterado

- `specs/changes/001-portfolio-mvp/proposal.md`
- `specs/changes/001-portfolio-mvp/design.md`
- `specs/changes/001-portfolio-mvp/tasks.md`
- O histórico Git existente.

A change 001 poderá ser usada apenas para leitura e validação. Nenhum comando desta mudança escreverá nela.

## 2. Problema

O fluxo atual é orientado à mudança inteira. Para executar uma tarefa, é necessário descobrir manualmente:

1. Em qual mudança a `TASK` está.
2. Se a mudança foi aprovada.
3. Quais tarefas precisam estar concluídas antes.
4. Qual é o estado atual da tarefa.
5. Se há outra tarefa em execução.
6. Se a tarefa pode ser arquivada.

Esse trabalho manual aumenta o risco de:

- iniciar tarefa de mudança não aprovada;
- executar tarefa com dependência pendente;
- iniciar outra tarefa sem perceber que já existe uma em execução;
- continuar uma tarefa já concluída;
- marcar tarefa como verificada sem evidência;
- arquivar uma mudança com tarefas pendentes;
- arquivar tarefa isolada, quebrando a rastreabilidade da mudança.

## 3. Objetivo

Permitir que os comandos RawSpec trabalhem diretamente com identificadores `TASK-NNN`, sem perder o fluxo de criação e aprovação de mudanças, nem a possibilidade de arquivar a mudança inteira.

Fluxo desejado:

```text
/startspec TASK-003
/continuespec TASK-003
/arquivespec
```

## 4. Escopo

### 4.1 Incluído

- Criar exatamente três comandos: `/startspec`, `/continuespec` e `/arquivespec`.
- Resolver automaticamente a mudança à qual uma `TASK` pertence.
- Perguntar ao usuário quando houver ambiguidade de tarefa ou de mudança.
- Validar aprovação humana da mudança antes de executar tarefas.
- Validar dependências explícitas entre tarefas, com modo legado sequencial documentado para a change 001.
- Rejeitar estruturas malformadas de tarefa com `E_PARSE`, usando uma lista fechada de casos.
- Iniciar a próxima tarefa pendente quando `/startspec` for chamado sem argumento.
- Perguntar antes de iniciar outra tarefa quando já existir uma tarefa aberta.
- Continuar a execução de uma tarefa existente.
- Exigir evidência de verificação para concluir tarefa.
- Arquivar somente a mudança inteira, quando todas as tarefas estiverem `COMPLETED` + `VERIFIED`.
- Concluir todas as validações de arquivamento antes de mover arquivos e confinar origem e destino à mudança correta.
- Inspecionar o estado Git e nunca incluir alterações preexistentes do usuário sem decisão explícita.
- Usar rename atômico e recuperação idempotente para não repetir movimentação já concluída.
- Permitir `git add` durante o arquivamento, somente em caminhos exatos do manifesto.
- Gerar uma mensagem de commit ao final de cada tarefa concluída.
- Criar um plano de ação para aceite quando surgir problema, risco ou algo que possa comprometer o projeto.
- Documentar argumentos, comportamento, erros e exemplos.
- Criar testes automatizados para o resolvedor e as validações.

### 4.2 Fora do escopo

- Alterar a change 001.
- Arquivar tarefas individualmente.
- Criar banco de dados, painel ou estado paralelo aos arquivos Markdown.
- Alterar o formato de `proposal.md`, `design.md` ou `tasks.md` da change 001.
- Alterar o significado de aprovação humana.
- Fazer commit ou push automaticamente.
- Renomear tarefas existentes.
- Criar comandos alternativos, como `/start-task` ou `/archive-task`.
- Implementar interface gráfica.
- Criar um comando de criação de mudanças: o fluxo atual continua baseado nos arquivos Markdown.

## 5. Comportamento proposto

### 5.1 `/startspec`

| Entrada | Comportamento |
|---|---|
| `/startspec` | Inicia a próxima tarefa pendente. Se houver mais de uma mudança com tarefas pendentes, pergunta qual mudança usar. Se já houver tarefa aberta, pergunta se o usuário deseja iniciar outra; se a resposta for negativa, interrompe sem alterar estado e orienta `/continuespec` para concluir a tarefa aberta. |
| `/startspec TASK-003` | Localiza a tarefa, identifica a mudança, valida aprovação e dependências, e inicia a execução. |
| `/startspec TASK-003 --change 001-portfolio-mvp` | Mesmo comportamento, restringindo a busca à mudança informada. |
| Argumento fora do padrão `TASK-NNN` | Erro de uso. Não cria mudança e não inicia tarefa. |

Regras adicionais:

- "Tarefa aberta" significa `IN PROGRESS` ou `VERIFYING`.
- Se a `TASK` existir em mais de uma mudança, o comando apresenta as candidatas e pergunta qual usar. O usuário decide.
- Se a `TASK` for a mesma tarefa já aberta, o comando orienta `/continuespec TASK-ID`.
- Se a próxima tarefa pendente tiver dependência não concluída, o comando para e informa a pendência e sua origem; não pula para outra tarefa.
- Dependências declaradas são explícitas. A change 001, que não declara `Depende de`, usa o modo legado sequencial e mostra essa origem ao usuário.
- O comando nunca inicia duas tarefas sem confirmação explícita.

### 5.2 `/continuespec`

| Entrada | Comportamento |
|---|---|
| `/continuespec` | Continua a única tarefa aberta. Se houver mais de uma, pergunta qual continuar. Se não houver nenhuma, informa que não há tarefa em execução e sugere `/startspec`. |
| `/continuespec TASK-003` | Recupera o estado da tarefa, verifica pendências, dependências e evidências, e continua a execução. |
| `/continuespec TASK-003 --change 001-portfolio-mvp` | Mesmo comportamento, restringindo a busca à mudança informada. |
| `TASK` em `PENDING` | Erro: a tarefa deve ser iniciada com `/startspec TASK-ID`. |
| `TASK` já `COMPLETED` + `VERIFIED` | Informa que não há pendências e não reinicia. |

### 5.3 `/arquivespec`

| Entrada | Comportamento |
|---|---|
| `/arquivespec` | Arquiva a única mudança elegível. Se houver mais de uma, pergunta qual usar. Se nenhuma estiver elegível, lista as pendências. |
| `/arquivespec 001-portfolio-mvp` | Arquiva a mudança informada, se todas as tarefas estiverem `COMPLETED` + `VERIFIED`. |
| `/arquivespec TASK-003` | Erro: arquivamento é sempre da mudança inteira. |

O arquivamento valida por completo aprovação, tarefas, planos, destino, caminhos e estado Git antes de qualquer movimentação. Se houver alterações rastreadas preexistentes nos caminhos do manifesto, o comando para e pede decisão explícita antes de mover. Se uma validação falhar, nada é movido e nenhum `git add` é executado.

Depois da validação, o comando grava `archive-state.json` dentro da mudança com `state: ARCHIVING`, move o diretório com uma única operação atômica de rename, finaliza o `proposal.md` do destino com `Status: ARCHIVED`, data e `Staging Git: PENDING` e só então atualiza o `archive-state.json` para `state: ARCHIVED`. O conteúdo e o histórico são preservados. O `git add` usa apenas os caminhos exatos do manifesto, um por vez, e nunca staging indiscriminado. Ao concluir o staging, o marcador `Staging Git: DONE` é escrito e o caminho do `proposal.md` arquivado é re-stagiado, de modo que a versão final do documento também fique staged; a convergência é verificada contra o índice Git antes de reportar sucesso. Se o staging falhar, a mudança permanece movida, o estado fica registrado como `Staging Git: FAILED`, e uma nova execução retoma apenas o staging, sem mover novamente. Uma interrupção entre o rename e a finalização é recuperável: com `archive-state.json` em `ARCHIVING` e origem ausente, o comando reconhece a operação interrompida, completa de forma idempotente os dois marcadores, `proposal.md` primeiro e `archive-state.json` depois, e segue para o staging, sem mover nada de novo. O arquivamento não cria commit nem push.

### 5.4 Fechamento de cada tarefa

Ao final de cada tarefa concluída, o comando deve apresentar:

- resumo do que foi implementado;
- arquivos alterados;
- verificações executadas e resultados;
- evidência registrada em `tasks.md`;
- **mensagem de commit pronta**, em bloco copiável.

A mensagem de commit segue o padrão Conventional Commits e inclui a mudança, a tarefa, os testes e a evidência. O comando não executa `git commit` nem `git push`; a execução do commit permanece humana.

Exemplo:

```text
feat(rawspec): add task-based start command

Change: 002-rawspec-task-commands
Task: TASK-009
Tests: pnpm lint; pnpm typecheck; pnpm test; pnpm build
Evidence: all checks passed
Action-Plan: none
```

Se a tarefa tiver um plano de ação resolvido, a mensagem inclui o caminho do plano.

### 5.5 Problemas, riscos e plano de ação

Um plano de ação é reservado a problemas técnicos, riscos reais, conflitos de requisitos, segurança, integridade ou condições que possam comprometer o projeto. Cancelamento do usuário, recusa de escolha, ambiguidade pendente de resposta ou interrupção normal não criam plano; apenas interrompem o comando.

Se durante a execução surgir um problema ou risco real, o comando deve:

1. Interromper a ação arriscada.
2. Criar um plano de ação em `specs/changes/NNN-slug/action-plans/`.
3. Registrar problema, impacto, evidências, opções, ação recomendada, validação, rollback e critérios de aceite.
4. Apresentar o plano ao usuário e solicitar aceite explícito.
5. Só continuar após o aceite.
6. Se o usuário recusar, manter a tarefa aberta e não gerar mensagem de commit de conclusão.

O plano de ação tem status próprio e não substitui a aprovação da mudança. O arquivamento da mudança é bloqueado enquanto houver plano de ação não resolvido.

## 6. Requisitos

### 6.1 Funcionais

- **RF-01** — Identificar automaticamente a mudança de uma `TASK` a partir de `specs/changes/*/tasks.md`, ignorando `specs/changes/archive/`.
- **RF-02** — Recusar execução quando a mudança não estiver aprovada pelo humano.
- **RF-03** — Recusar execução quando uma dependência não estiver `COMPLETED` + `VERIFIED`; exigir `Depende de` explícito em todas as tarefas de mudanças novas e aplicar modo legado sequencial somente à change 001.
- **RF-04** — Iniciar tarefa `PENDING` somente via `/startspec`.
- **RF-05** — Continuar tarefa `IN PROGRESS`, `VERIFYING` ou `COMPLETED` sem verificação somente via `/continuespec`.
- **RF-06** — Exigir evidência de testes/verificações para marcar `Verificação: VERIFIED`.
- **RF-07** — Bloquear o arquivamento se qualquer tarefa não estiver `COMPLETED` + `VERIFIED`.
- **RF-08** — Não permitir arquivamento individual de tarefa.
- **RF-09** — `/startspec` sem argumento inicia a próxima tarefa pendente, não cria mudança.
- **RF-10** — Perguntar ao usuário antes de iniciar outra tarefa quando já houver tarefa aberta.
- **RF-11** — Perguntar ao usuário quando houver ambiguidade de `TASK` ou de mudança.
- **RF-12** — Documentar argumentos, comportamento, erros, exemplos e política de Git.
- **RF-13** — Permitir `git add` no arquivamento, sem commit ou push.
- **RF-14** — Ao final de cada tarefa concluída, gerar uma mensagem de commit pronta e copiável.
- **RF-15** — Detectar problema, risco ou condição que possa comprometer o projeto e criar um plano de ação para aceite.
- **RF-16** — Exigir aceite humano do plano de ação antes de executar a correção.
- **RF-17** — Bloquear o arquivamento enquanto houver plano de ação não resolvido.
- **RF-18** — Rejeitar com `E_PARSE` a lista fechada de estruturas malformadas definida no design, incluindo status desconhecido, título inválido e limites ambíguos.
- **RF-19** — Concluir todas as validações de arquivamento antes de mover e confinar origem e destino à mudança correta.
- **RF-20** — Inspecionar o estado Git dos caminhos do manifesto e exigir decisão explícita antes de incluir alterações preexistentes.
- **RF-21** — Executar `git add` somente em caminhos exatos do manifesto, sem staging indiscriminado.
- **RF-22** — Arquivar com rename atômico e recuperação idempotente, sem repetir movimentação já concluída.
- **RF-23** — Criar plano de ação apenas para riscos reais; cancelamento e ambiguidade pendente apenas interrompem.
- **RF-24** — Gravar `archive-state.json` antes do rename e usá-lo para reconhecer e concluir um arquivamento interrompido entre o movimento e a marcação.
- **RF-25** — Garantir que a versão final do `proposal.md` arquivado, com `Staging Git: DONE`, esteja no índice Git antes de reportar sucesso.
- **RF-26** — Finalizar os marcadores na ordem `proposal.md` e depois `archive-state.json`, e completar ambos de forma idempotente na recuperação, independentemente de o `proposal.md` já estar atualizado.

### 6.2 Não funcionais

- **RNF-01** — Uma única implementação compartilhada de resolução e validação, evitando lógica duplicada nos três comandos.
- **RNF-02** — Nenhuma dependência nova de runtime.
- **RNF-03** — Operações de escrita limitadas a `specs/changes/` e restritas ao repositório.
- **RNF-04** — Nenhuma alteração destrutiva: não apagar tarefas, mudanças ou histórico.
- **RNF-05** — Nenhum commit, push, rebase ou reescrita de histórico automática.
- **RNF-06** — Testes automatizados cobrindo resolução, aprovação, dependências, transições e arquivamento.
- **RNF-07** — Cada tarefa do plano traz checklist própria dos oito critérios de clareza, sem percentual, marcada item a item como `ATENDE` ou `NÃO SE APLICA` com justificativa: objetivo, arquivos, entregáveis, contrato e erros, testes, aceitação, dependências declaradas e ausência de decisões pendentes.

## 7. Critérios de aceitação

- Os três comandos existem e têm argumentos documentados.
- `/startspec` sem argumento inicia a próxima tarefa pendente e pergunta quando há ambiguidade.
- `/startspec` pergunta antes de iniciar outra tarefa quando já existe uma aberta.
- `/startspec TASK-003` localiza a change 001 em modo somente leitura e identifica corretamente a tarefa.
- Uma tarefa de mudança não aprovada é recusada com mensagem clara.
- Uma tarefa com dependência pendente é recusada com a lista de dependências e a origem de cada uma.
- A change 001 opera em modo legado sequencial, com `dependencySource: legacy-sequential` exibido.
- Estruturas malformadas da lista fechada são recusadas com `E_PARSE`.
- `/continuespec TASK-ID` recupera o estado e não reinicia tarefa concluída.
- Tarefa só recebe `COMPLETED` + `VERIFIED` com evidência registrada.
- `/arquivespec` recusa mudança com tarefa `PENDING`, `IN PROGRESS`, `VERIFYING` ou `VERIFIED` ausente.
- `/arquivespec TASK-ID` é recusado.
- O arquivamento conclui todas as validações antes de mover; falha de validação não move arquivos nem executa `git add`.
- Alterações rastreadas preexistentes nos caminhos do manifesto interrompem o arquivamento antes da movimentação e exigem decisão explícita.
- O staging usa somente caminhos exatos do manifesto, sem diretório, glob ou `git add -A` indiscriminado.
- Arquivamento já movido não é repetido; staging `PENDING` ou `FAILED` é retomado de forma idempotente.
- Interrupção entre o rename e a marcação é recuperável: `archive-state.json` permite concluir o arquivamento sem mover a mudança de novo, inclusive quando o `proposal.md` já foi finalizado e o `archive-state.json` ainda está em `ARCHIVING`.
- A versão final do `proposal.md` arquivado, com `Staging Git: DONE`, fica staged; o arquivo não permanece como alteração unstaged.
- O arquivamento não cria commit nem push.
- Toda tarefa concluída termina com uma mensagem de commit pronta, sem commit automático.
- Todo problema ou risco real gera um plano de ação para aceite; cancelamento ou ambiguidade pendente não gera plano.
- O arquivamento é bloqueado enquanto houver plano de ação não resolvido.
- A mudança 001 permanece sem alterações (`git diff -- specs/changes/001-portfolio-mvp` vazio).
- `pnpm lint`, `pnpm typecheck`, `pnpm test` e `pnpm build` passam.
- Cada tarefa do `tasks.md` traz checklist própria dos oito critérios de clareza, sem percentual, com `ATENDE` ou `NÃO SE APLICA` justificado.

## 8. Riscos e mitigação

| Risco | Mitigação |
|---|---|
| `TASK-NNN` repetido em mudanças diferentes. | O comando apresenta as candidatas e pergunta ao usuário; nunca escolhe sozinho. |
| Várias mudanças com tarefas pendentes. | `/startspec` sem argumento pergunta qual mudança usar. |
| Tarefa já em execução. | O comando pergunta se o usuário deseja iniciar outra; se não, interrompe. |
| Status divergente entre `proposal`, `design` e `tasks`. | Um único validador lê os três documentos e aplica a regra de aprovação. |
| Dependência implícita bloquear tarefa inesperadamente. | Mudanças novas exigem `Depende de` explícito; a change 001 usa modo legado sequencial com origem exibida. |
| Movimentação de arquivos antes de validar. | O arquivamento conclui todas as validações antes de mover; falha não movimenta nada. |
| Caminho de arquivamento escapar da mudança. | Origem e destino são resolvidos com caminho real e confinados a `specs/changes/`. |
| Verificação sem evidência real. | A transição para `VERIFIED` exige texto de evidência e resultados das verificações. |
| Arquivamento prematuro. | Gate único que exige todas as tarefas `COMPLETED` + `VERIFIED`; teste dedicado. |
| Alteração acidental da change 001. | Escrita restrita à mudança resolvida; validação final compara `git diff` da 001. |
| Reescrita de Markdown e perda de formatação. | Edição pontual das linhas de status, preservando o restante do arquivo. |
| `git add` global afetar arquivos alheios. | Staging somente de caminhos exatos do manifesto, um por vez, sem diretório ou glob. |
| Alterações preexistentes do usuário serem incluídas no staging. | O estado Git é inspecionado antes de mover; se houver alteração rastreada, o comando para e pede decisão explícita. |
| Falha de staging após a movimentação. | `Staging Git: FAILED` é registrado; nova execução retoma apenas o staging, sem mover novamente. |
| Repetição destrutiva de arquivamento já movido. | Origem ausente + destino com `Status: ARCHIVED` impede nova movimentação e permite recuperação idempotente. |
| Interrupção entre o rename e a marcação `ARCHIVED`. | `archive-state.json` é gravado antes do rename; a recuperação conclui o destino sem mover a mudança de novo. |
| Interrupção entre a finalização do `proposal.md` e a atualização do `archive-state.json`. | A ordem dos marcadores é fixa e a recuperação completa os dois de forma idempotente, independentemente do estado do `proposal.md`. |
| `proposal.md` final ficar fora do staging. | O marcador `Staging Git: DONE` é escrito e o caminho exato é re-stagiado; a convergência é verificada contra o índice Git antes de reportar sucesso. |
| Plano de ação criado para cancelamento ou dúvida simples. | Planos são reservados a riscos reais; cancelamento e ambiguidade pendente apenas interrompem. |
| Risco identificado durante a tarefa. | O comando interrompe, cria plano de ação e só continua após aceite humano. |
| Conclusão sem mensagem de commit. | O fechamento da tarefa só é reportado como completo após gerar a mensagem de commit. |
| Plano de ação esquecido ou não resolvido. | O arquivamento valida todos os planos da mudança e bloqueia os não resolvidos. |

## 9. Compatibilidade e aprovação humana

- Como não existe comando legado versionado, não há sintaxe antiga de criação de mudanças a preservar.
- A criação de mudanças continua sendo feita pelo fluxo atual baseado em `specs/changes/NNN-slug`.
- `/startspec` sem argumento passa a iniciar a próxima tarefa pendente, conforme esclarecimento do usuário.
- Nenhum comando altera o status de aprovação de `proposal.md`, `design.md` ou `tasks.md`.
- Aprovação continua sendo uma ação humana.
- Comandos atualizam apenas o estado de execução e a verificação das tarefas.
- Mudanças novas declaram `Depende de` explicitamente; a change 001, sem o campo, opera em modo legado sequencial.
- O formato existente é preservado; a change 001 não precisa de campos novos.
- A change 001 não será migrada nem reescrita.
- `git add` é permitido no arquivamento, somente em caminhos exatos do manifesto; commit e push não são.
- Alterações preexistentes do usuário não são incluídas sem decisão explícita.
- Arquivamento já movido não é repetido; falha de staging é recuperada de forma idempotente.
- `archive-state.json` é gravado antes do rename, para que uma interrupção entre o movimento e a marcação seja recuperável.
- O sucesso do arquivamento exige que a versão final do `proposal.md`, com `Staging Git: DONE`, esteja staged.
- A mensagem de commit é uma saída do comando, não uma autorização para commit automático.
- O aceite do plano de ação é humano e registrado no próprio plano.

## 10. Decisões confirmadas

1. Os comandos não existem e serão criados.
2. `/startspec` sem parâmetros inicia a próxima tarefa pendente; com tarefa aberta, pergunta antes de iniciar outra; se o usuário recusar, interrompe.
3. `/arquivespec` não cria commit nem push; pode executar `git add`.
4. `design.md` aprovado é obrigatório quando o arquivo existir.
5. Qualquer ambiguidade é apresentada ao usuário; a escolha é responsabilidade dele.
6. Para aprovação, cada tarefa do plano traz checklist própria dos oito critérios de clareza, sem percentual, marcada como `ATENDE` ou `NÃO SE APLICA` com justificativa.
7. Ao final de cada tarefa, o comando gera uma mensagem de commit; não executa commit nem push.
8. Problema, risco ou condição que possa comprometer o projeto gera plano de ação para aceite humano.
9. Mudanças novas exigem `Depende de` explícito em todas as tarefas; ausência é erro. A change 001 é sequencial por decisão explícita e opera em modo legado documentado.
10. Estruturas de tarefa malformadas são rejeitadas com `E_PARSE` conforme lista fechada.
11. O arquivamento valida tudo antes de mover e confina origem e destino à mudança correta.
12. O estado Git é inspecionado antes da movimentação; alterações rastreadas preexistentes exigem decisão explícita.
13. O staging usa apenas caminhos exatos do manifesto, sem staging indiscriminado.
14. O arquivamento usa rename atômico e recuperação idempotente; não repete movimentação já concluída.
15. `archive-state.json` é gravado antes do rename; uma interrupção entre o movimento e a marcação é concluída pela recuperação, sem mover de novo.
16. A ordem de finalização é `proposal.md` e depois `archive-state.json`; a recuperação completa os dois marcadores de forma idempotente.
17. O arquivamento só reporta sucesso quando a versão final do `proposal.md`, com `Staging Git: DONE`, estiver staged.

## 11. Aprovação

Esta proposta depende de aprovação humana antes da implementação.

Enquanto o status não for `APPROVED`, nenhuma tarefa desta mudança pode ser iniciada.
