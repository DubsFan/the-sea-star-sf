import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Journal | The Sea Star SF',
  description: 'Stories, cocktail insights, and news from behind the bar at The Sea Star in Dogpatch, San Francisco.',
}

export const revalidate = 60

interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string
  featured_image: string
  published_at: string
}

export default async function BlogPage() {
  const { data: posts } = await supabase
    .from('blog_posts')
    .select('id, title, slug, excerpt, featured_image, published_at')
    .eq('is_published', true)
    .order('published_at', { ascending: false })

  return (
    <div className="min-h-screen bg-[#06080d]">
      <div className="max-w-[1200px] mx-auto px-6 md:px-12 py-32">
        <div className="text-center mb-16">
          <p className="font-dm text-[0.55rem] font-medium tracking-[0.5em] uppercase text-sea-gold mb-6">From the Bar</p>
          <h1 className="font-cormorant text-[clamp(2.2rem,5vw,3.8rem)] font-light leading-tight text-sea-white">The <em className="text-sea-gold">Journal</em></h1>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {(posts || []).map((post: BlogPost) => (
            <Link key={post.id} href={`/blog/${post.slug}`} className="border border-sea-gold/5 overflow-hidden hover:border-sea-gold/15 hover:-translate-y-1 transition-all no-underline block">
              <div className="aspect-video relative overflow-hidden bg-gradient-to-br from-[#0c2d3a] to-[#0f1523]">
                {post.featured_image && (
                  <div className="absolute inset-0 bg-cover bg-center opacity-40" style={{ backgroundImage: `url('${post.featured_image}')` }} />
                )}
              </div>
              <div className="p-6">
                <div className="text-[0.55rem] tracking-[0.25em] uppercase text-sea-gold mb-3">
                  {new Date(post.published_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </div>
                <h2 className="font-cormorant text-xl font-normal text-sea-white leading-tight mb-3">{post.title}</h2>
                <p className="text-[0.85rem] text-sea-blue leading-relaxed font-dm line-clamp-2">{post.excerpt}</p>
                <span className="inline-block mt-4 text-[0.55rem] tracking-[0.25em] uppercase text-sea-gold">Read More &rarr;</span>
              </div>
            </Link>
          ))}
        </div>

        {(!posts || posts.length === 0) && (
          <p className="text-center text-sea-blue font-dm">No posts yet. Check back soon!</p>
        )}

        <div className="text-center mt-16">
          <Link href="/" className="text-[0.55rem] tracking-[0.2em] uppercase text-sea-blue px-5 py-2.5 border border-sea-border hover:border-sea-gold hover:text-sea-gold transition-all no-underline">
            &larr; Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
