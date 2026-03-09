import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { requireAdmin } from '@/lib/auth'
import { SEA_STAR_VOICE, buildBaseContext, generateWithGroq, cleanJsonResponse } from '@/lib/ai'
import { logActivity } from '@/lib/activity'

const BLOG_PROMPT = `You are the blog writer for The Sea Star. ${SEA_STAR_VOICE}

Given a blog seed topic with optional starter text, write a blog post. Expand the idea into a full post with 3-5 paragraphs, 400-700 words total. Develop each idea with detail, color, and personality.

Return a JSON object with exactly these fields:
- title: catchy, 8-12 words
- body: 3-5 paragraphs of HTML (use <p> tags), 400-700 words total
- excerpt: 1-2 sentences for the blog listing card
- meta_description: SEO meta description, under 160 characters

Return ONLY valid JSON. No markdown code fences.`

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin(request)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!['super_admin', 'admin', 'social_admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params

  // Get the library item
  const { data: item, error: itemError } = await supabase
    .from('content_library_items')
    .select('*')
    .eq('id', id)
    .eq('asset_type', 'blog_seed')
    .single()

  if (itemError || !item) {
    return NextResponse.json({ error: 'Blog seed not found' }, { status: 404 })
  }

  if (item.status === 'drafted' || item.status === 'published') {
    return NextResponse.json({ error: 'This seed has already been drafted' }, { status: 400 })
  }

  // Load brief from pack
  const { data: pack } = await supabase
    .from('content_packs')
    .select('brief_markdown')
    .eq('id', item.pack_id)
    .single()

  // Build prompt
  const { keywords, toneNotes } = await buildBaseContext()

  let systemPrompt = BLOG_PROMPT
  if (keywords) systemPrompt += `\n\nPreferred topics and keywords to weave in when relevant: ${keywords}`
  if (toneNotes) systemPrompt += `\n\nAdditional style guidance: ${toneNotes}`
  if (pack?.brief_markdown) systemPrompt += `\n\nContent brief:\n${pack.brief_markdown}`
  if (item.primary_keyword) systemPrompt += `\n\nSEO focus keyword to naturally weave into the title, first paragraph, and meta_description: "${item.primary_keyword}"`

  const rawInput = item.starter
    ? `${item.title}\n\n${item.starter}`
    : item.title

  try {
    const content = await generateWithGroq(systemPrompt, rawInput)
    const generated = cleanJsonResponse(content) as { title: string; body: string; excerpt: string; meta_description: string }

    if (!generated || !generated.title) {
      return NextResponse.json({ error: 'Generation failed' }, { status: 500 })
    }

    // Create blog post draft
    const slug = generated.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    const { data: post, error: postError } = await supabase
      .from('blog_posts')
      .insert({
        title: generated.title,
        slug,
        body: generated.body,
        excerpt: generated.excerpt || '',
        meta_description: generated.meta_description || '',
        status: 'draft',
        focus_keyword: item.primary_keyword || '',
        source_library_item_id: id,
      })
      .select()
      .single()

    if (postError) return NextResponse.json({ error: postError.message }, { status: 500 })

    // Update library item
    await supabase
      .from('content_library_items')
      .update({
        status: 'drafted',
        linked_blog_post_id: post.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    await logActivity({
      action: 'blog_drafted_from_seed',
      entityType: 'blog_post',
      entityId: post.id,
      summary: `${session.displayName} generated draft from seed: ${item.title}`,
      actor: session.username,
    })

    return NextResponse.json({ post_id: post.id, title: post.title })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'AI generation failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
