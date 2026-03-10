import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { requireAdmin } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const isAdmin = await requireAdmin(request)
  const url = new URL(request.url)
  const since = url.searchParams.get('since')
  const status = url.searchParams.get('status')

  const query = supabase
    .from('blog_posts')
    .select('*')
    .order('created_at', { ascending: false })

  if (!isAdmin) {
    query.eq('is_published', true)
  } else {
    if (status) query.eq('status', status)
  }
  if (since) query.gte('created_at', since)

  const { data, error } = await query
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request)
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const slug = body.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

  const { data, error } = await supabase
    .from('blog_posts')
    .insert({
      title: body.title,
      slug,
      body: body.body,
      excerpt: body.excerpt,
      meta_description: body.meta_description || null,
      images: body.images || [],
      is_published: false,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data)
}

export async function PUT(request: NextRequest) {
  const admin = await requireAdmin(request)
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (body.title !== undefined) updates.title = body.title
  if (body.body !== undefined) updates.body = body.body
  if (body.excerpt !== undefined) updates.excerpt = body.excerpt
  if (body.meta_description !== undefined) updates.meta_description = body.meta_description
  if (body.images !== undefined) updates.images = body.images
  if (body.status !== undefined) updates.status = body.status
  if (body.focus_keyword !== undefined) updates.focus_keyword = body.focus_keyword
  if (body.featured_image !== undefined) updates.featured_image = body.featured_image

  const { data, error } = await supabase
    .from('blog_posts')
    .update(updates)
    .eq('id', body.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data)
}

export async function DELETE(request: NextRequest) {
  const admin = await requireAdmin(request)
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (admin.role === 'crew') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await request.json()
  const { error } = await supabase.from('blog_posts').delete().eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}
