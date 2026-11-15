import { profile } from '../../data/profile'
import { Section } from '../../components/Section'
import styles from './Home.module.css'

export function Home() {
  return (
    <Section id="inicio" title={profile.name} subtitle={profile.role}>
      <div className={styles.hero}>
        <img
          src={profile.photoUrl}
          alt={`Fotografia de ${profile.name}`}
          className={styles.photo}
          width={240}
          height={240}
        />

        <div className={styles.content}>
          <p className={styles.summary}>{profile.summary}</p>

          <div className={styles.actions}>
            <a href="#projetos" className={styles.primary}>
              Ver projetos
            </a>
            <a href="#contato" className={styles.secondary}>
              Contacto
            </a>
          </div>
        </div>
      </div>
    </Section>
  )
}
