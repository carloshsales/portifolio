import { Outlet, createRootRoute } from '@tanstack/react-router'
import { Sidebar } from '../components/Sidebar'
import styles from './__root.module.css'

function RootLayout() {
  return (
    <div className={styles.shell}>
      <a href="#conteudo" className={styles.skipLink}>
        Saltar para o conteúdo
      </a>

      <Sidebar />

      <main id="conteudo" className={styles.main} tabIndex={-1}>
        <Outlet />
      </main>
    </div>
  )
}

export const rootRoute = createRootRoute({
  component: RootLayout,
})
