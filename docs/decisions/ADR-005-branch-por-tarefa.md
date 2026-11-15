# ADR-005: Branch por tarefa e commit/push automáticos

- Status: Accepted
- Data: 2026-11-15

## Contexto

As tarefas eram executadas diretamente na branch corrente, sem isolamento. Não havia automação de commit e push após a verificação, e o trabalho de diferentes tarefas podia se misturar.

## Alternativas consideradas

1. Manter todas as tarefas na branch corrente.
2. Criar branch por tarefa, mas com commit e push manuais.
3. Criar branch por tarefa e fazer commit e push automáticos após as verificações.

## Decisão

Toda tarefa é executada em sua própria branch `task/NNN-NNN-slug`, criada no início. Ao concluir com `COMPLETED` + `VERIFIED`, as verificações (`pnpm typecheck`, `pnpm test`, `pnpm build`) são executadas; se passarem, o commit e o push são feitos automaticamente, respeitando os hooks do Husky.

## Justificativa

- Isolamento do trabalho por tarefa.
- Histórico Git mais legível e rastreável.
- Verificações obrigatórias antes do commit.
- Hooks do Husky preservados como garantia de qualidade.
- Nomenclatura previsível e fácil de localizar.

## Consequências

- Cada tarefa gera uma branch e pelo menos um commit.
- O commit de arquivamento é um commit adicional na mesma branch.
- Falha de verificação impede o commit.
- Branches de tarefa permanecem disponíveis para referência.
