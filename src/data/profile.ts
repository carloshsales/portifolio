import { profile as content } from '../content/profile'
import type { Profile } from '../types'

function normalizeProfile(data: Profile): Profile {
  return {
    ...data,
    social: data.social.filter((link) => link.url.trim() !== ''),
  }
}

function readProfile(): Profile {
  if (typeof window !== 'undefined') {
    const override = (window as unknown as { __PORTFOLIO_PROFILE__?: Profile })
      .__PORTFOLIO_PROFILE__

    if (override !== undefined) {
      return normalizeProfile(override)
    }
  }

  return normalizeProfile(content)
}

// Ponto de importação estável para o perfil.
// Normaliza o conteúdo e remove contactos sem URL utilizável.
// Em ambiente de teste end-to-end, permite injetar um perfil através de
// `window.__PORTFOLIO_PROFILE__` sem alterar `src/content/profile.ts`.
export const profile: Profile = readProfile()
