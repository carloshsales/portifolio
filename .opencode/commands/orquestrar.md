---
description: Executa o pipeline de uma tarefa RawSpec, da exploração ao registo, com verificação manual pelo utilizador
agent: orquestrador
model: opencode-go/gpt-6-luna#high
---

# /orquestrar

Executa o pipeline de uma tarefa RawSpec v2. A verificação é feita pelo utilizador,
que executa `pnpm test` e `pnpm test:e2e` e envia a evidência.

`TASK-ID` identifica a task a executar, por exemplo `TASK-005`. A change é
inferida do ficheiro da task. Sem argumento, apresenta as tasks elegíveis.

## Antes de começar

Lê `AGENTS.md`. A regra de resumo prévio aplica-se a este comando.

Resolve a task e confirma o estado:

```bash
node scripts/rawspec-v2-cli.mjs resolve $ARGUMENTS
node scripts/rawspec-v2-cli.mjs next --change <change-id>
```

Se a task não existir, for ambígua ou já estiver arquivada, pára e reporta.

## Pipeline

Executa as etapas por ordem, usando os agentes indicados.

1. **Exploração** — invoca o agente `explorador`.

   ```bash
   node scripts/rawspec-v2-cli.mjs resolve $ARGUMENTS
   ```

   Pára se o explorador reportar uma divergência que exija decisão do
   utilizador.

2. **Clareza** — invoca o agente `analista-clareza` com o ficheiro da task.

   **Gate:** abaixo de 90/100, pára. Apresenta a pontuação criterion a criterion
   e pergunta ao utilizador como reformular a task. Não implementas.

3. **Aprovação** — apresentas o resumo segundo `AGENTS.md`: a tarefa, o que
   será feito, os ficheiros afectados e as verificações.

   Se houver discrepância entre a task e o repositório, pára e pergunta.

4. **Implementação** — invoca o agente `implementador`, restrito aos ficheiros
   de `## Arquivos`. Ao terminar, pede ao `guardiao` o `begin-verify`, para a task
   passar a `VERIFYING`.

5. **Verificação manual** — apresentas ao utilizador os comandos, por esta ordem:

   1. `pnpm test`
   2. `pnpm test:e2e`

   Pedes a evidência de cada um: o comando exato e o resultado final (código de
   saída 0 ou resumo de sucesso). **Aguardas** a resposta. Não avanças sem ela.

   Envias a evidência ao agente `verificador`, que a avalia sem executar shell.

   - Se falhar: pára e apresenta a saída relevante ao utilizador. Pede ao
     `guardiao` o `fail` com o motivo e volta a 4. Na segunda falha pelo mesmo
     motivo, o `implementador` sobe de tier de modelo.
   - Se estiver em falta ou for ambígua: pede o complemento e aguarda.

6. **Revisor A** — invoca o agente `revisor`, com foco em correcção funcional.

7. **Revisor B** — invoca o agente `revisor-b`, com foco em acessibilidade,
   tipagem, performance e segurança.

   - Ambos reprovam: pede ao `guardiao` o `fail` e volta a 4 com os dois
     conjuntos de achados.
   - Discordam: invoca o `guardiao` para desempate.
   - Ambos aprovam: continua.

8. **Registo** — invoca o agente `guardiao`.

   O `guardiao` regista a verificação com `verify`, acrescenta o histórico e o
   ADR quando aplicável, e executa `commit-task`. Este comando corre
   `pnpm lint`, `pnpm typecheck`, `pnpm test` e `pnpm build`, por esta ordem,
   aplica o gate de âmbito e faz commit e push se tudo passar. Os hooks do Husky
   podem repetir parte destas verificações.

   Depois do push, o `commit-task` abre o pull request da branch da tarefa para
   `main`. A criação é idempotente: se já existir um pull request aberto para a
   branch, o URL existente é reportado e nenhum duplicado é criado. O pull
   request nunca é fundido automaticamente.

   Se o `gh` não estiver disponível, a autenticação falhar, ou a criação do pull
   request falhar, o `commit-task` reporta o erro exacto. O commit e o push
   permanecem válidos, e a verificação da tarefa não é reprovada por causa do
   pull request. Reporta o URL e o estado do pull request.

## Regras

- Não escrevas código tu próprio. Delega.
- Não executes `pnpm test` nem `pnpm test:e2e`. Apresenta-os ao utilizador e aguarda a evidência.
- Não faças commit nem push. Essa responsabilidade é do `guardiao`, através do `commit-task`.
- Não cries pull requests à mão. Essa responsabilidade é do `commit-task`, que o faz depois do push.
- Não faças merge de pull requests.
- Não escrevas em `src/content/`. O conteúdo real é do utilizador.
- Nunca alteres o status de aprovação de uma mudança ou de uma task.
- Se qualquer gate falhar, pára e apresenta o resultado. Não avances.
- Se uma etapa precisar de uma decisão que é do utilizador, pergunta. Não
  decidas por ele.

## Formato de saída

```text
TAREFA: <id> — <título>
ESTADO: <etapa em que ficou>
PONTUACAO: <clareza>/100
FICHEIROS: <tocados>
COMANDOS: <na verificação: pnpm test, depois pnpm test:e2e — aguardo a evidência; senão "nenhum">
VERIFICACOES: <resultado do verificador, ou "pendente">
BRANCH: <branch da tarefa, ou "nenhuma">
PUSH: <enviado para origin/<branch>, não enviado, ou falhou com a primeira linha do erro>
PR: <URL do pull request, "já existia: <url>", ou "falhou: <primeira linha do erro>">
PEDIDO: <o que precisas do utilizador, ou "nenhum">
```
