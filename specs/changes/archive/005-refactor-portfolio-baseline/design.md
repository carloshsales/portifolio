# Design Técnico — Baseline do portfólio

**Change:** `005-refactor-portfolio-baseline`
**Status:** APPROVED
**Base:** `proposal.md`

## 1. Objetivo

Definir como a limpeza do repositório, a automatização de acessibilidade e responsividade, o CI e a organização do conteúdo são implementados, sem quebrar o que já funciona.

## 2. Princípios

1. **Revalidar antes de reescrever.** As tasks reexecutadas verificam o código existente e só alteram o que reprovar.
2. **Sem placeholder em produção.** A ausência de dado é representada por estado vazio, nunca por texto fictício.
3. **Automação primeiro, verificação manual complementar.** Critérios automatizáveis passam a ser testes; o que não é automatizável fica declarado como manual.
4. **Testar o artefacto, não só o código-fonte.** O teste responsivo corre sobre o build de produção.
5. **Hooks locais e CI são complementares.** Nenhum é removido.
6. **Histórico preservado.** Nada é apagado; especificações mortas são arquivadas.
7. **Deploy agnóstico.** Nenhum ficheiro de configuração assume um fornecedor.

## 3. Layout resultante

```text
src/
├── content/                  # conteúdo do utilizador (fonte dos dados)
│   ├── profile.ts
│   ├── projects.ts
│   └── skills.ts
├── data/                     # ponto de importação estável
│   ├── profile.ts
│   ├── projects.ts
│   └── skills.ts
├── components/
├── sections/
└── test/
    ├── setup.ts
    └── accessibility.test.tsx

e2e/
├── responsive.spec.ts
└── playwright.config.ts

.github/
└── workflows/
    └── ci.yml

docs/
├── history.md
├── rawspec-v2.md
├── decisions/
└── deployment.md             # requisitos e candidatos, sem escolha

specs/
├── changes/
│   ├── 001-portfolio-mvp/
│   └── 005-refactor-portfolio-baseline/
│       ├── proposal.md
│       ├── design.md
│       └── tasks/
└── archive/
```

## 4. Modelo de dados do conteúdo

### 4.1 `src/content/`

Ficheiros que contêm exclusivamente o conteúdo do utilizador:

```ts
// src/content/profile.ts
export const profile: Profile = {
  name: '',
  role: '',
  summary: '',
  photoUrl: '/images/foto-perfil.jpg',
  location: '',
  social: [],
}
```

```ts
// src/content/projects.ts
export const projects: Project[] = []
```

```ts
// src/content/skills.ts
export const skillGroups: SkillGroup[] = []
```

### 4.2 `src/data/`

Camada fina de compatibilidade e de normalização:

```ts
// src/data/profile.ts
import { profile as content } from '../content/profile'
import type { Profile } from '../types'

export const profile: Profile = {
  ...content,
  social: content.social.filter((link) => link.url.trim() !== ''),
}
```

Regras:

- `src/data/` exporta exatamente os mesmos nomes usados hoje: `profile`, `projects`, `skillGroups`.
- Nenhum componente é alterado.
- A filtragem remove entradas com `url` vazia, para que o contacto nunca renderize um link inválido.
- `projects` e `skillGroups` vazios são suportados: as secções já renderizam estado vazio.

### 4.3 Estados vazios

| Secção | Estado vazio |
|---|---|
| Início | Mantém o cabeçalho com o nome e a foto; a área de texto e as ações ficam ocultas quando vazias. |
| Projetos | "Ainda não há projetos para apresentar." |
| Habilidades | "Ainda não há habilidades para apresentar." |
| Contacto | "Ainda não há canais de contato para apresentar." |

A ação "Ver projetos" só é renderizada quando existe pelo menos um projeto.

## 5. Comportamento

### 5.1 Teste de acessibilidade

```ts
// src/test/accessibility.test.tsx
import { render } from '@testing-library/react'
import { axe } from 'vitest-axe'
import { describe, expect, it } from 'vitest'
import App from '../App'

describe('acessibilidade', () => {
  it('não apresenta violações automáticas', async () => {
    const { container } = render(<App />)
    const results = await axe(container)

    expect(results.violations).toEqual([])
  })
})
```

Regras:

- O teste usa `axe-core` através de `vitest-axe`, que devolve erros no console quando há violação.
- Não se usa `disableOtherRules`; a lista de regras é a padrão.
- Falha uma violação: o `pnpm test` fica vermelho.
- O que não é coberto fica registado na evidência da task como verificação manual.

### 5.2 Testes responsivos

Configuração:

```ts
// e2e/playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'mobile', use: { ...devices['Desktop Chrome'], viewport: { width: 375, height: 812 } } },
    { name: 'tablet', use: { ...devices['Desktop Chrome'], viewport: { width: 768, height: 1024 } } },
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
  ],
  webServer: {
    command: 'pnpm preview --host 127.0.0.1 --port 4173',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
  },
})
```

Verificações por viewport:

```ts
// e2e/responsive.spec.ts
import { expect, test } from '@playwright/test'

test('não tem overflow horizontal', async ({ page }) => {
  await page.goto('/')
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  expect(overflow).toBeLessThanOrEqual(0)
})

test('mostra a navegação principal', async ({ page }) => {
  await page.goto('/')
  for (const id of ['inicio', 'projetos', 'habilidades', 'contato']) {
    await expect(page.locator(`a[href="#${id}"]`)).toBeVisible()
  }
})
```

Regras:

- O teste corre contra `pnpm preview`, ou seja, o build de produção.
- Não há dependência de rede externa.
- As animações são desativadas no contexto de teste para eliminar instabilidade.
- O script `test:e2e` é separado de `test`; o `pre-push` mantém o conjunto unitário rápido.

### 5.3 CI

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: ['**']
  pull_request:

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 12
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm test
      - run: pnpm build
      - run: pnpm exec playwright install --with-deps chromium
      - run: pnpm test:e2e
```

Regras:

- O workflow corre em push e pull request.
- A versão do pnpm e do Node está fixada.
- Os hooks do Husky são acionados pelos comandos locais, não pelo CI; o CI executa os mesmos scripts.

### 5.4 Scripts de package.json

```json
{
  "scripts": {
    "test": "vitest run",
    "test:e2e": "playwright test --config e2e/playwright.config.ts",
    "test:all": "pnpm test && pnpm test:e2e"
  }
}
```

### 5.5 Limpeza

| Alvo | Ação |
|---|---|
| `docs/rawspec-commands.md` | Remover. Substituído por `docs/rawspec-v2.md`. |
| `specs/changes/002-rawspec-task-commands/` | Arquivar em `specs/changes/archive/002-rawspec-task-commands/`. |
| `specs/specifications/{engineering,portfolio,security}/` | Remover os diretórios vazios. |
| `specs/changes/001-portfolio-mvp/tasks/archive/` | Esvaziar, com as quatro tasks reabertas na pasta ativa. |

A change 002 é arquivada com `Status: ARCHIVED`, `- Arquivada em:` e `Staging Git: DONE`, preservando integralmente o conteúdo das duas tarefas concluídas.

### 5.6 Publicação agnóstica

`docs/deployment.md` descreve:

- requisitos: Node 22, pnpm, `pnpm build`, output em `dist/`, SPA fallback para `index.html`, cache longo para assets com hash;
- candidatos: GitHub Pages, Vercel, Netlify, Cloudflare Pages, Object Storage + CDN, com custo, complexidade e limitações;
- sequência de decisão: escolher o destino, configurar o CI para publicar, confirmar domínio e cache.

Nenhum `vercel.json`, `netlify.toml` ou equivalente é criado agora.

## 6. Contratos e erros

| Situação | Comportamento |
|---|---|
| `axe` deteta violação | `pnpm test` falha com o detalhe da regra violada. |
| Overflow horizontal detetado | `pnpm test:e2e` falha com o valor da diferença em píxeis. |
| Link de navegação oculto | `pnpm test:e2e` falha. |
| `src/content/` sem dados | A aplicação renderiza estados vazios; nenhum erro. |
| Playwright sem browser instalado | `pnpm test:e2e` falha com instrução de `playwright install`. |
| Perfis de cor diferentes | O teste usa seletores por papel e por `href`, sem depender de cor. |

## 7. Testes

| Tipo | Ferramenta | Âmbito |
|---|---|---|
| Unitário e componente | Vitest + Testing Library | Comportamento das secções e estados vazios. |
| Acessibilidade | `vitest-axe` | Violações automáticas em toda a aplicação. |
| Responsivo | Playwright | Três viewports, artefacto de produção. |
| Qualidade | ESLint, `tsc --noEmit`, Prettier | Estático e formatação. |

Ambiente: jsdom para o unitário, Chromium para o e2e.

## 8. Critérios de aceite

- `docs/rawspec-commands.md` removido; `docs/rawspec-v2.md` é a referência única.
- Change 002 arquivada; `specs/specifications/` sem diretórios vazios.
- As doze tasks da change 001 com estado coerente com o código.
- Teste de acessibilidade em `pnpm test`, com falha comprovada por violação introduzida.
- Testes Playwright a passar nos três viewports.
- Workflow de CI presente com as seis etapas.
- Conteúdo em `src/content/`, `src/data/` como ponto de importação, sem placeholders renderizados.
- `docs/deployment.md` presente e sem escolha de fornecedor.
- `pnpm lint`, `pnpm typecheck`, `pnpm test` e `pnpm build` a passar.
