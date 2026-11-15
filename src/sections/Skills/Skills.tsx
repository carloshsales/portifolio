import { skillGroups } from '../../data/skills'
import { Section } from '../../components/Section'
import styles from './Skills.module.css'

export function Skills() {
  return (
    <Section id="habilidades" title="Habilidades" subtitle="Tecnologias com que trabalho.">
      {skillGroups.length === 0 ? (
        <p className={styles.empty}>Ainda não há habilidades para apresentar.</p>
      ) : (
        <div className={styles.groups}>
          {skillGroups.map((group) => (
            <div key={group.title} className={styles.group}>
              <h3 className={styles.groupTitle}>{group.title}</h3>
              <ul className={styles.skillList}>
                {group.skills.map((skill) => (
                  <li key={skill} className={styles.skill}>
                    {skill}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </Section>
  )
}
