import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { requireAdmin } from '@/lib/auth'
import crypto from 'crypto'

export async function GET(request: NextRequest) {
  const session = await requireAdmin(request)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(request.url)
  const assetType = url.searchParams.get('asset_type')
  const status = url.searchParams.get('status')
  const packId = url.searchParams.get('pack_id')

  let query = supabase
    .from('content_library_items')
    .select('*')
    .order('source_order', { ascending: true })

  if (assetType) query = query.eq('asset_type', assetType)
  if (status) query = query.eq('status', status)
  if (packId) query = query.eq('pack_id', packId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

function stripHtmlTags(str: string): string {
  return str.replace(/<[^>]*>/g, '').trim()
}

export async function POST(request: NextRequest) {
  const session = await requireAdmin(request)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!['super_admin', 'admin', 'social_admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const assetType = body.asset_type

  if (!assetType) {
    return NextResponse.json({ error: 'asset_type is required' }, { status: 400 })
  }

  if (assetType === 'faq') {
    const question = (body.question || '').trim()
    const rawAnswer = (body.answer || '').trim()
    const answer = stripHtmlTags(rawAnswer)
    const category = (body.category || '').trim().slice(0, 100)

    if (!question) return NextResponse.json({ error: 'Question is required' }, { status: 400 })
    if (!answer) return NextResponse.json({ error: 'Answer is required' }, { status: 400 })

    const { data, error } = await supabase
      .from('content_library_items')
      .insert({
        asset_type: 'faq',
        source_row_id: crypto.randomUUID(),
        source_order: body.sort_order ?? 0,
        question,
        answer,
        category: category || null,
        is_public: body.is_public ?? true,
        show_on_homepage: body.show_on_homepage ?? false,
        sort_order: body.sort_order ?? 0,
        status: 'published',
        metadata: body.metadata || null,
      })
      .select()
      .single()

    if (error) {
      if (error.message?.includes('duplicate') || error.code === '23505') {
        return NextResponse.json({ error: 'A public FAQ with this question already exists' }, { status: 409 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json(data, { status: 201 })
  }

  return NextResponse.json({ error: 'Unsupported asset_type for direct creation' }, { status: 400 })
}
