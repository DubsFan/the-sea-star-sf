/**
 * Pure recurrence math — no DB access.
 * Computes materialized instances for a recurring event.
 */

export interface RecurrenceBase {
  title: string
  short_description?: string | null
  description_html?: string | null
  featured_image?: string | null
  starts_at: string
  ends_at?: string | null
  is_public?: boolean
  recurrence_preset: string
  recurs_until?: string | null
}

export interface RecurrenceInstance {
  title: string
  slug: string
  short_description: string | null
  description_html: string | null
  featured_image: string | null
  starts_at: string
  ends_at: string | null
  is_public: boolean
  status: string
  recurrence_preset: string
  series_id: string
}

const INTERVAL_DAYS: Record<string, number> = {
  'Weekly': 7,
  'Every 2 weeks': 14,
  'Monthly': 30,
}

const MAX_INSTANCES = 13
const DEFAULT_HORIZON_DAYS = 90

export function computeRecurrenceInstances(
  base: RecurrenceBase,
  seriesId: string,
  slug: string,
  now?: Date,
): RecurrenceInstance[] {
  const days = INTERVAL_DAYS[base.recurrence_preset]
  if (!days) return []

  const currentTime = now || new Date()
  const maxDate = base.recurs_until
    ? new Date(base.recurs_until)
    : new Date(currentTime.getTime() + DEFAULT_HORIZON_DAYS * 24 * 60 * 60 * 1000)

  const startDate = new Date(base.starts_at)
  const duration = base.ends_at
    ? new Date(base.ends_at).getTime() - startDate.getTime()
    : 0

  const instances: RecurrenceInstance[] = []
  let current = new Date(startDate.getTime() + days * 24 * 60 * 60 * 1000)

  while (current <= maxDate && instances.length < MAX_INSTANCES) {
    const endsAt = duration ? new Date(current.getTime() + duration).toISOString() : null
    instances.push({
      title: base.title,
      slug: `${slug}-${current.toISOString().slice(0, 10)}`,
      short_description: base.short_description || null,
      description_html: base.description_html || null,
      featured_image: base.featured_image || null,
      starts_at: current.toISOString(),
      ends_at: endsAt,
      is_public: base.is_public !== false,
      status: 'draft',
      recurrence_preset: base.recurrence_preset,
      series_id: seriesId,
    })
    current = new Date(current.getTime() + days * 24 * 60 * 60 * 1000)
  }

  return instances
}
