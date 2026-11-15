import { useState } from 'react'
import type { ComponentType } from 'react'
import Navigation from './components/Navigation'
import Home from './sections/Home/Home'
import Projects from './sections/Projects/Projects'
import Games from './sections/Games/Games'
import Articles from './sections/Articles/Articles'
import Experiments from './sections/Experiments/Experiments'
import Contact from './sections/Contact/Contact'
import styles from './App.module.css'

type SectionComponent = ComponentType<{ onNavigate: (id: string) => void }>

const sections: { id: string; component: SectionComponent }[] = [
  { id: 'inicio', component: Home },
  { id: 'projetos', component: Projects },
  { id: 'jogos', component: Games },
  { id: 'artigos', component: Articles },
  { id: 'experimentos', component: Experiments },
  { id: 'contato', component: Contact },
]

function App() {
  const [active, setActive] = useState('inicio')
  const ActiveSection = sections.find((section) => section.id === active)?.component ?? Home

  return (
    <div className={styles.app}>
      <Navigation active={active} onNavigate={setActive} />
      <main className={styles.main}>
        <ActiveSection onNavigate={setActive} />
      </main>
    </div>
  )
}

export default App
