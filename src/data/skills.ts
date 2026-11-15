export type SkillCategory = {
  title: string
  skills: string[]
}

export const skillCategories: SkillCategory[] = [
  { title: 'Frontend', skills: ['React', 'TypeScript'] },
  { title: 'Backend/Dados', skills: ['Supabase'] },
  { title: 'Ferramentas', skills: ['Cursor', 'OpenCode', 'OpenSpec'] },
]
