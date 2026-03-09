import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { SEA_STAR_VOICE, buildBaseContext, generateWithGroq, cleanJsonResponse } from '@/lib/ai'

const BLOG_PROMPT = `You are the blog writer for The Sea Star. ${SEA_STAR_VOICE}

Given Alicia's raw notes, write a blog post. IMPORTANT: Expand EVERY sentence she provides into its own full paragraph (3-5 sentences each). If she gives 5 sentences, you write 5 paragraphs minimum. Don't summarize or compress — develop each idea with detail, color, and personality. Total length should be 400-700 words.

Return a JSON object with exactly these fields:
- title: catchy, 8-12 words
- body: 3-5 paragraphs of HTML (use <p> tags), 400-700 words total. Each of Alicia's input sentences should become at least one full paragraph.
- excerpt: 1-2 sentences for the blog listing card
- meta_description: SEO meta description, under 160 characters

Return ONLY valid JSON. No markdown code fences.`

export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request)
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { raw_input, focus_keyword } = await request.json()
  if (!raw_input) {
    return NextResponse.json({ error: 'No input provided' }, { status: 400 })
  }

  const { keywords, toneNotes } = await buildBaseContext()

  let systemPrompt = BLOG_PROMPT
  if (keywords) systemPrompt += `\n\nPreferred topics and keywords to weave in when relevant: ${keywords}`
  if (toneNotes) systemPrompt += `\n\nAdditional style guidance: ${toneNotes}`
  if (focus_keyword) systemPrompt += `\n\nSEO focus keyword to naturally weave into the title, first paragraph, and meta_description: "${focus_keyword}"`

  try {
    const content = await generateWithGroq(systemPrompt, raw_input)
    const parsed = cleanJsonResponse(content)
    return NextResponse.json(parsed)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'AI generation failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
