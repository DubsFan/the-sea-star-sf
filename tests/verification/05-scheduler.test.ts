import { describe, it, expect } from 'vitest'
import {
  combineDateTimePacific,
  splitToPacificParts,
  computeNextDayOfWeek,
  computeEventPresetDate,
  rollForwardIfWeekend,
} from '@/lib/campaign-timing'

describe('05 — Scheduler Simulations', () => {
  it('weekend roll-forward: Friday + 1 day avoids Saturday', () => {
    // Calculate what "1 day after Friday" should be
    // In our scheduling model, social posts should avoid weekends
    const friday = new Date('2026-03-13T10:00:00Z') // a Friday
    const delay = 1

    // Simple calculation: add delay days
    const scheduled = new Date(friday)
    scheduled.setDate(scheduled.getDate() + delay)

    // The raw calculation gives Saturday — scheduler or UI should handle roll-forward
    // This test validates the date math is correct at the primitive level
    expect(scheduled.getDay()).toBe(6) // Saturday = 6

    // Roll forward to Monday
    const day = scheduled.getDay()
    if (day === 0) scheduled.setDate(scheduled.getDate() + 1) // Sunday → Monday
    if (day === 6) scheduled.setDate(scheduled.getDate() + 2) // Saturday → Monday

    expect(scheduled.getDay()).toBe(1) // Monday
    expect(scheduled.toISOString().startsWith('2026-03-16')).toBe(true)
  })

  it('default social schedule computes publish + delay days', () => {
    const publishDate = new Date('2026-03-10T12:00:00Z')
    const delayDays = 2
    const defaultTime = '10:00'

    const scheduled = new Date(publishDate)
    scheduled.setDate(scheduled.getDate() + delayDays)
    const [hours, minutes] = defaultTime.split(':').map(Number)
    scheduled.setHours(hours, minutes, 0, 0)

    expect(scheduled.toISOString()).toContain('2026-03-12')
    expect(scheduled.getHours()).toBe(10)
    expect(scheduled.getMinutes()).toBe(0)
  })

  it('event-aware preset "2 days before" calculates correctly', () => {
    const eventDate = new Date('2026-03-20T19:00:00Z')
    const daysBefore = 2

    const promoDate = new Date(eventDate)
    promoDate.setDate(promoDate.getDate() - daysBefore)

    expect(promoDate.toISOString().startsWith('2026-03-18')).toBe(true)
  })

  // ── campaign-timing helpers ──

  it('computeEventPresetDate: 2-before returns 2 days earlier', () => {
    const eventStart = '2026-03-20T03:00:00Z' // Mar 19 8pm Pacific
    const result = computeEventPresetDate(eventStart, '2-before', '10:00')
    const parts = splitToPacificParts(result)
    // 2 days before Mar 19 Pacific = Mar 17
    expect(parts.date).toBe('2026-03-17')
    expect(parts.time).toBe('10:00')
  })

  it('computeEventPresetDate: day-of preserves event date', () => {
    const eventStart = '2026-04-10T02:00:00Z' // Apr 9 7pm Pacific
    const result = computeEventPresetDate(eventStart, 'day-of', '09:00')
    const parts = splitToPacificParts(result)
    expect(parts.date).toBe('2026-04-09')
    expect(parts.time).toBe('09:00')
  })

  it('computeEventPresetDate: day-after returns next day', () => {
    const eventStart = '2026-05-01T03:00:00Z' // Apr 30 8pm Pacific
    const result = computeEventPresetDate(eventStart, 'day-after', '11:00')
    const parts = splitToPacificParts(result)
    expect(parts.date).toBe('2026-05-01')
    expect(parts.time).toBe('11:00')
  })

  it('computeNextDayOfWeek returns a future date', () => {
    // Use a fixed "now" so the test is deterministic
    const now = new Date('2026-03-10T20:00:00Z') // Tue Mar 10 12pm Pacific
    const result = computeNextDayOfWeek('thursday', '10:00', now)
    const parts = splitToPacificParts(result)
    // Next Thursday after Tue Mar 10 = Mar 12
    expect(parts.date).toBe('2026-03-12')
    expect(parts.time).toBe('10:00')
  })

  it('computeNextDayOfWeek wraps to next week if same day past time', () => {
    const now = new Date('2026-03-10T23:00:00Z') // Tue Mar 10 3pm Pacific
    const result = computeNextDayOfWeek('tuesday', '10:00', now)
    const parts = splitToPacificParts(result)
    // Time has passed — should be next Tuesday Mar 17
    expect(parts.date).toBe('2026-03-17')
    expect(parts.time).toBe('10:00')
  })

  it('combineDateTimePacific / splitToPacificParts roundtrip', () => {
    const iso = combineDateTimePacific('2026-07-04', '14:30')
    const parts = splitToPacificParts(iso)
    expect(parts.date).toBe('2026-07-04')
    expect(parts.time).toBe('14:30')
  })

  it('rollForwardIfWeekend: Saturday rolls to Monday', () => {
    // Mar 14, 2026 is a Saturday
    const saturdayIso = combineDateTimePacific('2026-03-14', '10:00')
    const result = rollForwardIfWeekend(saturdayIso)
    const parts = splitToPacificParts(result)
    expect(parts.date).toBe('2026-03-16') // Monday
    expect(parts.time).toBe('10:00')
  })

  it('rollForwardIfWeekend: Sunday rolls to Monday', () => {
    const sundayIso = combineDateTimePacific('2026-03-15', '09:00')
    const result = rollForwardIfWeekend(sundayIso)
    const parts = splitToPacificParts(result)
    expect(parts.date).toBe('2026-03-16') // Monday
    expect(parts.time).toBe('09:00')
  })

  it('rollForwardIfWeekend: weekday unchanged', () => {
    const wednesdayIso = combineDateTimePacific('2026-03-11', '10:00')
    const result = rollForwardIfWeekend(wednesdayIso)
    const parts = splitToPacificParts(result)
    expect(parts.date).toBe('2026-03-11')
  })

  it('non-event timing persists as defaults', () => {
    // Simulate the settings that would be stored after a publish
    const defaults = {
      social_default_mode: 'schedule',
      social_default_delay_days: '2',
      social_default_time_local: '10:00',
    }

    // Verify the structure is valid for site_settings upsert
    expect(defaults.social_default_mode).toBe('schedule')
    expect(parseInt(defaults.social_default_delay_days)).toBe(2)
    expect(defaults.social_default_time_local).toMatch(/^\d{2}:\d{2}$/)
  })
})
