import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { SEA_STAR_VOICE, buildBaseContext, generateWithGroq, cleanJsonResponse } from '@/lib/ai'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { type, context } = await request.json()

  const { keywords } = await buildBaseContext()
  const contextStr = context || keywords || 'craft cocktail bar, Dogpatch SF, neighborhood bar'

  // Fetch unique primary_keyword values from content library
  const { data: libraryKeywords } = await supabase
    .from('content_library_items')
    .select('primary_keyword')
    .not('primary_keyword', 'is', null)

  const libraryKwStr = Array.from(new Set(
    (libraryKeywords || []).map((r: { primary_keyword: string }) => r.primary_keyword).filter(Boolean)
  )).join(', ')

  let prompt: string
  let input: string

  if (type === 'content_ideas') {
    prompt = `You are an SEO content strategist for a craft cocktail bar. ${SEA_STAR_VOICE}

Given the bar's current keywords and season, suggest 5 blog post ideas that would drive organic traffic. For each, provide:
- title: catchy blog post title
- description: 1-sentence summary
- target_keyword: primary search term to target

Return valid JSON: { ideas: [{ title, description, target_keyword }] }`
    input = `Keywords: ${contextStr}\nCurrent month: ${new Date().toLocaleString('en-US', { month: 'long' })}\nImported content keywords: ${libraryKwStr}`
  } else if (type === 'keywords') {
    prompt = `You are an SEO keyword researcher. Suggest 10 keywords for a craft cocktail bar in San Francisco's Dogpatch neighborhood. Mix high-volume and long-tail keywords. Return valid JSON: { keywords: ["keyword1", "keyword2", ...] }`
    input = `Current keywords: ${contextStr}\nImported content keywords: ${libraryKwStr}`
  } else {
    prompt = `You are an SEO expert. Write an improved meta description for a page. Under 160 characters, compelling, includes key terms. Return valid JSON: { meta_description: "..." }`
    input = context || 'Craft cocktail bar homepage'
  }

  try {
    const content = await generateWithGroq(prompt, input, { maxTokens: 1000 })
    const parsed = cleanJsonResponse(content)
    return NextResponse.json(parsed)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'AI generation failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
