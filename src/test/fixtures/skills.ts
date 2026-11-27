import type { SkillGroup } from '../../types'

// Habilidades de teste, fictícias e agrupadas por categoria. Não são conteúdo do utilizador:
// só os testes as importam. Os nomes são deliberadamente fictícios, para que
// o teste que garante que o conteúdo real não traz dados de teste continue
// a fazer sentido.
export const skillGroups: SkillGroup[] = [
  {
    title: 'Categoria de teste',
    skills: [
      {
        name: 'Linguagem de teste',
        description: 'Linguagem fictícia usada apenas nos testes.',
        usage: 'Substitui a linguagem real no conteúdo de teste.',
        application: 'applied',
      },
      {
        name: 'Biblioteca de teste',
        description: 'Biblioteca fictícia usada apenas nos testes.',
        usage: 'Substitui a biblioteca real no conteúdo de teste.',
        application: 'experienced',
      },
    ],
  },
  {
    title: 'Outra categoria de teste',
    skills: [
      {
        name: 'Ferramenta de teste',
        description: 'Ferramenta fictícia usada apenas nos testes.',
        usage: 'Substitui a ferramenta real no conteúdo de teste.',
        application: 'applied',
      },
    ],
  },
]
