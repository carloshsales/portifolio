# TASK-003 — Criar a configuração base do OpenCode

- Change: 006-agent-orchestrator
- Status: PENDING
- Depende de: TASK-001, TASK-002
- Início: —
- Verificação: PENDING
- Evidência: —
- Plano de ação: none

## Objetivo

Criar `opencode.json` na raiz, com o schema publicado, a política de permissões
globais e a configuração de cache dos providers.

## Arquivos

- `opencode.json` (criação)

## Entregáveis

- `opencode.json` com o campo `$schema` apontando para `https://opencode.ai/config.json`.
- Permissões globais que bloqueiam `git reset --hard`, `git checkout --`, `git clean`, `rm -rf` e a escrita em `src/content/`, `specs/**` e `docs/history.md`.
- `read` de ficheiros `*.env` definido como `ask`.
- `settings.cache.ttl` de uma hora nos providers compatíveis.
- `experimental.todo` activo, para os agentes de execução multi-passo.

## Regras

- O ficheiro é JSON, não JSONC, para que a validação por schema não dependa de comentários.
- A chave `default_agent` aponta para `orquestrador` apenas depois de TASK-004 criar esse agente. Nesta tarefa, a chave é omitida.
- As permissões globais seguem a ordem de `docs/orquestrador.md` §5.3: regras gerais primeiro, exceções específicas depois.
- Nenhuma regra permite `git push` globalmente. O push é responsabilidade exclusiva do `guardiao`, com regra própria de agente.
- `model` não é definido no nível raiz nesta tarefa. O default de modelos é definido por agente.
- Nenhum campo em desuso de V1 é usado: `permission`, `bash`, `task`, `tools`, `disable`, `maxSteps`.

## Testes

- O ficheiro é JSON válido e valida contra `https://opencode.ai/config.json`.
- `opencode.json` é recarregado pelo OpenCode sem erro, confirmado pela ausência de mensagem de erro de configuração na sessão.
- A listagem de agentes mostra os built-ins `build`, `plan`, `explore` e `general`, o que confirma que o ficheiro foi carregado.
- `pnpm exec prettier --check opencode.json` passa.
- `pnpm lint`, `pnpm typecheck` e `pnpm test` passam.

## Aceitação

`opencode.json` existe, valida contra o schema, e a política de permissões bloqueia as operações destrutivas e a escrita em `src/content/`, `specs/**` e `docs/history.md`.

## Checklist de clareza

- Objetivo único e verificável — ATENDE
- Arquivos afetados — ATENDE
- Entregáveis concretos — ATENDE
- Contrato de entrada, saída e erros — ATENDE (entrada: `docs/orquestrador.md` §5.3 e §4.1; saída: `opencode.json` válido; erros: JSON inválido ou chave desconhecida impedem o carregamento da configuração)
- Testes obrigatórios — ATENDE
- Critério de aceitação objetivo — ATENDE
- Dependências declaradas explicitamente — ATENDE
- Ausência de decisões pendentes para o implementador — ATENDE
