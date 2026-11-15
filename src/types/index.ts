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

export interface SkillGroup {
  title: string
  skills: string[]
}
