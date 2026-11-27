import type { ComponentType } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { profile } from '../data/profile'
import {
  ArticlesIcon,
  ContactIcon,
  ExperimentsIcon,
  GamesIcon,
  HomeIcon,
  ProjectsIcon,
} from './icons'
import styles from './Sidebar.module.css'

type SectionPath = '/' | '/projetos' | '/contato' | '/jogos' | '/artigos' | '/experimentos'

interface NavItem {
  to: SectionPath
  label: string
  icon: ComponentType<{ className?: string }>
}

const NAV_ITEMS: readonly NavItem[] = [
  { to: '/', label: 'Início', icon: HomeIcon },
  { to: '/projetos', label: 'Projetos', icon: ProjectsIcon },
  { to: '/contato', label: 'Contato', icon: ContactIcon },
  { to: '/jogos', label: 'Jogos', icon: GamesIcon },
  { to: '/artigos', label: 'Artigos', icon: ArticlesIcon },
  { to: '/experimentos', label: 'Experimentos', icon: ExperimentsIcon },
]

export function Sidebar() {
  const navigate = useNavigate()
  const hasName = profile.name.trim() !== ''
  const name = hasName ? profile.name : 'Início'

  return (
    <aside className={styles.sidebar}>
      <h1 className={styles.brand}>
        {/*
         * A marca é um link para a raiz, mas não é um item de navegação.
         * Por isso não usa o `Link` do router: esse componente aplica
         * `aria-current="page"` automaticamente quando o link está
         * activo, e o `aria-current` identifica o item de menu da secção
         * actual. A âncora navega pelo router, para não recarregar o
         * documento, mas sem marcar o estado activo.
         */}
        <a
          href="/"
          className={styles.brandLink}
          onClick={(event) => {
            // Com uma tecla modificadora, o clique mantém o comportamento
            // nativo do browser: abrir num novo separador.
            if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
              return
            }

            event.preventDefault()
            void navigate({ to: '/' })
          }}
        >
          {name}
        </a>
      </h1>

      {hasName ? (
        <div className={styles.identity}>
          <p className={styles.name}>{profile.name}</p>
          <p className={styles.role}>{profile.role}</p>
        </div>
      ) : null}

      <nav className={styles.nav} aria-label="Navegação principal">
        <ul className={styles.navList} role="list">
          {NAV_ITEMS.map(({ to, label, icon: NavIcon }) => (
            <li key={to} className={styles.navItem}>
              <Link
                to={to}
                activeOptions={{ exact: true }}
                activeProps={{ className: styles.navLinkActive }}
                className={styles.navLink}
                aria-label={label}
              >
                <NavIcon className={styles.navIcon} />
                <span className={styles.navLabel}>{label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}
