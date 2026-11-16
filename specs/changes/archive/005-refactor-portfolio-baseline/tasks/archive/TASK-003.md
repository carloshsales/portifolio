# TASK-003 — Automatizar a verificação de acessibilidade

- Change: 005-refactor-portfolio-baseline
- Status: ARCHIVED
- Depende de: TASK-002
- Início: 2026-11-15
- Verificação: VERIFIED (2026-11-15) — vitest-axe 0.1.0 instalado como dependencia de desenvolvimento; src/test/accessibility.test.tsx criado com 2 testes (aplicacao completa e cada seccao isolada); aplicacao atual sem violacoes - 20 regras passam, 0 violacoes, 1 incomplete; teste negativo provado com img sem alt, que devolveu violacao 'image-alt' critical e fez o teste falhar; verificado que alt vazio em imagem decorativa nao e violacao; aviso 'Not implemented: HTMLCanvasElement getContext' e limitacao conhecida do jsdom e nao afeta o resultado; verificado manual continua necessario para foco visivel, contraste real, ordem de leitura em leitor de ecra e operacao por teclado; pnpm lint, pnpm format:check, pnpm typecheck, pnpm test (134 passando, 1 pulado) e pnpm build aprovados
- Evidência: vitest-axe 0.1.0 instalado como dependencia de desenvolvimento; src/test/accessibility.test.tsx criado com 2 testes (aplicacao completa e cada seccao isolada); aplicacao atual sem violacoes - 20 regras passam, 0 violacoes, 1 incomplete; teste negativo provado com img sem alt, que devolveu violacao 'image-alt' critical e fez o teste falhar; verificado que alt vazio em imagem decorativa nao e violacao; aviso 'Not implemented: HTMLCanvasElement getContext' e limitacao conhecida do jsdom e nao afeta o resultado; verificado manual continua necessario para foco visivel, contraste real, ordem de leitura em leitor de ecra e operacao por teclado; pnpm lint, pnpm format:check, pnpm typecheck, pnpm test (134 passando, 1 pulado) e pnpm build aprovados
- Plano de ação: none
- Arquivada em: 2026-11-15

## Objetivo

Substituir a verificação manual de acessibilidade por um teste automatizado que falha o `pnpm test` sempre que existir violação WCAG 2.2 A/AA detetável automaticamente.

## Arquivos

- `package.json` (dependência de desenvolvimento e eventual script)
- `src/test/accessibility.test.tsx` (criação)
- `src/test/setup.ts` (alteração, se necessário)

## Entregáveis

- `vitest-axe` instalado como dependência de desenvolvimento, sem dependência de runtime.
- Teste `src/test/accessibility.test.tsx` que renderiza `App` e afirma que `results.violations` é vazio.
- Demonstração de que o teste falha quando uma violação é introduzida, com o resultado registado na evidência.
- Inventário das violações que a automação não cobre, registado como verificação manual na evidência da task.

## Regras

- Usar `axe-core` através de `vitest-axe`.
- Não desativar regras com `disableOtherRules`; a lista padrão é a usada.
- O teste corre no ambiente jsdom já configurado.
- Nenhuma regra é removida para o teste passar: se houver violação real, corrigir o componente.
- Não alterar `src/` além do necessário para eliminar violações reais.
- Nenhuma dependência de runtime nova.

## Testes

- `pnpm test` passa com o teste de acessibilidade incluído.
- Teste negativo: introduzir temporariamente uma violação real, confirmar que `pnpm test` falha, e reverter a alteração.
- `pnpm lint`, `pnpm typecheck` e `pnpm build` passam.

## Aceitação

O teste de acessibilidade está em `pnpm test`, passa na aplicação atual, e foi comprovado que falha quando há violação.

## Checklist de clareza

- Objetivo único e verificável — ATENDE
- Arquivos afetados — ATENDE
- Entregáveis concretos — ATENDE
- Contrato de entrada, saída e erros — ATENDE (entrada: a aplicação renderizada; saída: lista de violações, vazia quando conforme; erros: violação faz o teste falhar com o detalhe da regra)
- Testes obrigatórios — ATENDE
- Critério de aceitação objetivo — ATENDE
- Dependências declaradas explicitamente — ATENDE
- Ausência de decisões pendentes para o implementador — ATENDE
