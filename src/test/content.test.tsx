import type { ComponentType } from 'react'
import { render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { EmailIcon, GithubIcon } from '../components/icons'
import type { Profile, Project, SkillGroup, SocialLink } from '../types'

const PLACEHOLDER_MARKERS = ['[', 'teu-utilizador', 'exemplo.com', 'teu@email.com']

const filledProfile: Profile = {
  name: 'Maria Silva',
  role: 'Engenheira de Software',
  summary: 'Resumo de teste para o perfil preenchido.',
  photoUrl: '/images/foto-perfil.jpg',
  location: 'Porto',
  social: [{ label: 'LinkedIn', url: 'https://linkedin.com/in/maria', icon: 'linkedin' }],
}

const filledProject: Project = {
  title: 'Projeto de teste',
  description: 'Descrição de teste.',
  technologies: ['React', 'TypeScript'],
}

const emptyProfile: Profile = {
  name: '',
  role: '',
  summary: '',
  photoUrl: '',
  location: '',
  social: [],
}

beforeEach(() => {
  vi.resetModules()
})

describe('estado sem nome', () => {
  beforeEach(() => {
    vi.doMock('../data/profile', () => ({ profile: emptyProfile }))
    vi.doMock('../data/projects', () => ({ projects: [] }))
  })

  afterEach(() => {
    vi.doUnmock('../data/profile')
    vi.doUnmock('../data/projects')
  })

  it('não renderiza marcadores de placeholder', async () => {
    const { default: App } = await import('../App')
    const { container } = render(<App />)
    const text = container.textContent ?? ''

    for (const marker of PLACEHOLDER_MARKERS) {
      expect(text).not.toContain(marker)
    }
  })

  it('não renderiza ligações com URL de exemplo', async () => {
    const { default: App } = await import('../App')
    const { container } = render(<App />)
    const links = Array.from(container.querySelectorAll('a[href]'))

    for (const link of links) {
      const href = link.getAttribute('href') ?? ''
      expect(href).not.toContain('teu-utilizador')
      expect(href).not.toContain('exemplo.com')
      expect(href).not.toContain('teu@email.com')
    }
  })

  it('não renderiza fotografia nem texto alternativo vazio', async () => {
    const { default: App } = await import('../App')
    const { container } = render(<App />)

    expect(container.querySelector('img')).toBeNull()
    expect(screen.queryByRole('img')).toBeNull()
  })

  it('apresenta a marca da barra lateral como Início', async () => {
    const { default: App } = await import('../App')
    render(<App />)

    expect(screen.getByRole('heading', { name: 'Início', level: 1 })).toBeInTheDocument()
  })
})

describe('estado com nome', () => {
  beforeEach(() => {
    vi.doMock('../data/profile', () => ({ profile: filledProfile }))
    vi.doMock('../data/projects', () => ({ projects: [] }))
  })

  afterEach(() => {
    vi.doUnmock('../data/profile')
    vi.doUnmock('../data/projects')
  })

  it('renderiza a fotografia com texto alternativo', async () => {
    const { default: App } = await import('../App')
    render(<App />)

    expect(
      screen.getByRole('img', { name: `Fotografia de ${filledProfile.name}` }),
    ).toBeInTheDocument()
  })

  it('renderiza o nome e a função na secção inicial', async () => {
    const { default: App } = await import('../App')
    render(<App />)

    const home = screen.getByRole('region', { name: filledProfile.name })

    expect(
      within(home).getByRole('heading', { name: filledProfile.name, level: 2 }),
    ).toBeInTheDocument()
    expect(within(home).getByText(filledProfile.role)).toBeInTheDocument()
  })
})

describe('CTA Ver projetos', () => {
  afterEach(() => {
    vi.doUnmock('../data/profile')
    vi.doUnmock('../data/projects')
  })

  it('mostra o CTA quando existem projetos', async () => {
    vi.doMock('../data/profile', () => ({ profile: filledProfile }))
    vi.doMock('../data/projects', () => ({ projects: [filledProject] }))

    const { default: App } = await import('../App')
    render(<App />)

    const home = screen.getByRole('region', { name: filledProfile.name })
    expect(within(home).getByRole('link', { name: /ver projetos/i })).toBeInTheDocument()
  })

  it('não mostra o CTA quando não existem projetos', async () => {
    vi.doMock('../data/profile', () => ({ profile: filledProfile }))
    vi.doMock('../data/projects', () => ({ projects: [] }))

    const { default: App } = await import('../App')
    render(<App />)

    const home = screen.getByRole('region', { name: filledProfile.name })
    expect(within(home).queryByRole('link', { name: /ver projetos/i })).not.toBeInTheDocument()
  })
})

describe('CTA Contato', () => {
  afterEach(() => {
    vi.doUnmock('../data/profile')
    vi.doUnmock('../data/projects')
  })

  it('mostra o CTA quando existem canais de contato', async () => {
    vi.doMock('../data/profile', () => ({ profile: filledProfile }))
    vi.doMock('../data/projects', () => ({ projects: [] }))

    const { default: App } = await import('../App')
    render(<App />)

    const home = screen.getByRole('region', { name: filledProfile.name })
    expect(within(home).getByRole('link', { name: /contato/i })).toBeInTheDocument()
  })

  it('não mostra o CTA quando não existem canais de contato', async () => {
    vi.doMock('../data/profile', () => ({
      profile: { ...filledProfile, social: [] },
    }))
    vi.doMock('../data/projects', () => ({ projects: [] }))

    const { default: App } = await import('../App')
    render(<App />)

    const home = screen.getByRole('region', { name: filledProfile.name })
    expect(within(home).queryByRole('link', { name: /contato/i })).not.toBeInTheDocument()
  })
})

describe('secção de projetos', () => {
  const repositoryUrl = 'https://repositorio.test/projeto-teste'
  const liveUrl = 'https://demo.test/projeto-teste'

  const linkedProject: Project = {
    title: 'Projeto com links',
    description: 'Descrição de teste para um projeto com links.',
    technologies: ['React', 'TypeScript'],
    repositoryUrl,
    liveUrl,
  }

  const unlinkedProject: Project = {
    title: 'Projeto sem links',
    description: 'Descrição de teste para um projeto sem links.',
    technologies: ['CSS'],
  }

  afterEach(() => {
    vi.doUnmock('../content/projects')
  })

  function findCard(section: HTMLElement, title: string): HTMLElement {
    const card = within(section).getByRole('heading', { level: 3, name: title }).closest('li')

    if (card === null) {
      throw new Error(`Card não encontrado: ${title}`)
    }

    return card
  }

  it('apresenta o estado vazio e nenhum card quando não há projetos', async () => {
    vi.doMock('../content/projects', () => ({ projects: [] }))

    const { Projects } = await import('../sections/Projects/Projects')
    render(<Projects />)

    const section = screen.getByRole('region', { name: 'Projetos' })

    expect(within(section).getByText('Ainda não há projetos para apresentar.')).toBeInTheDocument()
    expect(within(section).queryAllByRole('listitem')).toHaveLength(0)
    expect(within(section).queryByRole('heading', { level: 3 })).not.toBeInTheDocument()
  })

  it('apresenta cada projeto em card com links seguros', async () => {
    vi.doMock('../content/projects', () => ({ projects: [linkedProject] }))

    const { Projects } = await import('../sections/Projects/Projects')
    render(<Projects />)

    const section = screen.getByRole('region', { name: 'Projetos' })
    const card = findCard(section, linkedProject.title)

    expect(within(card).getByText(linkedProject.description)).toBeInTheDocument()

    const technologies = within(card).getByRole('list', { name: 'Tecnologias utilizadas' })
    const items = within(technologies).getAllByRole('listitem')

    expect(items.map((item) => item.textContent)).toEqual(linkedProject.technologies)

    const repository = within(card).getByRole('link', { name: 'Código' })
    const demo = within(card).getByRole('link', { name: 'Demonstração' })

    expect(repository).toHaveAttribute('href', repositoryUrl)
    expect(demo).toHaveAttribute('href', liveUrl)

    for (const link of [repository, demo]) {
      expect(link).toHaveAttribute('target', '_blank')
      expect(link.getAttribute('rel')?.split(' ')).toEqual(
        expect.arrayContaining(['noreferrer', 'noopener']),
      )
    }
  })

  it('não apresenta links quando o projeto não tem URLs', async () => {
    vi.doMock('../content/projects', () => ({ projects: [unlinkedProject] }))

    const { Projects } = await import('../sections/Projects/Projects')
    render(<Projects />)

    const section = screen.getByRole('region', { name: 'Projetos' })

    expect(findCard(section, unlinkedProject.title)).toBeInTheDocument()
    expect(within(section).queryAllByRole('link')).toHaveLength(0)
  })

  it('apresenta apenas o link cujo valor está preenchido', async () => {
    vi.doMock('../content/projects', () => ({ projects: [{ ...unlinkedProject, liveUrl }] }))

    const { Projects } = await import('../sections/Projects/Projects')
    render(<Projects />)

    const section = screen.getByRole('region', { name: 'Projetos' })
    const card = findCard(section, unlinkedProject.title)

    expect(within(card).getAllByRole('link')).toHaveLength(1)
    expect(within(card).queryByRole('link', { name: 'Código' })).not.toBeInTheDocument()
    expect(within(card).getByRole('link', { name: 'Demonstração' })).toHaveAttribute(
      'href',
      liveUrl,
    )
  })

  it('a fixture não fica no conteúdo real', async () => {
    const actual = await vi.importActual<{ projects: Project[] }>('../content/projects')
    const { projects } = await import('../content/projects')

    expect(projects).toStrictEqual(actual.projects)
    expect(actual.projects).not.toContainEqual(linkedProject)
  })
})

describe('normalização dos projetos', () => {
  afterEach(() => {
    vi.doUnmock('../content/projects')
  })

  async function loadProjects(content: Project[]): Promise<Project[]> {
    vi.doMock('../content/projects', () => ({ projects: content }))

    const { projects } = await import('../data/projects')

    return projects
  }

  it('remove projetos sem título, sem descrição ou sem tecnologias', async () => {
    const valid: Project = {
      title: 'Projeto válido',
      description: 'Descrição de teste.',
      technologies: ['React'],
    }

    const projects = await loadProjects([
      { ...valid, title: '   ' },
      { ...valid, description: '' },
      { ...valid, technologies: [] },
      valid,
    ])

    expect(projects).toStrictEqual([valid])
  })

  it('remove as tecnologias vazias e o projeto quando a lista fica sem itens', async () => {
    const projects = await loadProjects([
      {
        title: 'Com tecnologias vazias',
        description: 'Descrição de teste.',
        technologies: ['React', '', '   '],
      },
      {
        title: 'Só com tecnologias vazias',
        description: 'Descrição de teste.',
        technologies: ['', '  '],
      },
    ])

    expect(projects).toStrictEqual([
      {
        title: 'Com tecnologias vazias',
        description: 'Descrição de teste.',
        technologies: ['React'],
      },
    ])
  })

  it('remove os campos de URL vazios ou sem protocolo http:// ou https://', async () => {
    const projects = await loadProjects([
      {
        title: 'URL vazia',
        description: 'Descrição de teste.',
        technologies: ['React'],
        repositoryUrl: '   ',
        liveUrl: '',
      },
      {
        title: 'URL sem protocolo',
        description: 'Descrição de teste.',
        technologies: ['React'],
        repositoryUrl: 'repositorio.test/projeto-teste',
        liveUrl: 'www.demo.test/projeto-teste',
      },
      {
        title: 'URL com outro protocolo',
        description: 'Descrição de teste.',
        technologies: ['React'],
        repositoryUrl: 'ftp://repositorio.test/projeto-teste',
        liveUrl: 'javascript:alert(1)',
      },
    ])

    expect(projects).toStrictEqual([
      {
        title: 'URL vazia',
        description: 'Descrição de teste.',
        technologies: ['React'],
      },
      {
        title: 'URL sem protocolo',
        description: 'Descrição de teste.',
        technologies: ['React'],
      },
      {
        title: 'URL com outro protocolo',
        description: 'Descrição de teste.',
        technologies: ['React'],
      },
    ])
  })

  it('mantém as URLs com protocolo http:// ou https:// sem espaços nas extremidades', async () => {
    const projects = await loadProjects([
      {
        title: 'URLs válidas',
        description: 'Descrição de teste.',
        technologies: ['React'],
        repositoryUrl: ' https://repositorio.test/projeto-teste ',
        liveUrl: 'http://demo.test/projeto-teste',
      },
    ])

    expect(projects).toStrictEqual([
      {
        title: 'URLs válidas',
        description: 'Descrição de teste.',
        technologies: ['React'],
        repositoryUrl: 'https://repositorio.test/projeto-teste',
        liveUrl: 'http://demo.test/projeto-teste',
      },
    ])
  })

  it('remove os espaços nas extremidades dos textos', async () => {
    const projects = await loadProjects([
      {
        title: '  Projeto  ',
        description: '  Descrição de teste.  ',
        technologies: [' React '],
      },
    ])

    expect(projects).toStrictEqual([
      {
        title: 'Projeto',
        description: 'Descrição de teste.',
        technologies: ['React'],
      },
    ])
  })
})

describe('secção de habilidades', () => {
  const skillGroupsFixture: SkillGroup[] = [
    { title: 'Categoria de teste', skills: ['TypeScript', 'React'] },
    { title: 'Outra categoria de teste', skills: ['CSS'] },
  ]

  afterEach(() => {
    vi.doUnmock('../content/skills')
  })

  function findGroup(section: HTMLElement, title: string): HTMLElement {
    const heading = within(section).getByRole('heading', { level: 3, name: title })
    const group = heading.closest('div')

    if (group === null) {
      throw new Error(`Grupo não encontrado: ${title}`)
    }

    return group
  }

  it('apresenta o estado vazio e nenhum grupo quando não há habilidades', async () => {
    vi.doMock('../content/skills', () => ({ skillGroups: [] }))

    const { Skills } = await import('../sections/Skills/Skills')
    render(<Skills />)

    const section = screen.getByRole('region', { name: 'Habilidades' })
    const emptyState = within(section).getByText('Ainda não há habilidades para apresentar.')

    expect(emptyState).toBeInTheDocument()
    expect(within(section).queryByRole('heading', { level: 3 })).not.toBeInTheDocument()
    expect(within(section).queryByRole('list')).not.toBeInTheDocument()
  })

  it('apresenta cada grupo com título em h3 e a lista das suas habilidades', async () => {
    vi.doMock('../content/skills', () => ({ skillGroups: skillGroupsFixture }))

    const { Skills } = await import('../sections/Skills/Skills')
    render(<Skills />)

    const section = screen.getByRole('region', { name: 'Habilidades' })
    const titles = within(section).getAllByRole('heading', { level: 3 })
    const expectedTitles = skillGroupsFixture.map((group) => group.title)

    expect(titles.map((title) => title.textContent)).toEqual(expectedTitles)

    for (const group of skillGroupsFixture) {
      const block = findGroup(section, group.title)
      const heading = within(block).getByRole('heading', { level: 3, name: group.title })
      const list = within(block).getByRole('list')
      const items = within(list).getAllByRole('listitem')

      expect(heading.nextElementSibling).toBe(list)
      expect(list).toHaveAttribute('role', 'list')
      expect(items.map((item) => item.textContent)).toEqual(group.skills)
    }
  })
})

describe('normalização das habilidades', () => {
  afterEach(() => {
    vi.doUnmock('../content/skills')
  })

  async function loadSkillGroups(content: SkillGroup[]): Promise<SkillGroup[]> {
    vi.doMock('../content/skills', () => ({ skillGroups: content }))

    const { skillGroups } = await import('../data/skills')

    return skillGroups
  }

  it('remove grupos sem título ou sem habilidades', async () => {
    const valid: SkillGroup = { title: 'Grupo válido', skills: ['TypeScript'] }
    const withoutTitle = { ...valid, title: '   ' }
    const withoutSkills = { ...valid, skills: [] }

    const groups = await loadSkillGroups([withoutTitle, withoutSkills, valid])

    expect(groups).toStrictEqual([valid])
  })

  it('remove as habilidades vazias e o grupo quando a lista fica sem itens', async () => {
    const groups = await loadSkillGroups([
      { title: 'Com habilidades vazias', skills: ['TypeScript', '', '   '] },
      { title: 'Só com habilidades vazias', skills: ['', '  '] },
    ])

    expect(groups).toStrictEqual([{ title: 'Com habilidades vazias', skills: ['TypeScript'] }])
  })

  it('apara o título e as habilidades', async () => {
    const padded = { title: '  Grupo  ', skills: [' TypeScript ', 'CSS  '] }

    const groups = await loadSkillGroups([padded])

    expect(groups).toStrictEqual([{ title: 'Grupo', skills: ['TypeScript', 'CSS'] }])
  })
})

describe('secção de contato', () => {
  const contactChannels: SocialLink[] = [
    { label: 'GitHub', url: 'https://github.com/utilizador-teste', icon: 'github' },
    { label: 'Email', url: 'mailto:teste@exemplo.test', icon: 'email' },
  ]

  afterEach(() => {
    vi.doUnmock('../content/profile')
  })

  function iconMarkup(Icon: ComponentType<{ className?: string }>): string {
    const { container } = render(<Icon />)
    const svg = container.querySelector('svg')

    if (svg === null) {
      throw new Error('Ícone sem SVG')
    }

    return svg.innerHTML
  }

  async function renderContact(social: SocialLink[]): Promise<HTMLElement> {
    vi.doMock('../content/profile', () => ({ profile: { ...emptyProfile, social } }))

    const { Contact } = await import('../sections/Contact/Contact')
    render(<Contact />)

    return screen.getByRole('region', { name: 'Contato' })
  }

  it('apresenta cada canal com ícone, rótulo e href correspondentes', async () => {
    const githubIcon = iconMarkup(GithubIcon)
    const emailIcon = iconMarkup(EmailIcon)

    const section = await renderContact(contactChannels)
    const list = within(section).getByRole('list')
    const github = within(list).getByRole('link', { name: 'GitHub' })
    const email = within(list).getByRole('link', { name: 'Email' })

    expect(list).toHaveAttribute('role', 'list')
    expect(within(list).getAllByRole('listitem')).toHaveLength(2)

    expect(github).toHaveAttribute('href', 'https://github.com/utilizador-teste')
    expect(email).toHaveAttribute('href', 'mailto:teste@exemplo.test')

    expect(github.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
    expect(github.querySelector('svg')?.innerHTML).toBe(githubIcon)
    expect(email.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
    expect(email.querySelector('svg')?.innerHTML).toBe(emailIcon)
  })

  it('abre os canais externos em nova janela e deixa o email sem target', async () => {
    const section = await renderContact(contactChannels)
    const github = within(section).getByRole('link', { name: 'GitHub' })
    const email = within(section).getByRole('link', { name: 'Email' })

    expect(github).toHaveAttribute('target', '_blank')
    expect(github).toHaveAttribute('rel', 'noreferrer noopener')
    expect(email).not.toHaveAttribute('target')
    expect(email).not.toHaveAttribute('rel')
  })

  it('deixa o email sem target quando o esquema mailto: está em maiúsculas', async () => {
    const section = await renderContact([
      { label: 'Email', url: 'Mailto:teste@exemplo.test', icon: 'email' },
    ])
    const email = within(section).getByRole('link', { name: 'Email' })

    expect(email).toHaveAttribute('href', 'Mailto:teste@exemplo.test')
    expect(email).not.toHaveAttribute('target')
    expect(email).not.toHaveAttribute('rel')
  })

  it('apresenta o estado vazio e nenhum canal quando não há canais', async () => {
    const section = await renderContact([])

    expect(
      within(section).getByText('Ainda não há canais de contato para apresentar.'),
    ).toBeInTheDocument()
    expect(within(section).queryAllByRole('link')).toHaveLength(0)
    expect(within(section).queryByRole('list')).not.toBeInTheDocument()
  })

  it('o conteúdo real dos canais não tem placeholders nem emails fictícios', async () => {
    const actual = await vi.importActual<{ profile: Profile }>('../content/profile')

    for (const channel of actual.profile.social) {
      for (const marker of PLACEHOLDER_MARKERS) {
        expect(channel.label).not.toContain(marker)
        expect(channel.url).not.toContain(marker)
      }
    }
  })
})

describe('normalização dos canais de contato', () => {
  afterEach(() => {
    vi.doUnmock('../content/profile')
  })

  async function loadSocial(content: SocialLink[]): Promise<SocialLink[]> {
    vi.doMock('../content/profile', () => ({ profile: { ...emptyProfile, social: content } }))

    const { profile } = await import('../data/profile')

    return profile.social
  }

  it('remove canais sem rótulo ou sem URL', async () => {
    const valid: SocialLink = {
      label: 'GitHub',
      url: 'https://github.com/utilizador-teste',
      icon: 'github',
    }

    const social = await loadSocial([
      { ...valid, url: '' },
      { ...valid, url: '   ' },
      { ...valid, label: '   ' },
      valid,
    ])

    expect(social).toStrictEqual([valid])
  })

  it('remove canais cuja URL não tem protocolo válido', async () => {
    const social = await loadSocial([
      { label: 'Sem protocolo', url: 'github.com/utilizador-teste', icon: 'github' },
      { label: 'Script', url: 'javascript:alert(1)', icon: 'github' },
      { label: 'Email sem mailto', url: 'teste@exemplo.test', icon: 'email' },
      { label: 'Mailto fora do email', url: 'mailto:teste@exemplo.test', icon: 'github' },
    ])

    expect(social).toStrictEqual([])
  })

  it('mantém o canal de email com mailto:', async () => {
    const email: SocialLink = { label: 'Email', url: 'mailto:teste@exemplo.test', icon: 'email' }

    const social = await loadSocial([email])

    expect(social).toStrictEqual([email])
  })

  it('remove o canal de email sem endereço válido', async () => {
    const social = await loadSocial([
      { label: 'Email', url: 'mailto:', icon: 'email' },
      { label: 'Email', url: 'mailto:   ', icon: 'email' },
      { label: 'Email', url: 'mailto:teste', icon: 'email' },
    ])

    expect(social).toStrictEqual([])
  })

  it('remove as URLs com protocolo e sem host', async () => {
    const social = await loadSocial([
      { label: 'GitHub', url: 'https://', icon: 'github' },
      { label: 'LinkedIn', url: 'http://   ', icon: 'linkedin' },
    ])

    expect(social).toStrictEqual([])
  })

  it('aceita o protocolo em maiúsculas', async () => {
    const social = await loadSocial([
      { label: 'GitHub', url: 'HTTPS://github.com/utilizador-teste', icon: 'github' },
      { label: 'Email', url: 'Mailto:teste@exemplo.test', icon: 'email' },
    ])

    expect(social).toStrictEqual([
      { label: 'GitHub', url: 'HTTPS://github.com/utilizador-teste', icon: 'github' },
      { label: 'Email', url: 'Mailto:teste@exemplo.test', icon: 'email' },
    ])
  })

  it('apara o rótulo e a URL', async () => {
    const social = await loadSocial([
      { label: '  GitHub  ', url: ' https://github.com/utilizador-teste ', icon: 'github' },
      { label: ' Email ', url: '  mailto:teste@exemplo.test  ', icon: 'email' },
    ])

    expect(social).toStrictEqual([
      { label: 'GitHub', url: 'https://github.com/utilizador-teste', icon: 'github' },
      { label: 'Email', url: 'mailto:teste@exemplo.test', icon: 'email' },
    ])
  })
})
