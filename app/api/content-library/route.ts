import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { requireAdmin } from '@/lib/auth'

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
