# TASK-002 — Configurar qualidade e Git Hooks

- Change: 001-portfolio-mvp
- Status: PENDING
- Depende de: TASK-001
- Início: —
- Verificação: PENDING
- Evidência: —
- Plano de ação: none

## Objetivo

Verificar e consolidar a cadeia de qualidade do projeto: ESLint, Vitest com Testing Library, Husky com hooks `pre-commit` e `pre-push`, e a centralização dos comandos no `package.json`, garantindo que bloqueiam operações quando uma verificação falha.

## Contexto

Esta tarefa foi originalmente escrita para instalar e configurar a ferramenta de qualidade. Ela já está instalada e configurada no repositório, introduzida no commit inicial `3a1f9eb` e consolidada durante a change `005-refactor-portfolio-baseline` (arquivada).

Esta tarefa passa portanto a ser de **revisão e consolidação**, e não de instalação.

## Arquivos

- `package.json` (revisão dos scripts e da configuração do `lint-staged`)
- `eslint.config.js` (revisão)
- `vite.config.ts` (revisão do bloco `test`)
- `src/test/setup.ts` (revisão)
- `.husky/pre-commit` (revisão)
- `.husky/pre-push` (revisão)
- `.husky/_/` (revisão da instalação gerada do Husky)

## Entregáveis

- `pnpm lint` executa o ESLint sobre todo o projeto e não reporta erros.
- `pnpm typecheck` executa a verificação de tipos do TypeScript.
- `pnpm test` executa a suíte Vitest em ambiente `jsdom`, com os testes de `src/test/` e `src/**/*.test.tsx`.
- `pnpm test:e2e` executa a suíte Playwright a partir de `e2e/playwright.config.ts`.
- O hook `pre-commit` executa `lint-staged`, que aplica ESLint e Prettier aos ficheiros preparados no commit.
- O hook `pre-push` executa `pnpm typecheck`, `pnpm test` e `pnpm build`, bloqueando o push quando alguma falha.
- Todos os comandos estão centralizados em `package.json` e são invocáveis manualmente, sem depender dos hooks.

## Regras

- **Não reinstalar** ESLint, Vitest, Testing Library, Husky ou Playwright. Revisar e consolidar apenas.
- **Não remover** nenhum script de `package.json`. Cada hook tem de corresponder a um script definido no `package.json`, sem duplicação de comandos.
- O `core.hooksPath` do Git tem de apontar para `.husky/_`, e o valor tem de sobreviver a commits e trocas de branch.
- **Não usar** `--no-verify` como prática normal para contornar verificações.
- Os hooks locais complementam, mas não substituem, a integração contínua definida em `.github/workflows/`.
- Nenhuma configuração de Quality Gate é adicionada para além do que o design aprovado prevê.

## Testes

- `pnpm lint` passa sem erros.
- `pnpm typecheck` passa sem erros.
- `pnpm test` passa com a totalidade da suíte.
- `pnpm test:e2e` passa nos três viewports.
- `pnpm format:check` passa.
- `git config core.hooksPath` devolve `.husky/_`.
- Os hooks executam corretamente quando invocados através do Git, e não apenas de forma manual.
- Um commit com um ficheiro com erro de lint é **bloqueado** pelo `pre-commit`.

## Aceitação

ESLint, Vitest, Testing Library e Husky estão configurados e funcionais, os hooks `pre-commit` e `pre-push` executam as verificações correspondentes e bloqueiam a operação quando falham, e todos os comandos estão centralizados no `package.json`.

## Checklist de clareza

- Objetivo único e verificável — ATENDE (revisão e consolidação da cadeia de qualidade já existente)
- Arquivos afetados — ATENDE
- Entregáveis concretos — ATENDE
- Contrato de entrada, saída e erros — ATENDE (entrada: ferramentas já instaladas; saída: verificações executáveis e hooks funcionais; erros: hook falha com código diferente de zero bloqueia o commit ou o push)
- Testes obrigatórios — ATENDE
- Critério de aceitação objetivo — ATENDE
- Dependências declaradas explicitamente — ATENDE
- Ausência de decisões pendentes para o implementador — ATENDE
