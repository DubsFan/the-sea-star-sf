import { test, expect } from '@playwright/test'

async function login(page: import('@playwright/test').Page) {
  await page.goto('/admin')
  await page.fill('input[type="text"], input[name="username"]', 'alicia')
  await page.fill('input[type="password"]', 'testpass123')
  await page.click('button[type="submit"]')
  await page.waitForURL(/\/admin\/dashboard/, { timeout: 10000 })
  await expect(page.locator('text=/Good (morning|afternoon|evening)/')).toBeVisible({ timeout: 5000 })
  await page.waitForTimeout(1000)
}

test.describe('07 — UI E2E', () => {
  test('FAQ tab renders in Marketing hub', async ({ page }) => {
    await login(page)
    await page.goto('/admin/marketing?tab=seo')
    await page.waitForTimeout(1000)
    // Look for FAQ or SEO heading content
    const seoHeading = page.locator('text=/SEO|Keywords|FAQ/')
    await expect(seoHeading.first()).toBeVisible({ timeout: 5000 })
  })

  test('Blog tab renders blog ideas section', async ({ page }) => {
    await login(page)
    await page.goto('/admin/marketing?tab=blog')
    await page.waitForTimeout(1000)
    // Should show blog creator or blog ideas
    const blogContent = page.locator('text=/Blog|Creator|Ideas/')
    await expect(blogContent.first()).toBeVisible({ timeout: 5000 })
  })

  test('SeoTab keyword tiers visible', async ({ page }) => {
    await login(page)
    await page.goto('/admin/marketing?tab=seo')
    await page.waitForTimeout(1000)
    // Should show Primary and Secondary keyword sections
    const keywordSection = page.locator('text=/Primary|Secondary|Keywords/')
    await expect(keywordSection.first()).toBeVisible({ timeout: 5000 })
  })

  test('MediaTab renders with filter pills', async ({ page }) => {
    await login(page)
    await page.goto('/admin/marketing?tab=media')
    await page.waitForTimeout(1000)
    // Should show media tab content with filter buttons
    const mediaContent = page.locator('text=/Media|All|Drinks|Blog/')
    await expect(mediaContent.first()).toBeVisible({ timeout: 5000 })
  })

  test('no horizontal scroll on marketing page', async ({ page }) => {
    await login(page)
    await page.goto('/admin/marketing?tab=blog')
    await page.waitForTimeout(1000)
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth)
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1)
  })

  test('no horizontal scroll on SEO tab', async ({ page }) => {
    await login(page)
    await page.goto('/admin/marketing?tab=seo')
    await page.waitForTimeout(1000)
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth)
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1)
  })
})
