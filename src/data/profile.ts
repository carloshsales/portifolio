import type { Profile } from '../types'

// Conteúdo de placeholder — substituir pelos dados reais antes de publicar.
export const profile: Profile = {
  name: '[O teu nome]',
  role: '[A tua função]',
  summary:
    '[Escreve uma breve apresentação sobre ti, o que fazes e o que valorizas no teu trabalho.]',
  photoUrl: '/images/foto-perfil.jpg',
  location: '[Localidade]',
  social: [
    { label: 'GitHub', url: 'https://github.com/teu-utilizador', icon: 'github' },
    { label: 'LinkedIn', url: 'https://www.linkedin.com/in/teu-perfil', icon: 'linkedin' },
    { label: 'Email', url: 'mailto:teu@email.com', icon: 'email' },
  ],
}
