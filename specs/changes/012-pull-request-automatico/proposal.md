# Change 012 — Automatizar a criação de pull requests

- Status: APPROVED
- Tipo: Melhoria de processo
- Prioridade: Alta
- Data: 2026-11-17
- Relacionadas: `008-orquestracao-verificacao-e-push` (arquivada), `004-rawspec-branch-per-task` (arquivada), `011-permissoes-do-guardiao-e-conflito-do-pr-17` (arquivada)

## 1. Objetivo

Automatizar a criação do pull request da branch da tarefa para `main`, imediatamente
depois do commit e do push bem-sucedidos, dentro do `commit-task`, de modo que a
abertura do pull request deixe de depender de um passo manual e o resultado da
tarefa passe a reportar o URL do pull request.

## 2. Problema

O `commit-task` termina no push. A partir desse momento, a abertura do pull
request era um passo manual, executado por um agente ou pelo utilizador, fora do
fluxo controlado pelo RawSpec. Essa manualidade tinha três consequências:

1. **O pull request não era rastreável pelo formalizador.** O `commit-task` já
   produzia `branch`, `commit` e `pushed`, mas nada sobre o pull request. Não
   havia registo de qual pull request corresponde a qual tarefa, nem garantia de
   que existia.
2. **Não havia idempotência.** Um segundo `commit-task` na mesma branch, ou um
   passo manual repetido, podia criar pull requests duplicados para a mesma
   branch, um por cada execução.
3. **O resultado da tarefa era incompleto.** O relatório de saída do `guardião`
   (`BRANCH`, `COMMIT`, `PUSH`, `EVIDENCIA`) não tinha campo para o pull
   request, pelo que o estado da integração era invisible para quem lê o
   relatório.

Havia ainda um defeito latente na CLI que a automação tornava visível: o
parser de argumentos tratava `--no-push` como uma flag que consome o argumento
seguinte. Com `commit-task --no-push TASK-001`, o identificador da tarefa era
engolido pela flag e a linha de comandos era inválida. A flag `no-pr`, necessária
para desactivar a abertura automática, partilhava o mesmo defeito.

## 3. Escopo

### 3.1 Incluído

- Abertura automática do pull request pelo `commit-task`, depois do push
  bem-sucedido, com `gh pr create --base main --head <branch>`.
- Idempotência: antes de criar, o `commit-task` procura um pull request aberto
  para a branch; se existir, devolve o URL existente e não cria duplicado.
- Nunca fundir automaticamente. A revisão e a integração são decisões do
  utilizador.
- A flag `--no-pr`, que desactiva a abertura automática, e a forma explícita
  `--flag=true` / `--flag=false` para todas as flags booleanas da CLI.
- Um comando autónomo `open-pr`, que abre o pull request de uma tarefa à parte,
  com o mesmo comportamento idempotente.
- Um executor de comandos externos (`runExternalCommand`) e a resolução do
  executável do GitHub CLI (`resolveGhExecutable`), para que as chamadas ao `gh`
  possam ser substituídas em teste sem acesso à rede.
- Códigos de erro `E_PR_UNAVAILABLE` e `E_PR_CREATE_FAILED`, com código de saída
  `8`: o primeiro cobre a ausência ou indisponibilidade do `gh` e as falhas de
  procura; o segundo é reservado às falhas de criação depois de o `gh` executar.
  A guarda `E_ARGS` protege um pull request da branch base para ela própria.
- O resultado do `commit-task` passa a incluir `pullRequest`, com `status` entre
  `created`, `existing` e `failed`.
- Documentação da automação em `docs/rawspec-v2.md` (§15.6, catálogo de erros,
  fluxo ponta a ponta e exemplos da CLI), em `AGENTS.md` e nas instruções do
  `guardião`, do `/continuespec` e do `/orquestrar`.
- Testes de nível de unidade e de nível de CLI, com um `gh` falso no `PATH`.

### 3.2 Fora do escopo

- **A revisão e a integração do pull request.** Nenhum merge automático, em
  nenhuma circunstância. A integração continua a ser uma decisão do utilizador.
- **A criação do pull request à mão**, por agente ou pelo utilizador, no fluxo
  padrão. A abertura é responsabilidade do `commit-task`.
- O `main` como origem de pull request. O pull request é sempre da branch da
  tarefa para `main`, nunca o inverso.
- A alteração das permissões do `guardião` ou de qualquer outro agente. O
  `gh` é executado como processo filho de Node pelo `commit-task`, e não através
  das permissões de shell do agente.
- Alterar o estado de aprovação de qualquer mudança ou tarefa.
- O conteúdo de `src/content/`, o layout da aplicação, o tema visual e
  qualquer funcionalidade visível do portefólio.
- Uma interface web para gerir pull requests, ou integração contínua
  equivalente no lado do GitHub.
- A refatoração das outras flags booleanas da CLI para lá do necessário: a
  correcção do parsing afecta `--no-push`, `--no-pr`, `--approved` e `--adr`,
  porque partilham o mesmo defeito.

## 4. Comportamento proposto

### 4.1 Sequência do `commit-task`

O `commit-task` mantém a ordem actual — verificações, gate de âmbito, commit,
push — e acrescenta o pull request como último passo:

1. Correm `pnpm lint`, `pnpm typecheck`, `pnpm test` e `pnpm build`, por esta
   ordem. Se uma falhar, para: não há commit, não há push, não há pull request.
2. O gate de âmbito é aplicado. Um ficheiro fora do âmbito bloqueia com
   `E_SCOPE_VIOLATION`, e nada é commitado.
3. O `git add` é feito com caminhos explícitos, o `git commit` usa a mensagem
   gerada e o `git push -u origin <branch>` publica a branch. Os hooks do
   Husky correm no commit e no push.
4. **Se, e só se, o push tiver sido bem-sucedido**, o `commit-task` procura um
   pull request aberto para a branch e, se não houver, cria-o para `main`.

Sem push, não há pull request. A branch tem de estar publicada para que o
pull request possa ser aberto contra ela.

### 4.2 Idempotência

Antes de criar, o `commit-task` executa:

```bash
gh pr list --head <branch> --base main --state open --json number,url,state,title
```

Se a resposta trouxer um pull request, o URL, o número e o título existentes são
reportados, com `status: existing`, e nenhum duplicado é criado. Se a resposta
for um array JSON válido e vazio, o pull request é criado.

A resposta da procura tem de ser válida, porque a idempotência assenta nela. Só
um array JSON válido e vazio significa "não há pull request". Uma resposta
inválida — saída vazia, JSON inválido, JSON que não é um array, ou um array com
elementos malformados — é reportada com `E_PR_UNAVAILABLE` e interrompe a
operação antes de qualquer criação. Sem esta guarda, uma resposta inválida seria
lida como "não há pull request" e criaria um pull request duplicado.

A criação é:

```bash
gh pr create --base main --head <branch> --title "<título>" --body "<corpo>"
```

O `--base` e o `--head` são sempre explícitos. O título é
`<change-id> — <task-id> — <título da tarefa>` e o corpo reúne a mudança, a
tarefa, a branch de origem, a branch base, a verificação, a evidência e o plano
de acção.

### 4.3 Falha do pull request

Se o `gh` não estiver instalado ou estiver indisponível, a procura falhar, a
resposta da procura for inválida, a criação falhar, ou a saída da criação não
trouxer um URL legível:

- o erro é reportado com precisão: `E_PR_UNAVAILABLE` quando o `gh` está
  ausente ou indisponível, quando a procura falha ou quando a sua resposta é
  inválida; `E_PR_CREATE_FAILED` quando `gh pr create` foi executado e a
  criação falhou ou não devolveu uma URL legível;
- **o commit e o push permanecem válidos** — não há rollback;
- **a verificação da tarefa não é reprovada** — a falha do pull request não é
  uma falha de qualidade do código;
- o `commit-task` termina com sucesso e o resultado traz
  `pullRequest.status: failed`, com o erro correspondente.

O comando autónomo `open-pr`, ao contrário, termina com código de saída `8` e
o erro em `stderr`, porque não há commit nem push a preservar.

### 4.4 Desactivação e comando autónomo

- `--no-pr` desactiva a abertura automática. `--no-pr=false` volta a activá-la.
- `--no-push` continua a impedir o push e, por consequência, o pull request.
- `open-pr TASK-NNN --change NNN-slug [--branch NAME] [--base BRANCH]` abre o
  pull request de uma tarefa à parte, com o mesmo comportamento idempotente.
  É a via para abrir o pull request quando o `commit-task` correu sem push.
- Um pull request da branch base para ela própria é recusado com `E_ARGS`,
  antes de qualquer chamada ao GitHub CLI.

### 4.5 Reporte

O `commit-task` passa a reportar `branch`, `commit`, `pushed` e `pullRequest`,
com `pullRequest.status` entre `created`, `existing` e `failed`. O formato de
saída do `guardião` ganha o campo `PR:` e o do `/orquestrar` também.

## 5. Requisitos

### 5.1 Funcionais

- O `commit-task` abre o pull request da branch da tarefa para `main`, depois do
  push bem-sucedido, com `gh pr create --base main --head <branch>`.
- O pull request só é aberto depois de um push bem-sucedido. Sem push, não há
  pull request.
- A criação é idempotente: havendo um pull request aberto para a branch, o URL
  existente é reportado e nenhum duplicado é criado.
- A resposta da procura tem de ser válida. Só um array JSON válido e vazio
  significa "não há pull request"; qualquer outra resposta é inválida e é
  reportada com `E_PR_UNAVAILABLE`, sem criação.
- O pull request nunca é fundido automaticamente.
- A falha do pull request não desfaz o commit nem o push, e não reprova a
  verificação da tarefa.
- A flag `--no-pr` desactiva a abertura automática.
- O comando `open-pr` abre o pull request de uma tarefa à parte, com o mesmo
  comportamento idempotente.
- As flags booleanas da CLI (`--no-push`, `--no-pr`, `--approved`, `--adr`)
  aceitam `--flag`, `--flag=true` e `--flag=false`, e nenhuma delas consome o
  argumento seguinte.
- Um pull request da branch base para ela própria é recusado com `E_ARGS`,
  antes de qualquer chamada ao GitHub CLI.
- O resultado do `commit-task` inclui `pullRequest`, com `status`, `url`,
  `number`, `branch`, `base` e `title`.

### 5.2 Não funcionais

- Nenhuma escrita em `src/`, `src/content/`, `index.html` ou nos tokens
  globais.
- Nenhuma alteração ao estado de aprovação de uma mudança ou de uma tarefa.
- Nenhuma reescrita de histórico: sem `reset --hard`, `checkout --`, `restore`
  ou `clean`.
- Nenhuma chamada ao GitHub CLI por shell. O `gh` é executado como processo
  filho de Node, sem shell, com o executável resolvido antes da chamada, o que
  evita injecção de comandos no corpo do pull request.
- Nenhum acesso à rede nos testes: as chamadas ao `gh` são substituídas por
  executáveis falsos no `PATH`.
- As verificações automáticas (`pnpm lint`, `pnpm typecheck`, `pnpm test`,
  `pnpm build`) mantêm-se obrigatórias e anteriores ao commit.

## 6. Critérios de aceitação

- O `commit-task` abre um pull request da branch da tarefa para `main` depois
  do push, e o resultado traz `pullRequest.status: created` com o URL e o
  número.
- Executado de novo na mesma branch, o `commit-task` devolve
  `pullRequest.status: existing` com o URL do pull request já aberto, e não
  cria um segundo pull request.
- Sem push, o `commit-task` não abre pull request e o resultado traz
  `pullRequest: null`.
- Com `--no-pr`, o `commit-task` faz o push e não abre pull request, e o `gh`
  não é invocado.
- Quando o `gh` não está disponível ou a criação falha, o `commit-task` termina
  com sucesso, o commit e o push permanecem válidos, e
  `pullRequest.status: failed` traz o código de erro correspondente.
- O comando `open-pr` termina com código de saída `8` e `E_PR_UNAVAILABLE`
  quando o GitHub CLI está ausente ou indisponível, ou quando a procura falha ou
  devolve uma resposta inválida.
- O comando `open-pr` termina com código de saída `8` e `E_PR_CREATE_FAILED`
  quando `gh pr create` foi executado e a criação falhou ou não devolveu uma URL
  legível.
- Quando a resposta da procura é inválida — saída vazia, JSON inválido, JSON que
  não é um array, ou um array com elementos malformados — a criação não prossegue:
  o `open-pr` termina com código de saída `8` e `E_PR_UNAVAILABLE`, e o
  `commit-task` termina com sucesso com `pullRequest.status: failed` e
  `pullRequest.error.code: E_PR_UNAVAILABLE`, preservando o commit e o push.
- `commit-task --no-push TASK-001` é interpretado com `TASK-001` como
  identificador positional, e não como valor da flag.
- Um pull request de `main` para `main` é recusado com `E_ARGS` e código de
  saída `2`, sem chamar o GitHub CLI.
- `docs/rawspec-v2.md`, `AGENTS.md`, `.opencode/agents/guardiao.md`,
  `.opencode/commands/continuespec.md` e `.opencode/commands/orquestrar.md`
  descrevem a automação, o comportamento idempotente, a ausência de merge
  automático e o efeito de `--no-pr`.
- `pnpm lint`, `pnpm typecheck`, `pnpm test` e `pnpm build` passam, por esta
  ordem.

## 7. Riscos e mitigação

- **Risco: criação de pull requests duplicados.** A criação passa a ser
  automática e pode ser reexecutada. Mitigação: a procura pelo pull request
  aberto para a branch precede sempre a criação, e o resultado distingue
  `created` de `existing`. A procura só aceita uma resposta válida, e uma
  resposta inválida falha com `E_PR_UNAVAILABLE` em vez de ser lida como
  "não há pull request". Coberto por teste unitário e por teste de CLI.
- **Risco: um pull request aberto para a branch errada.** Mitigação: `--base` e
  `--head` são sempre explícitos, tanto na procura como na criação, e o teste
  unitário verifica os valores passados ao GitHub CLI.
- **Risco: a falha do pull request ser tratada como falha da tarefa**, levando a
  reverter trabalho válido. Mitigação: o erro do pull request é capturado,
  reportado em `pullRequest.status: failed`, e o `commit-task` termina com
  sucesso. Nenhum rollback do commit ou do push. Coberto por teste.
- **Risco: injecção de comandos no corpo do pull request.** O corpo é escrito
  pela tarefa e pode conter texto do utilizador. Mitigação: o `gh` é executado
  sem shell, com `execFileSync` e argumentos em array, e o executável real é
  resolvido antes da chamada em vez de ser delegado ao shell.
- **Risco: merge automático não intencional.** Mitigação: nenhum caminho de
  código chama `gh pr merge`. O teste unitário verifica que os argumentos
  passados a `pr create` não contêm `--auto-merge`, e as instruções do
  `guardião` e do `/orquestrar` proíbem explicitamente o merge.
- **Risco: o `gh` não instalado em algum ambiente.** Mitigação: a falha é
  detectada antes da execução e reportada com `E_PR_UNAVAILABLE`, sem desfazer
  o commit nem o push, e o `open-pr` permite abrir o pull request mais tarde,
  num ambiente que o tenha. A mesma classificação vale se o `gh` desaparecer
  entre a procura e a criação.
- **Risco: regressão nas outras flags booleanas da CLI.** A correcção do
  parsing afecta `--approved` e `--adr`, usados no arquivamento. Mitigação:
  `--approved` e `--adr` mantêm o valor `true` quando presentes sem sufixo, e
  `--flag=false` desliga. Coberto por teste de parsing.
- **Risco: o gate de âmbito bloquear o commit**, por os ficheiros da
  especificação não constarem da secção `## Arquivos`. Mitigação: a secção
  `## Arquivos` da tarefa declara os nove ficheiros da implementação e os
  ficheiros de especificação que a CLI actualiza, e o gate não reporta ficheiros
  fora do âmbito.

## 8. Decisões confirmadas

- **O pull request é sempre para `main`, com `--base` e `--head` explícitos.**
  O `main` é o branch de integração do projecto, e a branch da tarefa é a
  origem. Um pull request da base para ela própria é um erro de configuração, e
  é recusado com `E_ARGS` antes de qualquer chamada à rede.
- **A criação é idempotente, e a idempotência é feita por procura, não por
  confiança.** A procura de um pull request aberto para a branch precede a
  criação. Confiar apenas no erro do GitHub CLI deixaria a criação dependente do
  texto da mensagem de erro.
- **A resposta da procura tem de ser válida.** Só um array JSON válido e vazio
  significa "não há pull request". Tratar uma resposta inválida como ausência de
  pull request faria a criação prosseguir sobre uma leitura falsa da situação, e
  criaria um duplicado. Saída vazia, JSON inválido, JSON que não é um array, e
  arrays com elementos malformados são respostas inválidas, e falham com
  `E_PR_UNAVAILABLE` antes de qualquer criação.
- **A falha do pull request não é uma falha da tarefa.** O commit e o push são o
  que a revisão de qualidade avalia. Desfazê-los por causa do pull request
  introduziria trabalho manual de recuperação e tornaria a verificação
  dependente de um serviço externo. A falha é reportada com precisão e pode ser resolvida
  depois, com `open-pr`.
- **O merge automático está fora do âmbito, sem excepção.** A revisão e a
  integração são decisões do utilizador. A automação abre o pull request; não
  o funde.
- **`--no-pr` desactiva a abertura automática, e `open-pr` cobre o caso
  omisso.** A flag dá controlo ao executante sem perder a automação por
  omissão; o comando autónomo permite abrir o pull request depois, por exemplo
  quando o `commit-task` correu sem push ou quando o GitHub CLI só está
  disponível mais tarde.
- **A correcção do parsing das flags booleanas é parte do âmbito.** `--no-pr`
  partilha o defeito de `--no-push`, e o mesmo mecanismo trata `--approved` e
  `--adr`. Corrigir só `--no-pr` deixaria o parser inconsistente. A mudança
  mais recente em `docs/rawspec-v2.md` documenta a correcção.
- **A execução do `gh` é feita por `execFileSync`, sem shell.** O corpo do pull
  request é escrito a partir do conteúdo da tarefa e pode conter texto do
  utilizador. Um shell abriria espaço para injecção de comandos.

## 9. Aprovação

Esta proposta depende de aprovação humana antes do início da implementação.
A aprovação é registada pelo utilizador, alterando `Status` para `APPROVED`.

Aprovada pelo utilizador em 2026-11-17, com a criação da change
`012-pull-request-automatico` e da TASK-001 "Automatizar a criação de pull
requests", cobrindo a automação de criação de pull requests já implementada e
verificada.
