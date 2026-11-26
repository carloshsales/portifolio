import { createRoute } from '@tanstack/react-router'
import { Section } from '../components/Section'
import { rootRoute } from './__root'

function ExperimentsPage() {
  return (
    <Section id="experimentos" title="Experimentos">
      <p>A seção de Experimentos ainda não tem conteúdo.</p>
    </Section>
  )
}

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/experimentos',
  component: ExperimentsPage,
})
