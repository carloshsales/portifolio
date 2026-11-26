import type { Project } from '../../types'

// Projetos de teste, fictícios. Não são conteúdo do utilizador: só os testes os importam.
export const projects: Project[] = [
  {
    title: 'Painel de estudos',
    description:
      'Aplicação de página única para acompanhar metas de estudo, com gráficos de progresso e exportação dos registros em CSV.',
    technologies: ['React', 'TypeScript', 'Vitest'],
    repositoryUrl: 'https://github.dominio-teste.test/ana-ferreira-teste/painel-de-estudos',
    liveUrl: 'https://painel-de-estudos.dominio-teste.test',
  },
  {
    title: 'Catálogo de receitas',
    description:
      'Catálogo pesquisável por ingrediente e tempo de preparo, com navegação completa pelo teclado e estados vazios explícitos.',
    technologies: ['JavaScript', 'HTML', 'CSS'],
    repositoryUrl: 'https://github.dominio-teste.test/ana-ferreira-teste/catalogo-de-receitas',
  },
  {
    title: 'Conversor de unidades',
    description:
      'Conversão entre sistemas de medida, com validação das entradas numéricas e resultado atualizado a cada alteração.',
    technologies: ['TypeScript'],
  },
]
