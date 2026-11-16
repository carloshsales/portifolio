# Bake-off — fixture de avaliação de modelos

Teste cego para comparar a qualidade de revisão de código entre modelos
candidatos, usando a TASK-005 da change `001-portfolio-mvp` como caso de estudo.

## 1. Como funciona

O fixture `bakeoff/fixture.tsx` é uma cópia de `src/sections/Home/Home.tsx` com
**defeitos plantados** de forma determinística. Cada defeito tem um ID.

Cada modelo candidato recebe exactamente o mesmo prompt e o mesmo ficheiro. A
avaliação é feita por correspondência de IDs: quantos defeitos o modelo
identificou, e se os identificou sem inventar falsos positivos.

## 2. Defeitos plantados

| ID  | Defeito                                                                       | Gravidade | Onde             |
| --- | ----------------------------------------------------------------------------- | --------- | ---------------- |
| D1  | Import directo de `src/content/profile` em vez de `src/data/profile`          | Alta      | linha de import  |
| D2  | `alt` genérico (`"Foto"`) em vez de `Fotografia de <nome>`                    | Alta      | atributo `alt`   |
| D3  | Resumo renderizado mesmo com `summary` vazio (sem guarda `hasSummary`)        | Alta      | render do `<p>`  |
| D4  | Ações renderizadas sem verificar se existe conteúdo em projetos nem contactos | Média     | bloco `.actions` |
| D6  | Falta de `width`/`height` na imagem (provoca layout shift)                    | Média     | `<img>`          |

> **Nota sobre o histórico do fixture.** Uma primeira versão tinha sete
> defeitos, incluindo D5 (`aria-current` com booleano) e D7 (fallback do
> título). Ambos foram removidos depois de detectada a sua invalidade: D5 não
> existe no ficheiro — `aria-current` vive em `Sidebar.tsx`, que o fixture não
> inclui — e D7 é intenção, não defeito, porque o `Home.tsx` real tem o mesmo
> fallback. A versão final tem cinco defeitos verificáveis.

## 3. Critérios de pontuação

| Métrica          | Peso | Descrição                                                                      |
| ---------------- | ---- | ------------------------------------------------------------------------------ |
| Recall           | 45%  | Defeitos encontrados / 5                                                       |
| Precisão         | 30%  | Defeitos verdadeiros / achados totais                                          |
| Formato          | 15%  | Saída no formato `X \| descrição \| ficheiro:linha`. Sem isto, perde 15 pontos |
| Recall ponderado | 10%  | Recall com peso por severidade (alta 1,5 / média 1,0)                          |

Um modelo que responde "SEM DEFEITOS" obtém 0.

**A correspondência é semântica, não por ID.** Os modelos renumeram os defeitos
livremente (o `claude-haiku-5-5` chamou D6 a D3 e D2 a D4), pelo que o score
ignora os IDs que o modelo atribui e casa por termos-chave.

## 4. Resultados medidos

Execução em 2026-11-15, provider `opencode-go`, prompt único, fixture idêntico.

| #   | Modelo             | Score    | Recall   | Precisão | FP     | Custo       | Tempo    |
| --- | ------------------ | -------- | -------- | -------- | ------ | ----------- | -------- |
| 1   | `gpt-6-luna`       | **83,5** | 80%      | 80%      | 1      | $0,0018     | 0,24 min |
| 2   | `kimi-k2.7-code`   | **83,5** | 80%      | 80%      | 1      | $0,0140     | 0,75 min |
| 3   | `beam-free`        | **79,5** | 80%      | 66,7%    | 1      | **$0,0001** | 0,64 min |
| 4   | `claude-haiku-5-5` | **79,5** | 80%      | 66,7%    | 2      | $0,0016     | 0,13 min |
| 5   | `glm-5.3`          | 78,8     | **100%** | 29,4%    | **9**  | $0,1649     | 2,97 min |
| 6   | `mimo-v2.6-pro`    | 76,6     | 80%      | 57,1%    | 3      | $0,0054     | 1,28 min |
| 7   | `minimax-m3`       | 76,5     | **100%** | 21,7%    | **12** | $0,0134     | 0,69 min |
| 8   | `qwen3.7-plus`     | 71,4     | 60%      | 75%      | 1      | $0,0057     | 0,27 min |
| 9   | `hy4`              | 65,8     | 80%      | 21,1%    | **11** | $0,1133     | 2,97 min |
| 10  | `step-5-preview`   | 61,8     | 60%      | 42,9%    | 3      | $0,0141     | 0,41 min |

### Leitura dos resultados

**O recall é quase igual para todos.** Sete dos dez modelos encontram 80% dos
defeitos. Nenhum modelo é claramente melhor a _detectar_.

**A precisão é o que separa os modelos.** Três modelos têm recall de 100%
(`glm-5.3`, `minimax-m3`) mas produzem 9 e 12 falsos positivos
respectivamente. Encontram tudo e inventam muito. Num pipeline de agentes, onde
o revisor bloqueia a implementação, isso é pior que não encontrar: cada falso
positivo consome um ciclo de retrabalho.

**`gpt-6-luna` é o melhor equilíbrio.** Score mais alto, 80% de recall, 1 falso
positivo, e custa $0,0018 por revisão.

**`beam-free` é o melhor custo-benefício.** Score 79,5 — a menos de 4 pontos do
melhor — por $0,0001. Vinte vezes mais barato que `gpt-6-luna`.

**`claude-haiku-5-5` é a surpresa.** Score 79,5 com o menor tempo (0,13 min) e
custo de $0,0016. Ao contrário da intuição de que um modelo mais fraco em
código teria pior desempenho, não está.

### Modelos indisponíveis na conta

O teste revelou quatro restrições reais:

| Modelo                                                                                                   | Motivo                                                   |
| -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `opencode-go/gemini-3.8-flash`                                                                           | Não existe no provider `opencode-go`                     |
| `opencode-go/minimax-m3.1-flash-free`                                                                    | Não existe no provider `opencode-go`                     |
| `opencode-go/muse-spark-1.3-contributor`                                                                 | Exige consentimento "endpoints que treinam com os dados" |
| `opencode-go/deepseek-v4.1-flash` / `deepseek-v4-pro`                                                    | Exigem região "Global"; hospedados fora da Europa e EUA  |
| `opencode/muse-ember-1.0`, `gemini-3.8-flash`, `mistral-large-4`, `deepseek-v4.1-flash`, `qwen3.8-flash` | Provider `opencode` sem créditos: "Insufficient balance" |

**Consequência para o routing:** a tabela tem de usar exclusivamente modelos
`opencode-go` queRespondam sem consentimento adicional. Isto invalida `muse-spark-1.3-contributor` (que era a escolha para exploração na tabela anterior) e todos os modelos `opencode`/Personal.

## 5. Prompt do teste

```text
Revê o ficheiro `bakeoff/fixture.tsx` e identifica todos os defeitos.

Contexto: este ficheiro é uma secção de um portfólio em React + TypeScript.
Regras do projecto:
- A secção lê de `src/data/`, nunca de `src/content/` directamente.
- O texto alternativo da fotografia descreve a pessoa: `Fotografia de <nome>`.
- A secção funciona com conteúdo vazio, ocultando o resumo e as ações.
- As ações só aparecem quando existe conteúdo correspondente.

Responde APENAS com uma lista de linhas no formato:
D<n> | <descrição curta do defeito> | <ficheiro>:<linha>

Não inventes defeitos que não existem. Se não encontrares defeitos, responde
exatamente: SEM DEFEITOS
```
