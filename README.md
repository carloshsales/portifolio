# portfolio

Portfólio profissional e sistema de especificações RawSpec v2.

## Documentação

- `docs/rawspec-v2.md` — formato das especificações v2, comandos, exemplos e catálogo de erros.
- `docs/deployment.md` — como publicar o projeto: requisitos, candidatos e critérios de decisão.
- `docs/conteudo-real.md` — inventário do conteúdo a fornecer para o portfólio deixar de estar vazio.
- `docs/history.md` — histórico append-only de decisões, eventos e detalhes.
- `docs/decisions/` — Architecture Decision Records (ADRs).
- `specs/templates/` — templates de tarefa, proposta, design, plano de ação e entrada de histórico.

## Comandos RawSpec

- `/startspec [TASK-ID] [--change CHANGE-ID]` — cria a branch da tarefa e inicia.
- `/continuespec [TASK-ID] [--change CHANGE-ID]` — continua, verifica, conclui e, se as verificações passarem, commita e pusha.
- `/arquivespec TASK-ID [--change CHANGE-ID]` — arquiva uma tarefa após aprovação e commita.
- `/archivespec [CHANGE-ID]` — arquiva uma mudança elegível.
- `/logspec` — registra histórico e, opcionalmente, cria um ADR.

## Branch por tarefa

Toda tarefa usa uma branch `task/NNN-NNN-slug`, criada no início. Ao concluir com verificações aprovadas, o commit e o push são feitos automaticamente, respeitando os hooks do Husky.

## Integração contínua

O workflow `.github/workflows/ci.yml` corre em cada push e pull request: `lint`, `typecheck`, `test`, `build` e `test:e2e`. Os hooks locais do Husky (`pre-commit` e `pre-push`) mantêm-se como garantia imediata e não são substituídos pelo CI.

## Especificações

- `specs/changes/` — mudanças ativas, cada uma com `proposal.md`, `design.md` (opcional) e `tasks/` em formato v2.
- `specs/changes/archive/` — mudanças arquivadas.

## Desenvolvimento

```bash
pnpm install
pnpm dev
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Publicação

```bash
pnpm build          # gera dist/
pnpm preview        # serve dist/ localmente
pnpm test:e2e       # testes de responsividade sobre o build
```

O destino do deploy ainda não foi decidido. Os requisitos, os candidatos e os critérios de escolha estão em [`docs/deployment.md`](docs/deployment.md).
