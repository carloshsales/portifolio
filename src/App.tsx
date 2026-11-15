import { Sidebar } from './components/Sidebar'
import { Home } from './sections/Home/Home'
import { Projects } from './sections/Projects/Projects'
import { Skills } from './sections/Skills/Skills'
import { Contact } from './sections/Contact/Contact'
import styles from './App.module.css'

function App() {
  return (
    <div className={styles.shell}>
      <a href="#conteudo" className={styles.skipLink}>
        Saltar para o conteúdo
      </a>

      <Sidebar />

      <main id="conteudo" className={styles.main} tabIndex={-1}>
        <Home />
        <Projects />
        <Skills />
        <Contact />
      </main>
    </div>
  )
}

export default App
