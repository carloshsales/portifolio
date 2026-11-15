# Design system

## Cores aprovadas

| Token | Valor | Uso |
|---|---|---|
| `--color-bg` | `#171717` | Fundo grafite |
| `--color-surface` | `#222222` | Superfícies |
| `--color-accent` | `#FF922B` | Destaque âmbar |
| `--color-text` | `#F5F5F5` | Texto principal |
| `--color-text-muted` | `#B8B8B8` | Texto secundário |
| `--color-on-accent` | `#171717` | Texto sobre o destaque |

## Tipografia

| Fonte | Uso |
|---|---|
| Manrope | Títulos |
| Inter | Textos |
| JetBrains Mono | Detalhes técnicos |

## Tokens disponíveis

Definidos em `src/styles/tokens.css`:

- Cores, tipografia, pesos e tamanhos de texto.
- Espaçamentos em múltiplos de 4px.
- Breakpoints de referência: 640, 768, 1024 e 1280px.
- Foco acessível: `--focus-ring-width` e `--focus-ring-offset`.

## Regras de interface

- Identidade escura, minimalista e profissional.
- Navegação lateral em desktop, adaptada para mobile.
- Animações discretas, transições suaves e microinterações.
- Foco visível em todos os elementos interativos.
- Respeitar `prefers-reduced-motion`.
- HTML semântico e hierarquia correta de títulos.
- Contraste adequado (WCAG 2.2 AA).
