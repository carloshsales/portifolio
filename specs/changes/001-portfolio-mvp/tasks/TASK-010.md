# TASK-010 — Revisar responsividade e performance

- Change: 001-portfolio-mvp
- Status: PENDING
- Depende de: TASK-005, TASK-006, TASK-007, TASK-008
- Início: —
- Verificação: PENDING
- Evidência: —
- Plano de ação: none

## Objetivo

Confirmar e corrigir o comportamento responsivo e o desempenho da aplicação nos três viewports previstos, usando a automação já existente como base.

## Arquivos

- `e2e/responsive.spec.ts` (revisão e eventual ampliação)
- `e2e/playwright.config.ts` (revisão)
- `src/styles/` (revisão)
- `src/components/` e `src/sections/` (correções de layout, se necessárias)
- `public/images/` (otimização de imagens)

## Entregáveis

- Os testes responsivos automatizados cobrem celular, tablet e desktop.
- Não existe overflow horizontal em nenhum viewport.
- A navegação é utilizável em telas pequenas, com alvos de toque adequados.
- As imagens estão otimizadas e as fontes carregam de forma eficiente.
- Não existem dependências nem recursos desnecessários.

## Regras

- A verificação de overflow é feita pelo teste automatizado, não apenas por inspeção visual.
- A otimização da fotografia segue os requisitos de `docs/conteudo-real.md`, secção 6: quadrada, abaixo de 150 kB, `.webp` ou `.jpg`.
- O `public/images/foto-perfil.png` de 1,8 MB é comprimido ou removido.
- As fontes continuam a ser carregadas do Google Fonts, com `preconnect` já configurado.
- Nenhuma dependência de runtime é adicionada.
- O `pre-push` mantém o conjunto rápido; o `test:e2e` continua separado.

## Testes

- `pnpm lint`, `pnpm typecheck` e `pnpm test` passam.
- `pnpm build` gera o artefacto de produção.
- `pnpm test:e2e` passa nos três viewports.
- Teste negativo de overflow comprovado: introduzir largura fixa superior ao viewport, confirmar que o teste falha, e reverter.
- Verificação manual do peso dos ficheiros em `dist/`.

## Aceitação

A interface é utilizável nos tamanhos de tela previstos, sem overflow horizontal e sem problemas críticos de desempenho.

## Checklist de clareza

- Objetivo único e verificável — ATENDE
- Arquivos afetados — ATENDE
- Entregáveis concretos — ATENDE
- Contrato de entrada, saída e erros — ATENDE (entrada: o build de produção servido em `http://127.0.0.1:4173`; saída: resultado por viewport; erros: overflow ou elemento invisível faz o teste falhar com o valor medido)
- Testes obrigatórios — ATENDE
- Critério de aceitação objetivo — ATENDE
- Dependências declaradas explicitamente — ATENDE
- Ausência de decisões pendentes para o implementador — ATENDE
