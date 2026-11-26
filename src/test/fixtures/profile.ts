import type { Profile } from '../../types'

// Perfil de teste, completo e fictício. Não é conteúdo do utilizador: só os testes o importam.
export const profile: Profile = {
  name: 'Ana Ferreira',
  role: 'Desenvolvedora Frontend',
  summary:
    'Desenvolvo interfaces web acessíveis e rápidas, com foco em componentes reutilizáveis e em testes automatizados.',
  photoUrl: '/images/foto-perfil.jpg',
  location: 'Curitiba, Brasil',
  social: [
    {
      label: 'GitHub',
      url: 'https://github.dominio-teste.test/ana-ferreira-teste',
      icon: 'github',
    },
    {
      label: 'LinkedIn',
      url: 'https://linkedin.dominio-teste.test/in/ana-ferreira-teste',
      icon: 'linkedin',
    },
    { label: 'Email', url: 'mailto:ana.ferreira@dominio-teste.test', icon: 'email' },
  ],
}
