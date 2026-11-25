import type { ComponentType } from 'react'
import { profile } from '../../data/profile'
import { Section } from '../../components/Section'
import { EmailIcon, GithubIcon, LinkedinIcon } from '../../components/icons'
import type { SocialIcon } from '../../types'
import styles from './Contact.module.css'

const ICONS: Record<SocialIcon, ComponentType<{ className?: string }>> = {
  github: GithubIcon,
  linkedin: LinkedinIcon,
  email: EmailIcon,
}

const MAILTO_PATTERN = /^mailto:/i

export function Contact() {
  return (
    <Section id="contato" title="Contato" subtitle="Onde você pode me encontrar.">
      {profile.social.length === 0 ? (
        <p className={styles.empty}>Ainda não há canais de contato para apresentar.</p>
      ) : (
        <ul className={styles.list} role="list">
          {profile.social.map((link) => {
            const LinkIcon = ICONS[link.icon]
            const opensInNewWindow = !MAILTO_PATTERN.test(link.url)

            return (
              <li key={`${link.label}|${link.url}`}>
                <a
                  href={link.url}
                  className={styles.link}
                  target={opensInNewWindow ? '_blank' : undefined}
                  rel={opensInNewWindow ? 'noreferrer noopener' : undefined}
                >
                  <LinkIcon className={styles.icon} />
                  <span>{link.label}</span>
                </a>
              </li>
            )
          })}
        </ul>
      )}
    </Section>
  )
}
