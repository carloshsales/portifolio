# ADR-011: Indicação da próxima task ao terminar cada tarefa

- Status: Accepted
- Data: 2026-11-24

## Contexto

O pipeline do orquestrador termina cada tarefa com um registo completo: commit,
push, pull request e evidência. O que lhe faltava era a indicação do que se
seguia.

Na prática, isso obrigava o utilizador a perguntar "qual é a próxima?" ou a
consultar a CLI à mão depois de cada tarefa concluída. Numa cadeia como a da
change `001-portfolio-mvp`, onde sete tasks se seguem umas às outras, a pergunta
era inevitável e a resposta já estava no repositório.

O grafo de dependências já resolvia a questão. A CLI tem o comando `next`, que
devolve a task elegível a seguir, respeitando o grafo. O que faltava era
ligá-lo ao fim do pipeline.

## Alternativas consideradas

1. **Não fazer nada.** Descartado: obriga o utilizador a consultar a CLI a
   cada task.
2. **O `orquestrador` consulta o `next` no fim do pipeline.** Descartado: o
   `guardiao` é quem acaba a task e quem sabe o commit e o push correu. Faze-lo
   ali duplica a consulta e espalha a responsabilidade por dois agentes.
3. **O `guardiao` consulta o `next` e devolve-o.** Adoptada.

## Decisão

Quando uma task termina, o `guardiao` identifica a próxima a realizar e
devolve-a no campo `PROXIMA:` do seu formato de saída. O `orquestrador`
apresenta esse campo ao utilizador.

A procura segue esta ordem:

1. `node scripts/rawspec-v2-cli.mjs next --change NNN-slug` — a change da task
   que acabou de terminar, porque é onde o trabalho continua.
2. Se essa change já não tiver tasks pendentes,
   `node scripts/rawspec-v2-cli.mjs next` — percorre todas as changes
   aprovadas.

Dentro de uma change, a ordem segue o grafo de dependências: a task que
desbloqueia mais trabalho vem primeiro por construção, sem regra adicional.

| Resultado | Significado | O que reportar |
|---|---|---|
| Task devolvida | Há trabalho elegível | `PROXIMA: TASK-007 — Implementar seção de habilidades` |
| `E_NOTHING_TO_START` | Não há mais tasks pendentes | `PROXIMA: nenhuma — a change NNN-slug está completa` |
| `E_CHANGE_NOT_APPROVED` | Só há tasks em changes não aprovadas | Falta aprovar uma change |
| `E_CHANGE_AMBIGUOUS` | Várias changes aprovadas com tasks pendentes | Lista as mudanças e pergunta ao utilizador |

## Justificativa

O `guardiao` é o actor certo porque a consulta acontece no momento em que o
facto é verdade: o commit e o push acabaram de correr. Ele tem
`shell: node scripts/rawspec-v2-cli.mjs *` em `allow`, por isso a consulta não
exige mudar permissões.

A consulta usa a CLI em vez de lógica própria no agente. A CLI já valida as
dependências e a aprovação da change, e já conhece a diferença entre uma task
pendente e uma change não aprovada. Reimplementar essa lógica no prompt seria
duplicá-la com menos garantias.

O `PROXIMA:` é **informação**, não uma ordem de execução. Nenhum agente
implementa a task seguinte nem altera o seu estado. Esta separação importa: sem
ela, o `guardiao` poderia ficar tentado a iniciar a task seguinte, o que
contornaria o gate de aprovação e a criação de branch por tarefa da ADR-005.

Quando não há próxima task, o agente diz que não há. Não inventa trabalho, não
cria tasks e não sugere uma change nova: essa decisão é do utilizador.

## Consequências

**Positivas**

- O utilizador sabe o que se segue sem perguntar, em cada task concluída.
- A indicação reflecte o estado real do repositório, porque vem da CLI.
- A prioridade entre tasks segue o grafo de dependências, sem regra mantida à
  mão.

**Negativas**

- Um erro na CLI do `next` afecta a indicação. A mitigação é a verificação
  `bakeoff/validate.mjs`, que confirma que o `guardiao` e o `orquestrador`
  referem a próxima task.
- A ambiguidade entre changes não é resolvida pelo agente. É reportada ao
  utilizador, o que exige uma resposta humana — uma paragem que a task anterior
  não tinha.

**Neutras**

- O `PROXIMA:` pode ser omitido em relatórios parciais, quando a task ainda não
  terminou. Só faz sentido depois do `commit-task`.
- A mudança não altera o `commit-task`, o gate de âmbito, nem as condições de
  commit e push. É apenas uma consulta adicional no fim do registo.
