import { createRoute } from '@tanstack/react-router'
import { Section } from '../components/Section'
import { rootRoute } from './__root'

function GamesPage() {
  return (
    <Section id="jogos" title="Jogos">
      <p>A seção de Jogos ainda não tem conteúdo.</p>
    </Section>
  )
}

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/jogos',
  component: GamesPage,
})
