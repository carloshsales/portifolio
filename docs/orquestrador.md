# Orquestrador de agentes

Referência do orquestrador de agentes do projecto: routing de modelos, agentes,
gates, permissões e economia de tokens.

O orquestrador é **configuração nativa do OpenCode** — agentes, comandos e
permissões. Não há código próprio, plugins nem serviços adicionais. A reversão
é a remoção de três directórios.

## 1. Onde está o quê

```text
opencode.json                              # permissões globais, cache, experimental
.opencode/agents/                          # nove agentes
.opencode/commands/                        # /orquestrar e /clarity
bakeoff/                                   # fundamentação medida do routing
docs/decisions/ADR-007-orquestrador-de-agentes.md
```

## 2. Tabela de routing

Os modelos foram comparados num bake-off sobre a TASK-005 real, com cinco
defeitos plantados num fixture e pontuação por correspondência semântica.
Resultados completos em [`bakeoff/README.md`](../bakeoff/README.md).

| Etapa | Agente | Modelo | Variante | Input | Output | Cache read | Score |
|---|---|---|---|---|---|---|---|
| Orquestração | `orquestrador` | `opencode-go/minimax-m3` | — | $0.30 | $1.20 | $0.06 | 76,5 |
| Exploração | `explorador` | `opencode-go/beam-free` | max | $0 | $0 | $0 | 79,5 |
| Clareza | `analista-clareza` | `opencode-go/minimax-m3` | — | $0.30 | $1.20 | $0.06 | 76,5 |
| Implementação | `implementador` | `opencode-go/claude-haiku-5-5` | max | $0.10 | $0.50 | $0.01 | 79,5 |
| Verificação (execução) | `executor` | `opencode-go/claude-haiku-5-5` | high | $0.10 | $0.50 | $0.01 | — |
| Verificação (avaliação) | `verificador` | `opencode-go/claude-haiku-5-5` | high | $0.10 | $0.50 | $0.01 | — |
| Revisão A | `revisor` | `opencode-go/minimax-m3` | — | $0.30 | $1.20 | $0.06 | 76,5 |
| Revisão B | `revisor-b` | `opencode-go/kimi-k2.7-code` | — | $0.95 | $4.00 | $0.19 | 83,5 |
| Registo | `guardiao` | `opencode-go/beam-free` | medium | $0 | $0 | $0 | 79,5 |

Custos em USD por milhão de tokens. A coluna "cache read" é o preço do prompt
cacheado, que domina o custo real dos agentes de contexto longo.

**As variantes só existem para alguns modelos.** Um `#variante` inválida faz o
agente falhar a carregar com `Variant unavailable for <modelo>: <variante>`. A
variante `#high` só é válida em modelos cujo `reasoning_options` declara
`effort` — o `gpt-6-luna`, o `beam-free` e o `claude-haiku-5-5`. O
`minimax-m3` e o `kimi-k2.7-code` só declaram `toggle`, pelo que não têm
variantes de effort e são usados sem sufixo. A verificação
`bakeoff/validate.mjs` resolve cada modelo e variante declarados contra o
catálogo e falha se algum não resolver.

**Todos os modelos são do provider `opencode-go`.** O provider `opencode`
(Personal) responde "Insufficient balance" nesta conta. `muse-spark-1.3-contributor`
exige consentimento adicional e os modelos `deepseek` exigem região "Global".
Nenhum é usado.

### 2.1 Cache TTL por modelo

O TTL do cache de prompts não é uniforme: o upstream aceita valores diferentes
conforme o modelo, e um valor único ao nível do provider não serve todos.

| Modelo | TTL aceito | Erro com outro valor |
|---|---|---|
| `beam-free` | exactamente `30m` | `Invalid value for 'prompt_cache_options.ttl': value is not one of the allowed values ["30m"]` |
| `claude-haiku-5-5` | `5m` ou `1h` | `tools.N.custom.cache_control.ephemeral.ttl: Input should be '5m' or '1h'` |
| `minimax-m3`, `kimi-k2.7-code` | `30m` | — |

Por isso a configuração declara `30m` ao nível do provider, e um override de
`5m` para o `claude-haiku-5-5` ao nível do modelo:

```jsonc
{
  "providers": {
    "opencode-go": {
      "settings": { "cache": { "ttl": "30m" } },
      "models": {
        "claude-haiku-5-5": { "settings": { "cache": { "ttl": "5m" } } }
      }
    }
  }
}
```

Sem o override, os agentes `implementador`, `executor` e `verificador` — os
três que usam `claude-haiku-5-5` — falham em cada pedido, com o erro do
upstream. A verificação `bakeoff/validate.mjs` confere os dois níveis.

**As variantes de effort são `max` ou `high`.** A prioridade é qualidade, não
latência.

### 2.2 Faixas de escalonamento

| Faixa | Modelos | Quando entra |
|---|---|---|
| T0 — Exploração e registo | `beam-free` | Exploração de ficheiros, registo mecânico |
| T1 — Implementação e verificação | `claude-haiku-5-5`, `minimax-m3` | Implementação, verificação, revisão |
| T2 — Revisão difícil | `kimi-k2.7-code`, `mimo-v2.6-pro` | Após duas falhas do mesmo critério |

`gpt-5.5`, `gpt-5.5-pro` e `gemini-3.1-pro` estão **excluídos** do routing.
`gpt-6-luna` deixou o routing em 2026-11-24, substituído por `minimax-m3`
(ADR-009).

### 2.3 Regras de escalonamento

| Gatilho | Efeito |
|---|---|
| Implementação falha duas vezes pelo mesmo motivo | `implementador` sobe de T1 para T2 |
| Revisão reprova duas vezes pelo mesmo motivo | `revisor` sobe de T1 para T2 |
| Task passa mais de uma vez por `VERIFYING` | `verificador` sobe de T1 para T2 |

A contagem vive no plano de acção da task, não na memória do agente.

## 3. Os nove agentes

| Agente | Modo | Papel | Formato de saída |
|---|---|---|---|
| `orquestrador` | primary | Coordena o pipeline e apresenta o progresso e a próxima task | `TAREFA / ESTADO / MOTIVO / COMANDOS / BRANCH / PUSH / PROXIMA / PEDIDO` |
| `explorador` | subagent | Mapeia o repositório | `ESTADO / MOTIVO / FICHEIROS / DEPENDENCIAS / DIVERGENCIAS` |
| `analista-clareza` | subagent | Aplica a regra dos 90% | `ESTADO / PONTUACAO / CRITERIOS / BLOQUEIOS` |
| `implementador` | subagent | Escreve o código | `ESTADO / MOTIVO / ARQUIVOS / VERIFICACOES` |
| `executor` | subagent | Corre `pnpm test` e `pnpm test:e2e` e recolhe a evidência | `ESTADO / MOTIVO / VERIFICACOES / EVIDENCIA` |
| `verificador` | subagent | Avalia a evidência do executor, sem shell | `ESTADO / MOTIVO / VERIFICACOES / ERRO / EVIDENCIA / PEDIDO` |
| `revisor` | subagent | Revisão, correcção funcional | `ESTADO / MOTIVO / ACHADOS` |
| `revisor-b` | subagent | Revisão, qualidade de engenharia | `ESTADO / MOTIVO / ACHADOS` |
| `guardiao` | subagent | RawSpec, histórico, commit e push via `commit-task`, e próxima task | `ESTADO / MOTIVO / TASK / CONDICOES / BRANCH / COMMIT / PUSH / PR / PROXIMA / EVIDENCIA` |

`executor` e `verificador` são agentes separados de propósito: um executa, o
outro avalia. O `verificador` continua a não ter shell, o que preserva a
independência do gate (ADR-010).

`revisor` e `revisor-b` têm focos distintos para reduzir a correlação entre
os achados. O `revisor` procura **correcção funcional**; o `revisor-b` procura
**acessibilidade, tipagem, performance e segurança**.

## 4. Permissões

### 4.1 Permissões globais

```jsonc
{
  "permissions": [
    { "action": "shell", "resource": "git push *", "effect": "ask" },
    { "action": "shell", "resource": "rm -rf *", "effect": "deny" },
    { "action": "shell", "resource": "rm -fr *", "effect": "deny" },
    { "action": "shell", "resource": "git reset --hard *", "effect": "deny" },
    { "action": "shell", "resource": "git checkout -- *", "effect": "deny" },
    { "action": "shell", "resource": "git restore *", "effect": "deny" },
    { "action": "shell", "resource": "git clean *", "effect": "deny" },
    { "action": "shell", "resource": "git branch -D *", "effect": "ask" },
    { "action": "edit", "resource": "src/content/**", "effect": "deny" },
    { "action": "read", "resource": "*.env", "effect": "ask" },
    { "action": "read", "resource": "*.env.*", "effect": "ask" }
  ]
}
```

### 4.2 Permissões por agente

| Agente | Regras | Efeito |
|---|---|---|
| `explorador` | `edit: *` deny; `shell: *` deny; `subagent: *` deny | Não escreve nem delega escrita |
| `analista-clareza` | `edit: *` deny; `shell: *` deny; `subagent: *` deny | Não escreve nem delega escrita |
| `revisor` | `edit: *` deny; `shell: *` deny; `subagent: *` deny | Não escreve nem delega escrita |
| `revisor-b` | `edit: *` deny; `shell: *` deny; `subagent: *` deny | Não escreve nem delega escrita |
| `verificador` | `edit: *` deny; `shell: *` deny; `subagent: *` deny | Não executa shell; avalia a evidência do executor |
| `executor` | `shell: *` deny primeiro; `shell: pnpm test *`, `pnpm test:e2e *`, `pnpm lint *`, `pnpm typecheck *`, `pnpm format:check *`, `pnpm build *` allow; `edit: *` deny | Corre os comandos de leitura; não escreve |
| `implementador` | `edit: src/**` allow; `edit: src/content/**` ask; `shell: pnpm *` allow; `shell: *` deny | Escreve código, conteúdo exige o utilizador |
| `guardiao` | `shell: *` deny primeiro; `shell: git status *`, `git diff *`, `git add *`, `git commit *`, `git push *`, `node scripts/rawspec-v2-cli.mjs *` allow | Git e RawSpec são a sua função; o commit e o push passam pelo `commit-task` |
| `orquestrador` | `shell: *` ask | Coordena, não executa comandos livremente |

Dentro de cada agente a regra geral precede a específica, porque a última
correspondência prevalece. Por isso `shell: pnpm *` em `allow` vem **antes** de
`shell: *` em `deny`.

**A ordem é load-bearing.** A regra `shell: *` em `deny` tem de vir **primeiro**
e as allow específicas **depois**, porque a última regra que corresponde
prevalece. Com a ordem inversa, o `deny` genérico captura todos os comandos e
o agente fica sem poder executar nada. Esta não é uma hipótese: foi o erro
inicial da configuração do `executor`, detectado porque os comandos eram negados
com `No tool named "shell" is currently available`.

O `executor` é o único agente com shell que não escreve código. A negação de
`edit` está presente; a de `subagent` não, porque a medição mostrou que
negar `edit` **e** `subagent` em conjunto remove a ferramenta de shell por
completo. A contenção da escrita é o gate de âmbito do `commit-task`, não a
permissão.

### 4.3 Duas limitações medidas

As permissões de caminho do OpenCode **não são uma barreira de integridade**.
Ambas as limitações foram verificadas empiricamente, não assumidas.

**A escrita por shell contorna a negativa de caminho.** Um `deny` em
`edit: src/content/**` bloqueia a ferramenta de escrita, mas o mesmo conteúdo
pode ser escrito por shell. Verificadas cinco vias; a quinta executou com
sucesso.

**A delegação a subagentes contorna as negativas de `edit` e `shell`.** Um
agente com ambas em `deny` pode escrever ficheiros, porque delega a escrita a
outro agente que tem permissão. Verificado com `revisor`, que invocou o agente
`implementador` para criar um ficheiro.

**Consequência.** A negação de `subagent` nos cinco agentes de leitura é
essencial: sem ela, `edit` e `shell` em `deny` são decorativos.

### 4.4 Duas limitações medidas do `executor`

O `executor` é o primeiro agente com shell que não escreve código, e a sua
configuração foi medida por matriz, não assumida.

**Negar `edit` e `subagent` em conjunto remove a ferramenta de shell.** O
agente fica com `No tool named "shell" is currently available` — não executa
nada, apesar de ter `allow` para os comandos. A matriz medida:

| Permissões do `executor` | `pnpm lint` executa |
|---|---|
| só `shell` | sim |
| `shell` + `edit: deny` | sim |
| `shell` + `subagent: deny` | sim |
| `shell` + `edit: deny` + `subagent: deny` | **não** |

O `executor` tem por isso `edit: deny` e **não** tem `subagent: deny`. A
escrita não é impedida pela permissão, mas sim pelo gate de âmbito do
`commit-task`, que é a garantia que a §4.3 já identificava como real.

**A ordem das regras shell é load-bearing.** A regra `shell: *` em `deny` tem
de vir antes das allow específicas, porque a última regra que corresponde
prevalece. Invertidas, o `deny` genérico captura tudo. Foi o erro inicial da
configuração do `executor`, e a verificação de comandos do
`bakeoff/check-permissions.mjs` foi reforçada para o apanhar: passa a exigir
evidência de execução, e não apenas a ausência de um erro.

**A garantia real de âmbito é o gate pós-escrita**, não as permissões. O
`commit-task` aplica-o antes de qualquer `git add`. Compara os ficheiros alterados,
obtidos com `git status --porcelain --untracked-files=all`, com a secção
`## Arquivos` da task e com os ficheiros de especificação que a CLI actualiza. A
lista inclui todos os ficheiros alterados, independentemente de como foram
escritos. Um ficheiro fora do âmbito bloqueia o commit e o push com
`E_SCOPE_VIOLATION`.

## 5. Pipeline

```text
/orquestrar TASK-NNN
        │
        ├─[1] explorador ─────────► mapa de ficheiros e divergências
        ├─[2] analista-clareza ───► pontuação /100
        │       └─ score < 90 ────► STOP
        ├─[3] APROVAÇÃO ──────────► resumo + discrepâncias → utilizador
        │       └─ discrepância ──► STOP
        ├─[4] implementador ──────► código
        ├─[5] verificação
        │       ├─ guardiao: begin-verify (task em VERIFYING)
        │       ├─ executor: pnpm test e, depois, pnpm test:e2e
        │       ├─ verificador avalia a evidência, sem shell
        │       ├─ evidência em falta ou ambígua ─► o executor repete, não avança
        │       └─ falha ─────────────────────────► guardiao: fail, volta a [4]
        ├─[6] revisor A ──────────► achados
        ├─[7] revisor B ──────────► achados
        │       └─ desacordo ─────► desempate pelo guardiao
        └─[8] guardiao ───────────► verify, histórico, ADR e commit-task
                ├─ lint, typecheck, test, build, por esta ordem
                ├─ gate de âmbito e hooks do Husky
                ├─ push bloqueado ─► commit local; razão registada
                └─ próxima task ───► next --change, depois next
```

### 5.1 Regras da revisão em par

| Situação | Resultado |
|---|---|
| Ambos aprovam | A implementação é aceite |
| Um reprova, o outro aprova | Volta à implementação; o achado do reprovador é bloqueante |
| Ambos reprovam | Volta à implementação com ambos os conjuntos de achados |
| Um reprova e o outro não produz achado | Bloqueante, por ser o caso mais conservador |

**Ressalva medida.** O bake-off mostrou que `gpt-6-luna` e `kimi-k2.7-code`
encontraram exactamente o mesmo conjunto de defeitos e produziram o mesmo falso
positivo. **Não são independentes.** O ganho da revisão em par está em cobrir
modos de falha que um deles não reconhece, não em duplicar a mesma análise.

**Ressalva medida com o routing actual.** O revisor A passou de `gpt-6-luna`
para `minimax-m3` (ADR-009). Os dois revisores passaram a ter **perfis de erro
distintos**, o que reforça a independência da revisão em par, mas com uma
ressalva: o `minimax-m3` tem recall de 100% e **12 falsos positivos**, contra 1
do `gpt-6-luna` e do `kimi-k2.7-code`. Encontra mais defeitos e inventa muito
mais. Num pipeline onde a reprovação bloqueia a implementação, cada falso
positivo consome um ciclo de retrabalho. A revisão em par é o que absorve este
custo: o `revisor-b` reprova um achado falso, o `guardiao` desempata e o
utilizador confirma a reprodução.

**Desempate.** Quando discordam, o `guardiao` escala a revisão para
`kimi-k2.7-code` e pede ao utilizador a reprodução do achado. O `verificador`
avalia a evidência enviada. Um achado que não se reproduz é registado como falso
positivo conhecido e não bloqueia.

**Reprovação.** Qualquer reprovação devolve a tarefa a `IN PROGRESS`: o `guardiao`
regista `fail` com o achado como motivo, e a implementação recomeça. Depois de nova
implementação, o `executor` volta a correr `pnpm test` e `pnpm test:e2e`.

### 5.2 Condições do commit e do push

O `guardiao` só faz commit e push, através do `commit-task`, quando as cinco
condições se cumprem. A primeira que falhar interrompe.

| # | Condição | Verificação |
|---|---|---|
| C1 | Task `COMPLETED` e `VERIFIED`, com a evidência de `pnpm test` e `pnpm test:e2e` aceite pelo verificador | `rawspec-v2-cli.mjs resolve` e parecer do verificador |
| C2 | Clareza ≥ 90/100 | Plano de acção da task |
| C3 | `lint`, `typecheck`, `test` e `build` passam, por esta ordem | Saída do `commit-task` |
| C4 | Hooks do Husky passam sem `--no-verify` | Saída do `commit-task` (`git commit` e `git push`) |
| C5 | O diff toca apenas caminhos do âmbito | Gate de âmbito do `commit-task` (`E_SCOPE_VIOLATION`) |

O `commit-task` executa C3 e C5 antes de qualquer `git add`. Os hooks podem repetir
parte das verificações de C3; essa repetição é aceite e não substitui C3. Se o push
falhar depois do commit, o commit fica local e a razão é registada.

### 5.3 A próxima task

Quando uma task termina, o `guardiao` identifica a próxima a realizar, para
que o utilizador saiba o que se segue sem precisar de perguntar.

A procura segue esta ordem:

1. `node scripts/rawspec-v2-cli.mjs next --change NNN-slug` — a change da task
   que acabou de terminar, porque é onde o trabalho continua.
2. Se essa change já não tiver tasks pendentes, `node scripts/rawspec-v2-cli.mjs next`
   — percorre todas as changes aprovadas.

A ordem dentro de uma change segue o grafo de dependências: a task que
desbloqueia mais trabalho vem primeiro por construção.

| Resultado | Significado | O que reportar |
|---|---|---|
| Task devolvida | Há trabalho elegível | `PROXIMA: TASK-007 — Implementar seção de habilidades` |
| `E_NOTHING_TO_START` | Não há mais tasks pendentes | `PROXIMA: nenhuma — a change NNN-slug está completa` |
| `E_CHANGE_NOT_APPROVED` | Só há tasks em changes não aprovadas | Falta aprovar uma change |
| `E_CHANGE_AMBIGUOUS` | Várias changes aprovadas com tasks pendentes | Lista as mudanças e pergunta |

O `PROXIMA:` é **informação**, não uma ordem de execução. Nenhum agente
implementa a task seguinte nem altera o seu estado. Quando não há próxima task,
o `guardiao` não inventa trabalho: a decisão de criar ou aprovar uma change
nova é do utilizador.

## 6. Economia de tokens

Custos medidos no bake-off, não estimados.

| Cenário | Custo/task | 12 tasks MVP | 30 execuções/mês |
|---|---|---|---|
| Pipeline completo, com revisão em par | **$0,0593** | **$0,71** | **$1,78** |
| Com escalonamento do revisor | $0,0739 | $0,89 | $2,22 |
| Com escalonamento duplo | $0,0777 | $0,93 | $2,33 |
| Referência: revisão simples | $0,0453 | $0,54 | $1,36 |
| Sessões manuais actuais | $0,65 | $7,80 | $19,50 |

O pipeline de oito etapas custa **5,9 cêntimos por task**, contra os 65
cêntimos das sessões manuais. O limite de USD 0,50 por task tem uma margem
de 8,4×.

O custo subiu 2,5× com a troca de `gpt-6-luna` por `minimax-m3` (ADR-009): o
`minimax-m3` custa $0,0134 por revisão, contra $0,0018 do `gpt-6-luna`, e
ocupa três das oito etapas. A margem de segurança do limite de USD 0,50
continua confortável.

A verificação passou a ter duas etapas, `executor` e `verificador` (ADR-010).
Como as duas usam `claude-haiku-5-5`, o custo por task subiu de $0,0576 para
$0,0593.

Os valores são a soma exacta das medições do bake-off, recalculada por
`node bakeoff/calc-cost.mjs`.

A razão do custo baixo é o contexto mínimo por etapa. As etapas do pipeline
recebem a task, o ficheiro e o resultado da etapa anterior. As sessões manuais
gastavam em média 279K tokens de input e 17,9M de cache read por task, porque
reliam o repositório inteiro a cada passo.

## 7. Verificação

**Fluxo padrão.** O agente `executor` executa estes comandos, por esta ordem:

```bash
pnpm test
pnpm test:e2e
```

O `executor` devolve a evidência de cada comando: o comando exacto, o código
de saída e a saída relevante. O `verificador` avalia essa evidência, sem
executar shell. Se um comando falhar, a saída relevante é apresentada e o
pipeline para. Se a evidência estiver em falta ou for ambígua, o `executor`
repete o que falta.

O `pnpm test:e2e` executa `pnpm build` antes do Playwright, porque o `vite preview`
serve `dist/`, que é ignorado pelo Git e não existe num clone novo.

**Verificações automáticas.** O `commit-task` corre `pnpm lint`, `pnpm typecheck`,
`pnpm test` e `pnpm build`, por esta ordem. Os hooks do Husky permanecem activos e
podem repetir parte delas.

**Papel do utilizador.** O utilizador não executa comandos de verificação. Intervém
nas decisões de âmbito, nas discrepâncias entre a task e o repositório e nos
desempates de revisão.

**Scripts `bakeoff/`.** Os sete scripts abaixo não fazem parte do fluxo padrão.
Servem para reexecutar a medição do routing e validar a configuração do orquestrador
quando esta muda. Verificam o comportamento real, não a narração do agente.

```bash
node bakeoff/validate.mjs                     # 20 verificações de configuração, agentes, comandos e documentação
node bakeoff/check-agents.mjs                 # os 9 agentes são descobertos
node bakeoff/check-permissions.mjs             # quem escreve, quem não escreve e quem executa
node bakeoff/check-content-gate.mjs            # o conteúdo real exige autorização
node bakeoff/check-scope-gate.mjs              # o gate de âmbito bloqueia escritas fora do âmbito
node bakeoff/score.mjs bakeoff/results.json    # o ranking medido
node bakeoff/calc-cost.mjs                    # o custo por task, recalculado
```

`validate.mjs` é a verificação de regressão do projecto. Confere a
configuração contra o schema publicado, o frontmatter dos nove agentes, os
modelos, a ordem das regras shell do `executor`, as três negações dos agentes
de leitura, as referências dos comandos, a integridade do histórico, a coerência
dos custos documentados com a medição e o grafo de dependências da change.

`check-permissions.mjs` verifica o comportamento real: quem escreve ficheiros,
quem não escreve e que comandos o `executor` consegue executar. Exige evidência
de execução, e não apenas a ausência de um erro — um comando recusado produz
`No tool named "shell" is currently available`, que um teste apoiado apenas no
código de saída do processo não apanharia.

## 8. Ficheiros relacionados

- `docs/projeto.md` — visão, âmbito e princípios de trabalho.
- `docs/rawspec-v2.md` — formato das especificações, comandos e fluxo de commit e push (§15).
- `docs/history.md` — histórico append-only.
- `docs/decisions/ADR-007-orquestrador-de-agentes.md` — a decisão.
- `docs/decisions/ADR-009-routing-minimax-m3.md` — a troca de `gpt-6-luna` por `minimax-m3`.
- `docs/decisions/ADR-010-verificacao-executada-por-agente.md` — a verificação executada pelo `executor`.
- `docs/decisions/ADR-011-proxima-task-ao-terminar.md` — a indicação da próxima task ao terminar cada tarefa.
- `AGENTS.md` — regras de execução a que os agentes estão sujeitos.
- `bakeoff/README.md` — a fundamentação medida do routing.
