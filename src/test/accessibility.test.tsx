import { render } from '@testing-library/react'
import { axe } from 'vitest-axe'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App'

describe('acessibilidade', () => {
  it('não apresenta violações automáticas de acessibilidade', async () => {
    const { container } = render(<App />)

    const results = await axe(container)

    expect(results.violations).toEqual([])
  })

  it('não apresenta violações automáticas em cada secção', async () => {
    const { container } = render(<App />)
    const sections = Array.from(container.querySelectorAll('section'))

    expect(sections.length).toBeGreaterThan(0)

    for (const section of sections) {
      const results = await axe(section)

      expect(results.violations).toEqual([])
    }
  })

  it('não apresenta violações automáticas na navegação', async () => {
    const { container } = render(<App />)
    const navigation = container.querySelector('nav')

    expect(navigation).not.toBeNull()

    const results = await axe(navigation as HTMLElement)

    expect(results.violations).toEqual([])
  })

  it('não apresenta violações automáticas na barra lateral', async () => {
    const { container } = render(<App />)
    const sidebar = container.querySelector('aside')

    expect(sidebar).not.toBeNull()

    const results = await axe(sidebar as HTMLElement)

    expect(results.violations).toEqual([])
  })

  it('não apresenta violações automáticas no link de salto', async () => {
    const { container } = render(<App />)
    const skipLink = container.querySelector('a[href="#conteudo"]')

    expect(skipLink).not.toBeNull()

    const results = await axe(skipLink as HTMLElement)

    expect(results.violations).toEqual([])
  })

  it('não apresenta violações automáticas na navegação com a secção ativa', async () => {
    const { container } = render(<App />)
    const navigation = container.querySelector('nav')
    const active = navigation?.querySelector('a[aria-current="true"]')

    expect(active).not.toBeNull()

    const results = await axe(navigation as HTMLElement)

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
    const { default: FilledApp } = await import('../App')
    const { container } = render(<FilledApp />)

    const results = await axe(container)

    expect(results.violations).toEqual([])
  })

  it('não apresenta violações automáticas na secção de projetos preenchida', async () => {
    const { default: FilledApp } = await import('../App')
    const { container } = render(<FilledApp />)
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
        { title: 'Categoria de teste', skills: ['TypeScript', 'React'] },
        { title: 'Outra categoria de teste', skills: ['CSS'] },
      ],
    }))
  })

  afterEach(() => {
    vi.doUnmock('../data/skills')
  })

  it('não apresenta violações automáticas com habilidades preenchidas', async () => {
    const { default: FilledApp } = await import('../App')
    const { container } = render(<FilledApp />)

    const results = await axe(container)

    expect(results.violations).toEqual([])
  })

  it('não apresenta violações automáticas na secção de habilidades preenchida', async () => {
    const { default: FilledApp } = await import('../App')
    const { container } = render(<FilledApp />)
    const section = container.querySelector('section#habilidades')

    expect(section).not.toBeNull()

    const results = await axe(section as HTMLElement)

    expect(results.violations).toEqual([])
  })
})
