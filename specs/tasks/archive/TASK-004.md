# TASK-004 — Criar estrutura de navegação

- **ID:** TASK-004
- **Título:** Criar estrutura de navegação
- **Status:** ARCHIVED
- **Origem:** 001-portfolio-mvp
- **Criada em:** 2026-11-12
- **Depende de:** TASK-001, TASK-002, TASK-003
- **Bloqueios:** nenhum
- **Aprovada em:** 2026-11-13
- **Arquivada em:** 2026-11-13

## 1. Objetivo

Implementar a navegação do portfólio: uma seção por vez em tela cheia, com barra inferior em mobile, barra lateral em desktop, rolagem interna com barra virtual e sem barra nativa de rolagem.

## 2. Contexto

O MVP é one-page com seis seções (Início, Projetos, Jogos, Artigos, Experimentos, Contato). A navegação é a espinha dorsal do layout. A página não deve ter barra nativa de rolagem: cada seção ocupa a viewport e rola internamente, com barra virtual quando o conteúdo excede a tela. Rolar dentro de uma seção não passa para outra.

## 3. Escopo

### Incluído
- Barra inferior fixa em mobile, com ícones e título menor.
- Barra lateral em desktop, com texto.
- Botões para as seis seções, com estado ativo.
- Uma seção por vez, em tela cheia.
- Rolagem interna a cada seção.
- Barra de rolagem virtual (sem barra nativa).
- Placeholders das seções.

### Excluído
- Indicador de seção ativa por rolagem (ver TASK-016).
- Implementação do conteúdo das seções.
- Animações complexas.
- Alternância de tema claro/escuro.

## 4. Comportamento esperado

- Clicar em um botão do menu troca a seção exibida.
- A seção ativa é destacada no menu.
- Apenas uma seção é exibida por vez.
- A página não rola nativamente.
- Se a seção tiver mais conteúdo que a viewport, aparece uma barra virtual.
- Rolar dentro da seção não passa para outra.
- O foco é visível.

## 5. Critérios de aceitação

- [x] Seis botões presentes no menu.
- [x] Clicar em um botão troca a seção.
- [x] A seção ativa é destacada.
- [x] Apenas uma seção visível por vez.
- [x] A página não tem barra nativa de rolagem.
- [x] A seção rola internamente quando o conteúdo excede a viewport.
- [x] A barra de rolagem é virtual, não nativa.
- [x] Rolar dentro da seção não passa para outra.
- [x] O foco é visível.
- [x] A navegação funciona por teclado.

## 6. Requisitos e restrições técnicas

React, TypeScript strict, CSS Modules, tokens aprovados, WCAG 2.2 AA, sem dependências novas.

## 7. Arquivos e módulos envolvidos

- `src/components/Navigation.tsx`
- `src/components/Navigation.module.css`
- `src/components/Navigation.test.tsx`
- `src/components/NavIcon.tsx`
- `src/components/Section.tsx`
- `src/components/Section.module.css`
- `src/components/Section.test.tsx`
- `src/App.tsx`
- `src/App.module.css`
- `src/App.test.tsx`
- `src/styles/globals.css`
- `src/test/setup.ts`
- `src/sections/Home/Home.tsx` (placeholder)
- `src/sections/Projects/Projects.tsx` (placeholder)
- `src/sections/Games/Games.tsx` (placeholder)
- `src/sections/Articles/Articles.tsx` (placeholder)
- `src/sections/Experiments/Experiments.tsx` (placeholder)
- `src/sections/Contact/Contact.tsx` (placeholder)

## 8. Estratégia de testes e validação

Obrigatório:
- Testes de renderização e troca de seção.
- Teste de estado ativo.
- Teste de rolagem interna e barra virtual.
- Verificação manual de responsividade (mobile, tablet, desktop).
- Verificação manual de `prefers-reduced-motion`.
- Verificação no browser da ausência de barra nativa.

Critérios de conclusão: todos os testes automatizados passam e as verificações manuais são registradas.

## 9. Riscos e dúvidas

- Os placeholders serão substituídos pelas tarefas de conteúdo (TASK-005 a TASK-008, TASK-013 a TASK-015).
- A barra inferior não deve sobrepor o conteúdo.
- A barra virtual depende de `ResizeObserver`; há um mock nos testes.

## 10. Avaliação de clareza

| # | Critério | Pontos | Evidência |
|---|---:|---:|---|
| 1 | Objetivo e resultado esperado | 10 | Seção 1 |
| 2 | Contexto e problema | 9 | Seção 2 descreve o estado atual |
| 3 | Delimitação do escopo | 10 | Seções 3.1 e 3.2 |
| 4 | Comportamento esperado | 9 | Seção 4 |
| 5 | Critérios de aceitação verificáveis | 10 | Seção 5 |
| 6 | Requisitos e restrições técnicas | 9 | Seção 6 |
| 7 | Dependências | 10 | Tarefas concluídas |
| 8 | Arquivos ou módulos envolvidos | 10 | Seção 7 confirmada |
| 9 | Estratégia de testes e validação | 9 | Seção 8 com critérios de conclusão |
| 10 | Exclusões e riscos conhecidos | 9 | Seções 3.2 e 9 |
| | **Total** | **95** | |

- **Critérios obrigatórios (1, 3, 5):** 10, 10, 10 — atendidos.
- **Contradições / decisões em aberto:** nenhuma.
- **Resultado:** 95/100 → **APTA**.
- **O que falta para 90:** nada.

### Perguntas de refinamento

| # | Critério | Pergunta | Resposta | Data |
|---|---|---|---|---|
| 1 | 3/4 | Seções inexistentes | Placeholders vazios | 2026-11-13 |
| 2 | 4 | Seção ativa | Não implementar agora (TASK-016) | 2026-11-13 |
| 3 | 4 | Menu mobile | Barra inferior fixa | 2026-11-13 |
| 4 | 8 | Arquivos | Componente separado (Navigation) | 2026-11-13 |
| 5 | 9 | Verificação | Testes + verificação manual | 2026-11-13 |

### Correção de direção (2026-11-13)

Após a primeira implementação, o usuário pediu correção:

- A barra vertical nativa não deve existir.
- Uma seção por vez, em tela cheia.
- Rolagem interna com barra virtual.
- Rolar não passa para outra seção.

A correção foi aplicada e verificada.

## 11. Aprovação humana

- [x] Aprovada
- **Aprovada por:** usuário
- **Data:** 2026-11-13
- **Observações:** Aprovada para início da implementação.

## 12. Evidências de implementação e validação

| Data | Verificação | Comando | Resultado | Evidência |
|---|---|---|---|---|
| 2026-11-13 | lint | `pnpm lint` | aprovado | exit 0 |
| 2026-11-13 | typecheck | `pnpm typecheck` | aprovado | exit 0 |
| 2026-11-13 | testes | `pnpm test` | 9 testes aprovados (3 arquivos) | exit 0 |
| 2026-11-13 | build | `pnpm build` | aprovado | exit 0 |
| 2026-11-13 | formatação | `pnpm format:check` | aprovado | exit 0 |
| 2026-11-13 | browser desktop | sidebar 240px, uma seção, sem scroll de página | aprovado | viewport 1126px |
| 2026-11-13 | browser mobile | barra inferior 4rem, uma seção | aprovado | viewport 976px |
| 2026-11-13 | browser mobile | ícones visíveis, título 12px, barra 72px, sem scroll de página | aprovado | iframe 371px |
| 2026-11-13 | barra virtual | aparece com overflow e some sem overflow | aprovado | opacity inline 0 → 1 |
| 2026-11-13 | troca de seção | clique troca a seção e o estado ativo | aprovado | inicio → projetos |
| 2026-11-13 | acessibilidade | Lighthouse | 100% acessibilidade | — |
| 2026-11-13 | verificação humana | revisão do usuário | aprovada | VERIFIED |

## 13. Histórico

### Modificações

| Data | Motivo | Alterações |
|---|---|---|
| 2026-11-13 | Refinamento | Status `DRAFT` → `CLARIFICATION`; 5 perguntas registradas |
| 2026-11-13 | Respostas | Placeholders, barra inferior, componente `Navigation`, verificação manual; seção ativa excluída (TASK-016) |
| 2026-11-13 | Reavaliação | 89 → 95/100; status `READY` |
| 2026-11-13 | Aprovação humana | Status `READY` → `IN_PROGRESS` |
| 2026-11-13 | Implementação inicial | Navegação, placeholders e testes criados |
| 2026-11-13 | Correção de direção | Sem barra nativa; uma seção por vez; rolagem interna com barra virtual; `Section` criado |
| 2026-11-13 | Correção de navegação | Barra inferior com ícones e título menor em mobile/tablet; `NavIcon` criado |
| 2026-11-13 | Verificação | Status `REVIEW` → `VERIFIED` → `ARCHIVED` |
| 2026-11-14 | Ajuste pós-arquivamento | Ícones também no menu lateral (desktop), a pedido do usuário |

### Eventos

| Data | Evento | Detalhe |
|---|---|---|
| 2026-11-12 | Criada | Change 001 |
| 2026-11-13 | Migrada | `specs/tasks/active/TASK-004.md` |
| 2026-11-13 | Avaliada | 89/100 — não apta |
| 2026-11-13 | Corrigida | Direção de rolagem alterada pelo usuário |
| 2026-11-14 | Ajuste | Ícones no menu lateral |
