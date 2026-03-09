import type { EmailProvider } from '@/lib/deps'

export interface SentEmail {
  from: string
  to: string
  subject: string
  html: string
}

export function createFakeEmail(): EmailProvider & { sent: SentEmail[] } {
  const sent: SentEmail[] = []
  return {
    sent,
    async batchSend(emails) {
      sent.push(...emails)
    },
  }
}
