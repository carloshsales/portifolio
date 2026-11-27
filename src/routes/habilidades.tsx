import { createRoute } from '@tanstack/react-router'
import { Skills } from '../sections/Skills/Skills'
import { rootRoute } from './__root'

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/habilidades',
  component: Skills,
})
