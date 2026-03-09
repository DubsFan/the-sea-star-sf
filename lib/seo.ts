import { supabase } from './supabase'
import type { AppDeps } from './deps'

interface PageSeo {
  metaTitle: string
  metaDescription: string
  ogTitle: string
  ogDescription: string
  ogImage: string
  focusKeyword: string
}

const DEFAULTS: Record<string, PageSeo> = {
  '/': {
    metaTitle: 'The Sea Star | Craft Cocktails in Dogpatch, San Francisco',
    metaDescription: 'The Sea Star is a craft cocktail bar in San Francisco\'s Dogpatch neighborhood. Since 1899 at 2289 3rd Street.',
    ogTitle: 'The Sea Star SF',
    ogDescription: 'Craft cocktails in Dogpatch since 1899.',
    ogImage: '',
    focusKeyword: '',
  },
  '/blog': {
    metaTitle: 'The Journal | The Sea Star SF',
    metaDescription: 'Stories, cocktail culture, and neighborhood news from The Sea Star in Dogpatch, San Francisco.',
    ogTitle: 'The Journal | The Sea Star',
    ogDescription: 'Stories from behind the bar.',
    ogImage: '',
    focusKeyword: '',
  },
  '/faq': {
    metaTitle: 'FAQ | The Sea Star SF',
    metaDescription: 'Frequently asked questions about The Sea Star craft cocktail bar in Dogpatch, San Francisco.',
    ogTitle: 'FAQ | The Sea Star SF',
    ogDescription: 'Everything you need to know about The Sea Star.',
    ogImage: '',
    focusKeyword: '',
  },
}

export async function getPageSeo(pagePath: string, deps?: Pick<AppDeps, 'db'>): Promise<PageSeo> {
  const defaults = DEFAULTS[pagePath] || {
    metaTitle: 'The Sea Star SF',
    metaDescription: '',
    ogTitle: '',
    ogDescription: '',
    ogImage: '',
    focusKeyword: '',
  }

  const db = deps?.db || supabase
  const { data } = await db
    .from('page_seo')
    .select('*')
    .eq('page_path', pagePath)
    .single()

  if (!data) return defaults

  return {
    metaTitle: data.meta_title || defaults.metaTitle,
    metaDescription: data.meta_description || defaults.metaDescription,
    ogTitle: data.og_title || defaults.ogTitle,
    ogDescription: data.og_description || defaults.ogDescription,
    ogImage: data.og_image || defaults.ogImage,
    focusKeyword: data.focus_keyword || defaults.focusKeyword,
  }
}
