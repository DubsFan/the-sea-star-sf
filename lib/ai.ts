import { groq } from './groq'
import { supabase } from './supabase'
import type { AppDeps } from './deps'

export const SEA_STAR_VOICE = `The Sea Star is a craft cocktail bar in San Francisco's Dogpatch neighborhood. The bar has been at 2289 3rd Street since 1899. It's run by award-winning bartender Alicia Walton. The voice is: warm, fun, neighborhood bar vibes, Dogpatch pride, cocktail-forward, dog-friendly, unpretentious. Write like a bartender who reads a lot — casual but sharp, never corporate.`

export async function buildBaseContext(deps?: Pick<AppDeps, 'db'>): Promise<{ keywords: string; toneNotes: string }> {
  const db = deps?.db || supabase
  const { data } = await db
    .from('site_settings')
    .select('key, value')
    .in('key', ['blog_keywords', 'blog_tone_notes'])

  return {
    keywords: data?.find(s => s.key === 'blog_keywords')?.value || '',
    toneNotes: data?.find(s => s.key === 'blog_tone_notes')?.value || '',
  }
}

export function cleanJsonResponse(content: string): unknown {
  const cleaned = content
    .replace(/^```(?:json)?\s*\n?/i, '')
    .replace(/\n?```\s*$/i, '')
    .trim()
  return JSON.parse(cleaned)
}

export async function generateWithGroq(
  systemPrompt: string,
  userInput: string,
  options?: { temperature?: number; maxTokens?: number; jsonMode?: boolean },
  deps?: Pick<AppDeps, 'ai'>
): Promise<string> {
  if (deps?.ai) {
    return deps.ai.generate(systemPrompt, userInput, options)
  }
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
}
