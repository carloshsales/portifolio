import { act, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

interface ObserverEntry {
  id: string
  isIntersecting: boolean
}

interface ObserverOptions {
  root?: Element | Document | null
  rootMargin?: string
  threshold?: number | number[]
}

interface ObserverStub {
  emit: (entry: ObserverEntry) => void
  instances: StubObserver[]
}

interface StubObserver {
  options: ObserverOptions
  observed: Element[]
  disconnected: boolean
}

const originalIntersectionObserver = globalThis.IntersectionObserver
const originalClientHeight = Object.getOwnPropertyDescriptor(Document.prototype, 'clientHeight')
const originalClientWidth = Object.getOwnPropertyDescriptor(Document.prototype, 'clientWidth')

const VIEWPORT_HEIGHT = 800

/**
 * Altura da viewport simulada. `document.documentElement.clientHeight` é
 * a altura da área visível da página, que coincide com a raiz do
 * `IntersectionObserver` quando não existe `root` explícito.
 */
function setViewportHeight(height: number): void {
  Object.defineProperty(document.documentElement, 'clientHeight', {
    configurable: true,
    value: height,
  })
}

/**
 * Substitui o IntersectionObserver por um stub controlável, para
 * exercitar a seleção da secção ativa de forma determinística. Deve ser
 * instalado antes da renderização, porque o hook regista o observador
 * durante o efeito de montagem.
 */
function installIntersectionObserverStub(): ObserverStub {
  const callbacks: Array<(entries: IntersectionObserverEntry[]) => void> = []
  const instances: StubObserver[] = []

  class StubIntersectionObserver {
    options: ObserverOptions
    observed: Element[] = []
    disconnected = false

    constructor(
      callback: (entries: IntersectionObserverEntry[]) => void,
      options: ObserverOptions = {},
    ) {
      callbacks.push(callback)
      this.options = options
      instances.push(this)
    }

    observe(target: Element): void {
      this.observed.push(target)
    }

    unobserve(): void {}

    disconnect(): void {
      this.disconnected = true
    }

    takeRecords(): IntersectionObserverEntry[] {
      return []
    }
  }

  globalThis.IntersectionObserver =
    StubIntersectionObserver as unknown as typeof IntersectionObserver

  return {
    emit: (entry) => {
      const target = document.getElementById(entry.id)

      if (target === null) {
        return
      }

      for (const callback of callbacks) {
        callback([
          {
            target,
            isIntersecting: entry.isIntersecting,
          } as unknown as IntersectionObserverEntry,
        ])
      }
    },
    instances,
  }
}

/**
 * Resolve a margem da raiz do observador para a região de observação
 * efetiva, aplicando a regra da especificação: as percentagens são
 * resolvidas relativamente à largura da raiz, e não à altura.
 *
 * Devolve a faixa vertical observada, em pixels, com origem no topo da
 * raiz.
 */
function resolveObservedBand(options: ObserverOptions): {
  top: number
  bottom: number
  height: number
  rootHeight: number
} {
  const margin = options.rootMargin ?? '0px'
  const parts = margin.trim().split(/\s+/)

  const rootHeight = document.documentElement.clientHeight
  const rootWidth = document.documentElement.clientWidth

  // A margem segue a notação abreviada do CSS: 1, 2, 3 ou 4 valores
  // (topo, direita, fundo, esquerda). Só as componentes verticais
  // interessam para a faixa observada.
  const topValue = parts[0]
  const bottomValue = parts.length === 1 ? parts[0] : parts.length === 2 ? parts[0] : parts[2]

  const toPixels = (value: string, basis: number): number => {
    if (value.endsWith('%')) {
      return (parseFloat(value) / 100) * basis
    }

    return parseFloat(value)
  }

  const topMargin = toPixels(topValue, rootWidth)
  const bottomMargin = toPixels(bottomValue, rootWidth)

  return {
    top: -topMargin,
    bottom: rootHeight + bottomMargin,
    height: rootHeight + topMargin + bottomMargin,
    rootHeight,
  }
}

/**
 * Define a geometria para as secções, para que o desempate seja
 * exercitado contra posições reais e não contra valores por omissão.
 *
 * O valor devolvido é a função que restaura a implementação original.
 */
function stubSectionRects(tops: Record<string, number>): () => void {
  const originals = new Map<Element, Element['getBoundingClientRect']>()

  for (const [id, top] of Object.entries(tops)) {
    const element = document.getElementById(id)

    if (element === null) {
      continue
    }

    originals.set(element, element.getBoundingClientRect.bind(element))

    element.getBoundingClientRect = () =>
      ({
        top,
        bottom: top + 100,
        left: 0,
        right: 0,
        width: 0,
        height: 100,
        x: 0,
        y: top,
        toJSON: () => ({}),
      }) as DOMRect
  }

  return () => {
    for (const [element, original] of originals) {
      element.getBoundingClientRect = original
    }
  }
}

async function renderApp(): Promise<ReturnType<typeof render>> {
  const { default: AppComponent } = await import('./App')
  return render(<AppComponent />)
}

beforeEach(() => {
  vi.resetModules()
  setViewportHeight(VIEWPORT_HEIGHT)
})

afterEach(() => {
  vi.doUnmock('./data/profile')
  vi.doUnmock('./data/projects')
  vi.doUnmock('./data/skills')
  globalThis.IntersectionObserver = originalIntersectionObserver

  if (originalClientHeight === undefined) {
    Reflect.deleteProperty(document.documentElement, 'clientHeight')
  } else {
    Object.defineProperty(document.documentElement, 'clientHeight', originalClientHeight)
  }

  if (originalClientWidth === undefined) {
    Reflect.deleteProperty(document.documentElement, 'clientWidth')
  } else {
    Object.defineProperty(document.documentElement, 'clientWidth', originalClientWidth)
  }
})

describe('App', () => {
  it('renders the main heading', async () => {
    await renderApp()

    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
  })

  it('renders the home section heading', async () => {
    await renderApp()

    expect(screen.getByRole('heading', { level: 2, name: /início|portfólio/i })).toBeInTheDocument()
  })

  it('renders every portfolio section', async () => {
    await renderApp()

    expect(screen.getByRole('heading', { name: 'Projetos' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Habilidades' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Contato' })).toBeInTheDocument()
  })

  it('apresenta cada card de projeto com título h3 dentro da secção Projetos', async () => {
    vi.doMock('./data/projects', () => ({
      projects: [
        {
          title: 'Primeiro projeto',
          description: 'Descrição do primeiro projeto.',
          technologies: ['React'],
        },
        {
          title: 'Segundo projeto',
          description: 'Descrição do segundo projeto.',
          technologies: ['TypeScript'],
        },
      ],
    }))

    await renderApp()

    const section = screen.getByRole('region', { name: 'Projetos' })
    const cardTitles = within(section).getAllByRole('heading', { level: 3 })

    expect(within(section).getByRole('heading', { level: 2, name: 'Projetos' })).toBeInTheDocument()
    expect(cardTitles.map((title) => title.textContent)).toEqual([
      'Primeiro projeto',
      'Segundo projeto',
    ])
  })

  it('apresenta cada categoria de habilidades com título h3 na secção Habilidades', async () => {
    vi.doMock('./data/skills', () => ({
      skillGroups: [
        { title: 'Primeira categoria', skills: ['TypeScript'] },
        { title: 'Segunda categoria', skills: ['CSS'] },
      ],
    }))

    await renderApp()

    const section = screen.getByRole('region', { name: 'Habilidades' })
    const heading = within(section).getByRole('heading', { level: 2, name: 'Habilidades' })
    const groupTitles = within(section).getAllByRole('heading', { level: 3 })

    expect(heading).toBeInTheDocument()
    expect(groupTitles.map((title) => title.textContent)).toEqual([
      'Primeira categoria',
      'Segunda categoria',
    ])
  })

  it('renders navigation links to each section', async () => {
    await renderApp()

    const navigation = screen.getByRole('navigation', { name: /navegação principal/i })

    expect(navigation.querySelector('a[href="#inicio"]')).not.toBeNull()
    expect(navigation.querySelector('a[href="#projetos"]')).not.toBeNull()
    expect(navigation.querySelector('a[href="#habilidades"]')).not.toBeNull()
    expect(navigation.querySelector('a[href="#contato"]')).not.toBeNull()
  })

  it('marks exactly one navigation link with aria-current', async () => {
    await renderApp()

    const navigation = screen.getByRole('navigation', { name: /navegação principal/i })
    const current = navigation.querySelectorAll('a[aria-current="true"]')

    expect(current).toHaveLength(1)
    expect(current[0]).toHaveAttribute('href', '#inicio')
  })

  it('marks the active section with aria-current', async () => {
    const observer = installIntersectionObserverStub()

    await renderApp()

    act(() => {
      observer.emit({ id: 'projetos', isIntersecting: true })
      observer.emit({ id: 'inicio', isIntersecting: false })
    })

    const current = document.querySelectorAll('nav a[aria-current="true"]')
    expect(current).toHaveLength(1)
    expect(current[0]).toHaveAttribute('href', '#projetos')
  })

  it('resolves a tie between sections by the one closest to the top', async () => {
    const observer = installIntersectionObserverStub()

    await renderApp()

    // `projetos` está mais perto do topo do viewport do que `inicio`,
    // pelo que tem de prevalecer apesar de vir depois no DOM.
    const restore = stubSectionRects({ inicio: 40, projetos: 10 })

    act(() => {
      observer.emit({ id: 'inicio', isIntersecting: true })
      observer.emit({ id: 'projetos', isIntersecting: true })
    })

    restore()

    const current = document.querySelectorAll('nav a[aria-current="true"]')
    expect(current).toHaveLength(1)
    expect(current[0]).toHaveAttribute('href', '#projetos')
  })

  it('clears aria-current when no section intersects the observation band', async () => {
    const observer = installIntersectionObserverStub()

    await renderApp()

    act(() => {
      observer.emit({ id: 'inicio', isIntersecting: true })
      observer.emit({ id: 'projetos', isIntersecting: true })
    })

    expect(document.querySelectorAll('nav a[aria-current="true"]')).toHaveLength(1)

    act(() => {
      observer.emit({ id: 'inicio', isIntersecting: false })
      observer.emit({ id: 'projetos', isIntersecting: false })
    })

    expect(document.querySelectorAll('nav a[aria-current="true"]')).toHaveLength(0)
  })

  it('resolves a tie by DOM order when the sections share the same top', async () => {
    const observer = installIntersectionObserverStub()

    await renderApp()

    const restore = stubSectionRects({ inicio: 20, projetos: 20 })

    act(() => {
      observer.emit({ id: 'inicio', isIntersecting: true })
      observer.emit({ id: 'projetos', isIntersecting: true })
    })

    restore()

    const current = document.querySelectorAll('nav a[aria-current="true"]')
    expect(current).toHaveLength(1)
    expect(current[0]).toHaveAttribute('href', '#inicio')
  })

  it('keeps the link order of the sections in the navigation', async () => {
    await renderApp()

    const navigation = screen.getByRole('navigation', { name: /navegação principal/i })
    const hrefs = Array.from(navigation.querySelectorAll('a')).map((link) =>
      link.getAttribute('href'),
    )

    expect(hrefs).toEqual(['#inicio', '#projetos', '#habilidades', '#contato'])
  })

  it('renders the navigation icons as decorative', async () => {
    await renderApp()

    const navigation = screen.getByRole('navigation', { name: /navegação principal/i })
    const icons = navigation.querySelectorAll('svg')

    expect(icons).toHaveLength(4)

    for (const icon of icons) {
      expect(icon).toHaveAttribute('aria-hidden', 'true')
      expect(icon).toHaveAttribute('focusable', 'false')
    }
  })

  it('renders a skip link pointing to the main content', async () => {
    await renderApp()

    const skipLink = screen.getByRole('link', { name: /saltar para o conteúdo/i })

    expect(skipLink).toHaveAttribute('href', '#conteudo')
    expect(document.querySelector('main#conteudo')).toBeInTheDocument()
  })

  it('não renderiza fotografia quando o perfil não tem nome', async () => {
    vi.doMock('./data/profile', () => ({
      profile: {
        name: '',
        role: '',
        summary: '',
        photoUrl: '',
        location: '',
        social: [],
      },
    }))

    await renderApp()

    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })
})

describe('secção de contato', () => {
  it('apresenta a secção Contato com título h2 e um link por canal', async () => {
    vi.doMock('./data/profile', () => ({
      profile: {
        name: '',
        role: '',
        summary: '',
        photoUrl: '',
        location: '',
        social: [
          { label: 'GitHub', url: 'https://github.com/utilizador-teste', icon: 'github' },
          { label: 'Email', url: 'mailto:teste@exemplo.test', icon: 'email' },
        ],
      },
    }))

    await renderApp()

    const section = screen.getByRole('region', { name: 'Contato' })

    expect(within(section).getByRole('heading', { level: 2, name: 'Contato' })).toBeInTheDocument()
    expect(within(section).getAllByRole('link')).toHaveLength(2)
  })
})

describe('faixa central de observação', () => {
  it('observa uma faixa com 5% da altura da viewport, centrada', async () => {
    const observer = installIntersectionObserverStub()

    await renderApp()

    expect(observer.instances).toHaveLength(1)

    const band = resolveObservedBand(observer.instances[0].options)

    // A faixa observada tem 5% da ALTURA da viewport. Uma margem
    // percentual resolveria a vertical pela largura e produziria uma
    // faixa com a altura errada.
    expect(band.height).toBeCloseTo(VIEWPORT_HEIGHT * 0.05, 5)

    // A faixa é centrada: a distância ao topo é igual à distância ao
    // fundo.
    expect(band.top).toBeCloseTo(band.rootHeight - band.bottom, 5)
    expect(band.top).toBeCloseTo((VIEWPORT_HEIGHT - VIEWPORT_HEIGHT * 0.05) / 2, 5)
  })

  it('não usa percentagens na margem, porque seriam resolvidas pela largura', async () => {
    const observer = installIntersectionObserverStub()

    await renderApp()

    const raw = observer.instances[0].options.rootMargin ?? ''

    expect(raw).not.toContain('%')
  })

  it('observa uma faixa diferente quando a largura e a altura divergem', async () => {
    const observer = installIntersectionObserverStub()

    // Uma viewport estreita e baixa faz com que 5% da largura seja
    // diferente de 5% da altura. A faixa tem de seguir a altura.
    Object.defineProperty(document.documentElement, 'clientWidth', {
      configurable: true,
      value: 375,
    })

    await renderApp()

    const band = resolveObservedBand(observer.instances[0].options)

    expect(band.height).toBeCloseTo(VIEWPORT_HEIGHT * 0.05, 5)
    expect(band.height).not.toBeCloseTo(375 * 0.05, 5)
  })

  it('mantém a faixa central com 5% da altura depois de um redimensionamento', async () => {
    const observer = installIntersectionObserverStub()

    await renderApp()

    setViewportHeight(500)

    act(() => {
      window.dispatchEvent(new Event('resize'))
    })

    expect(observer.instances.length).toBeGreaterThanOrEqual(2)

    const band = resolveObservedBand(observer.instances[observer.instances.length - 1].options)

    expect(band.height).toBeCloseTo(500 * 0.05, 5)
    expect(band.top).toBeCloseTo(band.rootHeight - band.bottom, 5)
  })

  it('não recria o observador quando a altura da viewport não muda', async () => {
    const observer = installIntersectionObserverStub()

    await renderApp()

    act(() => {
      window.dispatchEvent(new Event('resize'))
      window.dispatchEvent(new Event('orientationchange'))
    })

    expect(observer.instances).toHaveLength(1)
  })

  it('observa as quatro secções', async () => {
    const observer = installIntersectionObserverStub()

    await renderApp()

    const observed = observer.instances[0].observed.map((element) => element.id)

    expect(observed).toEqual(['inicio', 'projetos', 'habilidades', 'contato'])
  })
})

describe('degradação do hook', () => {
  it('recorre à primeira secção quando não há IntersectionObserver', async () => {
    // @ts-expect-error -- remoção temporária para simular um ambiente sem suporte.
    delete globalThis.IntersectionObserver

    await renderApp()

    const current = document.querySelectorAll('nav a[aria-current="true"]')
    expect(current).toHaveLength(1)
    expect(current[0]).toHaveAttribute('href', '#inicio')
  })

  it('descarta o observador quando o componente é desmontado', async () => {
    const observer = installIntersectionObserverStub()

    const { unmount } = await renderApp()

    expect(observer.instances[0].disconnected).toBe(false)

    unmount()

    expect(observer.instances[0].disconnected).toBe(true)
  })
})
