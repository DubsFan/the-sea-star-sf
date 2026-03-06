import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { groq } from '@/lib/groq'
import { postToFacebook, postToInstagram } from '@/lib/meta'
import { requireAdmin } from '@/lib/auth'

const CAPTION_PROMPT = `You write social media captions for The Sea Star, a craft cocktail bar in San Francisco's Dogpatch neighborhood. Your voice is warm, fun, and unpretentious — like a bartender texting a friend.

Given a blog post title and excerpt, write TWO captions:

1. facebook_caption: 2-3 sentences that tease the story and include a call to action. Max 250 characters.
2. instagram_caption: 2-3 sentences. More casual, can use 1-2 relevant emojis. End with "Link in bio." Include 3-5 hashtags on a new line (#DogpatchSF #SFBars #CraftCocktails etc). Max 300 characters total.

Return ONLY valid JSON with fields: facebook_caption, instagram_caption`

export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request)
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await request.json()

  const { data: post } = await supabase
    .from('blog_posts')
    .select('title, excerpt, slug, featured_image, images')
    .eq('id', id)
    .single()

  if (!post) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  }

  // Generate captions with Groq
  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: CAPTION_PROMPT },
      { role: 'user', content: `Title: ${post.title}\nExcerpt: ${post.excerpt}` },
    ],
    temperature: 0.5,
    max_tokens: 500,
    response_format: { type: 'json_object' },
  })

  const content = completion.choices[0]?.message?.content
  if (!content) {
    return NextResponse.json({ error: 'No AI response' }, { status: 500 })
  }

  const cleaned = content.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim()
  let captions: { facebook_caption: string; instagram_caption: string }
  try {
    captions = JSON.parse(cleaned)
  } catch {
    return NextResponse.json({ error: 'Failed to parse captions', raw: content }, { status: 500 })
  }

  const { data: settings } = await supabase
    .from('site_settings')
    .select('key, value')
    .in('key', ['site_url'])

  const siteUrl = settings?.find(s => s.key === 'site_url')?.value || 'https://theseastarsf.com'
  const blogUrl = `${siteUrl}/blog/${post.slug}`
  const imageUrl = post.featured_image || (post.images && post.images.length > 0 ? post.images[0] : null)

  const results: { facebook?: { success: boolean; id?: string; error?: string }; instagram?: { success: boolean; id?: string; error?: string } } = {}

  // Post to Facebook
  try {
    const fb = await postToFacebook(captions.facebook_caption, blogUrl)
    results.facebook = { success: true, id: fb.id }
    await supabase.from('social_posts').insert({
      blog_post_id: id,
      platform: 'facebook',
      platform_post_id: fb.id,
      caption: captions.facebook_caption,
      status: 'posted',
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    results.facebook = { success: false, error: message }
    await supabase.from('social_posts').insert({
      blog_post_id: id,
      platform: 'facebook',
      caption: captions.facebook_caption,
      status: 'failed',
      error_message: message,
    })
  }

  // Post to Instagram (needs an image)
  if (imageUrl) {
    try {
      const ig = await postToInstagram(imageUrl, captions.instagram_caption)
      results.instagram = { success: true, id: ig.id }
      await supabase.from('social_posts').insert({
        blog_post_id: id,
        platform: 'instagram',
        platform_post_id: ig.id,
        caption: captions.instagram_caption,
        status: 'posted',
      })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      results.instagram = { success: false, error: message }
      await supabase.from('social_posts').insert({
        blog_post_id: id,
        platform: 'instagram',
        caption: captions.instagram_caption,
        status: 'failed',
        error_message: message,
      })
    }
  } else {
    results.instagram = { success: false, error: 'No image available for Instagram' }
  }

  // Mark social as posted on the blog post
  if (results.facebook?.success || results.instagram?.success) {
    await supabase
      .from('blog_posts')
      .update({ social_posted_at: new Date().toISOString() })
      .eq('id', id)
  }

  return NextResponse.json(results)
}
