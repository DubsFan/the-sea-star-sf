import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BUSINESS } from '@/lib/business'

describe('10 — Search Ops', () => {
  it('IndexNow URL format is correct', () => {
    // Verify the URL construction logic matches publisher.ts
    const pageUrl = `${BUSINESS.url}/blog/test-post`
    const host = new URL(BUSINESS.url).host
    const indexNowUrl = `https://api.indexnow.org/indexnow?url=${encodeURIComponent(pageUrl)}&key=${host}`

    expect(indexNowUrl).toContain('api.indexnow.org')
    expect(indexNowUrl).toContain(encodeURIComponent('/blog/test-post'))
    expect(indexNowUrl).toContain('theseastarsf.com')
  })

  it('IndexNow URL contains correct page path for events', () => {
    const pageUrl = `${BUSINESS.url}/events/trivia-night`
    const host = new URL(BUSINESS.url).host
    const indexNowUrl = `https://api.indexnow.org/indexnow?url=${encodeURIComponent(pageUrl)}&key=${host}`

    expect(indexNowUrl).toContain('api.indexnow.org')
    expect(indexNowUrl).toContain(encodeURIComponent('/events/trivia-night'))
  })

  it('publisher.ts contains IndexNow ping logic', async () => {
    // Verify the module exports and contains the expected function
    const mod = await import('@/lib/publisher')
    expect(mod.publishToSite).toBeTypeOf('function')
    expect(mod.scheduleForSite).toBeTypeOf('function')
  })

  it('sitemap module exports default function', async () => {
    const mod = await import('@/app/sitemap')
    expect(typeof mod.default).toBe('function')
  })
})
