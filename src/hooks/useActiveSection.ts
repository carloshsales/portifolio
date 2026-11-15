import { useEffect, useState } from 'react'

/**
 * Devolve o id da secção atualmente visível, para destacar o link ativo
 * na navegação. Faz fallback para a primeira secção quando o ambiente
 * não suporta IntersectionObserver (por exemplo, em testes).
 */
export function useActiveSection(ids: readonly string[]): string {
  const [activeId, setActiveId] = useState(ids[0] ?? '')

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') {
      return
    }

    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((element): element is HTMLElement => element !== null)

    if (elements.length === 0) {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        }
      },
      { rootMargin: '-40% 0px -55% 0px' },
    )

    for (const element of elements) {
      observer.observe(element)
    }

    return () => observer.disconnect()
  }, [ids])

  return activeId
}
