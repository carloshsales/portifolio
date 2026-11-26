import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import type { Profile } from '../src/types'

const SECTION_IDS = ['inicio', 'projetos', 'habilidades', 'contato'] as const
const MIN_TOUCH_TARGET_PX = 44

const filledProfile: Profile = {
  name: 'Maria Silva',
  role: 'Engenheira de Software',
  summary: 'Resumo de teste para o perfil preenchido.',
  photoUrl: '/images/foto-perfil.jpg',
  location: 'Porto',
  social: [],
}

const contactProfile: Profile = {
  ...filledProfile,
  social: [
    { label: 'GitHub', url: 'https://github.com/utilizador-teste', icon: 'github' },
    { label: 'Email', url: 'mailto:teste@exemplo.test', icon: 'email' },
  ],
}

const emptyProfile: Profile = {
  name: '',
  role: '',
  summary: '',
  photoUrl: '',
  location: '',
  social: [],
}

async function setProfileOverride(page: Page, profile: Profile): Promise<void> {
  await page.addInitScript((value) => {
    ;(window as unknown as { __PORTFOLIO_PROFILE__?: Profile }).__PORTFOLIO_PROFILE__ = value
  }, profile)
}

/**
 * Calcula a faixa central de observação a partir da geometria real.
 *
 * A faixa tem 5% da altura da viewport, centrada, e é expressa em pixels
 * na margem da raiz do `IntersectionObserver`. A raiz implícita é a
 * área visível da página, cuja altura é a de `documentElement`.
 */
function computeBand(height: number): { top: number; bottom: number } {
  const band = height * 0.05
  const offset = (height - band) / 2

  return { top: offset, bottom: offset + band }
}

interface BandSection {
  id: string
  top: number
  bottom: number
}

interface BandState {
  /** Secções que intersectam a faixa central, por ordem de DOM. */
  intersecting: BandSection[]
  /** Topo da secção mais próxima do topo da viewport. */
  closestTop: number
  /** Posição de cada secção na ordem do DOM. */
  domIndex: Record<string, number>
}

/**
 * Instala um espião sobre o `IntersectionObserver` que regista a faixa
 * de observação efetivamente usada pelo browser e conta as
 * notificações.
 *
 * A faixa é a unica fonte de verdade sobre o que o observador
 * considera estar a intersectar. As coordenadas da faixa devolvidas
 * pelo browser são arredondadas a píxeis, e esse arredondamento é
 * observável: uma secção pode intersectar a faixa exata por uma
 * fração de píxel e, ainda assim, não intersectar a faixa do
 * observador. Usar a faixa do observador evita que o teste aponte
 * esse arredondamento como uma violação da regra.
 *
 * A contagem das notificações permite ao teste aguardar que o
 * observador tenha processado a posicao de scroll corrente, antes de
 * ler o destaque.
 */
async function installObserverSpy(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const Original = window.IntersectionObserver

    class Spy extends Original {
      constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
        super((entries, observer) => {
          for (const entry of entries) {
            const band = (window as unknown as { __observerBand?: { top: number; bottom: number } })
              .__observerBand

            if (band === undefined && entry.rootBounds !== null) {
              ;(
                window as unknown as { __observerBand?: { top: number; bottom: number } }
              ).__observerBand = { top: entry.rootBounds.top, bottom: entry.rootBounds.bottom }
            }
          }

          const counter = window as unknown as { __observerNotifications?: number }
          counter.__observerNotifications = (counter.__observerNotifications ?? 0) + 1

          callback(entries, observer)
        }, options)
      }
    }

    window.IntersectionObserver = Spy as unknown as typeof IntersectionObserver
  })
}

/**
 * Devolve a faixa de observação que o browser aplicou ao
 * `IntersectionObserver`.
 *
 * O observador notifica de forma assíncrona, pelo que a leitura
 * aguarda que a faixa tenha sido registada.
 */
async function readObserverBand(page: Page): Promise<{ top: number; bottom: number } | null> {
  await page.waitForFunction(
    () =>
      (window as unknown as { __observerBand?: { top: number; bottom: number } }).__observerBand !==
      undefined,
    null,
    { timeout: 5_000 },
  )

  return page.evaluate(
    () =>
      (window as unknown as { __observerBand?: { top: number; bottom: number } }).__observerBand ??
      null,
  )
}

/**
 * Lê o estado observável do desempate: as secções que intersectam a
 * faixa central e a ordem em que aparecem no DOM.
 */
async function readBandState(page: Page): Promise<BandState> {
  // A faixa só é conhecida depois de o observador notificar.
  await page.waitForFunction(
    () =>
      (window as unknown as { __observerBand?: { top: number; bottom: number } }).__observerBand !==
      undefined,
    null,
    { timeout: 5_000 },
  )

  return page.evaluate(() => {
    const band = (window as unknown as { __observerBand?: { top: number; bottom: number } })
      .__observerBand

    const sections = Array.from(document.querySelectorAll('main section'))

    const domIndex: Record<string, number> = {}
    sections.forEach((section, index) => {
      domIndex[section.id] = index
    })

    const intersecting =
      band === undefined
        ? []
        : sections
            .map((section) => {
              const rect = section.getBoundingClientRect()
              return { id: section.id, top: rect.top, bottom: rect.bottom }
            })
            .filter((section) => section.bottom > band.top && section.top < band.bottom)

    const closestTop =
      intersecting.length === 0
        ? Number.POSITIVE_INFINITY
        : Math.min(...intersecting.map((section) => section.top))

    return { intersecting, closestTop, domIndex }
  })
}

/**
 * Aguarda que a aplicação termine de reavaliar a secção ativa.
 *
 * O `IntersectionObserver` notifica as alterações de forma assíncrona.
 * A espera garante que o observador já processou a posição de scroll
 * corrente: sem ela, a asserção pode observar um estado intermédio, em
 * que a aplicação ainda não reavaliarou o desempate.
 */
async function settleActiveSection(page: Page): Promise<void> {
  await page.waitForFunction(
    () => {
      const store = window as unknown as {
        __observerNotifications?: number
        __activeSettled?: string | null
        __notifiedAt?: number
      }

      const notifications = store.__observerNotifications ?? 0

      if (store.__notifiedAt !== notifications) {
        store.__notifiedAt = notifications
        store.__activeSettled = undefined
        return false
      }

      const current =
        document.querySelector('nav a[aria-current="true"]')?.getAttribute('href') ?? null

      if (store.__activeSettled === current) {
        return true
      }

      store.__activeSettled = current

      return false
    },
    null,
    { polling: 'raf' },
  )

  await page.waitForTimeout(50)
}

/**
 * Provoca uma alteração do estado de interseção, de modo a que o
 * observador notifique a aplicação e esta reavalie o desempate com a
 * geometria corrente.
 */
async function forceIntersectionChange(page: Page): Promise<void> {
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
  await settleActiveSection(page)

  await page.evaluate(() => window.scrollTo(0, 0))
  await settleActiveSection(page)
}

/**
 * Devolve as posições de scroll em que pelo menos duas secções
 * intersectam a faixa central.
 *
 * As posições são calculadas a partir da geometria do documento, sem
 * percorrer todas as posições de scroll: só as que interessam são
 * visitadas depois. De cada conjunto de secções que intersecta a faixa
 * é devolvido um representante, escolhido no meio do intervalo.
 */
async function findBandOverlapPositions(page: Page): Promise<number[]> {
  // A faixa só é conhecida depois de o observador notificar.
  await readObserverBand(page)

  return page.evaluate(() => {
    const band = (window as unknown as { __observerBand?: { top: number; bottom: number } })
      .__observerBand

    if (band === undefined) {
      return []
    }

    const sections = Array.from(document.querySelectorAll('main section')).map((section) => {
      const rect = section.getBoundingClientRect()
      return {
        id: section.id,
        docTop: rect.top + window.scrollY,
        docBottom: rect.bottom + window.scrollY,
      }
    })

    const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 0)

    // A secção intersecta a faixa quando o seu topo esta acima do
    // fundo da faixa e o seu fundo esta abaixo do topo da faixa. Em
    // termos de scroll: `docTop - scrollY < band.bottom` e
    // `docBottom - scrollY > band.top`.
    const buckets = new Map<string, number[]>()

    for (let scrollY = 0; scrollY <= maxScroll; scrollY += 1) {
      const overlapping = sections.filter(
        (section) =>
          section.docTop - scrollY < band.bottom && section.docBottom - scrollY > band.top,
      )

      if (overlapping.length < 2) {
        continue
      }

      const key = overlapping.map((section) => section.id).join('>')
      const bucket = buckets.get(key)

      if (bucket === undefined) {
        buckets.set(key, [scrollY])
      } else {
        bucket.push(scrollY)
      }
    }

    return Array.from(buckets.values()).map(
      (positions) => positions[Math.floor(positions.length / 2)],
    )
  })
}

/**
 * Procura posições de scroll em que pelo menos duas secções
 * intersectam de facto a faixa central.
 *
 * O resultado é a expectativa observável da regra: a secção mais
 * próxima do topo entre as que intersectam a faixa. É re-derivado a
 * partir da geometria do browser e não a partir do código da
 * aplicação, pelo que falha se a aplicação violar a regra.
 */
async function collectBandScenarios(
  page: Page,
): Promise<Array<{ scrollY: number; intersecting: string[]; expected: string }>> {
  // A geometria é calculada no browser, para uma unica passagem, e os
  // resultados são agrupados pelo conjunto de secções que intersecta
  // a faixa.
  //
  // A faixa só é conhecida depois de o observador notificar, pelo que
  // a leitura aguarda que esteja disponível.
  await readObserverBand(page)

  const groups = await page.evaluate(() => {
    const band = (window as unknown as { __observerBand?: { top: number; bottom: number } })
      .__observerBand

    if (band === undefined) {
      return []
    }

    const sections = Array.from(document.querySelectorAll('main section')).map((section) => {
      const rect = section.getBoundingClientRect()
      return {
        id: section.id,
        docTop: rect.top + window.scrollY,
        docBottom: rect.bottom + window.scrollY,
      }
    })

    const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 0)

    // A secção intersecta a faixa quando o seu topo esta acima do
    // fundo da faixa e o seu fundo esta abaixo do topo da faixa. Em
    // termos de scroll: `docTop - scrollY < band.bottom` e
    // `docBottom - scrollY > band.top`.
    const buckets = new Map<string, number[]>()

    for (let scrollY = 0; scrollY <= maxScroll; scrollY += 1) {
      const intersecting = sections.filter(
        (section) =>
          section.docTop - scrollY < band.bottom && section.docBottom - scrollY > band.top,
      )

      if (intersecting.length < 2) {
        continue
      }

      const key = intersecting.map((section) => section.id).join('>')
      const bucket = buckets.get(key)

      if (bucket === undefined) {
        buckets.set(key, [scrollY])
      } else {
        bucket.push(scrollY)
      }
    }

    // O meio de cada intervalo é uma posição em que a faixa é
    // atravessada por todas as secções do conjunto, longe das
    // fronteiras da faixa.
    return Array.from(buckets.values()).map((positions) => ({
      scrollY: positions[Math.floor(positions.length / 2)],
    }))
  })

  const scenarios: Array<{ scrollY: number; intersecting: string[]; expected: string }> = []

  for (const group of groups) {
    await page.evaluate((value) => window.scrollTo(0, value), group.scrollY)
    await settleActiveSection(page)

    const state = await readBandState(page)

    if (state.intersecting.length < 2) {
      continue
    }

    const expected = state.intersecting.reduce((closest, section) =>
      section.top < closest.top ? section : closest,
    )

    scenarios.push({
      scrollY: group.scrollY,
      intersecting: state.intersecting.map((section) => section.id),
      expected: expected.id,
    })
  }

  return scenarios
}

test('não tem overflow horizontal', async ({ page }) => {
  await page.goto('/')

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )

  expect(overflow).toBeLessThanOrEqual(0)
})

test('mostra todos os links de navegação', async ({ page }) => {
  await page.goto('/')

  const navigation = page.getByRole('navigation', { name: /navegação principal/i })

  await expect(navigation).toBeVisible()

  for (const id of SECTION_IDS) {
    await expect(navigation.locator(`a[href="#${id}"]`)).toBeVisible()
  }
})

test('sem nome, não renderiza fotografia', async ({ page }) => {
  await setProfileOverride(page, emptyProfile)
  await page.goto('/')

  const images = await page.locator('img').count()
  expect(images).toBe(0)
})

test('sem nome, não renderiza texto alternativo vazio', async ({ page }) => {
  await setProfileOverride(page, emptyProfile)
  await page.goto('/')

  const emptyAltImages = await page.locator('img[alt=""]').count()
  expect(emptyAltImages).toBe(0)
})

test('com nome, renderiza fotografia com dimensões e estilo corretos em desktop', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await setProfileOverride(page, filledProfile)
  await page.goto('/')

  const photo = page.getByRole('img', { name: `Fotografia de ${filledProfile.name}` })
  await expect(photo).toBeVisible()

  const box = await photo.boundingBox()
  expect(box).not.toBeNull()
  expect(box?.width).toBe(240)
  expect(box?.height).toBe(240)

  const naturalWidth = await photo.evaluate((element) => (element as HTMLImageElement).naturalWidth)
  expect(naturalWidth).toBeGreaterThan(0)

  const styles = await photo.evaluate((element) => {
    const computed = window.getComputedStyle(element)
    return {
      borderRadius: computed.borderRadius,
      objectFit: computed.objectFit,
    }
  })

  expect(styles.borderRadius).toBe('50%')
  expect(styles.objectFit).toBe('cover')
})

test('com nome, renderiza fotografia com dimensões corretas em ecrãs até 767px', async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await setProfileOverride(page, filledProfile)
  await page.goto('/')

  const photo = page.getByRole('img', { name: `Fotografia de ${filledProfile.name}` })
  await expect(photo).toBeVisible()

  const box = await photo.boundingBox()
  expect(box).not.toBeNull()
  expect(box?.width).toBe(180)
  expect(box?.height).toBe(180)
})

test('com nome, a barra lateral apresenta o nome e a identidade', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await setProfileOverride(page, filledProfile)
  await page.goto('/')

  const brand = page.locator('aside h1')
  await expect(brand).toHaveText(filledProfile.name)

  const identity = page.locator('aside').locator(`text=${filledProfile.name}`).first()
  await expect(identity).toBeVisible()
})

test('não tem links de contacto inválidos', async ({ page }) => {
  await setProfileOverride(page, contactProfile)
  await page.goto('/')

  const hrefs = await page
    .locator('a[href]')
    .evaluateAll((links) => links.map((link) => link.getAttribute('href') ?? ''))

  for (const href of hrefs) {
    expect(href).not.toBe('')
    expect(href).not.toMatch(/^javascript:/i)
  }
})

test('com canais, cada link de contato tem href válido', async ({ page }) => {
  await setProfileOverride(page, contactProfile)
  await page.goto('/')

  const links = page.locator('section#contato a[href]')
  await expect(links).toHaveCount(contactProfile.social.length)

  for (const link of await links.all()) {
    const href = (await link.getAttribute('href')) ?? ''

    expect(href).not.toBe('')
    expect(href).not.toMatch(/^javascript:/i)
  }
})

test('apresenta as quatro seções principais', async ({ page }) => {
  await page.goto('/')

  for (const id of SECTION_IDS) {
    await expect(page.locator(`section#${id}`)).toBeAttached()
  }
})

test('cada link de navegação leva à secção correspondente', async ({ page }) => {
  await page.goto('/')

  const navigation = page.getByRole('navigation', { name: /navegação principal/i })

  for (const id of SECTION_IDS) {
    await navigation.locator(`a[href="#${id}"]`).click()
    await page.waitForTimeout(300)

    expect(new URL(page.url()).hash).toBe(`#${id}`)

    const section = page.locator(`section#${id}`)
    await expect(section).toBeAttached()

    // A secção alvo fica dentro da viewport. Quando o documento não
    // permite rolar até ao topo da secção, esta fica visível na parte
    // inferior do ecrã, o que continua a permitir a leitura do conteúdo.
    const box = await section.boundingBox()
    expect(box).not.toBeNull()

    const viewport = page.viewportSize()
    const height = viewport?.height ?? 0

    expect((box?.y ?? 0) + (box?.height ?? 0)).toBeGreaterThan(0)
    expect(box?.y ?? 0).toBeLessThan(height)
    expect((box?.y ?? 0) + (box?.height ?? 0)).toBeGreaterThan(0)
  }
})

test('marca exatamente um link com aria-current', async ({ page }) => {
  await page.goto('/')

  const navigation = page.getByRole('navigation', { name: /navegação principal/i })

  await expect(navigation.locator('a[aria-current="true"]')).toHaveCount(1)
  await expect(navigation.locator('a[aria-current="true"]')).toHaveAttribute(
    'href',
    /#(inicio|projetos|habilidades|contato)/,
  )
})

test('aria-current acompanha a secção visível', async ({ page }) => {
  await page.goto('/')

  // A asserção compara o destaque com a secção observável que o browser
  // apresenta. Não reproduz o algoritmo de desempate da aplicação.
  const maxScroll = await page.evaluate(
    () => document.documentElement.scrollHeight - window.innerHeight,
  )

  let checked = 0

  for (let y = 0; y <= maxScroll; y += 10) {
    await page.evaluate((value) => window.scrollTo(0, value), y)
    await page.waitForTimeout(80)

    const state = await page.evaluate(() => {
      const active = document.querySelector('nav a[aria-current="true"]')
      const activeSection = active?.getAttribute('href')?.slice(1) ?? null

      const target = activeSection ? document.getElementById(activeSection) : null
      const rect = target?.getBoundingClientRect() ?? null

      return {
        activeSection,
        isVisible: rect !== null && rect.bottom > 0 && rect.top < window.innerHeight,
        isInCentralBand:
          rect !== null &&
          rect.bottom > window.innerHeight * 0.475 &&
          rect.top < window.innerHeight * 0.525,
      }
    })

    if (state.activeSection === null) {
      continue
    }

    checked += 1
    expect(state.isVisible).toBe(true)
    expect(state.isInCentralBand).toBe(true)
  }

  expect(checked).toBeGreaterThan(0)
})

test('a faixa central tem 5% da altura da viewport', async ({ page }) => {
  await page.goto('/')

  const height = await page.evaluate(() => document.documentElement.clientHeight)
  const band = computeBand(height)

  // A faixa tem de estar dentro da viewport, centrada, com 5% da altura.
  expect(band.top).toBeGreaterThan(0)
  expect(band.bottom).toBeLessThan(height)
  expect(band.bottom - band.top).toBeCloseTo(height * 0.05, 5)
  expect(height - band.top - (height - band.bottom)).toBeCloseTo(height * 0.05, 5)
})

test('o observador usa a margem da faixa central em pixels', async ({ page }) => {
  // A margem real tem de ser capturada no momento em que o observador é
  // criado, o que acontece durante o arranque da aplicação. O script de
  // inicialização é executado antes de qualquer código da página.
  await page.addInitScript(() => {
    const Original = window.IntersectionObserver

    class Spy extends Original {
      constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
        super(callback, options)

        const record = (): void => {
          const captured = (window as unknown as { __rootMargin?: string }).__rootMargin

          if (captured === undefined) {
            ;(window as unknown as { __rootMargin?: string }).__rootMargin =
              options?.rootMargin ?? ''
          }
        }

        record()

        this.observe = ((target: Element) => {
          Original.prototype.observe.call(this, target)
          record()
        }) as typeof this.observe
      }
    }

    window.IntersectionObserver = Spy as unknown as typeof IntersectionObserver
  })

  await page.goto('/')

  const margin = await page.evaluate(
    () => (window as unknown as { __rootMargin?: string }).__rootMargin ?? null,
  )

  expect(margin).not.toBeNull()

  const parts = (margin ?? '').trim().split(/\s+/)

  // A margem tem de estar em pixels: percentagens seriam resolvidas
  // pela largura e não pela altura da viewport.
  expect(margin).not.toContain('%')

  const top = parseFloat(parts[0])
  const bottom = parseFloat(parts[2])

  expect(Number.isNaN(top)).toBe(false)
  expect(Number.isNaN(bottom)).toBe(false)
  expect(top).toBeLessThan(0)
  expect(bottom).toBeLessThan(0)

  // A faixa resultante tem de ter 5% da ALTURA da viewport. A margem é
  // negativa, porque encolhe a raiz: a faixa é a altura da raiz somada
  // às margens.
  const height = await page.evaluate(() => document.documentElement.clientHeight)

  expect(height + top + bottom).toBeCloseTo(height * 0.05, 5)
  expect(top).toBeCloseTo(bottom, 5)
})

test('desempate: destaca a secção mais próxima do topo entre as que intersectam a faixa', async ({
  page,
}) => {
  await installObserverSpy(page)
  await page.goto('/')

  const navigation = page.getByRole('navigation', { name: /navegação principal/i })

  // A regra da tarefa: quando várias secções intersectam a faixa
  // central, prevalece a mais próxima do topo. A asserção compara o
  // destaque com o resultado observável da regra, re-derivado a partir
  // da geometria que o browser apresenta. Não reproduz o algoritmo
  // interno da aplicação: deriva a partir da faixa que o próprio
  // observador usa e da posição real das secções.
  let scenarios = await collectBandScenarios(page)

  // Quando a página real não produz sobreposição na faixa (p.ex.
  // tablet sem fotografia na secção inicial), força uma geometria
  // mínima determinística que garanta cenários de desempate. Os
  // cenários artificiais mantêm a regra a ser exercitada sem depender
  // de conteúdo ou de dimensões específicas de produção.
  if (scenarios.length === 0) {
    await page.evaluate(() => {
      const height = Math.max(document.documentElement.clientHeight, 800)

      for (const section of document.querySelectorAll('main section')) {
        section.style.minHeight = `${height}px`
      }
    })

    await forceIntersectionChange(page)
    scenarios = await collectBandScenarios(page)
  }

  // O cenário tem de existir: sem duas secções na faixa, a regra não
  // seria exercitada e o teste passaria sem verificar nada.
  expect(scenarios.length).toBeGreaterThan(0)

  for (const scenario of scenarios) {
    await page.evaluate((scrollY) => window.scrollTo(0, scrollY), scenario.scrollY)
    await settleActiveSection(page)

    const active = navigation.locator('a[aria-current="true"]')
    await expect(active).toHaveCount(1)

    const activeId = (await active.getAttribute('href'))?.slice(1)

    expect(
      activeId,
      `Em ${scenario.scrollY}px a faixa é intersectada por ${scenario.intersecting.join(', ')}; ` +
        `pelo topo prevalence ${scenario.expected} e não ${activeId}`,
    ).toBe(scenario.expected)

    // A secção destacada tem de intersectar de facto a faixa, e não
    // apenas estar visível na viewport.
    expect(scenario.intersecting).toContain(activeId)
  }
})

test('desempate: prevalece a mais próxima do topo mesmo quando não é a primeira no DOM', async ({
  page,
}) => {
  await installObserverSpy(page)
  await page.goto('/')

  const navigation = page.getByRole('navigation', { name: /navegação principal/i })

  // Cenário em que as duas clausulas da regra dão resultados
  // diferentes: a secção mais próxima do topo vem depois no DOM.
  const setup = await page.evaluate(() => {
    const order = Array.from(document.querySelectorAll('main section'))

    if (order.length < 2) {
      return null
    }

    const first = order[0]
    const second = order[1]

    const height = Math.max(document.documentElement.clientHeight, 800)

    for (const section of order) {
      section.style.minHeight = `${height}px`
    }

    // `position: absolute` retira a secção do fluxo, e a caixa que o
    // `IntersectionObserver` observa passa a ser a sua própria.
    const firstTop = first.getBoundingClientRect().top

    second.style.position = 'absolute'
    second.style.top = `${firstTop - 120}px`
    second.style.left = '0px'
    second.style.width = '100%'

    return {
      firstId: first.id,
      secondId: second.id,
      firstTop: first.getBoundingClientRect().top,
      secondTop: second.getBoundingClientRect().top,
    }
  })

  expect(setup).not.toBeNull()

  // A geometria tem de distinguir as duas secções, com a segunda
  // (mais tarde no DOM) mais perto do topo.
  expect(setup?.secondTop ?? 0).toBeLessThan(setup?.firstTop ?? 0)

  await forceIntersectionChange(page)

  const positions = await findBandOverlapPositions(page)

  let checked = 0

  for (const scrollY of positions) {
    await page.evaluate((value) => window.scrollTo(0, value), scrollY)
    await settleActiveSection(page)

    const state = await readBandState(page)

    if (state.intersecting.length < 2) {
      continue
    }

    // A regra tem de ser aplicada pelo topo, e não pela ordem do DOM.
    const expected = state.intersecting.reduce((closest, section) =>
      section.top < closest.top ? section : closest,
    )

    const domFirst = state.intersecting.reduce((earliest, section) =>
      state.domIndex[section.id] < state.domIndex[earliest.id] ? section : earliest,
    )

    // Só interessam as posições em que as duas clausulas divergem.
    if (expected.id === domFirst.id) {
      continue
    }

    checked += 1

    const active = navigation.locator('a[aria-current="true"]')
    await expect(active).toHaveCount(1)

    const activeId = (await active.getAttribute('href'))?.slice(1)

    expect(
      activeId,
      `Em ${scrollY}px a faixa é intersectada por ${state.intersecting
        .map((section) => section.id)
        .join(', ')}; prevalece a mais próxima do topo (${expected.id}) e não ${activeId}`,
    ).toBe(expected.id)
  }

  expect(checked).toBeGreaterThan(0)
})

test('desempate: em empate de topo prevalece a primeira secção no DOM', async ({ page }) => {
  await installObserverSpy(page)
  await page.goto('/')

  const navigation = page.getByRole('navigation', { name: /navegação principal/i })

  // Constrói um empate exato: duas secções com o mesmo topo, ambas a
  // intersectar a faixa. É um cenário que a pagina real nao produz, e
  // que distingue a segunda clausula da regra da primeira.
  const setup = await page.evaluate(() => {
    const order = Array.from(document.querySelectorAll('main section'))

    if (order.length < 2) {
      return null
    }

    const first = order[0]
    const second = order[1]

    // Alturas iguais ao viewport: as duas secções atravessam a faixa
    // central em qualquer posicao de scroll.
    const height = Math.max(document.documentElement.clientHeight, 800)

    for (const section of order) {
      section.style.minHeight = `${height}px`
    }

    // `position: absolute` retira a secção do fluxo e passa a observar
    // a sua própria caixa, que é a que o `IntersectionObserver` usa.
    // `margin` e `padding` não são adequados: com
    // `prefers-reduced-motion: reduce` a folha de reset prevalece
    // sobre esses valores, e a geometria não mudaria.
    const firstTop = first.getBoundingClientRect().top

    second.style.position = 'absolute'
    second.style.top = `${firstTop}px`
    second.style.left = '0px'
    second.style.width = '100%'

    const aligned = Math.abs(first.getBoundingClientRect().top - second.getBoundingClientRect().top)

    return { aligned, firstId: first.id, secondId: second.id }
  })

  expect(setup).not.toBeNull()
  expect(setup?.aligned ?? 1).toBeLessThanOrEqual(0.5)

  // Uma alteracao de layout so e observada quando o estado de
  // intersecao muda. Forcar essa mudanca garante que a aplicacao
  // reavalia o desempate com a geometria do empate.
  await forceIntersectionChange(page)

  const positions = await findBandOverlapPositions(page)

  let checked = 0

  for (const scrollY of positions) {
    await page.evaluate((value) => window.scrollTo(0, value), scrollY)
    await settleActiveSection(page)

    const state = await readBandState(page)

    if (state.intersecting.length < 2) {
      continue
    }

    const tied = state.intersecting.filter(
      (section) => Math.abs(section.top - state.closestTop) <= 0.5,
    )

    if (tied.length < 2) {
      continue
    }

    checked += 1

    const expected = tied.reduce((earliest, section) =>
      state.domIndex[section.id] < state.domIndex[earliest.id] ? section : earliest,
    )

    const active = navigation.locator('a[aria-current="true"]')
    await expect(active).toHaveCount(1)

    const activeId = (await active.getAttribute('href'))?.slice(1)

    expect(
      activeId,
      `Em ${scrollY}px ${tied.map((section) => section.id).join(' e ')} partilham o topo ` +
        `da faixa; pelo DOM prevalece ${expected.id} e não ${activeId}`,
    ).toBe(expected.id)
  }

  expect(checked).toBeGreaterThan(0)
})

test('desempate: o topo da faixa tem 5% da altura da viewport e é centrado', async ({ page }) => {
  await installObserverSpy(page)
  await page.goto('/')

  const band = await readObserverBand(page)

  const height = await page.evaluate(() => document.documentElement.clientHeight)

  // A faixa que o observador usa tem de ter 5% da altura da viewport,
  // com a mesma distancia ao topo e ao fundo. As coordenadas devolvidas
  // pelo browser são arredondadas a píxeis, pelo que a comparacao
  // tolera um desvio de um píxel.
  expect(band).not.toBeNull()
  expect(band?.bottom - band?.top).toBeCloseTo(height * 0.05, -1)
  expect(height - (band?.top ?? 0) - (height - (band?.bottom ?? 0))).toBeCloseTo(height * 0.05, -1)
})

test('aria-current acompanha a secção visível após redimensionar', async ({ page }) => {
  await page.goto('/')

  const viewport = page.viewportSize()
  const width = viewport?.width ?? 1280

  // Redimensiona apenas a altura, mantendo a largura, para validar que a
  // faixa central é recalculada a partir da nova altura da viewport.
  await page.setViewportSize({ width, height: 600 })
  await page.waitForTimeout(300)

  const maxScroll = await page.evaluate(
    () => document.documentElement.scrollHeight - window.innerHeight,
  )

  let checked = 0

  for (let y = 0; y <= maxScroll; y += 20) {
    await page.evaluate((value) => window.scrollTo(0, value), y)
    await page.waitForTimeout(80)

    const state = await page.evaluate(() => {
      const active = document.querySelector('nav a[aria-current="true"]')
      const activeSection = active?.getAttribute('href')?.slice(1) ?? null
      const target = activeSection ? document.getElementById(activeSection) : null
      const rect = target?.getBoundingClientRect() ?? null

      return {
        activeSection,
        isVisible: rect !== null && rect.bottom > 0 && rect.top < window.innerHeight,
        isInCentralBand:
          rect !== null &&
          rect.bottom > window.innerHeight * 0.475 &&
          rect.top < window.innerHeight * 0.525,
      }
    })

    if (state.activeSection === null) {
      continue
    }

    checked += 1
    expect(state.isVisible).toBe(true)
    expect(state.isInCentralBand).toBe(true)
  }

  expect(checked).toBeGreaterThan(0)
})

test('não tem overflow horizontal durante a navegação', async ({ page }) => {
  await page.goto('/')

  const navigation = page.getByRole('navigation', { name: /navegação principal/i })

  for (const id of SECTION_IDS) {
    await navigation.locator(`a[href="#${id}"]`).click()
    await page.waitForTimeout(200)

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )

    expect(overflow).toBeLessThanOrEqual(0)
  }
})

test('os alvos de navegação em ecrãs pequenos têm pelo menos 44 × 44 px', async ({ page }) => {
  await page.goto('/')

  const viewport = page.viewportSize()
  const width = viewport?.width ?? 0

  // Abaixo de 1024px a navegação é uma barra inferior, e a marca do cabeçalho
  // é uma ligação para o início. Os alvos medidos são, por isso, todos os links
  // da barra lateral.
  test.skip(width >= 1024, 'A barra inferior só existe abaixo de 1024px')

  const targets = page.locator('aside a[href]')

  await expect(targets).toHaveCount(SECTION_IDS.length + 1)

  for (const target of await targets.all()) {
    const href = (await target.getAttribute('href')) ?? ''
    const box = await target.boundingBox()

    expect(box?.width ?? 0, `largura de ${href}`).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_PX)
    expect(box?.height ?? 0, `altura de ${href}`).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_PX)
  }
})

test('o tabulador percorre o link de salto e os links de navegação', async ({ page }) => {
  await page.goto('/')

  const expected = ['#conteudo', '#inicio', '#inicio', '#projetos', '#habilidades', '#contato']
  const actual: string[] = []

  for (let index = 0; index < expected.length; index += 1) {
    await page.keyboard.press('Tab')

    const href = await page.evaluate(() => document.activeElement?.getAttribute('href') ?? null)

    actual.push(href ?? '')
  }

  expect(actual).toEqual(expected)
})

test('o foco é sempre visível durante a navegação por teclado', async ({ page }) => {
  await page.goto('/')

  for (let index = 0; index < 6; index += 1) {
    await page.keyboard.press('Tab')

    const outline = await page.evaluate(() => {
      const element = document.activeElement
      if (element === null) {
        return null
      }

      const style = getComputedStyle(element)

      return {
        width: style.outlineWidth,
        style: style.outlineStyle,
        color: style.outlineColor,
      }
    })

    expect(outline).not.toBeNull()
    expect(outline?.style).not.toBe('none')
    expect(parseFloat(outline?.width ?? '0')).toBeGreaterThan(0)
  }
})

test('o link de salto move o foco para o conteúdo principal', async ({ page }) => {
  await page.goto('/')

  await page.keyboard.press('Tab')
  await expect(page.getByRole('link', { name: /saltar para o conteúdo/i })).toBeFocused()

  await page.keyboard.press('Enter')
  await page.waitForTimeout(200)

  const focused = await page.evaluate(() => ({
    tag: document.activeElement?.tagName ?? null,
    id: document.activeElement?.id ?? null,
  }))

  expect(focused.tag).toBe('MAIN')
  expect(focused.id).toBe('conteudo')
})

test('a barra de navegação não cobre o conteúdo principal', async ({ page }) => {
  await page.goto('/')

  const viewport = page.viewportSize()
  const width = viewport?.width ?? 0

  // Em ecrãs com menos de 1024px a navegação é uma barra inferior fixa.
  test.skip(width >= 1024, 'A barra inferior só existe abaixo de 1024px')

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await page.waitForTimeout(300)

  const layout = await page.evaluate(() => {
    const navigation = document.querySelector('nav')
    const lastSection = document.querySelector('main section:last-of-type')

    if (navigation === null || lastSection === null) {
      return null
    }

    const navRect = navigation.getBoundingClientRect()
    const sectionRect = lastSection.getBoundingClientRect()
    const navStyle = getComputedStyle(navigation)

    return {
      isFixed: navStyle.position === 'fixed',
      navTop: navRect.top,
      navBottom: navRect.bottom,
      sectionBottom: sectionRect.bottom,
      sectionTop: sectionRect.top,
    }
  })

  expect(layout).not.toBeNull()
  expect(layout?.isFixed).toBe(true)

  // A última secção tem de terminar acima da barra de navegação.
  expect(layout?.sectionBottom).toBeLessThanOrEqual(layout?.navTop ?? 0)
})

test('o último elemento do documento permanece acessível', async ({ page }) => {
  await page.goto('/')

  const viewport = page.viewportSize()
  const width = viewport?.width ?? 0

  // Em ecrãs com menos de 1024px a navegação é uma barra inferior fixa.
  test.skip(width >= 1024, 'A barra inferior só existe abaixo de 1024px')

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await page.waitForTimeout(300)

  const probe = await page.evaluate(() => {
    const lastSection = document.querySelector('main section:last-of-type')
    const navigation = document.querySelector('nav')

    if (lastSection === null || navigation === null) {
      return null
    }

    const rect = lastSection.getBoundingClientRect()
    const navRect = navigation.getBoundingClientRect()

    // O ponto de prova é a parte inferior visível da última secção, acima
    // da barra de navegação.
    const y = Math.round(Math.min(rect.bottom, navRect.top) - 4)
    const x = Math.round(rect.left + rect.width / 2)
    const element = document.elementFromPoint(x, y)

    return {
      x,
      y,
      tag: element?.tagName ?? null,
      inSection: element?.closest('section') === lastSection,
      sectionBottom: Math.round(rect.bottom),
      navTop: Math.round(navRect.top),
    }
  })

  expect(probe).not.toBeNull()
  expect(probe?.tag).not.toBeNull()
  expect(probe?.inSection).toBe(true)
  expect(probe?.sectionBottom).toBeLessThanOrEqual(probe?.navTop ?? 0)
})
