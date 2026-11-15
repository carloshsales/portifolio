import { expect, test } from '@playwright/test'

const SECTION_IDS = ['inicio', 'projetos', 'habilidades', 'contato'] as const

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

test('mostra a fotografia com tamanho visível', async ({ page }) => {
  await page.goto('/')

  const photo = page.getByRole('img', { name: /fotografia/i })
  await expect(photo).toBeVisible()

  const box = await photo.boundingBox()
  expect(box).not.toBeNull()
  expect(box?.width ?? 0).toBeGreaterThan(0)
  expect(box?.height ?? 0).toBeGreaterThan(0)
})

test('não tem links de contacto inválidos', async ({ page }) => {
  await page.goto('/')

  const hrefs = await page
    .locator('a[href]')
    .evaluateAll((links) => links.map((link) => link.getAttribute('href') ?? ''))

  for (const href of hrefs) {
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
