# ADR-009: Substituição do gpt-6-luna por minimax-m3 no routing

- Status: Accepted
- Data: 2026-11-24

## Contexto

O routing de modelos do orquestrador foi fixado na ADR-007 com base num
bake-off medido sobre a TASK-005 real, com cinco defeitos plantados num fixture
e pontuação por correspondência semântica. Nessa medição, o `gpt-6-luna`
ocupava três das oito etapas do pipeline: orquestração, clareza e revisão A.

Duas condições justificaram rever essa escolha:

1. **Custo.** O `gpt-6-luna` custava $0,0018 por revisão. O `minimax-m3` custa
   $0,0134 — 7,4× mais, e mais caro que o `kimi-k2.7-code` ($0,0140) que
   ocupava a revisão B.
2. **Perfil de erro.** O `minimax-m3` tem recall de 100%, contra 80% do
   `gpt-6-luna`, e encontra defeitos que o `gpt-6-luna` não via. Em troca,
   produz 12 falsos positivos, contra 1. Num pipeline onde a reprovação da
   revisão bloqueia a implementação, cada falso positivo consome um ciclo de
   retrabalho.

O `minimax-m3` estava já medido e disponível no provider `opencode-go`, com
preço de catálogo de $0,30 por milhão de tokens de input, $1,20 de output e
$0,06 de cache read.

## Alternativas consideradas

1. **Manter o `gpt-6-luna`.** Descartado por decisão do utilizador: o objectivo
   era mover o routing para o `minimax-m3`.
2. **Substituir o `gpt-6-luna` apenas na revisão A.** Descartado: a troca
   parcial deixa a orquestração e a clareza num modelo diferente do que a
   revisão usa, sem qualquer razão medida.
3. **Substituir o `gpt-6-luna` em todo o routing e recalcular os custos.**
   Adoptada.

## Decisão

O `gpt-6-luna` sai do routing. O `minimax-m3` entra nas três etapas que
ocupava:

| Etapa | Agente | Modelo |
|---|---|---|
| Orquestração | `orquestrador` | `opencode-go/minimax-m3` |
| Clareza | `analista-clareza` | `opencode-go/minimax-m3` |
| Revisão A | `revisor` | `opencode-go/minimax-m3` |

O `minimax-m3` é usado **sem variante de effort**. Uma medição posterior
mostrou que o modelo só declara `reasoning_options: [{ type: 'toggle' }]` no
catálogo, pelo que não tem variantes `#low`, `#high` ou `#max` — usá-las faz o
agente falhar a carregar com `Variant unavailable`. O `gpt-6-luna`, que
ocupava estas etapas, tinha `reasoning_options` de tipo `effort` e aceitava
`#high` e `#max`. A diferença não é só de sintaxe: o controlo de effort que a
configuração anterior exprimia não existia para este modelo.

As restantes cinco etapas mantêm o modelo actual: `beam-free` na exploração e
no registo, `claude-haiku-5-5` na implementação e na verificação, e
`kimi-k2.7-code` na revisão B.

Os custos documentados em `docs/orquestrador.md` §2 e §6 são recalculados a
partir da medição já existente em `bakeoff/results.json`, e
`bakeoff/calc-cost.mjs` e `bakeoff/validate.mjs` passam a somar
`minimax-m3` no lugar de `gpt-6-luna`.

## Justificativa

A troca é do utilizador, e o registo distingue-a de uma conclusão da medição.
O bake-off continua a dizer que o `gpt-6-luna` é o melhor equilíbrio: o
`minimax-m3` pontua 76,5 contra 83,5, e o pipeline fica 2,5× mais caro por
task — de $0,0229 para $0,0576.

O que muda a favor do `minimax-m3` é o recall: 100% contra 80%. Encontra
todos os cinco defeitos do fixture, incluindo os que o `gpt-6-luna` não via.
Numa revisão que bloqueia a implementação, a cobertura é uma propriedade que
o `gpt-6-luna` não tinha.

O custo desta escolha é explícito: os 12 falsos positivos do `minimax-m3`
passam a ser findings bloqueantes que o revisor B tem de reprovar e o
utilizador tem de confirmar. O mecanismo de desempate e de reprodução já
existe (§5.1 de `docs/orquestrador.md`) e é o que absorve este custo. O
custo por task continua 8,7× abaixo do limite de USD 0,50.

## Consequências

**Positivas**

- A revisão A passa a ter recall de 100%, cobrindo defeitos que escapavam ao
  `gpt-6-luna`.
- Os dois revisores têm agora perfis de erro distintos, o que reforça a
  independência da revisão em par — que antes partilhavam achados e falso
  positivo idênticos.
- O routing passa a usar um só modelo em três etapas, o que simplifica a
  leitura da configuração.

**Negativas**

- O custo por task sobe de $0,0229 para $0,0576 (2,5×).
- O `minimax-m3` tem 12 falsos positivos contra 1, o que tende a gerar mais
  ciclos de retrabalho até o pipeline convergir.
- O `minimax-m3` sobe de preço para $0,60 / $2,40 / $0,12 acima de 512K
  tokens de contexto. As etapas do pipeline recebem contexto mínimo, mas o
  limite de $0,50 por task deixa de ter 21× de margem e passa a ter 8,7×.
- A medição que fundamenta o routing passa a estar desatualizada: reflecte o
  `gpt-6-luna`, não o `minimax-m3`. Reexecutar o bake-off com o routing actual
  traria evidência fresca, mas consome tokens.

**Neutras**

- O `gpt-6-luna` continua disponível no provider `opencode-go` e pode ser
  reposto no routing reverting esta decisão.
- O `minimax-m3` já estava medido e disponível; a troca não exigiu trabalho de
  integração nem consentimento adicional da conta.
