# Arquitetura técnica

## Princípio

Aplicação frontend estática, sem backend, banco de dados ou autenticação. Conteúdos mantidos em arquivos locais versionados no Git.

## Stack

React + TypeScript (strict) + Vite + CSS Modules.

## Estrutura de pastas

```text
src/
├── assets/
├── components/       # componentes reutilizáveis
├── sections/         # seções da página
│   ├── Home/
│   ├── Projects/
│   ├── Games/
│   ├── Articles/
│   ├── Experiments/
│   └── Contact/
├── data/             # conteúdo separado da apresentação
├── styles/           # tokens, reset, globals
├── types/
├── App.tsx
└── main.tsx
```

## Componentização

- `App`: composição geral da página.
- `Sidebar`: navegação principal e apresentação pessoal.
- Seções: `Home`, `Projects`, `Games`, `Articles`, `Experiments`, `Contact`.
- `components`: elementos reutilizáveis com benefício concreto, sem abstração prematura.

## Conteúdo

Dados separados da apresentação:

- `src/data/profile.ts` — informações pessoais e links.
- `src/data/projects.ts` — projetos.
- `src/data/skills.ts` — habilidades e tecnologias.
- Conteúdo adicional conforme as seções (jogos, artigos, experimentos).

## Qualidade

- TypeScript strict.
- ESLint.
- Vitest + Testing Library.
- Husky: `pre-commit` (lint-staged) e `pre-push` (typecheck, test, build).

## Performance

- Otimizar imagens.
- Evitar dependências desnecessárias.
- Manter a aplicação estática e simples de hospedar.

## Restrições arquiteturais

Não implementar nesta versão: backend/API, banco de dados, autenticação, painel administrativo, CRUD, cadastro de usuários, orquestração avançada de agentes.
