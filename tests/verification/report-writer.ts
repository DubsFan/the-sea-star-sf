import fs from 'fs'
import path from 'path'

export interface CheckResult {
  name: string
  status: 'PASS' | 'FAIL' | 'SKIP'
  details?: string
  durationMs?: number
}

export interface CategoryReport {
  id: string
  title: string
  checks: CheckResult[]
  durationMs: number
  runAt: string
}

export function writeReport(report: CategoryReport, dir: string): void {
  const pass = report.checks.filter(c => c.status === 'PASS').length
  const fail = report.checks.filter(c => c.status === 'FAIL').length
  const skip = report.checks.filter(c => c.status === 'SKIP').length
  const total = report.checks.length

  const rows = report.checks.map((c, i) => {
    const det = c.details ? c.details.replace(/\|/g, '\\|').replace(/\n/g, ' ') : ''
    return `| ${i + 1} | ${c.name} | ${c.status} | ${det} |`
  }).join('\n')

  const md = `# ${report.id} — ${report.title}
**Run:** ${report.runAt}
**Duration:** ${(report.durationMs / 1000).toFixed(1)}s
**Result:** ${pass}/${total} PASS${fail > 0 ? ` (${fail} FAIL)` : ''}${skip > 0 ? ` (${skip} SKIP)` : ''}

| # | Check | Status | Details |
|---|-------|--------|---------|
${rows}
`

  fs.writeFileSync(path.join(dir, `${report.id}.md`), md)
}

export function writeSummary(reports: CategoryReport[], dir: string): void {
  const date = new Date().toISOString().split('T')[0]
  let totalPass = 0, totalFail = 0, totalSkip = 0

  const rows = reports.map(r => {
    const p = r.checks.filter(c => c.status === 'PASS').length
    const f = r.checks.filter(c => c.status === 'FAIL').length
    const s = r.checks.filter(c => c.status === 'SKIP').length
    totalPass += p
    totalFail += f
    totalSkip += s
    return `| ${r.id} ${r.title} | ${p} | ${f} | ${s} |`
  }).join('\n')

  const total = totalPass + totalFail + totalSkip

  const md = `# Post-Release Verification Summary
**Date:** ${date}
**Total:** ${total} checks (${totalPass} PASS, ${totalFail} FAIL, ${totalSkip} SKIP)

| Category | Pass | Fail | Skip |
|----------|------|------|------|
${rows}
`

  fs.writeFileSync(path.join(dir, '00-summary.md'), md)
}

export function parseVitestJson(jsonStr: string): Array<{ name: string; status: 'PASS' | 'FAIL' | 'SKIP'; details?: string; durationMs?: number }> {
  try {
    const json = JSON.parse(jsonStr)
    const results: Array<{ name: string; status: 'PASS' | 'FAIL' | 'SKIP'; details?: string; durationMs?: number }> = []

    for (const file of json.testResults || []) {
      for (const test of file.assertionResults || []) {
        results.push({
          name: test.fullName || test.title || 'unknown',
          status: test.status === 'passed' ? 'PASS' : test.status === 'failed' ? 'FAIL' : 'SKIP',
          details: test.failureMessages?.join(' ').slice(0, 200),
          durationMs: test.duration,
        })
      }
    }
    return results
  } catch {
    return []
  }
}

export function parsePlaywrightJson(jsonStr: string): Array<{ name: string; status: 'PASS' | 'FAIL' | 'SKIP'; details?: string; durationMs?: number }> {
  try {
    const json = JSON.parse(jsonStr)
    const results: Array<{ name: string; status: 'PASS' | 'FAIL' | 'SKIP'; details?: string; durationMs?: number }> = []

    for (const suite of json.suites || []) {
      for (const spec of suite.specs || []) {
        const test = spec.tests?.[0]
        const result = test?.results?.[0]
        results.push({
          name: spec.title || 'unknown',
          status: result?.status === 'passed' ? 'PASS' : result?.status === 'skipped' ? 'SKIP' : 'FAIL',
          details: result?.error?.message?.slice(0, 200),
          durationMs: result?.duration,
        })
      }
    }
    return results
  } catch {
    return []
  }
}
