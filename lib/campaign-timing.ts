/**
 * Pure date/time helpers for campaign scheduling.
 * Timezone locked to America/Los_Angeles. No external deps.
 */

const TZ = 'America/Los_Angeles'

export type DayOfWeek =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday'

const DAY_INDEX: Record<DayOfWeek, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
}

/**
 * Get the Pacific-time parts of a Date object.
 */
function toPacificParts(d: Date): { year: number; month: number; day: number; hour: number; minute: number } {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  const parts = fmt.formatToParts(d)
  const get = (type: string) => parseInt(parts.find(p => p.type === type)?.value || '0', 10)
  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hour: get('hour') === 24 ? 0 : get('hour'),
    minute: get('minute'),
  }
}

/**
 * Combine a date string (YYYY-MM-DD) and time string (HH:MM)
 * in Pacific time into an ISO string.
 */
export function combineDateTimePacific(dateStr: string, timeStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const [hour, minute] = timeStr.split(':').map(Number)

  // Try PST (UTC-8) and PDT (UTC-7) — verify with Intl
  for (const offset of [8, 7]) {
    const candidate = new Date(Date.UTC(year, month - 1, day, hour + offset, minute))
    const p = toPacificParts(candidate)
    if (p.year === year && p.month === month && p.day === day && p.hour === hour && p.minute === minute) {
      return candidate.toISOString()
    }
  }

  // Fallback: assume PST
  return new Date(Date.UTC(year, month - 1, day, hour + 8, minute)).toISOString()
}

/**
 * Split an ISO string into Pacific date and time parts
 * suitable for native <input type="date"> and <input type="time">.
 */
export function splitToPacificParts(iso: string): { date: string; time: string } {
  const d = new Date(iso)
  const p = toPacificParts(d)
  const date = `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`
  const time = `${String(p.hour).padStart(2, '0')}:${String(p.minute).padStart(2, '0')}`
  return { date, time }
}

/**
 * Compute the next occurrence of a day-of-week at the given local time.
 * If today is the target day and the time hasn't passed, returns today.
 * Otherwise returns next week's occurrence.
 */
export function computeNextDayOfWeek(day: DayOfWeek, timeLocal: string, now?: Date): string {
  const current = now || new Date()
  const p = toPacificParts(current)
  const todayIndex = current.toLocaleDateString('en-US', { timeZone: TZ, weekday: 'long' }).toLowerCase()
  const todayDayIndex = DAY_INDEX[todayIndex as DayOfWeek] ?? 0
  const targetDayIndex = DAY_INDEX[day]

  let daysAhead = targetDayIndex - todayDayIndex
  if (daysAhead < 0) daysAhead += 7
  if (daysAhead === 0) {
    // Same day — check if time has passed
    const [h, m] = timeLocal.split(':').map(Number)
    if (p.hour > h || (p.hour === h && p.minute >= m)) {
      daysAhead = 7
    }
  }

  const targetDate = new Date(current.getTime() + daysAhead * 24 * 60 * 60 * 1000)
  const tp = toPacificParts(targetDate)
  const dateStr = `${tp.year}-${String(tp.month).padStart(2, '0')}-${String(tp.day).padStart(2, '0')}`
  return combineDateTimePacific(dateStr, timeLocal)
}

/**
 * Compute the scheduled date for an event-relative preset.
 */
export function computeEventPresetDate(
  eventStartsAt: string,
  preset: '2-before' | 'day-of' | 'day-after',
  timeLocal: string,
): string {
  const eventDate = new Date(eventStartsAt)
  let offsetDays: number
  switch (preset) {
    case '2-before': offsetDays = -2; break
    case 'day-of': offsetDays = 0; break
    case 'day-after': offsetDays = 1; break
  }

  const shifted = new Date(eventDate.getTime() + offsetDays * 24 * 60 * 60 * 1000)
  const p = toPacificParts(shifted)
  const dateStr = `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`
  return combineDateTimePacific(dateStr, timeLocal)
}

/**
 * Format an ISO string into a human-readable Pacific time string.
 * e.g. "Tue Mar 10 at 10:00 AM"
 */
export function formatPacificDateTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', {
    timeZone: TZ,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }) + ' at ' + d.toLocaleTimeString('en-US', {
    timeZone: TZ,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

/**
 * If a date falls on Saturday or Sunday (Pacific), roll forward to Monday
 * at the same local time.
 */
export function rollForwardIfWeekend(iso: string): string {
  const d = new Date(iso)
  const dayName = d.toLocaleDateString('en-US', { timeZone: TZ, weekday: 'long' }).toLowerCase()
  if (dayName === 'saturday' || dayName === 'sunday') {
    const daysToMonday = dayName === 'saturday' ? 2 : 1
    const { date, time } = splitToPacificParts(iso)
    const mondayDate = new Date(d.getTime() + daysToMonday * 24 * 60 * 60 * 1000)
    const mp = toPacificParts(mondayDate)
    const mondayStr = `${mp.year}-${String(mp.month).padStart(2, '0')}-${String(mp.day).padStart(2, '0')}`
    return combineDateTimePacific(mondayStr, time)
  }
  return iso
}
