# Change 001 — Portfolio MVP

- Status: APPROVED
- Tipo: Nova funcionalidade
- Prioridade: Alta

## 1. Objetivo

Construir um portfólio profissional para apresentar competências, conhecimentos técnicos, projetos e informações de contato, demonstrando conhecimentos de engenharia de software, qualidade e desenvolvimento.

O projeto deverá ser publicado na internet e funcionar como uma apresentação profissional para oportunidades de trabalho.

## 2. Escopo funcional

O portfólio será uma aplicação de página única (One Page), com as seguintes seções:

1. Início: apresentação profissional e foto.
2. Projetos: apresentação de projetos, tecnologias e links.
3. Habilidades: linguagens, frameworks, ferramentas e competências.
4. Contato: canais de contato e redes profissionais.

Não haverá seção de experiência profissional ou identificação de empresas anteriores.

## 3. Direção visual

- Menu lateral com navegação entre seções.
- Foto profissional em destaque, com moldura circular.
- Fundo grafite com detalhes em laranja âmbar.
- Visual minimalista, moderno e profissional.
- Tipografia exclusivamente do Google Fonts:
  - Manrope: títulos.
  - Inter: textos.
  - JetBrains Mono: detalhes técnicos.
- Ícones consistentes e elementos visuais discretos.
- Alternância entre tema claro e escuro, se viável sem comprometer o MVP.

## 4. Requisitos de qualidade

### Responsividade
- Abordagem mobile-first.
- Layout adaptável a celulares, tablets e desktops.
- Navegação adequada para telas pequenas.
- Ausência de rolagem horizontal indesejada.

### Acessibilidade
- Utilizar WCAG 2.2 nível AA como referência.
- Navegação completa por teclado.
- Indicadores de foco visíveis.
- Contraste adequado entre texto e fundo.
- HTML semântico e hierarquia correta de títulos.
- Textos alternativos para imagens relevantes.
- Compatibilidade com leitores de tela.
- Respeitar `prefers-reduced-motion`.

### Animações e efeitos
- Transições suaves entre estados.
- Animações discretas de entrada.
- Efeitos de hover e foco.
- Microinterações nos elementos interativos.
- Evitar efeitos que prejudiquem legibilidade, desempenho ou acessibilidade.

### Desempenho
- Otimização de imagens.
- Carregamento eficiente de fontes.
- Evitar dependências desnecessárias.
- Priorizar carregamento rápido e boa experiência em dispositivos móveis.

## 5. Fora do escopo da versão 1

- Painel administrativo.
- Banco de dados.
- Autenticação.
- Cadastro de usuários.
- CRUD de projetos.
- Upload administrativo de imagens.
- Orquestração avançada de agentes.
- Histórico de experiências profissionais.

Os conteúdos serão inicialmente mantidos no próprio projeto.

## 6. Critérios de aceitação

- Todas as seções previstas estão disponíveis.
- A identidade visual aprovada foi respeitada.
- A foto profissional está integrada ao layout.
- A navegação funciona em desktop e mobile.
- Os principais fluxos podem ser utilizados por teclado.
- Não existem erros críticos de acessibilidade conhecidos.
- As animações respeitam a preferência por movimento reduzido.
- Os links e informações de contato funcionam.
- Não existem erros críticos no console.
- As verificações de qualidade e testes definidos para o projeto passam.
- A aplicação está pronta para publicação.

## 7. Restrições

- Não adicionar funcionalidades fora do escopo sem aprovação.
- Não inventar experiências ou projetos profissionais.
- Não exibir nomes de empresas anteriores ou histórico profissional.
- Priorizar simplicidade, manutenibilidade e qualidade.
- Evitar abstrações e dependências desnecessárias.

## 8. Aprovação

A implementação somente poderá começar após aprovação desta proposta e definição da arquitetura técnica.