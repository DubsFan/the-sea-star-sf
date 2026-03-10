import { describe, it, expect } from 'vitest'
import { BUSINESS } from '@/lib/business'

describe('09 — SEO & Structured Data', () => {
  it('BUSINESS.url is correct', () => {
    expect(BUSINESS.url).toBe('https://theseastarsf.com')
  })

  it('BUSINESS.address is complete', () => {
    expect(BUSINESS.address.streetAddress).toBe('2289 3rd Street')
    expect(BUSINESS.address.addressLocality).toBe('San Francisco')
    expect(BUSINESS.address.addressRegion).toBe('CA')
    expect(BUSINESS.address.postalCode).toBe('94107')
    expect(BUSINESS.address.addressCountry).toBe('US')
  })

  it('BUSINESS.telephone is set', () => {
    expect(BUSINESS.telephone).toBeTruthy()
    expect(BUSINESS.telephone).toMatch(/\(\d{3}\)\s?\d{3}-\d{4}/)
  })

  it('BUSINESS.geo coordinates are in SF', () => {
    // SF lat: ~37.7, lon: ~-122.4
    expect(BUSINESS.geo.latitude).toBeGreaterThan(37.5)
    expect(BUSINESS.geo.latitude).toBeLessThan(38.0)
    expect(BUSINESS.geo.longitude).toBeGreaterThan(-123)
    expect(BUSINESS.geo.longitude).toBeLessThan(-122)
  })

  it('BUSINESS.openingHours has all days', () => {
    expect(BUSINESS.openingHours.length).toBeGreaterThanOrEqual(4)
    const joined = BUSINESS.openingHours.join(' ')
    expect(joined).toContain('Mo')
    expect(joined).toContain('Fr')
    expect(joined).toContain('Sa')
    expect(joined).toContain('Su')
  })

  it('BUSINESS.sameAs has social profiles', () => {
    expect(BUSINESS.sameAs.length).toBeGreaterThanOrEqual(3)
    const joined = BUSINESS.sameAs.join(' ')
    expect(joined).toContain('instagram.com')
    expect(joined).toContain('facebook.com')
    expect(joined).toContain('yelp.com')
  })

  it('BUSINESS.menuUrl and reservationUrl are set', () => {
    expect(BUSINESS.menuUrl).toContain('theseastarsf.com')
    expect(BUSINESS.reservationUrl).toContain('perfectvenue.com')
  })

  it('BUSINESS.founder is Alicia Walton', () => {
    expect(BUSINESS.founder.name).toBe('Alicia Walton')
  })

  it('BUSINESS.amenities includes dog-friendly', () => {
    expect(BUSINESS.amenities.dogFriendly).toBe(true)
  })

  it('sitemap.ts exists', async () => {
    // Verify the sitemap module is importable
    const sitemap = await import('@/app/sitemap')
    expect(sitemap.default).toBeTypeOf('function')
  })

  it('layout.tsx contains BarOrPub JSON-LD', () => {
    const fs = require('fs')
    const path = require('path')
    const src = fs.readFileSync(path.resolve(__dirname, '../../app/layout.tsx'), 'utf-8')
    expect(src).toContain('application/ld+json')
    expect(src).toContain('BarOrPub')
    expect(src).toContain('Organization')
  })

  it('blog post page contains BlogPosting JSON-LD', () => {
    const fs = require('fs')
    const path = require('path')
    const src = fs.readFileSync(path.resolve(__dirname, '../../app/blog/[slug]/page.tsx'), 'utf-8')
    expect(src).toContain('BlogPosting')
    expect(src).toContain('wordCount')
  })
})
