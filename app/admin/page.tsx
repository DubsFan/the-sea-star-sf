'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLogin() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      if (res.ok) {
        router.push('/admin/dashboard')
      } else {
        setError('Invalid credentials. Try again.')
      }
    } catch {
      setError('Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#06080d] flex items-center justify-center px-4">
      <div className="max-w-sm w-full text-center">
        <h2 className="font-cormorant text-4xl font-light text-sea-white mb-2">Welcome Back</h2>
        <p className="text-sm text-sea-blue mb-10 font-dm">Staff access only</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="block w-full px-5 py-3 bg-[rgba(26,34,54,0.5)] border border-sea-gold/15 text-sea-light font-dm text-sm outline-none focus:border-sea-gold transition-colors placeholder:text-sea-border"
            autoComplete="off"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="block w-full px-5 py-3 bg-[rgba(26,34,54,0.5)] border border-sea-gold/15 text-sea-light font-dm text-sm outline-none focus:border-sea-gold transition-colors placeholder:text-sea-border"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-sea-gold text-[#06080d] font-dm text-[0.6rem] font-medium tracking-[0.3em] uppercase border-none cursor-pointer hover:bg-sea-gold-light transition-all disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        {error && <p className="text-sea-rose text-sm mt-4">{error}</p>}
      </div>
    </div>
  )
}
