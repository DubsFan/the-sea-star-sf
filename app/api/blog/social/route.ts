import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { requireAdmin } from '@/lib/auth'
import { SEA_STAR_VOICE, generateWithGroq, cleanJsonResponse } from '@/lib/ai'
import { executeSocialPost } from '@/lib/social-post'

// Compatibility wrapper — delegates to shared social flow
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

  const captionPrompt = `You write social media captions for The Sea Star. ${SEA_STAR_VOICE}

Given a blog post title and excerpt, write TWO captions:
1. facebook_caption: 2-3 sentences that tease the story and include a call to action. Max 250 characters.
2. instagram_caption: 2-3 sentences. More casual, can use 1-2 relevant emojis. End with "Link in bio." Include 3-5 hashtags on a new line. Max 300 characters total.

Return ONLY valid JSON with fields: facebook_caption, instagram_caption`

  const content = await generateWithGroq(
    captionPrompt,
    `Title: ${post.title}\nExcerpt: ${post.excerpt}`,
    { temperature: 0.5, maxTokens: 500 }
  )
  const captions = cleanJsonResponse(content) as { facebook_caption: string; instagram_caption: string }

  const imageUrl = post.featured_image || (post.images && post.images.length > 0 ? post.images[0] : null)

  // Create campaign + execute
  const { data: campaign } = await supabase.from('social_campaigns').insert({
    content_type: 'blog',
    source_id: id,
    facebook_caption: captions.facebook_caption,
    instagram_caption: captions.instagram_caption,
    image_url: imageUrl,
    status: 'draft',
  }).select('id').single()

  if (!campaign) {
    return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 })
  }

  const results = await executeSocialPost(campaign.id, admin.username)

  // Update blog post
  const anySuccess = Object.values(results).some((r: { success: boolean }) => r.success)
  if (anySuccess) {
    await supabase.from('blog_posts').update({ social_posted_at: new Date().toISOString() }).eq('id', id)
  }

  return NextResponse.json(results)
}
