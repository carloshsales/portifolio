import { render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Profile, Project } from '../types'

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
