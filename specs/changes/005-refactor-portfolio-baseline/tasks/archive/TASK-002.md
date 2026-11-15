# TASK-002 — Isolar o conteúdo do utilizador e remover placeholders

- Change: 005-refactor-portfolio-baseline
- Status: ARCHIVED
- Depende de: TASK-001
- Início: 2026-11-15
- Verificação: VERIFIED (2026-11-15) — src/content/{profile,projects,skills}.ts criados com conteudo vazio; src/data/ reexporta com normalizacao (filtro de social sem URL, projetos sem titulo/descricao, grupos sem skills); Home.tsx omite resumo e acoes quando vazio e so mostra 'Ver projetos' se houver projetos; Sidebar.tsx usa 'Portfolio' como fallback e omite identidade vazia; src/test/content.test.tsx criado; App.test.tsx ajustado para h1/h2; bundle sem placeholder confirmado por scan de dist/assets; pnpm lint, pnpm format:check, pnpm typecheck, pnpm test (132 passando, 1 pulado) e pnpm build aprovados; renderizacao verificada no browser sem qualquer placeholder
- Evidência: src/content/{profile,projects,skills}.ts criados com conteudo vazio; src/data/ reexporta com normalizacao (filtro de social sem URL, projetos sem titulo/descricao, grupos sem skills); Home.tsx omite resumo e acoes quando vazio e so mostra 'Ver projetos' se houver projetos; Sidebar.tsx usa 'Portfolio' como fallback e omite identidade vazia; src/test/content.test.tsx criado; App.test.tsx ajustado para h1/h2; bundle sem placeholder confirmado por scan de dist/assets; pnpm lint, pnpm format:check, pnpm typecheck, pnpm test (132 passando, 1 pulado) e pnpm build aprovados; renderizacao verificada no browser sem qualquer placeholder
- Plano de ação: none
- Arquivada em: 2026-11-15

## Objetivo

Isolar o conteúdo que o utilizador vai fornecer em `src/content/`, mantendo `src/data/` como ponto de importação estável, e garantir que a aplicação nunca renderiza texto fictício.

## Arquivos

- `src/content/profile.ts` (criação)
- `src/content/projects.ts` (criação)
- `src/content/skills.ts` (criação)
- `src/data/profile.ts` (alteração)
- `src/data/projects.ts` (alteração)
- `src/data/skills.ts` (alteração)
- `src/sections/Home/Home.tsx` (alteração)
- `src/sections/Projects/Projects.tsx` (alteração)
- `src/sections/Skills/Skills.tsx` (alteração)
- `src/sections/Contact/Contact.tsx` (alteração)
- `src/types/index.ts` (alteração, se necessário)

## Entregáveis

- `src/content/profile.ts` com `name`, `role`, `summary`, `photoUrl`, `location` e `social` vazios.
- `src/content/projects.ts` com `projects` como lista vazia.
- `src/content/skills.ts` com `skillGroups` como lista vazia.
- `src/data/` reexporta o conteúdo, aplicando a filtragem de `social` com `url` vazia.
- Nenhum componente importa diretamente de `src/content/`; todos continuam a importar de `src/data/`.
- A aplicação renderizada não contém nenhum placeholder, nome fictício, email fictício ou URL de exemplo.
- A ação "Ver projetos" não é renderizada quando não existem projetos.
- A área de texto e as ações do Início não são renderizadas quando o conteúdo está vazio.

## Regras

- `src/data/` exporta exatamente os mesmos nomes usados hoje: `profile`, `projects`, `skillGroups`.
- Nenhum componente é alterado para além do necessário para suportar o estado vazio.
- Os tipos existentes são reutilizados; não criar tipos paralelos.
- Não introduzir dependências de runtime.
- Não inserir dados reais: esta task prepara a estrutura, o preenchimento é trabalho posterior.
- A foto em `public/images/foto-perfil.jpg` é mantida como referência padrão.
- A localização de `photoUrl` permanece `/images/foto-perfil.jpg`.

## Testes

- `pnpm typecheck` passa com `strict: true`.
- `pnpm test` passa.
- Novo teste em `src/test/content.test.tsx` que verifica que a aplicação renderizada não contém a cadeia `[` nem `teu-utilizador` nem `exemplo.com`.
- `pnpm build` passa e o bundle não contém as cadeias de placeholder.

## Aceitação

`src/content/` existe com os três ficheiros, `src/data/` reexporta, os componentes não mudaram de fonte de importação e a aplicação renderizada não mostra qualquer texto de placeholder.

## Checklist de clareza

- Objetivo único e verificável — ATENDE
- Arquivos afetados — ATENDE
- Entregáveis concretos — ATENDE
- Contrato de entrada, saída e erros — ATENDE (entrada: conteúdo vazio em `src/content/`; saída: a mesma API pública de `src/data/` e renderização sem placeholders; erros: a falha de typecheck bloqueia a task)
- Testes obrigatórios — ATENDE
- Critério de aceitação objetivo — ATENDE
- Dependências declaradas explicitamente — ATENDE
- Ausência de decisões pendentes para o implementador — ATENDE
