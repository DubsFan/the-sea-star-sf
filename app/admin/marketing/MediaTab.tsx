'use client'

import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useSession } from '../session-context'

interface MediaFile {
  name: string
  url: string
  bucket: string
  created_at: string
}

const BUCKET_FILTERS = [
  { label: 'All', value: '' },
  { label: 'Drinks', value: 'Drink Images' },
  { label: 'Blog', value: 'blog-images' },
]

const VIDEO_EXTENSIONS = ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv', 'wmv']

function isVideoFile(file: File): boolean {
  if (file.type.startsWith('video/')) return true
  const ext = file.name.split('.').pop()?.toLowerCase() || ''
  return VIDEO_EXTENSIONS.includes(ext)
}

export default function MediaTab() {
  const session = useSession()
  const [files, setFiles] = useState<MediaFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [bucket, setBucket] = useState('Drink Images')
  const [filterBucket, setFilterBucket] = useState('')

  const canDelete = session?.role === 'super_admin' || session?.role === 'admin'

  const loadFiles = async () => {
    const res = await fetch('/api/media', { credentials: 'include' })
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data)) setFiles(data)
    }
  }

  useEffect(() => { loadFiles() }, [])

  const filteredFiles = filterBucket
    ? files.filter(f => f.bucket === filterBucket)
    : files

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files
    if (!fileList) return

    // Client-side video rejection
    const validFiles: File[] = []
    let videoRejected = false
    for (let i = 0; i < fileList.length; i++) {
      if (isVideoFile(fileList[i])) {
        videoRejected = true
      } else {
        validFiles.push(fileList[i])
      }
    }

    if (videoRejected) {
      toast.error('Video uploads are not supported in this release. Use images or GIFs.')
    }

    if (validFiles.length === 0) {
      e.target.value = ''
      return
    }

    setUploading(true)
    let count = 0
    for (const file of validFiles) {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('bucket', bucket)
      const res = await fetch('/api/media', { credentials: 'include', method: 'POST', body: formData })
      if (res.ok) {
        count++
      } else {
        const data = await res.json().catch(() => ({ error: 'Upload failed' }))
        toast.error(data.error || 'Upload failed')
      }
    }
    if (count > 0) toast.success(`${count} file(s) uploaded`)
    setUploading(false)
    loadFiles()
    e.target.value = ''
  }

  const handleDelete = async (file: MediaFile) => {
    if (!confirm(`Delete ${file.name}?`)) return
    const res = await fetch('/api/media', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ name: file.name, bucket: file.bucket }),
    })
    if (res.ok) { toast.success('Deleted'); loadFiles() }
  }

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url)
    toast.success('URL copied')
  }

  return (
    <div>
      {/* Filter pills */}
      <div className="flex flex-wrap gap-2 mb-4">
        {BUCKET_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilterBucket(f.value)}
            className={`px-4 py-2 min-h-[44px] font-dm text-xs tracking-[0.1em] uppercase rounded-full border transition-all cursor-pointer ${
              filterBucket === f.value
                ? 'bg-sea-gold/15 text-sea-gold border-sea-gold/25'
                : 'bg-transparent text-sea-blue border-sea-gold/10 hover:border-sea-gold/25'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Upload bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <p className="text-sm text-sea-blue font-dm">
          {filteredFiles.length} file{filteredFiles.length !== 1 ? 's' : ''}
          {filterBucket && ` in ${BUCKET_FILTERS.find(f => f.value === filterBucket)?.label}`}
        </p>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select value={bucket} onChange={(e) => setBucket(e.target.value)} className="flex-1 sm:flex-none px-3 py-2.5 bg-[rgba(26,34,54,0.5)] border border-sea-gold/15 text-sea-light font-dm text-xs outline-none min-h-[44px] rounded">
            <option value="Drink Images">Drink Images</option>
            <option value="blog-images">Blog Images</option>
          </select>
          <label className="flex-1 sm:flex-none px-4 py-2.5 bg-sea-gold text-[#06080d] font-dm text-xs font-medium tracking-[0.2em] uppercase hover:bg-sea-gold-light transition-all cursor-pointer text-center min-h-[44px] flex items-center justify-center rounded">
            {uploading ? 'Uploading...' : 'Upload'}
            <input type="file" accept="image/*" multiple onChange={handleUpload} className="hidden" disabled={uploading} />
          </label>
        </div>
      </div>

      <p className="text-[0.6rem] text-sea-blue/40 font-dm mb-4">Images and GIFs only. Video uploads are not supported.</p>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {filteredFiles.map((file) => (
          <div key={`${file.bucket}-${file.name}`} className="bg-[#0a0e18] border border-sea-gold/10 rounded-lg overflow-hidden group">
            <div className="aspect-square relative">
              <img src={file.url} alt={file.name} className="w-full h-full object-cover" loading="lazy" />
              {/* Mobile: tap to show actions */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 active:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button onClick={() => copyUrl(file.url)} className="px-3 py-2 min-h-[44px] bg-sea-gold text-[#06080d] text-xs font-dm border-none cursor-pointer rounded font-medium">
                  Copy URL
                </button>
                {canDelete && (
                  <button onClick={() => handleDelete(file)} className="px-3 py-2 min-h-[44px] bg-red-600 text-white text-xs font-dm border-none cursor-pointer rounded font-medium">
                    Delete
                  </button>
                )}
              </div>
            </div>
            <div className="p-2">
              <p className="text-[0.6rem] text-sea-blue font-dm truncate">{file.name}</p>
              <p className="text-[0.5rem] text-sea-blue/50 font-dm">{file.bucket}</p>
            </div>
          </div>
        ))}
      </div>

      {filteredFiles.length === 0 && (
        <p className="text-center py-12 text-sea-blue text-sm font-dm">
          {files.length === 0 ? 'No media files yet. Upload some images above.' : 'No files match this filter.'}
        </p>
      )}
    </div>
  )
}
