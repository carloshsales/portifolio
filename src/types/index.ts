export type SocialIcon = 'github' | 'linkedin' | 'email'

export interface SocialLink {
  label: string
  url: string
  icon: SocialIcon
}

export interface Profile {
  name: string
  role: string
  summary: string
  photoUrl: string
  location: string
  social: SocialLink[]
}

export interface Project {
  title: string
  description: string
  technologies: string[]
  repositoryUrl?: string
  liveUrl?: string
}

/**
 * Como a habilidade se relaciona com este projecto.
 *
 * - `applied` — a habilidade é usada neste projecto. Recebe o rótulo
 *   "Aplicado nesse Portfólio".
 * - `experienced` — a habilidade é conhecida e usada noutros contextos,
 *   mas não é usada neste projecto. Não recebe rótulo: o texto `usage`
 *   descreve a experiência, não uma aplicação aqui.
 */
export type SkillApplication = 'applied' | 'experienced'

export interface Skill {
  name: string
  /** O que a habilidade é. */
  description: string
  /** Como a habilidade é usada neste projecto. */
  usage: string
  /** A relação da habilidade com este projecto. */
  application: SkillApplication
}

export interface SkillGroup {
  title: string
  skills: Skill[]
}
