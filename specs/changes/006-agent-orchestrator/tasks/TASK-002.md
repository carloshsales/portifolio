# TASK-002 — Remover worktrees órfãos

- Change: 006-agent-orchestrator
- Status: PENDING
- Depende de: nenhuma
- Início: —
- Verificação: PENDING
- Evidência: —
- Plano de ação: none

## Objetivo

Remover os worktrees órfãos accumulate no repositório, para que o estado real do
ambiente de trabalho corresponda ao que a documentação descreve.

## Arquivos

- `.git/worktrees/` (metadados git removidos pela operação do git)

## Entregáveis

- A lista de worktrees passa a conter apenas o worktree do diretório principal do projeto.
- Nenhuma branch é apagada. As branches referenciadas por worktrees removidos continuam a existir.

## Regras

- Só são removidos worktrees cujo diretório não contenha alterações não commitadas.
- Um worktree com alterações não commitadas é reportado e mantido, e a remoção só é reavaliada pelo utilizador.
- Nenhuma branch é apagada, nem local nem remota.
- Nenhum ficheiro do diretório de trabalho principal é tocado.
- A regra de `docs/projeto.md` §7.3 mantém-se: não são criados worktrees para tarefas comuns. Esta tarefa apenas limpa os existentes.

## Testes

- `git worktree list` mostra apenas o worktree principal.
- `git branch -a` mostra o mesmo conjunto de branches de antes da tarefa.
- `git status --short` no diretório principal está limpo e igual ao estado anterior.
- `pnpm typecheck` passa, confirmando que nada no repositório foi afetado.

## Aceitação

Só resta o worktree principal e todas as branches continuam intactas.

## Checklist de clareza

- Objetivo único e verificável — ATENDE
- Arquivos afetados — ATENDE
- Entregáveis concretos — ATENDE
- Contrato de entrada, saída e erros — ATENDE (entrada: lista de worktrees; saída: lista com apenas o principal; erros: worktree com alterações não commitadas é mantido e reportado)
- Testes obrigatórios — ATENDE
- Critério de aceitação objetivo — ATENDE
- Dependências declaradas explicitamente — ATENDE
- Ausência de decisões pendentes para o implementador — ATENDE
