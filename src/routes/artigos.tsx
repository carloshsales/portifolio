import { createRoute } from '@tanstack/react-router'
import { Section } from '../components/Section'
import { rootRoute } from './__root'

function ArticlesPage() {
  return (
    <Section id="artigos" title="Artigos">
      <p>A seção de Artigos ainda não tem conteúdo.</p>
    </Section>
  )
}

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/artigos',
  component: ArticlesPage,
})
