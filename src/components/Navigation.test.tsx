import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import Navigation from './Navigation'

const sections = [
  { id: 'inicio', label: 'Início' },
  { id: 'projetos', label: 'Projetos' },
  { id: 'jogos', label: 'Jogos' },
  { id: 'artigos', label: 'Artigos' },
  { id: 'experimentos', label: 'Experimentos' },
  { id: 'contato', label: 'Contato' },
]

describe('Navigation', () => {
  it('renders the six section buttons', () => {
    render(<Navigation active="inicio" onNavigate={() => {}} />)

    expect(screen.getAllByRole('button')).toHaveLength(sections.length)
  })

  it('renders an icon in each button', () => {
    render(<Navigation active="inicio" onNavigate={() => {}} />)

    for (const button of screen.getAllByRole('button')) {
      expect(button.querySelector('svg')).not.toBeNull()
    }
  })

  it('marks the active section', () => {
    render(<Navigation active="inicio" onNavigate={() => {}} />)

    expect(screen.getByRole('button', { name: 'Início' })).toHaveAttribute('aria-current', 'true')
  })

  it('keeps the accessible name of each button', () => {
    render(<Navigation active="inicio" onNavigate={() => {}} />)

    for (const section of sections) {
      expect(screen.getByRole('button', { name: section.label })).toBeInTheDocument()
    }
  })

  it('calls onNavigate when a section is activated', async () => {
    const user = userEvent.setup()
    const onNavigate = vi.fn()
    render(<Navigation active="inicio" onNavigate={onNavigate} />)

    await user.click(screen.getByRole('button', { name: 'Projetos' }))

    expect(onNavigate).toHaveBeenCalledWith('projetos')
  })
})
