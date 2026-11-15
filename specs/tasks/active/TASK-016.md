# TASK-016 — Implementar indicador de seção ativa

- **ID:** TASK-016
- **Título:** Implementar indicador de seção ativa
- **Status:** DRAFT
- **Origem:** —
- **Criada em:** 2026-11-13
- **Depende de:** TASK-004
- **Bloqueios:** nenhum
- **Aprovada em:** —
- **Arquivada em:** —

## 1. Objetivo

Destacar na navegação a seção atualmente visível.

## 2. Contexto

A navegação foi implementada sem o indicador de seção ativa por decisão de escopo (TASK-004). Esta tarefa trata desse requisito.

## 3. Escopo

### Incluído
- Detectar a seção visível.
- Destacar o link correspondente na navegação.

### Excluído
- Alteração do conteúdo das seções.

## 4. Comportamento esperado

- O link da seção visível é destacado.
- O destaque acompanha a rolagem.

## 5. Critérios de aceitação

- [ ] O link ativo é destacado.
- [ ] O destaque acompanha a rolagem.

## 6. Requisitos e restrições técnicas

React, TypeScript strict, CSS Modules, tokens aprovados, WCAG 2.2 AA.

## 7. Arquivos e módulos envolvidos

- `src/components/Navigation.tsx`
- `src/components/Navigation.module.css`
- `src/components/Navigation.test.tsx`

## 8. Estratégia de testes e validação

Testes automatizados e verificação manual.

## 9. Riscos e dúvidas

- A detecção depende de `IntersectionObserver` ou de rolagem; a abordagem deve ser simples.

## 10. Avaliação de clareza

Pendente — avaliar quando esta for a próxima tarefa.

## 11. Aprovação humana

- [ ] Aprovada
- **Aprovada por:** —
- **Data:** —
- **Observações:** —

## 12. Evidências de implementação e validação

| Data | Verificação | Comando | Resultado | Evidência |
|---|---|---|---|---|
| — | — | — | — | — |

## 13. Histórico

### Modificações

| Data | Motivo | Alterações |
|---|---|---|
| 2026-11-13 | Criada | Decisão de escopo da TASK-004 |

### Eventos

| Data | Evento | Detalhe |
|---|---|---|
| 2026-11-13 | Criada | Nova, decorrente do refinamento da TASK-004 |
