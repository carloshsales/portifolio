# TASK-008 — Implementar seção de contato

- Change: 001-portfolio-mvp
- Status: PENDING
- Depende de: TASK-007
- Início: —
- Verificação: PENDING
- Evidência: —
- Plano de ação: none

## Objetivo

Revisar e completar a seção de contato: canais profissionais, links funcionais e acessibilidade dos elementos interativos.

## Arquivos

- `src/sections/Contact/Contact.tsx` (revisão)
- `src/sections/Contact/Contact.module.css` (revisão)
- `src/content/profile.ts` (leitura dos dados; sem escrita)

## Entregáveis

- Os canais de contacto são apresentados com ícone e rótulo.
- Cada canal é um link funcional para o destino correto.
- Os elementos interativos são acessíveis: link com texto visível, ícone decorativo com `aria-hidden`.
- A secção apresenta um estado vazio quando não há canais.
- Canais sem URL são removidos automaticamente.

## Regras

- **Não editar `src/content/profile.ts`** nesta tarefa. O preenchimento do conteúdo real é feito à parte, com base em `docs/conteudo-real.md`.
- A secção lê de `src/data/profile.ts`, nunca de `src/content/` directamente.
- O `icon` tem de ser `github`, `linkedin` ou `email`. Qualquer outro valor é um erro de tipo.
- O texto do link não pode ser apenas o ícone: tem de existir um rótulo visível.
- O ícone é decorativo e não é anunciado por leitores de ecrã.
- Não publicar contactos que o utilizador não queira tornar públicos.

## Testes

- `pnpm lint`, `pnpm typecheck` e `pnpm test` passam.
- `src/test/content.test.tsx` confirma que não há marcadores de placeholder nem emails fictícios.
- `src/test/accessibility.test.tsx` confirma ausência de violações automáticas, incluindo a regra de nome acessível de links.
- `pnpm test:e2e` confirma que não há links com `href` vazio nem `javascript:`.
- Verificação visual no browser: cada canal abre no destino correto.

## Aceitação

Os canais de contacto são funcionais, acessíveis e apenas os pretendidos são publicados.

## Checklist de clareza

- Objetivo único e verificável — ATENDE
- Arquivos afetados — ATENDE
- Entregáveis concretos — ATENDE
- Contrato de entrada, saída e erros — ATENDE (entrada: `src/data/profile.ts`; saída: canais de contacto renderizados; erros: lista vazia apresenta estado vazio; `icon` fora do conjunto permitido falha no typecheck)
- Testes obrigatórios — ATENDE
- Critério de aceitação objetivo — ATENDE
- Dependências declaradas explicitamente — ATENDE
- Ausência de decisões pendentes para o implementador — ATENDE
