import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import Starfield from './components/Starfield'

export const metadata: Metadata = {
  title: 'The Sea Star SF | Craft Cocktails in Dogpatch Since 1899',
  description: 'Award-winning craft cocktails in San Francisco\'s Dogpatch neighborhood. A 127-year-old bar reimagined by Speed Rack champion Alicia Walton. Open daily.',
  openGraph: {
    title: 'The Sea Star SF | Booze Your Own Adventure',
    description: 'Craft cocktails with soul. A 127-year-old Dogpatch legend run by award-winning mixologist Alicia Walton.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-[#06080d] text-[#d8e0ed] antialiased overflow-x-hidden">
        <Starfield />
        <Toaster position="bottom-center" />
        <div className="relative z-[1]">
          {children}
        </div>
      </body>
    </html>
  )
}
