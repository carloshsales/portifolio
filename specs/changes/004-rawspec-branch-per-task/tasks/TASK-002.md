# TASK-002 — Atualizar /startspec e /continuespec

- Change: 004-rawspec-branch-per-task
- Status: PENDING
- Depende de: TASK-001
- Início: —
- Verificação: PENDING
- Evidência: —
- Plano de ação: none

## Objetivo

Atualizar os comandos `/startspec`, `/continuespec` e `/arquivespec` para usar a branch da tarefa e o commit/push automático.

## Arquivos

- `.opencode/commands/startspec.md`
- `.opencode/commands/continuespec.md`
- `.opencode/commands/arquivespec.md`

## Entregáveis

- `/startspec` cria a branch antes de iniciar.
- `/continuespec` conclui, executa verificações e commita e push.
- `/arquivespec` arquiva e commita.
- Regras de harness e tratamento de falhas documentadas.

## Regras

- Manter as perguntas obrigatórias de ambiguidade e concorrência.
- Informar quando a branch já existe.
- Não commitar se as verificações falharem.
- Respeitar os hooks do Husky.
- Nenhuma operação destrutiva.

## Testes

- Validação manual dos fluxos.
- Verificar que os comandos referenciam `create-branch` e `commit-task`.
- Verificar que os hooks são mencionados.

## Aceitação

- Os três comandos orientam a branch e o commit/push.
- Os comandos referenceiam o helper compartilhado.

## Checklist de clareza

- Objetivo único e verificável — ATENDE
- Arquivos afetados — ATENDE
- Entregáveis concretos — ATENDE
- Contrato de entrada, saída e erros — ATENDE (entrada: argumentos dos comandos; saída: narrativa e chamadas; erros: códigos do helper)
- Testes obrigatórios — ATENDE
- Critério de aceitação objetivo — ATENDE
- Dependências declaradas explicitamente — ATENDE
- Ausência de decisões pendentes para o implementador — ATENDE
