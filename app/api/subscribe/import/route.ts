import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { requireAdmin } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  const text = await file.text()
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
  if (lines.length < 2) return NextResponse.json({ error: 'CSV is empty' }, { status: 400 })

  const header = lines[0].split(',')
  const firstNameIdx = header.indexOf('First Name')
  const lastNameIdx = header.indexOf('Last Name')
  const emailIdx = header.indexOf('Email 1')
  const statusIdx = header.indexOf('Email subscriber status')

  if (emailIdx === -1) {
    return NextResponse.json({ error: 'CSV missing "Email 1" column' }, { status: 400 })
  }

  const rows: { email: string; name: string | null; is_active: boolean }[] = []
  let skipped = 0

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i])
    const email = cols[emailIdx]?.trim()
    const status = cols[statusIdx]?.trim()

    if (!email) {
      skipped++
      continue
    }

    const firstName = cols[firstNameIdx]?.replace(/^""+$/, '').trim() || ''
    const lastName = cols[lastNameIdx]?.trim() || ''
    const name = [firstName, lastName].filter(Boolean).join(' ') || null

    rows.push({
      email,
      name,
      is_active: status !== 'Unsubscribed',
    })
  }

  // Deduplicate by email (keep last occurrence)
  const deduped = [...new Map(rows.map((r) => [r.email.toLowerCase(), r])).values()]

  if (deduped.length === 0) {
    return NextResponse.json({ imported: 0, skipped })
  }

  const { error } = await supabase
    .from('email_subscribers')
    .upsert(deduped, { onConflict: 'email' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ imported: deduped.length, skipped: skipped + (rows.length - deduped.length) })
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }
  result.push(current)
  return result
}
