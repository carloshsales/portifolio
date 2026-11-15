# Design Técnico — Portfólio Profissional

**Change:** `001-portfolio-mvp`  
**Status:** APPROVED  
**Aprovação:** 2026-11-12  
**Arquitetura aprovada:** React + TypeScript + Vite

## 1. Objetivo

Definir a arquitetura técnica do MVP do portfólio, priorizando simplicidade, manutenção, acessibilidade, desempenho e qualidade.

## 2. Stack tecnológica

| Tecnologia | Finalidade |
|---|---|
| React | Construção da interface |
| TypeScript | Tipagem estática |
| Vite | Build e servidor de desenvolvimento |
| CSS Modules | Estilização modular |
| Vitest | Testes unitários |
| Testing Library | Testes de componentes |
| ESLint | Análise estática e padronização |
| Husky | Automação de verificações Git |

TypeScript será configurado com modo estrito (`strict: true`).

## 3. Arquitetura da aplicação

Aplicação frontend estática, sem backend, banco de dados ou autenticação.

Os conteúdos serão mantidos em arquivos locais versionados no Git.

### Estrutura proposta

```text
portfolio/
├── public/
│   ├── images/
│   └── favicon.svg
├── src/
│   ├── assets/
│   ├── components/
│   ├── sections/
│   │   ├── Home/
│   │   ├── Projects/
│   │   ├── Skills/
│   │   └── Contact/
│   ├── data/
│   ├── styles/
│   ├── types/
│   ├── App.tsx
│   └── main.tsx
├── specs/
├── docs/
├── .husky/
│   ├── pre-commit
│   └── pre-push
└── package.json
```

## 4. Organização dos componentes

- `App`: composição geral da página.
- `Sidebar`: navegação principal e apresentação pessoal.
- `Home`: apresentação profissional.
- `Projects`: exposição dos projetos.
- `Skills`: tecnologias e competências.
- `Contact`: canais de contato.
- `components`: elementos reutilizáveis, como botões, links e cartões.

A componentização deve seguir a necessidade real. Evitar componentes genéricos sem benefício concreto.

## 5. Conteúdo

Os dados serão separados da apresentação visual.

- Projetos: `src/data/projects.ts`
- Habilidades: `src/data/skills.ts`
- Informações pessoais e links: `src/data/profile.ts`

Não inventar projetos, experiências, qualificações ou informações profissionais. Não exibir histórico de empresas anteriores.

## 6. Interface e identidade visual

Direção visual aprovada:

- Fundo grafite: `#171717`
- Superfícies: `#222222`
- Destaque âmbar: `#FF922B`
- Texto principal: `#F5F5F5`
- Texto secundário: `#B8B8B8`

Tipografia:
- Manrope: títulos.
- Nunito Sans: textos.
- JetBrains Mono: detalhes técnicos.

Layout com sidebar fixa em telas maiores e navegação adaptada para dispositivos móveis.

A interface deve utilizar animações discretas, transições suaves e microinterações, sem comprometer desempenho ou acessibilidade.

## 7. Responsividade

Estratégia mobile-first.

A interface deverá funcionar em:
- Celulares.
- Tablets.
- Desktops.

Não permitir overflow horizontal indesejado. Adaptar navegação, espaçamentos, imagens e disposição das seções conforme a largura disponível.

## 8. Acessibilidade

Adotar WCAG 2.2 AA como referência.

Requisitos:
- HTML semântico.
- Navegação por teclado.
- Foco visível.
- Contraste adequado.
- Textos alternativos para imagens relevantes.
- Hierarquia correta de títulos.
- Compatibilidade com leitores de tela.
- Respeito a `prefers-reduced-motion`.

## 9. Estratégia de qualidade

Ferramentas e práticas:

- TypeScript Strict.
- ESLint.
- Vitest e Testing Library.
- Husky para execução automática de verificações nos eventos Git.

### 9.1 Pre-commit

Executar verificações rápidas antes de permitir um commit:

- ESLint nos arquivos alterados.
- Formatação dos arquivos alterados, caso seja adotada uma ferramenta de formatação.
- Impedir o commit quando alguma verificação obrigatória falhar.

### 9.2 Pre-push

Executar verificações mais completas antes de enviar alterações ao repositório:

- Verificação de tipos TypeScript.
- Execução da suíte de testes automatizados.
- Build de produção.

Impedir o push quando alguma dessas verificações falhar.

### 9.3 Princípios

- Os hooks devem utilizar scripts definidos no `package.json`, evitando duplicação de comandos.
- As verificações devem funcionar também quando executadas manualmente.
- Não utilizar `--no-verify` como prática normal para contornar verificações.
- Os hooks locais complementam, mas não substituem, as verificações de CI.
- A revisão de IA não deve ser a única garantia de qualidade.

## 10. Performance

- Otimizar imagens.
- Evitar dependências desnecessárias.
- Evitar JavaScript desnecessário.
- Utilizar carregamento eficiente de recursos.
- Manter a aplicação estática e simples de hospedar.

## 11. Restrições arquiteturais

Não implementar nesta versão:
- Backend ou API.
- Banco de dados.
- Autenticação.
- Painel administrativo.
- CRUD de projetos.
- Cadastro de usuários.
- Orquestração avançada de agentes.

Qualquer ampliação de escopo exige aprovação.

## 12. Critério de conclusão

A arquitetura estará corretamente implementada quando:

- A aplicação atender aos requisitos aprovados.
- Os testes e verificações de qualidade passarem.
- Os hooks pre-commit e pre-push estiverem configurados e funcionando.
- A aplicação gerar build de produção sem erros.
- O projeto estiver pronto para publicação estática.