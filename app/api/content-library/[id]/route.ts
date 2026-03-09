import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { requireAdmin } from '@/lib/auth'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin(request)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!['super_admin', 'admin', 'social_admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const body = await request.json()

  const updateFields: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if ('status' in body) updateFields.status = body.status
  if ('is_public' in body) updateFields.is_public = body.is_public
  if ('show_on_homepage' in body) updateFields.show_on_homepage = body.show_on_homepage
  if ('sort_order' in body) updateFields.sort_order = body.sort_order

  const { data, error } = await supabase
    .from('content_library_items')
    .update(updateFields)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
