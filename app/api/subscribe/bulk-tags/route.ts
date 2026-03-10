import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { requireAdmin } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const session = await requireAdmin(request)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!['super_admin', 'admin', 'social_admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { ids, action, tag } = await request.json()

  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: 'ids array required' }, { status: 400 })
  }
  if (!['add', 'remove'].includes(action)) {
    return NextResponse.json({ error: 'action must be add or remove' }, { status: 400 })
  }
  if (!tag || typeof tag !== 'string') {
    return NextResponse.json({ error: 'tag required' }, { status: 400 })
  }

  const tagName = tag.trim().toLowerCase()

  if (action === 'add') {
    // Add tag to subscribers that don't already have it
    for (const id of ids) {
      const { data: sub } = await supabase
        .from('email_subscribers')
        .select('tags')
        .eq('id', id)
        .single()

      if (sub) {
        const currentTags: string[] = Array.isArray(sub.tags) ? sub.tags : []
        if (!currentTags.includes(tagName)) {
          await supabase
            .from('email_subscribers')
            .update({ tags: [...currentTags, tagName] })
            .eq('id', id)
        }
      }
    }
  } else {
    // Remove tag from subscribers
    for (const id of ids) {
      const { data: sub } = await supabase
        .from('email_subscribers')
        .select('tags')
        .eq('id', id)
        .single()

      if (sub) {
        const currentTags: string[] = Array.isArray(sub.tags) ? sub.tags : []
        await supabase
          .from('email_subscribers')
          .update({ tags: currentTags.filter(t => t !== tagName) })
          .eq('id', id)
      }
    }
  }

  return NextResponse.json({ success: true, action, tag: tagName, count: ids.length })
}
