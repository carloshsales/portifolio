import { profile } from '../../data/profile'
import { projects } from '../../data/projects'
import { Section } from '../../components/Section'
import styles from './Home.module.css'

export function Home() {
  const hasName = profile.name.trim() !== ''
  const hasSummary = profile.summary.trim() !== ''
  const hasProjects = projects.length > 0
  const hasContacts = profile.social.length > 0
  const title = hasName ? profile.name : 'Início'

  return (
    <Section id="inicio" title={title} subtitle={profile.role}>
      <div className={styles.hero}>
        {hasName ? (
          <img
            src={profile.photoUrl}
            alt={`Fotografia de ${profile.name}`}
            className={styles.photo}
            width={240}
            height={240}
          />
        ) : null}

        <div className={styles.content}>
          {hasSummary ? <p className={styles.summary}>{profile.summary}</p> : null}

          {hasProjects || hasContacts ? (
            <div className={styles.actions}>
              {hasProjects ? (
                <a href="#projetos" className={styles.primary}>
                  Ver projetos
                </a>
              ) : null}
              {hasContacts ? (
                <a href="#contato" className={styles.secondary}>
                  Contato
                </a>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </Section>
  )
}
