import NavIcon from './NavIcon'
import type { NavIconName } from './NavIcon'
import styles from './Navigation.module.css'

const links: { id: NavIconName; label: string }[] = [
  { id: 'inicio', label: 'Início' },
  { id: 'projetos', label: 'Projetos' },
  { id: 'jogos', label: 'Jogos' },
  { id: 'artigos', label: 'Artigos' },
  { id: 'experimentos', label: 'Experimentos' },
  { id: 'contato', label: 'Contato' },
]

type NavigationProps = {
  active: string
  onNavigate: (id: string) => void
}

export default function Navigation({ active, onNavigate }: NavigationProps) {
  return (
    <nav className={styles.navigation} aria-label="Navegação principal">
      <ul className={styles.list}>
        {links.map((link) => (
          <li key={link.id} className={styles.item}>
            <button
              type="button"
              className={`${styles.link} ${active === link.id ? styles.linkActive : ''}`}
              aria-current={active === link.id ? 'true' : undefined}
              onClick={() => onNavigate(link.id)}
            >
              <span className={styles.icon}>
                <NavIcon name={link.id} />
              </span>
              <span className={styles.label}>{link.label}</span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  )
}
