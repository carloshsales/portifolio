# TASK-008 — Validar ponta a ponta e registrar a mudança

- Change: 005-refactor-portfolio-baseline
- Status: PENDING
- Depende de: TASK-005, TASK-006, TASK-007
- Início: —
- Verificação: PENDING
- Evidência: —
- Plano de ação: none

## Objetivo

Comprovar que a mudança está completa, que a change 001 permanece consistente e que o histórico do projeto reflete as decisões tomadas.

## Arquivos

- `docs/history.md` (entradas de histórico)
- `docs/decisions/` (ADR, se necessário)
- `README.md` (verificação final)

## Entregáveis

- Entradas de histórico para as decisões tomadas nesta mudança: limpeza do repositório, isolamento do conteúdo, automação de acessibilidade, automação de responsividade, introdução de CI e publicação agnóstica.
- ADR novo apenas se houver uma decisão arquitetural que justifique registo permanente; caso contrário, a entrada de histórico basta.
- Execução de `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` e `pnpm test:e2e`.
- Confirmação de que o repositório não contém placeholders renderizados.
- Confirmação de que a change 001 tem as doze tarefas com estado coerente com o código.
- Confirmação de que `specs/changes/` contém apenas mudanças ativas e executáveis.
- README com a estrutura final correta.

## Regras

- `docs/history.md` é append-only; nenhuma entrada anterior é reescrita.
- Nenhum commit ou push sem a sequência da branch por tarefa.
- Não usar `--no-verify`.
- Não corrigir falhas escondendo testes.
- Não alterar a change 002, exceto o arquivamento feito na TASK-001.

## Testes

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- `pnpm test:e2e`
- `pnpm format:check`
- `node scripts/rawspec-v2-cli.mjs next` resolve para uma mudança ativa e aprovada.

## Aceitação

Todas as verificações passam, o repositório está limpo, o histórico registra as decisões e a change 001 está coerente com o código.

## Checklist de clareza

- Objetivo único e verificável — ATENDE
- Arquivos afetados — ATENDE
- Entregáveis concretos — ATENDE
- Contrato de entrada, saída e erros — NÃO SE APLICA (tarefa de validação: não expõe interface; as entradas são as verificações listadas e a saída é o relatório de validação e as entradas de histórico)
- Testes obrigatórios — ATENDE
- Critério de aceitação objetivo — ATENDE
- Dependências declaradas explicitamente — ATENDE
- Ausência de decisões pendentes para o implementador — ATENDE
