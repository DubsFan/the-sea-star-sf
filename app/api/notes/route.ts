import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { requireAdmin } from '@/lib/auth'
import { logActivity } from '@/lib/activity'

const VALID_ENTITY_TYPES = ['blog_post', 'event', 'social_campaign', 'mailer_campaign']

export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(request.url)
  const entityType = url.searchParams.get('entity_type')
  const entityId = url.searchParams.get('entity_id')

  if (!entityType || !entityId || !VALID_ENTITY_TYPES.includes(entityType)) {
    return NextResponse.json({ error: 'entity_type and entity_id required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('draft_notes')
    .select('*')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { entity_type, entity_id, body: noteBody } = body

  if (!entity_type || !entity_id || !noteBody?.trim()) {
    return NextResponse.json({ error: 'entity_type, entity_id, and body required' }, { status: 400 })
  }

  if (!VALID_ENTITY_TYPES.includes(entity_type)) {
    return NextResponse.json({ error: 'Invalid entity_type' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('draft_notes')
    .insert({
      entity_type,
      entity_id,
      author: admin.username,
      body: noteBody.trim(),
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await logActivity({
    action: 'note_added',
    entityType: entity_type,
    entityId: entity_id,
    summary: `${admin.displayName} left a note`,
    actor: admin.username,
  })

  return NextResponse.json(data)
}
