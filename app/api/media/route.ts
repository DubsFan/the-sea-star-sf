import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { requireAdmin } from '@/lib/auth'

const BUCKETS = ['Drink Images', 'blog-images', 'drink-images']

export async function GET(request: NextRequest) {
  const session = await requireAdmin(request)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const allFiles: { name: string; url: string; bucket: string; created_at: string }[] = []

  for (const bucket of BUCKETS) {
    const { data: files } = await supabase.storage.from(bucket).list('', {
      limit: 200,
      sortBy: { column: 'created_at', order: 'desc' },
    })

    if (files) {
      for (const file of files) {
        if (file.name === '.emptyFolderPlaceholder') continue
        const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(file.name)
        allFiles.push({
          name: file.name,
          url: urlData.publicUrl,
          bucket,
          created_at: file.created_at || '',
        })
      }
    }
  }

  return NextResponse.json(allFiles)
}

export async function POST(request: NextRequest) {
  const session = await requireAdmin(request)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await request.formData()
  const file = formData.get('file') as File
  const bucket = (formData.get('bucket') as string) || 'Drink Images'

  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

  const ext = file.name.split('.').pop()
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

  const { error } = await supabase.storage.from(bucket).upload(fileName, file, {
    contentType: file.type,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(fileName)
  return NextResponse.json({ url: urlData.publicUrl, name: fileName, bucket })
}

export async function DELETE(request: NextRequest) {
  const session = await requireAdmin(request)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.role === 'crew') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { name, bucket } = await request.json()
  const { error } = await supabase.storage.from(bucket).remove([name])

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
