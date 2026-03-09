import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [subs, posts, unread, events, socialConfig] = await Promise.all([
    supabase.from('email_subscribers').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('blog_posts').select('*', { count: 'exact', head: true }),
    supabase.from('contact_submissions').select('*', { count: 'exact', head: true }).eq('is_read', false),
    supabase.from('events').select('*', { count: 'exact', head: true }).eq('status', 'published').gte('starts_at', new Date().toISOString()),
    supabase.from('site_settings').select('value').eq('key', 'meta_page_access_token').single(),
  ])

  // Get published posts count
  const { count: publishedCount } = await supabase
    .from('blog_posts')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'published')

  // Pending review count (status = 'ready' across content types)
  const [readyBlog, readyEvents, readySocial] = await Promise.all([
    supabase.from('blog_posts').select('*', { count: 'exact', head: true }).eq('status', 'ready'),
    supabase.from('events').select('*', { count: 'exact', head: true }).eq('status', 'ready'),
    supabase.from('social_campaigns').select('*', { count: 'exact', head: true }).eq('status', 'ready'),
  ])
  const pendingReview = (readyBlog.count || 0) + (readyEvents.count || 0) + (readySocial.count || 0)

  // Check weekly activity
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  const weekStr = weekAgo.toISOString()

  const [weeklyBlog, weeklySocial] = await Promise.all([
    supabase.from('blog_posts').select('id', { count: 'exact', head: true }).gte('published_at', weekStr),
    supabase.from('social_campaigns').select('id', { count: 'exact', head: true }).eq('status', 'posted').gte('posted_at', weekStr),
  ])

  return NextResponse.json({
    subscribers: subs.count || 0,
    totalPosts: posts.count || 0,
    publishedPosts: publishedCount || 0,
    unreadMessages: unread.count || 0,
    upcomingEvents: events.count || 0,
    pendingReview,
    socialConfigured: !!(socialConfig.data?.value),
    weeklyBlogPublished: (weeklyBlog.count || 0) > 0,
    weeklySocialPosted: (weeklySocial.count || 0) > 0,
    weeklyMessagesRead: (unread.count || 0) === 0,
  })
}
