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

const STATIC_POSTS: BlogPost[] = [
  {
    id: 'static-inclusive-bars',
    title: 'Discover the Most Inclusive Bars in Bay Area: Your Guide to Safe Space Bars',
    slug: 'inclusive-bars-bay-area',
    excerpt: 'When it comes to finding a spot where everyone feels welcome, the Bay Area stands out. Explore the best inclusive bars that celebrate diversity, community, and unforgettable cocktails.',
    featured_image: '/bright-drinks.png',
    published_at: '2026-03-07',
  },
  {
    id: 'static-spring-menu',
    title: 'Introducing the Spring Menu: Florals, Smoke & a Little Chaos',
    slug: '',
    excerpt: 'Every season, we tear up the menu and start fresh. Spring 2026 is no exception. The Gypsy Tailwind and Spill The Tea lead the charge.',
    featured_image: 'https://cdn.canvasrebel.com/wp-content/uploads/2025/03/c-1742689690106-1742689689772_alicia_walton_4f1a0644.jpeg',
    published_at: '2026-02-15',
  },
  {
    id: 'static-espresso-martini',
    title: 'Behind the Nitro Espresso Martini: Rebuilding a Classic',
    slug: '',
    excerpt: 'The espresso martini is everywhere. We wanted to make one worth talking about. Step one: ditch the vodka.',
    featured_image: 'https://thetasteedit.com/wp-content/uploads/2016/04/the-sea-star-san-francisco-thetastesf-alicia-walton-cynar-DSC08610.jpg',
    published_at: '2026-01-20',
  },
  {
    id: 'static-127-years',
    title: '127 Years at 2289 3rd Street: The History Beneath Your Feet',
    slug: '',
    excerpt: "There's a trough under the bar. A real, century-old trough that once served as a urinal and tobacco spittoon. The building first appeared on maps in 1899.",
    featured_image: 'https://drinkfellows.com/cdn/shop/articles/sea_star_interior_2_1100x.jpg?v=1647980521',
    published_at: '2025-12-10',
  },
]

export default async function BlogPage() {
  const { data: dbPosts } = await supabase
    .from('blog_posts')
    .select('id, title, slug, excerpt, featured_image, published_at')
    .eq('is_published', true)
    .order('published_at', { ascending: false })

  // Merge DB posts with static posts, DB posts first, then static posts that aren't duplicated
  const dbSlugs = new Set((dbPosts || []).map((p: BlogPost) => p.slug))
  const staticFiltered = STATIC_POSTS.filter(p => !dbSlugs.has(p.slug))
  const allPosts = [...(dbPosts || []), ...staticFiltered]

  return (
    <div className="min-h-screen bg-[#06080d]">
      <div className="max-w-[1200px] mx-auto px-6 md:px-12 py-32">
        <div className="text-center mb-16">
          <p className="font-dm text-[0.55rem] font-medium tracking-[0.5em] uppercase text-sea-gold mb-6">From the Bar</p>
          <h1 className="font-cormorant text-[clamp(2.2rem,5vw,3.8rem)] font-light leading-tight text-sea-white">The <em className="text-sea-gold">Journal</em></h1>
          <p className="font-cormorant text-lg italic text-sea-blue mt-4">Stories, cocktail insights, and news from behind the bar</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {allPosts.slice(0, 1).map((post: BlogPost) => (
            <Link
              key={post.id}
              href={post.slug ? `/blog/${post.slug}` : '/#journal'}
              className="md:col-span-2 border border-sea-gold/5 overflow-hidden hover:border-sea-gold/15 hover:-translate-y-1 transition-all no-underline block group"
            >
              <div className="grid md:grid-cols-2">
                <div className="aspect-video md:aspect-auto relative overflow-hidden bg-gradient-to-br from-[#0c2d3a] to-[#0f1523]">
                  {post.featured_image && (
                    <div className="absolute inset-0 bg-cover bg-center opacity-50 group-hover:opacity-60 transition-opacity" style={{ backgroundImage: `url('${post.featured_image}')` }} />
                  )}
                  <div className="absolute bottom-4 left-5 font-playfair text-6xl font-extrabold text-sea-gold/10">01</div>
                </div>
                <div className="p-8 md:p-10 flex flex-col justify-center">
                  <div className="text-[0.55rem] tracking-[0.25em] uppercase text-sea-gold mb-4">
                    {new Date(post.published_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </div>
                  <h2 className="font-cormorant text-[clamp(1.5rem,3vw,2rem)] font-light text-sea-white leading-tight mb-4">{post.title}</h2>
                  <p className="text-[0.9rem] text-sea-blue leading-relaxed font-dm mb-6">{post.excerpt}</p>
                  <span className="text-[0.55rem] tracking-[0.25em] uppercase text-sea-gold group-hover:tracking-[0.35em] transition-all">Read More &rarr;</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {allPosts.slice(1).map((post: BlogPost, i: number) => (
            <Link
              key={post.id}
              href={post.slug ? `/blog/${post.slug}` : '/#journal'}
              className="border border-sea-gold/5 overflow-hidden hover:border-sea-gold/15 hover:-translate-y-1 transition-all no-underline block group"
            >
              <div className="aspect-video relative overflow-hidden bg-gradient-to-br from-[#0c2d3a] to-[#0f1523]">
                {post.featured_image && (
                  <div className="absolute inset-0 bg-cover bg-center opacity-40 group-hover:opacity-50 transition-opacity" style={{ backgroundImage: `url('${post.featured_image}')` }} />
                )}
                <div className="absolute bottom-3 left-4 font-playfair text-5xl font-extrabold text-sea-gold/10">{String(i + 2).padStart(2, '0')}</div>
              </div>
              <div className="p-6">
                <div className="text-[0.55rem] tracking-[0.25em] uppercase text-sea-gold mb-3">
                  {new Date(post.published_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </div>
                <h2 className="font-cormorant text-xl font-normal text-sea-white leading-tight mb-3">{post.title}</h2>
                <p className="text-[0.85rem] text-sea-blue leading-relaxed font-dm line-clamp-2">{post.excerpt}</p>
                <span className="inline-block mt-4 text-[0.55rem] tracking-[0.25em] uppercase text-sea-gold group-hover:tracking-[0.3em] transition-all">Read More &rarr;</span>
              </div>
            </Link>
          ))}
        </div>

        <div className="text-center mt-20">
          <Link href="/" className="text-[0.55rem] tracking-[0.2em] uppercase text-sea-blue px-5 py-2.5 border border-sea-border hover:border-sea-gold hover:text-sea-gold transition-all no-underline">
            &larr; Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
