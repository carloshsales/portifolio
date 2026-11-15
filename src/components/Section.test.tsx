import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import Section from './Section'

describe('Section', () => {
  it('renders the title and the children', () => {
    render(
      <Section id="teste" title="Teste">
        <p>Conteúdo de teste</p>
      </Section>,
    )

    expect(screen.getByRole('heading', { name: 'Teste' })).toBeInTheDocument()
    expect(screen.getByText('Conteúdo de teste')).toBeInTheDocument()
  })

  it('associates the section with its title', () => {
    render(
      <Section id="teste" title="Teste">
        <p>Conteúdo</p>
      </Section>,
    )

    expect(document.getElementById('teste')).toHaveAttribute('aria-labelledby', 'teste-titulo')
  })

  it('renders a focusable scrollable area', () => {
    render(
      <Section id="teste" title="Teste">
        <p>Conteúdo</p>
      </Section>,
    )

    const scroll = document.getElementById('teste')?.querySelector('[tabindex="0"]')
    expect(scroll).not.toBeNull()
  })
})
