# Design Técnico — Orquestrador de agentes

**Change:** `006-agent-orchestrator`
**Status:** APPROVED
**Base:** `proposal.md`

## 1. Objetivo

Descrever a configuração concreta do orquestrador: agentes, modelos, permissões,
comandos, gates e economia de tokens.

O desenho assenta em três decisões de fundo.

**Configuração nativa, sem código.** Tudo o que é criado vive em `opencode.json`,
`.opencode/agents/`, `.opencode/commands/` e `docs/`. Não há plugin, não há
serviço, não há dependência nova. O custo de manutenção é praticamente zero e a reversão
é a remoção de três diretórios.

**Estado persistente nos ficheiros, não na conversa.** Cada etapa do pipeline lê
o estado real do repositório — RawSpec CLI, ficheiros de task, `git status` — em
vez de depender do histórico da conversa. Um subagente novo pode começar em
qualquer ponto sem perder contexto.

**Routing por critério objetivo.** Um modelo só é escalado quando um critério
verificável é atingido: duas falhas de verificação pelo mesmo motivo, duas
reprovações de review pelo mesmo motivo, ou mais de uma passagem por `VERIFYING`.
Nunca por impressão.

## 2. Princípios

| # | Princípio | Consequência prática |
|---|---|---|
| P1 | O repositório é a fonte de verdade | Nenhum agente confia no resumo que recebe; consulta o ficheiro |
| P2 | O humano decide o conteúdo | `src/content/` é `deny` + `ask` |
| P3 | O push é consequência da qualidade, não um passo separado | Cinco condições cumulativas, avaliadas por código |
| P4 | Nenhum agente conhece o segredo de outro | Cada subagente recebe só o contexto da sua etapa |
| P5 | O custo é uma restrição de desenho | Teto de USD 0,50 por task, sem tier de arbitragem |
| P6 | Configuração é reversível | Zero código novo; remoção de diretórios desfaz tudo |
| P7 | Falha visível > falha silenciosa | Todo agente devolve evidência; ausência de evidência é falha |

## 3. Layout

```text
opencode.json                              # schema, permissões, agentes, comandos
AGENTS.md                                  # regras de execução (integrado)
docs/orquestrador.md                       # routing, gates, economia de tokens
docs/decisions/ADR-007-orquestrador-de-agentes.md
bakeoff/                                   # fundamentação medida do routing
.opencode/
  agents/
    orquestrador.md                        # primary: coordena
    explorador.md                          # subagent: leitura pura
    analista-clareza.md                    # subagent: gate dos 10 critérios
    implementador.md                       # subagent: escreve código
    revisor.md                             # subagent: code review, primeira opinião
    revisor-b.md                           # subagent: code review, segunda opinião
    verificador.md                         # subagent: corre checks
    guardiao.md                            # subagent: RawSpec, histórico, git
  commands/
    orquestrar.md                          # pipeline completo
    clarity.md                             # gate de clareza isolado
```

## 4. Modelo de dados

### 4.1 Tabela de routing de modelos

**Medida, não estimada.** Os modelos foram comparados num bake-off sobre a
TASK-005 real, com cinco defeitos plantados num fixture e scoring por
correspondência semântica. Resultados completos em [`bakeoff/README.md`](../../../bakeoff/README.md).

Custos em USD por milhão de tokens. A coluna "cache read" é o preço do prompt
cacheado, que domina o custo real dos agentes de contexto longo.

| Etapa | Agente | Modelo | Variante | Input | Output | Cache read | Score medido | Custo/revisão |
|---|---|---|---|---|---|---|---|---|
| Orquestração | `orquestrador` | `opencode-go/gpt-6-luna` | high | $0.10 | $0.50 | $0.01 | 83,5 | $0,0018 |
| Exploração | `explorador` | `opencode-go/beam-free` | max | $0 | $0 | $0 | 79,5 | $0,0001 |
| Clareza | `analista-clareza` | `opencode-go/gpt-6-luna` | max | $0.10 | $0.50 | $0.01 | 83,5 | $0,0018 |
| Implementação | `implementador` | `opencode-go/claude-haiku-5-5` | max | $0.10 | $0.50 | $0.01 | 79,5 | $0,0016 |
| Revisão A | `revisor` | `opencode-go/gpt-6-luna` | max | $0.10 | $0.50 | $0.01 | 83,5 | $0,0018 |
| Revisão B | `revisor-b` | `opencode-go/kimi-k2.7-code` | — | $0.95 | $4,00 | $0.19 | 83,5 | $0,0140 |
| Verificação | `verificador` | `opencode-go/claude-haiku-5-5` | high | $0.10 | $0.50 | $0.01 | — | $0,0016 |
| Registo | `guardiao` | `opencode-go/beam-free` | medium | $0 | $0 | $0 | 79,5 | $0,0001 |

**Todas as escolhas são `opencode-go`.** O bake-off revelou que os modelos do
provider `opencode` (Personal) falham com "Insufficient balance" na sua conta, e
que `muse-spark-1.3-contributor` exige consentimento adicional. A tabela usa
exclusivamente modelos que respondem sem configuração adicional.

**Justificações, com base na medição:**

- `gpt-6-luna` para orquestração, clareza e revisão: score mais alto (83,5),
  80% de recall e apenas 1 falso positivo. Num pipeline onde o revisor bloqueia
  a implementação, a precisão é mais valiosa que o recall.
- `claude-haiku-5-5` para implementação e verificação: score 79,5 — dentro de 4
  pontos do melhor — com o menor tempo medido (0,13 min).
- `beam-free` para exploração e registo: score 79,5 por $0,0001. Vinte vezes
  mais barato que o melhor modelo e a menos de 4 pontos de diferença.
- `kimi-k2.7-code` ficou como fallback da revisão: score 83,5 igual ao
  vencedor, a $0,0140.

**Descartados pela medição:** `glm-5.3` e `minimax-m3` têm recall de 100% mas
9 e 12 falsos positivos respectivamente. Num pipeline com retrabalho
automático, cada falso positivo consome um ciclo. `hy4` teve 11 falsos
positivos por $0,1133 — o pior custo-benefício do conjunto.

### 4.1.1 Revisão em par

A revisão é feita por dois agentes, com modelos de famílias diferentes:

| Agente | Modelo | Score | Custo |
|---|---|---|---|
| `revisor` | `opencode-go/gpt-6-luna` | 83,5 | $0,0018 |
| `revisor-b` | `opencode-go/kimi-k2.7-code` | 83,5 | $0,0140 |

**Ressalva medida, registada de propósito.** O bake-off mostrou que os dois
modelos encontraram exactamente o mesmo conjunto de defeitos e produziram o
mesmo falso positivo. Isto indica que **não são independentes**: a revisão em
par não é um proxy de "dois modelos diferentes, duas análises independentes". O ganho real
é mais modesto do que a convergência sugeriria — está em cobrir modos de falha
que um deles não reconhece, não em duplicar a mesma análise.

Esta limitação está documentada em `bakeoff/README.md` e não é escondida. A
revisão em par foi escolhida pelo utilizador apesar dela, e o critério de
aceitação foi ajustado para reflectir o valor real do mecanismo.

**Critério de aceitação da revisão em par:**

| Situação | Resultado |
|---|---|
| Ambos aprovam | A implementação é aceite |
| Um reprova, o outro aprova | A implementação volta para a implementação, e o achado do reprovador é tratado como bloqueante |
| Ambos reprovam | A implementação volta para a implementação com ambos os conjuntos de achados |
| Um reprova e o outro não produz achado | Bloqueante, por ser o caso mais conservador |

**Regra de desempate.** Quando os revisores discordam, o `guardiao` escala a
revisão para `kimi-k2.7-code#max` e o `verificador` confirma se o achado é
reproduzível. Um achado que o `verificador` não consegue reproduzir é
registado como falso positivo conhecido e não bloqueia. Isto dá um terceiro
voto sem introduzir um terceiro agente.

**Custo da revisão em par:** $0,0158 por task, contra $0,0018 da revisão
simples. A diferença é de $0,014 por task, ou $0,17 por mês com 30 execuções.

### 4.2 Faixas de escalonamento

| Faixa | Modelos disponíveis | Quando entra |
|---|---|---|
| T0 — Exploração e registo | `beam-free` | Exploração de ficheiros, leitura de contexto, registo mecânico |
| T1 — Implementação e verificação | `claude-haiku-5-5`, `gpt-6-luna` | Implementação, verificação, revisão |
| T2 — Revisão difícil | `kimi-k2.7-code`, `mimo-v2.6-pro` | Após duas falhas do mesmo critério |
| — | `gpt-5.5`, `gpt-5.5-pro`, `gemini-3.1-pro` | **Excluídos do routing** |

O tier 2 usa `kimi-k2.7-code` ($0,95/$4,00) e `mimo-v2.6-pro` ($0,435/$0,87),
ambos abaixo do limite de USD 5 por milhão de tokens de entrada que a restrição
orçamental impõe.

### 4.3 Regras de escalonamento

| Gatilho | Detecção | Efeito |
|---|---|---|
| Implementação falha duas vezes pelo mesmo motivo | `verificador` regista a falha; contagem por motivo | `implementador` passa de T1 para T2 |
| Revisão reprova duas vezes pelo mesmo motivo | `revisor` regista a reprovação; contagem por motivo | `revisor` passa de T1 para T2 |
| Task passa mais de uma vez por `VERIFYING` | `guardiao` consulta o histórico da task | `verificador` passa de T1 para T2 |

A contagem vive no plano de ação da task, não na memória do agente, para
sobreviver a reinícios de sessão.

## 5. Comportamento

### 5.1 Pipeline `/orquestrar TASK-NNN`

```text
/ orquestrar TASK-005
        │
        ├─[1] explorador ────────► mapa de ficheiros, dependências, estado real
        │
        ├─[2] analista-clareza ───► pontuação /100 + evidências + discrepâncias
        │       │
        │       ├─ score < 90 ────► STOP. Relatório ao utilizador. Nada é escrito.
        │       │
        │       └─ score ≥ 90 ────► continua
        │
        ├─[3] APROVAÇÃO ─────────► resumo + discrepâncias → utilizador
        │       │
        │       └─ discrepância ──► STOP. Pergunta ao utilizador.
        │
        ├─[4] implementador ──────► código, restrito aos ficheiros da task
        │
        ├─[5] verificador ────────► lint, typecheck, test, build, test:e2e
        │       │
        │       └─ falha ─────────► volta a [4], com escalonamento se for a 2ª
        │
        ├─[6] revisor A ──────────► achados por severidade
        ├─[7] revisor B ──────────► achados por severidade (segunda opinião)
        │       │
        │       ├─ desacordo ─────► desempate pelo guardiao + verificador
        │       │
        │       └─ ambos reprovam ─► volta a [4] com ambos os achados
        │
        └─[8] guardiao ───────────► RawSpec CLI, histórico, ADR, commit, push
                │
                └─ push bloqueado ─► commit local; razão registada
```

### 5.2 Condições do push automático

O `guardiao` executa commit e push apenas quando as cinco condições são
verificadas nesta ordem. A primeira que falhar interrompe e regista a razão.

| # | Condição | Como é verificada |
|---|---|---|
| C1 | Task `COMPLETED` e `VERIFIED` | `rawspec-v2-cli.mjs resolve` |
| C2 | Clareza ≥ 90/100 | Plano de ação da task |
| C3 | `lint`, `typecheck`, `test`, `build` passam | Saída dos comandos |
| C4 | Hooks do Husky passam sem `--no-verify` | Saída do `git commit` |
| C5 | O diff toca apenas caminhos do âmbito da task | `git diff --name-only` contra a lista de `## Arquivos` |

### 5.3 Permissões por agente

Regras globais em `opencode.json`:

```jsonc
{
  "permissions": [
    { "action": "shell", "resource": "git push *", "effect": "ask" },
    { "action": "shell", "resource": "rm -rf *", "effect": "deny" },
    { "action": "shell", "resource": "git reset --hard *", "effect": "deny" },
    { "action": "shell", "resource": "git checkout -- *", "effect": "deny" },
    { "action": "shell", "resource": "git clean *", "effect": "deny" },
    { "action": "edit", "resource": "src/content/**", "effect": "deny" },
    { "action": "read", "resource": "*.env", "effect": "ask" }
  ]
}
```

As regras de agente são anexadas depois das globais, e a última correspondência
vence. A negation por agente é mais estreita que a global, o que a torna mais
específica e por isso prevalecente.

| Agente | Regra específica | Efeito |
|---|---|---|
| `explorador` | `edit: *` → deny | Não escreve nada |
| `analista-clareza` | `edit: *` → deny | Não escreve nada |
| `revisor` | `edit: *` → deny | Não escreve nada |
| `revisor-b` | `edit: *` → deny | Não escreve nada |
| `verificador` | `edit: *` → deny; `shell: pnpm *` → allow | Só corre os checks |
| `implementador` | `edit: src/**` → allow; `edit: src/content/**` → ask | Escreve código, conteúdo exige o utilizador |
| `guardiao` | `shell: git add *` → allow; `shell: git commit *` → allow; `shell: git push *` → allow | Git é a sua função |
| `guardiao` | `shell: node scripts/rawspec-v2-cli.mjs *` → allow | Escrita de especificação só pela CLI |
| `orquestrador` | `shell: *` → ask | Coordena, não executa comandos livremente |

`git push` global fica em `ask`, e o `guardiao` acrescenta `allow`, que prevalece
por ser mais específico e posterior. O efeito líquido é: só o `guardiao` faz
push, e apenas quando as cinco condições da §5.2 se cumprem.

### 5.3.1 Limitação medida: as permissões de caminho não são uma barreira

**Esta secção documenta uma limitação verificada empiricamente, não uma
especulação.**

Uma regra `edit` com `deny` **não impede a escrita no ficheiro**. O agente
pode escrever o mesmo conteúdo por outra via. Verificado em 2026-11-16 com
`beam-free` sobre `src/content/profile.ts`:

| Via tentada | Resultado |
|---|---|
| Ferramenta `write` | Bloqueada: "Permission denied: edit" |
| `Set-Content` | Bloqueada: "Permission denied: shell" |
| `echo ZZZ > ficheiro` | Bloqueada: "Permission denied: shell" |
| `node -e "fs.writeFileSync(...)"` | Bloqueada: "Permission denied: shell" |
| `[System.IO.File]::WriteAllText('...')` | **Executada com sucesso** |

As regras de shell também são contornáveis: uma regra `deny` com o padrão
`*src/content*` bloqueou onze tentativas e falhou na décima segunda, que usou
uma forma alternativa do mesmo caminho.

**Consequência para o desenho.** As permissões de caminho são uma barreira de
esforço, não uma garantia de integridade. A garantia real passa a ser o gate
de âmbito, aplicado depois da acção e antes do commit.

**Gate de âmbito pós-escrita.** Antes de qualquer `git add`, o `guardiao`
compara o conjunto de ficheiros tocados com a lista de `## Arquivos` da task:

```bash
git status --porcelain
```

O comando lista todos os ficheiros alterados, independentemente de como
foram escritos. Um ficheiro fora do âmbito bloqueia o commit e o push, e o
`guardiao` reverte a escrita fora do âmbito.

Este gate é o que substitui a garantia que as permissões não podem dar. A
sequência é: as permissões reduzem a probabilidade; o gate de âmbito garante
o resultado.

### 5.3.2 Consequência para a regra de `specs/**`

Uma regra `edit` com `deny` sobre `specs/**` foi inicialmente prevista para
garantir que só a CLI RawSpec escreve especificações. A verificação mostrou que
essa regra é contraproducente:

- não impede a escrita por shell, que é o seu objectivo;
- impede a manutenção legítima das especificações pela CLI e pelos agentes que
  a executam;
- a garantia pretendida é assegurada pelo gate de âmbito, que é verificável.

A regra foi removida. A escrita de especificações é controlada pela permissão
de shell do `guardiao`, que permite apenas `node scripts/rawspec-v2-cli.mjs *`,
combinada com o gate de âmbito.

### 5.4 Etapas isoladas

`/clarity TASK-NNN` executa apenas o gate da etapa 2, sem tocar em ficheiros.
Serve para medir a clareza de uma task antes de a implementar, e para reavaliar
após a reescrita de uma task ambígua.

## 6. Contratos e erros

### 6.1 Contrato de entrada dos subagentes

Cada subagente recebe três blocos: **tarefa** (o ficheiro RawSpec e o seu
caminho), **contexto** (apenas o que a etapa necesita) e **saída esperada** (o
formato a devolver). Não recebe a conversa anterior.

### 6.2 Formato de saída

```text
ESTADO: OK | FALHA | BLOQUEADO
MOTIVO: <uma linha>
EVIDENCIA: <comandos executados e o seu resultado>
ARQUIVOS: <caminhos tocados>
```

`ESTADO: BLOQUEADO` significa que a etapa encontrou algo que exige decisão
humana. O pipeline para aí e apresenta a questão.

### 6.3 Códigos de erro do orquestrador

| Código | Significado | Ação |
|---|---|---|
| `E_CLARITY_BELOW_THRESHOLD` | Score abaixo de 90/100 | Parar; pedir reescrita da task |
| `E_DISCREPANCY_FOUND` | Task divergente do repositório | Parar; perguntar ao utilizador |
| `E_CHECKS_FAILED` | Verificações falharam | Voltar à implementação, com escalonamento se for a segunda |
| `E_SCOPE_VIOLATION` | Diff fora do âmbito da task | Reverter a escrita fora do âmbito |
| `E_REVIEW_REJECTED` | Revisão reprovou | Voltar à implementação |
| `E_PUSH_BLOCKED` | Uma das cinco condições falhou | Commit local; registar a razão |
| `E_CONTENT_WRITE_BLOCKED` | Escrita em `src/content/` | Devolver ao utilizador |

## 7. Testes

| # | Teste | Tipo |
|---|---|---|
| T1 | `opencode.json` valida contra `https://opencode.ai/config.json` | Configuração |
| T2 | Os sete agentes são descobertos e cada um declara `mode`, `model` e permissões | Configuração |
| T3 | `explorador`, `analista-clareza`, `revisor` e `verificador` não conseguem escrever | Comportamento |
| T4 | `implementador` consegue escrever em `src/**` mas precisa de autorização em `src/content/**` | Comportamento |
| T5 | `orquestrador` para quando o score de clareza é inferior a 90 | Comportamento |
| T6 | O `guardiao` não faz push quando uma das cinco condições falha | Comportamento |
| T7 | O `guardiao` não faz push quando o diff toca ficheiros fora do âmbito | Comportamento |
| T8 | `docs/orquestrador.md` tem uma entrada por agente, com custos | Documentação |
| T9 | `docs/history.md` sem duplicados e sem codificação corrompida | Documentação |
| T10 | `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm test:e2e` | Repositório |

T1 e T2 verificam configuração e são automatizáveis. T3 a T7 são de
comportamento e dependem de execução real de agentes, pelo que a verificação é
manual e registada em evidência da task.

## 8. Economia de tokens

### 8.1 Custos medidos

Os custos por etapa vêm do bake-off, não de estimativas. O valor de cada etapa
no bake-off é o de uma revisão isolada; no pipeline real, cada agente executa
uma acção mais delimitada e consome tokens de contexto acrescido.

| Etapa | Modelo | Custo medido | Tokens in | Tokens out | Cache read |
|---|---|---|---|---|---|
| Exploração | `beam-free` | $0,0001 | 17.950 | 539 | 113.920 |
| Clareza | `gpt-6-luna` | $0,0018 | 618 | 219 | 12.819 |
| Implementação | `claude-haiku-5-5` | $0,0016 | 615 | 363 | 15.953 |
| Verificação | `claude-haiku-5-5` | $0,0016 | 615 | 363 | 15.953 |
| Revisão A | `gpt-6-luna` | $0,0018 | 618 | 219 | 12.819 |
| Revisão B | `kimi-k2.7-code` | $0,0140 | 4.970 | 205 | 11.520 |
| Registo | `beam-free` | $0,0001 | 17.950 | 539 | 113.920 |
| Orquestração | `gpt-6-luna` | $0,0018 | 618 | 219 | 12.819 |

### 8.2 Custo por task

| Cenário | Custo/task | 12 tasks MVP | 30 execuções/mês |
|---|---|---|---|
| Pipeline completo, com revisão em par | **$0,0248** | **$0,30** | **$0,74** |
| Com escalonamento do revisor | $0,0388 | $0,47 | $1,16 |
| Com escalonamento duplo | $0,0528 | $0,63 | $1,58 |
| Referência: revisão simples | $0,0108 | $0,13 | $0,32 |

O pipeline de oito etapas custa **$0,0248 por task**. O limite de USD 0,50
por task fixado no requisito N1 tem uma margem de 20×.

A revisão em par acrescenta $0,0140 por task face à revisão simples — cerca de
$0,17 por mês com 30 execuções, e $0,17 no total para as 12 tasks restantes do
MVP.

### 8.3 Porque é tão mais barato que a estimativa anterior

A primeira estimativa, baseada em 30K tokens de input e 8K de output por etapa,
custava $0,061 por task. A medição deu $0,0108 — **5,7× mais barato**.

A razão está no tamanho do contexto. As etapas reais do pipeline recebem
contexto mínimo: a tarefa, o ficheiro, o resultado da etapa anterior. O
bake-off mediu 615 tokens de input para a revisão, contra os 30K estimados.

O histórico de sessões do projecto confirma o mecanismo: as sessões manuais
gastaram em média 279K tokens de input e 17,9M de cache read por task, porque
reliam o repositório inteiro a cada passo. O orquestrador elimina esse
retrabalho.

### 8.4 Efeito do cache

Os modelos do provider `opencode-go` que aceitam `cache.write` — `claude-haiku-5-5`
a $0,125 e `gpt-6-luna` a $0,125 — são os que mais beneficiarem de
`settings.cache.ttl: "1h"`. Os modelos `beam-free` não cobram cache, pelo que
o seu custo é insensitive ao tamanho do contexto.

### 8.5 Comparação com alternativas

| Configuração | Custo/task | Relação |
|---|---|---|
| Orquestrador proposto | $0,0108 | referência |
| Só `beam-free` | ~$0,001 | qualidade insuficiente: sem verificação TypeScript real |
| Sessões manuais actuais | $0,65 | 60× mais caro |
| Só `gpt-5.5` em todas as etapas | $1,68 | 155× mais caro |
| Só `gpt-5.5-pro` em todas as etapas | $10,08 | 933× mais caro |

## 9. Critérios de aceite

- `opencode.json` existe, valida contra o schema, e define permissões globais,
  sete agentes e dois comandos.
- Os sete agentes existem em `.opencode/agents/`, cada um com `mode`, `model` e
  permissões coerentes com a §5.3.
- `/orquestrar` e `/clarity` existem em `.opencode/commands/`.
- A tabela de routing da §4.1 está reproduzida em `docs/orquestrador.md`, com
  custos, critérios de escalonamento e a economia de tokens da §8.
- O ADR-007 existe, está referenciado em `docs/history.md` e no `README.md`.
- `docs/history.md` está sem duplicados e sem codificação corrompida.
- `AGENTS.md` está integrado na branch principal.
- Os worktrees órfãos foram removidos.
- `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` e `pnpm test:e2e` passam.
