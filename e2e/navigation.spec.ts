import { expect, test } from '@playwright/test'
import type { Locator, Page } from '@playwright/test'

interface SectionRoute {
  path: string
  id: string
  label: string
  heading?: string
}

const ROUTES: readonly SectionRoute[] = [
  { path: '/', id: 'inicio', label: 'Início' },
  { path: '/projetos', id: 'projetos', label: 'Projetos', heading: 'Projetos' },
  { path: '/contato', id: 'contato', label: 'Contato', heading: 'Contato' },
  { path: '/jogos', id: 'jogos', label: 'Jogos', heading: 'Jogos' },
  { path: '/artigos', id: 'artigos', label: 'Artigos', heading: 'Artigos' },
  { path: '/experimentos', id: 'experimentos', label: 'Experimentos', heading: 'Experimentos' },
]

const SCROLL_TOLERANCE_PX = 1

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

for (const route of ROUTES) {
  test(`carregamento direto de ${route.path} apresenta a seção e marca o link ativo`, async ({
    page,
  }) => {
    const response = await page.goto(route.path)

    expect(response?.status()).toBe(200)

    const section = page.locator(`main section#${route.id}`)
    const heading = section.getByRole('heading', { level: 2 })

    const headingId = (await heading.getAttribute('id')) ?? ''

    await expect(heading).toHaveCount(1)
    await expect(heading).toBeVisible()
    await expect(heading).not.toHaveText('')
    await expect(section).toHaveAttribute('aria-labelledby', headingId)

    if (route.heading !== undefined) {
      await expect(heading).toHaveText(route.heading)
    }

    const current = navigation(page).locator('a[aria-current="page"]')

    await expect(current).toHaveCount(1)
    await expect(current).toHaveAttribute('href', route.path)
  })
}

test('o menu lista as seis seções pela ordem das rotas', async ({ page }) => {
  await page.goto('/')

  const links = navigation(page).locator('a')
  const hrefs = await links.evaluateAll((elements) =>
    elements.map((element) => element.getAttribute('href')),
  )

  expect(hrefs).toEqual(ROUTES.map((route) => route.path))
})

test('os painéis das habilidades abrem e fecham ao clicar no seu rótulo', async ({ page }) => {
  await page.goto('/')

  const first = page.locator('main details').first()

  // O atributo `open` existe no DOM mesmo fechado; o estado real é a
  // propriedade `open` do elemento.
  const isOpen = (locator: Locator): Promise<boolean> =>
    locator.evaluate((element) => (element as HTMLDetailsElement).open)

  expect(await isOpen(first)).toBe(false)

  await first.locator('summary').click()

  expect(await isOpen(first)).toBe(true)

  await first.locator('summary').click()

  expect(await isOpen(first)).toBe(false)
})

test('os painéis das habilidades são independentes entre si', async ({ page }) => {
  await page.goto('/')

  const first = page.locator('main details').first()
  const second = page.locator('main details').nth(1)

  const isOpen = (locator: Locator): Promise<boolean> =>
    locator.evaluate((element) => (element as HTMLDetailsElement).open)

  await first.locator('summary').click()
  await second.locator('summary').click()

  // Abrir um painel não fecha os outros: é possível comparar duas
  // habilidades lado a lado.
  expect(await isOpen(first)).toBe(true)
  expect(await isOpen(second)).toBe(true)
})

test('o painel de uma habilidade mostra a descrição e o uso neste projecto', async ({ page }) => {
  await page.goto('/')

  const summary = page.locator('main details summary', { hasText: 'RawSpec v2' })

  await summary.click()

  const panel = summary.locator('xpath=following-sibling::div')

  await expect(panel).toContainText('Formato de especificações')
  // O rótulo é maiúsculo por CSS; o texto no DOM é "Aplicado nesse Portfólio".
  await expect(panel).toContainText('Aplicado nesse Portfólio')
  await expect(panel.locator('span')).toHaveText('Aplicado nesse Portfólio')
})

test('as habilidades que não são usadas aqui não recebem o rótulo de aplicação', async ({
  page,
}) => {
  await page.goto('/')

  const summary = page.locator('main details summary', { hasText: 'Supabase' })

  await summary.click()

  const panel = summary.locator('xpath=following-sibling::div')

  await expect(panel).not.toContainText('Aplicado nesse Portfólio')
  await expect(panel).not.toContainText('Planejado')
  await expect(panel.locator('span')).toHaveCount(0)
})

test('o painel de uma habilidade abre e fecha pelo teclado', async ({ page }) => {
  await page.goto('/')

  const summary = page.locator('main details summary').first()
  const details = summary.locator('xpath=..')

  const isOpen = (): Promise<boolean> =>
    details.evaluate((element) => (element as HTMLDetailsElement).open)

  await summary.focus()
  await expect(summary).toBeFocused()

  await page.keyboard.press('Enter')

  expect(await isOpen()).toBe(true)

  await page.keyboard.press('Enter')

  expect(await isOpen()).toBe(false)
})

test('clicar num item de menu muda de página sem deslocar o documento', async ({ page }) => {
  await page.goto('/')

  const menu = navigation(page)

  for (const route of ROUTES.slice(1)) {
    const scrollBefore = await page.evaluate(() => window.scrollY)

    await menu.getByRole('link', { name: route.label, exact: true }).click()
    await expect.poll(() => new URL(page.url()).pathname).toBe(route.path)

    const current = menu.locator('a[aria-current="page"]')

    await expect(current).toHaveCount(1)
    await expect(current).toHaveAttribute('href', route.path)

    const scrollAfter = await page.evaluate(() => window.scrollY)

    expect(
      Math.abs(scrollAfter - scrollBefore),
      `deslocamento do documento ao ir para ${route.path}`,
    ).toBeLessThanOrEqual(SCROLL_TOLERANCE_PX)
  }
})

test('cada página tem a sua própria barra de rolagem e o documento não faz scroll', async ({
  page,
}) => {
  for (const route of ROUTES) {
    await page.goto(route.path)

    const metrics = await page.evaluate(() => {
      const content = document.getElementById('conteudo')

      return {
        found: content !== null,
        overflowY: content === null ? '' : getComputedStyle(content).overflowY,
        contentHeight: content?.clientHeight ?? Number.POSITIVE_INFINITY,
        viewportHeight: window.innerHeight,
        documentHeight: document.documentElement.scrollHeight,
      }
    })

    expect(metrics.found, `área de conteúdo em ${route.path}`).toBe(true)
    expect(['auto', 'scroll'], `overflow-y da área de conteúdo em ${route.path}`).toContain(
      metrics.overflowY,
    )
    expect(
      metrics.contentHeight,
      `altura da área de conteúdo em ${route.path}`,
    ).toBeLessThanOrEqual(metrics.viewportHeight)
    expect(metrics.documentHeight, `altura do documento em ${route.path}`).toBeLessThanOrEqual(
      metrics.viewportHeight,
    )
  }
})

test('a barra de rolagem da página aparece quando o conteúdo excede a viewport', async ({
  page,
}, testInfo) => {
  const semConteudoExcedente: string[] = []

  for (const route of ROUTES) {
    await page.goto(route.path)

    const excedeViewport = await page.evaluate(() => {
      const content = document.getElementById('conteudo')

      return content !== null && content.scrollHeight > content.clientHeight
    })

    if (!excedeViewport) {
      semConteudoExcedente.push(route.path)
      continue
    }

    const posicao = await page.evaluate(() => {
      const content = document.getElementById('conteudo')

      if (content === null) {
        return { scrollTop: 0, scrollY: window.scrollY }
      }

      content.scrollTop = content.scrollHeight

      return { scrollTop: content.scrollTop, scrollY: window.scrollY }
    })

    expect(posicao.scrollTop, `rolagem da área de conteúdo em ${route.path}`).toBeGreaterThan(0)
    expect(posicao.scrollY, `rolagem do documento em ${route.path}`).toBe(0)
  }

  if (semConteudoExcedente.length > 0) {
    const description = `${semConteudoExcedente.join(', ')}: o conteúdo atual não excede a viewport`

    testInfo.annotations.push({ type: 'condição de conteúdo não observada', description })
    console.log(`[${testInfo.project.name}] Condição de conteúdo não observada: ${description}`)
  }
})

test('o link de salto leva o foco ao conteúdo da página atual', async ({ page }) => {
  await page.goto('/projetos')
  await waitForRoute(page)

  await page.keyboard.press('Tab')

  const skipLink = page.getByRole('link', { name: /saltar para o conteúdo/i })

  await expect(skipLink).toBeFocused()
  await page.keyboard.press('Enter')

  await expect(page.locator('main#conteudo')).toBeFocused()
  await expect.poll(() => new URL(page.url()).pathname).toBe('/projetos')
})
