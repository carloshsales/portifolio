import { skillGroups as content } from '../content/skills'
import type { SkillGroup } from '../types'

// Ponto de importação estável para as habilidades.
// Remove grupos sem título ou sem habilidades.
export const skillGroups: SkillGroup[] = content.filter(
  (group) => group.title.trim() !== '' && group.skills.length > 0,
)
