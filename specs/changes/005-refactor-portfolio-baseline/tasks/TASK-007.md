# TASK-007 — Preparar a task de dados reais

- Change: 005-refactor-portfolio-baseline
- Status: COMPLETED
- Depende de: TASK-002
- Início: 2026-11-16
- Verificação: VERIFIED (2026-11-16) — docs/conteudo-real.md criado com 9 secoes (ficheiros a editar, identidade, contactos, projetos, habilidades, fotografia, ordem de preenchimento, validacao, ficheiros relacionados), incluindo tabela campo a campo com obrigatoriedade e exemplo, regras de conteudo por seccao e checklist de validacao; tarefas da change 001 alinhadas em formato v2 com os 8 criterios de clareza: TASK-005 (secao inicial), TASK-006 (projetos), TASK-007 (habilidades), TASK-008 (contacto) reescritas com objetivo, ficheiros, entregaveis, regras, testes, aceitacao e checklist; TASK-009 (preencher o conteudo real) criada como tarefa exclusiva de escrita em src/content/; TASK-010 (responsividade e performance) reescrita em formato v2 e liberada da dependencia de TASK-009, passando a depender de TASK-005 a TASK-008; escopos disjuntos verificados: TASK-005 a TASK-008 apenas leem src/content/ e proibem explicitamente a escrita, apenas TASK-009 escreve; grafo de dependencias da change 001 validado pelo parser sem ciclos, com 13 tarefas e dependencySource explicit em todas; pnpm lint, pnpm format:check, pnpm typecheck e pnpm test (134 passando, 1 pulado) aprovados
- Evidência: docs/conteudo-real.md criado com 9 secoes (ficheiros a editar, identidade, contactos, projetos, habilidades, fotografia, ordem de preenchimento, validacao, ficheiros relacionados), incluindo tabela campo a campo com obrigatoriedade e exemplo, regras de conteudo por seccao e checklist de validacao; tarefas da change 001 alinhadas em formato v2 com os 8 criterios de clareza: TASK-005 (secao inicial), TASK-006 (projetos), TASK-007 (habilidades), TASK-008 (contacto) reescritas com objetivo, ficheiros, entregaveis, regras, testes, aceitacao e checklist; TASK-009 (preencher o conteudo real) criada como tarefa exclusiva de escrita em src/content/; TASK-010 (responsividade e performance) reescrita em formato v2 e liberada da dependencia de TASK-009, passando a depender de TASK-005 a TASK-008; escopos disjuntos verificados: TASK-005 a TASK-008 apenas leem src/content/ e proibem explicitamente a escrita, apenas TASK-009 escreve; grafo de dependencias da change 001 validado pelo parser sem ciclos, com 13 tarefas e dependencySource explicit em todas; pnpm lint, pnpm format:check, pnpm typecheck e pnpm test (134 passando, 1 pulado) aprovados
- Plano de ação: none

## Objetivo

Deixar preparado, com formato e campos definidos, o trabalho de preencher o conteúdo real do portfólio, para que a introdução dos dados seja uma tarefa mecânica e sem decisões técnicas em aberto.

## Arquivos

- `docs/conteudo-real.md` (criação)
- `specs/changes/001-portfolio-mvp/tasks/TASK-005.md` (alinhamento do escopo)
- `specs/changes/001-portfolio-mvp/tasks/TASK-006.md` (alinhamento do escopo)
- `specs/changes/001-portfolio-mvp/tasks/TASK-007.md` (alinhamento do escopo)
- `specs/changes/001-portfolio-mvp/tasks/TASK-008.md` (alinhamento do escopo)

## Entregáveis

- `docs/conteudo-real.md` com o inventário de tudo o que é preciso fornecer, por secção.
- Formato de cada item, com exemplo de preenchimento e validação.
- Lista dos ficheiros a editar: `src/content/profile.ts`, `src/content/projects.ts`, `src/content/skills.ts`.
- Regras de conteúdo: sem inventar experiência, sem empresas anteriores, sem links inventados.
- Critérios de verificação após o preenchimento: ausência de placeholder, links válidos, foto com proporção correta.
- Tarefas `TASK-005` a `TASK-008` da change 001 alinhadas para que a secção e a substituição do conteúdo sejam escopos coerentes e não sobrepostos.

## Regras

- Nenhum dado real é inventado ou inserido nesta task.
- A foto é tratada como ficheiro binário em `public/images/`; documentar o nome esperado e as dimensões recomendadas.
- As tarefas da change 001 não podem ter duas tarefas com o mesmo ficheiro como objetivo principal.
- Nenhuma dependência de runtime nova.

## Testes

- `docs/conteudo-real.md` cobre as quatro secções do portfólio.
- Conferência de que cada item do inventário tem um destino concreto no código.
- `pnpm format:check` passa.

## Aceitação

O inventário existe, cada item tem destino no código e as tarefas `TASK-005` a `TASK-008` têm escopos disjuntos e coerentes.

## Checklist de clareza

- Objetivo único e verificável — ATENDE
- Arquivos afetados — ATENDE
- Entregáveis concretos — ATENDE
- Contrato de entrada, saída e erros — NÃO SE APLICA (tarefa documental: não expõe interface; a entrada é o inventário de dados a recolher e a saída é o ficheiro `docs/conteudo-real.md` e o alinhamento das tarefas)
- Testes obrigatórios — ATENDE
- Critério de aceitação objetivo — ATENDE
- Dependências declaradas explicitamente — ATENDE
- Ausência de decisões pendentes para o implementador — ATENDE
