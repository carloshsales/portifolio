# TASK-008 — Implementar seção de contato

- **ID:** TASK-008
- **Título:** Implementar seção de contato
- **Status:** DRAFT
- **Origem:** 001-portfolio-mvp
- **Criada em:** 2026-11-12
- **Depende de:** TASK-004
- **Bloqueios:** canais de contato não fornecidos
- **Aprovada em:** —
- **Arquivada em:** —

## 1. Objetivo

Implementar a seção Contato com os canais profissionais fornecidos.

## 2. Contexto

A seção de contato permite que recrutadores e interessados falem com o profissional.

## 3. Escopo

### Incluído
- Exibição dos canais profissionais.
- Links funcionais para os canais disponíveis.
- Acessibilidade dos elementos interativos.

### Excluído
- Formulário de contato com backend.
- Canais não fornecidos.

## 4. Comportamento esperado

- Os canais são exibidos com links funcionais.
- Os elementos interativos são acessíveis por teclado.

## 5. Critérios de aceitação

- [ ] Canais de contato funcionais.
- [ ] Acessíveis por teclado.
- [ ] Sem canais inventados.

## 6. Requisitos e restrições técnicas

React, TypeScript strict, CSS Modules, tokens aprovados, WCAG 2.2 AA.

## 7. Arquivos e módulos envolvidos

- `src/sections/Contact/Contact.tsx` (novo)
- `src/sections/Contact/Contact.module.css` (novo)
- `src/data/profile.ts` (novo)
- `src/sections/Contact/Contact.test.tsx` (novo)

## 8. Estratégia de testes e validação

Testes de renderização e de links; verificação de acessibilidade.

## 9. Riscos e dúvidas

- Bloqueio: canais de contato não fornecidos.

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

| Data | Evento | Detalhe |
|---|---|---|
| 2026-11-12 | Criada | Change 001 |
| 2026-11-13 | Migrada | `specs/tasks/active/TASK-008.md` |
