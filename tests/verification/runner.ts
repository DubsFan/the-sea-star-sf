import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { writeReport, writeSummary, parseVitestJson, parsePlaywrightJson } from './report-writer'
import type { CategoryReport, CheckResult } from './report-writer'

const ROOT = path.resolve(__dirname, '../..')
const today = new Date().toISOString().split('T')[0]
const REPORT_DIR = path.join(ROOT, 'output', 'reports', today)

// Ensure report directory exists
fs.mkdirSync(REPORT_DIR, { recursive: true })

const VITEST_CATEGORIES = [
  { id: '01-build-static', title: 'Build & Static Analysis', file: '01-build-static.test.ts' },
  { id: '02-data-integrity', title: 'Data Integrity', file: '02-data-integrity.test.ts' },
  { id: '03-api-contracts', title: 'API Contract Verification', file: '03-api-contracts.test.ts' },
  { id: '04-groq-behavior', title: 'Groq AI Behavior', file: '04-groq-behavior.test.ts' },
  { id: '05-scheduler', title: 'Scheduler Simulations', file: '05-scheduler.test.ts' },
  { id: '06-media', title: 'Media Processing', file: '06-media.test.ts' },
  { id: '09-seo-structured', title: 'SEO & Structured Data', file: '09-seo-structured.test.ts' },
  { id: '10-search-ops', title: 'Search Ops', file: '10-search-ops.test.ts' },
  { id: '11-regression', title: 'Regression', file: '11-regression.test.ts' },
  { id: '12-performance', title: 'Performance', file: '12-performance.test.ts' },
]

const PLAYWRIGHT_CATEGORIES = [
  { id: '07-ui-e2e', title: 'UI E2E', file: '07-ui-e2e.spec.ts' },
  { id: '08-accessibility', title: 'Accessibility', file: '08-accessibility.spec.ts' },
]

const VITEST_CONFIG = path.join(ROOT, 'tests/verification/vitest.verify.config.ts')

function runVitest(file: string): { json: string; durationMs: number; error?: string } {
  const start = Date.now()
  try {
    const output = execSync(
      `npx vitest run "tests/verification/${file}" --config="${VITEST_CONFIG}" --reporter=json 2>/dev/null`,
      { cwd: ROOT, timeout: 600_000, encoding: 'utf-8' },
    )
    return { json: output, durationMs: Date.now() - start }
  } catch (err: unknown) {
    const e = err as { stdout?: string; stderr?: string; message?: string }
    // Vitest exits non-zero on test failures but still produces JSON
    const stdout = e.stdout || ''
    const stderr = e.stderr || ''
    if (stdout.includes('"testResults"')) {
      return { json: stdout, durationMs: Date.now() - start }
    }
    return { json: '', durationMs: Date.now() - start, error: stderr || e.message || 'Unknown error' }
  }
}

function runPlaywright(file: string): { json: string; durationMs: number; error?: string } {
  const start = Date.now()
  const configPath = path.join(ROOT, 'tests/verification/playwright.verify.config.ts')
  try {
    const output = execSync(
      `npx playwright test "${file}" --config="${configPath}" --reporter=json 2>/dev/null`,
      { cwd: ROOT, timeout: 600_000, encoding: 'utf-8' },
    )
    return { json: output, durationMs: Date.now() - start }
  } catch (err: unknown) {
    const e = err as { stdout?: string; stderr?: string; message?: string }
    const stdout = e.stdout || ''
    if (stdout.includes('"suites"')) {
      return { json: stdout, durationMs: Date.now() - start }
    }
    return { json: '', durationMs: Date.now() - start, error: e.stderr || e.message || 'Unknown error' }
  }
}

function buildReport(id: string, title: string, checks: CheckResult[], durationMs: number): CategoryReport {
  return {
    id,
    title,
    checks,
    durationMs,
    runAt: new Date().toISOString().replace('T', ' ').split('.')[0],
  }
}

async function main() {
  console.log(`\n🔍 Post-Release Verification — ${today}`)
  console.log(`   Reports: ${REPORT_DIR}\n`)

  const allReports: CategoryReport[] = []
  let buildPassed = false

  // ── Phase 1: Run vitest categories (01 first, then rest) ──
  console.log('Phase 1: Running vitest categories...\n')

  // Run 01 first — build must pass before Playwright
  {
    const cat = VITEST_CATEGORIES[0]
    console.log(`  [${cat.id}] ${cat.title}...`)
    const result = runVitest(cat.file)

    if (result.error && !result.json) {
      const checks: CheckResult[] = [{ name: 'Build suite', status: 'FAIL', details: result.error.slice(0, 200) }]
      const report = buildReport(cat.id, cat.title, checks, result.durationMs)
      writeReport(report, REPORT_DIR)
      allReports.push(report)
      console.log(`  [${cat.id}] FAIL (${(result.durationMs / 1000).toFixed(1)}s)`)
    } else {
      const checks = parseVitestJson(result.json)
      if (checks.length === 0) {
        checks.push({ name: 'Build suite', status: 'FAIL', details: 'No test results parsed' })
      }
      const report = buildReport(cat.id, cat.title, checks, result.durationMs)
      writeReport(report, REPORT_DIR)
      allReports.push(report)
      buildPassed = checks.every(c => c.status === 'PASS')
      const passCount = checks.filter(c => c.status === 'PASS').length
      console.log(`  [${cat.id}] ${passCount}/${checks.length} PASS (${(result.durationMs / 1000).toFixed(1)}s)`)
    }
  }

  // Run remaining vitest categories
  for (const cat of VITEST_CATEGORIES.slice(1)) {
    console.log(`  [${cat.id}] ${cat.title}...`)
    const result = runVitest(cat.file)

    let checks: CheckResult[]
    if (result.error && !result.json) {
      checks = [{ name: `${cat.title} suite`, status: 'FAIL', details: result.error.slice(0, 200) }]
    } else {
      checks = parseVitestJson(result.json)
      if (checks.length === 0) {
        checks = [{ name: `${cat.title} suite`, status: 'FAIL', details: 'No test results parsed' }]
      }
    }

    const report = buildReport(cat.id, cat.title, checks, result.durationMs)
    writeReport(report, REPORT_DIR)
    allReports.push(report)
    const passCount = checks.filter(c => c.status === 'PASS').length
    console.log(`  [${cat.id}] ${passCount}/${checks.length} PASS (${(result.durationMs / 1000).toFixed(1)}s)`)
  }

  // ── Phase 2: Run Playwright categories (only if build passed) ──
  console.log('\nPhase 2: Running Playwright categories...\n')

  if (!buildPassed) {
    console.log('  ⚠️  Build failed — skipping Playwright E2E tests\n')
    for (const cat of PLAYWRIGHT_CATEGORIES) {
      const checks: CheckResult[] = [{ name: `${cat.title} suite`, status: 'SKIP', details: 'Skipped: build failed' }]
      const report = buildReport(cat.id, cat.title, checks, 0)
      writeReport(report, REPORT_DIR)
      allReports.push(report)
    }
  } else {
    for (const cat of PLAYWRIGHT_CATEGORIES) {
      console.log(`  [${cat.id}] ${cat.title}...`)
      const result = runPlaywright(cat.file)

      let checks: CheckResult[]
      if (result.error && !result.json) {
        checks = [{ name: `${cat.title} suite`, status: 'FAIL', details: result.error.slice(0, 200) }]
      } else {
        checks = parsePlaywrightJson(result.json)
        if (checks.length === 0) {
          checks = [{ name: `${cat.title} suite`, status: 'FAIL', details: 'No test results parsed' }]
        }
      }

      const report = buildReport(cat.id, cat.title, checks, result.durationMs)
      writeReport(report, REPORT_DIR)
      allReports.push(report)
      const passCount = checks.filter(c => c.status === 'PASS').length
      console.log(`  [${cat.id}] ${passCount}/${checks.length} PASS (${(result.durationMs / 1000).toFixed(1)}s)`)
    }
  }

  // ── Phase 3: Generate summary ──
  writeSummary(allReports, REPORT_DIR)

  const totalChecks = allReports.reduce((sum, r) => sum + r.checks.length, 0)
  const totalPass = allReports.reduce((sum, r) => sum + r.checks.filter(c => c.status === 'PASS').length, 0)
  const totalFail = allReports.reduce((sum, r) => sum + r.checks.filter(c => c.status === 'FAIL').length, 0)
  const totalSkip = allReports.reduce((sum, r) => sum + r.checks.filter(c => c.status === 'SKIP').length, 0)

  console.log('\n' + '═'.repeat(50))
  console.log(`  TOTAL: ${totalChecks} checks — ${totalPass} PASS, ${totalFail} FAIL, ${totalSkip} SKIP`)
  console.log(`  Reports written to: ${REPORT_DIR}`)
  console.log('═'.repeat(50) + '\n')

  // Verify report files exist
  const expectedFiles = [
    '00-summary.md',
    ...allReports.map(r => `${r.id}.md`),
  ]
  const missing = expectedFiles.filter(f => !fs.existsSync(path.join(REPORT_DIR, f)))
  if (missing.length > 0) {
    console.error(`Missing report files: ${missing.join(', ')}`)
    process.exit(1)
  }

  // Exit with non-zero if critical categories failed
  const criticalCategories = ['01-build-static', '02-data-integrity', '03-api-contracts', '09-seo-structured', '10-search-ops', '11-regression']
  const criticalFails = allReports
    .filter(r => criticalCategories.includes(r.id))
    .filter(r => r.checks.some(c => c.status === 'FAIL'))

  if (criticalFails.length > 0) {
    console.error(`Critical failures in: ${criticalFails.map(r => r.id).join(', ')}`)
    process.exit(1)
  }
}

main().catch(err => {
  console.error('Runner failed:', err)
  process.exit(1)
})
