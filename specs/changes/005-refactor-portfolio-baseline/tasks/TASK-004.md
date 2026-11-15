# TASK-004 — Automatizar a verificação de responsividade

- Change: 005-refactor-portfolio-baseline
- Status: PENDING
- Depende de: TASK-002
- Início: —
- Verificação: PENDING
- Evidência: —
- Plano de ação: none

## Objetivo

Automatizar a verificação de responsividade sobre o build de produção, cobrindo celular, tablet e desktop, para que overflow horizontal e navegação quebrada sejam detetados automaticamente.

## Arquivos

- `package.json` (dependência de desenvolvimento e scripts `test:e2e` e `test:all`)
- `e2e/playwright.config.ts` (criação)
- `e2e/responsive.spec.ts` (criação)
- `.gitignore` (ajuste para artefactos do Playwright)

## Entregáveis

- `@playwright/test` instalado como dependência de desenvolvimento.
- `e2e/playwright.config.ts` com três projetos: `mobile` (375x812), `tablet` (768x1024) e `desktop` (1440x900).
- Servidor de preview configurado no `webServer`, a correr sobre `pnpm preview` na porta 4173.
- Teste de ausência de overflow horizontal em todos os viewports.
- Teste de visibilidade dos quatro links de navegação em todos os viewports.
- Teste de presença da fotografia com caixa de tamanho não nula.
- Teste de integridade dos links de contacto, sem `href` vazio ou `javascript:`.
- Scripts `test:e2e` e `test:all` no `package.json`.
- Diretório de artefactos do Playwright ignorado pelo Git.

## Regras

- O teste corre contra o build de produção, nunca contra o servidor de desenvolvimento.
- Nenhuma dependência de rede externa.
- As animações são desativadas no contexto de teste para eliminar instabilidade.
- Os seletores usam papéis e `href`, sem depender de cor ou de classe CSS.
- O `test:e2e` é separado de `test`; o hook `pre-push` mantém apenas o conjunto unitário rápido.
- `pnpm build` tem de ter corrido antes do `pnpm test:e2e`.
- Nenhuma dependência de runtime nova.

## Testes

- `pnpm build` seguido de `pnpm test:e2e` passa nos três viewports.
- Teste negativo: introduzir largura fixa maior que o viewport, confirmar que o teste de overflow falha, e reverter.
- `pnpm lint`, `pnpm typecheck` e `pnpm test` passam.

## Aceitação

O Playwright está instalado, `pnpm test:e2e` passa nos três viewports sobre o build de produção e foi comprovado que deteta overflow horizontal.

## Checklist de clareza

- Objetivo único e verificável — ATENDE
- Arquivos afetados — ATENDE
- Entregáveis concretos — ATENDE
- Contrato de entrada, saída e erros — ATENDE (entrada: o build de produção servido em `http://127.0.0.1:4173`; saída: resultado por viewport; erros: overflow ou elemento invisível faz o teste falhar com o valor medido)
- Testes obrigatórios — ATENDE
- Critério de aceitação objetivo — ATENDE
- Dependências declaradas explicitamente — ATENDE
- Ausência de decisões pendentes para o implementador — ATENDE
