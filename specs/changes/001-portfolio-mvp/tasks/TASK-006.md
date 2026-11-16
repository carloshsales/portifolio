# TASK-006 — Implementar seção de projetos

- Change: 001-portfolio-mvp
- Status: PENDING
- Depende de: TASK-005
- Início: —
- Verificação: PENDING
- Evidência: —
- Plano de ação: none

## Objetivo

Revisar e completar a seção de projetos: cards, tecnologias apresentadas e links para repositórios e demonstrações.

## Arquivos

- `src/sections/Projects/Projects.tsx` (revisão)
- `src/sections/Projects/Projects.module.css` (revisão)
- `src/content/projects.ts` (leitura dos dados; sem escrita)

## Entregáveis

- Os projetos são apresentados em cards, com título, descrição e tecnologias.
- Cada link de repositório e de demonstração abre em nova janela com `rel="noreferrer"`.
- Links opcionais que não existam não são renderizados.
- A secção apresenta um estado vazio quando não há projetos.
- Os dados estão separados da apresentação visual.

## Regras

- **Não editar `src/content/projects.ts`** nesta tarefa. O preenchimento do conteúdo real é feito à parte, com base em `docs/conteudo-real.md`.
- A secção lê de `src/data/projects.ts`, nunca de `src/content/` directamente.
- Não inventar projetos, tecnologias ou links.
- Um link só é renderizado quando o valor está preenchido.
- A lista de tecnologias é apresentada com um rótulo acessível.

## Testes

- `pnpm lint`, `pnpm typecheck` e `pnpm test` passam.
- `src/test/content.test.tsx` confirma que não há marcadores de placeholder nem URLs de exemplo.
- `src/test/accessibility.test.tsx` confirma ausência de violações automáticas.
- `pnpm test:e2e` confirma que não há links com `href` vazio nem `javascript:`.
- Verificação visual no browser: os cards são legíveis e nenhum link devolve 404.

## Aceitação

Os projetos são apresentados corretamente, com dados reais e links válidos, e a secção degrada para um estado vazio sem quebrar o layout.

## Checklist de clareza

- Objetivo único e verificável — ATENDE
- Arquivos afetados — ATENDE
- Entregáveis concretos — ATENDE
- Contrato de entrada, saída e erros — ATENDE (entrada: `src/data/projects.ts`; saída: cards de projeto renderizados; erros: lista vazia apresenta estado vazio, sem erro)
- Testes obrigatórios — ATENDE
- Critério de aceitação objetivo — ATENDE
- Dependências declaradas explicitamente — ATENDE
- Ausência de decisões pendentes para o implementador — ATENDE
