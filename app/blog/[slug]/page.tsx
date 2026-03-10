import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { BUSINESS } from '@/lib/business'

export const revalidate = 60

interface Props {
  params: { slug: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { data: post } = await supabase
    .from('blog_posts')
    .select('title, meta_description, featured_image, published_at, created_at')
    .eq('slug', params.slug)
    .eq('is_published', true)
    .single()

  if (!post) return { title: 'The Sea Star SF | Blog' }

  const url = `https://theseastarsf.com/blog/${params.slug}`

  return {
    title: `${post.title} | The Sea Star SF`,
    description: post.meta_description || '',
    openGraph: {
      title: post.title,
      description: post.meta_description || '',
      type: 'article',
      url,
      publishedTime: post.published_at || post.created_at,
      authors: ['Alicia Walton'],
      siteName: 'The Sea Star SF',
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.meta_description || '',
    },
  }
}

export default async function BlogPostPage({ params }: Props) {
  const { data: post } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', params.slug)
    .eq('is_published', true)
    .single()

  if (!post) notFound()

  // Strip HTML for word count
  const plainText = (post.body || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  const wordCount = plainText.split(' ').filter(Boolean).length

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.meta_description || post.excerpt || '',
    datePublished: post.published_at || post.created_at,
    ...(post.updated_at ? { dateModified: post.updated_at } : {}),
    ...(post.featured_image ? { image: post.featured_image } : {}),
    wordCount,
    ...(post.focus_keyword ? { keywords: post.focus_keyword } : {}),
    author: { '@type': 'Person', name: BUSINESS.founder.name },
    publisher: {
      '@type': 'BarOrPub',
      '@id': `${BUSINESS.url}/#organization`,
      name: BUSINESS.name,
      address: { '@type': 'PostalAddress', ...BUSINESS.address },
    },
    url: `${BUSINESS.url}/blog/${post.slug}`,
  }

  return (
    <article aria-label={post.title} className="min-h-screen bg-[#06080d]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="max-w-[700px] mx-auto px-6 md:px-12 py-32">
        <Link href="/blog" className="text-[0.55rem] tracking-[0.25em] uppercase text-sea-blue hover:text-sea-gold transition-colors no-underline mb-12 inline-block">
          &larr; All Posts
        </Link>

        <div className="text-[0.55rem] tracking-[0.25em] uppercase text-sea-gold mb-4">
          {new Date(post.published_at || post.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </div>

        <h1 className="font-cormorant text-[clamp(2rem,4vw,3rem)] font-light text-sea-white leading-tight mb-8">
          {post.title}
        </h1>

        {post.featured_image && (
          <div className="aspect-video mb-8 overflow-hidden rounded-lg">
            <img src={post.featured_image} alt={post.title} className="w-full h-full object-cover" />
          </div>
        )}

        <div
          className="prose prose-invert max-w-none text-sea-blue leading-relaxed font-dm [&>p]:mb-6 [&>p:first-child]:text-lg [&>p:first-child]:font-cormorant [&>p:first-child]:italic [&>p:first-child]:text-sea-light [&>p:first-child]:leading-relaxed"
          dangerouslySetInnerHTML={{ __html: post.body }}
        />

        {/* Subscribe CTA */}
        <div className="mt-16 border-t border-sea-gold/10 pt-12 text-center">
          <h2 className="font-cormorant text-2xl font-light text-sea-white mb-3">Subscribe to our newsletter</h2>
          <p className="text-sm text-sea-blue mb-6 font-dm">Get stories like this delivered to your inbox.</p>
          <Link href="/#journal" className="font-dm text-[0.6rem] font-medium tracking-[0.3em] uppercase px-8 py-3 bg-sea-gold text-[#06080d] hover:bg-sea-gold-light transition-all no-underline inline-block">
            Join the Crew
          </Link>
        </div>
      </div>
    </article>
  )
}
