import { createRoute } from '@tanstack/react-router'
import { Projects } from '../sections/Projects/Projects'
import { rootRoute } from './__root'

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/projetos',
  component: Projects,
})
