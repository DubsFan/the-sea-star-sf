import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { requireAdmin } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(request.url)
  const status = url.searchParams.get('status')
  const contentType = url.searchParams.get('content_type')

  let query = supabase.from('social_campaigns').select('*').order('created_at', { ascending: false })
  if (status) query = query.eq('status', status)
  if (contentType) query = query.eq('content_type', contentType)

  const { data, error } = await query.limit(50)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { data, error } = await supabase.from('social_campaigns').insert({
    content_type: body.content_type || 'standalone',
    source_id: body.source_id || null,
    facebook_caption: body.facebook_caption || null,
    instagram_caption: body.instagram_caption || null,
    image_url: body.image_url || null,
    platforms: body.platforms || ['facebook', 'instagram'],
    status: body.status || 'draft',
    scheduled_for: body.scheduled_for || null,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PUT(request: NextRequest) {
  const admin = await requireAdmin(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { id, ...updates } = body
  updates.updated_at = new Date().toISOString()

  const { data, error } = await supabase.from('social_campaigns').update(updates).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(request: NextRequest) {
  const admin = await requireAdmin(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await request.json()
  await supabase.from('social_campaigns').delete().eq('id', id)
  return NextResponse.json({ success: true })
}
