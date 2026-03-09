import { describe, it, expect } from 'vitest'
import { computeRecurrenceInstances, type RecurrenceBase } from '@/lib/recurrence'

const baseEvent: RecurrenceBase = {
  title: 'Trivia Night',
  short_description: 'Weekly pub trivia',
  description_html: '<p>Fun!</p>',
  featured_image: '/trivia.jpg',
  starts_at: '2026-03-01T19:00:00.000Z',
  ends_at: '2026-03-01T21:00:00.000Z',
  is_public: true,
  recurrence_preset: 'Weekly',
}

describe('computeRecurrenceInstances', () => {
  it('generates weekly instances', () => {
    const instances = computeRecurrenceInstances(
      baseEvent, 'series-1', 'trivia-night',
      new Date('2026-03-01T00:00:00Z'),
    )
    expect(instances.length).toBeGreaterThan(0)
    expect(instances.length).toBeLessThanOrEqual(13)

    // First instance is 7 days after start
    const first = new Date(instances[0].starts_at)
    const start = new Date(baseEvent.starts_at)
    expect(first.getTime() - start.getTime()).toBe(7 * 24 * 60 * 60 * 1000)
  })

  it('generates biweekly instances', () => {
    const biweekly = { ...baseEvent, recurrence_preset: 'Every 2 weeks' }
    const instances = computeRecurrenceInstances(
      biweekly, 'series-2', 'trivia',
      new Date('2026-03-01T00:00:00Z'),
    )
    expect(instances.length).toBeGreaterThan(0)

    const first = new Date(instances[0].starts_at)
    const start = new Date(baseEvent.starts_at)
    expect(first.getTime() - start.getTime()).toBe(14 * 24 * 60 * 60 * 1000)
  })

  it('generates monthly instances', () => {
    const monthly = { ...baseEvent, recurrence_preset: 'Monthly' }
    const instances = computeRecurrenceInstances(
      monthly, 'series-3', 'trivia',
      new Date('2026-03-01T00:00:00Z'),
    )
    expect(instances.length).toBeGreaterThan(0)

    const first = new Date(instances[0].starts_at)
    const start = new Date(baseEvent.starts_at)
    expect(first.getTime() - start.getTime()).toBe(30 * 24 * 60 * 60 * 1000)
  })

  it('respects recurs_until', () => {
    const bounded = {
      ...baseEvent,
      recurs_until: '2026-03-22',
    }
    const instances = computeRecurrenceInstances(
      bounded, 'series-4', 'trivia',
      new Date('2026-03-01T00:00:00Z'),
    )
    // Mar 8 and Mar 15 are within range; Mar 22 19:00 UTC exceeds Mar 22 00:00 UTC cutoff
    expect(instances.length).toBe(2)
    for (const inst of instances) {
      expect(new Date(inst.starts_at).getTime()).toBeLessThanOrEqual(new Date('2026-03-22').getTime())
    }
  })

  it('caps at 13 instances', () => {
    const farOut = {
      ...baseEvent,
      recurs_until: '2027-12-31',
    }
    const instances = computeRecurrenceInstances(
      farOut, 'series-5', 'trivia',
      new Date('2026-03-01T00:00:00Z'),
    )
    expect(instances.length).toBe(13)
  })

  it('returns empty for invalid preset', () => {
    const invalid = { ...baseEvent, recurrence_preset: 'Daily' }
    const instances = computeRecurrenceInstances(
      invalid, 'series-6', 'trivia',
      new Date('2026-03-01T00:00:00Z'),
    )
    expect(instances).toEqual([])
  })

  it('preserves duration', () => {
    const instances = computeRecurrenceInstances(
      baseEvent, 'series-7', 'trivia',
      new Date('2026-03-01T00:00:00Z'),
    )
    for (const inst of instances) {
      expect(inst.ends_at).toBeTruthy()
      const duration = new Date(inst.ends_at!).getTime() - new Date(inst.starts_at).getTime()
      expect(duration).toBe(2 * 60 * 60 * 1000) // 2 hours
    }
  })

  it('generates dated slug suffixes', () => {
    const instances = computeRecurrenceInstances(
      baseEvent, 'series-8', 'trivia-night',
      new Date('2026-03-01T00:00:00Z'),
    )
    expect(instances[0].slug).toBe('trivia-night-2026-03-08')
  })

  it('sets series_id on all instances', () => {
    const instances = computeRecurrenceInstances(
      baseEvent, 'my-series', 'trivia',
      new Date('2026-03-01T00:00:00Z'),
    )
    for (const inst of instances) {
      expect(inst.series_id).toBe('my-series')
    }
  })
})
