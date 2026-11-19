import { render } from '@testing-library/react'
import { axe } from 'vitest-axe'
import { describe, expect, it } from 'vitest'
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
