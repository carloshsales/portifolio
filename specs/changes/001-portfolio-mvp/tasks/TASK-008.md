# TASK-008 — Rever e completar a seção de contato

- Change: 001-portfolio-mvp
- Status: COMPLETED
- Depende de: TASK-007
- Início: 2026-11-25
- Verificação: VERIFIED (2026-11-25) — Ronda 1: pnpm test -> 6 ficheiros passed, 339 passed | 1 skipped (340), 116.69s. pnpm test:e2e -> build de producao OK (37 modulos, built in 216ms), Playwright 78 testes, 76 passed, 2 skipped, 15.3s. Ronda 2 (apos correccao dos achados): pnpm test -> 6 ficheiros passed, 343 passed | 1 skipped (344), 106.23s. pnpm test:e2e -> build OK (built in 220ms), 78 testes, 76 passed, 2 skipped, 17.7s. Excecao registada (decisao explicita do utilizador, via 2): o tool de shell do agente executor recusa qualquer comando composto, pelo que o codigo de saida nao pude ser capturado. Foram testadas 3 formulacoes de permissao na configuracao do agente, cada uma numa sessao nova, e todas devolveram permission.rejected: Permission denied: shell. A configuracao foi revertida ao estado original. O verificador aceitou os resumos de sucesso como evidencia, com esta excecao registada. O risco residual e coberto pelo commit-task, que volta a correr pnpm test e pnpm build com codigo de saida real.
- Evidência: Ronda 1: pnpm test -> 6 ficheiros passed, 339 passed | 1 skipped (340), 116.69s. pnpm test:e2e -> build de producao OK (37 modulos, built in 216ms), Playwright 78 testes, 76 passed, 2 skipped, 15.3s. Ronda 2 (apos correccao dos achados): pnpm test -> 6 ficheiros passed, 343 passed | 1 skipped (344), 106.23s. pnpm test:e2e -> build OK (built in 220ms), 78 testes, 76 passed, 2 skipped, 17.7s. Excecao registada (decisao explicita do utilizador, via 2): o tool de shell do agente executor recusa qualquer comando composto, pelo que o codigo de saida nao pude ser capturado. Foram testadas 3 formulacoes de permissao na configuracao do agente, cada uma numa sessao nova, e todas devolveram permission.rejected: Permission denied: shell. A configuracao foi revertida ao estado original. O verificador aceitou os resumos de sucesso como evidencia, com esta excecao registada. O risco residual e coberto pelo commit-task, que volta a correr pnpm test e pnpm build com codigo de saida real.
- Plano de ação: none

## Objetivo

Rever e completar a seção de contato já implementada, garantindo que os canais de contato são apresentados com ícone e rótulo legível, que cada canal é um link funcional para o destino correto, que a lista de canais expõe a semântica de lista em leitores de ecrã e que a seção degrada para um estado vazio sem quebrar o layout.

## Contexto

Esta tarefa foi originalmente escrita para implementar a seção de contato. Ela já está implementada no repositório, introduzida no commit de bootstrap `943fe07` (2026-11-14) e nunca alterada desde então.

A implementação existente cumpre já os entregáveis de apresentação: lê os canais a partir de `src/data/profile.ts`, apresenta cada canal com o respetivo ícone e um rótulo visível, tem estado vazio e os ícones são decorativos, com `aria-hidden="true"` herdado do componente `Icon` base em `src/components/icons.tsx`. A revisão incide, por isso, sobre aquilo que a implementação existente não cobre:

- a lista de canais usa `list-style: none` sem `role="list"`, pelo que perde a semântica de lista em leitores de ecrã como Safari/VoiceOver (WCAG 1.3.1). O padrão já está previsto no reset do projecto, em `src/styles/reset.css`, que define `ul[role='list'] { list-style: none; }`, e já foi aplicado na seção de habilidades e na seção de projetos;
- a lista herda o recuo de 40px do `padding-inline-start` do browser, porque o reset global só zera margens. As listas da seção de projetos e da seção de habilidades já foram corrigidas, e esta é a correção equivalente;
- `src/data/profile.ts` normaliza apenas por `url.trim() !== ''`: não apara o rótulo nem a URL, e não valida o protocolo. É divergente da normalização já aplicada em `src/data/projects.ts` e `src/data/skills.ts`;
- `Contact.tsx` usa `key={link.label}`, que não é uma chave estável: dois canais com o mesmo rótulo duplicam a chave. As seções irmãs usam chaves estáveis;
- não existem testes que exercitem os entregáveis desta tarefa. `src/test/content.test.tsx` não tem qualquer bloco sobre a seção de contato, `src/test/accessibility.test.tsx` só tem blocos de projetos e de habilidades, e o teste end-to-end "não tem links de contacto inválidos" corre com a lista de canais vazia, pelo que nunca inspeciona um link de contato.

A correção de `role="list"` e de `padding: 0` nas listas de contato foi explicitamente adiada pela `TASK-007`, que decidiu não tocar nas listas da seção de contato nem da barra lateral, deixando-as para as respetivas tarefas. Esta é a respetiva tarefa.

Esta tarefa passa portanto a ser de **revisão e consolidação**, e não de implementação. O conteúdo real dos canais de contato é preenchido na `TASK-009`, que depende desta tarefa.

## Arquivos

- `src/sections/Contact/Contact.tsx` (revisão e correção, se necessária)
- `src/sections/Contact/Contact.module.css` (revisão e correção, se necessária)
- `src/data/profile.ts` (revisão e correção da normalização, se necessária)
- `src/test/content.test.tsx` (revisão e ampliação dos testes da seção de contato, se necessária)
- `src/App.test.tsx` (revisão e ampliação dos testes da seção de contato, se necessária)
- `src/test/accessibility.test.tsx` (revisão e ampliação dos testes da seção de contato, se necessária)
- `e2e/responsive.spec.ts` (revisão e ampliação dos testes da seção de contato, se necessária)
- `src/content/profile.ts` (leitura dos dados; sem escrita)

## Entregáveis

- Os canais de contato são apresentados com o respetivo ícone e com um rótulo visível.
- Cada canal é um link funcional para o destino correto, com o `href` correspondente ao canal.
- Os elementos interativos são acessíveis: o link tem texto visível e o ícone é decorativo, com `aria-hidden`, pelo que não é anunciado por leitores de ecrã.
- A lista de canais expõe a semântica de lista, com `role="list"`, para que não a percam os leitores de ecrã.
- A lista de canais não herda o recuo do browser e alinha com o título da seção.
- A seção apresenta o estado vazio com o texto `Ainda não há canais de contato para apresentar.` quando não há canais.
- A hierarquia de títulos mantém `h2` para o título da seção.
- Canais sem URL utilizável são removidos automaticamente.
- Os dados estão separados da apresentação visual: a seção lê de `src/data/profile.ts`, nunca de `src/content/` diretamente.
- Os canais de destino externo abrem em nova janela, com `target="_blank"` e `rel="noreferrer noopener"`.

## Regras

- **Não recriar** a seção de contato. Revisar e consolidar apenas.
- **Não editar `src/content/profile.ts`** nesta tarefa. O preenchimento do conteúdo real é feito à parte, na `TASK-009`, com base em `docs/conteudo-real.md`.
- A seção lê de `src/data/profile.ts`, nunca de `src/content/` diretamente.
- O `icon` tem de ser `github`, `linkedin` ou `email`. Qualquer outro valor é um erro de tipo.
- "Valor preenchido" significa, em todo o código desta tarefa, um valor não vazio depois de `trim()`. O mesmo critério é usado na normalização de `src/data/profile.ts` e na decisão de apresentar um canal, para que a seção e a fonte de dados não discordem.
- A URL de um canal é válida quando começa por `https://`, `http://` ou, no caso do canal de email, `mailto:`. A regra de `http://`/`https://` de `src/data/projects.ts` **não** se aplica ao canal de email.
- A normalização em `src/data/profile.ts` é a única camada que decide o que um canal expõe, e aplica-se antes da exportação:
  - remove os canais sem URL;
  - remove os canais cuja URL não tenha protocolo válido;
  - exporta o rótulo e a URL aparados.
- O texto do link não pode ser apenas o ícone: tem de existir um rótulo visível.
- O ícone é decorativo e não é anunciado por leitores de ecrã.
- A lista de canais **não** recebe `aria-label`. O contexto é dado pelo título `h2` da seção, à medida da seção de projetos, cuja lista principal também não o recebe.
- O texto visível é apresentado em português brasileiro. O texto do estado vazio é o fixado nos entregáveis e pode ser corrigido para lhe corresponder.
- Os estilos usam CSS Modules e os tokens globais de `src/styles/tokens.css`.
- O TypeScript é estrito, sem `any` implícito nem valores por omissão silenciosos.
- Não publicar contactos que o utilizador não queira tornar públicos.
- Se a verificação identificar um defeito fora dos ficheiros autorizados, registar a ocorrência e não alargar o âmbito sem aprovação do utilizador.
- **Não tocar** nas listas da barra lateral. Aplicam-se `role="list"` e `padding: 0` apenas à seção de contato; a barra lateral fica para a `TASK-004`.

## Testes

- `pnpm lint`, `pnpm typecheck` e `pnpm test` passam.
- `src/test/content.test.tsx` confirma que não há marcadores de placeholder nem emails fictícios.
- `src/test/content.test.tsx` confirma, com uma fixture de dois canais (`github` com `https://github.com/utilizador-teste` e `email` com `mailto:teste@exemplo.test`), que cada canal é apresentado com o ícone correspondente, com o rótulo visível e com o `href` correto, e que a lista expõe `role="list"`.
- `src/test/content.test.tsx` confirma, com a fixture de canais vazia, que a seção apresenta o texto de estado vazio `Ainda não há canais de contato para apresentar.` e que nenhum canal é apresentado.
- `src/test/content.test.tsx` confirma, com fixtures inválidas, que a normalização em `src/data/profile.ts` remove o canal sem URL e o canal com URL de protocolo inválido, e apara o rótulo e a URL.
- `src/App.test.tsx` confirma que a seção de contato é apresentada com o título `Contato`.
- `src/test/accessibility.test.tsx` confirma ausência de violações automáticas, incluindo na seção de contato com a fixture de canais preenchida.
- `pnpm test:e2e` confirma, com o perfil de teste preenchido com canais, que cada link de contato tem `href` não vazio e não `javascript:`.
- A verificação visual de que cada canal abre no destino correto fica para a `TASK-009`, que fornece o conteúdo real e depende desta tarefa.

## Aceitação

A seção de contato renderiza corretamente os dois estados verificáveis sem conteúdo real: com a fixture de zero canais, apresenta o texto de estado vazio `Ainda não há canais de contato para apresentar.` e nenhum link; com uma fixture de dois canais, apresenta um link por canal, cada um com o respetivo ícone decorativo e com o respetivo `href`, e a lista expõe `role="list"`. A normalização em `src/data/profile.ts` remove os canais sem URL e com protocolo inválido, e apara o rótulo e a URL.

## Riscos

- **O `mailto:` é o formato de URL do canal de email** (`docs/conteudo-real.md`, seção 3). A normalização não pode aplicar a regra de `http://`/`https://` de `src/data/projects.ts` ao canal de email, sob pena de o remover silenciosamente do portfólio.
- **O `role="list"` sobre um `ul` é redundante para a semântica HTML e só é distinguível pelo atributo explícito.** O teste tem de procurar o atributo, e não o papel acessível, que já seria `list` sem a correção.
- **O alinhamento visual da lista não é verificável por asserção automática.** O `padding: 0` resolve um valor herdado do browser (`padding-inline-start: 40px`), e o efeito é observacional. A verificação é por inspeção do alinhamento entre o título da seção e a lista.
- **O conteúdo real dos canais está vazio durante esta tarefa.** A verificação visual dos destinos corretos depende da `TASK-009`.

## Checklist de clareza

- Objetivo único e verificável — ATENDE (revisão e consolidação da seção de contato já implementada, com o delta registado em `## Contexto`)
- Arquivos afetados — ATENDE
- Entregáveis concretos — ATENDE
- Contrato de entrada, saída e erros — ATENDE (entrada: `src/data/profile.ts`, que normaliza `src/content/profile.ts`; saída: canais de contato renderizados; erros: lista vazia apresenta o estado vazio, e um canal sem URL ou com protocolo inválido é removido na normalização, sem erro)
- Testes obrigatórios — ATENDE
- Critério de aceitação objetivo — ATENDE
- Dependências declaradas explicitamente — ATENDE
- Ausência de decisões pendentes para o implementador — ATENDE
