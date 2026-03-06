import { supabase } from './supabase'

const GRAPH_URL = 'https://graph.facebook.com/v22.0'

async function getSetting(key: string): Promise<string> {
  const { data } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', key)
    .single()
  return data?.value || ''
}

export async function postToFacebook(message: string, link: string) {
  const token = await getSetting('meta_page_access_token')
  const pageId = await getSetting('meta_page_id')
  if (!token || !pageId) throw new Error('Facebook not configured')

  const res = await fetch(`${GRAPH_URL}/${pageId}/feed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, link, access_token: token }),
  })
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  return { id: data.id }
}

export async function postToInstagram(imageUrl: string, caption: string) {
  const token = await getSetting('meta_page_access_token')
  const igUserId = await getSetting('meta_ig_user_id')
  if (!token || !igUserId) throw new Error('Instagram not configured')

  // Step 1: Create media container
  const containerRes = await fetch(`${GRAPH_URL}/${igUserId}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image_url: imageUrl,
      caption,
      access_token: token,
    }),
  })
  const container = await containerRes.json()
  if (container.error) throw new Error(container.error.message)

  // Step 2: Publish
  const publishRes = await fetch(`${GRAPH_URL}/${igUserId}/media_publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      creation_id: container.id,
      access_token: token,
    }),
  })
  const published = await publishRes.json()
  if (published.error) throw new Error(published.error.message)
  return { id: published.id }
}
