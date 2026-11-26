# TASK-012 — Manter a publicação em espera

- Change: 001-portfolio-mvp
- Status: PENDING
- Depende de: TASK-014
- Início: —
- Verificação: PENDING
- Evidência: —
- Plano de ação: none

## Objetivo

Registar, de forma explícita e rastreável, que a publicação do portfólio
está deliberadamente adiada, e deixar o repositório preparado para que a
publicação possa ser feita mais tarde sem trabalho de investigação.

Esta task **não publica o portfólio**. Não escolhe o destino de alojamento,
não cria configuração de publicação, não executa deploy e não altera o
domínio.

## Contexto

A TASK-011 transforma o portfólio numa aplicação multi-página, com sete rotas
(`/`, `/projetos`, `/habilidades`, `/contato`, `/jogos`, `/artigos`,
`/experimentos`) servidas pelo cliente, e a TASK-014 alarga o conteúdo e
implementa as três secções novas. Esta alteração tem uma consequência
de publicação que não existia antes: **o fallback SPA passa a ser
necessário**. Sem rewrite no servidor, um carregamento directo de
`/projetos` devolve 404, porque não existe um ficheiro correspondente em
`dist/`.

`docs/deployment.md` reflecte hoje a aplicação de rota única. A TASK-011
corrige esse documento, passa a descrever as sete rotas e regista o
requisito de fallback. Esta task verifica que a correcção ficou coerente e
que nada mais ficou por resolver do ponto de vista da publicação.

O documento de publicação existe desde a change 005, que o escreveu de forma
agnóstica ao destino, para que a escolha do deploy pudesse ser feita depois
(`docs/history.md:387-388`). Essa escolha continua por fazer, por decisão do
utilizador.

## Arquivos

- `docs/deployment.md` (alteração)
- `docs/projeto.md` (alteração)
- `specs/changes/001-portfolio-mvp/proposal.md` (alteração)

`docs/deployment.md` e `docs/projeto.md` são **sobreposição sequencial
intencional** com a TASK-011: a TASK-011 escreve a correcção para a
aplicação multi-página, e esta task acrescenta o estado de espera da
publicação. A ordem do grafo garante a sequência. A sobreposição é
declarada aqui, e não é uma divergência de âmbito.

## Entregáveis

- `docs/deployment.md` descreve as sete rotas, com o fallback SPA declarado
  como requisito e as implicações de cada candidato de alojamento
  actualizadas.
- `docs/deployment.md` tem uma secção explícita sobre o estado da
  publicação, a dizer que está adiada e porquê.
- `docs/projeto.md` reflecte o estado de espera no campo de estado do
  projecto.
- `specs/changes/001-portfolio-mvp/proposal.md` reflecte a decisão de não
  publicar agora, sem alterar o estado de aprovação da change.
- Uma lista de condições verificáveis, escrita no documento, que têm de
  estar cumpridas antes de a publicação poder ser executada.

## Regras

- **A publicação não acontece.** Nenhum deploy é executado, nenhum destino
  é configurado, nenhum domínio é apontado, nenhuma conta é criada.
- **O destino não é escolhido.** `docs/deployment.md` continua a descrever
  os candidatos e os critérios de decisão, sem eleger nenhum. A decisão
  pertence ao utilizador, e é uma decisão de âmbito, não de implementação.
- **Nenhum ficheiro de configuração de alojamento é criado.** Não são
  criados `vercel.json`, `netlify.toml`, `public/_redirects`,
  `public/.nojekyll` nem equivalentes. Estes ficheiros são consequência de
  uma escolha de destino, e a escolha não foi feita.
- **O estado de aprovação não muda.** `proposal.md` continua com
  `Status: APPROVED`, e a change 001 continua por arquivar até que a
  TASK-014 e esta task estejam concluídas.
- **`docs/history.md` não é reescrito.** É append-only, e o registo desta
  task é feito pelo `guardiao` no pipeline.
- **Nenhum ficheiro de `src/` é tocado.** Esta task é documental.
- **A verificação é de leitura.** `pnpm lint`, `pnpm typecheck` e
  `pnpm test` são executados para confirmar que a alteração documental não
  quebrou nada, mas a task não altera código.

### Condições para a publicação

A lista de condições que `docs/deployment.md` tem de registar é a seguinte.
Cada condição é objectiva e verificável:

1. **O conteúdo real está escrito.** `src/content/profile.ts`,
   `src/content/projects.ts`, `src/content/skills.ts`,
   `src/content/games.ts`, `src/content/articles.ts` e
   `src/content/experiments.ts` contêm o conteúdo real do utilizador, e
   nenhuma secção apresenta "Em construção".
2. **O build de produção passa.** `pnpm build` termina sem erros, e
   `dist/index.html` existe.
3. **A aplicação multi-página funciona nos três viewports.** O
   `pnpm test:e2e` passa, e as sete rotas respondem.
4. **O peso do artefacto está dentro do limite.** O peso total de `dist/`
   é inferior a 400 kB, e o ficheiro mais pesado é inferior a 250 kB.
5. **O destino está escolhido.** O utilizador eliminou um dos candidatos
   de `docs/deployment.md`, secção 3, com os critérios da secção 4.
6. **O fallback SPA está configurado.** O destino escolhido serve
   `dist/` com rewrite para `index.html`, e um carregamento directo de
   `/projetos` devolve a página, e não um 404.
7. **O HTTPS está activo.** O certificado é válido e o HTTP redirecciona
   para HTTPS.
8. **O cache está correcto.** `assets/` tem `Cache-Control: immutable`, e
   `index.html` tem `no-cache`.
9. **O workflow de CI continua verde.**

As condições 5 a 8 dependem da escolha do destino, e por isso não são
verificáveis enquanto essa escolha não for feita. As condições 1 a 4 são
verificáveis sem ela.

## Testes

- `pnpm lint`, `pnpm typecheck` e `pnpm test` passam.
- `pnpm build` gera o artefacto de produção, confirmando que o `dist/`
  continua a ser gerado sem alteração estrutural.
- **O `dist/` gerado não contém ficheiros por rota.** A verificação
  confirma que existe um único `dist/index.html`, e que não existe
  `dist/projetos/index.html` nem equivalente. É o que torna o fallback SPA
  necessário, e portanto o que a secção 6 de `docs/deployment.md` tem de
  explicar:
  ```bash
  node -e "const fs=require('fs');console.log(fs.readdirSync('dist').join('\n'))"
  ```
- **`docs/deployment.md` menciona as sete rotas.** A verificação confirma que
  cada uma das sete rotas aparece no documento:
  ```bash
  grep -c -e "/projetos" -e "/habilidades" -e "/contato" -e "/jogos" -e "/artigos" -e "/experimentos" docs/deployment.md
  ```
  O resultado é maior ou igual a 6, e cada rota aparece pelo menos uma vez.
- **`docs/deployment.md` declara o fallback SPA como requisito.** A
  verificação confirma que o documento afirma que o fallback é necessário, e
  que nenhum ponto do documento afirma o contrário:
  ```bash
  grep -n -i "fallback" docs/deployment.md
  ```
  Não há nenhuma linha que diga que o fallback é desnecessário.
- **`docs/projeto.md` reflecte o estado de espera.** A verificação confirma
  que o campo de estado do projecto não afirma que está pronto a publicar:
  ```bash
  grep -n -i -e "estado" docs/projeto.md
  ```
  A linha do campo `Estado:` não afirma que o projecto está pronto ou
  publicado.
- **O `proposal.md` mantém o estado `APPROVED`** e a nota sobre a publicação
  adiada:
  ```bash
  grep -n -e "^- Status:" specs/changes/001-portfolio-mvp/proposal.md
  ```
  A linha devolvida é `- Status: APPROVED`. A nota sobre a publicação
  adiada é procurada com
  ```bash
  grep -n -i -e "publica" specs/changes/001-portfolio-mvp/proposal.md
  ```
  e devolve pelo menos uma linha.
- **Verificação visual no browser** do build de produção, para confirmar
  que a aplicação multi-página da TASK-011 continua a funcionar e que o
  documento descreve o que a aplicação faz.

## Aceitação

- `docs/deployment.md` descreve as sete rotas da TASK-011 e declara o
  fallback SPA como requisito, com a consequência explicada: sem rewrite no
  servidor, um carregamento directo de uma rota devolve 404.
- `docs/deployment.md` tem uma secção que declara a publicação adiada, o
  motivo e as condições que têm de estar cumpridas para a publicar. As
  condições são as nove enumeradas na secção "Condições para a publicação",
  e cada uma é objectiva e verificável.
- `docs/deployment.md` e `docs/projeto.md` são alterados nesta task
  **sequencialmente** à TASK-011, que escreveu a correcção para a aplicação
  multi-página.
- Nenhum ficheiro de configuração de alojamento existe no repositório.
- Nenhum deploy foi executado e nenhum destino foi escolhido.
- `docs/projeto.md` reflecte o estado de espera da publicação.
- `specs/changes/001-portfolio-mvp/proposal.md` mantém `Status: APPROVED` e
  regista a decisão de adiar a publicação.
- `pnpm lint`, `pnpm typecheck`, `pnpm test` e `pnpm build` passam.

## Riscos

- **O `dist/` não tem ficheiros por rota, e o `vite preview` não faz
  fallback.** Uma verificação manual que abra directamente `/projetos` no
  `vite preview` pode devolver 404, mesmo com a aplicação correcta. É o
  comportamento esperado de uma SPA sem fallback, e está explicado no
  documento de publicação. A verificação E2E da TASK-011 resolve o problema
  com um servidor estático com rewrite, e essa via não é alterada por esta
  task.
- **A data de publicação não é fixada.** A lista de condições é verificável,
  mas não tem prazo. A publicá-la antes de o conteúdo real estar completo
  é uma decisão do utilizador, e esta task não a antecipa.
- **A escolha de destino pode mudar os requisitos.** O documento descreve
  cinco candidatos, e cada um tem as suas próprias exigências de
  configuração. Se a escolha recair sobre GitHub Pages, o fallback tem de ser
  feito de outra forma, porque a plataforma não faz rewrite por omissão.
  O documento tem de fazer essa distinção visível, e não apenas dizer que o
  fallback é necessário.
- **A change 001 só fecha quando esta task for concluída.** Enquanto esta
  task estiver pendente, a change 001 não é arquivada, e a CLI `next` não
  devolve `E_NOTHING_TO_START` para a change. É o comportamento pretendido.

## Exclusões

- **Não se escolhe o destino de publicação.**
- **Não se cria configuração de alojamento.**
- **Não se publica.**
- **Não se configura o CI para fazer deploy.** O workflow de CI existente
  (`005-005-introduzir-integracao-continua`) mantém-se como está.
- **Não se arquiva a change 001.** O arquivamento é um passo separado, com
  aprovação humana.
- **Não se trata nenhuma dívida técnica** de `docs/history.md:583`.

## Checklist de clareza

- Objetivo único e verificável — ATENDE
- Arquivos afetados — ATENDE
- Entregáveis concretos — ATENDE
- Contrato de entrada, saída e erros — ATENDE (entrada: o
  `docs/deployment.md` revisto pela TASK-011 e o `dist/` gerado pela
  TASK-011; saída: a documentação coerente com a aplicação multi-página e
  o estado de espera declarado; erros: uma rota em falta no documento, ou
  uma afirmação de que o fallback é desnecessário, falha as verificações
  por comando declaradas nos Testes)
- Testes obrigatórios — ATENDE
- Critério de aceitação objetivo — ATENDE
- Dependências declaradas explicitamente — ATENDE
- Ausência de decisões pendentes para o implementador — ATENDE (a decisão
  de destino, de publicação e de configuração de alojamento está tomada pelo
  utilizador e é explicitamente excluída desta task; o conteúdo a escrever
  está determinado nos Entregáveis)
