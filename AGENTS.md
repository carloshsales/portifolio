# AGENTS.md

Instruções para agentes que executam trabalho neste repositório.

Este projeto usa o formato de especificações RawSpec v2, documentado em
[`docs/rawspec-v2.md`](docs/rawspec-v2.md). As tarefas vivem em
`specs/changes/NNN-slug/tasks/TASK-NNN.md` e são executadas pelo helper
`scripts/rawspec-v2.mjs`, através da CLI `scripts/rawspec-v2-cli.mjs`.

A documentação geral do projeto — visão, âmbito, identidade visual, stack,
prioridades e princípios de trabalho — está em
[`docs/projeto.md`](docs/projeto.md). É a referência a consultar para melhorar o
teor das perguntas e das decisões, e não substitui a inspeção do repositório.

## Regra de execução: resumo prévio e resolução de discrepâncias

Ao ser pedido a execução de uma tarefa, o agente **tem de apresentar primeiro um
resumo do que será realizado** e, caso existam discrepâncias, **tem de perguntar ao
utilizador antes de agir**.

### 1. Resumo prévio (sempre)

Antes de alterar ficheiros, o agente apresenta um resumo com:

- **A tarefa** — identificador, título e change a que pertence.
- **O que será feito** — os entregáveis previstos, em termos concretos.
- **Os ficheiros afetados** — com a ação prevista em cada um (criação, alteração
  ou remoção).
- **As verificações** — os comandos que serão executados para comprovar o
  resultado.

O resumo é informativo: quando não existem discrepâncias, o agente prossegue
diretamente com a execução, sem esperar por confirmação adicional.

### 2. Discrepâncias (perguntar antes de agir)

O agente compara a tarefa com o estado real do repositório. Havendo qualquer
divergência, tem de a relatar e perguntar ao utilizador como proceder, **antes**
de modificar qualquer ficheiro.

Consideram-se discrepâncias:

- O código já existente cumpre, ou excede, o âmbito da tarefa.
- O âmbito da tarefa está obsoleto, incompleto ou conflituante com o estado real.
- A dependência declarada não corresponde à realidade do grafo de tarefas.
- A tarefa está ambígua quanto a objectivos, ficheiros ou critérios de aceitação.
- A aprovação da mudança ou das dependências está em falta.
- A tarefa exige decisão de âmbito, conteúdo ou arquitectura ainda não tomada.

Em cada caso, o agente:

1. **Apresenta** a discrepância, descrevendo o que encontrou e o que a tarefa pede.
2. **Propõe** as opções viáveis, com a recomendação identificada.
3. **Pergunta** ao utilizador qual o caminho a seguir, e **aguarda** a resposta.

### 3. Situações que não constituem discrepância

O agente não interrompe o fluxo por esclarecimentos já respondidos por outras
tarefas, por decisões registadas em `docs/history.md` ou em ADRs, nem por
detalhes de implementação cobertos pelo âmbito da própria tarefa.

### 4. Princípio de não falsificação

O agente **nunca** marca uma tarefa como concluída sem que o trabalho
correspondente tenha sido realmente executado e verificado. Quando o trabalho
solicitado já existe no repositório, a tarefa tem de ser reescrita para reflectir
a revisão e a verificação do código existente, e não a construção a partir de
raiz. A reescrita segue o formato v2 em `specs/templates/task.md` e preserva o
grafo de dependências.

## Regras de workflow

- Nunca alterar o status de aprovação de uma mudança ou de uma tarefa.
- Nunca fazer commit ou push sem a sequência da branch por tarefa (ADR-005).
- Nunca usar `--no-verify` para contornar verificações.
- Resolver a tarefa e as dependências antes de agir.
- Validar a aprovação da mudança antes de iniciar uma tarefa.
- Perguntar sempre em ambiguidade de tarefa, de mudança ou de âmbito.

## Verificações

Comandos de verificação do projeto, definidos em `package.json`:

```bash
pnpm lint        # ESLint
pnpm typecheck   # verificação de tipos do TypeScript
pnpm test        # suíte Vitest
pnpm build       # build de produção
pnpm test:e2e    # suíte Playwright
pnpm format:check # verificação de formatação com Prettier
```

### Divisão de responsabilidades

- **Executor (agente):** executa `pnpm test` e `pnpm test:e2e`, por esta ordem, e devolve a evidência de cada comando: o comando exato, o código de saída e a saída relevante. Também pode correr `pnpm lint`, `pnpm typecheck`, `pnpm format:check` e `pnpm build`, todos de leitura, para diagnosticar a causa de uma falha. Não escreve código e não avalia o resultado. O `pnpm test:e2e` corre `pnpm build` antes do Playwright, porque o `vite preview` serve `dist/`, que é ignorado pelo Git.
- **Orquestrador:** invoca o `executor` na etapa de verificação e envia a evidência ao `verificador`, antes da revisão e do registo.
- **Verificador:** avalia essa evidência sem executar shell. Se um comando falhar, o pipeline para para correção. Se a evidência estiver em falta ou for ambígua, pede complemento ao `executor` e não avança.
- **Utilizador:** intervém nas decisões de âmbito, discrepâncias e desempates de revisão. Não executa `pnpm test` nem `pnpm test:e2e`.
- **`commit-task` (guardião):** depois da evidência e das revisões, executa `pnpm lint`, `pnpm typecheck`, `pnpm test` e `pnpm build`, por esta ordem. Se uma falhar, não há commit nem push. Os hooks do Husky permanecem ativos e podem repetir verificações.
- **Pull request (automático):** depois do commit e do push bem-sucedidos, o `commit-task` abre um pull request da branch da tarefa para `main`, com `gh pr create --base main --head <branch>`. A criação é idempotente: se já existir um pull request aberto para a branch, o URL existente é reportado e nenhum duplicado é criado. O pull request nunca é fundido automaticamente. Se o `gh` não estiver disponível, a autenticação falhar, ou a criação falhar, o erro é reportado com precisão; o commit e o push permanecem válidos e a verificação da tarefa não é reprovada por causa do pull request.
- Os sete scripts `bakeoff/*` não fazem parte do fluxo padrão.

## Comandos RawSpec

| Comando                                        | Responsabilidade                                  |
| ---------------------------------------------- | ------------------------------------------------- |
| `/startspec [TASK-ID] [--change CHANGE-ID]`    | Cria a branch da tarefa e inicia.                 |
| `/continuespec [TASK-ID] [--change CHANGE-ID]` | Continua, regista evidência e commita e pusha.    |
| `/arquivespec TASK-ID [--change CHANGE-ID]`    | Arquiva uma tarefa após aprovação.                |
| `/archivespec [CHANGE-ID]`                     | Arquiva uma mudança elegível.                     |
| `/logspec ...`                                 | Registra histórico e, opcionalmente, cria um ADR. |

## Convenções do repositório

- **Sem comentários desnecessários** no código. O código explica-se a si próprio.
- **TypeScript estrito.** Sem `any` implícito, sem valores por omissão silenciosos.
- **CSS Modules** para estilos de componentes; tokens globais em
  `src/styles/tokens.css`.
- **Conteúdo real** vive em `src/content/` e é exposto ao código através de
  `src/data/`. Não inventar projetos, experiências ou informações profissionais.
- **Interface e conteúdo em português brasileiro** (pt-BR). Comentários e
  documentação do código-fonte seguem o registo atual do repositório, em
  português europeu.
- **Histórico append-only.** Nunca reescrever entradas em `docs/history.md`.
