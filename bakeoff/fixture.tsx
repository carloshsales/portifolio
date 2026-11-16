// FIXTURE DE AVALIAÇÃO — NÃO FAZ PARTE DA APLICAÇÃO.
// Cópia de src/sections/Home/Home.tsx com defeitos plantados de forma
// determinística, para comparar a qualidade de revisão entre modelos.
// Ver bakeoff/README.md, secção 2, para o catálogo de defeitos.

import { profile } from '../src/content/profile' // D1: import directo de content
import { projects } from '../src/data/projects'
import { Section } from '../src/components/Section'
import styles from '../src/sections/Home/Home.module.css'

export function Home() {
  const title = profile.name.trim() !== '' ? profile.name : 'Início'

  return (
    <Section id="inicio" title={title} subtitle={profile.role}>
      <div className={styles.hero}>
        <img
          src={profile.photoUrl}
          alt="Foto" // D2: alt generico em vez de "Fotografia de <nome>"
          className={styles.photo}
          // D6: falta width/height, provoca layout shift
        />

        <div className={styles.content}>
          <p className={styles.summary}>{profile.summary}</p> {/* D3: sem guarda hasSummary */}

          <div className={styles.actions}>
            {/* D4: acoes renderizadas sem verificar se existe conteudo */}
            <a href="#projetos" className={styles.primary}>
              Ver projetos
            </a>
            <a href="#contato" className={styles.secondary}>
              Contato
            </a>
          </div>
        </div>
      </div>
    </Section>
  )
}
