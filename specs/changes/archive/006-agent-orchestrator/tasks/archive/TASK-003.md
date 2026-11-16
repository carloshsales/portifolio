# TASK-003 — Criar a configuração base do OpenCode

- Change: 006-agent-orchestrator
- Status: ARCHIVED
- Depende de: TASK-001, TASK-002
- Início: 2026-11-16
- Verificação: VERIFIED (2026-11-16) — opencode.json criado com schema publicado, 11 regras de permissao globais (11 validas, 0 campos invalidos, nenhuma chave desconhecida contra o schema em vigor), cache write de 7475 tokens confirmado em sessao real (ttl 1h activo), escrita directa em src/content/ bloqueada pela ferramenta write; limitacao de bypass por shell verificada em 5 vias e registada em design.md 5.3.1, plano de acao TASK-003-2026-11-16-limitacao-das-permissoes-de-caminho.md, e gate de ambito definido como garantia real; pnpm lint, typecheck, test (134 passando, 1 pulado), build e prettier aprovados em 2026-11-16
- Evidência: opencode.json criado com schema publicado, 11 regras de permissao globais (11 validas, 0 campos invalidos, nenhuma chave desconhecida contra o schema em vigor), cache write de 7475 tokens confirmado em sessao real (ttl 1h activo), escrita directa em src/content/ bloqueada pela ferramenta write; limitacao de bypass por shell verificada em 5 vias e registada em design.md 5.3.1, plano de acao TASK-003-2026-11-16-limitacao-das-permissoes-de-caminho.md, e gate de ambito definido como garantia real; pnpm lint, typecheck, test (134 passando, 1 pulado), build e prettier aprovados em 2026-11-16
- Plano de ação: none
- Arquivada em: 2026-11-16

## Objetivo

Criar `opencode.json` na raiz, com o schema publicado, a política de permissões
globais e a configuração de cache dos providers.

## Arquivos

- `opencode.json` (criação)

## Entregáveis

- `opencode.json` com o campo `$schema` apontando para `https://opencode.ai/config.json`.
- Permissões globais que bloqueiam `git reset --hard`, `git checkout --`, `git restore`, `git clean`, `rm -rf` e a escrita em `src/content/`.
- `read` de ficheiros `*.env` definido como `ask`.
- `settings.cache.ttl` de uma hora no provider `opencode-go`.
- `experimental.todo` activo, para os agentes de execução multi-passo.

## Regras

- O ficheiro é JSON, não JSONC, para que a validação por schema não dependa de comentários.
- A chave `default_agent` aponta para `orquestrador` apenas depois de TASK-004 criar esse agente. Nesta tarefa, a chave é omitida.
- As permissões globais seguem a ordem de `docs/orquestrador.md` §5.3: regras gerais primeiro, exceções específicas depois.
- Nenhuma regra permite `git push` globalmente. O push é responsabilidade exclusiva do `guardiao`, com regra própria de agente.
- `model` não é definido no nível raiz nesta tarefa. O default de modelos é definido por agente.
- Nenhum campo em desuso de V1 é usado: `permission`, `bash`, `task`, `tools`, `disable`, `maxSteps`.
- **Não existe regra `edit` sobre `specs/**`.** A verificação mostrou que uma negação de caminho não impede a escrita por shell, e que a regra bloqueia a manutenção legítima das especificações. A garantia de âmbito é assegurada pelo gate pós-escrita, descrito em `design.md` §5.3.1.

## Testes

- O ficheiro é JSON válido e valida contra `https://opencode.ai/config.json`.
- O OpenCode recarrega o ficheiro sem erro de configuração, confirmado pelo evento `provider.updated` no log para o directório do projecto.
- A listagem de agentes mostra os built-ins `build`, `plan`, `explore` e `general`, o que confirma que o ficheiro foi carregado.
- Uma escrita directa em `src/content/profile.ts` é bloqueada pela ferramenta de escrita.
- A limitação de que a escrita por shell contorna a negação de caminho está registada em `docs/orquestrador.md` §5.3.1 e no plano de acção da task.
- `pnpm exec prettier --check opencode.json` passa.
- `pnpm lint`, `pnpm typecheck` e `pnpm test` passam.

## Aceitação

`opencode.json` existe, valida contra o schema, e a política de permissões bloqueia as operações destrutivas e a escrita directa em `src/content/`, com a limitação do bypass por shell documentada e o gate de âmbito definido como garantia real.

## Checklist de clareza

- Objetivo único e verificável — ATENDE
- Arquivos afetados — ATENDE
- Entregáveis concretos — ATENDE
- Contrato de entrada, saída e erros — ATENDE (entrada: `docs/orquestrador.md` §5.3 e §4.1; saída: `opencode.json` válido; erros: JSON inválido ou chave desconhecida impedem o carregamento da configuração)
- Testes obrigatórios — ATENDE
- Critério de aceitação objetivo — ATENDE
- Dependências declaradas explicitamente — ATENDE
- Ausência de decisões pendentes para o implementador — ATENDE
