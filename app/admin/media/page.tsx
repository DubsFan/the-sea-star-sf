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

export default function AdminMedia() {
  const session = useSession()
  const [files, setFiles] = useState<MediaFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [bucket, setBucket] = useState('Drink Images')

  const canDelete = session?.role === 'super_admin' || session?.role === 'admin'

  const loadFiles = async () => {
    const res = await fetch('/api/media')
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data)) setFiles(data)
    }
  }

  useEffect(() => { loadFiles() }, [])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files
    if (!fileList) return
    setUploading(true)
    let count = 0
    for (let i = 0; i < fileList.length; i++) {
      const formData = new FormData()
      formData.append('file', fileList[i])
      formData.append('bucket', bucket)
      const res = await fetch('/api/media', { method: 'POST', body: formData })
      if (res.ok) count++
    }
    toast.success(`${count} file(s) uploaded`)
    setUploading(false)
    loadFiles()
    e.target.value = ''
  }

  const handleDelete = async (file: MediaFile) => {
    if (!confirm(`Delete ${file.name}?`)) return
    const res = await fetch('/api/media', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <h1 className="font-cormorant text-3xl font-light text-sea-white">Media Library</h1>
        <div className="flex items-center gap-3">
          <select value={bucket} onChange={(e) => setBucket(e.target.value)} className="px-3 py-2 bg-[rgba(26,34,54,0.5)] border border-sea-gold/15 text-sea-light font-dm text-xs outline-none">
            <option value="Drink Images">Drink Images</option>
            <option value="blog-images">Blog Images</option>
          </select>
          <label className="px-4 py-2.5 bg-sea-gold text-[#06080d] font-dm text-xs font-medium tracking-[0.2em] uppercase hover:bg-sea-gold-light transition-all cursor-pointer">
            {uploading ? 'Uploading...' : 'Upload'}
            <input type="file" accept="image/*,video/*" multiple onChange={handleUpload} className="hidden" disabled={uploading} />
          </label>
        </div>
      </div>

      <p className="text-sm text-sea-blue font-dm mb-6">{files.length} files</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {files.map((file) => (
          <div key={`${file.bucket}-${file.name}`} className="bg-[#0a0e18] border border-sea-gold/10 rounded-lg overflow-hidden group">
            <div className="aspect-square relative">
              <img src={file.url} alt={file.name} className="w-full h-full object-cover" loading="lazy" />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button onClick={() => copyUrl(file.url)} className="px-2 py-1 bg-sea-gold text-[#06080d] text-xs font-dm border-none cursor-pointer rounded">
                  Copy URL
                </button>
                {canDelete && (
                  <button onClick={() => handleDelete(file)} className="px-2 py-1 bg-sea-rose text-white text-xs font-dm border-none cursor-pointer rounded">
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

      {files.length === 0 && <p className="text-center py-12 text-sea-blue text-sm font-dm">No media files yet. Upload some images above.</p>}
    </div>
  )
}
