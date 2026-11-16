# Portfolio — Documentação Geral do Projeto

**Documento:** visão geral, requisitos, decisões e histórico
**Projeto:** portfólio pessoal
**Repositório:** `carloshsales/portifolio`
**Diretório local:** `C:\workspace\projects\portfolio`
**Idioma da interface e do conteúdo:** português brasileiro (pt-BR)
**Estado:** em desenvolvimento
**Objetivo prioritário:** concluir o MVP do portfólio

> Este documento é a **referência de projeto** e não uma especificação. Descreve o
> que o portfólio é, o que ele deve conter e como o trabalho é conduzido.
>
> As especificações executáveis vivem em `specs/changes/`, e o formato do
> processo está definido em [`rawspec-v2.md`](rawspec-v2.md). O histórico
> append-only de decisões está em [`history.md`](history.md), e as decisões
> estruturais em [`decisions/`](decisions/).
>
> Este documento reflecte sempre o **estado verificado no repositório**. Quando
> divergir dele, o repositório é a fonte de verdade e este documento está
> desatualizado.

---

## 1. Visão do projeto

### 1.1 Objetivo

Desenvolver um portfólio profissional para apresentar competências técnicas,
conhecimentos, projetos pessoais e experimentos de desenvolvimento.

O portfólio deve demonstrar não apenas conhecimentos de programação, mas também
capacidade de:

- desenvolver aplicações com boas práticas;
- projetar soluções e arquiteturas;
- aplicar princípios de segurança;
- trabalhar com qualidade de código e testes;
- utilizar ferramentas modernas de desenvolvimento;
- utilizar inteligência artificial como ferramenta de apoio à engenharia de software;
- organizar e executar projetos de maneira estruturada.

O projeto também funciona como uma demonstração prática das habilidades técnicas
do desenvolvedor.

### 1.2 Público-alvo

- recrutadores;
- empresas de tecnologia;
- desenvolvedores;
- profissionais da área de tecnologia;
- pessoas interessadas nos projetos apresentados.

### 1.3 Direcionamento

O resultado deve transmitir profissionalismo, domínio técnico, organização e
personalidade.

Não deve parecer um site genérico de desenvolvedor, nem utilizar uma estética
excessivamente gamer, cyberpunk ou carregada de efeitos.

A identidade deve ser moderna, minimalista e visualmente marcante.

### 1.4 Idioma

A **interface e o conteúdo** do portfólio estão em **português brasileiro**
(pt-BR). Aplica-se a títulos, rótulos, textos de secção, mensagens de estado
vazio e descrições de conteúdo.

Os **comentários e a documentação do código-fonte** seguem o registo atual do
repositório, em português europeu.

> As duas registos coexistiram durante o desenvolvimento inicial, com texto
> visível misturado ("Contacto", "Onde me podes encontrar" e "Contato" na mesma
> aplicação). O texto visível foi uniformizado em pt-BR.

---

## 2. Escopo do produto

### 2.1 Estrutura principal

O portfólio é uma experiência de página única, com navegação lateral e secções
organizadas.

**Menu implementado, com quatro secções:**

1. Início
2. Projetos
3. Habilidades
4. Contato

As habilidades e tecnologias são apresentadas na secção própria **Habilidades**,
com uma secção independente no menu. A secção **Início** apresenta a identidade,
o resumo profissional e a fotografia.

**Secções planeadas, ainda por construir:**

| Secção | Estado | Conteúdo previsto |
|---|---|---|
| Jogos | por construir | projetos de desenvolvimento de jogos, protótipos e jogos durante o aprendizado |
| Artigos | por construir | conhecimentos, experiências técnicas e conteúdos sobre desenvolvimento de software |
| Experimentos | por construir | protótipos, testes de tecnologias, provas de conceito, pequenas aplicações, estudos técnicos e experimentos com IA |

Estas três secções dependem da conclusão do MVP e da disponibilidade de conteúdo
real. A sua criação exige tarefas próprias na change `001-portfolio-mvp`, com
respeto pelo grafo de dependências.

### 2.2 Conteúdo de cada secção

#### Início

Apresentação pessoal e profissional. Contém:

- apresentação resumida;
- identidade visual do desenvolvedor;
- fotografia em moldura circular;
- chamadas para a ação que direcionam para as secções existentes.

As chamadas para a ação só aparecem quando existe conteúdo correspondente.

#### Projetos

Apresentação de projetos de desenvolvimento. Cada projeto pode apresentar:

- nome;
- descrição;
- objetivo;
- tecnologias utilizadas;
- principais funcionalidades;
- imagens ou capturas de ecrã;
- repositório;
- demonstração, quando disponível.

#### Habilidades

Linguagens, frameworks, ferramentas e competências, agrupadas por categoria.

#### Contato

Área destinada a facilitar o contacto profissional. Os canais de contacto são
definidos com informações verdadeiras, sem inventar endereços ou perfis.

### 2.3 Restrições de conteúdo

A apresentação de experiências profissionais e de empresas onde o desenvolvedor
trabalhou foi removida completamente do âmbito.

O foco permanece em:

- competências;
- conhecimentos técnicos;
- projetos;
- tecnologias;
- experimentos;
- capacidade de desenvolvimento.

Não inventar experiências profissionais, empresas, qualificações, projetos ou
resultados.

---

## 3. Identidade visual

### 3.1 Direção aprovada

A direção visual combina:

- fundo grafite;
- superfícies escuras;
- destaques em laranja âmbar;
- tipografia clara;
- elementos discretos de profundidade;
- navegação lateral fixa no desktop;
- adaptação responsiva para dispositivos móveis.

O resultado deve ser profissional, moderno e com personalidade.

### 3.2 Paleta de cores

| Elemento | Cor |
|---|---|
| Fundo principal | `#171717` |
| Superfícies | `#222222` |
| Destaque | `#FF922B` |
| Texto principal | `#F5F5F5` |
| Texto secundário | `#B8B8B8` |

O laranja é usado como destaque, não como fundo dominante de grandes áreas com
texto claro.

A combinação de texto claro com fundo laranja tem contraste insuficiente para
texto normal. Quando necessário, utiliza-se texto grafite sobre o laranja.

### 3.3 Tipografia

| Uso | Família |
|---|---|
| Títulos | Manrope |
| Textos e conteúdo geral | Nunito Sans |
| Informações técnicas, códigos e detalhes de desenvolvimento | JetBrains Mono |

As fontes são carregadas do Google Fonts com `preconnect` e `display=swap`.

> A especificação inicial do projeto indicava **Inter** para os textos. A
> decisão registrada na `design.md` aprovada da change `001-portfolio-mvp` é
> **Nunito Sans**, e é a que está implementada em `src/styles/tokens.css` e em
> `index.html`. Prevalece a decisão aprovada.

### 3.4 Componentes e efeitos visuais

Diretrizes:

- sidebar fixa no desktop;
- navegação adaptada para dispositivos móveis;
- fotografia pessoal em moldura circular;
- glassmorphism de maneira moderada;
- animações suaves;
- efeitos visuais discretos;
- hierarquia visual clara;
- transições consistentes;
- elementos de destaque sem excesso de decoração.

### 3.5 Responsividade

Desenvolvimento mobile-first.

O layout deve funcionar em:

- smartphones;
- tablets;
- notebooks;
- monitores desktop.

A navegação lateral é adaptada para ecrãs menores, passando a barra inferior
horizontal abaixo de 1024px.

### 3.6 Acessibilidade

Objetivo: WCAG 2.2 AA.

Requisitos:

- contraste adequado;
- navegação por teclado;
- estados de foco visíveis;
- HTML semântico;
- identificação acessível de controlos;
- estrutura correta de títulos;
- respeito à preferência `prefers-reduced-motion`;
- animações que não prejudicam a navegação;
- conteúdo compreensível e legível.

---

## 4. Arquitetura e tecnologias

### 4.1 Stack aprovada

| Área | Tecnologia |
|---|---|
| Interface | React |
| Linguagem | TypeScript |
| Build | Vite |
| Estilização | CSS Modules |
| Testes | Vitest |
| Testes de componentes | Testing Library |
| Testes end-to-end | Playwright |
| Qualidade | ESLint |
| Formatação | Prettier |
| Hooks Git | Husky |
| Gerenciador de pacotes | pnpm |
| Integração contínua | GitHub Actions |

### 4.2 Versões registadas

Versões observadas durante a configuração inicial:

- React: `19.3.1`
- React DOM: `19.3.1`
- Vite: `8.3.8`
- TypeScript: `6.0.3`
- `@vitejs/plugin-react`: `6.3.0`

São versões registadas no histórico, e não uma garantia de que continuem a ser as
versões instaladas. Confirmar em `package.json`.

### 4.3 Princípios arquiteturais

- TypeScript Strict.
- Componentes reutilizáveis.
- Separação de responsabilidades.
- Estilização modular.
- Organização clara dos ficheiros.
- Código sustentável.
- Baixo acoplamento.
- Simplicidade adequada ao âmbito.
- Evitar abstrações desnecessárias.

### 4.4 Escopo de infraestrutura

Direção aprovada para o MVP:

- aplicação estática;
- dados versionados no repositório;
- deploy estático;
- sem backend para o MVP;
- sem base de dados para o MVP;
- sem painel administrativo para o MVP.

### 4.5 Nota sobre uma arquitetura anterior

Numa fase anterior foi discutida uma arquitetura com backend, painel
administrativo em `/admin`, um único utilizador registado, um único domínio,
acesso administrativo de qualquer lugar, sem cadastro público, sem restrição de
IP e sem MFA obrigatório inicialmente.

Essa arquitetura foi substituída pela proposta de portfólio estático, sem backend
nem painel administrativo, que foi aprovada.

A proposta de painel administrativo **não é requisito do MVP**. Requisitos de
autenticação, autorização, base de dados, gestão de utilizadores e proteção de
APIs pertenciam a essa discussão anterior e não são implementados
automaticamente no MVP estático.

Se o âmbito mudar futuramente, têm de ser especificados de novo.

---

## 5. Segurança e qualidade

O objetivo de demonstrar boas práticas de segurança foi explicitamente discutido
durante o planeamento.

A segurança é considerada no desenvolvimento, mesmo que o MVP não possua
backend.

### 5.1 Requisitos relevantes

- validação de dados;
- prevenção de vulnerabilidades no frontend;
- uso seguro de dependências;
- proteção de informações sensíveis;
- não expor tokens ou segredos no código;
- configuração segura de build e deploy;
- revisão de dependências;
- qualidade do código;
- testes automatizados;
- verificação de acessibilidade.

### 5.2 Segurança futura

Os requisitos de autenticação, autorização, base de dados, gestão de utilizadores
e proteção de APIs não são implementados automaticamente no MVP estático.

Caso o âmbito mude futuramente, deverão ser especificados novamente.

---

## 6. Ferramentas e ambiente de desenvolvimento

### 6.1 Ambiente registado

- sistema operativo: Windows;
- terminal: Git Bash;
- editor e agente de desenvolvimento: OpenCode;
- ferramentas de IA: Cursor e OpenCode;
- controlo de versão: Git;
- repositório remoto: GitHub;
- gerenciador de pacotes: pnpm.

Versões registadas:

- Node.js `v24.15.0`
- npm `12.2.0`
- pnpm `12.18.0`
- Git `2.54.0.windows.1`
- OpenCode `v2.2.0`

### 6.2 Inteligência artificial no desenvolvimento

O projeto utiliza IA para auxiliar:

- planeamento;
- análise de código;
- decomposição de tarefas;
- implementação;
- revisão;
- testes;
- identificação de problemas.

O objetivo é utilizar IA com controlo e validação humana, não delegar decisões
críticas sem revisão.

### 6.3 Agentes do OpenCode

Responsabilidades desejadas:

**Plan**

- analisar requisitos;
- planear soluções;
- decompor funcionalidades;
- identificar dependências;
- preparar especificações.

**Explore**

- investigar o repositório;
- identificar componentes e dependências;
- analisar implementações existentes;
- trabalhar em modo somente leitura.

**Build**

- implementar tarefas aprovadas;
- respeitar o âmbito;
- executar verificações;
- apresentar evidências.

A preferência atual é utilizar agentes nativos, sem construir um orquestrador
personalizado.

---

## 7. Controlo de versão e Git

### 7.1 Repositório

`git@github.com:carloshsales/portifolio.git`

Diretório local registado:

`C:\workspace\projects\portfolio`

### 7.2 Branches

A branch de trabalho deve ser verificada antes de qualquer operação.

Cada tarefa é executada em branch própria, com o formato
`task/NNN-NNN-slug`, conforme a ADR-005. O `main` recebe a integração por
merge.

### 7.3 Restrições

- não trocar de branch automaticamente;
- não criar worktrees para tarefas comuns;
- não executar commits sem autorização explícita;
- não executar pushes sem autorização explícita;
- não descartar alterações não commitadas;
- não utilizar `git add -A` indiscriminadamente;
- inspecionar o estado do Git antes de alterações relevantes.

### 7.4 Husky

Configuração atual:

- `pre-commit`: `lint-staged` (ESLint e Prettier nos ficheiros preparados);
- `pre-push`: `typecheck`, testes e build.

Estas configurações devem ser preservadas enquanto continuarem funcionais.

---

## 8. Planeamento e gestão das especificações

### 8.1 Decisão de armazenamento

ADR-001: **RawSpec em ficheiros Markdown versionados com Git**.

Linear foi considerado para acompanhamento de User Stories, mantendo o Markdown e
o Git como fonte de verdade das especificações.

### 8.2 Estrutura atual

```text
specs/
  changes/
    NNN-slug/
      proposal.md
      design.md
      tasks/
        TASK-NNN.md
        archive/
          TASK-NNN.md
    archive/
      NNN-slug/
docs/
  projeto.md          # esta documentação
  rawspec-v2.md      # formato e comandos do processo
  history.md         # histórico append-only
  decisions/         # ADR
  deployment.md      # publicação
  conteudo-real.md   # inventário do conteúdo a fornecer
```

Diretórios como `planning-artifacts/`, `implementation-artifacts/` e
`_bmad-output/` pertenceram a uma abordagem anterior e **não** existem no
repositório atual.

### 8.3 Problemas identificados

Durante o desenvolvimento do processo de especificações surgiram problemas:

- worktrees criadas sem necessidade;
- comandos personalizados utilizados incorretamente;
- excesso de complexidade na gestão de tarefas;
- tempo excessivo dedicado à infraestrutura de planeamento;
- dificuldade em manter o foco na conclusão do MVP.

A abordagem foi revista e substituída pelo RawSpec v2.

### 8.4 Direção atual

O processo atual:

- trabalha em branch por tarefa, sem worktrees desnecessárias;
- não depende de comandos personalizados para a gestão;
- preserva funcionalidades e configurações úteis;
- mantém especificações estruturadas;
- tem uma tarefa por ficheiro;
- permite arquivamento individual;
- exige aprovação humana;
- prioriza a implementação do portfólio.

### 8.5 Regra dos 90% de clareza

Cada tarefa passa por uma avaliação objetiva antes de ser implementada.

**Dez critérios, com dez pontos cada:**

1. objetivo e resultado esperado;
2. contexto e problema;
3. delimitação do âmbito;
4. comportamento esperado;
5. critérios de aceitação verificáveis;
6. requisitos e restrições técnicas;
7. dependências;
8. ficheiros ou módulos envolvidos;
9. estratégia de testes e validação;
10. exclusões e riscos conhecidos.

**Pontuação mínima:** 90/100.

**Regras adicionais:**

- objetivo, âmbito e critérios de aceitação são obrigatórios;
- contradições ou decisões críticas em aberto bloqueiam a aprovação;
- critérios não aplicáveis precisam de justificação;
- a avaliação apresenta evidências;
- a pontuação não substitui a aprovação humana;
- nenhuma implementação começa sem aprovação explícita.

O checklist de clareza do formato v2, em `specs/templates/task.md`, tem **oito
itens** e é o que está em uso. Os dez critérios acima são o critério de
qualidade do planeamento, e não o checklist mecânico do ficheiro de tarefa.

### 8.6 Ciclo de vida em uso

O ciclo de vida implementado pelo RawSpec v2 tem **oito estados**:

```text
PENDING → IN PROGRESS → VERIFYING → COMPLETED → ARCHIVED
```

Falha de verificação: `VERIFYING` regressa a `IN PROGRESS` com
`Verificação: FAILED (data) — motivo`.

O arquivamento de uma tarefa exige `COMPLETED` + `VERIFIED`, ausência de plano de
ação por resolver e aprovação humana explícita. O arquivamento preserva
especificação, critérios, aprovação, histórico, evidências e resultado da
validação.

---

## 9. Histórico das changes do MVP

### 9.1 Change 001 — Portfolio MVP

Diretório: `specs/changes/001-portfolio-mvp/`

Documentos: `proposal.md` e `design.md`, ambos com estado `APPROVED`. As tarefas
estão em `tasks/TASK-NNN.md`, com uma tarefa por ficheiro.

**Estado real verificado no repositório, em `main`:**

| Tarefa | Título | Estado |
|---|---|---|
| TASK-001 | Inicializar aplicação | `PENDING` |
| TASK-002 | Configurar qualidade e Git Hooks | `PENDING` |
| TASK-003 | Configurar estilos globais | `PENDING` |
| TASK-004 | Criar estrutura de navegação | `PENDING` |
| TASK-005 | Implementar secção inicial | `PENDING` |
| TASK-006 | Implementar secção de projetos | `PENDING` |
| TASK-007 | Implementar secção de habilidades | `PENDING` |
| TASK-008 | Implementar secção de contacto | `PENDING` |
| TASK-009 | Preencher o conteúdo real do portfólio | `PENDING` |
| TASK-010 | Revisar responsividade e performance | `PENDING` |
| TASK-011 | Validação final | `PENDING` |
| TASK-012 | Preparar publicação | `PENDING` |

> **Nota sobre o desvio entre estado registado e estado real.** O código das
> secções Início, Projetos, Habilidades e Contacto, os estilos globais, os
> tokens, a navegação lateral e a cadeia de qualidade **já estão implementados**,
> enquanto as tarefas correspondentes continuam `PENDING`. A TASK-001 foi
> reescrita para reflectir a revisão e a verificação do código existente, e as
> restantes estão em processo de reescrita com o mesmo critério.
>
> A TASK-001 está `COMPLETED` + `VERIFIED` + `ARCHIVED` na branch
> `task/001-001-inicializar-aplicacao`, que ainda não foi integrada em `main`.
> Até essa integração, `main` mostra a tarefa como `PENDING`.
>
> O ficheiro de uma tarefa é a fonte de verdade do seu próprio estado, e o
> `docs/history.md` regista as decisões tomadas.

### 9.2 Change 002 — RawSpec Task Commands

Diretório: `specs/changes/archive/002-rawspec-task-commands/`

Objetivo original: implementar comandos personalizados `/startspec`,
`/continuespec` e `/arquivespec`, com scripts partilhados, controlo de
dependências, estados e arquivamento.

Os documentos foram revistos e aprovados, mas a abordagem foi posteriormente
identificada como geradora de complexidade operacional, e o processo foi
refatorado.

**Direção atual:** a implementação dos comandos personalizados não foi retomada.
Os documentos são preservados como histórico e reaproveitam-se apenas as
decisões úteis.

### 9.3 Change 003, 004 e 005

As changes `003-rawspec-v2`, `004-rawspec-branch-per-task` e
`005-refactor-portfolio-baseline` estão arquivadas em `specs/changes/archive/`.

---

## 10. Organização do conteúdo e autenticidade

O portfólio deve representar fielmente as habilidades e os projetos existentes.

Não utilizar:

- experiências profissionais inventadas;
- empresas fictícias;
- projetos apresentados como concluídos quando ainda são protótipos;
- tecnologias declaradas como dominadas sem fundamento;
- resultados ou métricas inventados.

Projetos em desenvolvimento podem ser apresentados como protótipos, estudos ou
projetos em andamento, quando isso corresponder à realidade.

O conteúdo real vive em `src/content/` e é exposto ao código através de
`src/data/`. O inventário do que é preciso fornecer está em
[`conteudo-real.md`](conteudo-real.md).

---

## 11. Prioridades do projeto

A prioridade atual é finalizar o MVP.

1. Consolidar o processo de desenvolvimento sem burocracia excessiva.
2. Verificar e preservar a fundação técnica já implementada.
3. Finalizar estilos globais e tokens.
4. Construir a navegação lateral.
5. Desenvolver a secção inicial.
6. Desenvolver as secções de projetos, jogos, artigos e experimentos.
7. Desenvolver a secção de contacto.
8. Finalizar responsividade e acessibilidade.
9. Executar validações finais.
10. Preparar a publicação estática.

A ordem definitiva respeita as dependências técnicas identificadas no
projeto. O grafo effective está no ficheiro de cada tarefa, no campo
`Depende de`.

---

## 12. Princípios de trabalho

1. O desenvolvimento do portfólio é mais importante do que desenvolver
   ferramentas de gestão.
2. O planeamento deve reduzir retrabalho, não gerar burocracia.
3. Nenhuma implementação sem entendimento suficiente do requisito.
4. Cada tarefa deve ser objetiva, verificável e rastreável.
5. A regra dos 90% de clareza é obrigatória.
6. A aprovação humana é obrigatória.
7. O código existente deve ser inspecionado antes de ser alterado.
8. Os testes precisam de ser executados e as suas evidências registadas.
9. O âmbito não deve crescer sem necessidade.
10. O utilizador mantém a decisão final sobre mudanças relevantes.
11. Não executar commits ou pushes sem autorização.
12. Não criar worktrees desnecessárias.
13. O agente apresenta o resumo do trabalho antes de o executar e pergunta ao
    utilizador sempre que existam discrepâncias.

---

## 13. Pontos a confirmar no repositório

Esta documentação reúne decisões e informação registada em conversas. Não
substitui uma inspeção atual do código.

Antes de continuar, verificar:

- branch atual;
- alterações não commitadas;
- worktrees existentes;
- estado real da change 001;
- estado real das changes 002 a 005;
- quais tarefas já foram implementadas;
- quais testes existem;
- se as configurações do Husky continuam funcionais;
- quais instruções do OpenCode estão ativas;
- quais documentos ainda representam o âmbito aprovado;
- qual é a próxima tarefa elegível.

---

## 14. Definição de sucesso do MVP

O MVP estará concluído quando:

- todas as secções aprovadas estiverem implementadas;
- a navegação funcionar corretamente;
- o conteúdo representar fielmente o desenvolvedor;
- o layout funcionar em dispositivos móveis e desktop;
- a acessibilidade WCAG 2.2 AA tiver sido validada;
- os testes e verificações aplicáveis estiverem aprovados;
- o build de produção estiver a funcionar;
- o site estiver pronto para publicação estática.

**Resultado esperado:** um portfólio profissional, responsivo, acessível e
tecnicamente bem construído, que demonstre competências reais e funcione como
vitrine profissional do desenvolvedor.
