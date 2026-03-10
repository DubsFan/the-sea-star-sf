import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { SEA_STAR_VOICE, buildBaseContext, generateWithGroq, cleanJsonResponse } from '@/lib/ai'
import { supabase } from '@/lib/supabase'

// SF-local expansion map for topic validation
const LOCAL_EXPANSIONS: Record<string, string[]> = {
  warriors: ['chase center', 'game day', 'nba', 'basketball', 'golden state'],
  giants: ['oracle park', 'baseball', 'game day', 'sf giants'],
  niners: ['levis stadium', 'football', 'nfl', '49ers'],
  '49ers': ['levis stadium', 'football', 'nfl', 'niners'],
  dogpatch: ['third street', '3rd street', 'potrero hill', 'pier 70', 'neighborhood'],
  cocktails: ['mixology', 'craft drinks', 'bartender', 'happy hour', 'spirits'],
  beer: ['draft beer', 'brewery', 'tap list', 'ipa', 'craft beer'],
  wine: ['wine bar', 'natural wine', 'wine list'],
  brunch: ['weekend brunch', 'breakfast cocktails', 'mimosa', 'bloody mary'],
  date: ['date night', 'romantic', 'couples', 'evening out'],
  dog: ['dog friendly', 'pet friendly', 'dogs welcome', 'patio'],
  music: ['live music', 'dj', 'vinyl', 'jazz'],
  sports: ['sports bar', 'game day', 'watch party', 'big screen'],
}

const STOPWORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'is', 'it', 'this', 'that', 'are', 'was',
  'be', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'can', 'about', 'our', 'we', 'i', 'my',
  'me', 'your', 'some', 'best', 'good', 'great', 'new', 'sf', 'san', 'francisco',
])

function buildTopicTerms(userInput: string): Set<string> {
  const terms = new Set<string>()
  const words = userInput.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean)

  for (const word of words) {
    if (!STOPWORDS.has(word)) {
      terms.add(word)
      // Add expansion terms
      const expansions = LOCAL_EXPANSIONS[word]
      if (expansions) {
        for (const exp of expansions) terms.add(exp)
      }
    }
  }

  // Also check multi-word phrases against expansion keys
  const phrase = words.join(' ')
  for (const [key, expansions] of Object.entries(LOCAL_EXPANSIONS)) {
    if (phrase.includes(key)) {
      terms.add(key)
      for (const exp of expansions) terms.add(exp)
    }
  }

  return terms
}

function scoreTopicMatch(keywords: string[], topicTerms: Set<string>): number {
  if (topicTerms.size === 0) return 10 // no topic = always pass
  const termArr = Array.from(topicTerms)
  let matches = 0
  for (const kw of keywords) {
    const kwLower = kw.toLowerCase()
    for (const term of termArr) {
      if (kwLower.includes(term) || term.includes(kwLower)) {
        matches++
        break
      }
    }
  }
  return matches
}

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
    // Topic-aware keyword suggestion
    const userTopic = context?.trim() || ''
    const topicTerms = buildTopicTerms(userTopic)

    const basePrompt = `You are an SEO keyword researcher for The Sea Star, a craft cocktail bar in San Francisco's Dogpatch neighborhood.

${userTopic ? `The owner wants keyword suggestions related to: "${userTopic}"` : 'Suggest general keywords for the bar.'}

Suggest 10 SEO keywords that:
- Are relevant to ${userTopic ? `"${userTopic}" in the context of` : ''} a neighborhood craft cocktail bar in Dogpatch, SF
- Mix high-volume terms with long-tail phrases
- Include local San Francisco and Dogpatch terms where natural
- Avoid duplicating these existing keywords: ${contextStr}
${libraryKwStr ? `- Consider these imported content themes: ${libraryKwStr}` : ''}

Return ONLY valid JSON: { "keywords": ["keyword1", "keyword2", ...] }`

    const inputText = userTopic
      ? `Topic: ${userTopic}\nExisting keywords: ${contextStr}`
      : `Existing keywords: ${contextStr}`

    try {
      // First attempt
      const content = await generateWithGroq(basePrompt, inputText, { temperature: 0.3, maxTokens: 1000 })
      const parsed = cleanJsonResponse(content) as { keywords?: string[] }
      const resultKeywords = parsed?.keywords || []
      const matchCount = scoreTopicMatch(resultKeywords, topicTerms)

      if (matchCount >= 2 || topicTerms.size === 0) {
        return NextResponse.json({ keywords: resultKeywords, topic_match: true })
      }

      // Retry with stronger prompt
      const retryPrompt = `You are an SEO keyword researcher. The owner of The Sea Star (a craft cocktail bar in Dogpatch, SF) specifically asked for keywords about: "${userTopic}"

Your previous suggestions did not match the topic well enough. This time, make sure at LEAST HALF of your 10 keywords directly relate to "${userTopic}" in the context of a San Francisco bar/restaurant.

Return ONLY valid JSON: { "keywords": ["keyword1", "keyword2", ...] }`

      const retryContent = await generateWithGroq(retryPrompt, inputText, { temperature: 0.3, maxTokens: 1000 })
      const retryParsed = cleanJsonResponse(retryContent) as { keywords?: string[] }
      const retryKeywords = retryParsed?.keywords || []
      const retryMatchCount = scoreTopicMatch(retryKeywords, topicTerms)

      if (retryMatchCount >= 2) {
        return NextResponse.json({ keywords: retryKeywords, topic_match: true })
      }

      // Still weak — return with topic_match: false
      return NextResponse.json({ keywords: retryKeywords, topic_match: false })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'AI generation failed'
      return NextResponse.json({ error: message }, { status: 500 })
    }
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
