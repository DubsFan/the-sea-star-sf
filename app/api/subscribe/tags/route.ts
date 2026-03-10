import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { requireAdmin } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const session = await requireAdmin(request)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Get all unique tags from subscribers
  const { data, error } = await supabase.rpc('get_unique_subscriber_tags')

  if (error) {
    // Fallback: query directly if RPC doesn't exist
    const { data: subs } = await supabase
      .from('email_subscribers')
      .select('tags')

    const tagSet = new Set<string>()
    if (subs) {
      for (const sub of subs) {
        if (Array.isArray(sub.tags)) {
          for (const tag of sub.tags) tagSet.add(tag)
        }
      }
    }

    // Also get custom tags from site_settings
    const { data: setting } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'subscriber_tags')
      .single()

    if (setting?.value) {
      try {
        const custom = JSON.parse(setting.value) as string[]
        for (const t of custom) tagSet.add(t)
      } catch { /* ignore */ }
    }

    return NextResponse.json(Array.from(tagSet).sort())
  }

  return NextResponse.json(Array.isArray(data) ? data.map((r: { tag: string }) => r.tag) : [])
}

export async function POST(request: NextRequest) {
  const session = await requireAdmin(request)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { tag } = await request.json()
  if (!tag || typeof tag !== 'string' || !tag.trim()) {
    return NextResponse.json({ error: 'Tag name required' }, { status: 400 })
  }

  const tagName = tag.trim().toLowerCase()

  // Add to site_settings subscriber_tags list
  const { data: existing } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', 'subscriber_tags')
    .single()

  let tags: string[] = []
  if (existing?.value) {
    try { tags = JSON.parse(existing.value) } catch { /* ignore */ }
  }

  if (!tags.includes(tagName)) {
    tags.push(tagName)
    await supabase.from('site_settings').upsert({
      key: 'subscriber_tags',
      value: JSON.stringify(tags),
    })
  }

  return NextResponse.json({ tag: tagName, tags })
}
