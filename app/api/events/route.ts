import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { requireAdmin } from '@/lib/auth'
import { logActivity } from '@/lib/activity'
import { computeRecurrenceInstances } from '@/lib/recurrence'
import { randomUUID } from 'crypto'

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const scope = url.searchParams.get('scope')

  // Public: upcoming published events
  if (scope === 'public') {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    const { data } = await supabase
      .from('events')
      .select('id, title, slug, short_description, description_html, featured_image, starts_at, ends_at')
      .eq('status', 'published')
      .eq('is_public', true)
      .gte('starts_at', twoHoursAgo)
      .order('starts_at', { ascending: true })
      .limit(10)
    return NextResponse.json(data || [])
  }

  // Admin: all events
  const admin = await requireAdmin(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('events')
    .select('*')
    .order('starts_at', { ascending: false })

  return NextResponse.json(data || [])
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const slug = body.slug || body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

  const seriesId = body.recurrence_preset && body.recurrence_preset !== 'One time'
    ? randomUUID()
    : null

  // Create the first event
  const { data: event, error } = await supabase.from('events').insert({
    title: body.title,
    slug,
    short_description: body.short_description || null,
    description_html: body.description_html || null,
    featured_image: body.featured_image || null,
    starts_at: body.starts_at,
    ends_at: body.ends_at || null,
    is_public: body.is_public !== false,
    status: 'draft',
    recurrence_preset: body.recurrence_preset || 'One time',
    recurs_until: body.recurs_until || null,
    series_id: seriesId,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Materialize recurring instances
  if (seriesId && body.recurrence_preset !== 'One time') {
    const instances = computeRecurrenceInstances(body, seriesId, slug)
    if (instances.length > 0) {
      await supabase.from('events').insert(instances)
    }
  }

  await logActivity({
    action: 'event_created',
    entityType: 'event',
    entityId: event.id,
    summary: `Event created: ${body.title}`,
    actor: admin.username,
  })

  return NextResponse.json(event)
}

export async function PUT(request: NextRequest) {
  const admin = await requireAdmin(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { id, ...updates } = body

  if (updates.title && !updates.slug) {
    updates.slug = updates.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  }
  updates.updated_at = new Date().toISOString()

  const { data, error } = await supabase.from('events').update(updates).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(request: NextRequest) {
  const admin = await requireAdmin(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, series_id } = await request.json()

  if (series_id) {
    await supabase.from('events').delete().eq('series_id', series_id)
    await logActivity({ action: 'event_series_deleted', entityType: 'event', summary: 'Event series deleted', actor: admin.username })
  } else {
    const { data } = await supabase.from('events').select('title').eq('id', id).single()
    await supabase.from('events').delete().eq('id', id)
    await logActivity({ action: 'event_deleted', entityType: 'event', entityId: id, summary: `Deleted: ${data?.title}`, actor: admin.username })
  }

  return NextResponse.json({ success: true })
}
