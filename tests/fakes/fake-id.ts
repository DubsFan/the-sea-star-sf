import type { IdFactory } from '@/lib/deps'

export function createFakeIdFactory(ids: string[]): IdFactory {
  let index = 0
  return {
    uuid() {
      if (index >= ids.length) throw new Error('Ran out of fake IDs')
      return ids[index++]
    },
  }
}
