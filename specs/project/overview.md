# Visão geral do projeto

## Objetivo

Construir um portfólio profissional de página única para apresentar competências, conhecimentos técnicos, projetos e informações de contato, demonstrando engenharia de software, qualidade e desenvolvimento.

O projeto será publicado na internet e funcionará como apresentação profissional para oportunidades de trabalho.

## Escopo

Aplicação estática de página única, sem backend, banco de dados, autenticação ou painel administrativo.

### Seções

1. **Início** — apresentação profissional e habilidades/tecnologias.
2. **Projetos** — projetos, tecnologias e links.
3. **Jogos** — projetos de jogos.
4. **Artigos** — artigos e escrita técnica.
5. **Experimentos** — experimentos e projetos exploratórios.
6. **Contato** — canais de contato e redes profissionais.

A navegação é lateral, com adaptação para dispositivos móveis.

## Fora do escopo

- Painel administrativo.
- Banco de dados.
- Autenticação e cadastro de usuários.
- CRUD de projetos.
- Upload administrativo de imagens.
- Orquestração avançada de agentes.
- Histórico de experiências profissionais ou nomes de empresas anteriores.
- Inventar projetos, experiências, qualificações ou informações pessoais.

## Stack

| Tecnologia | Finalidade |
|---|---|
| React | Interface |
| TypeScript | Tipagem estática (strict) |
| Vite | Build e servidor de desenvolvimento |
| CSS Modules | Estilização modular |
| Vitest + Testing Library | Testes |
| ESLint | Análise estática |
| Husky + lint-staged | Verificações Git |
| pnpm | Gerenciador de pacotes |

## Qualidade

- Responsividade mobile-first.
- Acessibilidade WCAG 2.2 AA.
- Performance e carregamento eficiente.
- Identidade visual aprovada (ver `design-system.md`).

## Restrições

- Não adicionar funcionalidades fora do escopo sem aprovação.
- Conteúdo só pode usar informações reais fornecidas pelo usuário.
- Priorizar simplicidade, manutenibilidade e qualidade.
- Evitar abstrações e dependências desnecessárias.
