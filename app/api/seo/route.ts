import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { requireAdmin } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase.from('page_seo').select('*').order('page_path')
  return NextResponse.json(data || [])
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { data, error } = await supabase.from('page_seo').upsert({
    page_path: body.page_path,
    meta_title: body.meta_title || null,
    meta_description: body.meta_description || null,
    og_title: body.og_title || null,
    og_description: body.og_description || null,
    og_image: body.og_image || null,
    focus_keyword: body.focus_keyword || null,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'page_path' }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
