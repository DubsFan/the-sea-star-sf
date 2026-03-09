/**
 * Dependency injection container.
 * Production code uses defaultDeps. Tests supply fakes.
 */
import { supabase } from './supabase'
import { groq } from './groq'
import { resend } from './resend'
import { postToFacebook, postToInstagram } from './meta'
import { randomUUID } from 'crypto'

export interface AiProvider {
  generate(systemPrompt: string, userInput: string, options?: { temperature?: number; maxTokens?: number; jsonMode?: boolean }): Promise<string>
}

export interface EmailProvider {
  batchSend(emails: { from: string; to: string; subject: string; html: string }[]): Promise<void>
}

export interface SocialProvider {
  postToFacebook(message: string, link: string): Promise<{ id: string }>
  postToInstagram(imageUrl: string, caption: string): Promise<{ id: string }>
}

export interface Clock {
  now(): Date
}

export interface IdFactory {
  uuid(): string
}

export interface AppDeps {
  db: typeof supabase
  ai: AiProvider
  email: EmailProvider
  social: SocialProvider
  clock: Clock
  idFactory: IdFactory
}

const defaultAi: AiProvider = {
  async generate(systemPrompt, userInput, options) {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userInput },
      ],
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 2000,
      ...(options?.jsonMode !== false ? { response_format: { type: 'json_object' as const } } : {}),
    })
    const content = completion.choices[0]?.message?.content
    if (!content) throw new Error('No response from AI')
    return content
  },
}

const defaultEmail: EmailProvider = {
  async batchSend(emails) {
    await resend.batch.send(emails)
  },
}

const defaultSocial: SocialProvider = {
  postToFacebook,
  postToInstagram,
}

const defaultClock: Clock = {
  now: () => new Date(),
}

const defaultIdFactory: IdFactory = {
  uuid: () => randomUUID(),
}

export const defaultDeps: AppDeps = {
  db: supabase,
  ai: defaultAi,
  email: defaultEmail,
  social: defaultSocial,
  clock: defaultClock,
  idFactory: defaultIdFactory,
}
