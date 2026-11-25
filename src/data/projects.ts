import { projects as content } from '../content/projects'
import type { Project } from '../types'

const URL_PROTOCOLS = ['https://', 'http://']

function normalizeText(value: string): string | undefined {
  const text = value.trim()

  return text === '' ? undefined : text
}

function normalizeUrl(value: string | undefined): string | undefined {
  if (value === undefined) {
    return undefined
  }

  const url = value.trim()

  return URL_PROTOCOLS.some((protocol) => url.startsWith(protocol)) ? url : undefined
}

function normalizeProject(project: Project): Project | undefined {
  const title = normalizeText(project.title)
  const description = normalizeText(project.description)
  const technologies = project.technologies
    .map((technology) => technology.trim())
    .filter((technology) => technology !== '')
  const repositoryUrl = normalizeUrl(project.repositoryUrl)
  const liveUrl = normalizeUrl(project.liveUrl)

  if (title === undefined || description === undefined || technologies.length === 0) {
    return undefined
  }

  return {
    title,
    description,
    technologies,
    ...(repositoryUrl === undefined ? {} : { repositoryUrl }),
    ...(liveUrl === undefined ? {} : { liveUrl }),
  }
}

// Ponto de importação estável para os projetos.
// Remove projetos sem título, descrição ou tecnologias, remove tecnologias vazias
// e remove URLs vazias ou sem protocolo http:// ou https://.
export const projects: Project[] = content
  .map(normalizeProject)
  .filter((project): project is Project => project !== undefined)
