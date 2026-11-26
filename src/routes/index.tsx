import { createRoute } from '@tanstack/react-router'
import { Home } from '../sections/Home/Home'
import { rootRoute } from './__root'

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: Home,
})
