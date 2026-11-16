# TASK-009 — Preencher o conteúdo real do portfólio

- Change: 001-portfolio-mvp
- Status: PENDING
- Depende de: TASK-005, TASK-006, TASK-007, TASK-008
- Início: —
- Verificação: PENDING
- Evidência: —
- Plano de ação: none

## Objetivo

Substituir o conteúdo vazio por informação real do utilizador, usando o inventário de `docs/conteudo-real.md`.

## Arquivos

- `src/content/profile.ts` (escrita)
- `src/content/projects.ts` (escrita)
- `src/content/skills.ts` (escrita)
- `public/images/` (fotografia)

## Entregáveis

- `src/content/profile.ts` preenchido com nome, função, resumo, fotografia e canais de contacto.
- `src/content/projects.ts` preenchido com os projetos reais, com tecnologias e links quando existirem.
- `src/content/skills.ts` preenchido com as habilidades reais, agrupadas por categoria.
- Fotografia real em `public/images/`, com o nome registado em `photoUrl`.
- Nenhum marcador de placeholder ou texto fictício na aplicação.

## Regras

- Não inventar projetos, experiência, tecnologias, links, certificações ou clientes.
- Não mencionar empresas anteriores nem histórico profissional.
- Não publicar contactos que o utilizador não queira tornar públicos.
- Não escrever níveis de profibilidade.
- Não editar `src/data/` nem os componentes: o conteúdo entra apenas por `src/content/`.
- A fotografia respeita os requisitos de `docs/conteudo-real.md`, secção 6.
- Se o `foto-perfil.png` de 1,8 MB for mantido, convertê-lo para `.webp` ou removê-lo.

## Testes

- `pnpm lint`, `pnpm typecheck`, `pnpm test` e `pnpm build` passam.
- `pnpm test:e2e` passa nos três viewports.
- `src/test/content.test.tsx` confirma a ausência de placeholders.
- `src/test/accessibility.test.tsx` confirma ausência de violações automáticas.
- Verificação visual no browser: cada link de contacto, repositório e demonstração abre no destino correto e devolve 200.

## Aceitação

O portfólio apresenta informação real e verificável, sem nenhum texto fictício nem link inválido, e está pronto para publicação.

## Checklist de clareza

- Objetivo único e verificável — ATENDE
- Arquivos afetados — ATENDE
- Entregáveis concretos — ATENDE
- Contrato de entrada, saída e erros — ATENDE (entrada: informação fornecida pelo utilizador e `docs/conteudo-real.md`; saída: `src/content/` preenchido; erros: `icon` fora do conjunto permitido ou campos obrigatórios em falta falham no typecheck; links inválidos são detectados na verificação visual)
- Testes obrigatórios — ATENDE
- Critério de aceitação objetivo — ATENDE
- Dependências declaradas explicitamente — ATENDE
- Ausência de decisões pendentes para o implementador — ATENDE
