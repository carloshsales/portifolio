import { skillGroups as content } from '../content/skills'
import type { SkillGroup } from '../types'

function normalizeText(value: string): string | undefined {
  const text = value.trim()

  return text === '' ? undefined : text
}

function normalizeSkillGroup(group: SkillGroup): SkillGroup | undefined {
  const title = normalizeText(group.title)
  const skills = group.skills.map((skill) => skill.trim()).filter((skill) => skill !== '')

  if (title === undefined || skills.length === 0) {
    return undefined
  }

  return { title, skills }
}

// Ponto de importação estável para as habilidades.
// Remove grupos sem título ou sem habilidades, remove habilidades vazias
// e apara os títulos e as habilidades.
export const skillGroups: SkillGroup[] = content
  .map(normalizeSkillGroup)
  .filter((group): group is SkillGroup => group !== undefined)
