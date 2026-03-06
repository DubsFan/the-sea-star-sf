import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { resend } from '@/lib/resend'
import { requireAdmin } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request)
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await request.json()

  const { data: post, error: postError } = await supabase
    .from('blog_posts')
    .update({
      is_published: true,
      published_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (postError || !post) {
    return NextResponse.json({ error: 'Failed to publish' }, { status: 500 })
  }

  const { data: subscribers } = await supabase
    .from('email_subscribers')
    .select('email')
    .eq('is_active', true)

  if (subscribers && subscribers.length > 0) {
    const batchSize = 100
    for (let i = 0; i < subscribers.length; i += batchSize) {
      const batch = subscribers.slice(i, i + batchSize)
      await resend.batch.send(
        batch.map((sub) => ({
          from: 'The Sea Star <hello@theseastarsf.com>',
          to: sub.email,
          subject: post.title,
          html: `
            <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px">
              <h1 style="color:#c9a54e">${post.title}</h1>
              <p>${post.excerpt}</p>
              <a href="https://theseastarsf.com/blog/${post.slug}" style="display:inline-block;padding:12px 24px;background:#c9a54e;color:#1a1118;text-decoration:none;font-weight:bold;margin-top:16px">Read More</a>
              <p style="color:#888;font-size:12px;margin-top:32px">The Sea Star | 2289 3rd Street, San Francisco</p>
            </div>
          `,
        }))
      )
    }

    await supabase
      .from('blog_posts')
      .update({ emailed_at: new Date().toISOString() })
      .eq('id', id)
  }

  return NextResponse.json({ success: true, post })
}
