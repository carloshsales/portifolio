# TASK-003 — Configurar estilos globais

- Change: 001-portfolio-mvp
- Status: PENDING
- Depende de: TASK-002
- Início: —
- Verificação: PENDING
- Evidência: —
- Plano de ação: none

## Objetivo

Verificar e consolidar a camada de estilos globais: paleta aprovada, tipografia, tokens CSS, reset e suporte a movimento reduzido, garantindo que a identidade visual está disponível e reutilizável por todas as secções.

## Contexto

Esta tarefa foi originalmente escrita para criar os estilos globais. Eles já existem no repositório, introduzidos no commit inicial `3a1f9eb` e consolidados durante a change `005-refactor-portfolio-baseline` (arquivada).

Esta tarefa passa portanto a ser de **revisão e consolidação**, e não de criação.

## Arquivos

- `src/styles/tokens.css` (revisão)
- `src/styles/globals.css` (revisão)
- `src/styles/reset.css` (revisão)
- `index.html` (revisão do carregamento das fontes)

## Entregáveis

- Os tokens CSS expõem a paleta aprovada: fundo grafite `#171717`, superfícies `#222222`, destaque âmbar `#ff922b`, texto principal `#f5f5f5` e texto secundário `#b8b8b8`.
- Os tokens de tipografia definem Manrope para títulos, Nunito Sans para texto corrente e JetBrains Mono para detalhes técnicos, com as respetivas escalas de tamanho, pesos e entrelinhas.
- Os tokens de espaçamento seguem uma escala de múltiplos de 4px.
- Os tokens de breakpoint estão documentados e registados como valores literais para uso em media queries.
- O reset remove os valores por omissão do navegador, define `box-sizing: border-box` e previne transbordo horizontal de imagens.
- Os estilos globais aplicam a paleta e a tipografia ao documento e definem um anel de foco visível com `:focus-visible`.
- `scroll-behavior: smooth` é aplicado apenas sob `prefers-reduced-motion: no-preference`.
- Sob `prefers-reduced-motion: reduce`, as animações e transições são neutralizadas.
- As fontes são carregadas do Google Fonts com `preconnect` e `display=swap`.

## Regras

- **Não recriar** `tokens.css`, `globals.css` nem `reset.css`. Revisar e consolidar apenas.
- A paleta e a tipografia são as aprovadas no design. Não introduzir cores nem famílias de letra novas.
- Os tokens referenciados nos módulos CSS de componentes (`--color-*`, `--font-*`, `--text-*`, `--space-*`, `--focus-ring-*`) têm de continuar a existir. A remoção de um token obriga a atualizar todos os seus consumidores na mesma alteração.
- Custom properties não funcionam dentro de `@media`; os breakpoints têm de ser usados como valores literais.
- O suporte a movimento reduzido tem de ser mantido e aplicado aos componentes interativos.

## Testes

- `pnpm lint`, `pnpm typecheck` e `pnpm test` passam.
- `pnpm build` conclui e o CSS resultante contém as custom properties definidas em `tokens.css`.
- Verificação no browser: a paleta e a tipografia estão aplicadas ao documento.
- Verificação no browser: com `prefers-reduced-motion: reduce`, as transições estão neutralizadas.
- Verificação no browser: o foco por teclado apresenta anel visível.
- Verificação no browser: não existe rolagem horizontal em 375px, 768px e 1280px.

## Aceitação

A identidade visual básica está disponível e reutilizável através de tokens CSS, o reset e os estilos globais estão aplicados, e o movimento reduzido é respeitado.

## Checklist de clareza

- Objetivo único e verificável — ATENDE (revisão e consolidação dos estilos globais já existentes)
- Arquivos afetados — ATENDE
- Entregáveis concretos — ATENDE
- Contrato de entrada, saída e erros — ATENDE (entrada: folhas de estilo globais já presentes; saída: tokens consumíveis por todos os módulos; erros: a ausência de um token usado por um módulo CSS faz o build falhar)
- Testes obrigatórios — ATENDE
- Critério de aceitação objetivo — ATENDE
- Dependências declaradas explicitamente — ATENDE
- Ausência de decisões pendentes para o implementador — ATENDE
