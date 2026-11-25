import { projects } from '../../data/projects'
import { Section } from '../../components/Section'
import { ExternalLinkIcon, GithubIcon } from '../../components/icons'
import styles from './Projects.module.css'

export function Projects() {
  return (
    <Section id="projetos" title="Projetos" subtitle="O que construí e como construí.">
      {projects.length === 0 ? (
        <p className={styles.empty}>Ainda não há projetos para apresentar.</p>
      ) : (
        <ul className={styles.list} role="list">
          {projects.map((project) => (
            <li key={project.title} className={styles.card}>
              <h3 className={styles.cardTitle}>{project.title}</h3>
              <p className={styles.cardDescription}>{project.description}</p>

              <ul className={styles.techList} role="list" aria-label="Tecnologias utilizadas">
                {project.technologies.map((technology) => (
                  <li key={technology} className={styles.tech}>
                    {technology}
                  </li>
                ))}
              </ul>

              <div className={styles.links}>
                {project.repositoryUrl ? (
                  <a
                    href={project.repositoryUrl}
                    className={styles.link}
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    <GithubIcon className={styles.linkIcon} />
                    Código
                  </a>
                ) : null}
                {project.liveUrl ? (
                  <a
                    href={project.liveUrl}
                    className={styles.link}
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    <ExternalLinkIcon className={styles.linkIcon} />
                    Demonstração
                  </a>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Section>
  )
}
