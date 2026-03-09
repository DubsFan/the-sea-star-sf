import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { requireAdmin } from '@/lib/auth'
import { parse } from 'csv-parse/sync'
import crypto from 'crypto'

interface ParsedRow {
  [key: string]: string
}

function normalizeHeaders(row: ParsedRow): Record<string, string> {
  const result: Record<string, string> = {}
  for (const [key, value] of Object.entries(row)) {
    result[key.trim().toLowerCase().replace(/\s+/g, '_')] = value?.trim() || ''
  }
  return result
}

export async function POST(request: NextRequest) {
  const session = await requireAdmin(request)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Only admin, super_admin, social_admin can import
  if (!['super_admin', 'admin', 'social_admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const url = new URL(request.url)
  const mode = url.searchParams.get('mode') || 'preview'

  const formData = await request.formData()
  const blogCsv = formData.get('blog_csv') as File | null
  const emailCsv = formData.get('email_csv') as File | null
  const faqCsv = formData.get('faq_csv') as File | null
  const briefMd = formData.get('brief_md') as File | null
  const briefTxt = formData.get('brief_txt') as File | null

  if (!blogCsv && !emailCsv && !faqCsv) {
    return NextResponse.json({ error: 'At least one CSV file required' }, { status: 400 })
  }

  // Parse CSVs
  const blogSeeds: Array<{ source_file: string; source_row_id: string; source_order: number; primary_keyword: string; title: string; starter: string }> = []
  const faqItems: Array<{ source_file: string; source_row_id: string; source_order: number; category: string; question: string; answer: string }> = []
  const errors: string[] = []

  // Parse blog CSV
  if (blogCsv) {
    try {
      const text = await blogCsv.text()
      const rows = parse(text, { columns: true, skip_empty_lines: true }) as ParsedRow[]
      for (let i = 0; i < rows.length; i++) {
        const row = normalizeHeaders(rows[i])
        if (!row.id || !row.primary_keyword || !row.title) {
          errors.push(`Blog CSV row ${i + 2}: missing ID, Primary Keyword, or Title`)
          continue
        }
        blogSeeds.push({
          source_file: blogCsv.name,
          source_row_id: row.id,
          source_order: i,
          primary_keyword: row.primary_keyword,
          title: row.title,
          starter: row.starter || '',
        })
      }
    } catch (e) {
      errors.push(`Blog CSV parse error: ${e instanceof Error ? e.message : 'unknown'}`)
    }
  }

  // Parse email CSV → blog seeds
  if (emailCsv) {
    try {
      const text = await emailCsv.text()
      const rows = parse(text, { columns: true, skip_empty_lines: true }) as ParsedRow[]
      for (let i = 0; i < rows.length; i++) {
        const row = normalizeHeaders(rows[i])
        if (!row.id || !row.primary_keyword || !row.subject_line) {
          errors.push(`Email CSV row ${i + 2}: missing ID, Primary Keyword, or Subject Line`)
          continue
        }
        blogSeeds.push({
          source_file: emailCsv.name,
          source_row_id: row.id,
          source_order: blogSeeds.length,
          primary_keyword: row.primary_keyword,
          title: row.subject_line,
          starter: row.starter || '',
        })
      }
    } catch (e) {
      errors.push(`Email CSV parse error: ${e instanceof Error ? e.message : 'unknown'}`)
    }
  }

  // Parse FAQ CSV
  if (faqCsv) {
    try {
      const text = await faqCsv.text()
      const rows = parse(text, { columns: true, skip_empty_lines: true }) as ParsedRow[]
      for (let i = 0; i < rows.length; i++) {
        const row = normalizeHeaders(rows[i])
        if (!row.id || !row.question || !row.answer) {
          errors.push(`FAQ CSV row ${i + 2}: missing ID, Question, or Answer`)
          continue
        }
        faqItems.push({
          source_file: faqCsv.name,
          source_row_id: row.id,
          source_order: i,
          category: row.category || '',
          question: row.question,
          answer: row.answer,
        })
      }
    } catch (e) {
      errors.push(`FAQ CSV parse error: ${e instanceof Error ? e.message : 'unknown'}`)
    }
  }

  // Read briefs
  const mdText = briefMd ? await briefMd.text() : ''
  const txtText = briefTxt ? await briefTxt.text() : ''

  // Compute checksum
  const checksumInput = [mdText, txtText, blogCsv ? await blogCsv.text() : '', emailCsv ? await emailCsv.text() : '', faqCsv ? await faqCsv.text() : ''].join('|||')
  const checksum = crypto.createHash('sha256').update(checksumInput).digest('hex')

  // Derive name
  const name = briefMd?.name?.replace(/\.md$/i, '') || briefTxt?.name?.replace(/\.txt$/i, '') || 'Content Pack'

  if (mode === 'preview') {
    return NextResponse.json({
      name,
      checksum,
      blog_seed_count: blogSeeds.length,
      faq_count: faqItems.length,
      errors,
    })
  }

  // Commit mode
  if (errors.length > 0) {
    return NextResponse.json({ error: 'Fix validation errors before committing', errors }, { status: 400 })
  }

  // Check duplicate checksum
  const { data: existing } = await supabase.from('content_packs').select('id').eq('checksum', checksum).single()
  if (existing) {
    return NextResponse.json({ error: 'This content pack has already been imported (duplicate checksum)' }, { status: 409 })
  }

  // Insert pack
  const { data: pack, error: packError } = await supabase
    .from('content_packs')
    .insert({
      name,
      checksum,
      brief_markdown: mdText || null,
      brief_text: txtText || null,
      file_manifest: {
        blog_csv: blogCsv?.name || null,
        email_csv: emailCsv?.name || null,
        faq_csv: faqCsv?.name || null,
        brief_md: briefMd?.name || null,
        brief_txt: briefTxt?.name || null,
      },
      imported_by: session.username,
    })
    .select()
    .single()

  if (packError) return NextResponse.json({ error: packError.message }, { status: 500 })

  // Insert library items
  const items = [
    ...blogSeeds.map((s) => ({
      pack_id: pack.id,
      asset_type: 'blog_seed',
      source_file: s.source_file,
      source_row_id: s.source_row_id,
      source_order: s.source_order,
      primary_keyword: s.primary_keyword,
      title: s.title,
      starter: s.starter,
    })),
    ...faqItems.map((f) => ({
      pack_id: pack.id,
      asset_type: 'faq',
      source_file: f.source_file,
      source_row_id: f.source_row_id,
      source_order: f.source_order,
      category: f.category,
      question: f.question,
      answer: f.answer,
    })),
  ]

  if (items.length > 0) {
    const { error: itemsError } = await supabase.from('content_library_items').insert(items)
    if (itemsError) return NextResponse.json({ error: itemsError.message }, { status: 500 })
  }

  return NextResponse.json({
    pack_id: pack.id,
    name: pack.name,
    blog_seed_count: blogSeeds.length,
    faq_count: faqItems.length,
  })
}
