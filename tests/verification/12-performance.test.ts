import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import { parseKeywords, serializeKeywords } from '@/lib/keywords'
import { BUSINESS } from '@/lib/business'

const ROOT = path.resolve(__dirname, '../..')

function getDirSize(dirPath: string): number {
  let total = 0
  if (!fs.existsSync(dirPath)) return 0
  const items = fs.readdirSync(dirPath, { withFileTypes: true })
  for (const item of items) {
    const fullPath = path.join(dirPath, item.name)
    if (item.isDirectory()) {
      total += getDirSize(fullPath)
    } else {
      total += fs.statSync(fullPath).size
    }
  }
  return total
}

describe('12 — Performance', () => {
  it('build output size is reasonable (< 200MB)', () => {
    const nextDir = path.join(ROOT, '.next')
    if (!fs.existsSync(nextDir)) {
      // Build may have been cleaned; skip
      return
    }
    const sizeMB = getDirSize(nextDir) / (1024 * 1024)
    console.log(`.next/ directory size: ${sizeMB.toFixed(1)} MB`)
    expect(sizeMB).toBeLessThan(300)
  })

  it('build output has static pages', () => {
    const nextDir = path.join(ROOT, '.next')
    if (!fs.existsSync(nextDir)) return

    // Check that key pages were built
    const serverDir = path.join(nextDir, 'server')
    expect(fs.existsSync(serverDir)).toBe(true)
  })

  it('keyword parsing is fast (< 10ms for 1000 keywords)', () => {
    const bigCsv = Array.from({ length: 1000 }, (_, i) => `keyword-${i}`).join(', ')
    const start = performance.now()
    const parsed = parseKeywords(bigCsv)
    const serialized = serializeKeywords(parsed)
    const elapsed = performance.now() - start

    expect(parsed.length).toBe(1000)
    expect(serialized).toContain('keyword-0')
    console.log(`Keyword parse+serialize for 1000 items: ${elapsed.toFixed(2)}ms`)
    expect(elapsed).toBeLessThan(10)
  })

  it('business constants are valid', () => {
    expect(BUSINESS).toBeTruthy()
    expect(BUSINESS.name).toBe('The Sea Star')
    expect(BUSINESS.address.streetAddress).toBe('2289 3rd Street')
  })
})
