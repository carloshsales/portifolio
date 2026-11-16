# TASK-002 — Remover worktrees órfãos

- Change: 006-agent-orchestrator
- Status: COMPLETED
- Depende de: nenhuma
- Início: 2026-11-16
- Verificação: VERIFIED (2026-11-16) — 10 de 12 worktrees removidos; 2 mantidos por terem alteracoes nao commitadas (jolly-wizard com 5 ficheiros modificados em src/ e specs/, witty-knight com 3 ficheiros modificados em scripts/ e specs/), conforme a regra da propria task; branches preservadas (46 branches, nenhuma apagada); git worktree list mostra apenas o worktree principal e os 2 com alteracoes; pnpm typecheck aprovado em 2026-11-16
- Evidência: 10 de 12 worktrees removidos; 2 mantidos por terem alteracoes nao commitadas (jolly-wizard com 5 ficheiros modificados em src/ e specs/, witty-knight com 3 ficheiros modificados em scripts/ e specs/), conforme a regra da propria task; branches preservadas (46 branches, nenhuma apagada); git worktree list mostra apenas o worktree principal e os 2 com alteracoes; pnpm typecheck aprovado em 2026-11-16
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
