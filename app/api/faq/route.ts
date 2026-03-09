import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const featured = url.searchParams.get('featured') === 'true'
  const limit = parseInt(url.searchParams.get('limit') || '50', 10)

  let query = supabase
    .from('content_library_items')
    .select('id, category, question, answer, sort_order')
    .eq('asset_type', 'faq')
    .eq('is_public', true)
    .order('sort_order', { ascending: true })
    .limit(limit)

  if (featured) {
    query = query.eq('show_on_homepage', true)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}
