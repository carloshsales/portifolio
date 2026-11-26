import { expect, test } from '@playwright/test'
import type { Locator, Page } from '@playwright/test'
import type { Profile } from '../src/types'

const ROUTES = [
  { path: '/', label: 'Início' },
  { path: '/projetos', label: 'Projetos' },
  { path: '/habilidades', label: 'Habilidades' },
  { path: '/contato', label: 'Contato' },
  { path: '/jogos', label: 'Jogos' },
  { path: '/artigos', label: 'Artigos' },
  { path: '/experimentos', label: 'Experimentos' },
] as const

const MIN_TOUCH_TARGET_PX = 44
const BOTTOM_BAR_BREAKPOINT_PX = 1024

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

function navigation(page: Page): Locator {
  return page.getByRole('navigation', { name: 'Navegação principal', exact: true })
}

/**
 * Aguarda que a rota termine de resolver.
 *
 * O router resolve a rota de forma assíncrona, e enquanto isso decorre o
 * documento ainda não tem conteúdo. Um `Tab` enviado antes da resolução
 * perde-se, porque o router repõe o foco quando a rota fica pronta. Por isso
 * os testes que interagem com o teclado esperam pelo `h2` da secção, que só
 * existe depois da rota estar renderizada.
 */
async function waitForRoute(page: Page): Promise<void> {
  await expect(page.locator('main h2')).toBeVisible()
}

function isBottomBarViewport(page: Page): boolean {
  return (page.viewportSize()?.width ?? 0) < BOTTOM_BAR_BREAKPOINT_PX
}

async function horizontalOverflow(page: Page): Promise<number> {
  return page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
}

test('não tem overflow horizontal em nenhuma das sete rotas', async ({ page }) => {
  for (const route of ROUTES) {
    await page.goto(route.path)

    const overflow = await horizontalOverflow(page)

    expect(overflow, `overflow horizontal em ${route.path}`).toBeLessThanOrEqual(0)
  }
})

test('não tem overflow horizontal durante a navegação por clique', async ({ page }) => {
  await page.goto('/')

  const menu = navigation(page)

  for (const route of ROUTES.slice(1)) {
    await menu.getByRole('link', { name: route.label, exact: true }).click()
    await expect.poll(() => new URL(page.url()).pathname).toBe(route.path)

    const overflow = await horizontalOverflow(page)

    expect(overflow, `overflow horizontal em ${route.path}`).toBeLessThanOrEqual(0)
  }
})

test('o menu mostra os sete links, visíveis e com o destino da rota', async ({ page }) => {
  await page.goto('/')

  const menu = navigation(page)

  for (const route of ROUTES) {
    const link = menu.getByRole('link', { name: route.label, exact: true })

    await expect(link).toBeVisible()
    await expect(link).toHaveAttribute('href', route.path)
  }
})

test('abaixo de 1024px, cada link mostra só o ícone e mantém o rótulo no DOM', async ({ page }) => {
  test.skip(!isBottomBarViewport(page), 'A barra inferior só existe abaixo de 1024px')

  await page.goto('/')

  const menu = navigation(page)

  for (const route of ROUTES) {
    const link = menu.getByRole('link', { name: route.label, exact: true })

    await expect(link.locator('svg')).toBeVisible()
    await expect(link.locator('span')).toHaveText(route.label)
    await expect(link.locator('span')).toBeHidden()
  }
})

test('abaixo de 1024px, os alvos de toque têm pelo menos 44 × 44 px', async ({ page }) => {
  test.skip(!isBottomBarViewport(page), 'A barra inferior só existe abaixo de 1024px')

  await page.goto('/')

  const targets = page.locator('aside a[href]')

  await expect(targets).toHaveCount(ROUTES.length + 1)

  for (const target of await targets.all()) {
    const href = (await target.getAttribute('href')) ?? ''
    const box = await target.boundingBox()

    expect(box?.width ?? 0, `largura de ${href}`).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_PX)
    expect(box?.height ?? 0, `altura de ${href}`).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_PX)
  }
})

test('abaixo de 1024px, a barra inferior não cobre o fim do conteúdo', async ({ page }) => {
  test.skip(!isBottomBarViewport(page), 'A barra inferior só existe abaixo de 1024px')

  await page.goto('/projetos')

  const layout = await page.evaluate(() => {
    const content = document.getElementById('conteudo')
    const bar = document.querySelector('nav')
    const section = content?.querySelector('section') ?? null

    if (content === null || bar === null || section === null) {
      return null
    }

    content.scrollTop = content.scrollHeight

    return {
      position: getComputedStyle(bar).position,
      barHeight: bar.getBoundingClientRect().height,
      barTop: bar.getBoundingClientRect().top,
      paddingBottom: parseFloat(getComputedStyle(content).paddingBottom),
      sectionBottom: section.getBoundingClientRect().bottom,
    }
  })

  if (layout === null) {
    throw new Error('Área de conteúdo, secção ou barra de navegação não encontradas')
  }

  expect(layout.position).toBe('fixed')
  expect(layout.paddingBottom).toBeGreaterThanOrEqual(layout.barHeight)
  expect(layout.sectionBottom).toBeLessThanOrEqual(layout.barTop)
})

test('o último elemento do conteúdo permanece acessível', async ({ page }) => {
  test.skip(!isBottomBarViewport(page), 'A barra inferior só existe abaixo de 1024px')

  await page.goto('/projetos')

  const probe = await page.evaluate(() => {
    const content = document.getElementById('conteudo')
    const bar = document.querySelector('nav')
    const section = content?.querySelector('section:last-of-type') ?? null

    if (content === null || bar === null || section === null) {
      return null
    }

    // A área de conteúdo tem a sua própria barra de rolagem, pelo que é
    // ela que se desloca até ao fim, e não o documento.
    content.scrollTop = content.scrollHeight

    const rect = section.getBoundingClientRect()
    const barRect = bar.getBoundingClientRect()

    // O ponto de prova é a parte inferior visível da última secção, acima
    // da barra de navegação.
    const y = Math.round(Math.min(rect.bottom, barRect.top) - 4)
    const x = Math.round(rect.left + rect.width / 2)
    const element = document.elementFromPoint(x, y)

    return {
      x,
      y,
      tag: element?.tagName ?? null,
      inSection: element?.closest('section') === section,
      sectionBottom: Math.round(rect.bottom),
      barTop: Math.round(barRect.top),
    }
  })

  expect(probe).not.toBeNull()
  expect(probe?.tag).not.toBeNull()
  expect(probe?.inSection).toBe(true)
  expect(probe?.sectionBottom).toBeLessThanOrEqual(probe?.barTop ?? 0)
})

test('o tabulador percorre o link de salto, a marca e os sete links de navegação', async ({
  page,
}) => {
  await page.goto('/')
  await waitForRoute(page)

  const expected = ['#conteudo', '/', ...ROUTES.map((route) => route.path)]
  const actual: string[] = []

  for (let index = 0; index < expected.length; index += 1) {
    await page.keyboard.press('Tab')

    actual.push(await page.evaluate(() => document.activeElement?.getAttribute('href') ?? ''))
  }

  expect(actual).toEqual(expected)
})

test('o foco é sempre visível durante a navegação por teclado', async ({ page }) => {
  await page.goto('/')
  await waitForRoute(page)

  const focusableCount = ROUTES.length + 2

  for (let index = 0; index < focusableCount; index += 1) {
    await page.keyboard.press('Tab')

    const outline = await page.evaluate(() => {
      const element = document.activeElement

      if (element === null) {
        return null
      }

      const style = getComputedStyle(element)

      return { width: style.outlineWidth, style: style.outlineStyle }
    })

    expect(outline, `foco no elemento ${index + 1}`).not.toBeNull()
    expect(outline?.style).not.toBe('none')
    expect(parseFloat(outline?.width ?? '0')).toBeGreaterThan(0)
  }
})

test('o link de salto fica visível quando recebe foco', async ({ page }) => {
  await page.goto('/')
  await waitForRoute(page)

  await page.keyboard.press('Tab')

  const skipLink = page.getByRole('link', { name: /saltar para o conteúdo/i })

  await expect(skipLink).toBeFocused()
  await expect.poll(async () => (await skipLink.boundingBox())?.y ?? -1).toBeGreaterThanOrEqual(0)
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

  const identity = page.locator('aside p', { hasText: filledProfile.name })
  await expect(identity).toBeVisible()
})

test('os links da página e os canais de contacto têm destino válido', async ({ page }) => {
  await setProfileOverride(page, contactProfile)
  await page.goto('/contato')

  const hrefs = await page
    .locator('a[href]')
    .evaluateAll((links) => links.map((link) => link.getAttribute('href') ?? ''))

  for (const href of hrefs) {
    expect(href).not.toBe('')
    expect(href).not.toMatch(/^javascript:/i)
  }

  const channels = page.locator('section#contato a[href]')
  await expect(channels).toHaveCount(contactProfile.social.length)
})
