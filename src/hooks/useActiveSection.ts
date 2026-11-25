import { useEffect, useRef, useState } from 'react'

/**
 * Proporção da altura da viewport ocupada pela faixa central de
 * observação.
 *
 * A faixa fica centrada verticalmente e só altera o destaque ativo
 * quando outra secção a atravessa, pelo que microdeslocamentos do scroll
 * não provocam mudanças de estado.
 *
 * A faixa tem de ser expressa em pixels: segundo a especificação do
 * `IntersectionObserver`, as percentagens de `rootMargin` são resolvidas
 * relativamente à largura da raiz, e não à altura. Uma percentagem
 * vertical produziria, por isso, uma faixa com 5% da largura de altura,
 * e não 5% da altura da viewport.
 */
const BAND_RATIO = 0.05

/**
 * Calcula a margem da raiz do observador para a faixa central de 5% da
 * altura da viewport, em pixels.
 *
 * Devolve `null` quando não é possível determinar a altura da viewport,
 * para que o observador seja criado sem margem.
 */
function computeRootMargin(viewportHeight: number): string | null {
  if (!Number.isFinite(viewportHeight) || viewportHeight <= 0) {
    return null
  }

  const band = viewportHeight * BAND_RATIO
  const offset = (viewportHeight - band) / 2

  // A margem encolhe a raiz pela metade em cima e pela metade em baixo,
  // deixando a faixa central com `band` pixels de altura.
  return `-${offset}px 0px -${offset}px 0px`
}

/**
 * Altura da viewport usada como raiz do observador.
 *
 * `document.documentElement.clientHeight` é a altura da área visível da
 * página, que coincide com a raiz do `IntersectionObserver` quando não
 * existe `root` explícito.
 */
function readViewportHeight(): number | null {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return null
  }

  const height = document.documentElement.clientHeight || window.innerHeight

  return Number.isFinite(height) && height > 0 ? height : null
}

/**
 * Desempate entre secções que intersectam a faixa central: prevalece a
 * secção mais próxima do topo do viewport; em empate, prevalece a que
 * aparece antes no DOM.
 */
function pickClosestToTop(
  candidates: readonly HTMLElement[],
  order: readonly string[],
): HTMLElement | undefined {
  let best: { element: HTMLElement; top: number } | undefined

  for (const element of candidates) {
    const top = element.getBoundingClientRect().top

    if (best === undefined || top < best.top) {
      best = { element, top }
    } else if (top === best.top && order.indexOf(element.id) < order.indexOf(best.element.id)) {
      best = { element, top }
    }
  }

  return best?.element
}

/**
 * Devolve o id da secção atualmente visível, para destacar o link ativo
 * na navegação. Faz fallback para a primeira secção quando o ambiente
 * não suporta `IntersectionObserver` (por exemplo, em testes ou durante
 * a renderização no servidor).
 */
export function useActiveSection(ids: readonly string[]): string {
  const [activeId, setActiveId] = useState(ids[0] ?? '')
  const activeIdRef = useRef(activeId)

  useEffect(() => {
    activeIdRef.current = activeId
  }, [activeId])

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

    // Secções que intersectam a faixa central neste momento. O observer
    // só notifica as secções cuja interseção mudou, pelo que o conjunto
    // completo tem de ser mantido entre notificações.
    const intersecting = new Set<string>()

    const resolve = (): void => {
      const candidates = elements.filter((element) => intersecting.has(element.id))
      const nextActiveId = pickClosestToTop(candidates, ids)?.id ?? ''

      if (nextActiveId !== activeIdRef.current) {
        activeIdRef.current = nextActiveId
        setActiveId(nextActiveId)
      }
    }

    const handleEntries = (entries: IntersectionObserverEntry[]): void => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          intersecting.add(entry.target.id)
        } else {
          intersecting.delete(entry.target.id)
        }
      }

      resolve()
    }

    let observer: IntersectionObserver | null = null
    let currentMargin: string | null = null

    const observe = (): void => {
      const margin = computeRootMargin(readViewportHeight() ?? 0)

      if (margin === currentMargin && observer !== null) {
        return
      }

      currentMargin = margin
      observer?.disconnect()
      observer = new IntersectionObserver(handleEntries, {
        rootMargin: margin ?? '0px',
      })

      for (const element of elements) {
        observer.observe(element)
      }
    }

    observe()

    // A faixa depende da altura da viewport. Uma mudança de altura, por
    // redimensionamento ou mudança de orientação, altera a margem em
    // pixels e obriga a recriar o observador. A margem só é recriada
    // quando o valor muda, pelo que não há listeners nem observadores
    // duplicados.
    const handleViewportChange = (): void => {
      observe()
    }

    window.addEventListener('resize', handleViewportChange)
    window.addEventListener('orientationchange', handleViewportChange)

    return () => {
      window.removeEventListener('resize', handleViewportChange)
      window.removeEventListener('orientationchange', handleViewportChange)
      observer?.disconnect()
      observer = null
      intersecting.clear()
    }
  }, [ids])

  return activeId
}
