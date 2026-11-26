# TASK-010 — Revisar responsividade e performance

- Change: 001-portfolio-mvp
- Status: COMPLETED
- Depende de: TASK-005, TASK-006, TASK-007, TASK-008
- Início: 2026-11-26
- Verificação: VERIFIED (2026-11-26) — pnpm test exit 0 - 6 ficheiros, 371 passed, 1 skipped (372). pnpm test:e2e exit 0 - 78 passed, 3 skipped (81), viewports mobile/tablet/desktop; os 3 skips sao intencionais (barra inferior so existe abaixo de 1024px). dist/ total_kb 298.50 (< 400) e max_kb 224.86 (< 250), antes 2106.70 e 1807.43. Nenhuma imagem em public/images/ excede 150 kB. foto-perfil.png (1851800 bytes) removido; so restam referencias a foto-perfil.jpg. Teste negativo de overflow comprovado: body{width:2000px} em src/styles/globals.css fez o e2e falhar em mobile (1625), tablet (1232) e desktop; ficheiro revertido e confirmado por git status. Revisores A e B aprovaram.
- Evidência: pnpm test exit 0 - 6 ficheiros, 371 passed, 1 skipped (372). pnpm test:e2e exit 0 - 78 passed, 3 skipped (81), viewports mobile/tablet/desktop; os 3 skips sao intencionais (barra inferior so existe abaixo de 1024px). dist/ total_kb 298.50 (< 400) e max_kb 224.86 (< 250), antes 2106.70 e 1807.43. Nenhuma imagem em public/images/ excede 150 kB. foto-perfil.png (1851800 bytes) removido; so restam referencias a foto-perfil.jpg. Teste negativo de overflow comprovado: body{width:2000px} em src/styles/globals.css fez o e2e falhar em mobile (1625), tablet (1232) e desktop; ficheiro revertido e confirmado por git status. Revisores A e B aprovaram.
- Plano de ação: none

## Objetivo

Confirmar e corrigir o comportamento responsivo e o desempenho da aplicação nos três viewports previstos, usando a automação já existente como base, e eliminar o peso morto de `dist/` identificado por medição.

## Contexto

A aplicação já responde nos três viewports e a suíte `e2e/responsive.spec.ts` já cobre overflow horizontal, navegação, foco, skip link, `aria-current`, a fotografia e a barra inferior. A revisão não é, por isso, de construção.

A medição do build de produção revelou um problema concreto e não documentado: o artefacto de produção tem **2 106,7 kB**, dos quais **1 851 800 bytes (86 %)** correspondem a um único ficheiro, `public/images/foto-perfil.png`. Esse ficheiro tem 1254 × 1254 px, é anterior à fotografia actualmente em uso e **não é referenciado por nenhum ficheiro em `src/`**. A fotografia em uso, `public/images/foto-perfil.jpg`, tem 800 × 800 px e 65 555 bytes, e cumpre por si só os requisitos de `docs/conteudo-real.md`, secção 6.

O mesmo ficheiro responde também ao peso da imagem em ecrã, que é um dos objectivos visuais da aplicação.

## Arquivos

- `e2e/responsive.spec.ts` (revisão e eventual ampliação)
- `e2e/playwright.config.ts` (revisão)
- `src/styles/` (revisão)
- `src/components/` (correções de layout, se necessárias)
- `src/sections/` (correções de layout, se necessárias)
- `public/images/` (otimização de imagens)
- `scripts/rawspec-v2.mjs` (correcção do staging de ficheiros removidos, se a verificação o confirmar)
- `scripts/rawspec-v2.test.mjs` (teste que cobre a correcção anterior)

## Entregáveis

- Os testes responsivos automatizados cobrem celular, tablet e desktop, através dos três projects de `e2e/playwright.config.ts`.
- Não existe overflow horizontal em nenhum viewport, verificado pelo teste automatizado.
- A navegação é utilizável em ecrãs pequenos, com alvos de toque de pelo menos 44 × 44 px, verificado por asserção sobre o tamanho renderizado.
- `public/images/foto-perfil.png` deixa de existir, por remoção. A remoção é a via preferida: o ficheiro não é referenciado por `src/`, e a fotografia em uso, `public/images/foto-perfil.jpg`, já cumpre os requisitos de `docs/conteudo-real.md`, secção 6. Nenhuma referência a `.png` fica em `src/`.
- O peso total de `dist/` fica abaixo de **400 kB**, medido por soma do tamanho de todos os ficheiros de `dist/` após `pnpm build`.
- O ficheiro mais pesado de `dist/` fica abaixo de **250 kB**.
- Nenhum ficheiro de imagem em `public/images/` excede **150 kB**, e todos os que são referenciados por `photoUrl` cumprem `docs/conteudo-real.md`, secção 6: quadrados, entre 400 e 800 px de lado, em `.webp` ou `.jpg`.
- As fontes continuam carregadas do Google Fonts, com os dois `preconnect` já configurados e `display=swap`.
- `package.json` mantém apenas `react` e `react-dom` em `dependencies`, sem qualquer dependência de runtime adicionada.

## Regras

- A verificação de overflow é feita pelo teste automatizado, não apenas por inspeção visual.
- A optimização da fotografia segue os requisitos de `docs/conteudo-real.md`, secção 6: quadrada, abaixo de 150 kB, `.webp` ou `.jpg`.
- O `public/images/foto-perfil.png` de 1,8 MB é comprimido ou removido.
- As fontes continuam a ser carregadas do Google Fonts, com `preconnect` já configurado.
- Nenhuma dependência de runtime é adicionada.
- O `pre-push` mantém o conjunto rápido; o `test:e2e` continua separado.
- Os limiares desta task são valores-limite superiores, verificados por medição. O valor registado na evidência é o medido, e o valor-limite é o declarado acima.
- Cada bullet da secção `## Arquivos` declara exactamente um caminho entre crases. O parser de âmbito de `scripts/rawspec-v2.mjs` extrai apenas o primeiro caminho de cada bullet, pelo que dois caminhos no mesmo bullet produziriam um âmbito menor do que o declarado.

## Testes

- `pnpm lint`, `pnpm typecheck` e `pnpm test` passam.
- `pnpm build` gera o artefacto de produção.
- `pnpm test:e2e` passa nos três viewports.
- Teste negativo de overflow comprovado: introduzir uma largura fixa de 2000 px no ficheiro `src/styles/globals.css`, que está no âmbito declarado, confirmar que `pnpm test:e2e` falha com o valor medido, e reverter o ficheiro ao estado exacto anterior. A reversão é verificada com `git status --porcelain`, que tem de não reportar `src/styles/globals.css` antes da implementação.
- Peso de `dist/` medido por comando, com o resultado registado na evidência:
  ```bash
  pnpm build && node -e "const fs=require('fs'),p=require('path');const w=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?w(p.join(d,e.name)):[p.join(d,e.name)]);const f=w('dist');const t=f.reduce((a,x)=>a+fs.statSync(x).size,0);const m=Math.max(...f.map(x=>fs.statSync(x).size));console.log('total_kb',(t/1024).toFixed(2),'max_kb',(m/1024).toFixed(2))"
  ```
  O resultado tem de satisfazer `total_kb` abaixo de 400 e `max_kb` abaixo de 250.
- Ausência de imagens pesadas verificada por comando, com o resultado registado na evidência:
  ```bash
  node -e "const fs=require('fs');for(const f of fs.readdirSync('public/images')){const s=fs.statSync('public/images/'+f).size;if(s>153600)console.log(f,s)}"
  ```
  O comando não produz qualquer linha.
- Referências à fotografia verificadas por comando, com o resultado registado na evidência:
  ```bash
  grep -rn "foto-perfil" src/ index.html
  ```
  Nenhuma linha refere `foto-perfil.png`.

## Aceitação

A aplicação não tem overflow horizontal em nenhum dos três viewports, verificado pelo teste automatizado; a navegação tem alvos de toque de pelo menos 44 × 44 px em ecrãs pequenos; o peso total de `dist/` é inferior a 400 kB e o ficheiro mais pesado é inferior a 250 kB, ambos medidos pelo comando indicado; nenhum ficheiro de `public/images/` excede 150 kB; e `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` e `pnpm test:e2e` passam.

## Exclusões e riscos

- Não são tocados `src/content/`, `src/data/`, `package.json`, `index.html`, `.husky/` nem os ficheiros de configuração de `e2e/`, salvo se uma correcção de layout o exigir de forma inequívoca, e nesse caso a alteração tem de ser justificada na evidência.
- Os ficheiros de `docs/` não são tocados. As referências narrativas a `foto-perfil.png` em `docs/conteudo-real.md` e `docs/deployment.md` ficam desactualizadas por esta task e são corrigidas numa task própria.
- A revisão de `e2e/responsive.spec.ts` é aditiva. Não se reescrevem os testes existentes sobre navegação, foco, `aria-current`, skip link ou `IntersectionObserver`, que pertencem a outras tasks.
- Risco: `foto-perfil.png` pode estar referenciado fora de `src/`, por exemplo em documentação ou no histórico do Git. A remoção só é segura depois de verificado, pelo comando indicado, que nenhuma referência activa aponta para `.png`. A referência em `docs/conteudo-real.md` e `docs/deployment.md` é narrativa e não é alterada por esta task.
- Risco: o teste negativo de overflow deixa o repositório sujo se a execução for interrompida entre a alteração e a reversão. A reverão é obrigatória e tem de ser confirmada por `git status --porcelain` antes do commit.
- Risco: `src/sections/` e `src/components/` são directórios com CSS Modules. Qualquer correcção de layout tem de respeitar os tokens de `src/styles/tokens.css` e não pode introduzir larguras fixas superiores à largura do viewport.
- Risco: o `commit-task` prepara cada ficheiro do âmbito com `git add -- <ficheiro>`, que falha quando o ficheiro já foi removido do disco. Esta é a primeira task que remove um ficheiro, e o defeito não tinha aparecido antes. A correcção, se a verificação o confirmar, tem de ser testada em `scripts/rawspec-v2.test.mjs` e não pode alterar o comportamento das restantes tasks já verificadas.

## Checklist de clareza

- Objetivo único e verificável — ATENDE
- Arquivos afetados — ATENDE
- Entregáveis concretos — ATENDE
- Contrato de entrada, saída e erros — ATENDE (entrada: o build de produção servido em `http://127.0.0.1:4173`; saída: resultado por viewport e medição de peso; erros: overflow, alvo de toque insuficiente ou limiar excedido faz o teste falhar com o valor medido)
- Testes obrigatórios — ATENDE
- Critério de aceitação objetivo — ATENDE
- Dependências declaradas explicitamente — ATENDE
- Ausência de decisões pendentes para o implementador — ATENDE
