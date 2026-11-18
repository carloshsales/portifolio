# TASK-005 — Implementar seção inicial

- Change: 001-portfolio-mvp
- Status: COMPLETED
- Depende de: TASK-004
- Início: 2026-11-18
- Verificação: VERIFIED (2026-11-18) — pnpm test: exit 0, 6 ficheiros de teste passados, 265 testes passados / 1 skipped, duracao 70.26s (avisos jsdom de HTMLCanvasElement.getContext() nao bloqueantes). pnpm test:e2e: exit 0, build de producao concluido, 75 testes com 6 workers, 73 passados / 2 skipped. Passaram os testes novos da task em mobile, tablet e desktop, incluindo o desempate em tablet. Nas rondas anteriores a verificacao passou mas as revisoes A e B reprovaram; os achados corrigidos foram o desacoplamento dos testes face ao conteudo real (mock de src/data/profile com perfil sem nome em src/test/content.test.tsx e src/App.test.tsx) e a limpeza/import dos mocks em src/App.test.tsx (helper renderApp com import dinamico, vi.resetModules em beforeEach, vi.doUnmock em afterEach). Revisoes A e B finais aprovadas sem achados bloqueantes; os achados remanescentes (foco do CTA primario, override window.__PORTFOLIO_PROFILE__ em producao, validacao de protocolo das URLs de contacto, trim dos campos, fallback do teste de desempate, regex permissiva, teste E2E da barra lateral, iteracao pixel-a-pixel, casts frageis) foram adiados pelo utilizador para a TASK-009 ou tasks posteriores.
- Evidência: pnpm test: exit 0, 6 ficheiros de teste passados, 265 testes passados / 1 skipped, duracao 70.26s (avisos jsdom de HTMLCanvasElement.getContext() nao bloqueantes). pnpm test:e2e: exit 0, build de producao concluido, 75 testes com 6 workers, 73 passados / 2 skipped. Passaram os testes novos da task em mobile, tablet e desktop, incluindo o desempate em tablet. Nas rondas anteriores a verificacao passou mas as revisoes A e B reprovaram; os achados corrigidos foram o desacoplamento dos testes face ao conteudo real (mock de src/data/profile com perfil sem nome em src/test/content.test.tsx e src/App.test.tsx) e a limpeza/import dos mocks em src/App.test.tsx (helper renderApp com import dinamico, vi.resetModules em beforeEach, vi.doUnmock em afterEach). Revisoes A e B finais aprovadas sem achados bloqueantes; os achados remanescentes (foco do CTA primario, override window.__PORTFOLIO_PROFILE__ em producao, validacao de protocolo das URLs de contacto, trim dos campos, fallback do teste de desempate, regex permissiva, teste E2E da barra lateral, iteracao pixel-a-pixel, casts frageis) foram adiados pelo utilizador para a TASK-009 ou tasks posteriores.
- Plano de ação: none

## Objetivo

Rever e completar a seção inicial já implementada, garantindo que a identidade profissional, a fotografia e as chamadas para a ação refletem apenas conteúdo real e respeitam a identidade visual aprovada.

## Arquivos

- `src/sections/Home/Home.tsx` (revisão e alteração)
- `src/sections/Home/Home.module.css` (revisão e alteração)
- `src/components/Sidebar.tsx` (revisão e alteração)
- `src/components/Sidebar.module.css` (revisão e alteração)
- `src/test/content.test.tsx` (alteração)
- `src/App.test.tsx` (alteração)
- `e2e/responsive.spec.ts` (alteração)
- `src/data/profile.ts` (alteração; mecanismo de injeção de perfil para testes end-to-end)
- `src/content/profile.ts` (leitura dos dados; sem escrita)

## Entregáveis

- A seção inicial apresenta o nome, a função, o resumo e a fotografia a partir de `src/data/profile.ts`, que normaliza `src/content/profile.ts`.
- A fotografia é exibida em moldura circular, com texto alternativo `Fotografia de <nome>`.
- Sem nome em `profile.name`, a fotografia não é renderizada e nenhum texto alternativo é gerado.
- As chamadas para a ação são condicionadas ao conteúdo do respetivo destino: `Ver projetos` só aparece se existirem projetos e `Contato` só aparece se existirem canais de contacto.
- A barra lateral apresenta a identidade real e navega entre as quatro secções.
- Nenhum texto fictício ou de fallback é renderizado; sem nome, a marca da barra lateral apresenta apenas o rótulo estrutural `Início`.
- Os testes unitários e end-to-end cobrem os dois estados do perfil — sem nome e com nome — e verificam o comportamento da fotografia, do texto alternativo, das dimensões e do estilo.

## Regras

- **Não editar `src/content/profile.ts`** nesta tarefa. O preenchimento do conteúdo real é feito à parte, com base em `docs/conteudo-real.md`.
- A seção e a barra lateral leem de `src/data/`, nunca de `src/content/` diretamente.
- A moldura circular e as proporções da fotografia são mantidas.
- O texto alternativo da fotografia descreve a pessoa, não a imagem: `Fotografia de <nome>`.
- A secção funciona com conteúdo vazio, ocultando o resumo, a fotografia e as ações conforme as condições acima.
- Não introduzir nomes, funções, resumos, projetos, skills ou contactos de exemplo em código de produção.
- As dimensões da fotografia são 240×240 px em desktop e 180×180 px em ecrãs com largura até 767 px, com `border-radius: 50%` e `object-fit: cover`.
- Nos ficheiros de teste, os dados fictícios usados para exercitar o estado "com nome" existem apenas no âmbito do teste e nunca são escritos em `src/content/`.
- `src/data/profile.ts` normaliza o perfil e permite, em ambiente de teste end-to-end, injetar um perfil através de `window.__PORTFOLIO_PROFILE__`; sem esse global, o conteúdo real de `src/content/profile.ts` é usado.

## Testes

- `pnpm lint`, `pnpm typecheck` e `pnpm test` passam.
- `src/test/content.test.tsx` confirma que não há marcadores de placeholder renderizados e que, no estado sem nome, não existe fotografia nem texto alternativo vazio.
- `src/test/accessibility.test.tsx` confirma ausência de violações automáticas.
- `pnpm test:e2e` confirma que, no estado sem nome, a fotografia não é renderizada e que, com nome, a fotografia tem caixa de 240×240 px em desktop e 180×180 px até 767 px de largura, `border-radius: 50%`, `object-fit: cover` e texto alternativo `Fotografia de <nome>`.
- A validação visual com os dados reais do perfil (enquadramento do rosto na moldura circular) fica para a `TASK-009`, que fornece o conteúdo real e depende desta tarefa.

## Aceitação

A seção inicial apresenta a identidade e a fotografia sem texto fictício. Sem nome, a fotografia não é renderizada, não existe texto alternativo vazio e as chamadas para a ação só aparecem quando o respetivo destino tem conteúdo. Com nome, o texto alternativo é exatamente `Fotografia de <nome>`, a imagem carrega com largura natural maior que zero, a caixa tem 240×240 px em desktop e 180×180 px até 767 px de largura, com `border-radius: 50%` e `object-fit: cover`; a navegação funciona por teclado.

## Checklist de clareza

- Objetivo único e verificável — ATENDE
- Arquivos afetados — ATENDE
- Entregáveis concretos — ATENDE
- Contrato de entrada, saída e erros — ATENDE (entrada: `src/data/profile.ts` e `src/data/projects.ts`; saída: secção inicial, barra lateral e testes atualizados; erros: conteúdo vazio não causa erro, oculta resumo, fotografia e ações conforme as condições definidas)
- Testes obrigatórios — ATENDE
- Critério de aceitação objetivo — ATENDE
- Dependências declaradas explicitamente — ATENDE
- Ausência de decisões pendentes para o implementador — ATENDE
