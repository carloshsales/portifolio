# TASK-006 — Rever e completar a seção de projetos

- Change: 001-portfolio-mvp
- Status: ARCHIVED
- Depende de: TASK-005
- Início: 2026-11-25
- Verificação: VERIFIED (2026-11-25) — pnpm test: Test Files 6 passed (6), Tests 278 passed | 1 skipped (279), 64.67s. Avisos Not implemented: HTMLCanvasElement's getContext() sao ruido do jsdom. pnpm test:e2e: pnpm build -> tsc --noEmit && vite build concluido (37 modulos, built in 209ms); Playwright Running 75 tests using 6 workers, 73 passed, 2 skipped (16.5s). Ignorados: [desktop] e2e\\responsive.spec.ts:1056:1 e :1096:1. 13 testes novos (265->278 passed). Codigo de saida nao capturado por limitacao de shell do executor (cmd /c recusado); verificador aceitou resumo de sucesso explicito ao abrigo do contrato minimo.
- Evidência: pnpm test: Test Files 6 passed (6), Tests 278 passed | 1 skipped (279), 64.67s. Avisos Not implemented: HTMLCanvasElement's getContext() sao ruido do jsdom. pnpm test:e2e: pnpm build -> tsc --noEmit && vite build concluido (37 modulos, built in 209ms); Playwright Running 75 tests using 6 workers, 73 passed, 2 skipped (16.5s). Ignorados: [desktop] e2e\\responsive.spec.ts:1056:1 e :1096:1. 13 testes novos (265->278 passed). Codigo de saida nao capturado por limitacao de shell do executor (cmd /c recusado); verificador aceitou resumo de sucesso explicito ao abrigo do contrato minimo.
- Plano de ação: none
- Arquivada em: 2026-11-25

## Objetivo

Rever e completar a seção de projetos já implementada, garantindo que cada projeto é apresentado em card com título, descrição e tecnologias, que os links de repositório e de demonstração abrem em nova janela de forma segura, que os links opcionais em falta não são renderizados e que a seção degrada para um estado vazio sem quebrar o layout.

## Contexto

Esta tarefa foi originalmente escrita para implementar a seção de projetos. Ela já está implementada no repositório, introduzida no commit de bootstrap `943fe07` (2026-11-14) e nunca alterada desde então.

A implementação existente cumpre já os cinco entregáveis de apresentação, listados na secção `## Entregáveis`. A revisão incide, por isso, sobre aquilo que a implementação existente não cobre:

- a normalização dos dados em `src/data/projects.ts`, que filtra por `title` e `description` mas não por `technologies` nem pelas URLs, e diverge do critério de "valor preenchido" usado na apresentação;
- o atributo `rel` dos links, que é `noreferrer` sem `noopener`, ao contrário do que os entregáveis exigem;
- a ausência de testes que exercitem os entregáveis desta tarefa, porque `src/test/content.test.tsx` usa sempre `projects: []` como fixture e nenhum teste verifica `target="_blank"`, `rel="noreferrer"` ou o estado vazio da seção.

Esta tarefa passa portanto a ser de **revisão e consolidação**, e não de implementação. O conteúdo real dos projetos é preenchido na `TASK-009`, que depende desta tarefa.

## Arquivos

- `src/sections/Projects/Projects.tsx` (revisão e correção, se necessária)
- `src/sections/Projects/Projects.module.css` (revisão e correção, se necessária)
- `src/data/projects.ts` (revisão e correção da normalização, se necessária)
- `src/test/content.test.tsx` (revisão e ampliação dos testes da seção de projetos, se necessária)
- `src/App.test.tsx` (revisão e ampliação dos testes da seção de projetos, se necessária)
- `src/test/accessibility.test.tsx` (revisão e ampliação dos testes da seção de projetos, se necessária)
- `e2e/responsive.spec.ts` (revisão e ampliação dos testes da seção de projetos, se necessária)
- `src/content/projects.ts` (leitura dos dados; sem escrita)

## Entregáveis

- Os projetos são apresentados em cards, com título em `h3`, descrição e tecnologias.
- A hierarquia de títulos mantém `h2` para o título da seção e `h3` para o título de cada card.
- Cada link de repositório e de demonstração abre em nova janela, com `target="_blank"` e `rel="noreferrer noopener"`.
- Links opcionais que não existam não são renderizados: um link só é apresentado quando o respetivo valor está preenchido.
- A lista de tecnologias de cada card é apresentada com o rótulo acessível `Tecnologias utilizadas`.
- A seção apresenta o estado vazio com o texto `Ainda não há projetos para apresentar.` quando não há projetos.
- Os dados estão separados da apresentação visual: a seção lê de `src/data/projects.ts`, nunca de `src/content/` diretamente.

## Regras

- **Não recriar** a seção de projetos. Revisar e consolidar apenas.
- **Não editar `src/content/projects.ts`** nesta tarefa. O preenchimento do conteúdo real é feito à parte, na `TASK-009`, com base em `docs/conteudo-real.md`.
- A seção lê de `src/data/projects.ts`, nunca de `src/content/` diretamente.
- Não inventar projetos, tecnologias ou links.
- "Valor preenchido" significa, em todo o código desta tarefa, um valor não vazio depois de `trim()`. O mesmo critério é usado na normalização de `src/data/projects.ts` e na decisão de renderizar um link, para que a seção e a fonte de dados não discordem.
- A normalização em `src/data/projects.ts` é a única camada que decide o que um projeto expõe, e aplica-se antes da exportação:
  - remove os projetos sem título, sem descrição ou sem tecnologias;
  - remove, dentro de cada projeto, os itens vazios da lista de tecnologias, e remove o projeto se a lista ficar sem itens;
  - remove o campo `repositoryUrl` ou `liveUrl` quando o valor estiver vazio depois de `trim()`, ou quando não começar por `https://` ou `http://`.
- Depois da normalização, um campo de URL ausente ou inválido não existe no objeto exportado, pelo que a apresentação se limita a verificar a presença do valor. A apresentação não repete a validação de protocolo nem de preenchimento.
- A URL de um link de projeto é válida quando começa por `https://` ou `http://`. Um valor que não cumpra este critério não é normalizado nem apresentado como link.
- A lista de tecnologias só é apresentada quando o projeto tem tecnologias, o que a normalização garante.
- O texto visível e o rótulo acessível são apresentados em português brasileiro. O texto do estado vazio e o rótulo `Tecnologias utilizadas` são os fixados nos entregáveis e podem ser corrigidos para lhes corresponder.
- Os estilos usam CSS Modules e os tokens globais de `src/styles/tokens.css`.
- O TypeScript é estrito, sem `any` implícito nem valores por omissão silenciosos.
- Se a verificação identificar um defeito fora dos ficheiros autorizados, registar a ocorrência e não alargar o âmbito sem aprovação do utilizador.

## Testes

- `pnpm lint`, `pnpm typecheck` e `pnpm test` passam.
- `src/test/content.test.tsx` confirma que não há marcadores de placeholder nem URLs de exemplo.
- `src/test/content.test.tsx` confirma, com uma fixture de projetos que inclua `repositoryUrl` e `liveUrl`, que cada link é apresentado com `target="_blank"` e `rel` com `noreferrer` e `noopener`, que a fixture é usada apenas no âmbito do teste e que nenhum link é apresentado para um projeto sem URL.
- `src/test/content.test.tsx` confirma, com a fixture de projetos vazia, que a seção apresenta o texto de estado vazio `Ainda não há projetos para apresentar.` e que nenhum card é apresentado.
- `src/test/content.test.tsx` confirma, com fixtures de projetos inválidos, que a normalização em `src/data/projects.ts` remove o projeto sem tecnologias, remove os itens vazios da lista de tecnologias e remove os campos de URL vazios ou sem protocolo `http://` ou `https://`.
- `src/App.test.tsx` confirma que a seção de projetos é apresentada com o título `Projetos` e que o título de cada card é um `h3` dentro da região da seção.
- `src/test/accessibility.test.tsx` confirma ausência de violações automáticas, incluindo na seção de projetos com a fixture de projetos preenchida.
- `pnpm test:e2e` confirma que não há links com `href` vazio nem `javascript:`.
- A verificação visual dos cards legíveis e de links que devolvem 404 fica para a `TASK-009`, que fornece o conteúdo real e depende desta tarefa.

## Aceitação

A seção de projetos renderiza corretamente os dois estados verificáveis sem conteúdo real: com a fixture de zero projetos, apresenta o texto de estado vazio `Ainda não há projetos para apresentar.` e nenhum card; com uma fixture de um projeto com `repositoryUrl` e `liveUrl`, apresenta um card com o título em `h3`, a descrição, as tecnologias sob o rótulo acessível `Tecnologias utilizadas` e dois links com `target="_blank"` e `rel` contendo `noreferrer` e `noopener`. Um projeto sem URLs não apresenta qualquer link. A normalização em `src/data/projects.ts` remove os projetos sem título, sem descrição ou sem tecnologias, remove os itens vazios da lista de tecnologias e remove o projeto se a lista ficar sem itens, e remove os campos de URL vazios ou cujo valor não comece por `https://` ou `http://`.

## Checklist de clareza

- Objetivo único e verificável — ATENDE (revisão e consolidação da seção de projetos já implementada, com o delta registado em `## Contexto`)
- Arquivos afetados — ATENDE
- Entregáveis concretos — ATENDE
- Contrato de entrada, saída e erros — ATENDE (entrada: `src/data/projects.ts`, que normaliza `src/content/projects.ts`; saída: cards de projeto renderizados; erros: lista vazia apresenta o estado vazio e lista sem tecnologias é removida na normalização, sem erro)
- Testes obrigatórios — ATENDE
- Critério de aceitação objetivo — ATENDE
- Dependências declaradas explicitamente — ATENDE
- Ausência de decisões pendentes para o implementador — ATENDE
