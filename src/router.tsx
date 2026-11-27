import { createRouter } from '@tanstack/react-router'
import { rootRoute } from './routes/__root'
import { Route as indexRoute } from './routes/index'
import { Route as projetosRoute } from './routes/projetos'
import { Route as contatoRoute } from './routes/contato'
import { Route as jogosRoute } from './routes/jogos'
import { Route as artigosRoute } from './routes/artigos'
import { Route as experimentosRoute } from './routes/experimentos'

export const routeTree = rootRoute.addChildren([
  indexRoute,
  projetosRoute,
  contatoRoute,
  jogosRoute,
  artigosRoute,
  experimentosRoute,
])

// A área de conteúdo tem a sua própria barra de rolagem e volta ao topo ao mudar de página.
export const router = createRouter({
  routeTree,
  scrollToTopSelectors: ['window', '#conteudo'],
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
