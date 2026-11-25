import { profile as content } from '../content/profile'
import type { Profile, SocialIcon, SocialLink } from '../types'

const WEB_URL_PATTERN = /^https?:\/\/\S/i
const EMAIL_URL_PATTERN = /^mailto:[^\s@]+@[^\s@]+$/i

function normalizeText(value: string): string | undefined {
  const text = value.trim()

  return text === '' ? undefined : text
}

function isValidUrl(url: string, icon: SocialIcon): boolean {
  if (WEB_URL_PATTERN.test(url)) {
    return true
  }

  return icon === 'email' && EMAIL_URL_PATTERN.test(url)
}

function normalizeSocialLink(link: SocialLink): SocialLink | undefined {
  const label = normalizeText(link.label)
  const url = normalizeText(link.url)

  if (label === undefined || url === undefined || !isValidUrl(url, link.icon)) {
    return undefined
  }

  return { label, url, icon: link.icon }
}

function normalizeProfile(data: Profile): Profile {
  return {
    ...data,
    social: data.social
      .map(normalizeSocialLink)
      .filter((link): link is SocialLink => link !== undefined),
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
// Normaliza o conteúdo e remove contactos sem rótulo ou sem URL válida. As URLs válidas
// começam por https:// ou http:// seguidos de um host, e o canal de email aceita também
// mailto: seguido de um endereço. O protocolo não distingue maiúsculas de minúsculas.
// Em ambiente de teste end-to-end, permite injetar um perfil através de
// `window.__PORTFOLIO_PROFILE__` sem alterar `src/content/profile.ts`.
export const profile: Profile = readProfile()
