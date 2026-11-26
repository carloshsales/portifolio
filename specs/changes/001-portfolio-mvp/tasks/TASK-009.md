# TASK-009 — Preparar a canalização de conteúdo real do portfólio

- Change: 001-portfolio-mvp
- Status: COMPLETED
- Depende de: TASK-005, TASK-006, TASK-007, TASK-008
- Início: 2026-11-26
- Verificação: VERIFIED (2026-11-26) — pnpm test exit 0 - 6 ficheiros de teste, 371 passed, 1 skipped (372). pnpm test:e2e exit 0 - 76 passed, 2 skipped (pre-existentes em main). pnpm lint/typecheck/build exit 0. format:check exit 1 pre-existente em bakeoff e scripts (divida). Bundle varredura zero correspondencias. Revisores A e B aprovados. Verificacao visual no browser aprovada.
- Evidência: pnpm test exit 0 - 6 ficheiros de teste, 371 passed, 1 skipped (372). pnpm test:e2e exit 0 - 76 passed, 2 skipped (pre-existentes em main). pnpm lint/typecheck/build exit 0. format:check exit 1 pre-existente em bakeoff e scripts (divida). Bundle varredura zero correspondencias. Revisores A e B aprovados. Verificacao visual no browser aprovada.
- Plano de ação: none

## Contexto

O portfólio está em produção com o conteúdo vazio. `src/content/profile.ts:5-12`
tem `name`, `role` e `summary` vazios e `social: []`; `src/content/projects.ts:5`
e `src/content/skills.ts:6` são listas vazias. Como `src/sections/Home/Home.tsx:7`
depende de `profile.name`, a fotografia, o resumo e as chamadas para a acção não
são renderizados, e `src/data/profile.ts:32-39` remove todos os canais de
contacto.

O inventário do que falta está em `docs/conteudo-real.md`, que é um guia de
preenchimento e **não** contém dados reais: a secção de abertura declara
explicitamente que apenas indica o que pedir, onde colocar e como validar.

Esta task é a única da change `001-portfolio-mvp` que escreve em `src/content/`
(ver `docs/history.md:407`). As tasks TASK-005 a TASK-008, já arquivadas,
proibiram explicitamente essa escrita.

O conteúdo real do utilizador ainda não foi fornecido. Esta task prepara e
valida a canalização de conteúdo contra dados de teste realistas, e deixa
registado, de forma explícita e rastreável, o passo de introdução do conteúdo
real como trabalho dependente.

## Objetivo

Validar, de ponta a ponta, a canalização de conteúdo do portfólio — de
`src/content/` para `src/data/` até aos componentes — com dados de teste
realistas, e documentar o passo exacto de introdução do conteúdo real.

## Arquivos

- `src/test/content.test.tsx` (alteração)
- `e2e/responsive.spec.ts` (alteração)
- `src/test/fixtures/profile.ts` (criação)
- `src/test/fixtures/projects.ts` (criação)
- `src/test/fixtures/skills.ts` (criação)
- `src/App.test.tsx` (verificação; alteração apenas se necessário)

## Entregáveis

- Uma fixture de perfil, com nome, função, resumo, fotografia e canais de
  contacto, que represente um perfil completo e realista.
- Fixtures de projetos e de grupos de habilidades, com campos realistas e
  completos, usadas pelos testes.
- `src/test/content.test.tsx` passa a verificar a ausência de marcadores de
  placeholder sobre o conteúdo real completo, e deixa de depender do estado
  vazio de `src/content/`.
- `e2e/responsive.spec.ts` passa a injectar o perfil de teste de forma
  explícita, sem depender do conteúdo real de `src/content/`.
- Nenhum texto fictício é introduzido em `src/content/` nem em qualquer
  ficheiro reachado pela aplicação em produção.
- A secção `## Introdução do conteúdo real` desta mesma task documenta o
  passo de introdução do conteúdo real, com a lista de campos a preencher e o
  ficheiro a editar. A secção já existe nesta task e não exige ficheiro novo.

## Regras

- **O conteúdo de produção não é alterado.** `src/content/profile.ts`,
  `src/content/projects.ts` e `src/content/skills.ts` não são tocados. Os dados
  de teste vivem exclusivamente nas fixtures e nos overrides de teste.
- **Nenhum texto fictício é publicado.** O bundle de produção continua a
  apresentar o estado vazio. Esta task não substitui a introdução do conteúdo
  real, que permanece pendente e explícita.
- **A fixture de perfil tem de ser completa.** `name`, `role`, `summary`,
  `photoUrl` e pelo menos dois canais de contacto. Uma fixture incompleta não
  exercita os caminhos de código que esta task precisa de validar.
- **A fixture usa os mesmos tipos que o conteúdo real.** `SocialLink.icon`
  pertence ao conjunto `github` | `linkedin` | `email`
  (`src/types/index.ts:1`). `Project` exige `title`, `description` e
  `technologies` (`src/types/index.ts:18-24`). `SkillGroup` exige `title` e
  `skills` (`src/types/index.ts:26-29`).
- **As URLs da fixture são válidas segundo a normalização vigente.**
  `src/data/profile.ts:4-19` aceita `https://` ou `http://` seguidos de host, e
  para o canal de email aceita `mailto:` seguido de endereço, conforme
  `EMAIL_URL_PATTERN` (`src/data/profile.ts:5`). O canal de email usa
  `mailto:` e não está sujeito à regra `http://`/`https://` de
  `URL_PROTOCOLS` (`src/data/projects.ts:4`), que se aplica a `repositoryUrl` e
  `liveUrl` dos projetos.
- **Unicidade.** Os títulos de grupo de habilidades, as habilidades, os títulos
  de projeto e os rótulos de canal são únicos dentro da respectiva lista. A
  normalização em `src/data/` não deduplica (`src/data/projects.ts:47-49`,
  `src/data/skills.ts:24-26`), pelo que a unicidade é garantida na origem
  (`docs/history.md:694`).
- **A fixture não usa marcadores de placeholder.** Os marcadores
  `teu-utilizador`, `exemplo.com` e `teu@email.com` de
  `src/test/content.test.tsx:10` são rejeitados. A fixture usa nomes de
  domínio e de utilizador plausíveis e distintos. Todas as URL de contacto e de
  projeto usam o TLD reservado `.test`, para que nenhum destino aponte para um
  perfil real de terceiros.
- **O marcador `'['` deixa de ser verificado no conteúdo real.** Qualquer
  texto real pode conter parênteses retos, e `src/test/content.test.tsx:10` o
  tratava como marcador. A constante `PLACEHOLDER_MARKERS`
  (`src/test/content.test.tsx:10`) deixa de incluir `'['` e passa a listar
  apenas os marcadores concretos (`teu-utilizador`, `exemplo.com`,
  `teu@email.com`). A alteração aplica-se a todos os usos da constante,
  incluindo a verificação do conteúdo real dos canais de contacto
  (`src/test/content.test.tsx:764-773`).
- **O marcador `'['` continua proibido nas fixtures.** As fixtures são dados
  escritos à mão e não conteúdo real: uma constante própria,
  `FIXTURE_FORBIDDEN_MARKERS` (`src/test/content.test.tsx:15`), mantém o
  parêntese recto proibido, para que nenhum texto de exemplo se esconda num
  valor de fixture.
- **Os testes "sem nome" injectam um perfil sem nome explicitamente.** Os
  testes de `e2e/responsive.spec.ts:423-429` e `:431-437` navigam para `/` sem
  override e dependem de `profile.name` vazio. Passam a usar o mecanismo de
  injecção por `window.__PORTFOLIO_PROFILE__` (`src/data/profile.ts:42-49`),
  com um perfil sem nome: `name`, `role`, `summary`, `photoUrl` e `location`
  vazios e `social` sem entradas, injectado através do helper
  `setProfileOverride` (`e2e/responsive.spec.ts:33-37`). O `photoUrl` vazio é
  irrelevante para o resultado, porque `src/sections/Home/Home.tsx:16` só
  renderiza a imagem quando `hasName` é verdadeiro.
- **Nenhum componente é editado.** Os componentes leem o conteúdo através de
  `src/data/`. A fixture entra por override, não por alteração de componente.
- **As dívidas herdadas de `docs/history.md:583` não são assumidas por esta
  task.** Entre as registadas nessa entrada, o foco do CTA primário, o fallback
  do teste de desempate, a regex permissiva de `src/data/profile.ts:4`, o teste
  E2E da barra lateral, a iteração pixel-a-pixel e os casts frágeis permanecem
  pendentes. Esta change não lhes atribui task destino: nenhuma das `TASK-010`,
  `TASK-011` ou `TASK-012` cobre estes pontos. Ficam registadas em
  `docs/history.md:583` para resolução em task a criar, e a sua criação é
  responsabilidade do utilizador. O override de `window.__PORTFOLIO_PROFILE__`
  em produção e a validação de protocolo das URL de contacto são tratados
  respectivamente nos Riscos e nas Regras de normalização desta task.
- **`src/App.test.tsx` e `src/test/accessibility.test.tsx` não são alterados.**
  `src/App.test.tsx:227-231` afirma um `h2` que corresponde a `/início|portfólio/i`,
  o que só é verdade porque `src/sections/Home/Home.tsx:11` usa o título `'Início'`
  quando `profile.name` está vazio. Como esta task não altera
  `src/content/`, a asserção continua válida. `src/App.test.tsx` fica no âmbito
  apenas para que uma correcção futura ao cabeçalho da secção Início não bloqueie
  o commit com `E_SCOPE_VIOLATION`.

## Testes

- `pnpm lint`, `pnpm typecheck`, `pnpm test` e `pnpm build` passam.
- `pnpm test:e2e` passa nos três viewports.
- `src/test/content.test.tsx` verifica a ausência dos marcadores concretos
  (`teu-utilizador`, `exemplo.com`, `teu@email.com`) sobre o conteúdo
  renderizado. O marcador `'['` deixa de ser verificado.
- `src/test/content.test.tsx` verifica a ausência de marcadores sobre o
  conteúdo real completo: `profile.name`, `profile.role`, `profile.summary`,
  cada `project.title`, `project.description`, cada `technology`, cada
  `skillGroup.title` e cada `skill`.
- `src/test/content.test.tsx` mantém a verificação de que a fixture não fica
  no conteúdo real.
- `src/test/accessibility.test.tsx` confirma ausência de violações automáticas.
- `src/App.test.tsx` continua a passar sem alteração, porque `src/content/`
  mantém o estado vazio.
- Verificação visual no browser, sobre a fixture: a fotografia é renderizada,
  o texto alternativo é preenchido, e cada link de contacto apresenta o `href`
  esperado. As URL da fixture usam o TLD reservado `.test`, e o canal de email
  usa `mailto:`: nenhum destes destinos responde, e nenhum tem resposta HTTP a
  observar. A evidência descreve os destinos verificados, e não um código de
  resposta.

## Aceitação

- `src/content/profile.ts`, `src/content/projects.ts` e
  `src/content/skills.ts` estão inalterados em relação ao estado anterior à
  task, e `git diff` sobre eles é vazio.
- `src/test/fixtures/profile.ts` exporta um perfil com `name`, `role`,
  `summary`, `photoUrl` e pelo menos dois canais de contacto, com `icon`
  pertencente a `github` | `linkedin` | `email`.
- `src/test/fixtures/projects.ts` exporta pelo menos um projeto com `title`,
  `description` e pelo menos uma `technology`.
- `src/test/fixtures/skills.ts` exporta pelo menos um grupo com `title` e
  pelo menos uma `skill`.
- Nenhuma fixture contém as cadeias `teu-utilizador`, `exemplo.com`,
  `teu@email.com` ou o parêntese recto `[`. A verificação usa a constante
  `FIXTURE_FORBIDDEN_MARKERS` (`src/test/content.test.tsx:15`), que mantém o
  parêntese recto proibido nas fixtures, ao contrário de
  `PLACEHOLDER_MARKERS`, que deixou de o incluir para o conteúdo real.
- Os títulos de grupo, as habilidades, os títulos de projeto e os rótulos de
  canal são únicos dentro da respectiva lista.
- `src/test/content.test.tsx` e `e2e/responsive.spec.ts` não dependem do
  conteúdo real de `src/content/` para as suas verificações de ausência de
  nome e de canais.
- O bundle de produção não contém texto fictício: a varredura dos ficheiros
  JavaScript de `dist/assets/` não encontra nenhum dos valores de
  `profile.name`, `profile.role`, `profile.summary` ou das URL de contacto da
  fixture. A verificação corre `grep -rF "<valor>" dist/assets` para cada um
  dos valores, e cada comando não devolve correspondência. Os ficheiros
  copiados de `public/` (`dist/images/`) não são varridos, por conterem
  recursos de produção.
- A evidência de verificação visual no browser descreve os destinos verificados
  para cada canal de contacto da fixture. Para o canal `mailto:`, a evidência
  descreve o esquema e o endereço, sem código de resposta HTTP.
- `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` e `pnpm test:e2e`
  passam nos três viewports.

## Riscos

- **`window.__PORTFOLIO_PROFILE__` está activo em produção**
  (`src/data/profile.ts:42-49`), sem guarda de ambiente: qualquer visitante
  pode substituir o perfil renderizado a partir da consola. O achado foi adiado
  da `TASK-005` para esta task e, por decisão do utilizador, adiado novamente
  para a `TASK-011`. Fica registado como dependência explícita da `TASK-011`.
- **A introdução do conteúdo real permanece pendente.** Nada nesta task
  publica informação real. Se a `TASK-011` arrancar sem essa introdução, o
  portfólio é publicado vazio.
- **A verificação visual de links é subjectiva e não é registável.** Para
  canais com `mailto:` não há resposta HTTP a observar. A evidência registada
  descreve os destinos verificados, e não um código de resposta.
- **A fixture pode divergir do conteúdo real futuro.** Os tipos das fixtures e
  do conteúdo real são partilhados, mas os valores de teste podem ficar
  desactualizados face a `src/types/index.ts`.
- **`location` é `string` obrigatório no tipo e opcional no inventário**
  (`src/types/index.ts:14`, `docs/conteudo-real.md:26`). A fixture preenche-o
  para manter o perfil completo e fiel ao tipo, mas **`location` não é
  renderizado por nenhum componente** (`src/components/Sidebar.tsx` e
  `src/sections/Home/Home.tsx` não o referem; a sua presença no repositório
  limita-se ao tipo, ao conteúdo e aos ficheiros de teste). A sua exibição
  futura não está prevista no âmbito desta change.

## Introdução do conteúdo real

Trabalho pendente, dependente desta task, a executar quando o utilizador
fornecer a informação:

1. O utilizador fornece nome, função, resumo, localização, canais de contacto,
   projetos com tecnologias e links, e grupos de habilidades.
2. O conteúdo é escrito em `src/content/profile.ts`,
   `src/content/projects.ts` e `src/content/skills.ts`.
3. `src/data/` não é editado: a normalização existente aplica-se.
4. A fotografia é confirmada contra `docs/conteudo-real.md`, secção 6.
5. `public/images/foto-perfil.png` (1,8 MB) fica para a `TASK-010`, que já o
   declara como comprimido ou removido (`TASK-010.md:35`). Esta task não toca
   em `public/images/`. A fotografia usada é `public/images/foto-perfil.jpg`
   (64 kB), a que `src/content/profile.ts:9` já aponta e a que a fixture
   aponta. A divergência de extensão entre o `.png` removido e o `.jpg`
   apontado tem de estar resolvida antes da `TASK-010`, para que o
   `photoUrl` não aponte para um ficheiro removido.
6. O conteúdo real não pode usar os valores de texto da fixture de teste. A
   excepção é o `photoUrl`: tanto a fixture como o conteúdo real apontam para
   a fotografia de produção `public/images/foto-perfil.jpg`, e a igualdade é
   esperada.

## Checklist de clareza

- Objetivo único e verificável — ATENDE
- Arquivos afetados — ATENDE
- Entregáveis concretos — ATENDE
- Contrato de entrada, saída e erros — ATENDE (entrada: inventário
  `docs/conteudo-real.md` e tipos em `src/types/index.ts`; saída: fixtures de
  teste e testes desacoplados do conteúdo real; erros: `icon` fora do conjunto
  `github` | `linkedin` | `email` ou campos obrigatórios em falta falham no
  typecheck; URLs inválidas são removidas pela normalização em `src/data/`)
- Testes obrigatórios — ATENDE
- Critério de aceitação objetivo — ATENDE
- Dependências declaradas explicitamente — ATENDE
- Ausência de decisões pendentes para o implementador — ATENDE
