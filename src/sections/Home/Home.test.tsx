import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import Home from './Home'
import { profile } from '../../data/profile'
import { skillCategories } from '../../data/skills'

describe('Home', () => {
  it('renders the professional presentation', () => {
    render(<Home onNavigate={() => {}} />)

    expect(screen.getByRole('heading', { name: profile.name })).toBeInTheDocument()
    expect(screen.getByText(profile.role)).toBeInTheDocument()
    expect(screen.getByText(profile.bio)).toBeInTheDocument()
  })

  it('renders the photograph with accessible alt text', () => {
    render(<Home onNavigate={() => {}} />)

    const photo = screen.getByRole('img', { name: profile.photoAlt })

    expect(photo).toHaveAttribute('src', profile.photo)
  })

  it('renders the skills by category', () => {
    render(<Home onNavigate={() => {}} />)

    for (const category of skillCategories) {
      expect(screen.getByText(category.title)).toBeInTheDocument()

      for (const skill of category.skills) {
        expect(screen.getByText(skill)).toBeInTheDocument()
      }
    }
  })

  it('navigates when the calls to action are clicked', async () => {
    const user = userEvent.setup()
    const onNavigate = vi.fn()
    render(<Home onNavigate={onNavigate} />)

    await user.click(screen.getByRole('button', { name: 'Ver projetos' }))
    expect(onNavigate).toHaveBeenCalledWith('projetos')

    await user.click(screen.getByRole('button', { name: 'Entrar em contato' }))
    expect(onNavigate).toHaveBeenCalledWith('contato')
  })
})
