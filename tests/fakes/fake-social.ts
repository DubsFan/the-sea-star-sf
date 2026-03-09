import type { SocialProvider } from '@/lib/deps'

export interface FakeSocialOptions {
  facebookFails?: boolean
  instagramFails?: boolean
}

export function createFakeSocial(options?: FakeSocialOptions): SocialProvider & { posts: { platform: string; message?: string; caption?: string }[] } {
  const posts: { platform: string; message?: string; caption?: string }[] = []

  return {
    posts,
    async postToFacebook(message: string) {
      if (options?.facebookFails) throw new Error('Facebook API error')
      posts.push({ platform: 'facebook', message })
      return { id: 'fb-fake-post-id' }
    },
    async postToInstagram(_imageUrl: string, caption: string) {
      if (options?.instagramFails) throw new Error('Instagram API error')
      posts.push({ platform: 'instagram', caption })
      return { id: 'ig-fake-post-id' }
    },
  }
}
