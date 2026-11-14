---
description: Inicia a execução de uma tarefa RawSpec, criando ou retomando trabalho aprovado
argument-hint: '[TASK-ID] [--change CHANGE-ID]'
---

# /startspec

Inicia a execução de uma tarefa `TASK-NNN` de uma mudança RawSpec.

## Uso

```text
/startspec                              # próxima tarefa pendente
/startspec TASK-003                     # tarefa específica
/startspec TASK-003 --change 002-slug   # restringe a busca a uma mudança
```

## Ferramenta

Toda a leitura, validação e escrita é feita pelo helper compartilhado. Não
reimplemente parsing nem validação neste comando.

```bash
node scripts/rawspec.mjs resolve TASK-003 --change CHANGE-ID --json
node scripts/rawspec.mjs next --change CHANGE-ID --json
node scripts/rawspec.mjs open --json
node scripts/rawspec.mjs pending-changes --json
node scripts/rawspec.mjs start TASK-003 --change CHANGE-ID --json
node scripts/rawspec.mjs begin-verify TASK-003 --change CHANGE-ID --json
node scripts/rawspec.mjs verify TASK-003 --evidence "..." --change CHANGE-ID --json
node scripts/rawspec.mjs fail TASK-003 --evidence "..." --change CHANGE-ID --json
node scripts/rawspec.mjs commit-message TASK-003 --change CHANGE-ID --json
node scripts/rawspec.mjs action-plan TASK-003 --slug SLUG --severity ALTA --json
node scripts/rawspec.mjs resolve-action-plan PATH --evidence "..." --json
```

## Fluxo

### 1. Verificar tarefas abertas

Rode `node scripts/rawspec.mjs open --json`.

Se houver tarefa aberta (`IN PROGRESS` ou `VERIFYING`):

1. Apresente cada uma com mudança, título e status.
2. **Pergunte ao usuário:** "Deseja iniciar outra tarefa enquanto estas estão em
   execução?"
3. Se a resposta for negativa, **interrompa sem alterar arquivos** e oriente:
   "Use `/continuespec TASK-ID` para concluir a tarefa aberta."
4. Se a resposta for afirmativa, continue.

A pergunta é obrigatória mesmo com apenas uma tarefa aberta.

### 2. Resolver a tarefa

**Com `TASK-ID`:** rode `resolve TASK-ID --json`.

- Se retornar `E_TASK_AMBIGUOUS`, apresente cada candidata com mudança, título,
  status, arquivo e linha e **pergunte ao usuário qual usar**. Não escolha.
- Se retornar `E_TASK_NOT_FOUND`, informe e sugira conferir o ID.
- Se retornar `E_TASK_ARCHIVED`, informe que a tarefa está em mudança arquivada.

**Sem argumento:** rode `next --json`.

- Se retornar `E_CHANGE_AMBIGUOUS`, apresente as mudanças candidatas e
  **pergunte ao usuário qual usar**. Não escolha.
- Se retornar `E_CHANGE_NOT_APPROVED`, liste as mudanças e os documentos que
  faltam aprovação e pare.
- Se retornar `E_NOTHING_TO_START`, informe que não há tarefa pendente.

### 3. Validar aprovação e dependências

O helper já valida. Apresente sempre a **origem de cada dependência**:

- `explicit` — declarada em `Depende de`.
- `legacy-sequential` — modo legado, só na change 001. A dependência é a
  tarefa anterior na ordem do arquivo.
- `none` — sem dependência.

Se o helper retornar `E_CHANGE_NOT_APPROVED`, `E_DEPENDENCY_PENDING`,
`E_DEPENDENCY_UNDECLARED`, `E_DEPENDENCY_UNKNOWN` ou `E_DEPENDENCY_CYCLE`,
**pare e mostre a mensagem, a origem e a lista de pendências**. Não avance.

### 4. Iniciar a tarefa

Rode `start TASK-ID --json`.

O helper exige `Status: PENDING` e grava `IN PROGRESS` com a data em `Início`.
Se retornar `E_TASK_STATE`, a tarefa não está `PENDING`: informe e oriente
`/continuespec TASK-ID`.

### 5. Executar a tarefa

Leia o `tasks.md` e o `design.md` da mudança e implemente o que a tarefa
descreve. Não escreva em outras mudanças. A change 001 é somente leitura.

### 6. Verificar e registrar evidências

Execute as verificações da aceitação da tarefa (`pnpm lint`, `pnpm typecheck`,
`pnpm test`, `pnpm build`, conforme a tarefa).

1. Rode `begin-verify TASK-ID --json`.
2. Se tudo passar, rode `verify TASK-ID --evidence "<resumo>" --json`.
3. Se algo falhar e não puder ser corrigido no escopo, rode
   `fail TASK-ID --evidence "<motivo>" --json` e mantenha a tarefa aberta.

`verify` exige evidência não vazia. Nunca registre `VERIFIED` sem evidência
real das verificações executadas.

### 7. Fechar a tarefa

Rode `commit-message TASK-ID --json` e apresente a mensagem no bloco copiável.

A mensagem é uma **saída** do comando. **Não execute `git commit` nem
`git push`.** O commit continua humano.

Apresente também:

- resumo do que foi implementado;
- arquivos alterados;
- verificações executadas e resultados;
- evidência registrada em `tasks.md`;
- próximo passo sugerido.

## Problemas e riscos

Crie um plano de ação **somente** para risco real: falha que não pode ser
corrigida no escopo, alteração inesperada fora do escopo, conflito de
requisito, risco de segurança, integridade ou de dados, necessidade de
mudança de escopo, risco para outra mudança, ou impossibilidade de produzir
evidência.

1. **Interrompa** a ação arriscada.
2. Rode `action-plan TASK-ID --slug SLUG --severity ALTA --json`.
3. Apresente o plano ao usuário e **peça aceite explícito**.
4. Só continue depois do aceite.
5. Se o usuário recusar, mantenha a tarefa aberta e não gere mensagem de
   conclusão.

**Cancelamento do usuário, recusa de escolha, ambiguidade pendente de resposta
ou interrupção normal não criam plano de ação.** Nesses casos, apenas
interrompa o comando, informe o motivo e não altere arquivos.

Planos bloqueiam a conclusão: `PENDING ACCEPTANCE`, `ACCEPTED`, `IN EXECUTION`
e `REJECTED` mantêm a tarefa aberta. Só `RESOLVED` libera a mensagem de
commit.

## Erros comuns

| Código                  | O que fazer                               |
| ----------------------- | ----------------------------------------- |
| `E_TASK_NOT_FOUND`      | Conferir o ID ou a mudança.               |
| `E_TASK_AMBIGUOUS`      | Perguntar ao usuário qual mudança usar.   |
| `E_CHANGE_NOT_APPROVED` | Solicitar aprovação humana.               |
| `E_DEPENDENCY_PENDING`  | Executar as dependências primeiro.        |
| `E_TASK_STATE`          | Usar `/continuespec`.                     |
| `E_NOTHING_TO_START`    | Não há trabalho a iniciar.                |
| `E_PARSE`               | Corrigir a estrutura malformada indicada. |

## Regras

- Nunca altere o status de aprovação de `proposal.md`, `design.md` ou
  `tasks.md`.
- Nunca arquive nada. Arquivamento é de `/arquivespec` e da mudança inteira.
- Nunca faça commit nem push.
- Não crie outros comandos.
