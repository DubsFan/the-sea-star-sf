import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { requireAdmin } from '@/lib/auth'
import { logActivity } from '@/lib/activity'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin(request)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!['super_admin', 'admin', 'social_admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params

  // Load the content library item
  const { data: item, error: itemError } = await supabase
    .from('content_library_items')
    .select('*')
    .eq('id', id)
    .single()

  if (itemError || !item) {
    return NextResponse.json({ error: 'Content library item not found' }, { status: 404 })
  }

  if (item.status === 'drafted' || item.status === 'published') {
    return NextResponse.json({ error: 'This item has already been drafted' }, { status: 400 })
  }

  // Create mailer campaign from the library item
  const { data: campaign, error: campaignError } = await supabase
    .from('mailer_campaigns')
    .insert({
      content_type: 'standalone_email',
      subject: item.title || 'Newsletter',
      body_html: item.starter || null,
      primary_keyword: item.primary_keyword || null,
      source_library_item_id: id,
      status: 'draft',
    })
    .select()
    .single()

  if (campaignError) {
    return NextResponse.json({ error: campaignError.message }, { status: 500 })
  }

  // Update the library item to link back and mark as drafted
  const { error: updateError } = await supabase
    .from('content_library_items')
    .update({
      linked_mailer_campaign_id: campaign.id,
      status: 'drafted',
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  await logActivity({
    action: 'mailer_drafted_from_library',
    entityType: 'mailer',
    entityId: campaign.id,
    summary: `${session.displayName} created mailer draft from library item: ${item.title}`,
    actor: session.username,
  })

  return NextResponse.json(campaign)
}
