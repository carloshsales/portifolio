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
})
