# Publicação

Como publicar este portfólio. Este documento **não escolhe** o destino: descreve os requisitos que qualquer alojamento tem de satisfazer, compara os candidatos e explica como decidir. A escolha final fica para quando o destino for definido.

## 1. O que é publicado

O projeto é uma aplicação frontend estática, sem backend, sem base de dados e sem autenticação.

| Aspeto | Valor |
|---|---|
| Build | `pnpm build` |
| Comando | `tsc --noEmit && vite build` |
| Diretório de output | `dist/` |
| Resultado | `dist/index.html` e `dist/assets/` |
| Requer Node | 22 ou superior |
| Requer pnpm | 12 (fixado em `package.json` pelo campo `packageManager`) |
| Assets com hash | Sim: `index-<hash>.js`, `index-<hash>.css` |
| Rotas | Sete rotas com URL próprio, sem `#`: `/`, `/projetos`, `/habilidades`, `/contato`, `/jogos`, `/artigos` e `/experimentos`. Router: TanStack Router, com as rotas definidas por código. |
| SPA fallback | **Necessário.** As rotas são resolvidas no cliente, pelo que `/projetos` não corresponde a nenhum ficheiro em `dist/`. Sem reescrita para `index.html`, um carregamento directo ou um recarregamento dessa rota devolve 404. |

Conteúdo gerado:

```text
dist/
├── index.html                 0,7 kB
├── assets/
│   ├── index-<hash>.js        ~223 kB
│   └── index-<hash>.css       ~8,5 kB
└── images/
    ├── foto-perfil.jpg        64 kB
    └── foto-perfil.png        1,8 MB   ← ver secção 6
```

## 2. Requisitos do alojamento

Qualquer destino tem de satisfazer estes cinco requisitos:

1. **Servir `dist/`** como raiz do site, incluindo `index.html` na raiz.
2. **HTTPS** com certificado válido e redireccionamento de HTTP.
3. **SPA fallback obrigatório.** Um pedido a uma rota que não corresponde a um ficheiro em `dist/`, como `/projetos`, tem de ser respondido com o conteúdo de `index.html`. Sem essa reescrita, um carregamento directo ou um recarregamento da página devolve 404, e o visitante vê um erro em vez do portfólio. A navegação por clique não depende do servidor, porque é feita no cliente.
4. **Cache longo para `assets/`**, com `Cache-Control: public, max-age=31536000, immutable`. Os nomes dos ficheiros incluem hash, por isso o conteúdo nunca muda sob o mesmo nome.
5. **Cache curto para `index.html`**, para que uma publicação nova sejadetectada rapidamente. Um valor de `no-cache` ou `max-age=0` é adequado.

## 3. Candidatos

| Destino | Custo | Complexidade | Limitações relevantes |
|---|---|---|---|
| **GitHub Pages** | Grátis | Baixa | Servido de `/<repo>` por omissão; exige `base` configurado no Vite e um ficheiro `.nojekyll`. Latência pior na Europa. Deploy pelo workflow `pages-build-deployment`, já ativo neste repositório. |
| **Vercel** | Grátis (limite de uso) | Muito baixa | Detecta Vite automaticamente. Preview de pull requests incluído. Limite de funções serverless, irrelevante aqui. |
| **Netlify** | Grátis (limite de uso) | Muito baixa | Detecta Vite automaticamente. Formulários e Functions, irrelevantes aqui. |
| **Cloudflare Pages** | Grátis (limite de uso) | Baixa | CDN global, latência muito baixa na Europa. Projeto sem servidor, pelo que não é necessário plano pago. |
| **Object Storage + CDN** | Variável | Média | Requer bucket, política de CORS e configuração de CDN à mão. Dá controlo total, ao custo de mais trabalho. |

### Como comparar

| Critério | Peso prático |
|---|---|
| **Custo** | Todos os candidatos têm um plano gratuito suficiente para um portfólio pessoal. O custo só deixa de ser zero se o tráfego crescer muito. |
| **Domínio próprio** | GitHub Pages exige um repositório público para o domínio personalizado. Vercel, Netlify e Cloudflare Pages aceitam domínio próprio em qualquer plano. |
| **Tempo de configuração** | Vercel e Netlify: minutos. Cloudflare Pages: minutos. GitHub Pages: minutos, mais a configuração do `base`. Object Storage: horas. |
| **Latência** | Cloudflare Pages tem a melhor rede. GitHub Pages é a mais lenta das opções gratuitas. Para um portfólio pessoal, a diferença raramente é notada. |
| **Controlo do pipeline** | GitHub Pages integra-se no workflow que já existe. As restantes exigem um passo de deploy adicional no CI. |

## 4. Critérios de decisão

Perguntas a responder, por esta ordem:

1. **Preciso de domínio próprio?** Se sim, GitHub Pages exige repositório público; as restantes não.
2. **Quero o deploy no workflow que já existe?** Se sim, GitHub Pages é o caminho mais curto.
3. **Qual a latência que aceito?** Se a prioridade for o carregamento na Europa, Cloudflare Pages.
4. **Quanto tempo quero dedicar à configuração?** Se for pouco, Vercel ou Netlify, que detectam Vite sozinhos.
5. **Vou precisar de servidor no futuro?** Se a resposta mudar, o candidato que já terá plano pago é o Object Storage.

## 5. Sequência de publicação

Válida para qualquer um dos candidatos. Os passos 2 a 5 são comuns a todos.

1. **Decidir o destino** usando os critérios da secção 4.
2. **Gerar o build** e confirmar o artefacto:
   ```bash
   pnpm install --frozen-lockfile
   pnpm build
   ```
   Verificar que `dist/index.html` e `dist/assets/` existem.
3. **Publicar o conteúdo de `dist/`** para o destino escolhido.
4. **Confirmar em produção:**
   - a página carrega sem erros no console;
   - a navegação por âncoras funciona;
   - a fotografia e as fontes carregam;
   - os links de contacto funcionam.
5. **Verificar a cache:** `curl -I <url>` deve devolver `Cache-Control: immutable` para `assets/` e `no-cache` para `index.html`.
6. **Configurar o domínio**, se aplicável, e confirmar o certificado HTTPS.

### Configuração específica por destino

Cada destino pode exigir um ajuste adicional. **Nenhum deles está aplicado neste repositório**, porque a escolha ainda não foi feita.

| Destino | Ajuste tipicamente necessário |
|---|---|
| GitHub Pages | Definir `base` no `vite.config.ts` conforme o caminho do repositório, e criar `.nojekyll` em `public/`. |
| Vercel | Nenhum ficheiro de configuração é necessário. Pode ser adicionado `vercel.json` se houver requisitos de headers. |
| Netlify | Nenhum ficheiro de configuração é necessário. Pode ser adicionado `netlify.toml` para headers e redirects. |
| Cloudflare Pages | Nenhum ficheiro de configuração é necessário. Definir o comando de build e o directório `dist` no painel. |
| Object Storage + CDN | Configurar bucket, política de CORS, regras de cache e invalidação de cache à mão. |

## 6. Pontos de atenção

### Imagem de perfil demasiado pesada

`public/images/foto-perfil.png` tem **1,8 MB** e é servida tal como está. A aplicação usa o ficheiro `.jpg` (64 kB), mas o `.png` continua no output e é transferido por quem o pedir directamente.

Antes de publicar, resolver:

- comprimir o `.png` ou removê-lo, se não for necessário; ou
- convertê-lo para `.webp`, com compressão muito superior.

### Fontes carregadas de origem externa

As três famílias tipográficas vêm do Google Fonts por `<link>` em `index.html`, com `preconnect` configurado. Isto significa:

- dependência de rede externa no carregamento inicial;
- os textos aparecem com a fonte de sistema até o ficheiro chegar.

É uma escolha consciente e comum, mas convém confirmar que corresponde à identidade visual aprovada.

### Sem `base` configurado

O `vite.config.ts` não define `base`, pelo que o build assume que está na raiz do domínio. Publicar num subdomínio ou subdirectório exige ajustar este valor.

## 7. Verificação

Antes de considerar a publicação concluída:

- [ ] `pnpm build` termina sem erros
- [ ] `dist/index.html` existe
- [ ] A página abre em produção sem erros no console
- [ ] A navegação por âncoras percorre as quatro secções
- [ ] A fotografia carrega
- [ ] Os links de contacto abrem
- [ ] `Cache-Control` está definido correctamente para `assets/` e `index.html`
- [ ] O certificado HTTPS é válido
- [ ] O workflow de CI continua verde

## 8. Decisões relacionadas

- `docs/rawspec-v2.md` — formato das especificações e comandos do RawSpec v2.
- `docs/history.md` — histórico de decisões, eventos e detalhes.
- ADR-005 — branch por tarefa e commit/push automáticos.
- ADR-006 — reposicionamento do `main` sobre a linha de trabalho real.
