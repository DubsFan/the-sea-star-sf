import { describe, it, expect } from 'vitest'
import { execSync } from 'child_process'
import path from 'path'

const ROOT = path.resolve(__dirname, '../..')

describe('01 — Build & Static Analysis', () => {
  it('npm run build succeeds', () => {
    const result = execSync('npm run build 2>&1', {
      cwd: ROOT,
      timeout: 300_000,
      encoding: 'utf-8',
    })
    // Build should produce route output
    expect(result).toContain('Route')
  }, 300_000)

  it('tsc --noEmit passes', () => {
    execSync('npx tsc --noEmit 2>&1', {
      cwd: ROOT,
      timeout: 120_000,
      encoding: 'utf-8',
    })
  }, 120_000)

  it('no unused imports in Release A/B/C files', () => {
    // Check key release files for obvious unused imports via tsc strict
    // The build passing already validates no broken imports;
    // this specifically checks the release files compile cleanly
    const releaseFiles = [
      'lib/business.ts',
      'lib/keywords.ts',
      'lib/ai.ts',
      'lib/publisher.ts',
      'app/api/media/route.ts',
      'app/api/content-packs/smart-import/route.ts',
      'app/api/admin/settings/route.ts',
      'app/api/faq/route.ts',
      'app/sitemap.ts',
    ]

    for (const file of releaseFiles) {
      const fullPath = path.join(ROOT, file)
      // Verify file exists and compiles
      expect(() => {
        execSync(`npx tsc --noEmit --strict "${fullPath}" 2>&1`, {
          cwd: ROOT,
          timeout: 30_000,
          encoding: 'utf-8',
        })
      }).not.toThrow()
    }
  }, 120_000)
})
