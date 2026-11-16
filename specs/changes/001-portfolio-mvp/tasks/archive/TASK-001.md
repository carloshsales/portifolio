# TASK-001 — Inicializar aplicação

- Change: 001-portfolio-mvp
- Status: ARCHIVED
- Depende de: nenhuma
- Início: 2026-11-16
- Verificação: VERIFIED (2026-11-16) — pnpm typecheck, pnpm lint e pnpm test (134 passando, 1 pulado) aprovados; pnpm build gera dist/index.html e dist/assets/ em 275ms; pnpm dev responde HTTP 200 em http://localhost:5173 e pnpm preview responde HTTP 200 em http://localhost:4173; tsconfig.json com strict, noUnusedLocals, noUnusedParameters, noFallthroughCasesInSwitch e noUncheckedSideEffectImports; os 10 diretorios previstos (src/assets, components, sections, data, content, styles, types, test, hooks e public/images) existem; src/main.tsx monta em StrictMode e lanca erro explicito sem o elemento #root; src/types/index.ts declara Profile, Project, SkillGroup e SocialLink; corrigido core.hooksPath do Git, que estava corrompido para --version/_ por causa do hook post-checkout do Husky no Windows, restaurado para .husky/_ e removido o diretorio --version criado pelo env do Git for Windows; hooks pre-commit e pre-push verificados sob Git Bash
- Evidência: pnpm typecheck, pnpm lint e pnpm test (134 passando, 1 pulado) aprovados; pnpm build gera dist/index.html e dist/assets/ em 275ms; pnpm dev responde HTTP 200 em http://localhost:5173 e pnpm preview responde HTTP 200 em http://localhost:4173; tsconfig.json com strict, noUnusedLocals, noUnusedParameters, noFallthroughCasesInSwitch e noUncheckedSideEffectImports; os 10 diretorios previstos (src/assets, components, sections, data, content, styles, types, test, hooks e public/images) existem; src/main.tsx monta em StrictMode e lanca erro explicito sem o elemento #root; src/types/index.ts declara Profile, Project, SkillGroup e SocialLink; corrigido core.hooksPath do Git, que estava corrompido para --version/_ por causa do hook post-checkout do Husky no Windows, restaurado para .husky/_ e removido o diretorio --version criado pelo env do Git for Windows; hooks pre-commit e pre-push verificados sob Git Bash
- Plano de ação: none
- Arquivada em: 2026-11-16

## Objetivo

Verificar e consolidar a inicialização da aplicação React + TypeScript + Vite já presente no repositório, garantindo que a cadeia de ferramentas (Vite, TypeScript Strict, scripts de desenvolvimento e build) está corretamente configurada e executável, sem reimplementar o que já existe.

## Contexto

Esta tarefa foi originalmente escrita para inicializar a aplicação de raiz. A aplicação já existe no repositório, introduzida no commit inicial `3a1f9eb` e consolidada durante a change `005-refactor-portfolio-baseline` (arquivada). O código presente é **mais avançado** do que o escopo original da tarefa.

Esta tarefa passa portanto a ser de **revisão e consolidação**, e não de construção. O mesmo se aplica a TASK-002, TASK-003 e TASK-004, cujaselines já estão igualmente implementadas.

## Arquivos

- `package.json` (revisão dos scripts e dependências)
- `tsconfig.json` (revisão das opções de compilação)
- `vite.config.ts` (revisão da configuração do Vite)
- `index.html` (revisão do ponto de entrada)
- `src/main.tsx` (revisão do ponto de entrada da aplicação)
- `src/App.tsx` (revisão da composição raiz)
- `src/vite-env.d.ts` (revisão)
- `src/types/index.ts` (revisão)
- `src/data/profile.ts` (revisão)

## Entregáveis

- O projeto arranca em modo de desenvolvimento com `pnpm dev` e serve a aplicação em `http://localhost:5173`.
- `pnpm build` gera um bundle de produção em `dist/` sem erros nem avisos de compilação.
- `pnpm preview` serve o bundle gerado a partir de `dist/`.
- `tsconfig.json` mantém `strict: true` e as opções de integridade (`noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`, `noUncheckedSideEffectImports`).
- O ponto de entrada `src/main.tsx` monta a aplicação em modo estrito (`StrictMode`) e falha de forma explícita quando o elemento `#root` não existe.
- A estrutura de diretórios prevista no design (`src/{assets,components,sections,data,content,styles,types,test,hooks}` e `public/images`) existe e está versionada.
- `src/types/index.ts` declara os tipos de domínio (`Profile`, `Project`, `SkillGroup`, `SocialLink`) consumidos pelas restantes camadas.

## Regras

- **Não recriar** a aplicação, o `package.json`, o `tsconfig.json` nem o `vite.config.ts`. O objetivo é revisar e consolidar, não reescrever.
- **Não introduzir** dependências novas. A stack aprovada é React, TypeScript, Vite, CSS Modules, Vitest, Testing Library, ESLint e Husky.
- **Não implementar** aqui o que pertence às tarefas seguintes: qualidade e hooks (TASK-002), estilos globais (TASK-003) e navegação (TASK-004).
- **Não tocar** em `src/content/`. O conteúdo real é preenchido na TASK-009.
- Alterações são apenas correções do que estiver divergente da cadeia aprovada, com o mínimo de diff.
- A aplicação continua a ser estática: sem backend, base de dados ou autenticação.

## Testes

- `pnpm typecheck` passa sem erros.
- `pnpm build` conclui com sucesso e gera `dist/index.html` e `dist/assets/`.
- `pnpm dev` arranca e responde em `http://localhost:5173` com o HTML da aplicação.
- `pnpm preview` serve o bundle de `dist/` sem erro.
- `pnpm lint` e `pnpm test` passam (não podem ser quebrados por esta tarefa).
- Confirmação manual da estrutura: todos os diretórios listados em "Entregáveis" existem no repositório.

## Aceitação

A aplicação arranca em modo de desenvolvimento e gera build de produção sem erros, com TypeScript em modo estrito, a estrutura de diretórios aprovada presente e os scripts `dev`, `build` e `preview` funcionais.

## Checklist de clareza

- Objetivo único e verificável — ATENDE (revisão e consolidação da inicialização já existente)
- Arquivos afetados — ATENDE
- Entregáveis concretos — ATENDE
- Contrato de entrada, saída e erros — ATENDE (entrada: cadeia de ferramentas já presente no repositório; saída: aplicação executável e buildável; erros: `main.tsx` lança erro explícito se `#root` não existir, e o build falha se o TypeScript não compilar)
- Testes obrigatórios — ATENDE
- Critério de aceitação objetivo — ATENDE
- Dependências declaradas explicitamente — ATENDE
- Ausência de decisões pendentes para o implementador — ATENDE
