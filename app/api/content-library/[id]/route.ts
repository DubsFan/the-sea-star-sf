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
  if ('question' in body) updateFields.question = (body.question || '').trim()
  if ('answer' in body) updateFields.answer = (body.answer || '').replace(/<[^>]*>/g, '').trim()
  if ('category' in body) updateFields.category = (body.category || '').trim().slice(0, 100) || null
  if ('metadata' in body) updateFields.metadata = body.metadata

  const { data, error } = await supabase
    .from('content_library_items')
    .update(updateFields)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    if (error.message?.includes('duplicate') || error.code === '23505') {
      return NextResponse.json({ error: 'A public FAQ with this question already exists' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin(request)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!['super_admin', 'admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params

  const { error } = await supabase
    .from('content_library_items')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
