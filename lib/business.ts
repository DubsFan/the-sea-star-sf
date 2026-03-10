/**
 * Canonical business data for The Sea Star.
 * Single source of truth for structured data, JSON-LD, and meta tags.
 */

export const BUSINESS = {
  name: 'The Sea Star',
  legalName: 'The Sea Star SF',
  description: 'Award-winning craft cocktails in San Francisco\'s Dogpatch neighborhood. A bar at 2289 3rd Street since 1899, reimagined by Speed Rack champion Alicia Walton.',
  url: 'https://theseastarsf.com',
  telephone: '(415) 552-5330',
  email: 'info@theseastarsf.com',
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
  sameAs: [
    'https://www.instagram.com/theseastarsf/',
    'https://www.facebook.com/theseastarsf/',
    'https://www.yelp.com/biz/the-sea-star-san-francisco',
  ],
  menuUrl: 'https://theseastarsf.com/#menu',
  reservationUrl: 'https://app.perfectvenue.com/venues/sea-star/hello',
  // Schema.org openingHoursSpecification format
  openingHours: [
    'Mo-Th 16:00-01:00',
    'Fr 16:00-02:00',
    'Sa 14:00-02:00',
    'Su 14:00-01:00',
  ],
  amenities: {
    dogFriendly: true,
    byoFood: true,
    wheelchairAccessible: true,
    freeWifi: true,
    contactlessPayments: true,
  },
  transit: 'T-Line Muni at 20th & 3rd. 22nd St Caltrain 0.3 mi.',
  founder: {
    name: 'Alicia Walton',
    jobTitle: 'Owner & Head Bartender',
  },
} as const
