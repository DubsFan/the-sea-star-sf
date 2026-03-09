import { NextRequest, NextResponse } from 'next/server'
import { groq } from '@/lib/groq'
import { requireAdmin } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

const BASE_PROMPT = `You are the blog writer for The Sea Star, a craft cocktail bar in San Francisco's Dogpatch neighborhood. The bar has been at 2289 3rd Street since 1899. It's run by award-winning bartender Alicia Walton.

Your voice is: warm, fun, neighborhood bar vibes, Dogpatch pride, cocktail-forward, dog-friendly, unpretentious. You write like a bartender who reads a lot — casual but sharp, never corporate.

Given Alicia's raw notes, write a blog post. IMPORTANT: Expand EVERY sentence she provides into its own full paragraph (3-5 sentences each). If she gives 5 sentences, you write 5 paragraphs minimum. Don't summarize or compress — develop each idea with detail, color, and personality. Total length should be 400-700 words.

Return a JSON object with exactly these fields:
- title: catchy, 8-12 words
- body: 3-5 paragraphs of HTML (use <p> tags), 400-700 words total. Each of Alicia's input sentences should become at least one full paragraph.
- excerpt: 1-2 sentences for the blog listing card
- meta_description: SEO meta description, under 160 characters

Return ONLY valid JSON. No markdown code fences.`

async function buildPrompt(): Promise<string> {
  const { data } = await supabase
    .from('site_settings')
    .select('key, value')
    .in('key', ['blog_keywords', 'blog_tone_notes'])

  let prompt = BASE_PROMPT
  const keywords = data?.find(s => s.key === 'blog_keywords')?.value
  const toneNotes = data?.find(s => s.key === 'blog_tone_notes')?.value

  if (keywords) prompt += `\n\nPreferred topics and keywords to weave in when relevant: ${keywords}`
  if (toneNotes) prompt += `\n\nAdditional style guidance: ${toneNotes}`

  return prompt
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request)
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { raw_input } = await request.json()
  if (!raw_input) {
    return NextResponse.json({ error: 'No input provided' }, { status: 400 })
  }

  const systemPrompt = await buildPrompt()

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: raw_input },
    ],
    temperature: 0.7,
    max_tokens: 2000,
    response_format: { type: 'json_object' },
  })

  const content = completion.choices[0]?.message?.content
  if (!content) {
    return NextResponse.json({ error: 'No response from AI' }, { status: 500 })
  }

  try {
    // Strip markdown code fences if present
    const cleaned = content.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim()
    const parsed = JSON.parse(cleaned)
    return NextResponse.json(parsed)
  } catch {
    return NextResponse.json({ error: 'Failed to parse AI response', raw: content }, { status: 500 })
  }
}
