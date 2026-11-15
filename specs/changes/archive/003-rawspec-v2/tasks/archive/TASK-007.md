# TASK-007 — Criar os comandos v2

- Change: 003-rawspec-v2
- Status: ARCHIVED
- Depende de: TASK-005, TASK-006
- Início: 2026-11-15
- Verificação: VERIFIED (2026-11-15) — quatro comandos criados em `.opencode/commands/`; CLI ampliado com `resolve`, `next`, `open`, `start`, `begin-verify`, `verify`, `fail`, `archive-task`, `archive-change`, `check-archive-task`, `check-archive-change`, `commit-message` e `log`; `buildCommitMessage` implementado; 76 testes do módulo passando; `prettier --check`, `pnpm lint`, `pnpm typecheck`, `pnpm test` (118 testes) e `pnpm build` aprovados; smoke test `resolve TASK-009 --change 003-rawspec-v2` bem-sucedido.
- Evidência: comandos em `.opencode/commands/`; implementação e testes em `scripts/`; verificações executadas em 2026-11-15.
- Arquivada em: 2026-11-15
- Plano de ação: none

## Objetivo

Expor o fluxo v2 por meio dos comandos `/startspec`, `/continuespec`, `/arquivespec` e `/archivespec`, todos usando o helper compartilhado.

## Arquivos

- `.opencode/commands/startspec.md` (criação)
- `.opencode/commands/continuespec.md` (criação)
- `.opencode/commands/arquivespec.md` (criação)
- `.opencode/commands/archivespec.md` (criação)

## Entregáveis

- `/startspec [TASK-ID] [--change CHANGE-ID]` com argumento-hint e narrativa.
- `/continuespec [TASK-ID] [--change CHANGE-ID]`.
- `/arquivespec TASK-ID [--change CHANGE-ID]`.
- `/archivespec [CHANGE-ID]`.
- Instruções explícitas para perguntar ao usuário em ambiguidade e concorrência.
- Chamadas ao helper `scripts/rawspec-v2.mjs`, sem reimplementar parsing.
- Mensagem de commit ao final de cada tarefa concluída, sem executar commit.

## Regras

- `/startspec` sem argumento inicia a próxima tarefa pendente; com tarefa aberta, pergunta antes de iniciar outra.
- `/continuespec` recupera o estado e não reinicia tarefa concluída ou arquivada.
- `/arquivespec` exige `COMPLETED` + `VERIFIED` e aprovação humana; arquiva a tarefa.
- `/archivespec` só arquiva quando todas as tarefas estiverem arquivadas.
- Nenhum comando altera status de aprovação.
- Nenhum comando faz commit ou push.
- Nenhum comando adicional é criado além dos cinco previstos (incluindo `/logspec`).

## Testes

- Validação manual dos argumentos e das mensagens de ambiguidade.
- Verificação de que cada comando chama o helper compartilhado.
- Smoke test em diretório temporário.
- Verificação de que nenhum comando executa `git commit` ou `git push`.

## Aceitação

- Os quatro comandos existem, documentam argumentos e usam o helper.
- As perguntas obrigatórias estão descritas.
- Nenhum comando novo foi criado.

## Checklist de clareza

- Objetivo único e verificável — ATENDE
- Arquivos afetados — ATENDE
- Entregáveis concretos — ATENDE
- Contrato de entrada, saída e erros — ATENDE (entrada: argumentos dos comandos; saída: narrativa, perguntas e mensagem de commit; erros: códigos do helper)
- Testes obrigatórios — ATENDE
- Critério de aceitação objetivo — ATENDE
- Dependências declaradas explicitamente — ATENDE
- Ausência de decisões pendentes para o implementador — ATENDE
