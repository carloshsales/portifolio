import type { ComponentType } from 'react'
import { profile } from '../data/profile'
import { useActiveSection } from '../hooks/useActiveSection'
import { ContactIcon, HomeIcon, ProjectsIcon, SkillsIcon } from './icons'
import styles from './Sidebar.module.css'

const SECTION_IDS = ['inicio', 'projetos', 'habilidades', 'contato'] as const

interface NavItem {
  id: string
  label: string
  icon: ComponentType<{ className?: string }>
}

const NAV_ITEMS: NavItem[] = [
  { id: 'inicio', label: 'Início', icon: HomeIcon },
  { id: 'projetos', label: 'Projetos', icon: ProjectsIcon },
  { id: 'habilidades', label: 'Habilidades', icon: SkillsIcon },
  { id: 'contato', label: 'Contato', icon: ContactIcon },
]

const FALLBACK_NAME = 'Portfólio'

export function Sidebar() {
  const activeId = useActiveSection(SECTION_IDS)
  const name = profile.name.trim() !== '' ? profile.name : FALLBACK_NAME

  return (
    <aside className={styles.sidebar}>
      <h1 className={styles.brand}>
        <a href="#inicio" className={styles.brandLink}>
          {name}
        </a>
      </h1>

      {profile.name.trim() !== '' || profile.role.trim() !== '' ? (
        <div className={styles.identity}>
          <p className={styles.name}>{profile.name}</p>
          <p className={styles.role}>{profile.role}</p>
        </div>
      ) : null}

      <nav className={styles.nav} aria-label="Navegação principal">
        <ul className={styles.navList}>
          {NAV_ITEMS.map(({ id, label, icon: NavIcon }) => {
            const isActive = id === activeId

            return (
              <li key={id} className={styles.navItem}>
                <a
                  href={`#${id}`}
                  className={
                    isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink
                  }
                  aria-current={isActive ? 'true' : undefined}
                >
                  <NavIcon className={styles.navIcon} />
                  <span>{label}</span>
                </a>
              </li>
            )
          })}
        </ul>
      </nav>
    </aside>
  )
}
