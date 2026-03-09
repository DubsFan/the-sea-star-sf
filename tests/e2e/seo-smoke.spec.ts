import { test, expect } from '@playwright/test'

test.describe('SEO Smoke', () => {
  test('authenticated load shows SEO controls', async ({ page }) => {
    // Login first
    await page.goto('/admin')
    await page.fill('input[type="text"], input[name="username"]', 'alicia')
    await page.fill('input[type="password"]', 'testpass123')
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/admin\/dashboard/, { timeout: 10000 })
    await expect(page.locator('text=/Good (morning|afternoon|evening)/')).toBeVisible({ timeout: 5000 })

    // Navigate directly to SEO page
    await page.goto('/admin/seo')
    await page.waitForTimeout(1500)

    // SEO page should load
    await expect(page.getByText('SEO Controls')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Page Metadata')).toBeVisible()
  })
})
