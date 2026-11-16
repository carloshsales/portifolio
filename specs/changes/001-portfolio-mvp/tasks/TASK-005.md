# TASK-005 — Implementar seção inicial

- Change: 001-portfolio-mvp
- Status: PENDING
- Depende de: TASK-004
- Início: —
- Verificação: PENDING
- Evidência: —
- Plano de ação: none

## Objetivo

Revisar e completar a seção inicial: apresentação profissional, integração da fotografia e chamadas para a ação, com a identidade visual aprovada.

## Arquivos

- `src/sections/Home/Home.tsx` (revisão)
- `src/sections/Home/Home.module.css` (revisão)
- `src/components/Sidebar.tsx` (revisão)
- `src/components/Sidebar.module.css` (revisão)
- `src/content/profile.ts` (leitura dos dados; sem escrita)

## Entregáveis

- A seção inicial apresenta o nome, a função, o resumo e a fotografia a partir de `src/content/profile.ts`.
- A fotografia é exibida em moldura circular, com texto alternativo descritivo.
- As chamadas para a ação direcionam para as secções existentes e só aparecem quando há conteúdo.
- A barra lateral apresenta a identidade e navega entre as quatro secções.
- Nenhum texto fictício é renderizado.

## Regras

- **Não editar `src/content/profile.ts`** nesta tarefa. O preenchimento do conteúdo real é feito à parte, com base em `docs/conteudo-real.md`.
- A seção lê de `src/data/`, nunca de `src/content/` directamente.
- A moldura circular e as proporções da fotografia são mantidas.
- O texto alternativo da fotografia descreve a pessoa, não a imagem: `Fotografia de <nome>`.
- A secção funciona com conteúdo vazio, ocultando o resumo e as ações.

## Testes

- `pnpm lint`, `pnpm typecheck` e `pnpm test` passam.
- `src/test/content.test.tsx` confirma que não há marcadores de placeholder renderizados.
- `src/test/accessibility.test.tsx` confirma ausência de violações automáticas.
- `pnpm test:e2e` confirma que a fotografia tem caixa de tamanho não nula nos três viewports.
- Verificação visual no browser: a identidade aparece correctly e a moldura circular não corta o rosto.

## Aceitação

A seção inicial apresenta a identidade sem texto fictício, a fotografia está integrada e otimizada, e a navegação funciona por teclado.

## Checklist de clareza

- Objetivo único e verificável — ATENDE
- Arquivos afetados — ATENDE
- Entregáveis concretos — ATENDE
- Contrato de entrada, saída e erros — ATENDE (entrada: `src/data/profile.ts`; saída: secção inicial renderizada; erros: conteúdo vazio não causa erro, oculta o resumo e as ações)
- Testes obrigatórios — ATENDE
- Critério de aceitação objetivo — ATENDE
- Dependências declaradas explicitamente — ATENDE
- Ausência de decisões pendentes para o implementador — ATENDE
