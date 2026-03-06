import { ImageResponse } from 'next/og'
import { supabase } from '@/lib/supabase'

export const runtime = 'edge'
export const alt = 'The Sea Star SF'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ params }: { params: { slug: string } }) {
  const { data: post } = await supabase
    .from('blog_posts')
    .select('title, published_at, created_at')
    .eq('slug', params.slug)
    .eq('is_published', true)
    .single()

  const title = post?.title || 'The Sea Star SF'
  const date = post
    ? new Date(post.published_at || post.created_at).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : ''

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px',
          background: 'linear-gradient(135deg, #06080d 0%, #0a0e18 50%, #06080d 100%)',
          position: 'relative',
        }}
      >
        {/* Gold accent line */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(90deg, transparent, #c9a54e, transparent)',
          }}
        />

        {/* Brand */}
        <div
          style={{
            fontSize: 14,
            letterSpacing: '0.3em',
            color: '#c9a54e',
            textTransform: 'uppercase',
            marginBottom: 24,
          }}
        >
          THE SEA STAR SF
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: title.length > 60 ? 40 : 52,
            color: '#e8e0d0',
            lineHeight: 1.2,
            maxWidth: '900px',
            fontWeight: 300,
          }}
        >
          {title}
        </div>

        {/* Date */}
        {date && (
          <div
            style={{
              fontSize: 16,
              color: '#6b7a99',
              marginTop: 32,
              letterSpacing: '0.15em',
            }}
          >
            {date}
          </div>
        )}

        {/* Bottom accent */}
        <div
          style={{
            position: 'absolute',
            bottom: 40,
            right: 80,
            fontSize: 12,
            letterSpacing: '0.2em',
            color: '#c9a54e40',
            textTransform: 'uppercase',
          }}
        >
          Craft Cocktails in Dogpatch Since 1899
        </div>
      </div>
    ),
    { ...size }
  )
}
