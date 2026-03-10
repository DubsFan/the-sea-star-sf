import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { requireAdmin } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [blogRes, eventsRes, socialRes, mailerRes] = await Promise.all([
    supabase
      .from('blog_posts')
      .select('id, title, status, updated_at, created_at, images')
      .in('status', ['draft', 'ready'])
      .order('updated_at', { ascending: false }),
    supabase
      .from('events')
      .select('id, title, status, updated_at, created_at, featured_image')
      .in('status', ['draft', 'ready'])
      .order('updated_at', { ascending: false }),
    supabase
      .from('social_campaigns')
      .select('id, facebook_caption, instagram_caption, status, updated_at, created_at, image_url')
      .in('status', ['draft', 'ready'])
      .order('updated_at', { ascending: false }),
    supabase
      .from('mailer_campaigns')
      .select('id, subject, status, updated_at, created_at, hero_image')
      .in('status', ['draft', 'ready'])
      .order('updated_at', { ascending: false }),
  ])

  const drafts: Array<{
    id: string; type: string; title: string; status: string; updated_at: string; note_count: number; image_url: string | null
  }> = []

  // Blog posts
  for (const post of blogRes.data || []) {
    const images = post.images as string[] | null
    drafts.push({
      id: post.id,
      type: 'blog_post',
      title: post.title || 'Untitled',
      status: post.status,
      updated_at: post.updated_at || post.created_at,
      note_count: 0,
      image_url: images?.[0] || null,
    })
  }

  // Events
  for (const event of eventsRes.data || []) {
    drafts.push({
      id: event.id,
      type: 'event',
      title: event.title || 'Untitled',
      status: event.status,
      updated_at: event.updated_at || event.created_at,
      note_count: 0,
      image_url: event.featured_image || null,
    })
  }

  // Social campaigns
  for (const campaign of socialRes.data || []) {
    const caption = campaign.facebook_caption || campaign.instagram_caption || ''
    drafts.push({
      id: campaign.id,
      type: 'social_campaign',
      title: caption.length > 60 ? caption.slice(0, 57) + '...' : caption || 'No caption',
      status: campaign.status,
      updated_at: campaign.updated_at || campaign.created_at,
      note_count: 0,
      image_url: campaign.image_url || null,
    })
  }

  // Mailer campaigns
  for (const mailer of mailerRes.data || []) {
    drafts.push({
      id: mailer.id,
      type: 'mailer_campaign',
      title: mailer.subject || 'Untitled email',
      status: mailer.status,
      updated_at: mailer.updated_at || mailer.created_at,
      note_count: 0,
      image_url: mailer.hero_image || null,
    })
  }

  // Get note counts for all draft items
  if (drafts.length > 0) {
    const ids = drafts.map(d => d.id)
    const { data: noteCounts } = await supabase
      .from('draft_notes')
      .select('entity_id')
      .in('entity_id', ids)

    if (noteCounts) {
      const counts: Record<string, number> = {}
      for (const n of noteCounts) {
        counts[n.entity_id] = (counts[n.entity_id] || 0) + 1
      }
      for (const draft of drafts) {
        draft.note_count = counts[draft.id] || 0
      }
    }
  }

  // Sort by updated_at DESC
  drafts.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())

  return NextResponse.json(drafts)
}
