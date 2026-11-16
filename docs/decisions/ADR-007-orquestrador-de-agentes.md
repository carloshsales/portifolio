# ADR-007: Orquestrador de agentes por configuração nativa

- Status: Accepted
- Data: 2026-11-16

## Contexto

O projecto tem um processo maduro e documentado: RawSpec v2 com dezassete
subcomandos de CLI, ciclo de vida de oito estados, gates de dependência, branch
por tarefa e commit e push automático.

O que não existia era a camada que liga esse processo aos agentes que o
executam. Seis lacunas foram identificadas:

1. **Contexto desperdiçado.** Cada invocação relia `docs/projeto.md` (737
   linhas), `docs/rawspec-v2.md` (312 linhas), a task e o código relevante.
2. **Ausência de configuração.** Não existia `opencode.json`. Não havia agentes
   especializados, routing de modelos nem permissões por agente.
3. **Gates não automatizados.** A regra dos 90% de clareza e o princípio de não
   falsificação eram verificados manualmente.
4. **Permissões sem política.** As restrições de Git e de escrita estavam em
   prosa, sem barreira técnica.
5. **Custo invisível.** Não havia registo de tokens nem de custo por execução.
6. **Higiene.** Existiam doze worktrees órfãos, `docs/history.md` tinha
   entradas duplicadas e com codificação corrompida, e o `AGENTS.md` — que
   contém as regras de execução para agentes — vivia numa branch não integrada.

Duas restrições do utilizador condicionaram o desenho: o orçamento de tokens é
extremamente limitado, e a prioridade é **precisão e qualidade**, não
latência.

## Alternativas consideradas

1. **Usar apenas os agentes nativos sem configuração.** O mais simples e o
   mais reversível. Descartado: mantém as seis lacunas e não dá forma
   verificável ao routing de modelos nem aos gates.

2. **Orquestrador em código próprio**, com um runner que lê o estado RawSpec e
   invoca modelos por API. Descartado: reintroduz o padrão já registado em
   `docs/projeto.md` §8.3 — worktrees desnecessárias, comandos personalizados
   usados incorrectamente, complexidade de gestão e tempo excessivo dedicado
   a infra-estrutura de planeamento. Introduz também dependências e um
   caminho de actualização próprio.

3. **Plugin do OpenCode**, com hooks sobre as chamadas de ferramenta.
   Descartado: a API de plugin é a única área com quebra de compatibilidade
   entre V1 e V2, e a manutenção acompanha a versão do OpenCode.

4. **Configuração nativa do OpenCode**, com agentes, comandos e permissões
   declarados em ficheiros versionados. Adoptada.

## Decisão

O orquestrador é **configuração nativa do OpenCode**. Não há código próprio,
plugins nem serviços adicionais. Tudo vive em `opencode.json`,
`.opencode/agents/`, `.opencode/commands/` e `docs/`.

### Routing

Cada etapa do pipeline tem um modelo atribuído, medido num bake-off sobre a
TASK-005 real com cinco defeitos plantados num fixture e pontuação por
correspondência semântica. O routing e os resultados estão em
`docs/orquestrador.md` §2 e em `bakeoff/README.md`.

Todos os modelos são do provider `opencode-go`. O provider `opencode` (Personal)
responde "Insufficient balance" nesta conta. As variantes de effort são `max` ou
`high`: a prioridade é qualidade, não latência.

`gpt-5.5`, `gpt-5.5-pro` e `gemini-3.1-pro` estão excluídos do routing.

### Oito agentes

`orquestrador` (primary), `explorador`, `analista-clareza`, `implementador`,
`revisor`, `revisor-b`, `verificador` e `guardiao` (subagents).

A revisão é feita em par, por `revisor` e `revisor-b`, com focos distintos. A
limitação de independência, medida no bake-off, está registada no design em vez
de ser omitida.

### Comandos

`/orquestrar` executa o pipeline completo. `/clarity` executa só o gate de
clareza, sem tocar em ficheiros.

### Push automático

Nos termos da ADR-005 e da confirmação do utilizador, o `guardiao` faz commit
e push quando cinco condições se cumprem cumulativamente: task `COMPLETED` e
`VERIFIED`, clareza ≥ 90/100, verificações aprovadas, hooks do Husky passados
sem `--no-verify`, e diff dentro do âmbito declarado da task.

### Garantias de âmbito

As permissões de caminho do OpenCode não são uma barreira de integridade. Foram
verificadas empiricamente duas limitações: a escrita por shell contorna a
negativa de caminho, e a delegação a subagentes contorna as negativas de
`edit` e `shell`.

A correcção aplicada foi a negação de `subagent` nos cinco agentes de leitura,
combinada com um gate de âmbito aplicado depois da acção e antes do commit,
baseado em `git status --porcelain`. O gate é a garantia real; as permissões
reduzem a probabilidade.

### Conteúdo real

A escrita em `src/content/` é `deny` global e `ask` no `implementador`. O
conteúdo é do utilizador, para impedir a invenção de projectos, experiências ou
links, que o projecto proíbe explicitamente.

## Justificativa

A escolha cumpre os requisitos com o menor custo e o menor risco de
regressão:

- **Reversibilidade.** Remover três directórios desfaz tudo. Não há migração de
  dados nem estado externo.
- **Custo.** O pipeline completo custa $0,0229 por task, contra $0,65 das
  sessões manuais — 28× mais barato — e o limite de USD 0,50 por task tem
  margem de 21×.
- **Qualidade.** O routing é medido, não assumido. O bake-off mostrou que a
  precisão separa os modelos onde o recall não separa: sete dos dez modelos
  candidatos encontraram 80% dos defeitos, mas dois produziram 9 e 12 falsos
  positivos. Num pipeline onde o revisor bloqueia a implementação, a precisão
  é mais valiosa que o recall.
- **Coerência com o registo do projecto.** O RawSpec v2 já existem como
  subprocesso maduro. Um orquestrador em código próprio tê-lo-ia de substituir.
- **Rigor das permissões.** Documentar honestamente o que as permissões não
  garantem é mais útil do que afirmar garantias que a verificação refuta.

A revisão em par foi escolhida pelo utilizador com conhecimento da sua
limitação de independência, porque o custo adicional — $0,17 em trinta execuções
— é irrelevante face ao orçamento disponível.

## Consequências

**Positivas**

- Os gates de clareza e de âmbito passam a ser executáveis e verificáveis.
- O custo por task desce de $0,65 para $0,0229.
- O `AGENTS.md` passa a ser lido automaticamente em todas as sessões.
- O routing é reproduzível: `bakeoff/` permite reexecutar a medição.
- As limitações do modelo de permissões ficam documentadas, com evidência,
  em vez de implícitas.

**Negativas**

- O `commit-task` da CLI usa `git add -A`, o que contraria a política de staging
  por caminho exacto de `docs/rawspec-v2.md` §9. Não foi corrigido nesta change:
  é uma alteração ao helper partilhado, fora do âmbito.
- O provider `opencode` (Personal) fica inutilizável, por falta de créditos.
- A revisão em par tem um ganho mais modesto do que a convergência entre
  revisores sugere.
- O `opencode.json` fica dependente de modelos que podem ser descontinuados
  pelo provider. O bake-off é a forma de detectar essa situação cedo.

**Neutras**

- O `opencode.json` é recarregado automaticamente, sem reiniciar o OpenCode.
- Nenhum modelo do routing exige consentimento adicional da conta.
