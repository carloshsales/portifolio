# Change 006 — Orquestrador de agentes

- Status: ARCHIVED
- Arquivada em: 2026-11-16
- Tipo: Melhoria de processo
- Prioridade: Média
- Data: 2026-11-15
- Relacionadas: `001-portfolio-mvp`, `004-rawspec-branch-per-task`

## 1. Objetivo

Definir um orquestrador de agentes para o OpenCode que atribua automaticamente o
modelo certo a cada tipo de tarefa, aplique gates de qualidade verificáveis e
mantenha o custo por tarefa dentro de um orçamento limitado.

O orquestrador é definido como configuração nativa do OpenCode — agentes, comandos
e permissões — sem código próprio, sem plugins e sem serviços adicionais.

## 2. Problema

O repositório tem um processo maduro e bem documentado: RawSpec v2 com 16 subcomandos
de CLI, ciclo de vida de 8 estados, gates de dependência, branch por tarefa e
commit/push automático. O que não existe é a camada que liga esse processo aos
agentes que o executam.

Concretamente, existem seis lacunas.

### 2.1 Contexto desperdiçado

Cada invocação de agente relê `docs/projeto.md` (737 linhas), `docs/rawspec-v2.md`
(312 linhas), a task RawSpec e o código relevante. Não há cache de contexto nem
seleção de instrução por área.

### 2.2 Ausência de configuração de agentes

Não existe `opencode.json` no repositório. Não há agentes especializados, nem
tabela de routing de modelos, nem permissões por agente. Todos os agentes usam
`build`, `plan` e `explore` genéricos, com o modelo da sessão.

### 2.3 Ausência de gates automatizados

A regra dos 90% de clareza (`docs/projeto.md` §8.5) e o princípio de não
falsificação (`docs/projeto.md` §12.3) são exigidos, mas verificados manualmente.
Um agente pode avançar para implementação sem que os 10 critérios tenham sido
avaliados.

### 2.4 Permissões sem política explícita

As restrições de Git e de escrita estão descritas em prosa (`docs/projeto.md` §7.3),
mas não estão codificadas. Não há barreira técnica que impeça um agente de
descartar alterações não commitadas, editar `src/content/` ou escrever fora do
âmbito da task.

### 2.5 Custo e tokens invisíveis

Não existe registo de quantos tokens cada agente consome nem de quanto cada
execução custa. Sem isso, o routing de modelos é uma decisão de intuição.

### 2.6 Higiene do repositório

Existem 12 worktrees órfãos, `docs/history.md` tem entradas duplicadas e
codificação corrompida em cinco entradas, e o `AGENTS.md` — que contém as regras
de execução para agentes — existe na branch `chore/agent-rules` e não está
integrado em `main`.

## 3. Escopo

### 3.1 Incluído

- **`opencode.json`** com schema, permissões globais, agentes, comandos e
  configuração de cache por provider.
- **Oito agentes especializados** em `.opencode/agents/`: `orquestrador`,
  `explorador`, `analista-clareza`, `implementador`, `revisor`, `revisor-b`,
  `verificador` e `guardiao`.
- **Tabela de routing de modelos** por tipo de tarefa, com variantes de effort e
  escalonamento explícito.
- **Dois comandos**: `/orquestrar` (pipeline completo) e `/clarity` (gate isolado).
- **Política de permissões** com gates de segurança e de escopo.
- **Documentação** em `docs/orquestrador.md` e ADR-007.
- **Higiene**: integração do `AGENTS.md`, reparação do `docs/history.md` e
  remoção dos worktrees órfãos.
- **Observabilidade**: registo de tokens e custo por execução.

### 3.2 Fora do escopo

- Código próprio do orquestrador, plugins ou serviços externos.
- Alterar a aplicação do portfólio (`src/`, `public/`, `e2e/`, `scripts/`).
- Alterar o formato RawSpec v2, os templates ou o contrato da CLI.
- Migrar ou reescrever a change `001-portfolio-mvp`.
- Fornecer o conteúdo real de `src/content/`, que continua a ser responsabilidade
  do utilizador.
- Modelos com custo por token superior a USD 5 por milhão de tokens de entrada
  no tier de implementação, conforme a restrição orçamental confirmada.

## 4. Comportamento proposto

### 4.1 Pipeline de execução

O comando `/orquestrar TASK-NNN` executa seis etapas sequenciais:

1. **Exploração** — o `explorador` mapeia os ficheiros afetados, as dependências
   e o estado real do código, sem editar nada.
2. **Clareza** — o `analista-clareza` avalia os 10 critérios da regra dos 90% e
   emite uma pontuação com evidências. Abaixo de 90/100, o pipeline pára.
3. **Aprovação** — o `orquestrador` apresenta o resumo e a pontuação. Discrepâncias
   entre a task e o repositório são resolvidas com o utilizador.
4. **Implementação** — o `implementador` escreve o código, restrito aos ficheiros
   declarados na task.
5. **Verificação** — o `verificador` executa `lint`, `typecheck`, `test`, `build`
   e `test:e2e`, e regista a evidência.
6. **Revisão em par** — o `revisor` e o `revisor-b` revêem o diff de forma
   independente. A divergência entre os dois é resolvida pelo `guardiao` com
   confirmação do `verificador`.
7. **Registo** — o `guardiao` atualiza o estado RawSpec, o histórico e, quando
   aplicável, o ADR.

### 4.2 Push automático condicionado

Nos termos da ADR-005 e da confirmação do utilizador, o `guardiao` executa commit
e push automático quando, cumulativamente:

- a task está `COMPLETED` e `VERIFIED`;
- a pontuação de clareza é ≥ 90/100;
- `lint`, `typecheck`, `test` e `build` passam;
- os hooks do Husky passam sem `--no-verify`;
- o diff toca apenas em caminhos dentro do âmbito declarado da task.

Se qualquer condição falhar, o push não acontece e a razão é registada.

### 4.3 Conteúdo real sob controlo humano

A escrita em `src/content/` é `deny` por defeito e `ask` quando solicitada. O
agente pode ler e propor conteúdo, mas a decisão de escrever fica com o
utilizador, para impedir a invenção de projetos, experiências ou links.

### 4.4 Escalonamento de modelo

O orquestrador sobe de tier apenas quando um critério objetivo é atingido:

- a verificação falha duas vezes pelo mesmo motivo → tier de implementação sobe;
- o `revisor` reprova duas vezes pelo mesmo motivo → tier de revisão sobe;
- a task é marcada `VERIFYING` mais de uma vez → tier de verificação sobe.

O tier máximo é o tier 2. Não há tier de arbitragem com custo elevado.

## 5. Requisitos

### 5.1 Funcionais

- R1. Cada tipo de tarefa tem um modelo e uma variante de effort atribuídos.
- R2. A pontuação de clareza de 10 critérios é calculada antes da implementação.
- R3. Abaixo de 90/100, a implementação não começa.
- R4. O commit e o push só ocorrem com todas as condições da §4.2 verificadas.
- R5. Nenhum agente pode descartar alterações não commitadas.
- R6. Nenhum agente pode escrever em `src/content/` sem autorização explícita.
- R7. Nenhum agente pode editar ficheiros de especificação fora da CLI RawSpec.
- R8. Todo agente devolve evidência estruturada do que executou.
- R9. O custo e os tokens de cada execução ficam registados.
- R10. O `AGENTS.md` passa a estar integrado e a ser lido automaticamente.
- R11. Nenhum ficheiro fora do âmbito declarado da task é commited. A garantia
  vem do gate de âmbito aplicado antes do commit, não das permissões de caminho,
  que se provaram contornáveis por shell. Ver `design.md` §5.3.1.

### 5.2 Não funcionais

- N1. O custo por task não ultrapassa USD 0,50 na configuração de routing proposta.
- N2. Nenhum modelo usado no tier de implementação custa mais de USD 0,20 por
  milhão de tokens de entrada.
- N3. A configuração recarrega sem reiniciar o OpenCode.
- N4. Nenhuma alteração ao contrato da CLI RawSpec v2.
- N5. Nenhuma alteração ao código da aplicação.

## 6. Critérios de aceitação

- `opencode.json` existe na raiz, valida contra o schema e define oito agentes,
  dois comandos e a política de permissões.
- Os oito agentes existem em `.opencode/agents/` e cada um declara modelo, modo e
  permissões.
- A revisão é feita em par, por `revisor` e `revisor-b`, com a regra de
  desempate definida no design.
- A tabela de routing está documentada em `docs/orquestrador.md`, com uma entrada
  por agente, o custo por milhão de tokens e o critério de escalonamento.
- Cada modelo da tabela de routing pertence ao provider `opencode-go` e foi
  verificado como acessível sem consentimento adicional.
- O bake-off está reproduzível: `bakeoff/fixture.tsx`, `bakeoff/prompt.txt`,
  `bakeoff/score.mjs` e os resultados medidos em `bakeoff/README.md`.
- `docs/orquestrador.md` registra o custo estimado por task e o orçamento de 30
  execuções.
- O ADR-007 existe em `docs/decisions/` e está referenciado no histórico.
- `docs/history.md` está sem entradas duplicadas e sem codificação corrompida.
- `AGENTS.md` está presente na branch principal.
- Os 12 worktrees órfãos foram removidos.
- `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` e `pnpm test:e2e` passam.

## 7. Riscos e mitigação

| Risco | Impacto | Mitigação |
|---|---|---|
| Over-engineering, o padrão já registado em `docs/projeto.md` §8.3 | Alto — consome tempo que deve ir para o MVP | Todo o artefacto é configuração declarativa do OpenCode. Nenhum código novo. A change é arquivável e reversível com a remoção de 3 diretórios |
| Routing errado degrada a qualidade | Médio | Critérios objetivos de escalonamento, não percepção. Cada tier tem um modelo de fallback documentado |
| Push automático envia trabalho incompleto | Alto | Cinco condições cumulativas, incluindo scope check do diff contra a task e hooks sem `--no-verify` |
| Perdas de contexto entre subagentes | Médio | Cada subagente recebe o contexto mínimo da etapa, não a conversa inteira. O estado persistente vive nos ficheiros RawSpec |
| Custos a escalar | Médio | Teto por task documentado, escalonamento limitado ao tier 2, sem tier de arbitragem |
| Content invented in `src/content/` | Alto | `deny` por defeito e `ask` explícito |

## 8. Decisões confirmadas

| Decisão | Escolha | Efeito no desenho |
|---|---|---|
| D1 — commit e push | Automáticos, desde que todos os requisitos de qualidade e testes sejam cumpridos | `git push` é `allow` para o `guardiao`, condicionado às cinco regras da §4.2 |
| D2 — `src/content/` | `deny` + `ask` | Escrita bloqueada por defeito; só o utilizador autoriza |
| D3 — worktrees | In-place; os conflitos são resolvidos à mão | Não há criação de worktree no fluxo; os órfãos existentes são removidos |
| D4 — tier de arbitragem | Não incluído | Teto no tier 2. Os modelos `gpt-5.5`, `gpt-5.5-pro` e `gemini-3.1-pro` ficam fora do routing |
| D5 — entrega | Spec primeiro, implementação depois | Esta change é o artefacto de planeamento; a implementação é uma change separada |
| D6 — prioridade do routing | Precisão e qualidade acima de latência | As variantes de effort são `max`/`high`, não `low`/`medium`. O tempo de execução não é critério |
| D7 — fundamentação do routing | Medição, não preço de catálogo | Os modelos foram comparados num bake-off sobre a TASK-005 real. Resultados em `bakeoff/README.md` |
| D8 — provider | Exclusivamente `opencode-go` | O provider `opencode` (Personal) falha com "Insufficient balance" na conta. `muse-spark-1.3-contributor` e os modelos `deepseek` exigem consentimento adicional |
| D9 — revisão | Em par | `revisor` com `gpt-6-luna` e `revisor-b` com `kimi-k2.7-code`. Custo de $0,0229 por task. A limitação de independência, medida no bake-off, está registada no design |

## 9. Aprovação

Esta proposta depende de aprovação humana antes do início da implementação.
