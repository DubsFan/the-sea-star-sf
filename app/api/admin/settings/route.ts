import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { requireAdmin } from '@/lib/auth'

// Keys that admin and social_admin can read/write (blog + newsletter settings)
const MARKETING_SAFE_KEYS = [
  'seo_keywords',
  'blog_keywords',
  'blog_tone_notes',
  'newsletter_cadence',
  'newsletter_next_send',
  'newsletter_template_notes',
  'social_default_mode',
  'social_default_delay_days',
  'social_default_time_local',
  'newsletter_default_mode',
]

export async function GET(request: NextRequest) {
  const session = await requireAdmin(request)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const isSuperAdmin = session.role === 'super_admin'
  const isMarketingRole = session.role === 'admin' || session.role === 'social_admin'

  if (!isSuperAdmin && !isMarketingRole) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let query = supabase
    .from('site_settings')
    .select('key, value, updated_at')
    .order('key')

  // Non-super_admin only gets marketing-safe keys
  if (!isSuperAdmin) {
    query = query.in('key', MARKETING_SAFE_KEYS)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PUT(request: NextRequest) {
  const session = await requireAdmin(request)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { key, value } = await request.json()
  if (!key) return NextResponse.json({ error: 'Key required' }, { status: 400 })

  const isSuperAdmin = session.role === 'super_admin'
  const isMarketingRole = session.role === 'admin' || session.role === 'social_admin'

  // Marketing roles can only write marketing-safe keys
  if (!isSuperAdmin) {
    if (!isMarketingRole || !MARKETING_SAFE_KEYS.includes(key)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  const { error } = await supabase
    .from('site_settings')
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
