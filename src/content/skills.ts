import type { SkillGroup } from '../types'

// Habilidades do utilizador, agrupadas por categoria.
// Cada habilidade traz o que é e como é usada neste projecto. O campo
// `application` distingue o que é aplicado aqui (`applied`) do que é
// experiência noutros contextos (`experienced`), e só o primeiro recebe
// o rótulo "Aplicado nesse Portfólio".
// Sem níveis de proficiência, sem classificações inventadas.
// Ver `docs/conteudo-real.md` para o inventário do que é necessário.
export const skillGroups: SkillGroup[] = [
  {
    title: 'Frontend',
    skills: [
      {
        name: 'TypeScript',
        description:
          'Um superset de JavaScript com tipos estáticos. Os tipos são apagados na compilação, portanto o JavaScript que roda em produção é o mesmo — o que muda é o que o editor e o compilador conseguem dizer antes do código rodar.',
        usage:
          'Todo o código da aplicação é TypeScript no modo estrito, sem `any` implícito e sem valores padrão silenciosos. Os tipos de domínio ficam em `src/types/` e o router é tipado de ponta a ponta.',
        application: 'applied',
      },
      {
        name: 'React',
        description:
          'Uma biblioteca de interface que descreve a página como uma função do estado. Quando o estado muda, o React redesenha os componentes afetados em vez de alterar o DOM diretamente.',
        usage:
          'A aplicação é construída com componentes funcionais e hooks. O estado fica junto do componente que o usa, e o router decide o que cada página mostra.',
        application: 'applied',
      },
      {
        name: 'CSS Modules',
        description:
          'Arquivos CSS com escopo por arquivo. Cada classe vira um nome único na compilação, o que evita que dois estilos com o mesmo nome colidam entre componentes.',
        usage:
          'Cada componente tem seu próprio arquivo de estilos. Os nomes de classe são locais ao módulo, e as cores, tipografias e espaçamentos vêm sempre dos tokens globais.',
        application: 'applied',
      },
      {
        name: 'HTML semântico',
        description:
          'Usar as tags que descrevem o que o conteúdo é, em vez de divs com estilos. Um cabeçalho é header, uma navegação é nav, um título é heading — o leitor de tela passa a fazer sentido sem scripts auxiliares.',
        usage:
          'Cada seção é um section com referência ao seu título de nível dois, e a navegação é uma nav com lista de links. A hierarquia de títulos vai de h1 na marca até h4 nos itens.',
        application: 'applied',
      },
      {
        name: 'TanStack Router',
        description:
          'Um roteador de páginas para React que carrega rotas por código em vez de arquivos. O estado da rota fica no roteador, o que permite navegar sem recarregar o documento e saber qual rota está ativa em qualquer momento.',
        usage:
          'As rotas são definidas na pasta de rotas e montadas em um único arquivo. O Link marca a rota atual automaticamente, e a marca da barra lateral é uma âncora simples para não duplicar essa marcação.',
        application: 'applied',
      },
      {
        name: 'Acessibilidade (WCAG 2.2 AA)',
        description:
          'O conjunto de regras das Web Content Accessibility Guidelines que define o que um site precisa cumprir para ser usado por qualquer pessoa — incluindo quem navega por teclado ou por leitor de tela.',
        usage:
          'O objetivo declarado é WCAG 2.2 AA. A suíte de testes roda o axe em cada seção, e o Playwright verifica alvos de toque de 44 por 44 pixels, foco visível e a navegação completa por teclado.',
        application: 'applied',
      },
    ],
  },
  {
    title: 'Testes e qualidade',
    skills: [
      {
        name: 'Vitest',
        description:
          'Um runner de testes construído sobre o motor do Vite. Os módulos passam pela mesma transformação que a aplicação usa, então o teste enxerga exatamente o mesmo código que o navegador.',
        usage:
          'Cobre a lógica de dados, a renderização de componentes e as regras de acessibilidade. Roda em pnpm test e faz parte do gate antes de qualquer commit.',
        application: 'applied',
      },
      {
        name: 'Testing Library',
        description:
          'Uma biblioteca que permite testar o que o usuário vê, em vez da estrutura interna. Em vez de procurar uma div, procura-se o botão pelo nome que o usuário lê.',
        usage:
          'As asserções usam consultas por papel e por texto visível, o que garante que os papéis semânticos estão corretos, e não apenas que o DOM existe.',
        application: 'applied',
      },
      {
        name: 'Playwright',
        description:
          'Um framework de testes que conduz um navegador de verdade — Chromium, Firefox ou WebKit — em vez de simular o DOM. Pode testar o que só acontece depois que o JavaScript roda.',
        usage:
          'Cobre as seis rotas em três viewports: carregamento direto por URL, navegação por clique sem deslocar o documento, scroll próprio da área de conteúdo e ausência de overflow horizontal.',
        application: 'applied',
      },
      {
        name: 'vitest-axe',
        description:
          'Uma integração entre o axe-core e o Testing Library que verifica as regras de acessibilidade automaticamente sobre o HTML renderizado.',
        usage:
          'Cada seção da aplicação é analisada em runtime e o resultado é exigido como vazio. Uma violação introduzida em um commit derruba a suíte antes de chegar na revisão.',
        application: 'applied',
      },
      {
        name: 'ESLint',
        description:
          'Analisador estático que procura erros e problemas de estilo no código antes de ele rodar, a partir de regras configuráveis.',
        usage:
          'Cobre o código da aplicação, os testes end-to-end e os scripts, com o typescript-eslint no modo estrito. Roda em pnpm lint e é o primeiro passo do gate de commit.',
        application: 'applied',
      },
      {
        name: 'Prettier',
        description:
          'Formatador de código que aplica um estilo consistente automaticamente, eliminando a discussão sobre formatação em revisão.',
        usage:
          'Cobre TypeScript, CSS, Markdown e JSON. Roda pelo lint-staged em cada commit e pelo pnpm format:check na verificação completa.',
        application: 'applied',
      },
      {
        name: 'Husky',
        description:
          'Ferramenta que instala hooks do Git, para que as verificações sejam executadas no momento do commit em vez de depender de alguém lembrar de rodá-las.',
        usage:
          'Os hooks ficam ativos e repetem as verificações antes de cada commit. Nunca são contornados com a opção de pular os hooks.',
        application: 'applied',
      },
      {
        name: 'GitHub Actions',
        description:
          'O sistema de integração contínua do GitHub, que roda comandos em uma máquina virtual sempre que há um commit ou um pull request.',
        usage:
          'O workflow de CI instala as dependências com o lockfile congelado e roda a cadeia completa de qualidade — lint, tipos, testes, build e testes end-to-end — o que garante que o branch está verde antes de ser mesclado.',
        application: 'applied',
      },
    ],
  },
  {
    title: 'Ferramentas e ambiente',
    skills: [
      {
        name: 'Vite',
        description:
          'Servidor de desenvolvimento e empacotador que usa o grafo de módulos nativo do navegador. Em desenvolvimento só converte o que é pedido, o que deixa a inicialização quase instantânea.',
        usage:
          'Serve a aplicação em desenvolvimento, gera o dist de produção e fornece o preview que serve esse dist nos testes end-to-end.',
        application: 'applied',
      },
      {
        name: 'pnpm',
        description:
          'Gerenciador de pacotes que guarda as dependências em um único store endereçável por conteúdo, em vez de duplicá-las em cada projeto.',
        usage:
          'É o gerenciador fixado pelo campo packageManager do package.json, o que garante a mesma versão em todas as máquinas e no CI.',
        application: 'applied',
      },
      {
        name: 'Git',
        description:
          'Sistema de controle de versão que guarda o histórico do projeto. Cada alteração é um commit, e os branches isolam o trabalho em andamento.',
        usage:
          'O RawSpec v2 exige um branch por tarefa, com os commits registrados pelo guardião e enviados para o remoto depois das verificações.',
        application: 'applied',
      },
      {
        name: 'GitHub',
        description:
          'Plataforma que hospeda o repositório, revisa pull requests e roda a integração contínua.',
        usage:
          'O repositório remoto fica no GitHub, e cada tarefa termina em um pull request aberto automaticamente a partir do branch da tarefa.',
        application: 'applied',
      },
      {
        name: 'Node.js',
        description:
          'Runtime de JavaScript fora do navegador, usado para executar as ferramentas de linha de comando — o compilador, os testes e o servidor de desenvolvimento.',
        usage:
          'A versão mínima é a 22, e é o runtime que executa o Vite, o Vitest e o Playwright durante o desenvolvimento.',
        application: 'applied',
      },
      {
        name: 'VS Code',
        description:
          'Editor de código com integração profunda com Git e TypeScript: diagnóstico de tipos em tempo real, refatoração e navegação por definição.',
        usage:
          'É o editor de referência para escrever e ler o código, inclusive o diff antes de enviá-lo para revisão. Não há configuração de projeto versionada, porque nenhuma até agora foi necessária.',
        application: 'applied',
      },
      {
        name: 'Cursor',
        description:
          'Editor de código construído sobre o VS Code, com um modelo de IA integrado que conversa com o código do projeto e propõe alterações.',
        usage:
          'É uma das ferramentas de IA de apoio ao desenvolvimento, usada junto com o OpenCode para acelerar a implementação e a revisão.',
        application: 'applied',
      },
      {
        name: 'OpenCode',
        description:
          'Agente de programação que executa tarefas dentro do projeto: lê os arquivos, edita o código, roda os comandos e decide os próximos passos.',
        usage:
          'É o agente de desenvolvimento do projeto. Toda a orquestração — agentes, comandos e permissões — é configuração nativa do OpenCode em arquivos versionados, sem código próprio.',
        application: 'applied',
      },
    ],
  },
  {
    title: 'Processo e arquitetura',
    skills: [
      {
        name: 'Spec-Driven Design',
        description:
          'Desenhar o software a partir de especificações escritas antes de escrever código. A especificação é a fonte da verdade sobre o que vai ser construído, e o código é a implementação dela.',
        usage:
          'Cada tarefa do projeto é um documento com objetivo, arquivos afetados, entregáveis, regras, testes e aceitação. O código é escrito contra esse documento, e não o contrário.',
        application: 'applied',
      },
      {
        name: 'RawSpec v2',
        description:
          'Formato de especificações do projeto, versionado em Markdown dentro do próprio repositório. Uma tarefa tem estados, dependências declaradas e um ciclo de vida que vai de PENDING a ARCHIVED.',
        usage:
          'A CLI cria o branch da tarefa, valida o escopo dos arquivos e faz o registro. Um helper com mais de quarenta comandos cria branches, commits e pull requests, e um gate rejeita commits que tocam arquivos fora do escopo declarado.',
        application: 'applied',
      },
      {
        name: 'Orquestração de agentes',
        description:
          'Dividir o trabalho por papéis — explorar, implementar, revisar, verificar, registrar — e passar o contexto de forma explícita entre eles.',
        usage:
          'São nove agentes com permissões distintas, e o roteamento entre modelos foi medido por bake-off em vez de assumido. A verificação é executada por um agente que não escreve código.',
        application: 'applied',
      },
      {
        name: 'Revisão em par',
        description:
          'Dois revisores independentes analisam a mesma alteração, com atenção a ângulos diferentes, para reduzir o ponto cego de um único olhar.',
        usage:
          'A revisão A procura defeitos funcionais e regressões; a revisão B foca acessibilidade, performance, tipagem e segurança. As duas precisam aprovar antes do commit.',
        application: 'applied',
      },
      {
        name: 'Documentação como código',
        description:
          'Tratar a documentação com o mesmo cuidado que o código: versionada, revisada e validada por comandos, em vez de documentar apenas o que der na cabeça de escrever.',
        usage:
          'As ADRs registram as decisões com seu motivo e impacto, o histórico é append-only, e a CLI valida o formato das especificações em cada operação.',
        application: 'applied',
      },
      {
        name: 'Desenvolvimento Assistido por IA',
        description:
          'Usar modelos de linguagem como parte do trabalho de implementação, análise e revisão — com a pessoa mantendo o controle sobre as decisões.',
        usage:
          'A IA participa do planejamento, da decomposição de tarefas, da implementação, da revisão e dos testes. A regra do projeto é nunca delegar decisões críticas sem revisão humana.',
        application: 'applied',
      },
    ],
  },
  {
    title: 'Plataforma',
    skills: [
      {
        name: 'Supabase',
        description:
          'Plataforma de backend sobre PostgreSQL que expõe banco de dados, autenticação, armazenamento e funções de servidor através de uma API. Entrega um serviço pronto, sem administrar servidores.',
        usage:
          'É a plataforma usada em projetos com autenticação e dados persistentes. Aqui o escopo é o do MVP: aplicação estática, sem backend, com os dados versionados no repositório.',
        application: 'experienced',
      },
      {
        name: 'PostgreSQL',
        description:
          'Banco de dados relacional que guarda os dados em tabelas com relacionamentos, restrições e transações. É a referência de integridade para quem tem dados com forma.',
        usage:
          'É o banco de dados por trás do Supabase. Em projetos que precisam de dados relacionais, o modelo relacional com restrições no banco evita que a integridade dependa apenas do código.',
        application: 'experienced',
      },
      {
        name: 'Autenticação',
        description:
          'Processo de verificar quem é o usuário e manter essa identidade ao longo do tempo, com sessões, recuperação de senha e gestão de contas.',
        usage:
          'É a base de qualquer área restrita, onde o conteúdo deixa de ser público. O fluxo completo de sessões e recuperação de senha já foi implementado em projetos com Supabase Auth.',
        application: 'experienced',
      },
      {
        name: 'Row Level Security',
        description:
          'Regra do PostgreSQL que decide, a cada linha, quem pode ler e quem pode escrever. A segurança passa a ser uma propriedade do banco de dados, e não só do código que a consulta.',
        usage:
          'É a forma de garantir que cada usuário só vê e escreve os próprios registros, com a regra no banco de dados e não apenas na camada de aplicação.',
        application: 'experienced',
      },
    ],
  },
]
