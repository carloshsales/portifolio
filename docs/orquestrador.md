# Orquestrador de agentes

Referência do orquestrador de agentes do projecto: routing de modelos, agentes,
gates, permissões e economia de tokens.

O orquestrador é **configuração nativa do OpenCode** — agentes, comandos e
permissões. Não há código próprio, plugins nem serviços adicionais. A reversão
é a remoção de três directórios.

## 1. Onde está o quê

```text
opencode.json                              # permissões globais, cache, experimental
.opencode/agents/                          # oito agentes
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
| Orquestração | `orquestrador` | `opencode-go/gpt-6-luna` | high | $0.10 | $0.50 | $0.01 | 83,5 |
| Exploração | `explorador` | `opencode-go/beam-free` | max | $0 | $0 | $0 | 79,5 |
| Clareza | `analista-clareza` | `opencode-go/gpt-6-luna` | max | $0.10 | $0.50 | $0.01 | 83,5 |
| Implementação | `implementador` | `opencode-go/claude-haiku-5-5` | max | $0.10 | $0.50 | $0.01 | 79,5 |
| Verificação | `verificador` | `opencode-go/claude-haiku-5-5` | high | $0.10 | $0.50 | $0.01 | — |
| Revisão A | `revisor` | `opencode-go/gpt-6-luna` | max | $0.10 | $0.50 | $0.01 | 83,5 |
| Revisão B | `revisor-b` | `opencode-go/kimi-k2.7-code` | — | $0.95 | $4.00 | $0.19 | 83,5 |
| Registo | `guardiao` | `opencode-go/beam-free` | medium | $0 | $0 | $0 | 79,5 |

Custos em USD por milhão de tokens. A coluna "cache read" é o preço do prompt
cacheado, que domina o custo real dos agentes de contexto longo.

**Todos os modelos são do provider `opencode-go`.** O provider `opencode`
(Personal) responde "Insufficient balance" nesta conta. `muse-spark-1.3-contributor`
exige consentimento adicional e os modelos `deepseek` exigem região "Global".
Nenhum é usado.

**As variantes de effort são `max` ou `high`.** A prioridade é qualidade, não
latência.

### 2.1 Faixas de escalonamento

| Faixa | Modelos | Quando entra |
|---|---|---|
| T0 — Exploração e registo | `beam-free` | Exploração de ficheiros, registo mecânico |
| T1 — Implementação e verificação | `claude-haiku-5-5`, `gpt-6-luna` | Implementação, verificação, revisão |
| T2 — Revisão difícil | `kimi-k2.7-code`, `mimo-v2.6-pro` | Após duas falhas do mesmo critério |

`gpt-5.5`, `gpt-5.5-pro` e `gemini-3.1-pro` estão **excluídos** do routing.

### 2.2 Regras de escalonamento

| Gatilho | Efeito |
|---|---|
| Implementação falha duas vezes pelo mesmo motivo | `implementador` sobe de T1 para T2 |
| Revisão reprova duas vezes pelo mesmo motivo | `revisor` sobe de T1 para T2 |
| Task passa mais de uma vez por `VERIFYING` | `verificador` sobe de T1 para T2 |

A contagem vive no plano de acção da task, não na memória do agente.

## 3. Os oito agentes

| Agente | Modo | Papel | Formato de saída |
|---|---|---|---|
| `orquestrador` | primary | Coordena o pipeline e apresenta os comandos de verificação ao utilizador | `TAREFA / ESTADO / MOTIVO / COMANDOS / BRANCH / PUSH / PEDIDO` |
| `explorador` | subagent | Mapeia o repositório | `ESTADO / MOTIVO / FICHEIROS / DEPENDENCIAS / DIVERGENCIAS` |
| `analista-clareza` | subagent | Aplica a regra dos 90% | `ESTADO / PONTUACAO / CRITERIOS / BLOQUEIOS` |
| `implementador` | subagent | Escreve o código | `ESTADO / MOTIVO / ARQUIVOS / VERIFICACOES` |
| `revisor` | subagent | Revisão, correcção funcional | `ESTADO / MOTIVO / ACHADOS` |
| `revisor-b` | subagent | Revisão, qualidade de engenharia | `ESTADO / MOTIVO / ACHADOS` |
| `verificador` | subagent | Avalia a evidência enviada pelo utilizador, sem shell | `ESTADO / MOTIVO / VERIFICACOES / ERRO / EVIDENCIA / PEDIDO` |
| `guardiao` | subagent | RawSpec, histórico, commit e push via `commit-task` | `ESTADO / MOTIVO / TASK / CONDICOES / BRANCH / COMMIT / PUSH / EVIDENCIA` |

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
| `verificador` | `edit: *` deny; `shell: *` deny; `subagent: *` deny | Não executa shell; avalia a evidência do utilizador |
| `implementador` | `edit: src/**` allow; `edit: src/content/**` ask; `shell: pnpm *` allow; `shell: *` deny | Escreve código, conteúdo exige o utilizador |
| `guardiao` | `shell: git add/commit/push/status/diff *` allow; `shell: node scripts/rawspec-v2-cli.mjs *` allow; `shell: *` deny | Git e RawSpec são a sua função; o commit e o push passam pelo `commit-task` |
| `orquestrador` | `shell: *` ask | Coordena, não executa comandos livremente |

Dentro de cada agente a regra geral precede a específica, porque a última
correspondência prevalece. Por isso `shell: pnpm *` em `allow` vem **antes** de
`shell: *` em `deny`.

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
        │       ├─ utilizador: pnpm test e, depois, pnpm test:e2e
        │       ├─ verificador avalia a evidência, sem shell
        │       ├─ evidência em falta ou ambígua ─► pede complemento, não avança
        │       └─ falha ─────────────────────────► guardiao: fail, volta a [4]
        ├─[6] revisor A ──────────► achados
        ├─[7] revisor B ──────────► achados
        │       └─ desacordo ─────► desempate pelo guardiao
        └─[8] guardiao ───────────► verify, histórico, ADR e commit-task
                ├─ lint, typecheck, test, build, por esta ordem
                ├─ gate de âmbito e hooks do Husky
                └─ push bloqueado ─► commit local; razão registada
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

**Desempate.** Quando discordam, o `guardiao` escala a revisão para
`kimi-k2.7-code` e pede ao utilizador a reprodução do achado. O `verificador`
avalia a evidência enviada. Um achado que não se reproduz é registado como falso
positivo conhecido e não bloqueia.

**Reprovação.** Qualquer reprovação devolve a tarefa a `IN PROGRESS`: o `guardiao`
regista `fail` com o achado como motivo, e a implementação recomeça. Depois de nova
implementação, os comandos de verificação são apresentados outra vez.

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

## 6. Economia de tokens

Custos medidos no bake-off, não estimados.

| Cenário | Custo/task | 12 tasks MVP | 30 execuções/mês |
|---|---|---|---|
| Pipeline completo, com revisão em par | **$0,0229** | **$0,27** | **$0,69** |
| Com escalonamento do revisor | $0,0491 | $0,59 | $1,47 |
| Com escalonamento duplo | $0,0529 | $0,63 | $1,59 |
| Referência: revisão simples | $0,0089 | $0,11 | $0,27 |
| Sessões manuais actuais | $0,65 | $7,80 | $19,50 |

O pipeline de oito etapas custa **2,3 cêntimos por task**, contra os 65
cêntimos das sessões manuais. O limite de USD 0,50 por task tem uma margem
de 21×.

Os valores são a soma exacta das medições do bake-off, recalculada por
`node bakeoff/calc-cost.mjs`.

A razão do custo baixo é o contexto mínimo por etapa. As etapas do pipeline
recebem a task, o ficheiro e o resultado da etapa anterior. As sessões manuais
gastavam em média 279K tokens de input e 17,9M de cache read por task, porque
reliam o repositório inteiro a cada passo.

## 7. Verificação

**Fluxo padrão.** O utilizador executa manualmente apenas estes comandos, por esta
ordem:

```bash
pnpm test
pnpm test:e2e
```

O verificador avalia a evidência de cada comando: o comando exacto e o resultado
final, com código de saída 0 ou resumo de sucesso. Se um comando falhar, a saída
relevante é apresentada e o pipeline para. Se a evidência estiver em falta ou for
ambígua, o verificador pede complemento e não avança.

O `pnpm test:e2e` executa `pnpm build` antes do Playwright, porque o `vite preview`
serve `dist/`, que é ignorado pelo Git e não existe num clone novo.

**Verificações automáticas.** O `commit-task` corre `pnpm lint`, `pnpm typecheck`,
`pnpm test` e `pnpm build`, por esta ordem. Os hooks do Husky permanecem activos e
podem repetir parte delas. O utilizador não executa estes comandos no fluxo padrão.

**Scripts `bakeoff/`.** Os sete scripts abaixo não fazem parte do fluxo padrão.
Servem para reexecutar a medição do routing e validar a configuração do orquestrador
quando esta muda. Verificam o comportamento real, não a narração do agente.

```bash
node bakeoff/validate.mjs                     # 14 verificações de configuração, agentes, comandos e documentação
node bakeoff/check-agents.mjs                 # os 8 agentes são descobertos
node bakeoff/check-permissions.mjs             # quem escreve e quem não escreve
node bakeoff/check-content-gate.mjs            # o conteúdo real exige autorização
node bakeoff/check-scope-gate.mjs              # o gate de âmbito bloqueia escritas fora do âmbito
node bakeoff/score.mjs bakeoff/results.json    # o ranking medido
node bakeoff/calc-cost.mjs                    # o custo por task, recalculado
```

`validate.mjs` é a verificação de regressão do projecto. Confere a
configuração contra o schema publicado, o frontmatter dos oito agentes, os
modelos, as três negações dos agentes de leitura, as referências dos comandos,
a integridade do histórico, a coerência dos custos documentados com a medição
e o grafo de dependências da change.

## 8. Ficheiros relacionados

- `docs/projeto.md` — visão, âmbito e princípios de trabalho.
- `docs/rawspec-v2.md` — formato das especificações, comandos e fluxo de commit e push (§15).
- `docs/history.md` — histórico append-only.
- `docs/decisions/ADR-007-orquestrador-de-agentes.md` — a decisão.
- `AGENTS.md` — regras de execução a que os agentes estão sujeitos.
- `bakeoff/README.md` — a fundamentação medida do routing.
