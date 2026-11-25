# ADR-010: Verificação executada por agente em vez de pelo utilizador

- Status: Accepted
- Data: 2026-11-24

## Contexto

A ADR-007 estabeleceu o orquestrador de agentes com verificação manual: o
utilizador executava `pnpm test` e `pnpm test:e2e` por esta ordem e enviava a
evidência de cada comando. O `verificador` avaliava essa evidência sem
executar shell, e o `orquestrador` apresentava os comandos ao utilizador e
aguardava.

Esse desenho tinha uma vantagem clara: o gate de verificação era humano. Nenhum
código era aceito sem que uma pessoa tivesse visto os testes passarem.

Tinha também três custos, que a prática foi mostrando:

1. **Um passo bloqueante.** O pipeline ficava parado à espera de o utilizador
   correr dois comandos e reportar. A verificação era a etapa mais lenta do
   fluxo, e o mais chato de orquestrar.
2. **Evidência de segunda mão.** O `verificador` avaliava o que o utilizador
   escrevera. Se o utilizador executasse outro comando, ou reportasse um resumo
   em vez do código de saída, o verificador não tinha como saber. O gate
   dependia da disciplina de quem o executava.
3. **Uma assimetria de poder.** O `verificador` não tinha shell, por desenho —
   a §4.3 de `docs/orquestrador.md` documenta que a negação de `subagent` nos
   agentes de leitura é o que torna `edit: deny` e `shell: deny` reais, e sem
   elas as permissões são decorativas. O utilizador, esse, executava os
   comandos que decidem se o código é aceite.

## Alternativas consideradas

1. **Manter a verificação manual.** Descartado: é o estado anterior, e o
   objectivo desta decisão é invertê-lo.
2. **Dar shell ao `verificador`.** Descartado: o `verificador` passaria a ser
   um agente com execução, e o gate deixaria de ser independente — passaria a
   avaliar a sua própria execução. Todas as restrições de `shell: deny` que
   a ADR-007 mediu e documentou seriam relaxadas num só agente.
3. **Dar shell ao `orquestrador`.** Descartado: o `orquestrador` tem
   `shell: *` em `ask`, o que reintroduziria uma interacção humana por comando
   — exactamente o passo que se quer eliminar.
4. **Criar um agente `executor` dedicado.** Adoptada.

## Decisão

As verificações manuais passam a ser executadas por um agente novo, o
`executor`, e não pelo utilizador.

O `executor` corre exactamente dois comandos, por esta ordem:

1. `pnpm test`
2. `pnpm test:e2e`

As permissões do `executor` são:

| Acção | Recurso | Efeito |
|---|---|---|
| `shell` | `*` | `deny` |
| `shell` | `pnpm test *` | `allow` |
| `shell` | `pnpm test:e2e *` | `allow` |
| `shell` | `pnpm lint *` | `allow` |
| `shell` | `pnpm typecheck *` | `allow` |
| `shell` | `pnpm format:check *` | `allow` |
| `shell` | `pnpm build *` | `allow` |
| `edit` | `*` | `deny` |

A regra `shell: *` em `deny` vem **primeiro** e as allow específicas **depois**,
porque a última regra que corresponde prevalece. Com a ordem inversa, o `deny`
genérico captura todos os comandos.

Todos os comandos permitidos são de leitura: não alteram os ficheiros do
projecto. `pnpm build` escreve em `dist/`, que é ignorado pelo Git. Ficam de
fora `pnpm lint:fix` e `pnpm format`, porque reescrevem ficheiros, e
`pnpm dev` e `pnpm preview`, porque são servidores que bloqueiam o processo.

O `executor` **não** tem `subagent: deny`. Ver a justificação abaixo.

O `executor` devolve a evidência de cada comando — o comando exacto, o código
de saída e a saída relevante — ao `verificador`, que a avalia sem executar
shell. A separação entre quem executa e quem avalia mantém-se.

O gate de verificação deixa de ser um passo manual. O utilizador passa a
intervir apenas nas decisões de âmbito, nas discrepâncias entre a task e o
repositório e nos desempates de revisão.

## Justificativa

A separação entre `executor` e `verificador` é o ponto central. Dar a execução
ao `verificador` seria mais simples e eliminaria um agente, mas destruiria a
independência do gate: o verificador passaria a validar o resultado da sua
própria execução, e a distinção entre "o comando passou" e "o agente afirma
que o comando passou" deixaria de existir. Com dois agentes, o `verificador`
continua a poder reprovar a evidência sem nunca a ter produzido.

O `executor` é, além disso, o primeiro agente do projecto com shell que não
escreve código. A medição por matriz mostrou que negar `edit` **e**
`subagent` em conjunto **remove a ferramenta de shell por completo**: o agente
fica com `No tool named "shell" is currently available` e não executa nada,
apesar de ter `allow` para os comandos. Negar apenas uma das duas não tem
esse efeito.

Por isso o `executor` tem `edit: deny` e não tem `subagent: deny`. A
consequência é que a escrita não é impedida pela permissão. É impedida pelo
gate de âmbito do `commit-task`, que a §4.3 de `docs/orquestrador.md` já
identificava como a garantia real, e não pelas permissões.

Esta medição corrigiu também um erro da configuração inicial: as regras
`shell` estavam ordenadas com as allow antes do `deny` genérico. Como a última
regra que corresponde prevalece, o `deny` capturava todos os comandos e o
`executor` não executava nada. A ordem correcta é a que o `guardiao` já usava:
`deny` geral primeiro, allow específicas depois.

O custo é real e registado: o `executor` consome tokens, e a verificação deixa
de ter um revisor humano a olhar para ela. Em troca, o pipeline deixa de ter
o passo mais lento e mais frágil, e a evidência passa a ter um código de
saída fiável em vez de um resumo transcrito.

## Consequências

**Positivas**

- O pipeline corre sem interrupção: `pnpm test` e `pnpm test:e2e` executam-se
  sem intervenção do utilizador.
- A evidência é objectiva: código de saída e saída relevante, não um resumo
  escrito à mão.
- O `verificador` mantém a independência do gate, sem shell.
- O `executor` é um ponto de verificação único e explícito: o único agente que
  pode correr os comandos de verificação.
- O `executor` pode diagnosticar a causa de uma falha: `pnpm lint`,
  `pnpm typecheck` e `pnpm format:check` são permitidos e dão a primeira
  linha de erro, sem alterar ficheiros.

**Negativas**

- O gate de verificação deixa de ser humano. Um erro de configuração que faça
  o `executor` reportar sucesso sem o ter obtido passa a não ser apanhado por
  inspeção humana.
- O `executor` acrescenta uma etapa de pipeline, com custo de tokens. A etapa
  usa `claude-haiku-5-5`, o mesmo modelo do `verificador`. O custo por task
  sobe de $0,0576 para $0,0593.
- O `executor` pode ser tentado a correr comandos fora do âmbito. A negação
  de `shell: *` cobre isso, mas é uma barreira e não uma garantia — a §4.3
  documenta que as permissões não são uma barreira de integridade.
- O `executor` não tem `subagent: deny`, para não perder a ferramenta de shell.
  A delegação a subagentes está, por isso, disponível — o que a §4.3 documenta
  como um caminho para contornar negativas de escrita. A contenção real é o
  gate de âmbito do `commit-task`.
- Uma configuração mal ordenada nas regras `shell` retira ao `executor` a
  capacidade de executar, sem erro visível. A verificação do
  `bakeoff/validate.mjs` confere a ordem, e a do `check-permissions.mjs` exige
  evidência de execução real.

**Neutras**

- A verificação manual continua disponível: correr `pnpm test` e
  `pnpm test:e2e` à mão continua a ser útil para depurar.
- As verificações automáticas do `commit-task` (`pnpm lint`, `pnpm typecheck`,
  `pnpm test` e `pnpm build`) não mudam. O `pnpm test` passa a correr duas
  vezes no fluxo: uma pelo `executor` e outra pelo `commit-task`.
- O `implementador` mantém `shell: pnpm *` em `allow`, que lhe permite correr
  as verificações declaradas em `## Testes` da task.
