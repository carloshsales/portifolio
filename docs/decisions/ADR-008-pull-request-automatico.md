# ADR-008: Criação automática de pull requests no commit-task

- Status: Accepted
- Data: 2026-11-17

## Contexto

O fluxo de branch por tarefa (ADR-005) terminava no push. A abertura do pull
request para `main` era manual e dependia de intervenção do utilizador, o que
quebrava o carácter automático do pipeline e atrasava a revisão.

## Decisão

O `commit-task` passa a abrir automaticamente o pull request da branch da tarefa
para `main`, com `gh pr create`, depois do commit e do push bem-sucedidos. A
criação é idempotente: se já existir um PR aberto para a branch, o URL
existente é reportado e nenhum duplicado é criado. O PR nunca é fundido
automaticamente.

Se o `gh` não estiver disponível, a autenticação falhar, ou a criação falhar, o
erro é reportado com precisão; o commit e o push permanecem válidos e a
verificação da tarefa não é reprovada por causa do pull request.

## Consequências

**Positivas**

- O pipeline fica completo: branch, commit, push e PR são feitos numa única
  invocação do guardião.
- A revisão passa a ser disparada automaticamente para `main`.

**Negativas**

- Dependência do GitHub CLI (`gh`) e da sua autenticação no ambiente.

**Neutras**

- O PR é criado aberto; a fusão continua a ser manual.
