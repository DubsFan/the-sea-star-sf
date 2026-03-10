import { describe, it, expect, vi, beforeAll } from 'vitest'
import { NextRequest } from 'next/server'
import { mintSessionToken, COOKIE_NAME } from '../helpers/mint-session'

vi.mock('@/lib/supabase', async () => {
  const { getTestDb } = await import('../setup/local-supabase')
  return { supabase: getTestDb() }
})

let authToken: string

beforeAll(async () => {
  authToken = await mintSessionToken('alicia', 'super_admin', 'Alicia')
})

function makeReq(url: string, opts: RequestInit = {}): NextRequest {
  return new NextRequest(url, {
    ...opts,
    headers: {
      ...opts.headers as Record<string, string>,
      Cookie: `${COOKIE_NAME}=${authToken}`,
    },
  })
}

describe('06 — Media Processing', () => {
  it('video/mp4 rejected with clear message', async () => {
    const { POST } = await import('@/app/api/media/route')
    const formData = new FormData()
    formData.append('file', new File(['fake'], 'video.mp4', { type: 'video/mp4' }))

    const req = makeReq('http://localhost:3005/api/media', { method: 'POST', body: formData })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toContain('not supported')
  })

  it('video/webm rejected', async () => {
    const { POST } = await import('@/app/api/media/route')
    const formData = new FormData()
    formData.append('file', new File(['fake'], 'video.webm', { type: 'video/webm' }))

    const req = makeReq('http://localhost:3005/api/media', { method: 'POST', body: formData })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('video/quicktime rejected', async () => {
    const { POST } = await import('@/app/api/media/route')
    const formData = new FormData()
    formData.append('file', new File(['fake'], 'video.mov', { type: 'video/quicktime' }))

    const req = makeReq('http://localhost:3005/api/media', { method: 'POST', body: formData })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('GIF upload accepted (not rejected as video)', async () => {
    const { POST } = await import('@/app/api/media/route')
    const formData = new FormData()
    // Minimal GIF header
    const gifBytes = new Uint8Array([
      0x47, 0x49, 0x46, 0x38, 0x39, 0x61, // GIF89a
      0x01, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00,
      0x3B, // trailer
    ])
    formData.append('file', new File([gifBytes], 'test.gif', { type: 'image/gif' }))
    formData.append('bucket', 'Drink Images')

    const req = makeReq('http://localhost:3005/api/media', { method: 'POST', body: formData })
    const res = await POST(req)
    // Should not be 400 — GIFs are allowed
    expect(res.status).not.toBe(400)
  })

  it('non-image file rejected', async () => {
    const { POST } = await import('@/app/api/media/route')
    const formData = new FormData()
    formData.append('file', new File(['hello'], 'doc.pdf', { type: 'application/pdf' }))

    const req = makeReq('http://localhost:3005/api/media', { method: 'POST', body: formData })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toContain('image')
  })

  it('crew role cannot delete media', async () => {
    const { DELETE } = await import('@/app/api/media/route')
    const crewToken = await mintSessionToken('testcrew', 'crew', 'Crew')

    const req = new NextRequest('http://localhost:3005/api/media', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `${COOKIE_NAME}=${crewToken}`,
      },
      body: JSON.stringify({ name: 'fake.png', bucket: 'Drink Images' }),
    })
    const res = await DELETE(req)
    expect(res.status).toBe(403)
  })
})
