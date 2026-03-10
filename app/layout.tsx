import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import Starfield from './components/Starfield'
import { BUSINESS } from '@/lib/business'

export const metadata: Metadata = {
  title: 'The Sea Star SF | Craft Cocktails in Dogpatch Since 1899',
  description: 'Award-winning craft cocktails in San Francisco\'s Dogpatch neighborhood. A 127-year-old bar reimagined by Speed Rack champion Alicia Walton. Open daily.',
  openGraph: {
    title: 'The Sea Star SF | Booze Your Own Adventure',
    description: 'Craft cocktails with soul. A 127-year-old Dogpatch legend run by award-winning mixologist Alicia Walton.',
    type: 'website',
  },
}

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': ['BarOrPub', 'Organization'],
  '@id': `${BUSINESS.url}/#organization`,
  name: BUSINESS.name,
  description: BUSINESS.description,
  url: BUSINESS.url,
  ...(BUSINESS.telephone ? { telephone: BUSINESS.telephone } : {}),
  email: BUSINESS.email,
  priceRange: BUSINESS.priceRange,
  servesCuisine: BUSINESS.servesCuisine,
  address: {
    '@type': 'PostalAddress',
    ...BUSINESS.address,
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: BUSINESS.geo.latitude,
    longitude: BUSINESS.geo.longitude,
  },
  ...(BUSINESS.sameAs.length > 0 ? { sameAs: BUSINESS.sameAs } : {}),
  ...(BUSINESS.openingHours.length > 0 ? { openingHours: BUSINESS.openingHours } : {}),
  menu: BUSINESS.menuUrl,
  acceptsReservations: true,
  founder: {
    '@type': 'Person',
    name: BUSINESS.founder.name,
    jobTitle: BUSINESS.founder.jobTitle,
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
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:bg-sea-gold focus:text-[#06080d] focus:px-4 focus:py-2 focus:text-sm focus:font-dm focus:rounded">Skip to main content</a>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <Starfield />
        <Toaster position="bottom-center" />
        <main id="main" className="relative z-[1]">
          {children}
        </main>
      </body>
    </html>
  )
}
