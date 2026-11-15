# TASK-006 — Implementar seção de projetos

- **ID:** TASK-006
- **Título:** Implementar seção de projetos
- **Status:** DRAFT
- **Origem:** 001-portfolio-mvp
- **Criada em:** 2026-11-12
- **Depende de:** TASK-004
- **Bloqueios:** projetos reais não fornecidos
- **Aprovada em:** —
- **Arquivada em:** —

## 1. Objetivo

Implementar a seção Projetos com cards, tecnologias e links.

## 2. Contexto

A seção de projetos apresenta os trabalhos do profissional. O conteúdo precisa ser real.

## 3. Escopo

### Incluído
- Estrutura de cards de projetos.
- Separação entre dados e apresentação.
- Exibição de tecnologias utilizadas.
- Links para repositórios e demonstrações quando disponíveis.

### Excluído
- Projetos fictícios.
- Links inválidos.

## 4. Comportamento esperado

- Os projetos são exibidos em cards responsivos.
- Cada card mostra tecnologias e links.
- Sem dados fictícios.

## 5. Critérios de aceitação

- [ ] Projetos apresentados corretamente.
- [ ] Sem dados fictícios ou links inválidos.
- [ ] Layout responsivo.

## 6. Requisitos e restrições técnicas

React, TypeScript strict, CSS Modules, tokens aprovados.

## 7. Arquivos e módulos envolvidos

- `src/sections/Projects/Projects.tsx` (novo)
- `src/sections/Projects/Projects.module.css` (novo)
- `src/data/projects.ts` (novo)
- `src/sections/Projects/Projects.test.tsx` (novo)

## 8. Estratégia de testes e validação

Testes de renderização e de conteúdo; verificação manual de responsividade.

## 9. Riscos e dúvidas

- Bloqueio: projetos não fornecidos.

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
| 2026-11-13 | Migrada | `specs/tasks/active/TASK-006.md` |
