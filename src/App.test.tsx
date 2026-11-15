import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App', () => {
  it('renders the main heading', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: /portfólio/i })).toBeInTheDocument()
  })

  it('renders every portfolio section', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: 'Projetos' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Habilidades' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Contato' })).toBeInTheDocument()
  })

  it('renders navigation links to each section', () => {
    render(<App />)

    const navigation = screen.getByRole('navigation', { name: /navegação principal/i })

    expect(navigation.querySelector('a[href="#inicio"]')).not.toBeNull()
    expect(navigation.querySelector('a[href="#projetos"]')).not.toBeNull()
    expect(navigation.querySelector('a[href="#habilidades"]')).not.toBeNull()
    expect(navigation.querySelector('a[href="#contato"]')).not.toBeNull()
  })

  it('renders the profile photo with alternative text', () => {
    render(<App />)

    expect(screen.getByRole('img', { name: /fotografia/i })).toBeInTheDocument()
  })
})
