# TASK-002 — Configurar qualidade e Git Hooks

- **ID:** TASK-002
- **Título:** Configurar qualidade e Git Hooks
- **Status:** ARCHIVED
- **Origem:** 001-portfolio-mvp
- **Criada em:** 2026-11-12
- **Depende de:** TASK-001
- **Bloqueios:** nenhum
- **Aprovada em:** 2026-11-12
- **Arquivada em:** 2026-11-13

## 1. Objetivo

Instalar e configurar ESLint, Vitest, Testing Library e Husky, com hooks de pre-commit e pre-push, centralizando comandos no `package.json`.

## 2. Contexto

O projeto precisa de verificações automáticas de qualidade antes de commits e pushes.

## 3. Escopo

### Incluído
- ESLint.
- Vitest + Testing Library.
- Husky.
- Hook `pre-commit` para lint e formatação dos arquivos alterados.
- Hook `pre-push` para verificação de tipos, testes e build.
- Comandos centralizados no `package.json`.

### Excluído
- Configuração de CI externa.

## 4. Comportamento esperado

Os hooks executam corretamente e bloqueiam operações quando as verificações falham.

## 5. Critérios de aceitação

- [x] Hooks executam corretamente.
- [x] Hooks bloqueiam operações em caso de falha.

## 6. Requisitos e restrições técnicas

ESLint, Vitest, Testing Library, Husky, lint-staged, pnpm.

## 7. Arquivos e módulos envolvidos

- `package.json`
- `eslint.config.js`
- `vite.config.ts`
- `.husky/pre-commit`
- `.husky/pre-push`

## 8. Estratégia de testes e validação

Execução manual dos hooks, incluindo simulação de falha.

## 9. Riscos e dúvidas

Nenhum registrado.

## 10. Avaliação de clareza

Não se aplica retroativamente: tarefa concluída em 2026-11-12, antes da adoção da regra dos 90%.

## 11. Aprovação humana

- [x] Aprovada
- **Aprovada por:** usuário
- **Data:** 2026-11-12
- **Observações:** —

## 12. Evidências de implementação e validação

| Data | Verificação | Comando | Resultado | Evidência |
|---|---|---|---|---|
| 2026-11-12 | hooks pre-commit e pre-push | execução manual, incluindo falha | aprovado | VERIFIED |

## 13. Histórico

| Data | Evento | Detalhe |
|---|---|---|
| 2026-11-12 | Criada | Change 001 |
| 2026-11-12 | Concluída | VERIFIED |
| 2026-11-13 | Migrada | `specs/tasks/archive/TASK-002.md` |
