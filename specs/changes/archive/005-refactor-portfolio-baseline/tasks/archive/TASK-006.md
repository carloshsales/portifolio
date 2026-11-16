# TASK-006 — Documentar a publicação sem fixar o destino

- Change: 005-refactor-portfolio-baseline
- Status: ARCHIVED
- Depende de: TASK-001
- Início: 2026-11-16
- Verificação: VERIFIED (2026-11-16) — docs/deployment.md criado com 8 secoes (o que e publicado, requisitos do alojamento, 5 candidatos com custo/complexidade/limitacoes, criterios de decisao, sequencia de publicacao, pontos de atencao, checklist de verificacao, decisoes relacionadas); README.md atualizado com referencia ao documento e nova seccao Publicacao com pnpm build, pnpm preview e pnpm test:e2e; todos os factos documentados verificados contra o repositorio: comando de build tsc --noEmit && vite build, output dist/, node >=22.0.0, pnpm@12.18.0, sem base no vite.config.ts, sem router (apenas ancoras href='#'), assets com hash index-<hash>.js e index-<hash>.css, Google Fonts com 2 preconnect, foto-perfil.png 1808 kB e foto-perfil.jpg 64 kB; nenhum ficheiro de configuracao de fornecedor criado (verificado para vercel.json, netlify.toml, .nojekyll, _headers, _redirects, wrangler.toml, firebase.json - todos ausentes); pnpm lint, pnpm format:check, pnpm typecheck, pnpm test (134 passando, 1 pulado) e pnpm build aprovados
- Evidência: docs/deployment.md criado com 8 secoes (o que e publicado, requisitos do alojamento, 5 candidatos com custo/complexidade/limitacoes, criterios de decisao, sequencia de publicacao, pontos de atencao, checklist de verificacao, decisoes relacionadas); README.md atualizado com referencia ao documento e nova seccao Publicacao com pnpm build, pnpm preview e pnpm test:e2e; todos os factos documentados verificados contra o repositorio: comando de build tsc --noEmit && vite build, output dist/, node >=22.0.0, pnpm@12.18.0, sem base no vite.config.ts, sem router (apenas ancoras href='#'), assets com hash index-<hash>.js e index-<hash>.css, Google Fonts com 2 preconnect, foto-perfil.png 1808 kB e foto-perfil.jpg 64 kB; nenhum ficheiro de configuracao de fornecedor criado (verificado para vercel.json, netlify.toml, .nojekyll, _headers, _redirects, wrangler.toml, firebase.json - todos ausentes); pnpm lint, pnpm format:check, pnpm typecheck, pnpm test (134 passando, 1 pulado) e pnpm build aprovados
- Plano de ação: none
- Arquivada em: 2026-11-16

## Objetivo

Escrever a documentação de publicação de forma agnóstica ao destino, para que a escolha do deploy possa ser feita depois com base em requisitos concretos e candidatos comparáveis.

## Arquivos

- `docs/deployment.md` (criação)
- `README.md` (atualização da secção de documentação)

## Entregáveis

- `docs/deployment.md` com as secções: requisitos do build, requisitos do alojamento, candidatos de destino, critérios de decisão e sequência de publicação.
- Requisitos: Node 22, pnpm, `pnpm build`, output em `dist/`, SPA fallback para `index.html`, cache longo para assets com hash, HTTPS.
- Candidatos com custo, complexidade, limitações e adequação ao projeto: GitHub Pages, Vercel, Netlify, Cloudflare Pages, Object Storage com CDN.
- Critérios de decisão explícitos: custo, domínio próprio, tempo de configuração, latência e controlo do pipeline.
- Sequência de publicação passo a passo, válida para qualquer um dos candidatos.
- Referência ao ficheiro `docs/deployment.md` no `README.md`.

## Regras

- Nenhum fornecedor é escolhido.
- Nenhum ficheiro de configuração específico de fornecedor é criado (`vercel.json`, `netlify.toml`, `_headers`, `.nojekyll` ou equivalentes).
- A documentação descreve o estado atual do repositório sem inventar capacidades.
- Não repetir o conteúdo do `README.md`; o README apenas aponta para o documento.

## Testes

- Conferência manual: cada requisito listado é verificável no repositório atual.
- `pnpm format:check` passa sobre o novo ficheiro Markdown.
- `pnpm build` confirma que o diretório de output é `dist/` e que `dist/index.html` existe.

## Aceitação

`docs/deployment.md` existe com todas as secções, não escolhe fornecedor, não há ficheiro de configuração de fornecedor no repositório e o README referencia o documento.

## Checklist de clareza

- Objetivo único e verificável — ATENDE
- Arquivos afetados — ATENDE
- Entregáveis concretos — ATENDE
- Contrato de entrada, saída e erros — NÃO SE APLICA (tarefa documental: não expõe interface; a entrada é o estado atual do repositório e a saída é o ficheiro `docs/deployment.md`)
- Testes obrigatórios — ATENDE
- Critério de aceitação objetivo — ATENDE
- Dependências declaradas explicitamente — ATENDE
- Ausência de decisões pendentes para o implementador — ATENDE
