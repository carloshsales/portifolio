# TASK-004 — Criar estrutura de navegação

- Change: 001-portfolio-mvp
- Status: PENDING
- Depende de: TASK-003
- Início: —
- Verificação: PENDING
- Evidência: —
- Plano de ação: none

## Objetivo

Verificar e consolidar a estrutura de navegação: barra lateral com navegação por âncoras para as quatro secções, adaptação a dispositivos móveis, estados ativo, hover e foco, e operação integral por teclado.

## Contexto

Esta tarefa foi originalmente escrita para implementar a navegação. Ela já está implementada no repositório, introduzida no commit inicial `3a1f9eb` e consolidada durante a change `005-refactor-portfolio-baseline` (arquivada), onde foi verificada automaticamente em acessibilidade e responsividade.

Esta tarefa passa portanto a ser de **revisão e consolidação**, e não de implementação.

## Arquivos

- `src/components/Sidebar.tsx` (revisão)
- `src/components/Sidebar.module.css` (revisão)
- `src/components/icons.tsx` (revisão)
- `src/hooks/useActiveSection.ts` (revisão)
- `src/App.tsx` (revisão da composição e do link de salto)

## Entregáveis

- A barra lateral apresenta a identidade e navega entre as quatro secções: Início, Projetos, Habilidades e Contato.
- A navegação usa âncoras internas para os identificadores `inicio`, `projetos`, `habilidades` e `contato`.
- O item da secção visível é marcado com `aria-current="true"` e com o estilo de estado ativo.
- Os estados de hover e de foco estão definidos e são visíveis.
- A navegação é operável por teclado, pela ordem natural de tabulação.
- Em ecrãs com menos de 1024px, a navegação adapta-se a uma barra inferior horizontal, sem sobrepor o conteúdo.
- Em ecrãs a partir de 1024px, a barra lateral fica fixa à esquerda com 300px de largura.
- A aplicação disponibiliza um link "Saltar para o conteúdo" que move o foco para `<main>`.
- Os ícones são consistentes e decorativos, sem duplicar a informação textual do link.

## Regras

- **Não recriar** a navegação. Revisar e consolidar apenas.
- A navegação é feita por âncoras, sem biblioteca de rotas e sem router.
- Os identificadores das secções têm de corresponder aos usados por `src/sections/*/`.
- `useActiveSection` degrada com segurança quando o ambiente não suporta `IntersectionObserver`, recorriendo à primeira secção.
- O `rootMargin` do `IntersectionObserver` é afinado para que o destaque não mude com micro deslocamentos do scroll.
- Não alterar `src/content/`. O conteúdo real é preenchido na TASK-009.
- A navegação não introduz dependências novas.

## Testes

- `pnpm lint`, `pnpm typecheck` e `pnpm test` passam.
- `src/test/accessibility.test.tsx` confirma ausência de violações automáticas na navegação.
- `pnpm test:e2e` confirma a navegação funcional nos três viewports (375px, 768px e 1280px).
- Verificação por teclado: o tabulador percorre os quatro links de navegação e o foco é sempre visível.
- Verificação no browser: sem rolagem horizontal em 375px, 768px e 1280px.
- Verificação no browser: o link "Saltar para o conteúdo" move o foco para o conteúdo principal.

## Aceitação

A navegação é funcional em desktop, tablet e celular, operável por teclado, com estado ativo correto, foco visível e sem rolagem horizontal indesejada.

## Checklist de clareza

- Objetivo único e verificável — ATENDE (revisão e consolidação da navegação já existente)
- Arquivos afetados — ATENDE
- Entregáveis concretos — ATENDE
- Contrato de entrada, saída e erros — ATENDE (entrada: secções registadas com os identificadores `inicio`, `projetos`, `habilidades` e `contato`; saída: navegação funcional e acessível; erros: secção inexistente não é observada e `useActiveSection` devolve a primeira secção)
- Testes obrigatórios — ATENDE
- Critério de aceitação objetivo — ATENDE
- Dependências declaradas explicitamente — ATENDE
- Ausência de decisões pendentes para o implementador — ATENDE
