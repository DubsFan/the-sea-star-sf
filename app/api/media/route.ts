import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { requireAdmin } from '@/lib/auth'

const BUCKETS = ['Drink Images', 'blog-images', 'drink-images']

const VIDEO_MIMES = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/avi', 'video/mov']

export async function GET(request: NextRequest) {
  const session = await requireAdmin(request)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(request.url)
  const tagFilter = url.searchParams.get('tags')

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

  // Tag filtering placeholder — will use media_items table when available
  if (tagFilter) {
    // For now, filter by bucket name as a rough tag proxy
    const tags = tagFilter.split(',').map(t => t.trim().toLowerCase())
    const bucketMap: Record<string, string> = {
      drinks: 'Drink Images',
      'drink images': 'Drink Images',
      blog: 'blog-images',
    }
    const matchBuckets = tags.map(t => bucketMap[t]).filter(Boolean)
    if (matchBuckets.length > 0) {
      return NextResponse.json(allFiles.filter(f => matchBuckets.includes(f.bucket)))
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

  // Reject video uploads
  if (VIDEO_MIMES.includes(file.type) || file.type.startsWith('video/')) {
    return NextResponse.json({
      error: 'Video uploads are not supported in this release. Use images or GIFs.',
    }, { status: 400 })
  }

  // Validate image MIME
  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'Only image files are supported' }, { status: 400 })
  }

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
