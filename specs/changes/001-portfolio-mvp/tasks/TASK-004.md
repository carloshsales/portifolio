# TASK-004 — Rever e corrigir a estrutura de navegação

- Change: 001-portfolio-mvp
- Status: COMPLETED
- Depende de: TASK-003
- Início: 2026-11-17
- Verificação: VERIFIED (2026-11-17) — pnpm test exit 0 166 passed 1 skipped 5 ficheiros; pnpm test:e2e exit 0 build aprovado 61 passed 2 skipped 63 testes. Avisos jsdom canvas nao bloqueantes.
- Evidência: pnpm test exit 0 166 passed 1 skipped 5 ficheiros; pnpm test:e2e exit 0 build aprovado 61 passed 2 skipped 63 testes. Avisos jsdom canvas nao bloqueantes.
- Plano de ação: none

## Objetivo

Rever e corrigir, apenas quando a verificação identificar um defeito, a estrutura de navegação existente: barra lateral com navegação por âncoras para as quatro secções, adaptação a dispositivos móveis, estados ativo, hover e foco, e operação integral por teclado. Se a implementação existente cumprir os critérios abaixo, não alterar o código de produção.

## Contexto

Esta tarefa foi originalmente escrita para implementar a navegação. Ela já está implementada no repositório, introduzida no commit inicial `3a1f9eb` e consolidada durante a change `005-refactor-portfolio-baseline` (arquivada), onde foi verificada automaticamente em acessibilidade e responsividade.

Esta tarefa passa portanto a ser de **revisão e consolidação**, e não de implementação.

## Arquivos

- `src/components/Sidebar.tsx` (revisão e correção, se necessária)
- `src/components/Sidebar.module.css` (revisão e correção, se necessária)
- `src/components/icons.tsx` (revisão e correção, se necessária)
- `src/hooks/useActiveSection.ts` (revisão e correção, se necessária)
- `src/App.tsx` (revisão e correção da composição e do link de salto, se necessária)
- `src/App.module.css` (revisão e correção do espaçamento da navegação, se necessária)
- `src/styles/globals.css` (revisão e correção do foco do link de salto, se necessária)
- `src/App.test.tsx` (revisão e ampliação dos testes da navegação, se necessária)
- `src/test/accessibility.test.tsx` (revisão e ampliação dos testes da navegação, se necessária)
- `e2e/responsive.spec.ts` (revisão e ampliação dos testes da navegação, se necessária)
- `e2e/playwright.config.ts` (revisão e correção do viewport, se necessária)

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
- O `rootMargin` do `IntersectionObserver` usa uma faixa de observação objetiva que só altera a secção ativa quando outra secção atravessa a faixa central de 5% da altura da viewport em cada extremidade; o destaque não muda com microdeslocamentos do scroll.
- Quando várias secções intersectam a faixa central, prevalece a secção mais próxima do topo do viewport; em empate, prevalece a que aparece antes no DOM.
- Se a verificação identificar um defeito fora dos ficheiros autorizados, registar a ocorrência e não alargar o âmbito sem aprovação do utilizador.
- Não alterar `src/content/`. O conteúdo real é preenchido na TASK-009.
- A navegação não introduz dependências novas.

## Testes

- `pnpm lint`, `pnpm typecheck` e `pnpm test` passam.
- `src/App.test.tsx` confirma que os quatro links possuem os hrefs `inicio`, `projetos`, `habilidades` e `contato` e que a secção ativa recebe `aria-current="true"`.
- `src/test/accessibility.test.tsx` confirma ausência de violações automáticas na navegação.
- `pnpm test:e2e` confirma, nos viewports de 375px, 768px e 1280px, que cada link navega para a secção correspondente, que `aria-current` acompanha a secção visível, que a secção ativa resulta do desempate definido quando várias secções intersectam a faixa central e que não existe rolagem horizontal.
- `pnpm test:e2e` confirma, nos viewports de 375px e 768px, que a barra inferior não cobre o conteúdo principal e que o último elemento do documento permanece acessível.
- A configuração E2E inclui explicitamente um projeto ou viewport de 1280px de largura, alinhado com o critério de aceitação.
- Verificação por teclado: o tabulador percorre o link de salto e os quatro links de navegação pela ordem natural, e o foco é sempre visível.
- Verificação no browser: o link "Saltar para o conteúdo" move o foco para o conteúdo principal.

## Aceitação

A navegação é funcional em desktop, tablet e celular, operável por teclado, com estado ativo correto, foco visível e sem rolagem horizontal indesejada. A verificação manual confirma a navegação por âncora, a atualização de `aria-current`, o foco do link de salto e a ausência de rolagem horizontal a 375px, 768px e 1280px.

## Checklist de clareza

- Objetivo único e verificável — ATENDE (revisão e consolidação da navegação já existente)
- Arquivos afetados — ATENDE
- Entregáveis concretos — ATENDE
- Contrato de entrada, saída e erros — ATENDE (entrada: secções registadas com os identificadores `inicio`, `projetos`, `habilidades` e `contato`; saída: navegação funcional e acessível; erros: secção inexistente não é observada e `useActiveSection` devolve a primeira secção)
- Testes obrigatórios — ATENDE
- Critério de aceitação objetivo — ATENDE
- Dependências declaradas explicitamente — ATENDE
- Ausência de decisões pendentes para o implementador — ATENDE
