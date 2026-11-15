import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App', () => {
  it('renders the main navigation', () => {
    render(<App />)

    expect(screen.getByRole('navigation', { name: /navegação principal/i })).toBeInTheDocument()
  })

  it('renders only the active section', () => {
    render(<App />)

    expect(document.getElementById('inicio')).toBeInTheDocument()
    expect(document.getElementById('projetos')).not.toBeInTheDocument()
  })

  it('switches sections when navigating', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Projetos' }))

    expect(document.getElementById('projetos')).toBeInTheDocument()
    expect(document.getElementById('inicio')).not.toBeInTheDocument()
  })
})
