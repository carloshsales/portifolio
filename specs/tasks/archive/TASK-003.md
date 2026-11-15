# TASK-003 — Configurar estilos globais

- **ID:** TASK-003
- **Título:** Configurar estilos globais
- **Status:** ARCHIVED
- **Origem:** 001-portfolio-mvp
- **Criada em:** 2026-11-12
- **Depende de:** TASK-001
- **Bloqueios:** nenhum
- **Aprovada em:** 2026-11-12
- **Arquivada em:** 2026-11-13

## 1. Objetivo

Definir a paleta de cores aprovada, configurar a tipografia, criar tokens CSS e configurar os estilos globais e reset.

## 2. Contexto

A identidade visual aprovada precisa estar disponível e reutilizável em toda a aplicação.

## 3. Escopo

### Incluído
- Paleta de cores aprovada.
- Tipografia.
- Tokens CSS para cores, espaçamentos, tipografia e breakpoints.
- Estilos globais e reset.
- Suporte a movimento reduzido.

### Excluído
- Estilização das seções.

## 4. Comportamento esperado

A identidade visual básica está disponível e reutilizável.

## 5. Critérios de aceitação

- [x] Identidade visual básica disponível e reutilizável.
- [x] Foco visível configurado.
- [x] `prefers-reduced-motion` respeitado.

## 6. Requisitos e restrições técnicas

CSS Modules, tokens em `src/styles/tokens.css`.

## 7. Arquivos e módulos envolvidos

- `src/styles/tokens.css`
- `src/styles/reset.css`
- `src/styles/globals.css`
- `index.html`

## 8. Estratégia de testes e validação

`pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm format:check` e verificação do CSS gerado.

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
| 2026-11-12 | lint, typecheck, test, build, format | `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm format:check` | aprovado | VERIFIED |

## 13. Histórico

| Data | Evento | Detalhe |
|---|---|---|
| 2026-11-12 | Criada | Change 001 |
| 2026-11-12 | Concluída | VERIFIED |
| 2026-11-13 | Migrada | `specs/tasks/archive/TASK-003.md` |
