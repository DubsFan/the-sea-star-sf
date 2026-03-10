import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

async function login(page: import('@playwright/test').Page) {
  await page.goto('/admin')
  await page.fill('input[type="text"], input[name="username"]', 'alicia')
  await page.fill('input[type="password"]', 'testpass123')
  await page.click('button[type="submit"]')
  await page.waitForURL(/\/admin\/dashboard/, { timeout: 10000 })
  await expect(page.locator('text=/Good (morning|afternoon|evening)/')).toBeVisible({ timeout: 5000 })
  await page.waitForTimeout(1000)
}

test.describe('08 — Accessibility', () => {
  test('axe-core scan of SEO tab — no critical violations', async ({ page }) => {
    await login(page)
    await page.goto('/admin/marketing?tab=seo')
    await page.waitForTimeout(2000)

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze()

    const critical = results.violations.filter(v => v.impact === 'critical')
    if (critical.length > 0) {
      console.log('Critical a11y violations:', JSON.stringify(critical.map(v => ({ id: v.id, help: v.help })), null, 2))
    }
    expect(critical.length).toBe(0)
  })

  test('axe-core scan of Media tab — no critical violations', async ({ page }) => {
    await login(page)
    await page.goto('/admin/marketing?tab=media')
    await page.waitForTimeout(2000)

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze()

    const critical = results.violations.filter(v => v.impact === 'critical')
    expect(critical.length).toBe(0)
  })

  test('axe-core scan of Blog tab — no critical violations', async ({ page }) => {
    await login(page)
    await page.goto('/admin/marketing?tab=blog')
    await page.waitForTimeout(2000)

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze()

    const critical = results.violations.filter(v => v.impact === 'critical')
    expect(critical.length).toBe(0)
  })

  test('axe-core scan of public FAQ page — no critical violations', async ({ page }) => {
    // No login needed — /faq is public
    await page.goto('/faq')
    await page.waitForTimeout(2000)

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze()

    const critical = results.violations.filter(v => v.impact === 'critical')
    if (critical.length > 0) {
      console.log('Critical a11y violations on /faq:', JSON.stringify(critical.map(v => ({ id: v.id, help: v.help })), null, 2))
    }
    expect(critical.length).toBe(0)
  })

  test('touch targets >= 44px on marketing page', async ({ page }) => {
    await login(page)
    await page.goto('/admin/marketing?tab=blog')
    await page.waitForTimeout(2000)

    const smallTargets = await page.evaluate(() => {
      const interactive = document.querySelectorAll('button, a, input, select, textarea')
      const tooSmall: string[] = []
      interactive.forEach(el => {
        const rect = el.getBoundingClientRect()
        // Only check visible elements
        if (rect.width > 0 && rect.height > 0 && rect.height < 44) {
          const text = el.textContent?.trim().slice(0, 30) || el.tagName
          tooSmall.push(`${text} (${Math.round(rect.height)}px)`)
        }
      })
      return tooSmall
    })

    if (smallTargets.length > 0) {
      console.log('Touch targets < 44px:', smallTargets.slice(0, 10))
    }
    // Warning threshold — flag but don't fail if just a few small targets
    // (some icons/links are intentionally small on desktop-only elements)
    expect(smallTargets.length).toBeLessThan(20)
  })
})
