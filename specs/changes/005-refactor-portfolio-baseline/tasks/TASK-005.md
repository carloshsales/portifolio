# TASK-005 — Introduzir integração contínua

- Change: 005-refactor-portfolio-baseline
- Status: COMPLETED
- Depende de: TASK-003, TASK-004
- Início: 2026-11-15
- Verificação: VERIFIED (2026-11-15) — .github/workflows/ci.yml criado com name CI, triggers push e pull_request, permissions contents read, concurrency com cancel-in-progress e job quality em ubuntu-latest com timeout 15 minutos; 10 steps: checkout, pnpm/action-setup com version 12 e run_install false, setup-node com node-version 22 e cache pnpm, pnpm install --frozen-lockfile, pnpm lint, pnpm typecheck, pnpm test, pnpm build, playwright install --with-deps chromium, pnpm test:e2e; YAML validado estruturalmente com parser yaml (10 steps lidos, triggers e job corretos); todos os comandos do workflow executados localmente na ordem, com exit 0 em pnpm install --frozen-lockfile, pnpm lint, pnpm typecheck, pnpm test, pnpm build e pnpm test:e2e; o passo --with-deps e especifico de Linux e foi identificado como tal; dependencia temporaria yaml removida apos a validacao; hooks do Husky mantidos inalterados; pnpm lint, pnpm format:check, pnpm typecheck, pnpm test (134 passando, 1 pulado) e pnpm build aprovados
- Evidência: .github/workflows/ci.yml criado com name CI, triggers push e pull_request, permissions contents read, concurrency com cancel-in-progress e job quality em ubuntu-latest com timeout 15 minutos; 10 steps: checkout, pnpm/action-setup com version 12 e run_install false, setup-node com node-version 22 e cache pnpm, pnpm install --frozen-lockfile, pnpm lint, pnpm typecheck, pnpm test, pnpm build, playwright install --with-deps chromium, pnpm test:e2e; YAML validado estruturalmente com parser yaml (10 steps lidos, triggers e job corretos); todos os comandos do workflow executados localmente na ordem, com exit 0 em pnpm install --frozen-lockfile, pnpm lint, pnpm typecheck, pnpm test, pnpm build e pnpm test:e2e; o passo --with-deps e especifico de Linux e foi identificado como tal; dependencia temporaria yaml removida apos a validacao; hooks do Husky mantidos inalterados; pnpm lint, pnpm format:check, pnpm typecheck, pnpm test (134 passando, 1 pulado) e pnpm build aprovados
- Plano de ação: none

## Objetivo

Complementar os hooks locais do Husky com um workflow de CI que executa a totalidade das verificações em cada push e pull request.

## Arquivos

- `.github/workflows/ci.yml` (criação)
- `package.json` (verificação dos scripts referenciados)

## Entregáveis

- Workflow `.github/workflows/ci.yml` disparado em `push` e `pull_request`.
- Job `quality` em `ubuntu-latest` com as seis etapas: instalar dependências, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm test:e2e`.
- Versão do pnpm fixada em 12 e Node fixado em 22, com cache de dependências via `setup-node`.
- Browser do Playwright instalado com `playwright install --with-deps chromium`.
- `retries: 2` no CI para tolerar instabilidade de ambiente.

## Regras

- O CI executa os mesmos scripts definidos no `package.json`; não duplica comandos.
- Os hooks do Husky não são removidos nem afrouxados.
- Nenhum segredo é usado e nenhum passo exige configuração externa.
- O workflow não cria pull requests nem faz deploy.
- Nenhuma dependência de runtime nova.

## Testes

- `pnpm lint`, `pnpm typecheck`, `pnpm test` e `pnpm build` passam localmente, na mesma ordem do workflow.
- `pnpm test:e2e` passa localmente após o build.
- O YAML é válido e o nome de cada step está presente.

## Aceitação

O workflow existe, contém as seis etapas na ordem correta e os comandos correspondentes passam localmente.

## Checklist de clareza

- Objetivo único e verificável — ATENDE
- Arquivos afetados — ATENDE
- Entregáveis concretos — ATENDE
- Contrato de entrada, saída e erros — ATENDE (entrada: push ou pull request; saída: job verde ou vermelho por etapa; erros: a falha de qualquer etapa bloqueia o job)
- Testes obrigatórios — ATENDE
- Critério de aceitação objetivo — ATENDE
- Dependências declaradas explicitamente — ATENDE
- Ausência de decisões pendentes para o implementador — ATENDE
