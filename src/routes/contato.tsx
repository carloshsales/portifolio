import { createRoute } from '@tanstack/react-router'
import { Contact } from '../sections/Contact/Contact'
import { rootRoute } from './__root'

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/contato',
  component: Contact,
})
