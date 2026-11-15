# TASK-005 — Implementar seção inicial

- **ID:** TASK-005
- **Título:** Implementar seção inicial
- **Status:** VERIFIED
- **Origem:** 001-portfolio-mvp
- **Criada em:** 2026-11-12
- **Depende de:** TASK-004
- **Bloqueios:** nenhum
- **Aprovada em:** 2026-11-14
- **Arquivada em:** —

## 1. Objetivo

Implementar a seção Início com apresentação profissional, fotografia e habilidades/tecnologias.

## 2. Contexto

A seção inicial é o primeiro contato do visitante. Deve apresentar o profissional e suas competências sem inventar informações.

### Conteúdo fornecido (2026-11-14)

- **Nome:** Carlos Henrique
- **Cargo:** Desenvolvedor Full Stack - IA Specs
- **Bio:** Sou desenvolvedor de software com foco em aplicações web, utilizando React, TypeScript e Supabase. Tenho experiência com ferramentas modernas como Cursor, OpenCode e OpenSpec, aplicando orquestração de IA para otimizar o desenvolvimento, estruturar soluções e elevar a qualidade do código. Busco unir tecnologia, pensamento analítico e aprendizado contínuo para transformar ideias em produtos digitais eficientes, escaláveis e bem construídos.
- **Fotografia:** original `foto-perfil.png` (1254×1254, 1,85 MB) → otimizada para `public/images/foto-perfil.webp` (480×480, 13,4 KB)
- **Links:** LinkedIn https://www.linkedin.com/in/carloshsales/ · GitHub https://github.com/carloshsales · E-mail carlosh.sales@outlook.com
- **CTAs:** "Ver projetos" e "Entrar em contato"
- **Habilidades/tecnologias:**
  - **Frontend:** React, TypeScript
  - **Backend/Dados:** Supabase
  - **Ferramentas:** Cursor, OpenCode, OpenSpec

## 3. Escopo

### Incluído
- Apresentação profissional.
- Fotografia pessoal com moldura circular.
- Habilidades e tecnologias.
- Chamadas para ação.

### Excluído
- Conteúdo inexistente ou inventado.
- Seção separada de habilidades.

## 4. Comportamento esperado

- A apresentação é exibida de forma responsiva.
- A fotografia aparece com moldura circular.
- As habilidades são listadas por categoria.
- As chamadas para ação trocam a seção ativa: "Ver projetos" → `projetos`; "Entrar em contato" → `contato`.
- A navegação por CTAs segue o mesmo mecanismo do menu (estado em `App`), sem âncoras.

## 5. Critérios de aceitação

- [x] Apresentação responsiva, sem overflow horizontal.
- [x] Nome, cargo e bio exibidos com o conteúdo fornecido.
- [x] Fotografia integrada com moldura circular, texto alternativo acessível e arquivo otimizado.
- [x] Habilidades exibidas por categoria.
- [x] CTAs "Ver projetos" e "Entrar em contato" trocam a seção ativa.
- [x] Sem informações inventadas.

## 6. Requisitos e restrições técnicas

React, TypeScript strict, CSS Modules, tokens aprovados, WCAG 2.2 AA.

## 7. Arquivos e módulos envolvidos

- `src/sections/Home/Home.tsx` (novo)
- `src/sections/Home/Home.module.css` (novo)
- `src/data/profile.ts` (novo)
- `src/data/skills.ts` (novo)
- `src/sections/Home/Home.test.tsx` (novo)

## 8. Estratégia de testes e validação

Testes automatizados (Vitest + Testing Library) em `src/sections/Home/Home.test.tsx`:

- Renderização de nome, cargo, bio, fotografia (com alt) e habilidades por categoria.
- CTAs "Ver projetos" e "Entrar em contato" trocam a seção ativa.

Comandos de verificação: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm format:check`.

Verificação manual: responsividade (mobile, tablet, desktop), foco visível e `prefers-reduced-motion`.

## 9. Riscos e dúvidas

- A fotografia original (1,85 MB) precisa ser otimizada para não comprometer o carregamento.
- As CTAs dependem do estado de navegação em `App`; a tarefa ajusta a passagem do callback.

## 10. Avaliação de clareza

| # | Critério | Pontos | Evidência |
|---|---:|---:|---|
| 1 | Objetivo e resultado esperado | 10 | Seção 1 |
| 2 | Contexto e problema | 9 | Seção 2 com conteúdo fornecido |
| 3 | Delimitação do escopo | 10 | Seções 3.1 e 3.2 |
| 4 | Comportamento esperado | 9 | Seção 4 com navegação das CTAs definida |
| 5 | Critérios de aceitação verificáveis | 10 | Seção 5 |
| 6 | Requisitos e restrições técnicas | 8 | Seção 6 |
| 7 | Dependências | 10 | TASK-004 ARCHIVED |
| 8 | Arquivos ou módulos envolvidos | 9 | Seção 7 |
| 9 | Estratégia de testes e validação | 9 | Seção 8 com comandos e verificações manuais |
| 10 | Exclusões e riscos conhecidos | 9 | Seções 3.2 e 9 |
| | **Total** | **93** | |

- **Critérios obrigatórios (1, 3, 5):** 10, 10, 10 — atendidos.
- **Contradições / decisões em aberto:** nenhuma.
- **Resultado:** 93/100 → **APTA**.
- **O que falta para 90:** nada.

### Perguntas de refinamento

| # | Critério | Pergunta | Resposta | Data |
|---|---|---|---|---|
| 1 | 10 | Qual a lista de habilidades/tecnologias e como categorizar? | Frontend: React, TypeScript; Backend/Dados: Supabase; Ferramentas: Cursor, OpenCode, OpenSpec | 2026-11-14 |
| 2 | 4 | Como as CTAs devem navegar, dado que a navegação é por estado (não âncoras)? | Trocar a seção ativa via callback de `App` | 2026-11-14 |
| 3 | 9 | Quais verificações e testes executar e registrar? | lint, typecheck, test, build, format:check + verificação manual de responsividade | 2026-11-14 |
| 4 | 2 | Confirmar o texto do cargo "Desenvolvedor Full Stack - IA Specs". | Confirmado | 2026-11-14 |

## 11. Aprovação humana

- [x] Aprovada
- **Aprovada por:** usuário
- **Data:** 2026-11-14
- **Observações:** Aprovada para início da implementação.

## 12. Evidências de implementação e validação

| Data | Verificação | Comando | Resultado | Evidência |
|---|---|---|---|---|
| 2026-11-14 | lint | `pnpm lint` | aprovado | exit 0 |
| 2026-11-14 | typecheck | `pnpm typecheck` | aprovado | exit 0 |
| 2026-11-14 | testes | `pnpm test` | 15 testes aprovados (4 arquivos) | exit 0 |
| 2026-11-14 | build | `pnpm build` | aprovado | exit 0 |
| 2026-11-14 | formatação | `pnpm format:check` | aprovado | exit 0 |
| 2026-11-14 | browser desktop | seção Início renderizada, foto 480×480, sem overflow horizontal | aprovado | viewport 1126px |
| 2026-11-14 | browser mobile | sem overflow horizontal, foto 160px, botões adaptados | aprovado | iframe 375px (viewport 371px) |
| 2026-11-14 | browser | CTAs trocam a seção ativa | aprovado | `projetos` e `contato` |
| 2026-11-14 | acessibilidade | Lighthouse | 100% acessibilidade, 100% best practices | SEO 60% (meta description fora do escopo) |
| 2026-11-14 | imagem | WebP 480×480 | 13,4 KB (de 1,85 MB) | `public/images/foto-perfil.webp` |
| 2026-11-14 | revisão humana | revisão do usuário | aprovada | VERIFIED |
| 2026-11-14 | revisão de layout | itens redimensionados; sem rolagem vertical em 375×600, 375×650, 768×700, 1366×768 e 1920×1080 | aprovado | `Home.module.css`, `Section.module.css` |

## 13. Histórico

| Data | Evento | Detalhe |
|---|---|---|
| 2026-11-12 | Criada | Change 001 (com conteúdo da antiga TASK-007) |
| 2026-11-13 | Migrada | `specs/tasks/active/TASK-005.md` |
| 2026-11-14 | Refinamento | Status `DRAFT` → `CLARIFICATION`; conteúdo inicial registrado; 4 perguntas elaboradas |
| 2026-11-14 | Respostas | Habilidades, navegação das CTAs, verificações e cargo confirmados |
| 2026-11-14 | Reavaliação | 87 → 93/100; status `CLARIFICATION` → `READY` |
| 2026-11-14 | Aprovação humana | Status `READY` → `IN_PROGRESS` |
| 2026-11-14 | Implementação | `profile.ts`, `skills.ts`, `Home.tsx`, `Home.module.css`, `Home.test.tsx`, ajuste em `App.tsx`, foto otimizada |
| 2026-11-14 | Verificação | Status `IN_PROGRESS` → `REVIEW`; evidências registradas |
| 2026-11-14 | Revisão humana | Status `REVIEW` → `VERIFIED`; tarefa pronta para arquivar |
| 2026-11-14 | Revisão de layout | Usuário pediu ausência de rolagem vertical; itens compactados, layout em 2 colunas no desktop e padding da seção 64→32px |
