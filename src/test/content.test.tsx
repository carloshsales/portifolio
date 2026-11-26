import type { ComponentType } from 'react'
import { render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { EmailIcon, GithubIcon, LinkedinIcon } from '../components/icons'
import type { Profile, Project, SkillGroup, SocialLink } from '../types'
import { profile as profileFixture } from './fixtures/profile'
import { projects as projectsFixture } from './fixtures/projects'
import { skillGroups as skillGroupsFixture } from './fixtures/skills'

const PLACEHOLDER_MARKERS = ['teu-utilizador', 'exemplo.com', 'teu@email.com']

// As fixtures são dados de teste escritos à mão, e não conteúdo real: o parêntese
// recto continua a ser proibido nelas, mesmo tendo saído dos marcadores de
// placeholder, para que nenhum texto de exemplo se esconda num valor.
const FIXTURE_FORBIDDEN_MARKERS = [...PLACEHOLDER_MARKERS, '[']

function iconMarkup(Icon: ComponentType<{ className?: string }>): string {
  const { container } = render(<Icon />)
  const svg = container.querySelector('svg')

  if (svg === null) {
    throw new Error('Ícone sem SVG')
  }

  return svg.innerHTML
}

async function renderAt(path: string): Promise<ReturnType<typeof render>> {
  const { RouterProvider, createMemoryHistory, createRouter } =
    await import('@tanstack/react-router')
  const { routeTree } = await import('../router')
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [path] }),
  })

  await router.load()

  return render(<RouterProvider router={router} />)
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
    vi.doMock('../data/skills', () => ({ skillGroups: [] }))
  })

  afterEach(() => {
    vi.doUnmock('../data/profile')
    vi.doUnmock('../data/projects')
    vi.doUnmock('../data/skills')
  })

  it('não renderiza marcadores de placeholder', async () => {
    const { container } = await renderAt('/')
    const text = container.textContent ?? ''

    for (const marker of PLACEHOLDER_MARKERS) {
      expect(text).not.toContain(marker)
    }
  })

  it('não renderiza ligações com URL de exemplo', async () => {
    const { container } = await renderAt('/')
    const links = Array.from(container.querySelectorAll('a[href]'))

    for (const link of links) {
      const href = link.getAttribute('href') ?? ''
      expect(href).not.toContain('teu-utilizador')
      expect(href).not.toContain('exemplo.com')
      expect(href).not.toContain('teu@email.com')
    }
  })

  it('não renderiza fotografia nem texto alternativo vazio', async () => {
    const { container } = await renderAt('/')

    expect(container.querySelector('img')).toBeNull()
    expect(screen.queryByRole('img')).toBeNull()
  })

  it('apresenta a marca da barra lateral como Início', async () => {
    await renderAt('/')

    expect(screen.getByRole('heading', { name: 'Início', level: 1 })).toBeInTheDocument()
  })
})

describe('estado com nome', () => {
  beforeEach(() => {
    vi.doMock('../data/profile', () => ({ profile: profileFixture }))
    vi.doMock('../data/projects', () => ({ projects: [] }))
  })

  afterEach(() => {
    vi.doUnmock('../data/profile')
    vi.doUnmock('../data/projects')
  })

  it('renderiza a fotografia com texto alternativo', async () => {
    await renderAt('/')

    expect(
      screen.getByRole('img', { name: `Fotografia de ${profileFixture.name}` }),
    ).toBeInTheDocument()
  })

  it('renderiza o nome e a função na secção inicial', async () => {
    await renderAt('/')

    const home = screen.getByRole('region', { name: profileFixture.name })

    expect(
      within(home).getByRole('heading', { name: profileFixture.name, level: 2 }),
    ).toBeInTheDocument()
    expect(within(home).getByText(profileFixture.role)).toBeInTheDocument()
  })
})

describe('canalização de conteúdo com dados de teste completos', () => {
  beforeEach(() => {
    vi.doMock('../content/profile', () => ({ profile: profileFixture }))
    vi.doMock('../content/projects', () => ({ projects: projectsFixture }))
    vi.doMock('../content/skills', () => ({ skillGroups: skillGroupsFixture }))
  })

  afterEach(() => {
    vi.doUnmock('../content/profile')
    vi.doUnmock('../content/projects')
    vi.doUnmock('../content/skills')
  })

  async function renderApp(path: string): Promise<HTMLElement> {
    const { container } = await renderAt(path)

    return container
  }

  function projectCard(section: HTMLElement, title: string): HTMLElement {
    const card = within(section).getByRole('heading', { level: 3, name: title }).closest('li')

    if (card === null) {
      throw new Error(`Card não encontrado: ${title}`)
    }

    return card
  }

  it('apresenta a fotografia com o caminho e o texto alternativo do perfil', async () => {
    await renderApp('/')

    const photo = screen.getByRole('img', { name: `Fotografia de ${profileFixture.name}` })

    expect(photo).toHaveAttribute('src', profileFixture.photoUrl)
  })

  it('apresenta o nome, a função e o resumo na secção inicial', async () => {
    await renderApp('/')

    const home = screen.getByRole('region', { name: profileFixture.name })
    const projectsLink = within(home).getByRole('link', { name: 'Ver projetos' })
    const contactLink = within(home).getByRole('link', { name: 'Contato' })

    expect(
      within(home).getByRole('heading', { level: 2, name: profileFixture.name }),
    ).toBeInTheDocument()
    expect(within(home).getByText(profileFixture.role)).toBeInTheDocument()
    expect(within(home).getByText(profileFixture.summary)).toBeInTheDocument()
    expect(projectsLink).toHaveAttribute('href', '/projetos')
    expect(contactLink).toHaveAttribute('href', '/contato')
  })

  it('apresenta cada canal de contato com rótulo, destino e ícone da fixture', async () => {
    await renderApp('/contato')

    const section = screen.getByRole('region', { name: 'Contato' })
    const icons = {
      github: iconMarkup(GithubIcon),
      linkedin: iconMarkup(LinkedinIcon),
      email: iconMarkup(EmailIcon),
    }

    for (const channel of profileFixture.social) {
      const link = within(section).getByRole('link', { name: channel.label })

      expect(link).toHaveAttribute('href', channel.url)
      expect(link.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
      expect(link.querySelector('svg')?.innerHTML).toBe(icons[channel.icon])
    }
  })

  it('apresenta cada projeto com título, descrição, tecnologias e links', async () => {
    await renderApp('/projetos')

    const section = screen.getByRole('region', { name: 'Projetos' })
    const titles = within(section).getAllByRole('heading', { level: 3 })
    const techLists = within(section).getAllByRole('list', { name: 'Tecnologias utilizadas' })
    const technologies = techLists.map((list) => {
      const items = within(list).getAllByRole('listitem')

      return items.map((item) => item.textContent)
    })

    expect(titles.map((title) => title.textContent)).toEqual(
      projectsFixture.map((project) => project.title),
    )
    expect(technologies).toEqual(projectsFixture.map((project) => project.technologies))

    for (const project of projectsFixture) {
      const card = projectCard(section, project.title)
      const urls = [project.repositoryUrl, project.liveUrl].filter((url) => url !== undefined)

      expect(within(card).getByText(project.description)).toBeInTheDocument()
      expect(within(card).queryAllByRole('link')).toHaveLength(urls.length)

      if (project.repositoryUrl !== undefined) {
        const repository = within(card).getByRole('link', { name: 'Código' })

        expect(repository).toHaveAttribute('href', project.repositoryUrl)
      }

      if (project.liveUrl !== undefined) {
        const demo = within(card).getByRole('link', { name: 'Demonstração' })

        expect(demo).toHaveAttribute('href', project.liveUrl)
      }
    }
  })

  it('apresenta cada grupo de habilidades com título e habilidades', async () => {
    await renderApp('/habilidades')

    const section = screen.getByRole('region', { name: 'Habilidades' })
    const titles = within(section).getAllByRole('heading', { level: 3 })
    const lists = within(section).getAllByRole('list')
    const skills = lists.map((list) => {
      const items = within(list).getAllByRole('listitem')

      return items.map((item) => item.textContent)
    })

    expect(titles.map((title) => title.textContent)).toEqual(
      skillGroupsFixture.map((group) => group.title),
    )
    expect(skills).toEqual(skillGroupsFixture.map((group) => group.skills))
  })

  it('não renderiza marcadores de placeholder nem ligações de exemplo', async () => {
    for (const path of ['/', '/projetos', '/habilidades', '/contato']) {
      const { container, unmount } = await renderAt(path)
      const text = container.textContent ?? ''

      for (const marker of PLACEHOLDER_MARKERS) {
        expect(text).not.toContain(marker)
      }

      for (const link of Array.from(container.querySelectorAll('a[href]'))) {
        const href = link.getAttribute('href') ?? ''

        for (const marker of PLACEHOLDER_MARKERS) {
          expect(href).not.toContain(marker)
        }
      }

      unmount()
    }
  })
})

describe('CTA Ver projetos', () => {
  afterEach(() => {
    vi.doUnmock('../data/profile')
    vi.doUnmock('../data/projects')
  })

  it('mostra o CTA quando existem projetos', async () => {
    vi.doMock('../data/profile', () => ({ profile: profileFixture }))
    vi.doMock('../data/projects', () => ({ projects: projectsFixture }))

    await renderAt('/')

    const home = screen.getByRole('region', { name: profileFixture.name })
    expect(within(home).getByRole('link', { name: /ver projetos/i })).toBeInTheDocument()
  })

  it('não mostra o CTA quando não existem projetos', async () => {
    vi.doMock('../data/profile', () => ({ profile: profileFixture }))
    vi.doMock('../data/projects', () => ({ projects: [] }))

    await renderAt('/')

    const home = screen.getByRole('region', { name: profileFixture.name })
    expect(within(home).queryByRole('link', { name: /ver projetos/i })).not.toBeInTheDocument()
  })
})

describe('CTA Contato', () => {
  afterEach(() => {
    vi.doUnmock('../data/profile')
    vi.doUnmock('../data/projects')
  })

  it('mostra o CTA quando existem canais de contato', async () => {
    vi.doMock('../data/profile', () => ({ profile: profileFixture }))
    vi.doMock('../data/projects', () => ({ projects: [] }))

    await renderAt('/')

    const home = screen.getByRole('region', { name: profileFixture.name })
    expect(within(home).getByRole('link', { name: /contato/i })).toBeInTheDocument()
  })

  it('não mostra o CTA quando não existem canais de contato', async () => {
    vi.doMock('../data/profile', () => ({
      profile: { ...profileFixture, social: [] },
    }))
    vi.doMock('../data/projects', () => ({ projects: [] }))

    await renderAt('/')

    const home = screen.getByRole('region', { name: profileFixture.name })
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

  it('o conteúdo real não contém os projetos de teste', async () => {
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

  it('não altera os projetos da fixture', async () => {
    const projects = await loadProjects(projectsFixture)

    expect(projects).toStrictEqual(projectsFixture)
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

  it('não altera os grupos da fixture', async () => {
    const groups = await loadSkillGroups(skillGroupsFixture)

    expect(groups).toStrictEqual(skillGroupsFixture)
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

  it('não altera os canais da fixture', async () => {
    const social = await loadSocial(profileFixture.social)

    expect(social).toStrictEqual(profileFixture.social)
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

describe('dados de teste das fixtures', () => {
  it('o perfil de teste está completo', () => {
    expect(profileFixture.name).not.toBe('')
    expect(profileFixture.role).not.toBe('')
    expect(profileFixture.summary).not.toBe('')
    expect(profileFixture.photoUrl).not.toBe('')
    expect(profileFixture.social.length).toBeGreaterThanOrEqual(2)
  })

  it('não repete títulos, habilidades, tecnologias nem rótulos', () => {
    const titles = projectsFixture.map((project) => project.title)
    const groupTitles = skillGroupsFixture.map((group) => group.title)
    const skills = skillGroupsFixture.flatMap((group) => group.skills)
    const labels = profileFixture.social.map((channel) => channel.label)

    for (const values of [titles, groupTitles, skills, labels]) {
      expect(new Set(values).size).toBe(values.length)
    }

    for (const project of projectsFixture) {
      expect(new Set(project.technologies).size).toBe(project.technologies.length)
    }
  })

  it('não contém marcadores de placeholder', () => {
    const values = [
      profileFixture.name,
      profileFixture.role,
      profileFixture.summary,
      profileFixture.photoUrl,
      profileFixture.location,
      ...profileFixture.social.flatMap((channel) => [channel.label, channel.url]),
      ...projectsFixture.flatMap((project) => [
        project.title,
        project.description,
        ...project.technologies,
        ...(project.repositoryUrl === undefined ? [] : [project.repositoryUrl]),
        ...(project.liveUrl === undefined ? [] : [project.liveUrl]),
      ]),
      ...skillGroupsFixture.flatMap((group) => [group.title, ...group.skills]),
    ]

    for (const value of values) {
      for (const marker of FIXTURE_FORBIDDEN_MARKERS) {
        expect(value).not.toContain(marker)
      }
    }
  })
})

interface RealContent {
  profile: Profile
  projects: Project[]
  skillGroups: SkillGroup[]
}

async function importRealContent(): Promise<RealContent> {
  const { profile } = await vi.importActual<{ profile: Profile }>('../content/profile')
  const { projects } = await vi.importActual<{ projects: Project[] }>('../content/projects')
  const { skillGroups } = await vi.importActual<{ skillGroups: SkillGroup[] }>('../content/skills')

  return { profile, projects, skillGroups }
}

describe('conteúdo real', () => {
  it('não tem marcadores no perfil, nos projetos nem nas habilidades', async () => {
    const { profile, projects, skillGroups } = await importRealContent()
    const values: string[] = [profile.name, profile.role, profile.summary]

    for (const project of projects) {
      values.push(project.title, project.description, ...project.technologies)
    }

    for (const group of skillGroups) {
      values.push(group.title, ...group.skills)
    }

    for (const value of values) {
      for (const marker of PLACEHOLDER_MARKERS) {
        expect(value).not.toContain(marker)
      }
    }
  })

  it('não contém os dados de teste das fixtures', async () => {
    const { profile, projects, skillGroups } = await importRealContent()

    expect(profile.name).not.toBe(profileFixture.name)
    expect(profile.role).not.toBe(profileFixture.role)
    expect(profile.summary).not.toBe(profileFixture.summary)
    expect(profile.location).not.toBe(profileFixture.location)

    for (const channel of profileFixture.social) {
      expect(profile.social.map((link) => `${link.label} ${link.url}`)).not.toContain(
        `${channel.label} ${channel.url}`,
      )
    }

    for (const project of projectsFixture) {
      expect(projects.map((item) => `${item.title} ${item.description}`)).not.toContain(
        `${project.title} ${project.description}`,
      )
    }

    for (const group of skillGroupsFixture) {
      expect(skillGroups.map((item) => `${item.title} ${item.skills.join(' ')}`)).not.toContain(
        `${group.title} ${group.skills.join(' ')}`,
      )
    }
  })
})
