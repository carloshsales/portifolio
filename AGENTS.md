# AGENTS.md

Instruções para agentes que executam trabalho neste repositório.

Este projeto usa o formato de especificações RawSpec v2, documentado em
[`docs/rawspec-v2.md`](docs/rawspec-v2.md). As tarefas vivem em
`specs/changes/NNN-slug/tasks/TASK-NNN.md` e são executadas pelo helper
`scripts/rawspec-v2.mjs`, através da CLI `scripts/rawspec-v2-cli.mjs`.

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

## Comandos RawSpec

| Comando                                        | Responsabilidade                                  |
| ---------------------------------------------- | ------------------------------------------------- |
| `/startspec [TASK-ID] [--change CHANGE-ID]`    | Cria a branch da tarefa e inicia.                 |
| `/continuespec [TASK-ID] [--change CHANGE-ID]` | Continua, verifica, conclui, e commita e pusha.   |
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
- **Mensagens e comentários em português europeu.**
- **Histórico append-only.** Nunca reescrever entradas em `docs/history.md`.
