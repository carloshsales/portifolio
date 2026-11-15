import type { ReactNode } from 'react'
import styles from './Section.module.css'

interface SectionProps {
  id: string
  title: string
  subtitle?: string
  children: ReactNode
}

export function Section({ id, title, subtitle, children }: SectionProps) {
  const titleId = `${id}-title`

  return (
    <section id={id} aria-labelledby={titleId} className={styles.section}>
      <div className={styles.inner}>
        <header className={styles.header}>
          <h2 id={titleId} className={styles.title}>
            {title}
          </h2>
          {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
        </header>
        {children}
      </div>
    </section>
  )
}
