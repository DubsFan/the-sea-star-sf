import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { SEA_STAR_VOICE, buildBaseContext, generateWithGroq, cleanJsonResponse } from '@/lib/ai'

export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { raw_input } = await request.json()
  if (!raw_input) return NextResponse.json({ error: 'No input provided' }, { status: 400 })

  const { keywords } = await buildBaseContext()

  const eventPrompt = `You write event descriptions for The Sea Star. ${SEA_STAR_VOICE}

Given raw notes about an event, write:
- title: catchy event name, 3-8 words
- description_html: 1-2 paragraphs of HTML (use <p> tags) describing the event with warmth and excitement
- short_description: 1 sentence for the event card (under 120 characters)
${keywords ? `\nNaturally reference these themes when relevant (don't force them): ${keywords}` : ''}

Return ONLY valid JSON. No markdown code fences.`

  try {
    const content = await generateWithGroq(eventPrompt, raw_input, { maxTokens: 1000 })
    const parsed = cleanJsonResponse(content)
    return NextResponse.json(parsed)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'AI generation failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
