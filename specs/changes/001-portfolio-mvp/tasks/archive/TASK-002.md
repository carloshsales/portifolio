# TASK-002 — Configurar qualidade e Git Hooks

- Change: 001-portfolio-mvp
- Status: ARCHIVED
- Depende de: TASK-001
- Início: —
- Verificação: VERIFIED (2026-11-12) — hooks pre-commit e pre-push validados, incluindo bloqueio em falha.
- Evidência: hooks pre-commit e pre-push validados, incluindo bloqueio em falha.
- Plano de ação: none
- Arquivada em: 2026-11-15

- Instalar e configurar ESLint.
- Instalar e configurar Vitest e Testing Library.
- Instalar e configurar Husky.
- Configurar hook `pre-commit` para lint e formatação dos arquivos alterados.
- Configurar hook `pre-push` para verificação de tipos, testes e build.
- Centralizar comandos no `package.json`.

**Aceitação:** hooks executam corretamente e bloqueiam operações quando as verificações falham.
