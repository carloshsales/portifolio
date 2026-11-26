import type { SkillGroup } from '../../types'

// Habilidades de teste, fictícias e agrupadas por categoria. Não são conteúdo do utilizador:
// só os testes as importam.
export const skillGroups: SkillGroup[] = [
  { title: 'Frontend', skills: ['TypeScript', 'React', 'CSS Modules', 'HTML semântico'] },
  { title: 'Testes', skills: ['Vitest', 'Testing Library', 'Playwright'] },
  { title: 'Ferramentas', skills: ['Git', 'Vite', 'ESLint'] },
]
