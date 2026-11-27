import { skillGroups as content } from '../content/skills'
import type { Skill, SkillApplication, SkillGroup } from '../types'

function normalizeText(value: string): string | undefined {
  const text = value.trim()

  return text === '' ? undefined : text
}

function normalizeSkill(skill: Skill): Skill | undefined {
  const name = normalizeText(skill.name)
  const description = normalizeText(skill.description)
  const usage = normalizeText(skill.usage)

  if (name === undefined || description === undefined || usage === undefined) {
    return undefined
  }

  const application: SkillApplication = skill.application === 'applied' ? 'applied' : 'experienced'

  return { name, description, usage, application }
}

function normalizeSkillGroup(group: SkillGroup): SkillGroup | undefined {
  const title = normalizeText(group.title)
  const skills = group.skills
    .map(normalizeSkill)
    .filter((skill): skill is Skill => skill !== undefined)

  if (title === undefined || skills.length === 0) {
    return undefined
  }

  return { title, skills }
}

// Ponto de importação estável para as habilidades.
// Remove grupos sem título ou sem habilidades, remove habilidades sem
// nome, descrição ou uso, e apara os textos.
export const skillGroups: SkillGroup[] = content
  .map(normalizeSkillGroup)
  .filter((group): group is SkillGroup => group !== undefined)
