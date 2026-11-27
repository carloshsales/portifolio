import { render } from '@testing-library/react'
import { axe } from 'vitest-axe'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const SECTION_PATHS = ['/', '/projetos', '/contato', '/jogos', '/artigos', '/experimentos'] as const

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

describe('acessibilidade', () => {
  it('não apresenta violações automáticas de acessibilidade', async () => {
    const { container } = await renderAt('/')

    const results = await axe(container)

    expect(results.violations).toEqual([])
  })

  it('não apresenta violações automáticas em cada secção', async () => {
    const { container } = await renderAt('/')
    const sections = Array.from(container.querySelectorAll('section'))

    expect(sections.length).toBeGreaterThan(0)

    for (const section of sections) {
      const results = await axe(section)

      expect(results.violations).toEqual([])
    }
  })

  it('não apresenta violações automáticas na navegação', async () => {
    const { container } = await renderAt('/')
    const navigation = container.querySelector('nav')

    expect(navigation).not.toBeNull()

    const results = await axe(navigation as HTMLElement)

    expect(results.violations).toEqual([])
  })

  it('não apresenta violações automáticas na barra lateral', async () => {
    const { container } = await renderAt('/')
    const sidebar = container.querySelector('aside')

    expect(sidebar).not.toBeNull()

    const results = await axe(sidebar as HTMLElement)

    expect(results.violations).toEqual([])
  })

  it('não apresenta violações automáticas no link de salto', async () => {
    const { container } = await renderAt('/')
    const skipLink = container.querySelector('a[href="#conteudo"]')

    expect(skipLink).not.toBeNull()

    const results = await axe(skipLink as HTMLElement)

    expect(results.violations).toEqual([])
  })

  it('não apresenta violações automáticas na navegação com a rota ativa', async () => {
    const { container } = await renderAt('/')
    const navigation = container.querySelector('nav')
    const active = navigation?.querySelector('a[aria-current="page"]')

    expect(active).not.toBeNull()

    const results = await axe(navigation as HTMLElement)

    expect(results.violations).toEqual([])
  })
})

describe('acessibilidade em cada página', () => {
  it.each(SECTION_PATHS)('não apresenta violações automáticas na página %s', async (path) => {
    const { container } = await renderAt(path)

    const results = await axe(container)

    expect(results.violations).toEqual([])
  })
})

describe('acessibilidade com projetos preenchidos', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.doMock('../data/projects', () => ({
      projects: [
        {
          title: 'Projeto de teste',
          description: 'Descrição de teste para um projeto com links.',
          technologies: ['React', 'TypeScript'],
          repositoryUrl: 'https://repositorio.test/projeto-teste',
          liveUrl: 'https://demo.test/projeto-teste',
        },
      ],
    }))
  })

  afterEach(() => {
    vi.doUnmock('../data/projects')
  })

  it('não apresenta violações automáticas com projetos preenchidos', async () => {
    const { container } = await renderAt('/projetos')

    const results = await axe(container)

    expect(results.violations).toEqual([])
  })

  it('não apresenta violações automáticas na secção de projetos preenchida', async () => {
    const { container } = await renderAt('/projetos')
    const section = container.querySelector('section#projetos')

    expect(section).not.toBeNull()

    const results = await axe(section as HTMLElement)

    expect(results.violations).toEqual([])
  })
})

describe('acessibilidade com habilidades preenchidas', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.doMock('../data/skills', () => ({
      skillGroups: [
        {
          title: 'Categoria de teste',
          skills: [
            {
              name: 'TypeScript',
              description: 'Linguagem tipada.',
              usage: 'Em todo o código.',
              application: 'applied',
            },
            {
              name: 'React',
              description: 'Biblioteca de UI.',
              usage: 'Nos componentes.',
              application: 'experienced',
            },
          ],
        },
        {
          title: 'Outra categoria de teste',
          skills: [
            {
              name: 'CSS',
              description: 'Folha de estilos.',
              usage: 'Nos módulos.',
              application: 'applied',
            },
          ],
        },
      ],
    }))
  })

  afterEach(() => {
    vi.doUnmock('../data/skills')
  })

  it('não apresenta violações automáticas com habilidades preenchidas', async () => {
    const { container } = await renderAt('/')

    const results = await axe(container)

    expect(results.violations).toEqual([])
  })

  it('não apresenta violações automáticas no bloco de habilidades preenchido', async () => {
    const { container } = await renderAt('/')
    const section = container.querySelector('section#inicio')

    expect(section).not.toBeNull()

    const results = await axe(section as HTMLElement)

    expect(results.violations).toEqual([])
  })
})

describe('acessibilidade com canais de contato preenchidos', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.doMock('../data/profile', () => ({
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
  })

  afterEach(() => {
    vi.doUnmock('../data/profile')
  })

  it('não apresenta violações automáticas com canais de contato preenchidos', async () => {
    const { container } = await renderAt('/contato')

    const results = await axe(container)

    expect(results.violations).toEqual([])
  })

  it('não apresenta violações automáticas na secção de contato preenchida', async () => {
    const { container } = await renderAt('/contato')
    const section = container.querySelector('section#contato')

    expect(section).not.toBeNull()

    const results = await axe(section as HTMLElement)

    expect(results.violations).toEqual([])
  })
})
