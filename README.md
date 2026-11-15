# portfolio

Portfólio profissional e sistema de especificações RawSpec v2.

## Documentação

- `docs/rawspec-v2.md` — formato das especificações v2, comandos, exemplos e catálogo de erros.
- `docs/history.md` — histórico append-only de decisões, eventos e detalhes.
- `docs/decisions/` — Architecture Decision Records (ADRs).
- `specs/templates/` — templates de tarefa, proposta, design, plano de ação e entrada de histórico.

## Comandos RawSpec

- `/startspec [TASK-ID] [--change CHANGE-ID]` — inicia uma tarefa.
- `/continuespec [TASK-ID] [--change CHANGE-ID]` — continua, verifica e conclui.
- `/arquivespec TASK-ID [--change CHANGE-ID]` — arquiva uma tarefa após aprovação.
- `/archivespec [CHANGE-ID]` — arquiva uma mudança elegível.
- `/logspec` — registra histórico e, opcionalmente, cria um ADR.

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
