'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import toast from 'react-hot-toast'

interface MediaFile {
  name: string
  url: string
  bucket: string
  created_at: string
}

interface MediaPickerProps {
  isOpen: boolean
  mode: 'single' | 'multiple'
  maxFiles?: number
  onSelect: (urls: string[]) => void
  onClose: () => void
}

let mediaCache: MediaFile[] | null = null

export default function MediaPicker({ isOpen, mode, maxFiles, onSelect, onClose }: MediaPickerProps) {
  const [files, setFiles] = useState<MediaFile[]>(mediaCache || [])
  const [loading, setLoading] = useState(!mediaCache)
  const [uploading, setUploading] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const backdropRef = useRef<HTMLDivElement>(null)
  const limit = maxFiles ?? (mode === 'multiple' ? 5 : 1)

  const fetchMedia = useCallback(async () => {
    try {
      const res = await fetch('/api/media', { credentials: 'include' })
      const data = await res.json()
      if (Array.isArray(data)) {
        const sorted = data.sort((a: MediaFile, b: MediaFile) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        mediaCache = sorted
        setFiles(sorted)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isOpen) {
      setSelected(new Set())
      if (mediaCache) {
        setFiles(mediaCache)
        setLoading(false)
      }
      fetchMedia()
    }
  }, [isOpen, fetchMedia])

  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  const handleToggle = (url: string) => {
    if (mode === 'single') {
      setSelected(new Set([url]))
      return
    }
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(url)) {
        next.delete(url)
      } else {
        if (next.size >= limit) {
          toast.error(`Max ${limit} images`)
          return prev
        }
        next.add(url)
      }
      return next
    })
  }

  const handleConfirm = () => {
    onSelect(Array.from(selected))
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files
    if (!fileList) return
    setUploading(true)
    const newUrls: string[] = []
    for (let i = 0; i < fileList.length; i++) {
      const formData = new FormData()
      formData.append('file', fileList[i])
      formData.append('bucket', 'Drink Images')
      try {
        const res = await fetch('/api/media', { credentials: 'include', method: 'POST', body: formData })
        const data = await res.json()
        if (data.url) newUrls.push(data.url)
      } catch {
        toast.error('Upload failed')
      }
    }
    if (newUrls.length > 0) {
      toast.success(`${newUrls.length} uploaded`)
      await fetchMedia()
      // Auto-select newly uploaded files
      setSelected(prev => {
        const next = new Set(prev)
        for (const url of newUrls) {
          if (mode === 'single') return new Set([url])
          if (next.size < limit) next.add(url)
        }
        return next
      })
    }
    setUploading(false)
    e.target.value = ''
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === backdropRef.current) onClose()
  }

  if (!isOpen) return null

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center"
    >
      <div className="w-full h-full sm:h-auto sm:max-h-[80vh] sm:max-w-2xl sm:rounded-lg bg-[#06080d] border border-sea-gold/10 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-sea-gold/10 flex-shrink-0">
          <h3 className="font-cormorant text-lg text-sea-white">
            {mode === 'single' ? 'Choose Image' : 'Choose Images'}
          </h3>
          <button
            onClick={onClose}
            className="w-11 h-11 flex items-center justify-center bg-transparent border border-sea-gold/10 rounded text-sea-blue hover:text-sea-gold cursor-pointer transition-colors text-lg"
          >
            &times;
          </button>
        </div>

        {/* Upload bar */}
        <div className="px-4 py-3 border-b border-sea-gold/10 flex-shrink-0">
          <label className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] bg-sea-gold text-[#06080d] font-dm text-xs font-medium tracking-[0.15em] uppercase cursor-pointer hover:bg-sea-gold-light transition-all">
            {uploading ? 'Uploading...' : 'Upload New'}
            <input
              type="file"
              accept="image/*"
              multiple={mode === 'multiple'}
              onChange={handleUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-3">
          {loading && files.length === 0 ? (
            <p className="text-center text-sea-blue text-sm font-dm py-8">Loading media...</p>
          ) : files.length === 0 ? (
            <p className="text-center text-sea-blue text-sm font-dm py-8">No media yet. Upload some images above.</p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {files.map((file) => {
                const isSelected = selected.has(file.url)
                return (
                  <button
                    key={file.url}
                    onClick={() => handleToggle(file.url)}
                    className={`aspect-square relative overflow-hidden rounded border-2 cursor-pointer bg-[#0a0e18] transition-all ${
                      isSelected ? 'border-sea-gold ring-1 ring-sea-gold' : 'border-transparent hover:border-sea-gold/30'
                    }`}
                  >
                    <img
                      src={file.url}
                      alt={file.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    {isSelected && (
                      <div className="absolute top-1 right-1 w-6 h-6 bg-sea-gold rounded-full flex items-center justify-center">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#06080d" strokeWidth="3">
                          <path d="M5 12l5 5L19 7" />
                        </svg>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-sea-gold/10 flex-shrink-0">
          <button
            onClick={handleConfirm}
            disabled={selected.size === 0}
            className="w-full sm:w-auto px-6 py-2.5 min-h-[44px] bg-sea-gold text-[#06080d] font-dm text-xs font-medium tracking-[0.15em] uppercase hover:bg-sea-gold-light transition-all border-none cursor-pointer disabled:opacity-50"
          >
            {mode === 'single'
              ? 'Use This Image'
              : selected.size === 0
                ? 'Select Images'
                : `Use ${selected.size} Image${selected.size > 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  )
}
