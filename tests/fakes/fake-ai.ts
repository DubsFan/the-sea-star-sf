import type { AiProvider } from '@/lib/deps'

export function createFakeAi(responses?: Record<string, string>): AiProvider {
  const defaultResponse = JSON.stringify({
    facebook_caption: 'Check out our latest from The Sea Star!',
    instagram_caption: 'New vibes at The Sea Star ✨ Link in bio.\n#dogpatch #craftcocktails #theseastar',
  })

  return {
    async generate(_systemPrompt: string, _userInput: string) {
      if (responses) {
        for (const [key, value] of Object.entries(responses)) {
          if (_userInput.includes(key)) return value
        }
      }
      return defaultResponse
    },
  }
}
