import { Metadata } from 'next'
import { getPageSeo } from '@/lib/seo'
import { supabase } from '@/lib/supabase'

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getPageSeo('/faq')
  return {
    title: seo.metaTitle,
    description: seo.metaDescription,
    openGraph: {
      title: seo.ogTitle || seo.metaTitle,
      description: seo.ogDescription || seo.metaDescription,
      ...(seo.ogImage ? { images: [seo.ogImage] } : {}),
    },
  }
}

interface FaqItem {
  id: string
  category: string
  question: string
  answer: string
  sort_order: number
}

export default async function FaqPage() {
  const { data } = await supabase
    .from('content_library_items')
    .select('id, category, question, answer, sort_order')
    .eq('asset_type', 'faq')
    .eq('is_public', true)
    .order('sort_order', { ascending: true })

  const faqs: FaqItem[] = data || []

  // Group by category
  const grouped = new Map<string, FaqItem[]>()
  for (const faq of faqs) {
    const cat = faq.category || 'General'
    if (!grouped.has(cat)) grouped.set(cat, [])
    grouped.get(cat)!.push(faq)
  }

  const categories = Array.from(grouped.entries())

  // JSON-LD
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="min-h-screen bg-[#06080d]">
        <div className="max-w-3xl mx-auto px-4 py-16 md:py-24">
          <h1 className="font-cormorant text-4xl md:text-5xl font-light text-sea-white text-center mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-center text-sea-blue font-dm text-sm mb-12">
            Everything you need to know about The Sea Star.
          </p>

          {faqs.length === 0 ? (
            <p className="text-center text-sea-blue font-dm">No FAQs available yet.</p>
          ) : (
            <div className="space-y-10">
              {categories.map(([category, items]) => (
                <div key={category}>
                  {categories.length > 1 && (
                    <h2 className="font-cormorant text-2xl text-sea-gold mb-4">{category}</h2>
                  )}
                  <div className="space-y-4">
                    {items.map((faq) => (
                      <details key={faq.id} className="group bg-[#0a0e18] border border-sea-gold/10 rounded-lg overflow-hidden">
                        <summary className="px-5 py-4 cursor-pointer text-sea-white font-dm text-sm font-medium list-none flex items-center justify-between gap-4 min-h-[52px]">
                          {faq.question}
                          <svg
                            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7a99" strokeWidth="2"
                            className="flex-shrink-0 transition-transform group-open:rotate-180"
                          >
                            <path d="M6 9l6 6 6-6" />
                          </svg>
                        </summary>
                        <div className="px-5 pb-4">
                          <p className="text-sm text-sea-blue font-dm leading-relaxed">{faq.answer}</p>
                        </div>
                      </details>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
