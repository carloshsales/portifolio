import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from '../App'

const PLACEHOLDER_MARKERS = ['[', 'teu-utilizador', 'exemplo.com', 'teu@email.com']

describe('conteúdo do utilizador', () => {
  it('não renderiza marcadores de placeholder', () => {
    const { container } = render(<App />)
    const text = container.textContent ?? ''

    for (const marker of PLACEHOLDER_MARKERS) {
      expect(text).not.toContain(marker)
    }
  })

  it('não renderiza ligações com URL de exemplo', () => {
    const { container } = render(<App />)
    const links = Array.from(container.querySelectorAll('a[href]'))

    for (const link of links) {
      const href = link.getAttribute('href') ?? ''
      expect(href).not.toContain('teu-utilizador')
      expect(href).not.toContain('exemplo.com')
      expect(href).not.toContain('teu@email.com')
    }
  })

  it('mostra a fotografia com texto alternativo', () => {
    render(<App />)

    expect(screen.getByRole('img', { name: /fotografia/i })).toBeInTheDocument()
  })
})
