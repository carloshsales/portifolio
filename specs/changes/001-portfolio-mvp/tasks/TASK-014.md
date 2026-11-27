# TASK-014 — Alargar o conteúdo e construir as secções de Jogos, Artigos e Experimentos

- Change: 001-portfolio-mvp
- Status: PENDING
- Depende de: TASK-011
- Início: —
- Verificação: PENDING
- Evidência: —
- Plano de ação: none

## Objetivo

Alargar o portfólio com o conteúdo real do perfil, dos projetos e das
habilidades, e implementar as três secções que faltavam — Jogos, Artigos e
Experimentos — sobre a estrutura multi-página criada pela TASK-011.

Ao final desta task:

- `src/content/` contém o conteúdo real fornecido pelo utilizador, nas seis
  listas: perfil, projetos, habilidades, jogos, artigos e experimentos;
- as três secções novas existem, com componente, estilos, rota e conteúdo;
- a mensagem de estado vazio é "Em construção", uniforme nas sete secções;
- cada secção apresenta a sua lista de itens, com os campos completos do
  seu tipo.

## Contexto

A TASK-011 transformou o portfólio numa aplicação multi-página com sete
rotas, e criou as rotas `/jogos`, `/artigos` e `/experimentos` com um
componente de secção mínimo, à espera desta task.

O conteúdo de produção continua vazio, com uma excepção. `src/content/profile.ts:5-12` tem
`name`, `role`, `summary` e `location` vazios e `social: []`;
`src/content/projects.ts:5` é uma lista vazia.
`src/data/profile.ts:41-52` remove todos os canais de contacto, e
`src/sections/Home/Home.tsx:7-11` omite a fotografia, o resumo e as chamadas
para a acção.

**Excepção: as habilidades já têm conteúdo.** A reformulação do menu, feita
na TASK-011 depois de esta task ser escrita, fixou o conteúdo real das
habilidades: `src/content/skills.ts` tem 32 habilidades em cinco categorias,
com o tipo `Skill` alargado a `name`, `description`, `usage` e
`application`. Esta task **estende** o ficheiro, se o utilizador fornecer
conteúdo adicional, e **não** o reescreve.

`src/content/profile.ts:9` e a fixture `src/test/fixtures/profile.ts` apontam
ambos para `public/images/foto-perfil.jpg`, que existe e cumpre os requisitos
de `docs/conteudo-real.md`, secção 6.

As mensagens de estado vazio são hoje diferentes em cada secção: "Ainda não
há projetos para apresentar." (`src/sections/Projects/Projects.tsx:10`),
"Ainda não há habilidades para apresentar."
(`src/sections/Skills/Skills.tsx:9`) e "Ainda não há canais de contato para
apresentar." (`src/sections/Contact/Contact.tsx:20`).

`docs/projeto.md`, secção 2.1, declara as três secções por construir, e a
secção 2.2 prevê campos adicionais nos projetos (objetivo, principais
funcionalidades, imagens ou capturas de ecrã) que o tipo `Project`
(`src/types/index.ts:18-24`) não expõe.

`docs/conteudo-real.md` é o inventário do que o utilizador tem de fornecer.
**Não contém dados reais.**

### Pré-condição: `src/test/content.test.tsx` já vem migrado

A TASK-011 remove `src/App.tsx` e migra `src/test/content.test.tsx`: as
onze importações dinâmicas de `'../App'` (linhas 55, 65, 78, 86, 105, 114,
140, 283, 294, 312 e 325) passam a montar o router com
`createMemoryHistory`, e as asserções de `href="#projetos"` e
`href="#contato"` (linhas 176-177) passam a verificar `/projetos` e
`/contato`.

**Esta task encontra `src/test/content.test.tsx` já migrado.** A alteração
que esta task faz no ficheiro é apenas a **extensão** da verificação de
marcadores de placeholder às seis listas e às fixtures novas. A migração
para o router não é responsabilidade desta task, e não volta a ser feita.

### Pré-condição: as três rotas já existem

A TASK-011 cria `src/routes/jogos.tsx`, `src/routes/artigos.tsx` e
`src/routes/experimentos.tsx` com um componente de secção mínimo. Esta task
substitui esse componente pelo definitivo, e é a **única** alteração que
faz nas rotas.

### Decisões tomadas pelo utilizador

1. **Conteúdo real.** O conteúdo é fornecido pelo utilizador. O que não
   existir é apresentado como "Em construção".
2. **Estado vazio uniforme.** A mensagem "Em construção" é igual em **todas**
   as secções, incluindo as que já existem.
3. **Sem novos campos no tipo `Project`.** A ampliação do tipo fica para
   uma task própria.
4. **Dívidas técnicas.** As dívidas registadas em `docs/history.md:583-584` —
   o override `window.__PORTFOLIO_PROFILE__` activo em produção, a regex
   permissiva de `src/data/profile.ts:4`, o teste E2E da barra lateral, o
   foco do CTA primário e os casts frágeis — **não são objectivo desta
   task**.

### Condição de conclusão

**Esta task não fica bloqueada à espera de conteúdo externo.** Se o
utilizador não fornecer conteúdo, as listas ficam vazias, as secções
apresentam "Em construção", e **a task é concluída na mesma**. A introdução
do conteúdo real depois é trabalho de dados, e não de código.

## Arquivos

- `src/components/EmptyState.tsx` (criação)
- `src/components/EmptyState.module.css` (criação)
- `src/sections/Games/Games.tsx` (criação)
- `src/sections/Games/Games.module.css` (criação)
- `src/sections/Articles/Articles.tsx` (criação)
- `src/sections/Articles/Articles.module.css` (criação)
- `src/sections/Experiments/Experiments.tsx` (criação)
- `src/sections/Experiments/Experiments.module.css` (criação)
- `src/sections/Projects/Projects.tsx` (alteração)
- `src/sections/Projects/Projects.module.css` (alteração)
- `src/sections/Skills/Skills.tsx` (alteração)
- `src/sections/Skills/Skills.module.css` (alteração)
- `src/sections/Contact/Contact.tsx` (alteração)
- `src/sections/Contact/Contact.module.css` (alteração)
- `src/routes/jogos.tsx` (alteração)
- `src/routes/artigos.tsx` (alteração)
- `src/routes/experimentos.tsx` (alteração)
- `src/content/profile.ts` (alteração)
- `src/content/projects.ts` (alteração)
- `src/content/skills.ts` (alteração)
- `src/content/games.ts` (criação)
- `src/content/articles.ts` (criação)
- `src/content/experiments.ts` (criação)
- `src/data/profile.ts` (alteração)
- `src/data/projects.ts` (alteração)
- `src/data/skills.ts` (alteração)
- `src/data/games.ts` (criação)
- `src/data/articles.ts` (criação)
- `src/data/experiments.ts` (criação)
- `src/types/index.ts` (alteração)
- `src/test/fixtures/profile.ts` (alteração)
- `src/test/fixtures/projects.ts` (alteração)
- `src/test/fixtures/skills.ts` (alteração)
- `src/test/fixtures/games.ts` (criação)
- `src/test/fixtures/articles.ts` (criação)
- `src/test/fixtures/experiments.ts` (criação)
- `src/test/content.test.tsx` (alteração)
- `docs/conteudo-real.md` (alteração)

Cada bullet da secção `## Arquivos` declara exactamente um caminho entre
crases. O parser de âmbito de `scripts/rawspec-v2.mjs` extrai apenas o
primeiro caminho de cada bullet, pelo que dois caminhos no mesmo bullet
produziriam um âmbito menor do que o declarado.

Sete ficheiros são **sobreposição sequencial intencional** com a
TASK-011: `src/routes/jogos.tsx`, `src/routes/artigos.tsx`,
`src/routes/experimentos.tsx`, `src/test/content.test.tsx`,
`src/content/skills.ts`, `src/data/skills.ts` e
`src/test/fixtures/skills.ts`. A TASK-011 cria-os, migra-os ou escreve o
conteúdo real das habilidades; esta task estende-os. A ordem do grafo
garante a sequência. Todos os outros ficheiros são exclusivos desta task.

**Os três ficheiros das habilidades já têm conteúdo.** A TASK-011 escreveu as
32 habilidades reais em `src/content/skills.ts` e adaptou o tipo `Skill`, a
normalização e a fixture. Esta task estende-os apenas se o utilizador
fornecer conteúdo adicional, e não os reescreve.

## Entregáveis

- O conteúdo real do perfil, dos projetos e das habilidades escrito em
  `src/content/`.
- Três listas novas em `src/content/` — `games.ts`, `articles.ts` e
  `experiments.ts` — com o conteúdo real fornecido para as três secções.
- Três pontos de importação novos em `src/data/`, com a mesma normalização
  dos existentes.
- Os tipos novos em `src/types/index.ts`, com os campos obrigatórios de
  cada lista.
- Três componentes de secção novos — `Games`, `Articles` e `Experiments` —
  com os respectivos estilos.
- As três rotas novas passam a renderizar o componente definitivo, em vez do
  componente mínimo provisório da TASK-011.
- Um componente partilhado `src/components/EmptyState.tsx` que apresenta a
  mensagem "Em construção", usado pelas sete secções.
- As mensagens de estado vazio das secções existentes são substituídas pela
  mensagem partilhada.
- `docs/conteudo-real.md` actualizado com os campos dos tipos novos, as
  três secções novas e a regra de estado vazio.

## Conteúdo real a introduzir

O conteúdo é escrito pelo implementador a partir da informação fornecida pelo
utilizador. **Nenhum item é inventado.** Onde a informação não existir, o
item não é criado e a secção apresenta "Em construção".

### `src/content/profile.ts`

| Campo | Regras |
|---|---|
| `name` | Nome que aparece no portfólio e na barra lateral. |
| `role` | Função ou área profissional. Curto, sem adjectivos. |
| `summary` | Apresentação breve: o que faz e o que valoriza. 2 a 4 frases. |
| `photoUrl` | `/images/foto-perfil.jpg`. |
| `location` | Localidade, se for fornecida. |
| `social` | Canais que existem e que o utilizador quer publicar. Cada entrada tem `label`, `url` e `icon`. `icon` é obrigatoriamente `github`, `linkedin` ou `email` (`src/types/index.ts:1`). O canal de email usa `mailto:`. |

Regras de validação, herdadas de `docs/conteudo-real.md`, secções 2 e 3:

- não inventar experiência, anos de trabalho, certificações, clientes ou
  empresas anteriores;
- `location` vazia não é apresentada;
- entradas com `url` vazia ou inválida são removidas automaticamente pela
  normalização em `src/data/profile.ts:21-30`.

### `src/content/projects.ts`

Cada entrada tem `title`, `description` e `technologies`, com
`repositoryUrl` e `liveUrl` opcionais. `technologies` reflecte o que foi
usado, não o que seria desejável. Sem `repositoryUrl` quando o repositório
é privado.

### `src/content/skills.ts`

Grupos com `title` e `skills`. Cada habilidade tem `name`, `description`,
`usage` e `application` (`'applied'` ou `'experienced'`). Sem níveis de
proficiência, sem percentagens e sem categorias vagas ("Diversos", "Vários",
"Outras"). 3 a 5 categorias é o padrão razoável.

**O conteúdo real já está escrito pela TASK-011.** Esta secção descreve o
formato, para o caso de o utilizador fornecer habilidades adicionais.

### `src/content/games.ts`, `src/content/articles.ts` e `src/content/experiments.ts`

Três listas novas, com os tipos definidos em `src/types/index.ts`. O
conteúdo de cada uma segue a intenção declarada em `docs/projeto.md`,
secção 2.1:

| Secção | Conteúdo |
|---|---|
| Jogos | Projetos de desenvolvimento de jogos, protótipos e jogos durante o aprendizado. |
| Artigos | Conhecimentos, experiências técnicas e conteúdos sobre desenvolvimento de software. |
| Experimentos | Protótipos, testes de tecnologias, provas de conceito, pequenas aplicações, estudos técnicos e experimentos com IA. |

Cada tipo novo define os seus campos obrigatórios. Regras comuns a todas:

- **não inventar**: cada entrada tem de corresponder a trabalho real;
- `title` e `description` são obrigatórios em todas as entradas;
- `technologies` é obrigatório e não vazio, em todas as entradas;
- `repositoryUrl` e `liveUrl` são opcionais e, quando presentes, têm de
  respeitar o protocolo `https://` ou `http://`;
- a lista pode ficar vazia, e nesse caso a secção apresenta "Em construção".

### Os três tipos novos, campo a campo

Os tipos são declarados em `src/types/index.ts`, com o mesmo estilo dos
existentes (`src/types/index.ts:18-24`): `interface` exportada, campos
obrigatórios sem `?` e opcionais com `?`.

**`Game` — `src/content/games.ts`**

| Campo | Obrigatório | Tipo |
|---|---|---|
| `title` | Sim | `string` |
| `description` | Sim | `string` |
| `technologies` | Sim | `string[]` |
| `status` | Sim | `string` — o estado real do jogo ou protótipo, como "em desenvolvimento" ou "concluído" |
| `repositoryUrl` | Não | `string` |
| `liveUrl` | Não | `string` |

**`Article` — `src/content/articles.ts`**

| Campo | Obrigatório | Tipo |
|---|---|---|
| `title` | Sim | `string` |
| `description` | Sim | `string` |
| `technologies` | Sim | `string[]` |
| `publishedAt` | Sim | `string` — a data de publicação, em formato `AAAA-MM` |
| `url` | Sim | `string` — a ligação ao artigo, com `https://` ou `http://` |

**`Experiment` — `src/content/experiments.ts`**

| Campo | Obrigatório | Tipo |
|---|---|---|
| `title` | Sim | `string` |
| `description` | Sim | `string` |
| `technologies` | Sim | `string[]` |
| `repositoryUrl` | Não | `string` |
| `liveUrl` | Não | `string` |

O `Experiment` tem os mesmos campos do `Project` (`src/types/index.ts:18-24`),
porque um experimento é uma prova de conceito com as mesmas
características de apresentação. O `Game` acrescenta `status`, e o `Article`
substitui os links opcionais por `publishedAt` e `url`, porque um artigo
tem uma data e um destino.

**A regra `status` do `Game` não é um nível de proficiência.** Descreve o
estado do trabalho, não a qualidade de quem o fez, e não pode ser
"avançado", "expert" nem uma percentagem.

**A regra `publishedAt` do `Article` é uma data, não um momento.** A
formatação `AAAA-MM` é suficiente, e o componente não a converte nem a
apresenta como data relativa.

**O `url` do `Article` segue `URL_PROTOCOLS`.** Um `url` sem `https://` ou
`http://` é removido pela normalização, e um `Article` sem `url` válido é
removido da lista, como acontece com os projetos.

**Campos adicionais dos projetos.** `docs/projeto.md`, secção 2.2, prevê
`objetivo`, `principais funcionalidades` e `imagens ou capturas de ecrã`
para cada projeto. O tipo `Project` não os expõe. Esta task **não** os
adiciona ao tipo `Project`: as imagens exigiriam ficheiros em
`public/images/` que o utilizador não forneceu, e a ampliação do tipo
`Project` fica para uma task própria. O âmbito desta task é
`title`, `description`, `technologies`, `repositoryUrl` e `liveUrl`, tal
como estão em `src/types/index.ts:18-24`.

## Regras

### Conteúdo e estado vazio

- **O conteúdo real é escrito em `src/content/`.** `src/data/` não é
  editado para introduzir dados: a normalização existente aplica-se e é
  estendida apenas com os pontos de importação novos.
- **A mensagem de estado vazio é "Em construção", em todas as secções.**
  As secções existentes usam hoje "Ainda não há projetos para apresentar."
  (`src/sections/Projects/Projects.tsx:10`), "Ainda não há habilidades para
  apresentar." (`src/sections/Skills/Skills.tsx:9`) e "Ainda não há canais
  de contato para apresentar." (`src/sections/Contact/Contact.tsx:20`).
  Passam a usar o mesmo texto, vindo de um componente partilhado
  (`src/components/EmptyState.tsx`), para que a mensagem seja uniforme.
- **A mensagem é o único conteúdo visível de uma secção vazia.** Não são
  inventados itens para preencher a secção.
- **Nenhum texto fictício entra em produção.** As fixtures de
  `src/test/fixtures/` continuam a usar o TLD reservado `.test` e não
  contêm nenhum valor do conteúdo real.
- **O conteúdo real não usa os valores de texto das fixtures.** A excepção
  é o `photoUrl`: tanto a fixture como o conteúdo real apontam para
  `public/images/foto-perfil.jpg`, e a igualdade é esperada.

### Normalização

- **Cada lista nova tem um ponto de importação estável em `src/data/`**,
  com o mesmo padrão dos existentes: `normalizeText`, remoção de entradas
  incompletas e exportação de um array já normalizado.
- **A normalização remove entradas incompletas**, como a existente: uma
  entrada sem `title`, sem `description` ou sem `technologies` não chega à
  interface.
- **As URLs dos canais de contacto seguem as regras vigentes.**
  `src/data/profile.ts:4-19` aceita `https://` ou `http://` seguidos de
  host, e para o canal de email aceita `mailto:` seguido de endereço,
  conforme `EMAIL_URL_PATTERN` (`src/data/profile.ts:5`). O canal de email
  usa `mailto:` e não está sujeito à regra `URL_PROTOCOLS`
  (`src/data/projects.ts:4`), que se aplica a `repositoryUrl` e `liveUrl`.
- **A normalização não deduplica.** A unicidade dos títulos dentro de cada
  lista é garantida na origem, como em `docs/history.md:694`.
- **As URLs de conteúdo são subjectas ao mesmo protocolo.** As
  `repositoryUrl` e `liveUrl` dos tipos novos seguem `URL_PROTOCOLS`.

### Componentes de secção

- **Os três componentes novos seguem o padrão das secções existentes.**
  Cada um renderiza um `Section` com o `id` e o `title` da secção, e uma
  lista de cartões com o `h3` do título de cada item, a descrição, as
  tecnologias e os links.
- **A lista usa `role="list"`, como as existentes.** `src/sections/Projects/Projects.tsx:12`
  e `src/sections/Skills/Skills.tsx:11` usam `role="list"` nas listas, para
  neutralizar a remoção de marcadores de lista do `reset.css`.
- **A ordem dos campos de um item segue a das secções existentes.** Título,
  descrição, tecnologias, e depois os links de código e de demonstração.
- **Os estilos seguem os tokens de `src/styles/tokens.css`.** Nenhuma cor,
  tipografia ou espaçamento novo é introduzido fora dos tokens existentes.
- **As três rotas novas deixam de usar o componente mínimo.** O
  componente provisório criado na TASK-011 é substituído pelo definitivo,
  e as rotas passam a renderizar o componente de secção correspondente.
- **Nenhum componente novo é criado para além dos três.** O
  `src/components/EmptyState.tsx` é o único componente partilhado
  acrescentado, e existe porque as sete secções precisam da mesma
  mensagem.

### Acessibilidade

- **Cada item de uma lista tem um `h3`** com o seu título, dentro do `h2`
  da secção, para que a hierarquia de títulos se mantenha.
- **A lista de tecnologias tem `aria-label`**, como em
  `src/sections/Projects/Projects.tsx:18`, para que o leitor de ecrã
  identifique o conteúdo da lista.
- **Os links mantêm `target="_blank"` e `rel="noreferrer noopener"`**, como
  em `src/sections/Projects/Projects.tsx:30-31` e `:41-42`.
- **A mensagem de estado vazio é um parágrafo**, não um cabeçalho, e não
  introduz um nível na hierarquia de títulos.
- **O objectivo continua a ser WCAG 2.2 AA.**

### Documentação

- **`docs/conteudo-real.md` é actualizado** com os campos dos tipos novos,
  as três secções novas e a regra de estado vazio "Em construção". O
  inventário passa a descrever o que pedir em cada uma das seis listas.
- **`docs/history.md` não é reescrito.** É append-only, e o registo desta
  task é feito pelo `guardiao` no pipeline.

## Testes

- `pnpm lint`, `pnpm typecheck` e `pnpm test` passam.
- `pnpm build` gera o artefacto de produção.
- `pnpm test:e2e` passa nos três viewports.
- **`src/test/content.test.tsx` verifica a ausência de marcadores de
  placeholder** (`teu-utilizador`, `exemplo.com`, `teu@email.com`) sobre o
  conteúdo real completo: `profile.name`, `profile.role`, `profile.summary`,
  cada `project.title`, `project.description`, cada `technology`, cada
  `skillGroup.title` e cada `skill`, e os campos equivalentes das três
  listas novas.
- **A fixture não fica no conteúdo real.** A verificação usa a constante
  `FIXTURE_FORBIDDEN_MARKERS` (`src/test/content.test.tsx:15`), que mantém
  o parêntese recto proibido nas fixtures, ao contrário de
  `PLACEHOLDER_MARKERS`, que deixou de o incluir para o conteúdo real.
- **A mensagem de estado vazio é uniforme.** Um teste de componente
  confirma que, com o conteúdo vazio, cada uma das sete secções apresenta a
  mensagem de estado vazio, e que ela é idêntica nas sete.
- **As três secções novas renderizam os seus itens.** Um teste de
  componente, com as fixtures injectadas, confirma que cada item aparece
  com o seu título, a sua descrição e as suas tecnologias.
- **A ordem dos campos de um item é verificada**, como já é feito em
  `src/App.test.tsx:241-267` para os projetos.
- **Acessibilidade.** A suíte automática de `src/test/accessibility.test.tsx`
  confirma ausência de violações nas três páginas novas, com o conteúdo
  real injectado.
- **O bundle não cresce além do limite já fixado.** O peso total de
  `dist/` medido pelo comando da TASK-010 mantém-se abaixo de 400 kB, e o
  ficheiro mais pesado abaixo de 250 kB:
  ```bash
  pnpm build && node -e "const fs=require('fs'),p=require('path');const w=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?w(p.join(d,e.name)):[p.join(d,e.name)]);const f=w('dist');const t=f.reduce((a,x)=>a+fs.statSync(x).size,0);const m=Math.max(...f.map(x=>fs.statSync(x).size));console.log('total_kb',(t/1024).toFixed(2),'max_kb',(m/1024).toFixed(2))"
  ```
- **O bundle não contém texto fictício.** A varredura dos ficheiros
  JavaScript de `dist/assets/` não encontra nenhum dos valores de
  `profile.name`, `profile.role`, `profile.summary` ou das URL de contacto
  da fixture. A verificação corre o comando abaixo para cada um dos
  valores, e cada comando não devolve qualquer linha. Os ficheiros
  copiados de `public/` (`dist/images/`) não são varridos, por conterem
  recursos de produção:
  ```bash
  grep -rF "<valor>" dist/assets
  ```
- **Verificação visual no browser**, sobre o build de produção, nas três
  rotas novas e nos três viewports: os itens aparecem com o título, a
  descrição e as tecnologias, a navegação continua a funcionar, e a
  mensagem "Em construção" aparece nas secções sem conteúdo. A evidência
  descreve o que foi observado em cada rota.

## Aceitação

- `src/content/profile.ts` e `src/content/projects.ts` contêm o conteúdo real
  fornecido pelo utilizador, e `src/content/games.ts`,
  `src/content/articles.ts` e `src/content/experiments.ts` contêm o conteúdo
  real fornecido para as três secções novas. **Nenhum item foi inventado**
  para preencher uma secção.
- `src/content/skills.ts` contém as habilidades reais. **Este requisito já
  está satisfeito pela TASK-011**, que escreveu as 32 habilidades durante a
  reformulação do menu. Esta task apenas o estende, se o utilizador
  fornecer conteúdo adicional.
- As três secções novas — Jogos, Artigos e Experimentos — estão
  implementadas, com componente, estilos, conteúdo e rota, e as rotas
  `/jogos`, `/artigos` e `/experimentos` deixam de usar o componente
  mínimo provisório.
- `src/components/EmptyState.tsx` existe, e as sete secções o usam. Uma
  secção sem conteúdo real apresenta "Em construção", e a mensagem é
  idêntica nas sete.
- `src/data/` exporta os pontos de importação das seis listas, com a mesma
  normalização das existentes: entradas incompletas são removidas e URLs
  sem `https://` ou `http://` são descartadas.
- `src/types/index.ts` declara os tipos das três listas novas, com os
  campos obrigatórios de cada uma, e o tipo `Project` mantém os seus cinco
  campos.
- O bundle de produção não contém texto fictício: a varredura dos
  ficheiros JavaScript de `dist/assets/` não encontra nenhum dos valores de
  `profile.name`, `profile.role`, `profile.summary` ou das URL de contacto
  da fixture. Os ficheiros copiados de `public/` (`dist/images/`) não são
  varridos, por conterem recursos de produção.
- `docs/conteudo-real.md` reflecte as seis listas, os campos dos tipos
  novos e a regra de estado vazio.
- `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` e `pnpm test:e2e`
  passam nos três viewports.

## Riscos

- **O conteúdo real pode divergir do inventário.** `docs/conteudo-real.md`
  pressupõe um perfil com `location` e canais que ainda não foram
  fornecidos. O implementador escreve o que for fornecido e deixa o resto
  por preencher, sem preencher com valores plausíveis inventados.
- **As três secções novas ampliam a superfície de conteúdo.** Um item de
  menu trocado por engano, ou uma secção nova ligada ao menu sem rota,
  produz um 404 silencioso. O teste E2E que percorre as sete rotas, escrito
  na TASK-011, é o que apanha este erro.
- **Os componentes novos podem divergir das secções existentes.** As três
  secções são implementadas do zero, e podem diferir no tratamento da
  lista, no `role="list"` ou no `aria-label` das tecnologias. O padrão a
  seguir é `src/sections/Projects/Projects.tsx`, e a revisão compara as
  três com ele.
- **O `pnpm format:check` falha em `bakeoff/check-permissions.mjs` e
  `scripts/rawspec-v2-cli.test.mjs`.** A dívida é pré-existente em `main` e
  não é objectivo desta task. O comando não faz parte do gate do
  `commit-task`.

## Exclusões

- **Não se escreve em `src/routes/`, salvo as três rotas novas.** O router,
  o layout raíz e a navegação foram feitos na TASK-011.
- **Não se altera `src/components/Sidebar.tsx` nem `Sidebar.module.css`.**
  A navegação e os sete itens de menu foram feitos na TASK-011.
- **Não se altera `src/components/Section.tsx` nem `Section.module.css`.**
  O invólucro das secções foi revisto na TASK-011.
- **Não se altera `src/App.test.tsx`.** As asserções de navegação e de
  `aria-current` foram reescritas na TASK-011.
- **Não se altera `src/styles/globals.css` nem `src/styles/tokens.css`.**
- **Não se ampliam os campos do tipo `Project`** para `objetivo`,
  `principais funcionalidades` e imagens.
- **Não se adiciona uma secção de certificações, testified ou estudos.**
- **Não se implementa tema claro/escuro.**
- **Não se trata nenhuma das dívidas técnicas** de `docs/history.md:583-584`.
- **Não se toca em `docs/history.md`** a não ser pelo `guardiao`, no
  registo da task.
- **Não se altera `docs/projeto.md` nem `docs/deployment.md`.** A
  documentação da aplicação multi-página foi feita na TASK-011.
- **Não se altera a identidade visual**: cores, tipografias e espaçamentos
  mantêm-se nos tokens existentes de `src/styles/tokens.css`.

## Checklist de clareza

- Objetivo único e verificável — ATENDE
- Arquivos afetados — ATENDE
- Entregáveis concretos — ATENDE
- Contrato de entrada, saída e erros — ATENDE (entrada: a informação de
  conteúdo fornecida pelo utilizador, os tipos em `src/types/index.ts` e o
  inventário de `docs/conteudo-real.md`; saída: as seis listas escritas em
  `src/content/`, os três componentes de secção e a mensagem partilhada de
  estado vazio; erros: uma entrada incompleta é removida pela normalização
  em `src/data/`; uma URL sem `https://` ou `http://` é descartada; uma
  lista vazia resulta em "Em construção")
- Testes obrigatórios — ATENDE
- Critério de aceitação objetivo — ATENDE
- Dependências declaradas explicitamente — ATENDE
- Ausência de decisões pendentes para o implementador — ATENDE (a via de
  router, o router escolhido, o texto de estado vazio, o conteúdo real, a
  não ampliação do tipo `Project` e a decisão de não tratar as dívidas
  técnicas estão decididos; o conteúdo concreto depende de informação a
  fornecer pelo utilizador, e a task conclui na mesma sem ela)
