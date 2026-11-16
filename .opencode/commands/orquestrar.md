---
description: Executa o pipeline completo de uma tarefa RawSpec, da exploração ao registo
agent: orquestrador
model: opencode-go/gpt-6-luna#high
---

# /orquestrar

Executa o pipeline de uma tarefa RawSpec v2.

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
   de `## Arquivos`.

5. **Verificação** — invoca o agente `verificador`.

   Se falhar, volta a 4. Na segunda falha pelo mesmo motivo, o
   `implementador` sobe de tier de modelo.

6. **Revisão em par** — invoca os agentes `revisor` e `revisor-b`.

   - Ambos reprovam: volta a 4 com os dois conjuntos de achados.
   - Discordam: invoca o `guardiao` para desempate, que confirma o achado com
     o `verificador`.
   - Ambos aprovam: continua.

7. **Registo** — invoca o agente `guardiao`.

   O `guardiao` faz a verificação de âmbito, actualiza o estado RawSpec pela
   CLI, regista o histórico e o ADR quando aplicável, e faz commit e push se
   as cinco condições se cumprirem.

## Regras

- Não escrevas código tu próprio. Delega.
- Não faças commit nem push. Essa responsabilidade é do `guardiao`.
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
VERIFICACOES: <resultado>
PEDIDO: <o que precisas do utilizador, ou "nenhum">
```
