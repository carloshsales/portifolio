import { projects as content } from '../content/projects'
import type { Project } from '../types'

// Ponto de importação estável para os projetos.
// Remove projetos sem título ou descrição.
export const projects: Project[] = content.filter(
  (project) => project.title.trim() !== '' && project.description.trim() !== '',
)
