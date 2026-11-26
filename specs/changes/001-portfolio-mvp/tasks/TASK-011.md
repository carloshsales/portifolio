# TASK-011 — Transformar o portfólio numa aplicação multi-página

- Change: 001-portfolio-mvp
- Status: IN PROGRESS
- Depende de: TASK-009, TASK-010
- Início: 2026-11-26
- Verificação: PENDING
- Evidência: —
- Plano de ação: none

## Objetivo

Transformar o portfólio de página única com âncoras numa aplicação
multi-página com URLs próprios, autorizada pelo utilizador, e estabelecer a
navegação entre as sete secções.

Ao final desta task:

- cada secção é uma página com URL própria (`/`, `/projetos`, `/habilidades`,
  `/contato`, `/jogos`, `/artigos`, `/experimentos`);
- a navegação entre secções é feita por clique no item de menu, sem deslocar
  a página por scroll;
- cada página tem a sua própria barra de rolagem vertical, conforme a
  quantidade de conteúdo;
- a navegação lateral lista as sete secções, com o link da secção actual
  marcado com `aria-current="page"`.

Esta task é a **fundação técnica**. O conteúdo real do perfil, dos projetos e
das habilidades, e a implementação das três secções novas — Jogos, Artigos e
Experimentos — pertencem à **TASK-014**, que depende desta.

### Condição de conclusão

**Esta task não fica bloqueada à espera de conteúdo externo.** O conteúdo
real depende de informação que o utilizador forneça, e que não consta do
repositório: `docs/conteudo-real.md:3` é um inventário do que pedir, não
dados reais.

- Se o conteúdo for fornecido, é escrito em `src/content/` pela TASK-014.
- Se não for fornecido, as secções apresentam a mensagem de estado vazio
  actual, e **a task é considerada concluída na mesma**.

A task conclui com a implementação verificada das sete rotas, do mecanismo de
navegação e da estrutura de uma página por secção. A introdução do conteúdo
real, a mensagem unificada "Em construção" e as secções completas são
trabalho da TASK-014, e não são motivo para reter esta task.

## Contexto

O portfólio é hoje uma aplicação de página única. `src/App.tsx` renderiza as
quatro secções (`Home`, `Projects`, `Skills`, `Contact`) dentro do mesmo
elemento `main`, e `src/components/Sidebar.tsx:15-20` navega por âncoras
(`#inicio`, `#projetos`, `#habilidades`, `#contato`).

O mecanismo de destaque da navegação assenta inteiramente em scroll:
`src/hooks/useActiveSection.ts` (179 linhas) usa `IntersectionObserver` com uma
faixa central de 5 % da altura da viewport para determinar qual secção está
visível, e marca o link correspondente com `aria-current="true"`. Todo o
conjunto de asserções de `src/App.test.tsx:301-394` e de
`e2e/responsive.spec.ts` depende desse mecanismo.

`docs/projeto.md`, secção 2.1, declara três secções **por construir**: Jogos,
Artigos e Experimentos. A TASK-011 cria as rotas que as servem, com o
componente de secção a ser implementado na TASK-014.

A TASK-009 preparou a canalização de conteúdo com fixtures
(`src/test/fixtures/`), e a TASK-010 confirmou a responsividade e o
desempenho nos três viewports, com `dist/` abaixo de 400 kB.

### Decisões tomadas pelo utilizador

1. **Multi-página.** Cada secção passa a ter a sua própria página, navegada
   por clique no item de menu, sem scroll entre secções. Cada página tem a
   sua barra de rolagem vertical própria, em função da quantidade de
   conteúdo.
2. **Router.** A navegação é feita com **TanStack Router**, com URLs
   limpos, sem `#`: `/`, `/projetos`, `/habilidades`, `/contato`, `/jogos`,
   `/artigos`, `/experimentos`.
3. **Conteúdo.** O conteúdo real é fornecido pelo utilizador e escrito na
   TASK-014. O que não existir é apresentado como "Em construção".
4. **Estado vazio.** A mensagem "Em construção" é uniforme em **todas** as
   secções. A TASK-014 implementa o componente partilhado que a apresenta.
5. **Dívidas técnicas.** As dívidas registadas em `docs/history.md:583-584` —
   o override `window.__PORTFOLIO_PROFILE__` activo em produção, a regex
   permissiva de `src/data/profile.ts:4`, o teste E2E da barra lateral, o
   foco do CTA primário e os casts frágeis — **não são objectivo desta
   task**. Continuam pendentes e sem task destino.

### Impacto na documentação existente

Esta task contradiz três afirmações registadas no repositório, que têm de
ser corrigidas no mesmo âmbito:

- `docs/projeto.md:83-84` — "O portfólio é uma experiência de página única,
  com navegação lateral e secções organizadas." Passa a descrever uma
  aplicação multi-página com navegação lateral e rotas.
- `docs/deployment.md:19` — "SPA fallback: **Desnecessário.** A aplicação tem
  uma única rota." Com rotas no cliente, o fallback passa a ser
  **necessário**: sem ele, um carregamento directo de `/projetos` devolve
  404. É a divergência mais consequente desta task e está detalhada nos
  Riscos.
- `docs/deployment.md:18` — "Rotas: Só âncoras (`#inicio`, `#projetos`,
  `#habilidades`, `#contato`). Sem router." Passa a listar as sete rotas.

A correcção de `docs/deployment.md` é **documental e de preparação**: esta
task não escolhe o destino de publicação, não cria configuração de
alojamento e não publica nada. A decisão de destino e a criação dos ficheiros
de rewrite pertencem à TASK-012.

## Arquivos

- `src/routes/__root.tsx` (criação)
- `src/routes/__root.module.css` (criação)
- `src/routes/index.tsx` (criação)
- `src/routes/projetos.tsx` (criação)
- `src/routes/habilidades.tsx` (criação)
- `src/routes/contato.tsx` (criação)
- `src/routes/jogos.tsx` (criação)
- `src/routes/artigos.tsx` (criação)
- `src/routes/experimentos.tsx` (criação)
- `src/router.tsx` (criação)
- `src/main.tsx` (alteração)
- `src/App.tsx` (remoção)
- `src/App.module.css` (remoção)
- `src/styles/globals.css` (alteração)
- `src/components/Sidebar.tsx` (alteração)
- `src/components/Sidebar.module.css` (alteração)
- `src/components/Section.tsx` (alteração)
- `src/components/Section.module.css` (alteração)
- `src/components/icons.tsx` (alteração)
- `src/hooks/useActiveSection.ts` (remoção)
- `src/sections/Home/Home.tsx` (alteração)
- `src/sections/Home/Home.module.css` (alteração)
- `src/test/accessibility.test.tsx` (alteração)
- `src/test/content.test.tsx` (alteração)
- `src/App.test.tsx` (alteração)
- `e2e/responsive.spec.ts` (alteração)
- `e2e/navigation.spec.ts` (criação)
- `e2e/playwright.config.ts` (alteração)
- `vite.config.ts` (alteração)
- `package.json` (alteração)
- `pnpm-lock.yaml` (alteração)
- `tsconfig.json` (alteração)
- `src/vite-env.d.ts` (alteração condicional)
- `docs/projeto.md` (alteração)
- `docs/deployment.md` (alteração)

Cada bullet da secção `## Arquivos` declara exactamente um caminho entre
crases. O parser de âmbito de `scripts/rawspec-v2.mjs` extrai apenas o
primeiro caminho de cada bullet, pelo que dois caminhos no mesmo bullet
produziriam um âmbito menor do que o declarado.

Quatro ficheiros são **sobreposição sequencial intencional** com a
TASK-014: `src/routes/jogos.tsx`, `src/routes/artigos.tsx`,
`src/routes/experimentos.tsx` e `src/test/content.test.tsx`. Esta task
cria as três rotas com um componente mínimo e migra o ficheiro de testes;
a TASK-014 estende-os. A ordem do grafo garante a sequência. Todos os
outros ficheiros são exclusivos desta task.

O `pnpm-lock.yaml` está no âmbito porque a adição das duas
dependências do router altera o lockfile, e não há forma de adicionar
uma dependência sem o fazer. O gate de âmbito de
`scripts/rawspec-v2.mjs` rejeitaria o commit sem esta entrada, e a
integração contínua corre `pnpm install --frozen-lockfile`
(`.github/workflows/ci.yml:39`), que falha com um lockfile
desatualizado. O lockfile é gerado pelo `pnpm add` e não é editado à
mão.

## Entregáveis

- Sete rotas funcionais: `/`, `/projetos`, `/habilidades`, `/contato`,
  `/jogos`, `/artigos` e `/experimentos`.
- A navegação lateral lista as sete secções, com ícones próprios para as
  três novas, e o link da secção actual está marcado com `aria-current`.
- Clicar num item de menu navega para a página da secção, **sem** deslocar
  a página por scroll.
- Cada página tem a sua barra de rolagem vertical, activada apenas quando o
  conteúdo excede a altura da viewport.
- As quatro secções existentes — Início, Projetos, Habilidades e Contato —
  renderizam uma página cada, com o conteúdo actual de `src/data/`.
- As três rotas novas — `/jogos`, `/artigos` e `/experimentos` — existem e
  são navegáveis, com um componente de secção mínimo. **O conteúdo real e
  o componente completo destas secções pertencem à TASK-014.**
- O `useActiveSection` e o mecanismo de `IntersectionObserver` removidos, por
  deixarem de ter função sem scroll entre secções.
- A documentação do projecto e da publicação actualizada para reflectir a
  aplicação multi-página.

## Regras

### Migração de `src/test/content.test.tsx`

Esta task **remove `src/App.tsx`**, e `src/test/content.test.tsx` importa o
componente por `import('../App')` em **onze** pontos: linhas 55, 65, 78,
86, 105, 114, 140, 283, 294, 312 e 325. Sem migração, o ficheiro não
compila, o `pnpm typecheck` falha, e a aceitação "o `pnpm test` passa" é
inalcançável. Por isso o ficheiro está no âmbito desta task.

- **As importações dinâmicas de `'../App'` passam a montar o router.**
  Cada bloco que importa `'../App'` passa a montar o `RouterProvider` com
  um router de memória, criado com `createRouter` e
  `createMemoryHistory`, sobre a árvore de rotas de `src/router.tsx`. O
  router de memória permite fixar a rota inicial em cada teste, que é o
  que substitui o `App` directo.
- **A árvore de rotas é importada depois dos mocks.** O ficheiro usa
  `vi.resetModules()` em `beforeEach` (`src/test/content.test.tsx:37-39`) e
  `vi.doMock('../data/profile', ...)` para injectar um perfil sem nome. O
  mock do módulo de dados continua a funcionar, porque o router de memória
  importa os mesmos pontos de importação de `src/data/`. A ordem importa:
  o `vi.resetModules()` corre **antes** do `vi.doMock`, e a importação
  dinâmica do router e da árvore de rotas corre **depois** do mock, para
  que os módulos de dados sejam reavaliados com o mock aplicado. É esta
  ordem que torna o mock aplicável a **todos** os testes do ficheiro, e
  não só ao primeiro.
- **As asserções de âncora passam a verificar rotas.**
  `src/test/content.test.tsx:176-177` verifica que as chamadas para a acção
  de Início têm `href` igual a `#projetos` e `#contato`. Passam a
  verificar `/projetos` e `/contato`.
- **O resto das asserções do ficheiro não muda.** As verificações de
  marcadores de placeholder, de normalização, de campos obrigatórios e de
  canais de contacto são independentes do router e mantêm-se como estão.
- **A TASK-014 estende este ficheiro, não o migra.** A TASK-014 altera
  `src/test/content.test.tsx` para acrescentar a verificação das seis
  listas e as fixtures novas, sobre o ficheiro já migrado por esta task.

### Migração de `src/App.test.tsx` e `src/test/accessibility.test.tsx`

Estes dois ficheiros importam o componente removido `src/App.tsx` e
testam o mecanismo de destaque por scroll, que esta task elimina. O
âmbito de ficheiro de ambos já está declarado em `## Arquivos`; o que
segue explicita **o conteúdo** que muda, para que a implementação não
dependa de inferir o que remover.

`src/App.test.tsx`:

- **O `renderApp()` é migrado** (`src/App.test.tsx:191-194`), porque
  importa `'./App'` e monta o componente directamente. Passa a montar o
  `RouterProvider` sobre um router de memória, como em
  `src/test/content.test.tsx`.
- **Os helpers do stub de `IntersectionObserver` e da geometria são
  removidos** (`src/App.test.tsx:26-189`), juntamente com o `afterEach`
  que os repõe (`src/App.test.tsx:196-218`). Testam um mecanismo que
  deixa de existir, e a aceitação exige que nenhum ficheiro em `src/`
  referencie `IntersectionObserver`.
- **Os 8 testes do mecanismo de scroll são removidos**: os 6 de
  "faixa central de observação" (`src/App.test.tsx:463-553`) e os 2 de
  "degradação do hook" (`src/App.test.tsx:555-578`). São substituídos
  por asserções sobre a rota actual.
- **As asserções de navegação são reescritas para as rotas.**
  `src/App.test.tsx:295-298` passa a verificar os `href` das sete rotas,
  pela ordem das sete secções; `src/App.test.tsx:386-395` passa a
  verificar a mesma ordem com os sete valores; e
  `src/App.test.tsx:301-394` passa a verificar o `aria-current="page"`,
  com exactamente um link marcado e no link da rota visitada.

`src/test/accessibility.test.tsx`:

- **As 7 importações de `'../App'` são migradas** — a estática
  (`src/test/accessibility.test.tsx:4`) e as seis dinâmicas (linhas 95,
  104, 132, 141, 176 e 185) — para a montagem do router de memória.
- **A asserção do `aria-current` muda de valor.**
  `src/test/accessibility.test.tsx:64` procura `a[aria-current="true"]`
  e passa a procurar `a[aria-current="page"]`.
- **A verificação das sete páginas é acrescentada**, conforme a secção
  de Testes: cada uma das sete rotas é montada e verificada sem
  violações automáticas.

### Router

- **O router é o TanStack Router.** Uma dependência de runtime:
  `@tanstack/react-router` em `dependencies`, por ser importado pelo bundle
  de produção. A versão é a última estável publicada, registada no
  `package.json`.
- **O routing é por código, e não por ficheiro.** As rotas são definidas
  com `createRoute` e `createRootRoute` do `@tanstack/react-router`. Esta
  decisão foi tomada depois de verificado que o **routing por ficheiro é
  incompatível com os mocks por teste** que esta task exige: o ficheiro
  gerado `src/routeTree.gen.ts` importa estaticamente os módulos das
  rotas, e a cadeia de importações fica presa ao primeiro teste do
  ficheiro, pelo que `vi.resetModules()` e `vi.doMock` não re-aplicam o
  mock a um teste seguinte. Verificado em seis variantes de mocking
  (`doMock` com e sem `resetModules`, `doUnmock`, `vi.mock` hoisted com
  estado mutável, importação do módulo de rota em vez da árvore gerada):
  todas falham com a árvore gerada e todas passam com a árvore de
  código. A consequência é que **não existe `src/routeTree.gen.ts`** e
  **não há plugin de router** no `vite.config.ts`.
- **As rotas vivem em `src/routes/`**, com `__root.tsx` como layout raíz,
  `index.tsx` para `/` e um ficheiro por secção para as restantes. Cada
  ficheiro exporta a sua rota com `createRoute`, a partir do componente de
  secção que lhe corresponde.
- **`src/router.tsx` constrói a árvore de rotas e exporta o router**,
  criado com `createRouter`. A árvore é montada a partir das rotas
  exportadas pelos ficheiros de `src/routes/`. `src/main.tsx` monta o
  `RouterProvider`. O `RouterProvider` substitui o `App` directo:
  `src/App.tsx` é **removido**, e a composição passa a viver em
  `src/routes/__root.tsx`, que exporta o layout raíz com o `Sidebar`, o
  skip link e o `Outlet`. Esta via é a única admitida: `src/App.tsx` fica
  listado como `(remoção)` em `## Arquivos`.
- **Os estilos de `src/App.module.css` migram para o layout raíz.**
  `App.module.css` contém `.shell`, `.main` e `.skipLink`
  (`src/App.module.css:1-26`), que descrevem a estrutura que deixa de
  existir em `App.tsx`. As regras migram para um CSS Module do layout
  raíz, e `src/App.module.css` é **removido** com o componente. A
  `.shell` continua a ser `min-height: 100vh` no desktop
  (`App.module.css:1-3`), e a `.main` continua a ter
  `margin-left: 300px` a partir de 1024px (`App.module.css:28-38`), para
  que a barra lateral fixa não cubra o conteúdo.
- **O `padding-bottom` que reserva espaço para a barra inferior móvel
  acompanha a migração.** `App.module.css:40-49` aplica
  `padding-bottom: calc(var(--nav-height-mobile) + var(--space-8))` à
  `.main` abaixo de 1024px. A regra migra para o layout raíz, com o
  mesmo valor.
- **As sete rotas são exactas.** `/`, `/projetos`, `/habilidades`,
  `/contato`, `/jogos`, `/artigos` e `/experimentos`. Nenhum URL inclui `#`
  para distinguir a secção.
- **A navegação é client-side.** Clicar num item de menu não recarrega o
  documento. O `Link` do `@tanstack/react-router` é usado, com
  `activeProps` para o estado activo.
- **O `useActiveSection` é removido.** O mecanismo de
  `IntersectionObserver` e a faixa de 5 % da viewport perdem o sentido sem
  scroll entre secções. `src/hooks/useActiveSection.ts` é eliminado e
  `src/hooks/` fica sem outros ficheiros.
- **O `aria-current` passa a descrever a rota actual**, e não a secção
  visível. A asserção passa a verificar `aria-current="page"`, que é o
  valor correcto para um link de navegação entre páginas.
- **O `aria-current="page"` é aplicado pelo próprio `Link`.** O
  `@tanstack/react-router` define `aria-current="page"` automaticamente
  quando o link está activo, e só nesse caso. A implementação **não**
  escreve o atributo à mão. Esta é uma garantia da API do pacote
  instalado, e não depende de nenhum ficheiro do repositório.
- **O item de menu de Início usa `activeOptions: { exact: true }`.**
  Sem esta opção, a correspondência de estado activo do `Link` é feita
  por `startsWith`, e o link da raiz ficaria activo em **todas** as sete
  rotas. A opção aplica-se ao item de menu de Início, que é o único
  `Link` de `NAV_ITEMS` que aponta para `/`.
- **A marca não usa o `Link` do router.** A marca é um link para a raiz
  e **não** faz parte de `NAV_ITEMS`
  (`src/components/Sidebar.tsx:30`, hoje
  `<a href="#inicio" className={styles.brandLink}>`). Não é um item de
  navegação, e por isso não recebe `activeOptions` nem `activeProps`.
  O `Link` do router aplica `aria-current="page"` automaticamente quando
  está activo, e **não há forma de o desligar**, pelo que a marca seria
  marcada na rota `/` em conjunto com o item de menu, violando a
  aceitação de "exactamente um link marcado". Por isso a marca é uma
  **âncora simples** (`<a href="/">`) que navega pelo router com
  `useNavigate`, preservando a navegação client-side sem marcar o
  estado activo. Um clique com tecla modificadora (`Ctrl`, `⌘`, `Shift`,
  `Alt`) mantém o comportamento nativo do browser e abre num novo
  separador.
- **O `activeProps` e o `activeOptions` pertencem ao mesmo `Link`.** O
  `activeProps` define a classe e os atributos do estado activo; o
  `activeOptions` define **como** a activação é calculada. Um `Link`
  que use `activeProps` para o estilo activo usa também
  `activeOptions: { exact: true }` quando aponta para `/`.
- **O skip link continua a funcionar.** Aponta para `#conteudo`, e o
  elemento `main` mantém o `id="conteudo"`, para que o foco vá para o
  conteúdo da página actual.
- **As chamadas para a acção da secção Início passam a ser rotas.**
  `src/sections/Home/Home.tsx:32` e `:37` usam `href="#projetos"` e
  `href="#contato"`. Numa aplicação multi-página, `/` já não contém os
  elementos `#projetos` e `#contato`, pelo que estas âncoras ficam
  quebradas. Passam a usar o `Link` do router, com `href="/projetos"` e
  `href="/contato"`. O texto visível — "Ver projetos" e "Contato" — e as
  classes `styles.primary` e `styles.secondary` mantêm-se.
- **Os três ícones das secções novas são criados.** `src/components/icons.tsx`
  ganha `GamesIcon`, `ArticlesIcon` e `ExperimentsIcon`, seguindo o padrão
  dos ícones existentes: `svg` com `aria-hidden="true"` e
  `focusable="false"`, e a mesma classe `IconProps` com `className`
  opcional. Os traçados são geometria simples e coerente com os ícones
  existentes, e não replicam marcas de terceiros.
- **A asserção do número de ícones acompanha as sete secções.**
  `src/App.test.tsx:397-409` verifica que existem 4 ícones decorativos na
  navegação. Passa a verificar **7**, e a verificar que cada um dos sete
  links da navegação tem exactamente um ícone.
- **As três rotas novas usam um componente de secção mínimo.** As rotas
  `/jogos`, `/artigos` e `/experimentos` renderizam um `Section` com o
  título da secção e um parágrafo que identifica a secção, sem lista de
  itens. **Não são criados** `src/sections/Games/`,
  `src/sections/Articles/` nem `src/sections/Experiments/`, nem os
  ficheiros de `src/content/` e `src/data/` correspondentes: pertencem à
  TASK-014. O parágrafo é temporário e é substituído pelo componente real
  na TASK-014.

### Componente `Section`

- **`src/components/Section.tsx` e `src/components/Section.module.css` são
  revistos.** O componente é o invólucro de todas as sete secções.
- **O `scroll-margin-top` é removido.** `Section.module.css:3` declara
  `scroll-margin-top: var(--space-6)`, que existia para compensar a
  navegação por âncora. Sem scroll entre secções, a propriedade é inerte e
  é removida.
- **O `id` e o `aria-labelledby` mantêm-se.** `Section.tsx:12` constrói
  `aria-labelledby={`${id}-title`}` a partir do `id` da secção. A
  estrutura semântica mantém-se: cada página tem um `section` com
  `aria-labelledby` a apontar para o seu `h2`.
- **O `id` da secção deixa de ser uma âncora de navegação.** Continua a
  existir, porque dá a `aria-labelledby` o seu alvo, mas deixa de ser o
  destino de um link do menu. O menu passa a apontar para as rotas.
- **A estrutura de títulos não muda.** `Section.tsx:18` renderiza o `h2`
  da secção, e os componentes de secção renderizam os `h3` dos itens.

### Navegação em ecrãs pequenos

- **A barra inferior mostra apenas os ícones, abaixo de 1024px.** Com sete
  secções, os rótulos não cabem em 375 px: `Sidebar.module.css:119-135`
  define `.navList` em `flex-direction: row` com `justify-content:
  space-around` e `min-width: var(--touch-target-min)` em cada link, o que
  dá um piso de 7 × 44 px = 308 px, e o rótulo "Experimentos" a
  `--text-xs` não cabe nessa largura.
- **O texto visível do link é ocultado por CSS abaixo de 1024px**, e não
  removido do DOM. O `span` com o rótulo continua renderizado, para que o
  nome da secção esteja disponível no HTML.
- **Cada link mantém um nome acessível.** O `aria-label` do link é o
  rótulo da secção, para que o nome continue a ser anunciado pelos
  leitores de ecrã quando o texto visível está oculto. O alvo de toque
  continua a ter pelo menos 44 × 44 px, verificado por asserção sobre o
  tamanho renderizado.
- **O menu lateral do desktop mostra os sete rótulos**, com o ícone e o
  texto, como hoje. A barra lateral tem `overflow-y: auto`
  (`Sidebar.module.css:79`), pelo que os sete itens cabem sem originar
  scroll do documento.
- **A barra inferior não tem rolagem horizontal.** A lista de sete ícones
  distribui-se pela largura disponível, com `justify-content:
  space-around`, e nenhum item encolhe abaixo do alvo mínimo.

### TypeScript e build

- **`tsconfig.json` é alterado apenas no que o router exige.**
  `tsconfig.json:21` tem `include: ["src", "vite.config.ts"]`. As rotas
  novas vivem em `src/routes/`, que já está incluído, e o ficheiro
  `src/router.tsx` também.
- **O `include` não é alargado a `e2e/`.** O directório `e2e/` fica fora
  do `tsc --noEmit`, como está hoje. O Playwright compila os seus próprios
  ficheiros, e `e2e/responsive.spec.ts:3` importa `../src/types`, que é
  verificado pelo `include` de `src/`. A alteração do `tsconfig.json` limita-
  se ao que o `@tanstack/react-router` exigir, e **não** muda a cobertura
  de typecheck de `e2e/`.
- **`src/vite-env.d.ts` é uma alteração condicional.** O ficheiro fica no
  âmbito declarado, para que o gate de âmbito não rejeite o commit caso o
  router exija um tipo adicional que não esteja coberto pelas referências
  geradas. **Só é alterado se essa necessidade se confirmar**; caso
  contrário, fica intacto, e a evidência regista que não foi necessário
  alterá-lo.
- **Não há ficheiro gerado para versionar.** Com o routing por código não
  existe `src/routeTree.gen.ts`, e por isso não há risco de conflito de
  merge num ficheiro gerado. `.gitignore` **não** é alterado.

### Estrutura visual

- **Cada página tem a sua própria barra de rolagem vertical.** O content
  principal tem `overflow-y: auto` e altura limitada à viewport, de modo
  que a barra de rolagem pertence à área de conteúdo e não ao documento.
  O documento não faz scroll entre secções.
- **A altura da área de conteúdo usa `100dvh`, com fallback para `100vh`.**
  A unidade `dvh` mede a altura dinâmica da viewport, que muda quando as
  barras do navegador aparecem e desaparecem em dispositivos móveis. Sem
  ela, a área de conteúdo pode ficar mais alta do que a viewport visível
  em iOS, e o rodapé da última secção fica por baixo da barra do
  navegador. A declaração usa `height: 100vh` seguida de `height: 100dvh`,
  para que os navegadores sem suporte a `dvh` usem o valor fixo.
- **A barra de navegação lateral mantém a sua posição.** A navegação é fixa
  à esquerda no desktop (a partir de 1024px) e adapta-se à barra inferior
  abaixo de 1024px, como em `src/styles/globals.css:9-15`.
- **A barra inferior móvel continua a ter os mesmos alvos de toque**, de
  pelo menos 44 × 44 px, verificados por asserção sobre o tamanho
  renderizado. Abaixo de 1024px, os sete links mostram apenas o ícone, com
  o rótulo oculto por CSS e presente no `aria-label`.
- **As secções seguem os tokens de `src/styles/tokens.css`.** Nenhuma cor,
  tipografia ou espaçamento novo é introduzido fora dos tokens existentes.
- **O conteúdo não é cortado.** Nenhuma secção usa altura fixa em pixels
  que impeça a leitura do conteúdo.

### Acessibilidade

- **A navegação continua completa por teclado**, com foco visível.
- **O link da rota actual está marcado com `aria-current="page"`.**
- **O skip link aponta para `#conteudo`** e o `main` mantém o `id`.
- **A hierarquia de títulos mantém-se.** Cada página tem exactamente um
  `h2` — o título da secção — e os títulos dos itens são `h3`.
- **O `prefers-reduced-motion` é respeitado.**
- **O objectivo continua a ser WCAG 2.2 AA**, verificado pela suíte
  automática de `src/test/accessibility.test.tsx`.

### Documentação

- **`docs/projeto.md` é actualizado** para descrever a aplicação
  multi-página, as sete secções e a navegação por rotas. A tabela de
  secções da secção 2.1 passa a listar as sete, com o estado actualizado.
- **A tabela de tarefas da secção 9.1 de `docs/projeto.md` é corrigida.**
  As entradas `TASK-011 | Validação final` e `TASK-012 | Preparar
  publicação` estão desactualizadas face ao estado real do repositório, e
  a `TASK-009` está registada com o título "Preencher o conteúdo real do
  portfólio", que não corresponde ao título actual, "Preparar a
  canalização de conteúdo real do portfólio". A tabela passa a reflectir os
  títulos reais das catorze tasks da change 001 — TASK-001 a TASK-014, sem
  lacunas — e o estado real de cada uma. Todas as catorze constam da tabela,
  incluindo a `TASK-013`, que está `ARCHIVED` e é uma task real da change.
  A nota que segue a tabela, sobre o desvio entre o estado registado e o
  estado real, é reescrita para deixar de afirmar que as tasks 005 a 008
  estão `PENDING`, porque estão `ARCHIVED` em
  `specs/changes/001-portfolio-mvp/tasks/archive/`.
- **A lista de prioridades da secção 11 de `docs/projeto.md` é revista.**
  `docs/projeto.md:733` lista "Desenvolver a secção inicial, de projetos,
  jogos, artigos e experimentos" como item 6 das prioridades, e os itens
  seguintes pressupõem um portfólio de página única. A lista passa a
  reflectir o estado real: as secções existem, a navegação é por rotas, e
  a prioridade seguinte é o conteúdo real e a publicação.
- **`docs/deployment.md` é actualizado.** A rota única passa a ser as sete
  rotas. O **fallback SPA passa a ser necessário**, com a consequência
  explicada: sem ele, um carregamento directo de `/projetos` devolve 404.
  A tabela de candidatos é corrigida com a nota de que GitHub Pages exige
  configuração de rewrite, que os restantes candidatos suportam
  nativamente. **Esta task não escolhe o destino e não cria configuração de
  alojamento.**
- **`docs/history.md` não é reescrito.** É append-only, e o registo desta
  task é feito pelo `guardiao` no pipeline.

### Dependências

- **Nenhuma dependência de runtime é adicionada além do router.**
  `react` e `react-dom` mantêm-se em `dependencies`, e
  `@tanstack/react-router` é a única adição a esse grupo.
- **Não há dependência de desenvolvimento do router.** Com o routing por
  código, o `@tanstack/router-plugin` deixa de ser necessário: não há
  plugin registado no `vite.config.ts` nem ficheiro gerado. A dependência
  é removida do `package.json` e do `pnpm-lock.yaml`.
- **Nenhuma biblioteca de animação, de estado ou de formatação é
  adicionada.**

## Testes

- `pnpm lint`, `pnpm typecheck` e `pnpm test` passam.
- `pnpm build` gera o artefacto de produção.
- `pnpm test:e2e` passa nos três viewports.
- **A barra inferior não cobre o fim do conteúdo, e o conteúdo é
  alcançável por clique.** Abaixo de 1024px, um teste desloca a área de
  conteúdo — que tem a sua própria barra de rolagem — até ao fim, e
  compara a coordenada real do fundo do último elemento de conteúdo com
  o topo da barra inferior. O fundo do elemento tem de ficar acima da
  barra. A asserção é medida em runtime, e não assenta num ponto fixo.
  O scroll interno é verificado **condicionalmente**, quando o conteúdo
  excede a viewport; sem conteúdo real, a evidência declara a condição
  não observada, com a rota e a razão.
- **As sete rotas são verificadas em E2E.** Para cada uma das sete rotas, um
  teste navega até à URL directa, confirma que a página carrega e que o
  `h2` da secção correcta está presente, e confirma que o link activo da
  navegação tem `aria-current="page"` e o `href` correcto.
- **A navegação por clique não desloca a página por scroll.** Um teste
  E2E regista a posição de scroll do documento antes e depois de clicar num
  item de menu, e confirma que a posição é a mesma. A posição medida é
  `window.scrollY`, com uma tolerância de 1 px, porque a navegação
  client-side pode ajustar o scroll por frações de pixel. O teste percorre
  pelo menos duas transições de rota.
- **O carregamento directo de uma rota devolve a página correcta**, e não
  uma página de erro nem um ecrã em branco. Verificado em `e2e/`, com
  navegação por URL e não por clique: `page.goto('/projetos')` carrega a
  rota no servidor. O servidor de teste é o `pnpm preview`, que serve o
  `dist/` com fallback para `index.html` porque o `appType: 'spa'` está
  declarado em `vite.config.ts`. O teste não navega pelo cliente a partir
  de `/`, porque isso não provaria o fallback.
- **Cada página tem a sua própria barra de rolagem vertical, e o
  documento não faz scroll.** A verificação é **estrutural**, e não depende
  de injectar conteúdo fictício. O teste E2E percorre as sete rotas e, em
  cada uma, confirma três condições sobre a área de conteúdo:
  1. o `overflow-y` computado é `auto` ou `scroll`;
  2. a altura da área de conteúdo não excede a altura da viewport
     (`clientHeight` menor ou igual a `window.innerHeight`);
  3. o documento não faz scroll: `document.documentElement.scrollHeight`
     não excede a altura da viewport.

  Quando o conteúdo real de uma rota exceder a altura da viewport, o
  teste confirma **adicionalmente** que `scrollHeight` é maior que
  `clientHeight`, o que prova que a barra de rolagem aparece. Este
  segundo teste é **condicional**: se, no momento da execução, nenhuma das
  sete páginas tiver conteúdo real suficiente, o teste confirma apenas as
  três condições estruturais e a evidência declara que a condição de
  conteúdo não foi observada, com a rota e a razão.

  **Nenhum conteúdo fictício é injectado para este teste.** O mecanismo
  `window.__PORTFOLIO_PROFILE__` (`src/data/profile.ts:41-52`) substitui
  apenas o objecto `Profile` e não injecta o conteúdo das listas de
  projetos, habilidades, jogos, artigos ou experimentos, pelo que não
  serve para provocar overflow numa página de listas. Nenhum mecanismo de
  injecção novo é criado por esta task.
- **Não existe overflow horizontal** em nenhuma das sete rotas, nos três
  viewports, verificado pelo teste automatizado.
- **A secção activa é correcta em cada rota.** O `aria-current="page"`
  aponta para o link da rota visitada, e não para outro.
- **Os links da navegação deixam de ser âncoras.** As asserções de
  `src/App.test.tsx:290-299`, que verificam `a[href="#inicio"]`,
  `a[href="#projetos"]`, `a[href="#habilidades"]` e `a[href="#contato"]`,
  são reescritas para verificar os `href` das rotas, pela mesma ordem das
  sete secções. `src/App.test.tsx:386-395`, que verifica a ordem dos
  `href`, é reescrita para a mesma ordem, com os sete valores.
- **As chamadas para a acção da secção Início são verificadas.** Um teste
  de componente confirma que o link "Ver projetos" tem `href="/projetos"` e
  o link "Contato" tem `href="/contato"`, e que ambos navegam para a rota
  correcta.
- **O número de ícones da navegação é verificado.** A asserção de
  `src/App.test.tsx:397-409` passa de 4 para 7 ícones decorativos.
- **A asserção de acessibilidade acompanha a mudança de valor.**
  `src/test/accessibility.test.tsx:64` procura `a[aria-current="true"]`, e
  passa a procurar `a[aria-current="page"]`.
- **O skip link continua a ser funcional.** Um teste E2E faz focus no skip
  link, activa-o, e confirma que o foco chega a `main#conteudo`.
- **`src/test/accessibility.test.tsx` confirma ausência de violações
  automáticas** em cada uma das sete páginas.
- **A suíte do helper continua a passar.** `pnpm test` inclui
  `scripts/rawspec-v2.test.mjs` e `scripts/rawspec-v2-cli.test.mjs`.
- **O bundle não cresce além do limite já fixado.** O peso total de
  `dist/` medido pelo comando da TASK-010 mantém-se abaixo de 400 kB, e o
  ficheiro mais pesado abaixo de 250 kB:
  ```bash
  pnpm build && node -e "const fs=require('fs'),p=require('path');const w=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?w(p.join(d,e.name)):[p.join(d,e.name)]);const f=w('dist');const t=f.reduce((a,x)=>a+fs.statSync(x).size,0);const m=Math.max(...f.map(x=>fs.statSync(x).size));console.log('total_kb',(t/1024).toFixed(2),'max_kb',(m/1024).toFixed(2))"
  ```
- **Verificação visual no browser**, sobre o build de produção, nas sete
  rotas e nos três viewports. A evidência descreve, para cada rota, o
  destino verificado e o que foi observado: a barra lateral ou inferior
  presente, o item activo destacado, a barra de rolagem própria da página
  quando o conteúdo excede a viewport, e a ausência de scroll do documento
  entre secções. A evidência não é um código de resposta HTTP, porque a
  verificação é visual.

## Aceitação

- As sete rotas `/`, `/projetos`, `/habilidades`, `/contato`, `/jogos`,
  `/artigos` e `/experimentos` respondem com a página da secção
  correspondente, verificado por carregamento directo e por clique no menu.
- A navegação lateral lista as sete secções, com `aria-current="page"` no
  link da rota actual e sem qualquer outro link marcado. A **marca** da
  barra lateral — que é um link para a raiz mas não é um item de
  navegação — é uma âncora simples e não recebe o atributo, porque o
  `Link` do router o aplicaria automaticamente quando a rota actual é
  `/`, e não há forma de o desligar.
- Clicar num item de menu navega para a rota correspondente e não altera a
  posição de scroll do documento.
- Em cada uma das sete rotas, a área de conteúdo tem `overflow-y` computado
  de `auto` ou `scroll`, a sua altura não excede a altura da viewport, e o
  documento não faz scroll. Quando o conteúdo real de uma rota exceder a
  altura da viewport, a área de conteúdo tem `scrollHeight` maior que
  `clientHeight`.
- Não existe overflow horizontal em nenhuma das sete rotas, nos três
  viewports.
- As quatro secções existentes — Início, Projetos, Habilidades e Contato —
  renderizam uma página cada, com o conteúdo actual de `src/data/`.
- As rotas `/jogos`, `/artigos` e `/experimentos` são navegáveis e
  renderizam o `h2` da secção correcta, com um componente mínimo. Os
  componentes completos destas secções **não** existem: pertencem à
  TASK-014.
- `src/hooks/useActiveSection.ts` não existe, e nenhum ficheiro em `src/`
  referencia `IntersectionObserver` nem `useActiveSection`.
- `src/App.tsx` e `src/App.module.css` não existem, e a composição e os
  seus estilos vivem em `src/routes/__root.tsx` e
  `src/routes/__root.module.css`.
- `src/components/Section.module.css` não declara `scroll-margin-top`, e
  `src/components/Section.tsx` mantém o `id` e o `aria-labelledby` de cada
  secção.
- Abaixo de 1024px, cada link da barra inferior mostra apenas o ícone, o
  texto visível está oculto e o `aria-label` do link é o rótulo da secção.
  Cada link mantém pelo menos 44 × 44 px. Acima de 1024px, os sete
  rótulos são visíveis.
- As chamadas para a acção "Ver projetos" e "Contato" da secção Início têm
  `href` igual a `/projetos` e `/contato`, e navegam para a rota
  correspondente.
- A navegação tem sete ícones decorativos, um por link, e
  `src/App.test.tsx:397-409` verifica que são 7.
- `src/test/content.test.tsx` não importa `'../App'`: as onze importações
  dinâmicas foram substituídas por uma montagem do router com
  `createMemoryHistory`, e o ficheiro compila e passa.
- `@tanstack/react-router` está em `dependencies` no `package.json`, e
  `@tanstack/router-plugin` **não** está em `devDependencies`.
- Não existe `src/routeTree.gen.ts`, e `.gitignore` não foi alterado.
- `e2e/playwright.config.ts` mantém o `pnpm preview` como `webServer`, com
  o `timeout` de arranque aumentado, e o `appType: 'spa'` é declarado
  explicitamente em `vite.config.ts`. O teste de carregamento directo
  navega por URL — `page.goto('/projetos')` — provando o fallback em
  runtime.
- `docs/projeto.md` e `docs/deployment.md` reflectem a aplicação
  multi-página, e `docs/deployment.md` regista que o fallback SPA passa a
  ser necessário, sem escolher o destino de publicação.
- A tabela de tarefas da secção 9.1 de `docs/projeto.md` reflecte os títulos
  e os estados reais das catorze tasks da change 001, TASK-001 a TASK-014,
  incluindo a TASK-013 e a TASK-014, e a nota que a segue deixa de
  afirmar que as tasks 005 a 008 estão `PENDING`.
- `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` e `pnpm test:e2e`
  passam nos três viewports.

## Riscos

- **O fallback SPA passa a ser obrigatório no alojamento.** Com rotas no
  cliente, `/projetos` não corresponde a um ficheiro em `dist/`. Sem
  rewrite no servidor, um carregamento directo devolve 404, e o utilizador
  vê um erro em vez do portfólio. GitHub Pages não faz fallback por
  omissão; Vercel, Netlify e Cloudflare Pages suportam-no por
  configuração. Esta task **não** cria configuração de alojamento nem escolhe
  o destino: corrige a documentação e deixa a decisão para a TASK-012.
- `docs/deployment.md`, secção 1, linha da tabela "SPA fallback", e secção
  2, requisito 3, passam a explicar o requisito. A secção 2, requisito 3,
  é a que afirma hoje "**Sem SPA fallback.**", e passa a afirmar que o
  fallback é obrigatório.
- **O `pnpm preview` do Vite 8 faz fallback SPA por omissão.** Este risco
  foi verificado empiricamente contra o Vite 8.3.8 instalado no
  repositório, e a premissa anterior da task — que o `vite preview`
  servisse `dist/` como ficheiros estáticos e devolvesse 404 num
  carregamento directo — **está errada**. O `vite preview` aplica
  `htmlFallbackMiddleware(distDir, config.appType === "spa")`, e o
  `appType` tem por omissão `"spa"` na configuração do Vite
  (`node_modules/vite/dist/node/chunks/node.js`, em `appType: "spa"` e
  na linha do `app.use(htmlFallbackMiddleware(...))` do preview). O
  `vite.config.ts` deste projecto não altera o `appType`.
  Verificado na prática: com o `dist/` construído, o `pnpm preview` devolve
  **HTTP 200** com `text/html` e o `index.html` para `/`, `/projetos`,
  `/habilidades`, `/experimentos` e para uma rota inexistente.
  O `webServer` do Playwright pode, por isso, manter o `pnpm preview`.
- **`e2e/playwright.config.ts` é alterado.** O `webServer` actual corre
  `pnpm preview --host 127.0.0.1 --port 4173 --strictPort`
  (`e2e/playwright.config.ts:34-39`), e o comando **mantém-se**. A
  alteração é a introdução de um `timeout` superior, para que o
  primeiro arranque do servidor — que faz o build e arranca o `preview`
  — não seja interrompido por timeouts de arranque do Playwright. O
  `appType: 'spa'` é declarado explicitamente em `vite.config.ts`, para
  que o fallback dependa de uma decisão explícita do projecto e não de
  um valor por omissão do Vite. O `webServer` passa assim a servir o
  `dist/` com o fallback garantido por essa declaração.
- **A prova do fallback é feita em runtime, por carregamento directo.**
  O teste E2E navega por URL — `page.goto('/projetos')` — e confirma que
  a página da secção é renderizada. Não é uma navegação pelo cliente a
  partir de `/`, que não provaria o fallback.
- **O router adiciona peso ao bundle.** O limite de 400 kB foi medido em
  298,50 kB na TASK-010, com 224,86 kB no ficheiro mais pesado. O router
  pode aproximar o limite. Se o limite for excedido, a task tem de reduzir
  o peso por outra via — por exemplo, `autoCodeSplitting` — e registar a
  medição. O limite não é para ser excedido.
- **A remoção do `useActiveSection` elimina o destaque por scroll.** O
  `aria-current` passa a reflectir a rota actual. As asserções de
  `src/App.test.tsx:301-394` e a totalidade do conjunto de testes de
  `IntersectionObserver` em `e2e/responsive.spec.ts` (1199 linhas) têm de
  ser reescritos. A reescrita é substancial e tem de cobrir a navegação por
  rota, e não apenas ser adaptada mecanicamente.
- **As sete secções ampliam a superfície de conteúdo.** Um item de menu
  trocado por engano, ou uma secção nova ligada ao menu sem rota, produz um
  404 silencioso. O teste E2E que percorre as sete rotas e confere o
  `aria-current` é o que apanha este erro.
- **A barra de rolagem por página altera o layout em ecrãs pequenos.** A
  área de conteúdo passa a ter a sua própria barra, e a barra inferior
  móvel tem de continuar a não cobrir o conteúdo. O teste de alvos de toque
  e o teste de overflow horizontais têm de continuar a passar.
- **O `scroll-behavior: smooth` de `src/styles/globals.css:17-21` passa a
  ser irrelevante** para a navegação entre secções, porque não há scroll
  entre secções. **O bloco é removido**, e
  `src/styles/globals.css` passa a constar do âmbito declarado. A remoção
  é segura porque o scroll interno da área de conteúdo é devolvido ao
  utilizador, e um scroll suave em área de conteúdo rolável rouba o
  controlo da roda do rato.
- **A linha `scroll-behavior: auto !important` de
  `src/styles/globals.css:69` é removida com o bloco.** Ela existe
  exactamente para anular o `scroll-behavior: smooth` quando o utilizador
  pede movimento reduzido. Sem a declaração que anula, a linha é
  inofensiva, mas fica órfã. O bloco `@media (prefers-reduced-motion:
  reduce)` de `src/styles/globals.css:62-70` **mantém-se**, com as três
  regras das animações e das transições intactas.
- **A limpeza de `src/hooks/` pode afectar outros ficheiros.** O
  `useActiveSection` é importado apenas por `src/components/Sidebar.tsx:3`.
  A remoção só é segura depois de verificado, por pesquisa, que nenhum
  outro ficheiro em `src/` o referencia.
- **O routing por ficheiro foi substituído pelo routing por código.** O
  ficheiro gerado `src/routeTree.gen.ts` importava estaticamente os
  módulos das rotas, e essa cadeia de importações ficava presa ao
  primeiro teste do ficheiro: `vi.resetModules()` e `vi.doMock` não
  voltavam a aplicar o mock aos testes seguintes, e a task ficava
  impossível de cumprir. O routing por código, com `createRoute` e
  `createRootRoute`, elimina o problema e dispensa o plugin de router.
  O custo é perder a convenção de routing por ficheiro, que o TanStack
  Router trata como idiomática; a mitigação é a lista explícita das
  rotas em `src/router.tsx`.
- **As três rotas novas ficam provisoriamente sem conteúdo.** Até à
  TASK-014, `/jogos`, `/artigos` e `/experimentos` renderizam um
  componente mínimo. O menu apresenta as sete secções desde a primeira
  task, e as três últimas recebem a mensagem temporária. A TASK-014 substitui
  o componente provisório pelo definitivo.
- **O `pnpm format:check` falha em `bakeoff/check-permissions.mjs` e
  `scripts/rawspec-v2-cli.test.mjs`.** A dívida é pré-existente em `main` e
  não é objectivo desta task. O comando não faz parte do gate do
  `commit-task`.
- **A TASK-009 adiou explicitamente o override `window.__PORTFOLIO_PROFILE__`
  para a TASK-011** (`TASK-009.md:201-205`). A TASK-009 foi reescrita para
  descrever a preparação da canalização de conteúdo, e o override deixou de
  estar no seu âmbito. Por decisão do utilizador, esta task **não** o
  trata. A dívida fica registada em `docs/history.md:583-584` e sem task
  destino, e o utilizador é responsável de criar essa task.

## Exclusões

- **Não se escolhe o destino de publicação.** Nenhum ficheiro de
  configuração de alojamento — `vercel.json`, `netlify.toml`, `.nojekyll` ou
  equivalente — é criado. A decisão e a configuração pertencem à
  TASK-012.
- **Não se publica nada.** Nenhum push para o destino, nenhuma acção de
  deploy.
- **Não se trata nenhuma das dívidas técnicas** listadas nos Riscos.
- **Não se escreve conteúdo real em `src/content/`.** O perfil, os projetos,
  as habilidades e as três listas novas pertencem à TASK-014. Esta task não
  altera `src/content/`, `src/data/` nem `src/types/index.ts`.
- **Não se criam os componentes das três secções novas.**
  `src/sections/Games/`, `src/sections/Articles/` e
  `src/sections/Experiments/` não existem até à TASK-014.
- **Não se cria o componente `src/components/EmptyState.tsx`.** A mensagem
  unificada "Em construção" é implementada na TASK-014. Até lá, as secções
  sem conteúdo mantêm as mensagens existentes.
- **Não se alteram os componentes de `Projects`, `Skills` e `Contact`.**
  A substituição das mensagens de estado vazio pela mensagem partilhada
  pertence à TASK-014. Estas secções continuam a renderizar-se sem
  alteração de código nesta task.
- **Não se ampliam os campos do tipo `Project`** para `objetivo`,
  `principais funcionalidades` e imagens.
- **Não se adiciona uma secção de certificações, testified ou estudos.**
- **Não se implementa tema claro/escuro**, previsto na proposta da change
  001, secção 3, mas fora do âmbito desta task.
- **Não se toca em `docs/history.md`** a não ser pelo `guardiao`, no
  registo da task.
- **Não se altera `.gitignore`.** Não há ficheiro gerado a versionar, e
  o `.gitignore` actual não precisa de qualquer entrada nova.
- **Não se alteram `scripts/rawspec-v2.mjs`,
  `scripts/rawspec-v2.test.mjs` nem `scripts/rawspec-v2-cli.test.mjs`.**
  O helper RawSpec não é afectado pela mudança, e a dívida de
  `pnpm format:check` nesses ficheiros é pré-existente em `main`.
- **Não se altera a identidade visual**: cores, tipografias e espaçamentos
  mantêm-se nos tokens existentes de `src/styles/tokens.css`.

## Checklist de clareza

- Objetivo único e verificável — ATENDE
- Arquivos afetados — ATENDE
- Entregáveis concretos — ATENDE
- Contrato de entrada, saída e erros — ATENDE (entrada: os tokens de
  `src/styles/tokens.css`, o inventário de `docs/conteudo-real.md` e o
  estado actual da aplicação de página única; saída: sete rotas
  funcionais, uma por secção, com o mecanismo de navegação e a navegação
  lateral de sete itens; erros: uma rota inexistente não faz parte das
  sete declaradas e falha o teste E2E de navegação; um item de menu sem
  rota correspondente falha a asserção do `aria-current`; uma secção sem
  rota falha o carregamento directo)
- Testes obrigatórios — ATENDE
- Critério de aceitação objetivo — ATENDE
- Dependências declaradas explicitamente — ATENDE
- Ausência de decisões pendentes para o implementador — ATENDE (a via de
  router, o router escolhido, o texto de estado vazio, o conteúdo real, o
  tratamento do fallback SPA no E2E e a decisão de não tratar as dívidas
  técnicas estão decididos; restam apenas decisões técnicas de
  implementação, com critério verificável, como a geometria dos três
  ícones novos e o texto do parágrafo provisório das três rotas)
