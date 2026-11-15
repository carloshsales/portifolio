export type ProfileLink = {
  label: string
  href: string
}

export type Profile = {
  name: string
  role: string
  bio: string
  photo: string
  photoAlt: string
  links: ProfileLink[]
}

export const profile: Profile = {
  name: 'Carlos Henrique',
  role: 'Desenvolvedor Full Stack - IA Specs',
  bio: 'Sou desenvolvedor de software com foco em aplicações web, utilizando React, TypeScript e Supabase. Tenho experiência com ferramentas modernas como Cursor, OpenCode e OpenSpec, aplicando orquestração de IA para otimizar o desenvolvimento, estruturar soluções e elevar a qualidade do código. Busco unir tecnologia, pensamento analítico e aprendizado contínuo para transformar ideias em produtos digitais eficientes, escaláveis e bem construídos.',
  photo: '/images/foto-perfil.webp',
  photoAlt: 'Fotografia de Carlos Henrique',
  links: [
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/carloshsales/' },
    { label: 'GitHub', href: 'https://github.com/carloshsales' },
    { label: 'E-mail', href: 'mailto:carlosh.sales@outlook.com' },
  ],
}
