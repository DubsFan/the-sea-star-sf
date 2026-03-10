import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { requireAdmin } from '@/lib/auth'
import { SEA_STAR_VOICE, buildBaseContext, generateWithGroq, cleanJsonResponse } from '@/lib/ai'
import crypto from 'crypto'

interface SmartPayload {
  blog_ideas: Array<{ title: string; primary_keyword: string; starter: string }>
  faqs: Array<{ question: string; answer: string; category: string }>
  keywords: string[]
  event_ideas: Array<{ title: string; description: string; date_hint: string }>
  email_ideas: Array<{ subject_line: string; primary_keyword: string; starter: string }>
}

function checksumPayload(payload: SmartPayload): string {
  return crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex')
}

function validatePayload(raw: unknown): SmartPayload {
  const p = raw as Partial<SmartPayload>
  return {
    blog_ideas: Array.isArray(p?.blog_ideas) ? p.blog_ideas.filter(b => b.title && b.primary_keyword) : [],
    faqs: Array.isArray(p?.faqs) ? p.faqs.filter(f => f.question && f.answer) : [],
    keywords: Array.isArray(p?.keywords) ? p.keywords.filter(k => typeof k === 'string' && k.trim()) : [],
    event_ideas: Array.isArray(p?.event_ideas) ? p.event_ideas.filter(e => e.title) : [],
    email_ideas: Array.isArray(p?.email_ideas) ? p.email_ideas.filter(e => e.subject_line && e.primary_keyword) : [],
  }
}

export async function POST(request: NextRequest) {
  const session = await requireAdmin(request)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!['super_admin', 'admin', 'social_admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const url = new URL(request.url)
  const mode = url.searchParams.get('mode') || 'preview'

  // ── COMMIT MODE ──
  if (mode === 'commit') {
    const { preview_id, checksum, excluded } = await request.json()
    if (!preview_id || !checksum) {
      return NextResponse.json({ error: 'preview_id and checksum required' }, { status: 400 })
    }

    // Load stored preview
    const { data: row, error: fetchErr } = await supabase
      .from('content_import_previews')
      .select('*')
      .eq('id', preview_id)
      .single()

    if (fetchErr || !row) {
      return NextResponse.json({ error: 'Preview not found' }, { status: 410 })
    }

    // Check expiry
    if (new Date(row.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Preview expired. Please re-parse.' }, { status: 410 })
    }

    // Check checksum
    if (row.checksum !== checksum) {
      return NextResponse.json({ error: 'Checksum mismatch — preview may have been tampered with' }, { status: 409 })
    }

    // Never call Groq during commit — use stored payload only
    const payload = row.parsed_payload as SmartPayload

    // Apply exclusions if provided
    const excludeSet = new Set<string>(Array.isArray(excluded) ? excluded : [])

    // Create content pack record
    const { data: pack, error: packErr } = await supabase
      .from('content_packs')
      .insert({
        name: 'Smart Import',
        checksum: row.checksum,
        brief_text: 'Imported via smart import (AI-parsed)',
        file_manifest: { smart_import: true, preview_id },
        imported_by: session.username,
      })
      .select()
      .single()

    if (packErr) return NextResponse.json({ error: packErr.message }, { status: 500 })

    const items: Array<Record<string, unknown>> = []
    let blogCount = 0
    let faqCount = 0
    let emailCount = 0
    let kwCount = 0

    // Blog ideas
    for (let i = 0; i < payload.blog_ideas.length; i++) {
      if (excludeSet.has(`blog_${i}`)) continue
      const b = payload.blog_ideas[i]
      items.push({
        pack_id: pack.id,
        asset_type: 'blog_seed',
        source_file: 'smart-import',
        source_row_id: `smart-blog-${i}`,
        source_order: i,
        primary_keyword: b.primary_keyword,
        title: b.title,
        starter: b.starter || '',
      })
      blogCount++
    }

    // Email ideas
    for (let i = 0; i < payload.email_ideas.length; i++) {
      if (excludeSet.has(`email_${i}`)) continue
      const e = payload.email_ideas[i]
      items.push({
        pack_id: pack.id,
        asset_type: 'email_seed',
        source_file: 'smart-import',
        source_row_id: `smart-email-${i}`,
        source_order: i,
        primary_keyword: e.primary_keyword,
        title: e.subject_line,
        subject_line: e.subject_line,
        starter: e.starter || '',
      })
      emailCount++
    }

    // FAQs
    for (let i = 0; i < payload.faqs.length; i++) {
      if (excludeSet.has(`faq_${i}`)) continue
      const f = payload.faqs[i]
      items.push({
        pack_id: pack.id,
        asset_type: 'faq',
        source_file: 'smart-import',
        source_row_id: `smart-faq-${i}`,
        source_order: i,
        category: f.category || '',
        question: f.question,
        answer: f.answer.replace(/<[^>]*>/g, '').trim(),
      })
      faqCount++
    }

    if (items.length > 0) {
      const { error: itemsErr } = await supabase.from('content_library_items').insert(items)
      if (itemsErr) return NextResponse.json({ error: itemsErr.message }, { status: 500 })
    }

    // Merge keywords into seo_keywords_secondary
    const newKws = payload.keywords.filter((_, i) => !excludeSet.has(`kw_${i}`))
    if (newKws.length > 0) {
      const { data: settingsData } = await supabase
        .from('site_settings')
        .select('key, value')
        .in('key', ['seo_keywords_secondary', 'seo_keywords', 'blog_keywords'])

      const secondaryRow = settingsData?.find((s: { key: string }) => s.key === 'seo_keywords_secondary')
      const existing = (secondaryRow?.value || '').split(',').map((k: string) => k.trim().toLowerCase()).filter(Boolean)
      const merged = Array.from(new Set([...existing, ...newKws.map(k => k.toLowerCase())])).sort()

      await supabase
        .from('site_settings')
        .upsert({ key: 'seo_keywords_secondary', value: merged.join(', '), updated_at: new Date().toISOString() }, { onConflict: 'key' })
      kwCount = newKws.length
    }

    // Clean up preview row
    await supabase.from('content_import_previews').delete().eq('id', preview_id)

    return NextResponse.json({
      pack_id: pack.id,
      blog_count: blogCount,
      email_count: emailCount,
      faq_count: faqCount,
      keyword_count: kwCount,
    })
  }

  // ── PREVIEW MODE ──
  const contentType = request.headers.get('content-type') || ''
  let rawText = ''

  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const pastedText = formData.get('text') as string | null

    if (file) {
      rawText = await file.text()
    }
    if (pastedText) {
      rawText = rawText ? `${rawText}\n\n${pastedText}` : pastedText
    }
  } else {
    const body = await request.json()
    rawText = body.text || ''
  }

  if (!rawText.trim()) {
    return NextResponse.json({ error: 'No content to parse. Upload a file or paste text.' }, { status: 400 })
  }

  // Truncate to prevent excessive token usage (roughly 8K words)
  const maxChars = 40000
  const truncated = rawText.length > maxChars ? rawText.slice(0, maxChars) : rawText

  const { primaryKeywords, secondaryKeywords } = await buildBaseContext()

  const systemPrompt = `You are a content strategist for The Sea Star, a craft cocktail bar in San Francisco's Dogpatch neighborhood. ${SEA_STAR_VOICE}

You are parsing unstructured content (notes, briefs, brainstorms, articles, emails, meeting notes) and extracting actionable content assets.

Classify the content into these categories:
- blog_ideas: potential blog post topics with title, primary_keyword, and starter (opening sentence)
- faqs: question/answer pairs with category
- keywords: SEO keywords relevant to the bar
- event_ideas: potential events with title, description, and date_hint
- email_ideas: newsletter topics with subject_line, primary_keyword, and starter

Rules:
- Extract only what's clearly present or strongly implied in the text
- Do not hallucinate content that isn't in the source material
- FAQs should have plain text answers (no HTML)
- Keywords should be specific and relevant to a neighborhood bar
- Avoid duplicating these existing keywords: ${primaryKeywords}, ${secondaryKeywords}
- If a category has no applicable content, return an empty array

Return ONLY valid JSON matching this shape:
{
  "blog_ideas": [{ "title": "...", "primary_keyword": "...", "starter": "..." }],
  "faqs": [{ "question": "...", "answer": "...", "category": "..." }],
  "keywords": ["keyword1", "keyword2"],
  "event_ideas": [{ "title": "...", "description": "...", "date_hint": "..." }],
  "email_ideas": [{ "subject_line": "...", "primary_keyword": "...", "starter": "..." }]
}`

  try {
    const content = await generateWithGroq(systemPrompt, truncated, {
      temperature: 0.3,
      maxTokens: 2000,
    })
    const parsed = cleanJsonResponse(content)
    const payload = validatePayload(parsed)
    const checksum = checksumPayload(payload)

    const totalItems = payload.blog_ideas.length + payload.faqs.length +
      payload.keywords.length + payload.event_ideas.length + payload.email_ideas.length

    if (totalItems === 0) {
      return NextResponse.json({
        error: 'No actionable content found. Try providing more specific text.',
      }, { status: 422 })
    }

    // Store preview in DB
    const { data: preview, error: previewErr } = await supabase
      .from('content_import_previews')
      .insert({
        checksum,
        parsed_payload: payload,
        created_by: session.username,
        expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      })
      .select('id')
      .single()

    if (previewErr) {
      return NextResponse.json({ error: previewErr.message }, { status: 500 })
    }

    return NextResponse.json({
      preview_id: preview.id,
      checksum,
      blog_ideas: payload.blog_ideas,
      faqs: payload.faqs,
      keywords: payload.keywords,
      event_ideas: payload.event_ideas,
      email_ideas: payload.email_ideas,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'AI parsing failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
