import { profile } from '../../data/profile'
import { skillCategories } from '../../data/skills'
import Section from '../../components/Section'
import styles from './Home.module.css'

type HomeProps = {
  onNavigate: (id: string) => void
}

export default function Home({ onNavigate }: HomeProps) {
  return (
    <Section id="inicio" title="Início">
      <div className={styles.home}>
        <img
          className={styles.photo}
          src={profile.photo}
          alt={profile.photoAlt}
          width={480}
          height={480}
        />

        <div className={styles.content}>
          <h3 className={styles.name}>{profile.name}</h3>
          <p className={styles.role}>{profile.role}</p>
          <p className={styles.bio}>{profile.bio}</p>

          <div className={styles.skills}>
            {skillCategories.map((category) => (
              <div key={category.title} className={styles.skillCategory}>
                <h4 className={styles.skillTitle}>{category.title}</h4>
                <ul className={styles.skillList}>
                  {category.skills.map((skill) => (
                    <li key={skill} className={styles.skill}>
                      {skill}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.primaryAction}
              onClick={() => onNavigate('projetos')}
            >
              Ver projetos
            </button>
            <button
              type="button"
              className={styles.secondaryAction}
              onClick={() => onNavigate('contato')}
            >
              Entrar em contato
            </button>
          </div>
        </div>
      </div>
    </Section>
  )
}
