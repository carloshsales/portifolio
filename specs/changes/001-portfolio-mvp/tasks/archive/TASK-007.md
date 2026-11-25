# TASK-007 — Rever e completar a seção de habilidades

- Change: 001-portfolio-mvp
- Status: ARCHIVED
- Depende de: TASK-006
- Início: 2026-11-25
- Verificação: VERIFIED (2026-11-25) — pnpm test: 6 files, 328 passed 1 skipped (329), 131s. pnpm test:e2e: build 37 modules; 75 tests, 73 passed, 2 skipped, 20.9s. Verificador OK.
- Evidência: pnpm test: 6 files, 328 passed 1 skipped (329), 131s. pnpm test:e2e: build 37 modules; 75 tests, 73 passed, 2 skipped, 20.9s. Verificador OK.
- Plano de ação: none
- Arquivada em: 2026-11-25

## Objetivo

Rever e completar a seção de habilidades já implementada, garantindo que as habilidades são apresentadas agrupadas por categoria, que cada categoria tem título e lista de tecnologias, que a lista mantém a semântica de lista em leitores de ecrã e que a seção degrada para um estado vazio sem quebrar o layout.

## Contexto

Esta tarefa foi originalmente escrita para implementar a seção de habilidades. Ela já está implementada no repositório, introduzida no commit de bootstrap `943fe07` (2026-11-14) e nunca alterada desde então.

A implementação existente cumpre já os entregáveis de apresentação: grupos com título em `h3`, lista de tecnologias, estado vazio e leitura a partir de `src/data/skills.ts`. A revisão incide, por isso, sobre aquilo que a implementação existente não cobre:

- a lista de habilidades usa `list-style: none` sem `role="list"`, pelo que perde a semântica de lista em leitores de ecrã como Safari/VoiceOver (WCAG 1.3.1). O padrão já está previsto no reset do projecto, em `src/styles/reset.css`, que define `ul[role='list'] { list-style: none; }`;
- a lista herda o recuo de 40px do `padding-inline-start` do browser, porque o reset global só zera margens. As listas da secção de projetos já foram corrigidas, e esta é a correção equivalente;
- `src/data/skills.ts` filtra apenas por título e número de habilidades, e não normaliza: não aparca os títulos nem as habilidades, não remove habilidades vazias e não descarta o grupo quando a lista fica sem itens. É divergente da normalização já aplicada em `src/data/projects.ts`;
- não existem testes que exercitem os entregáveis desta tarefa. `src/test/content.test.tsx` não refere a seção de habilidades, e não há teste do estado vazio, da hierarquia de títulos, da acessibilidade com habilidades preenchidas nem da normalização.

Esta tarefa passa portanto a ser de **revisão e consolidação**, e não de implementação. O conteúdo real das habilidades é preenchido na `TASK-009`, que depende desta tarefa.

## Arquivos

- `src/sections/Skills/Skills.tsx` (revisão e correção, se necessária)
- `src/sections/Skills/Skills.module.css` (revisão e correção, se necessária)
- `src/data/skills.ts` (revisão e correção da normalização, se necessária)
- `src/test/content.test.tsx` (revisão e ampliação dos testes da seção de habilidades, se necessária)
- `src/App.test.tsx` (revisão e ampliação dos testes da seção de habilidades, se necessária)
- `src/test/accessibility.test.tsx` (revisão e ampliação dos testes da seção de habilidades, se necessária)
- `e2e/responsive.spec.ts` (revisão e ampliação dos testes da seção de habilidades, se necessária)
- `src/content/skills.ts` (leitura dos dados; sem escrita)

## Entregáveis

- As habilidades são apresentadas agrupadas por categoria, cada categoria num bloco próprio.
- Cada categoria tem um título em `h3` e uma lista das suas habilidades.
- A hierarquia de títulos mantém `h2` para o título da seção e `h3` para cada categoria.
- A lista de habilidades expõe a semântica de lista, com `role="list"`, para que não a percam os leitores de ecrã.
- A lista de habilidades não herda o recuo do browser e alinha com o título da categoria.
- A seção apresenta o estado vazio com o texto `Ainda não há habilidades para apresentar.` quando não há grupos.
- Os dados estão separados da apresentação visual: a seção lê de `src/data/skills.ts`, nunca de `src/content/` diretamente.
- Não são exibidos níveis de proficiência, percentagens ou classificações.

## Regras

- **Não recriar** a seção de habilidades. Revisar e consolidar apenas.
- **Não editar `src/content/skills.ts`** nesta tarefa. O preenchimento do conteúdo real é feito à parte, na `TASK-009`, com base em `docs/conteudo-real.md`.
- A seção lê de `src/data/skills.ts`, nunca de `src/content/` diretamente.
- Não inventar habilidades, categorias ou classificações.
- "Valor preenchido" significa, em todo o código desta tarefa, um valor não vazio depois de `trim()`. O mesmo critério é usado na normalização de `src/data/skills.ts` e na decisão de apresentar um grupo, para que a seção e a fonte de dados não discordem.
- A normalização em `src/data/skills.ts` é a única camada que decide o que um grupo expõe, e aplica-se antes da exportação:
  - remove os grupos sem título ou sem habilidades;
  - remove, dentro de cada grupo, as habilidades vazias, e remove o grupo se a lista ficar sem itens;
  - exporta o título e as habilidades aparados.
- Depois da normalização, um grupo sem título ou sem habilidades não existe no objeto exportado, pelo que a apresentação se limita a verificar a presença do grupo.
- A lista de habilidades **não** recebe `aria-label`. O contexto é dado pelo título `h3` da categoria, que precede imediatamente a lista dentro do mesmo bloco de grupo. Um rótulo adicional repetiria a informação do título.
- O texto visível é apresentado em português brasileiro. O texto do estado vazio é o fixado nos entregáveis e pode ser corrigido para lhe corresponder.
- Os estilos usam CSS Modules e os tokens globais de `src/styles/tokens.css`.
- O TypeScript é estrito, sem `any` implícito nem valores por omissão silenciosos.
- Se a verificação identificar um defeito fora dos ficheiros autorizados, registar a ocorrência e não alargar o âmbito sem aprovação do utilizador.
- **Não tocar** nas listas da seção de contato nem da barra lateral. Aplicam-se `role="list"` e `padding: 0` apenas à seção de habilidades; as restantes ficam para as respectivas tarefas.

## Testes

- `pnpm lint`, `pnpm typecheck` e `pnpm test` passam.
- `src/test/content.test.tsx` confirma que não há marcadores de placeholder.
- `src/test/content.test.tsx` confirma, com uma fixture de dois grupos, que cada grupo é apresentado com o título em `h3` e com a lista das suas habilidades, e que a lista expõe `role="list"`.
- `src/test/content.test.tsx` confirma, com a fixture de grupos vazia, que a seção apresenta o texto de estado vazio `Ainda não há habilidades para apresentar.` e que nenhum grupo é apresentado.
- `src/test/content.test.tsx` confirma, com fixtures inválidas, que a normalização em `src/data/skills.ts` remove o grupo sem título, remove as habilidades vazias, remove o grupo quando a lista fica sem itens e apara o título e as habilidades.
- `src/App.test.tsx` confirma que a seção de habilidades é apresentada com o título `Habilidades` e que o título de cada categoria é um `h3` dentro da região da seção.
- `src/test/accessibility.test.tsx` confirma ausência de violações automáticas, incluindo na seção de habilidades com a fixture preenchida.
- `pnpm test:e2e` confirma que a seção está presente e não há overflow horizontal.
- A verificação visual dos grupos legíveis e responsivos fica para a `TASK-009`, que fornece o conteúdo real e depende desta tarefa.

## Aceitação

A seção de habilidades renderiza corretamente os dois estados verificáveis sem conteúdo real: com a fixture de zero grupos, apresenta o texto de estado vazio `Ainda não há habilidades para apresentar.` e nenhum grupo; com uma fixture de dois grupos, apresenta cada grupo com o título em `h3` e a lista das suas habilidades, e a lista expõe `role="list"`. A normalização em `src/data/skills.ts` remove os grupos sem título ou sem habilidades, remove as habilidades vazias, remove o grupo quando a lista fica sem itens e apara o título e as habilidades.

## Riscos

- **O alinhamento visual da lista não é verificável por asserção automática.** O `padding: 0` resolve um valor herdado do browser (`padding-inline-start: 40px`), e o efeito é observacional. A verificação é por inspeção do alinhamento entre o título da categoria e a lista.
- **O `role="list"` sobre um `ul` é redundante para a semântica HTML e só é distinguível pelo atributo explícito.** O teste tem de procurar o atributo, e não o papel acessível, que já seria `list` sem a correcção.
- **A lista de habilidades não recebe `aria-label`, ao contrário da lista de tecnologias da seção de projetos.** É uma divergência de padrão entre secções adjacentes, deliberada: na seção de projetos a lista está dentro de um card, sem título que a identifique; aqui precede-a imediatamente o `h3` da categoria. A decisão está tomada e justificada, e as seçes de contato e da barra lateral mantêm o padrão anterior por pertencerem a outras tarefas.
- **O conteúdo real está vazio durante esta tarefa.** A verificação visual dos grupos legíveis e responsivos depende da `TASK-009`.

## Checklist de clareza

- Objetivo único e verificável — ATENDE (revisão e consolidação da seção de habilidades já implementada, com o delta registado em `## Contexto`)
- Arquivos afetados — ATENDE
- Entregáveis concretos — ATENDE
- Contrato de entrada, saída e erros — ATENDE (entrada: `src/data/skills.ts`, que normaliza `src/content/skills.ts`; saída: grupos de habilidades renderizados; erros: lista vazia apresenta o estado vazio, e um grupo sem habilidades válidas é removido na normalização, sem erro)
- Testes obrigatórios — ATENDE
- Critério de aceitação objetivo — ATENDE
- Dependências declaradas explicitamente — ATENDE
- Ausência de decisões pendentes para o implementador — ATENDE
