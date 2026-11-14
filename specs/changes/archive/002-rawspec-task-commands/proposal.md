# Change 002 ÔÇö Fluxo RawSpec orientado por tarefa

- Status: ARCHIVED
- Tipo: Melhoria de processo de engenharia
- Prioridade: Alta
- Data: 2026-11-12
- Relacionada: `001-portfolio-mvp` (somente leitura)

- Arquivada em: 2026-11-13
- Staging Git: DONE
## 1. Resultado da investiga├º├úo

### 1.1 O que existe hoje

A investiga├º├úo foi feita no reposit├│rio, nos branches locais e no worktree desta sess├úo.

Foi encontrado:

- `docs/decisions/ADR-001-rawspec-storage.md`, que define Markdown versionado com Git como base do RawSpec.
- `specs/changes/001-portfolio-mvp/` com `proposal.md`, `design.md` e `tasks.md`.
- `specs/changes/archive/`, ainda vazio.
- `specs/specifications/`, com diret├│rios ainda vazios.
- Tarefas identificadas por t├¡tulos `### TASK-NNN ÔÇö T├¡tulo`.
- Estado da tarefa registrado em `- **Status:**` e evid├¬ncia em `- **Verifica├º├úo:**`.
- Fluxo de status documentado na change 001: `PENDING ÔåÆ IN PROGRESS ÔåÆ VERIFYING ÔåÆ COMPLETED`.
- Regra de execu├º├úo por depend├¬ncias, mas sem campo expl├¡cito de depend├¬ncia no formato atual.

### 1.2 Lacuna encontrada

N├úo existe `.opencode/commands/` no reposit├│rio, em nenhum branch local, nem no worktree desta sess├úo.

Tamb├®m n├úo foram encontrados arquivos de defini├º├úo para `/startspec`, `/continuespec` ou `/arquivespec`.

O usu├írio confirmou que esses comandos n├úo existem. Portanto, esta mudan├ºa cria os tr├¬s comandos a partir das conven├º├Áes RawSpec j├í usadas pela change 001, sem substituir um comando legado inexistente.

### 1.3 O que n├úo ser├í alterado

- `specs/changes/001-portfolio-mvp/proposal.md`
- `specs/changes/001-portfolio-mvp/design.md`
- `specs/changes/001-portfolio-mvp/tasks.md`
- O hist├│rico Git existente.

A change 001 poder├í ser usada apenas para leitura e valida├º├úo. Nenhum comando desta mudan├ºa escrever├í nela.

## 2. Problema

O fluxo atual ├® orientado ├á mudan├ºa inteira. Para executar uma tarefa, ├® necess├írio descobrir manualmente:

1. Em qual mudan├ºa a `TASK` est├í.
2. Se a mudan├ºa foi aprovada.
3. Quais tarefas precisam estar conclu├¡das antes.
4. Qual ├® o estado atual da tarefa.
5. Se h├í outra tarefa em execu├º├úo.
6. Se a tarefa pode ser arquivada.

Esse trabalho manual aumenta o risco de:

- iniciar tarefa de mudan├ºa n├úo aprovada;
- executar tarefa com depend├¬ncia pendente;
- iniciar outra tarefa sem perceber que j├í existe uma em execu├º├úo;
- continuar uma tarefa j├í conclu├¡da;
- marcar tarefa como verificada sem evid├¬ncia;
- arquivar uma mudan├ºa com tarefas pendentes;
- arquivar tarefa isolada, quebrando a rastreabilidade da mudan├ºa.

## 3. Objetivo

Permitir que os comandos RawSpec trabalhem diretamente com identificadores `TASK-NNN`, sem perder o fluxo de cria├º├úo e aprova├º├úo de mudan├ºas, nem a possibilidade de arquivar a mudan├ºa inteira.

Fluxo desejado:

```text
/startspec TASK-003
/continuespec TASK-003
/arquivespec
```

## 4. Escopo

### 4.1 Inclu├¡do

- Criar exatamente tr├¬s comandos: `/startspec`, `/continuespec` e `/arquivespec`.
- Resolver automaticamente a mudan├ºa ├á qual uma `TASK` pertence.
- Perguntar ao usu├írio quando houver ambiguidade de tarefa ou de mudan├ºa.
- Validar aprova├º├úo humana da mudan├ºa antes de executar tarefas.
- Validar depend├¬ncias expl├¡citas entre tarefas, com modo legado sequencial documentado para a change 001.
- Rejeitar estruturas malformadas de tarefa com `E_PARSE`, usando uma lista fechada de casos.
- Iniciar a pr├│xima tarefa pendente quando `/startspec` for chamado sem argumento.
- Perguntar antes de iniciar outra tarefa quando j├í existir uma tarefa aberta.
- Continuar a execu├º├úo de uma tarefa existente.
- Exigir evid├¬ncia de verifica├º├úo para concluir tarefa.
- Arquivar somente a mudan├ºa inteira, quando todas as tarefas estiverem `COMPLETED` + `VERIFIED`.
- Concluir todas as valida├º├Áes de arquivamento antes de mover arquivos e confinar origem e destino ├á mudan├ºa correta.
- Inspecionar o estado Git e nunca incluir altera├º├Áes preexistentes do usu├írio sem decis├úo expl├¡cita.
- Usar rename at├┤mico e recupera├º├úo idempotente para n├úo repetir movimenta├º├úo j├í conclu├¡da.
- Permitir `git add` durante o arquivamento, somente em caminhos exatos do manifesto.
- Gerar uma mensagem de commit ao final de cada tarefa conclu├¡da.
- Criar um plano de a├º├úo para aceite quando surgir problema, risco ou algo que possa comprometer o projeto.
- Documentar argumentos, comportamento, erros e exemplos.
- Criar testes automatizados para o resolvedor e as valida├º├Áes.

### 4.2 Fora do escopo

- Alterar a change 001.
- Arquivar tarefas individualmente.
- Criar banco de dados, painel ou estado paralelo aos arquivos Markdown.
- Alterar o formato de `proposal.md`, `design.md` ou `tasks.md` da change 001.
- Alterar o significado de aprova├º├úo humana.
- Fazer commit ou push automaticamente.
- Renomear tarefas existentes.
- Criar comandos alternativos, como `/start-task` ou `/archive-task`.
- Implementar interface gr├ífica.
- Criar um comando de cria├º├úo de mudan├ºas: o fluxo atual continua baseado nos arquivos Markdown.

## 5. Comportamento proposto

### 5.1 `/startspec`

| Entrada | Comportamento |
|---|---|
| `/startspec` | Inicia a pr├│xima tarefa pendente. Se houver mais de uma mudan├ºa com tarefas pendentes, pergunta qual mudan├ºa usar. Se j├í houver tarefa aberta, pergunta se o usu├írio deseja iniciar outra; se a resposta for negativa, interrompe sem alterar estado e orienta `/continuespec` para concluir a tarefa aberta. |
| `/startspec TASK-003` | Localiza a tarefa, identifica a mudan├ºa, valida aprova├º├úo e depend├¬ncias, e inicia a execu├º├úo. |
| `/startspec TASK-003 --change 001-portfolio-mvp` | Mesmo comportamento, restringindo a busca ├á mudan├ºa informada. |
| Argumento fora do padr├úo `TASK-NNN` | Erro de uso. N├úo cria mudan├ºa e n├úo inicia tarefa. |

Regras adicionais:

- "Tarefa aberta" significa `IN PROGRESS` ou `VERIFYING`.
- Se a `TASK` existir em mais de uma mudan├ºa, o comando apresenta as candidatas e pergunta qual usar. O usu├írio decide.
- Se a `TASK` for a mesma tarefa j├í aberta, o comando orienta `/continuespec TASK-ID`.
- Se a pr├│xima tarefa pendente tiver depend├¬ncia n├úo conclu├¡da, o comando para e informa a pend├¬ncia e sua origem; n├úo pula para outra tarefa.
- Depend├¬ncias declaradas s├úo expl├¡citas. A change 001, que n├úo declara `Depende de`, usa o modo legado sequencial e mostra essa origem ao usu├írio.
- O comando nunca inicia duas tarefas sem confirma├º├úo expl├¡cita.

### 5.2 `/continuespec`

| Entrada | Comportamento |
|---|---|
| `/continuespec` | Continua a ├║nica tarefa aberta. Se houver mais de uma, pergunta qual continuar. Se n├úo houver nenhuma, informa que n├úo h├í tarefa em execu├º├úo e sugere `/startspec`. |
| `/continuespec TASK-003` | Recupera o estado da tarefa, verifica pend├¬ncias, depend├¬ncias e evid├¬ncias, e continua a execu├º├úo. |
| `/continuespec TASK-003 --change 001-portfolio-mvp` | Mesmo comportamento, restringindo a busca ├á mudan├ºa informada. |
| `TASK` em `PENDING` | Erro: a tarefa deve ser iniciada com `/startspec TASK-ID`. |
| `TASK` j├í `COMPLETED` + `VERIFIED` | Informa que n├úo h├í pend├¬ncias e n├úo reinicia. |

### 5.3 `/arquivespec`

| Entrada | Comportamento |
|---|---|
| `/arquivespec` | Arquiva a ├║nica mudan├ºa eleg├¡vel. Se houver mais de uma, pergunta qual usar. Se nenhuma estiver eleg├¡vel, lista as pend├¬ncias. |
| `/arquivespec 001-portfolio-mvp` | Arquiva a mudan├ºa informada, se todas as tarefas estiverem `COMPLETED` + `VERIFIED`. |
| `/arquivespec TASK-003` | Erro: arquivamento ├® sempre da mudan├ºa inteira. |

O arquivamento valida por completo aprova├º├úo, tarefas, planos, destino, caminhos e estado Git antes de qualquer movimenta├º├úo. Se houver altera├º├Áes rastreadas preexistentes nos caminhos do manifesto, o comando para e pede decis├úo expl├¡cita antes de mover. Se uma valida├º├úo falhar, nada ├® movido e nenhum `git add` ├® executado.

Depois da valida├º├úo, o comando grava `archive-state.json` dentro da mudan├ºa com `state: ARCHIVING`, move o diret├│rio com uma ├║nica opera├º├úo at├┤mica de rename, finaliza o `proposal.md` do destino com `Status: ARCHIVED`, data e `Staging Git: PENDING` e s├│ ent├úo atualiza o `archive-state.json` para `state: ARCHIVED`. O conte├║do e o hist├│rico s├úo preservados. O `git add` usa apenas os caminhos exatos do manifesto, um por vez, e nunca staging indiscriminado. Ao concluir o staging, o marcador `Staging Git: DONE` ├® escrito e o caminho do `proposal.md` arquivado ├® re-stagiado, de modo que a vers├úo final do documento tamb├®m fique staged; a converg├¬ncia ├® verificada contra o ├¡ndice Git antes de reportar sucesso. Se o staging falhar, a mudan├ºa permanece movida, o estado fica registrado como `Staging Git: FAILED`, e uma nova execu├º├úo retoma apenas o staging, sem mover novamente. Uma interrup├º├úo entre o rename e a finaliza├º├úo ├® recuper├ível: com `archive-state.json` em `ARCHIVING` e origem ausente, o comando reconhece a opera├º├úo interrompida, completa de forma idempotente os dois marcadores, `proposal.md` primeiro e `archive-state.json` depois, e segue para o staging, sem mover nada de novo. O arquivamento n├úo cria commit nem push.

### 5.4 Fechamento de cada tarefa

Ao final de cada tarefa conclu├¡da, o comando deve apresentar:

- resumo do que foi implementado;
- arquivos alterados;
- verifica├º├Áes executadas e resultados;
- evid├¬ncia registrada em `tasks.md`;
- **mensagem de commit pronta**, em bloco copi├ível.

A mensagem de commit segue o padr├úo Conventional Commits e inclui a mudan├ºa, a tarefa, os testes e a evid├¬ncia. O comando n├úo executa `git commit` nem `git push`; a execu├º├úo do commit permanece humana.

Exemplo:

```text
feat(rawspec): add task-based start command

Change: 002-rawspec-task-commands
Task: TASK-009
Tests: pnpm lint; pnpm typecheck; pnpm test; pnpm build
Evidence: all checks passed
Action-Plan: none
```

Se a tarefa tiver um plano de a├º├úo resolvido, a mensagem inclui o caminho do plano.

### 5.5 Problemas, riscos e plano de a├º├úo

Um plano de a├º├úo ├® reservado a problemas t├®cnicos, riscos reais, conflitos de requisitos, seguran├ºa, integridade ou condi├º├Áes que possam comprometer o projeto. Cancelamento do usu├írio, recusa de escolha, ambiguidade pendente de resposta ou interrup├º├úo normal n├úo criam plano; apenas interrompem o comando.

Se durante a execu├º├úo surgir um problema ou risco real, o comando deve:

1. Interromper a a├º├úo arriscada.
2. Criar um plano de a├º├úo em `specs/changes/NNN-slug/action-plans/`.
3. Registrar problema, impacto, evid├¬ncias, op├º├Áes, a├º├úo recomendada, valida├º├úo, rollback e crit├®rios de aceite.
4. Apresentar o plano ao usu├írio e solicitar aceite expl├¡cito.
5. S├│ continuar ap├│s o aceite.
6. Se o usu├írio recusar, manter a tarefa aberta e n├úo gerar mensagem de commit de conclus├úo.

O plano de a├º├úo tem status pr├│prio e n├úo substitui a aprova├º├úo da mudan├ºa. O arquivamento da mudan├ºa ├® bloqueado enquanto houver plano de a├º├úo n├úo resolvido.

## 6. Requisitos

### 6.1 Funcionais

- **RF-01** ÔÇö Identificar automaticamente a mudan├ºa de uma `TASK` a partir de `specs/changes/*/tasks.md`, ignorando `specs/changes/archive/`.
- **RF-02** ÔÇö Recusar execu├º├úo quando a mudan├ºa n├úo estiver aprovada pelo humano.
- **RF-03** ÔÇö Recusar execu├º├úo quando uma depend├¬ncia n├úo estiver `COMPLETED` + `VERIFIED`; exigir `Depende de` expl├¡cito em todas as tarefas de mudan├ºas novas e aplicar modo legado sequencial somente ├á change 001.
- **RF-04** ÔÇö Iniciar tarefa `PENDING` somente via `/startspec`.
- **RF-05** ÔÇö Continuar tarefa `IN PROGRESS`, `VERIFYING` ou `COMPLETED` sem verifica├º├úo somente via `/continuespec`.
- **RF-06** ÔÇö Exigir evid├¬ncia de testes/verifica├º├Áes para marcar `Verifica├º├úo: VERIFIED`.
- **RF-07** ÔÇö Bloquear o arquivamento se qualquer tarefa n├úo estiver `COMPLETED` + `VERIFIED`.
- **RF-08** ÔÇö N├úo permitir arquivamento individual de tarefa.
- **RF-09** ÔÇö `/startspec` sem argumento inicia a pr├│xima tarefa pendente, n├úo cria mudan├ºa.
- **RF-10** ÔÇö Perguntar ao usu├írio antes de iniciar outra tarefa quando j├í houver tarefa aberta.
- **RF-11** ÔÇö Perguntar ao usu├írio quando houver ambiguidade de `TASK` ou de mudan├ºa.
- **RF-12** ÔÇö Documentar argumentos, comportamento, erros, exemplos e pol├¡tica de Git.
- **RF-13** ÔÇö Permitir `git add` no arquivamento, sem commit ou push.
- **RF-14** ÔÇö Ao final de cada tarefa conclu├¡da, gerar uma mensagem de commit pronta e copi├ível.
- **RF-15** ÔÇö Detectar problema, risco ou condi├º├úo que possa comprometer o projeto e criar um plano de a├º├úo para aceite.
- **RF-16** ÔÇö Exigir aceite humano do plano de a├º├úo antes de executar a corre├º├úo.
- **RF-17** ÔÇö Bloquear o arquivamento enquanto houver plano de a├º├úo n├úo resolvido.
- **RF-18** ÔÇö Rejeitar com `E_PARSE` a lista fechada de estruturas malformadas definida no design, incluindo status desconhecido, t├¡tulo inv├ílido e limites amb├¡guos.
- **RF-19** ÔÇö Concluir todas as valida├º├Áes de arquivamento antes de mover e confinar origem e destino ├á mudan├ºa correta.
- **RF-20** ÔÇö Inspecionar o estado Git dos caminhos do manifesto e exigir decis├úo expl├¡cita antes de incluir altera├º├Áes preexistentes.
- **RF-21** ÔÇö Executar `git add` somente em caminhos exatos do manifesto, sem staging indiscriminado.
- **RF-22** ÔÇö Arquivar com rename at├┤mico e recupera├º├úo idempotente, sem repetir movimenta├º├úo j├í conclu├¡da.
- **RF-23** ÔÇö Criar plano de a├º├úo apenas para riscos reais; cancelamento e ambiguidade pendente apenas interrompem.
- **RF-24** ÔÇö Gravar `archive-state.json` antes do rename e us├í-lo para reconhecer e concluir um arquivamento interrompido entre o movimento e a marca├º├úo.
- **RF-25** ÔÇö Garantir que a vers├úo final do `proposal.md` arquivado, com `Staging Git: DONE`, esteja no ├¡ndice Git antes de reportar sucesso.
- **RF-26** ÔÇö Finalizar os marcadores na ordem `proposal.md` e depois `archive-state.json`, e completar ambos de forma idempotente na recupera├º├úo, independentemente de o `proposal.md` j├í estar atualizado.

### 6.2 N├úo funcionais

- **RNF-01** ÔÇö Uma ├║nica implementa├º├úo compartilhada de resolu├º├úo e valida├º├úo, evitando l├│gica duplicada nos tr├¬s comandos.
- **RNF-02** ÔÇö Nenhuma depend├¬ncia nova de runtime.
- **RNF-03** ÔÇö Opera├º├Áes de escrita limitadas a `specs/changes/` e restritas ao reposit├│rio.
- **RNF-04** ÔÇö Nenhuma altera├º├úo destrutiva: n├úo apagar tarefas, mudan├ºas ou hist├│rico.
- **RNF-05** ÔÇö Nenhum commit, push, rebase ou reescrita de hist├│rico autom├ítica.
- **RNF-06** ÔÇö Testes automatizados cobrindo resolu├º├úo, aprova├º├úo, depend├¬ncias, transi├º├Áes e arquivamento.
- **RNF-07** ÔÇö Cada tarefa do plano traz checklist pr├│pria dos oito crit├®rios de clareza, sem percentual, marcada item a item como `ATENDE` ou `N├âO SE APLICA` com justificativa: objetivo, arquivos, entreg├íveis, contrato e erros, testes, aceita├º├úo, depend├¬ncias declaradas e aus├¬ncia de decis├Áes pendentes.

## 7. Crit├®rios de aceita├º├úo

- Os tr├¬s comandos existem e t├¬m argumentos documentados.
- `/startspec` sem argumento inicia a pr├│xima tarefa pendente e pergunta quando h├í ambiguidade.
- `/startspec` pergunta antes de iniciar outra tarefa quando j├í existe uma aberta.
- `/startspec TASK-003` localiza a change 001 em modo somente leitura e identifica corretamente a tarefa.
- Uma tarefa de mudan├ºa n├úo aprovada ├® recusada com mensagem clara.
- Uma tarefa com depend├¬ncia pendente ├® recusada com a lista de depend├¬ncias e a origem de cada uma.
- A change 001 opera em modo legado sequencial, com `dependencySource: legacy-sequential` exibido.
- Estruturas malformadas da lista fechada s├úo recusadas com `E_PARSE`.
- `/continuespec TASK-ID` recupera o estado e n├úo reinicia tarefa conclu├¡da.
- Tarefa s├│ recebe `COMPLETED` + `VERIFIED` com evid├¬ncia registrada.
- `/arquivespec` recusa mudan├ºa com tarefa `PENDING`, `IN PROGRESS`, `VERIFYING` ou `VERIFIED` ausente.
- `/arquivespec TASK-ID` ├® recusado.
- O arquivamento conclui todas as valida├º├Áes antes de mover; falha de valida├º├úo n├úo move arquivos nem executa `git add`.
- Altera├º├Áes rastreadas preexistentes nos caminhos do manifesto interrompem o arquivamento antes da movimenta├º├úo e exigem decis├úo expl├¡cita.
- O staging usa somente caminhos exatos do manifesto, sem diret├│rio, glob ou `git add -A` indiscriminado.
- Arquivamento j├í movido n├úo ├® repetido; staging `PENDING` ou `FAILED` ├® retomado de forma idempotente.
- Interrup├º├úo entre o rename e a marca├º├úo ├® recuper├ível: `archive-state.json` permite concluir o arquivamento sem mover a mudan├ºa de novo, inclusive quando o `proposal.md` j├í foi finalizado e o `archive-state.json` ainda est├í em `ARCHIVING`.
- A vers├úo final do `proposal.md` arquivado, com `Staging Git: DONE`, fica staged; o arquivo n├úo permanece como altera├º├úo unstaged.
- O arquivamento n├úo cria commit nem push.
- Toda tarefa conclu├¡da termina com uma mensagem de commit pronta, sem commit autom├ítico.
- Todo problema ou risco real gera um plano de a├º├úo para aceite; cancelamento ou ambiguidade pendente n├úo gera plano.
- O arquivamento ├® bloqueado enquanto houver plano de a├º├úo n├úo resolvido.
- A mudan├ºa 001 permanece sem altera├º├Áes (`git diff -- specs/changes/001-portfolio-mvp` vazio).
- `pnpm lint`, `pnpm typecheck`, `pnpm test` e `pnpm build` passam.
- Cada tarefa do `tasks.md` traz checklist pr├│pria dos oito crit├®rios de clareza, sem percentual, com `ATENDE` ou `N├âO SE APLICA` justificado.

## 8. Riscos e mitiga├º├úo

| Risco | Mitiga├º├úo |
|---|---|
| `TASK-NNN` repetido em mudan├ºas diferentes. | O comando apresenta as candidatas e pergunta ao usu├írio; nunca escolhe sozinho. |
| V├írias mudan├ºas com tarefas pendentes. | `/startspec` sem argumento pergunta qual mudan├ºa usar. |
| Tarefa j├í em execu├º├úo. | O comando pergunta se o usu├írio deseja iniciar outra; se n├úo, interrompe. |
| Status divergente entre `proposal`, `design` e `tasks`. | Um ├║nico validador l├¬ os tr├¬s documentos e aplica a regra de aprova├º├úo. |
| Depend├¬ncia impl├¡cita bloquear tarefa inesperadamente. | Mudan├ºas novas exigem `Depende de` expl├¡cito; a change 001 usa modo legado sequencial com origem exibida. |
| Movimenta├º├úo de arquivos antes de validar. | O arquivamento conclui todas as valida├º├Áes antes de mover; falha n├úo movimenta nada. |
| Caminho de arquivamento escapar da mudan├ºa. | Origem e destino s├úo resolvidos com caminho real e confinados a `specs/changes/`. |
| Verifica├º├úo sem evid├¬ncia real. | A transi├º├úo para `VERIFIED` exige texto de evid├¬ncia e resultados das verifica├º├Áes. |
| Arquivamento prematuro. | Gate ├║nico que exige todas as tarefas `COMPLETED` + `VERIFIED`; teste dedicado. |
| Altera├º├úo acidental da change 001. | Escrita restrita ├á mudan├ºa resolvida; valida├º├úo final compara `git diff` da 001. |
| Reescrita de Markdown e perda de formata├º├úo. | Edi├º├úo pontual das linhas de status, preservando o restante do arquivo. |
| `git add` global afetar arquivos alheios. | Staging somente de caminhos exatos do manifesto, um por vez, sem diret├│rio ou glob. |
| Altera├º├Áes preexistentes do usu├írio serem inclu├¡das no staging. | O estado Git ├® inspecionado antes de mover; se houver altera├º├úo rastreada, o comando para e pede decis├úo expl├¡cita. |
| Falha de staging ap├│s a movimenta├º├úo. | `Staging Git: FAILED` ├® registrado; nova execu├º├úo retoma apenas o staging, sem mover novamente. |
| Repeti├º├úo destrutiva de arquivamento j├í movido. | Origem ausente + destino com `Status: ARCHIVED` impede nova movimenta├º├úo e permite recupera├º├úo idempotente. |
| Interrup├º├úo entre o rename e a marca├º├úo `ARCHIVED`. | `archive-state.json` ├® gravado antes do rename; a recupera├º├úo conclui o destino sem mover a mudan├ºa de novo. |
| Interrup├º├úo entre a finaliza├º├úo do `proposal.md` e a atualiza├º├úo do `archive-state.json`. | A ordem dos marcadores ├® fixa e a recupera├º├úo completa os dois de forma idempotente, independentemente do estado do `proposal.md`. |
| `proposal.md` final ficar fora do staging. | O marcador `Staging Git: DONE` ├® escrito e o caminho exato ├® re-stagiado; a converg├¬ncia ├® verificada contra o ├¡ndice Git antes de reportar sucesso. |
| Plano de a├º├úo criado para cancelamento ou d├║vida simples. | Planos s├úo reservados a riscos reais; cancelamento e ambiguidade pendente apenas interrompem. |
| Risco identificado durante a tarefa. | O comando interrompe, cria plano de a├º├úo e s├│ continua ap├│s aceite humano. |
| Conclus├úo sem mensagem de commit. | O fechamento da tarefa s├│ ├® reportado como completo ap├│s gerar a mensagem de commit. |
| Plano de a├º├úo esquecido ou n├úo resolvido. | O arquivamento valida todos os planos da mudan├ºa e bloqueia os n├úo resolvidos. |

## 9. Compatibilidade e aprova├º├úo humana

- Como n├úo existe comando legado versionado, n├úo h├í sintaxe antiga de cria├º├úo de mudan├ºas a preservar.
- A cria├º├úo de mudan├ºas continua sendo feita pelo fluxo atual baseado em `specs/changes/NNN-slug`.
- `/startspec` sem argumento passa a iniciar a pr├│xima tarefa pendente, conforme esclarecimento do usu├írio.
- Nenhum comando altera o status de aprova├º├úo de `proposal.md`, `design.md` ou `tasks.md`.
- Aprova├º├úo continua sendo uma a├º├úo humana.
- Comandos atualizam apenas o estado de execu├º├úo e a verifica├º├úo das tarefas.
- Mudan├ºas novas declaram `Depende de` explicitamente; a change 001, sem o campo, opera em modo legado sequencial.
- O formato existente ├® preservado; a change 001 n├úo precisa de campos novos.
- A change 001 n├úo ser├í migrada nem reescrita.
- `git add` ├® permitido no arquivamento, somente em caminhos exatos do manifesto; commit e push n├úo s├úo.
- Altera├º├Áes preexistentes do usu├írio n├úo s├úo inclu├¡das sem decis├úo expl├¡cita.
- Arquivamento j├í movido n├úo ├® repetido; falha de staging ├® recuperada de forma idempotente.
- `archive-state.json` ├® gravado antes do rename, para que uma interrup├º├úo entre o movimento e a marca├º├úo seja recuper├ível.
- O sucesso do arquivamento exige que a vers├úo final do `proposal.md`, com `Staging Git: DONE`, esteja staged.
- A mensagem de commit ├® uma sa├¡da do comando, n├úo uma autoriza├º├úo para commit autom├ítico.
- O aceite do plano de a├º├úo ├® humano e registrado no pr├│prio plano.

## 10. Decis├Áes confirmadas

1. Os comandos n├úo existem e ser├úo criados.
2. `/startspec` sem par├ómetros inicia a pr├│xima tarefa pendente; com tarefa aberta, pergunta antes de iniciar outra; se o usu├írio recusar, interrompe.
3. `/arquivespec` n├úo cria commit nem push; pode executar `git add`.
4. `design.md` aprovado ├® obrigat├│rio quando o arquivo existir.
5. Qualquer ambiguidade ├® apresentada ao usu├írio; a escolha ├® responsabilidade dele.
6. Para aprova├º├úo, cada tarefa do plano traz checklist pr├│pria dos oito crit├®rios de clareza, sem percentual, marcada como `ATENDE` ou `N├âO SE APLICA` com justificativa.
7. Ao final de cada tarefa, o comando gera uma mensagem de commit; n├úo executa commit nem push.
8. Problema, risco ou condi├º├úo que possa comprometer o projeto gera plano de a├º├úo para aceite humano.
9. Mudan├ºas novas exigem `Depende de` expl├¡cito em todas as tarefas; aus├¬ncia ├® erro. A change 001 ├® sequencial por decis├úo expl├¡cita e opera em modo legado documentado.
10. Estruturas de tarefa malformadas s├úo rejeitadas com `E_PARSE` conforme lista fechada.
11. O arquivamento valida tudo antes de mover e confina origem e destino ├á mudan├ºa correta.
12. O estado Git ├® inspecionado antes da movimenta├º├úo; altera├º├Áes rastreadas preexistentes exigem decis├úo expl├¡cita.
13. O staging usa apenas caminhos exatos do manifesto, sem staging indiscriminado.
14. O arquivamento usa rename at├┤mico e recupera├º├úo idempotente; n├úo repete movimenta├º├úo j├í conclu├¡da.
15. `archive-state.json` ├® gravado antes do rename; uma interrup├º├úo entre o movimento e a marca├º├úo ├® conclu├¡da pela recupera├º├úo, sem mover de novo.
16. A ordem de finaliza├º├úo ├® `proposal.md` e depois `archive-state.json`; a recupera├º├úo completa os dois marcadores de forma idempotente.
17. O arquivamento s├│ reporta sucesso quando a vers├úo final do `proposal.md`, com `Staging Git: DONE`, estiver staged.

## 11. Aprova├º├úo

Esta proposta depende de aprova├º├úo humana antes da implementa├º├úo.

Enquanto o status n├úo for `APPROVED`, nenhuma tarefa desta mudan├ºa pode ser iniciada.
