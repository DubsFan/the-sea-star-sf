import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { SEA_STAR_VOICE, buildBaseContext, generateWithGroq, cleanJsonResponse } from '@/lib/ai'

export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { input, platform, context_type } = await request.json()
  if (!input) return NextResponse.json({ error: 'No input provided' }, { status: 400 })

  const { keywords } = await buildBaseContext()
  const contextLabel = context_type === 'blog' ? 'a blog post' : context_type === 'event' ? 'an event' : 'a standalone post'

  const prompt = `You write social media captions for The Sea Star. ${SEA_STAR_VOICE}

Given notes for ${contextLabel}, write captions:
${platform !== 'instagram' ? '- facebook_caption: 2-3 sentences, call to action. Max 250 characters.' : ''}
${platform !== 'facebook' ? '- instagram_caption: 2-3 sentences, casual, 1-2 emojis. Include 3-5 hashtags. Max 300 characters.' : ''}
${keywords ? `\nNaturally reference these themes when relevant (don't force them): ${keywords}` : ''}

Return ONLY valid JSON.`

  try {
    const content = await generateWithGroq(prompt, input, { temperature: 0.5, maxTokens: 500 })
    const parsed = cleanJsonResponse(content)
    return NextResponse.json(parsed)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'AI generation failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
