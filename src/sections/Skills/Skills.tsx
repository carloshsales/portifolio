import { skillGroups } from '../../data/skills'
import styles from './Skills.module.css'

export function Skills() {
  return (
    <div className={styles.skills}>
      <h3 className={styles.title}>Habilidades</h3>

      {skillGroups.length === 0 ? (
        <p className={styles.empty}>Ainda não há habilidades para apresentar.</p>
      ) : (
        <div className={styles.groups}>
          {skillGroups.map((group) => (
            <div key={group.title} className={styles.group}>
              <h4 className={styles.groupTitle}>{group.title}</h4>
              <ul className={styles.skillList} role="list">
                {group.skills.map((skill) => (
                  <li key={skill.name} className={styles.skillItem}>
                    <details className={styles.details}>
                      <summary className={styles.summary}>
                        <span className={styles.skillName}>{skill.name}</span>
                        <span className={styles.indicator} aria-hidden="true" />
                      </summary>
                      <div className={styles.panel}>
                        <p className={styles.description}>{skill.description}</p>
                        <p className={styles.usage}>
                          {skill.application === 'applied' ? (
                            <span className={styles.usageLabel}>Aplicado nesse Portfólio</span>
                          ) : null}
                          {skill.usage}
                        </p>
                      </div>
                    </details>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
