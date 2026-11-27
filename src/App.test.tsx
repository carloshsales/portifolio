import { fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const SECTION_ROUTES = [
  { path: '/', label: 'Início' },
  { path: '/projetos', label: 'Projetos' },
  { path: '/contato', label: 'Contato' },
  { path: '/jogos', label: 'Jogos' },
  { path: '/artigos', label: 'Artigos' },
  { path: '/experimentos', label: 'Experimentos' },
] as const

async function renderAt(path: string): Promise<ReturnType<typeof render>> {
  const { RouterProvider, createMemoryHistory, createRouter } =
    await import('@tanstack/react-router')
  const { routeTree } = await import('./router')
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [path] }),
  })

  await router.load()

  return render(<RouterProvider router={router} />)
}

function getNavigation(): HTMLElement {
  return screen.getByRole('navigation', { name: /navegação principal/i })
}

function getHomeSection(): HTMLElement {
  const section = document.querySelector<HTMLElement>('section#inicio')

  if (section === null) {
    throw new Error('Secção inicial não encontrada')
  }

  return section
}

beforeEach(() => {
  vi.resetModules()
})

afterEach(() => {
  vi.doUnmock('./data/profile')
  vi.doUnmock('./data/projects')
  vi.doUnmock('./data/skills')
})

describe('App', () => {
  it('renders the main heading', async () => {
    await renderAt('/')

    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
  })

  it('renders the home section heading', async () => {
    await renderAt('/')

    expect(screen.getByRole('heading', { level: 2, name: /início|portfólio/i })).toBeInTheDocument()
  })

  it.each(SECTION_ROUTES.slice(1))(
    'apresenta em $path um único h2, com o título $label',
    async ({ path, label }) => {
      await renderAt(path)

      const headings = screen.getAllByRole('heading', { level: 2 })

      expect(headings).toHaveLength(1)
      expect(headings[0].textContent).toBe(label)
    },
  )

  it('apresenta cada card de projeto com título h3 dentro da secção Projetos', async () => {
    vi.doMock('./data/projects', () => ({
      projects: [
        {
          title: 'Primeiro projeto',
          description: 'Descrição do primeiro projeto.',
          technologies: ['React'],
        },
        {
          title: 'Segundo projeto',
          description: 'Descrição do segundo projeto.',
          technologies: ['TypeScript'],
        },
      ],
    }))

    await renderAt('/projetos')

    const section = screen.getByRole('region', { name: 'Projetos' })
    const cardTitles = within(section).getAllByRole('heading', { level: 3 })

    expect(within(section).getByRole('heading', { level: 2, name: 'Projetos' })).toBeInTheDocument()
    expect(cardTitles.map((title) => title.textContent)).toEqual([
      'Primeiro projeto',
      'Segundo projeto',
    ])
  })

  it('apresenta cada categoria de habilidades com título h4 na secção Início', async () => {
    vi.doMock('./data/skills', () => ({
      skillGroups: [
        {
          title: 'Primeira categoria',
          skills: [
            {
              name: 'TypeScript',
              description: 'Linguagem tipada.',
              usage: 'Em todo o código.',
              application: 'applied',
            },
          ],
        },
        {
          title: 'Segunda categoria',
          skills: [
            {
              name: 'CSS',
              description: 'Folha de estilos.',
              usage: 'Nos módulos.',
              application: 'experienced',
            },
          ],
        },
      ],
    }))

    await renderAt('/')

    const section = getHomeSection()
    const heading = within(section).getByRole('heading', { level: 3, name: 'Habilidades' })
    const groupTitles = within(section).getAllByRole('heading', { level: 4 })

    expect(heading).toBeInTheDocument()
    expect(groupTitles.map((title) => title.textContent)).toEqual([
      'Primeira categoria',
      'Segunda categoria',
    ])
  })

  it('renders navigation links to each route', async () => {
    await renderAt('/')

    const navigation = getNavigation()

    for (const { path } of SECTION_ROUTES) {
      expect(navigation.querySelector(`a[href="${path}"]`)).not.toBeNull()
    }
  })

  it.each(SECTION_ROUTES)(
    'marca apenas o link de $path com aria-current="page" quando essa rota está visitada',
    async ({ path }) => {
      await renderAt(path)

      const current = getNavigation().querySelectorAll('a[aria-current="page"]')

      expect(current).toHaveLength(1)
      expect(current[0]).toHaveAttribute('href', path)
    },
  )

  it('keeps the link order of the routes in the navigation', async () => {
    await renderAt('/')

    const hrefs = Array.from(getNavigation().querySelectorAll('a')).map((link) =>
      link.getAttribute('href'),
    )

    expect(hrefs).toEqual(SECTION_ROUTES.map(({ path }) => path))
  })

  it('mantém as classes base no link activo, para que o item não perca o layout', async () => {
    await renderAt('/projetos')

    const current = getNavigation().querySelector('a[aria-current="page"]')

    expect(current).not.toBeNull()

    // O `activeProps.className` é acrescentado ao `className` base pelo
    // router. Se deixasse de o ser, o item activo perdia o `display: flex`,
    // o `gap` e o `padding`, e o alinhamento dos ícones partir-se-ia.
    const className = current?.className ?? ''

    expect(className.split(/\s+/).filter(Boolean).length).toBeGreaterThanOrEqual(2)
  })

  it('renders one decorative icon per navigation link', async () => {
    await renderAt('/')

    const navigation = getNavigation()
    const links = Array.from(navigation.querySelectorAll('a'))

    expect(links).toHaveLength(SECTION_ROUTES.length)
    expect(navigation.querySelectorAll('svg')).toHaveLength(SECTION_ROUTES.length)

    for (const link of links) {
      const icons = link.querySelectorAll('svg')

      expect(icons).toHaveLength(1)
      expect(icons[0]).toHaveAttribute('aria-hidden', 'true')
      expect(icons[0]).toHaveAttribute('focusable', 'false')
    }
  })

  it('renders a skip link pointing to the main content', async () => {
    await renderAt('/')

    const skipLink = screen.getByRole('link', { name: /saltar para o conteúdo/i })

    expect(skipLink).toHaveAttribute('href', '#conteudo')
    expect(document.querySelector('main#conteudo')).toBeInTheDocument()
  })

  it('não renderiza fotografia quando o perfil não tem nome', async () => {
    vi.doMock('./data/profile', () => ({
      profile: {
        name: '',
        role: '',
        summary: '',
        photoUrl: '',
        location: '',
        social: [],
      },
    }))

    await renderAt('/')

    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })
})

describe('secção de contato', () => {
  it('apresenta a secção Contato com título h2 e um link por canal', async () => {
    vi.doMock('./data/profile', () => ({
      profile: {
        name: '',
        role: '',
        summary: '',
        photoUrl: '',
        location: '',
        social: [
          { label: 'GitHub', url: 'https://github.com/utilizador-teste', icon: 'github' },
          { label: 'Email', url: 'mailto:teste@exemplo.test', icon: 'email' },
        ],
      },
    }))

    await renderAt('/contato')

    const section = screen.getByRole('region', { name: 'Contato' })

    expect(within(section).getByRole('heading', { level: 2, name: 'Contato' })).toBeInTheDocument()
    expect(within(section).getAllByRole('link')).toHaveLength(2)
  })
})

describe('ações da secção inicial', () => {
  it('o CTA Ver projetos navega para a página de projetos', async () => {
    vi.doMock('./data/projects', () => ({
      projects: [
        {
          title: 'Projeto de teste',
          description: 'Descrição de teste para o CTA.',
          technologies: ['React'],
        },
      ],
    }))

    await renderAt('/')

    const link = within(getHomeSection()).getByRole('link', { name: 'Ver projetos' })

    expect(link).toHaveAttribute('href', '/projetos')
    fireEvent.click(link)

    expect(await screen.findByRole('heading', { level: 2, name: 'Projetos' })).toBeInTheDocument()
  })

  it('o CTA Contato navega para a página de contato', async () => {
    vi.doMock('./data/profile', () => ({
      profile: {
        name: '',
        role: '',
        summary: '',
        photoUrl: '',
        location: '',
        social: [{ label: 'GitHub', url: 'https://github.com/utilizador-teste', icon: 'github' }],
      },
    }))

    await renderAt('/')

    const link = within(getHomeSection()).getByRole('link', { name: 'Contato' })

    expect(link).toHaveAttribute('href', '/contato')
    fireEvent.click(link)

    expect(await screen.findByRole('heading', { level: 2, name: 'Contato' })).toBeInTheDocument()
  })
})
