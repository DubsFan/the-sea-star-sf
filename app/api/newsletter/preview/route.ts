import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { requireAdmin } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Get latest published blog post
  const { data: posts } = await supabase
    .from('blog_posts')
    .select('title, excerpt, slug')
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .limit(1)

  const post = posts?.[0]

  // Get template notes
  const { data: settings } = await supabase
    .from('site_settings')
    .select('key, value')
    .in('key', ['newsletter_template_notes', 'site_url'])

  const templateNotes = settings?.find(s => s.key === 'newsletter_template_notes')?.value || ''
  const siteUrl = settings?.find(s => s.key === 'site_url')?.value || 'https://theseastarsf.com'

  const postTitle = post?.title || 'Sample Blog Post Title'
  const postExcerpt = post?.excerpt || 'This is a preview of what your newsletter will look like when sent to subscribers.'
  const postLink = post?.slug ? `${siteUrl}/blog/${post.slug}` : `${siteUrl}/blog`

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#06080d;font-family:Georgia,'Times New Roman',serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 24px;">
    <div style="text-align:center;margin-bottom:32px;">
      <h1 style="font-size:28px;color:#c9a54e;margin:0;font-weight:400;letter-spacing:2px;">THE SEA STAR</h1>
      <p style="font-size:11px;color:#7a8a9e;letter-spacing:4px;margin:8px 0 0;text-transform:uppercase;">Dogpatch, San Francisco</p>
    </div>
    ${templateNotes ? `<p style="font-size:15px;color:#b0bec5;line-height:1.7;margin-bottom:24px;">${templateNotes}</p>` : ''}
    <div style="border:1px solid rgba(201,165,78,0.15);padding:24px;margin-bottom:24px;">
      <h2 style="font-size:20px;color:#e8e0d0;margin:0 0 12px;font-weight:400;">${postTitle}</h2>
      <p style="font-size:14px;color:#7a8a9e;line-height:1.6;margin:0 0 16px;">${postExcerpt}</p>
      <a href="${postLink}" style="display:inline-block;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#c9a54e;text-decoration:none;border-bottom:1px solid rgba(201,165,78,0.4);padding-bottom:2px;">Read More →</a>
    </div>
    <div style="text-align:center;padding-top:24px;border-top:1px solid rgba(201,165,78,0.1);">
      <p style="font-size:11px;color:#4a5a6e;margin:0;">The Sea Star · 2289 3rd Street · San Francisco, CA</p>
      <p style="font-size:11px;color:#4a5a6e;margin:8px 0 0;"><a href="#" style="color:#4a5a6e;">Unsubscribe</a></p>
    </div>
  </div>
</body>
</html>`

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html' },
  })
}
