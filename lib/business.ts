/**
 * Canonical business data for The Sea Star.
 * Single source of truth for structured data, JSON-LD, and meta tags.
 */

export const BUSINESS = {
  name: 'The Sea Star',
  legalName: 'The Sea Star SF',
  description: 'Award-winning craft cocktails in San Francisco\'s Dogpatch neighborhood. A bar at 2289 3rd Street since 1899, reimagined by Speed Rack champion Alicia Walton.',
  url: 'https://theseastarsf.com',
  telephone: '', // to be confirmed
  email: 'hello@theseastarsf.com',
  priceRange: '$$',
  servesCuisine: 'Craft Cocktails',
  address: {
    streetAddress: '2289 3rd Street',
    addressLocality: 'San Francisco',
    addressRegion: 'CA',
    postalCode: '94107',
    addressCountry: 'US',
  },
  geo: {
    latitude: 37.7583,
    longitude: -122.3879,
  },
  // Confirmed social URLs
  sameAs: [
    'https://www.instagram.com/theseastarsf/',
  ],
  // External links
  menuUrl: 'https://theseastarsf.com/#menu',
  reservationUrl: 'https://app.perfectvenue.com/venues/sea-star/hello',
  // Hours — placeholder, to be confirmed by owner
  openingHours: [
    // 'Mo-Fr 16:00-02:00',
    // 'Sa-Su 12:00-02:00',
  ],
  founder: {
    name: 'Alicia Walton',
    jobTitle: 'Owner & Head Bartender',
  },
} as const
