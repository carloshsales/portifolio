# TASK-005 — Introduzir integração contínua

- Change: 005-refactor-portfolio-baseline
- Status: PENDING
- Depende de: TASK-003, TASK-004
- Início: —
- Verificação: PENDING
- Evidência: —
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
