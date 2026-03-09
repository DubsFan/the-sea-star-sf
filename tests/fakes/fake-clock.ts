import type { Clock } from '@/lib/deps'

export function createFakeClock(fixedDate: string | Date): Clock {
  const date = typeof fixedDate === 'string' ? new Date(fixedDate) : fixedDate
  return {
    now: () => new Date(date.getTime()),
  }
}
