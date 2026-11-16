# TASK-007 — Implementar seção de habilidades

- Change: 001-portfolio-mvp
- Status: PENDING
- Depende de: TASK-006
- Início: —
- Verificação: PENDING
- Evidência: —
- Plano de ação: none

## Objetivo

Revisar e completar a seção de habilidades: categorias, tecnologias apresentadas e separação entre conteúdo e apresentação.

## Arquivos

- `src/sections/Skills/Skills.tsx` (revisão)
- `src/sections/Skills/Skills.module.css` (revisão)
- `src/content/skills.ts` (leitura dos dados; sem escrita)

## Entregáveis

- As habilidades são apresentadas agrupadas por categoria.
- Cada grupo tem título e lista de tecnologias.
- O conteúdo está separado do componente.
- A secção apresenta um estado vazio quando não há grupos.
- Não são exibidos níveis de proficiência nem classificações.

## Regras

- **Não editar `src/content/skills.ts`** nesta tarefa. O preenchimento do conteúdo real é feito à parte, com base em `docs/conteudo-real.md`.
- A secção lê de `src/data/skills.ts`, nunca de `src/content/` directamente.
- Não exibir níveis, percentagens ou etiquetas de proficiência.
- Não agrupar em categorias vagas.
- A hierarquia de títulos mantém `h2` para a secção e `h3` para cada categoria.

## Testes

- `pnpm lint`, `pnpm typecheck` e `pnpm test` passam.
- `src/test/content.test.tsx` confirma que não há marcadores de placeholder.
- `src/test/accessibility.test.tsx` confirma ausência de violações automáticas.
- `pnpm test:e2e` confirma que a secção está presente e sem overflow horizontal.
- Verificação visual no browser: os grupos são legíveis e responsivos.

## Aceitação

As habilidades são exibidas de forma clara e responsiva, agrupadas por categoria, sem classificações inventadas.

## Checklist de clareza

- Objetivo único e verificável — ATENDE
- Arquivos afetados — ATENDE
- Entregáveis concretos — ATENDE
- Contrato de entrada, saída e erros — ATENDE (entrada: `src/data/skills.ts`; saída: grupos de habilidades renderizados; erros: lista vazia apresenta estado vazio, sem erro)
- Testes obrigatórios — ATENDE
- Critério de aceitação objetivo — ATENDE
- Dependências declaradas explicitamente — ATENDE
- Ausência de decisões pendentes para o implementador — ATENDE
