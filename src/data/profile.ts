import { profile as content } from '../content/profile'
import type { Profile } from '../types'

// Ponto de importação estável para o perfil.
// Normaliza o conteúdo e remove contactos sem URL utilizável.
export const profile: Profile = {
  ...content,
  social: content.social.filter((link) => link.url.trim() !== ''),
}
