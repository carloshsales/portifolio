# Sistema de especificações

## Estrutura

```text
specs/
├── project/       # contexto geral do projeto
├── tasks/
│   ├── index.md   # índice e próxima tarefa
│   ├── active/    # tarefas ativas
│   └── archive/   # tarefas arquivadas
├── templates/     # template de tarefa e rubrica de clareza
└── changes/       # histórico RawSpec (somente leitura)
```

## Ciclo de vida

`DRAFT → CLARIFICATION → READY → IN_PROGRESS → REVIEW → VERIFIED → ARCHIVED`

| De | Para | Condição |
|---|---|---|
| DRAFT | CLARIFICATION | Avaliação < 90 ou há dúvidas/bloqueios |
| CLARIFICATION | DRAFT | Refinamento concluído e reavaliação ≥ 90 |
| DRAFT | READY | Avaliação ≥ 90, sem bloqueios críticos |
| READY | IN_PROGRESS | Aprovação humana explícita |
| IN_PROGRESS | REVIEW | Implementação concluída |
| REVIEW | IN_PROGRESS | Problemas na revisão |
| REVIEW | VERIFIED | Critérios atendidos, testes executados, evidências registradas |
| VERIFIED | ARCHIVED | Arquivamento individual |
| DRAFT/CLARIFICATION/READY | ARCHIVED | Descarte com aprovação humana |

### Refinamento por perguntas

Quando a avaliação de clareza é inferior a 90 ou há decisões em aberto:

1. A tarefa entra em `CLARIFICATION`.
2. O agente elabora **perguntas objetivas**, uma por critério abaixo do limite ou decisão em aberto.
3. O usuário responde.
4. O agente atualiza a tarefa com as respostas, **registra o histórico de modificações** e reavalia.
5. Se a pontuação for ≥ 90 e não houver bloqueios, a tarefa volta para `DRAFT` (pronta para aprovação).
6. Se ainda for < 90, novas perguntas são elaboradas.

As perguntas e respostas ficam na seção **Perguntas de refinamento** da tarefa.

## Regra dos 90%

Cada tarefa é avaliada por 10 critérios de 10 pontos. A rubrica está em `templates/clarity-rubric.md`.

- Mínimo: 90/100.
- Critérios 1 (objetivo), 3 (escopo) e 5 (aceitação) são obrigatórios.
- N/A exige justificativa.
- Contradições e decisões em aberto bloqueiam.
- Aprovação final é sempre humana.

## Aprovação humana

Nenhuma tarefa entra em `IN_PROGRESS` sem aprovação explícita registrada na seção 11.

## Arquivamento

Tarefas verificadas podem ser arquivadas individualmente em `tasks/archive/`. O histórico permanece no arquivo.

## Histórico legado

`specs/changes/` contém as Changes 001 e 002, que são material de referência e histórico. Não são usadas pelo fluxo atual.
