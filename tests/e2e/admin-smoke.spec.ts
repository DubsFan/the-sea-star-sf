import { test, expect } from '@playwright/test'

async function login(page: import('@playwright/test').Page) {
  await page.goto('/admin')
  await page.fill('input[type="text"], input[name="username"]', 'alicia')
  await page.fill('input[type="password"]', 'testpass123')
  await page.click('button[type="submit"]')
  await page.waitForURL(/\/admin\/dashboard/, { timeout: 10000 })
  // Wait for dashboard greeting to render (always appears, even before session loads)
  await expect(page.locator('text=/Good (morning|afternoon|evening)/')).toBeVisible({ timeout: 5000 })
  // Give the session fetch time to complete so nav items render
  await page.waitForTimeout(1000)
}

test.describe('Admin Smoke', () => {
  test('login through real form', async ({ page }) => {
    await login(page)
    // Dashboard greeting should be visible
    await expect(page.locator('text=/Good (morning|afternoon|evening)/')).toBeVisible()
  })

  test('bottom tab bar is present', async ({ page }) => {
    await login(page)
    // The bottom nav is the mobile-only fixed bar at the bottom
    // It contains links styled as flex-col with icon + label span
    const bottomNav = page.locator('nav.fixed.bottom-0')
    await expect(bottomNav).toBeVisible({ timeout: 5000 })
    // Should have at least Home and Inbox links
    await expect(bottomNav.locator('a[href="/admin/dashboard"]')).toBeVisible()
    await expect(bottomNav.locator('a[href="/admin/messages"]')).toBeVisible()
  })

  test('More overflow works', async ({ page }) => {
    await login(page)
    // The More button is in the mobile bottom nav
    const bottomNav = page.locator('nav.fixed.bottom-0')
    const moreButton = bottomNav.locator('button', { hasText: 'More' })
    await expect(moreButton).toBeVisible({ timeout: 5000 })
    await moreButton.click()
    // The overflow menu should show Settings (scoped to the overflow popup, not sidebar)
    const overflowMenu = page.locator('.absolute.bottom-full')
    await expect(overflowMenu.getByText('Settings')).toBeVisible({ timeout: 3000 })
  })

  test('no horizontal scroll', async ({ page }) => {
    await login(page)
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth)
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1)
  })

  test('create tabs switch', async ({ page }) => {
    await login(page)
    // Navigate directly to Create page
    await page.goto('/admin/create')
    await page.waitForURL(/\/admin\/create/, { timeout: 5000 })
    await page.waitForTimeout(1000)
    // Should have Blog Creator heading visible
    await expect(page.getByRole('heading', { name: 'Blog Creator' })).toBeVisible({ timeout: 5000 })
  })
})
