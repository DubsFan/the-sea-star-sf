'use client'

import Link from 'next/link'
import { useSession } from '../layout'

const quickActions = [
  { title: 'Manage Menu', href: '/admin/menu', desc: 'Add, edit, or remove cocktails' },
  { title: 'Wine List', href: '/admin/wine', desc: 'Manage your wine selection' },
  { title: 'Create Blog Post', href: '/admin/blog', desc: 'Write your weekly update with AI' },
  { title: 'Media Library', href: '/admin/media', desc: 'Browse and upload images' },
  { title: 'Subscribers', href: '/admin/subscribers', desc: 'View your mailing list' },
  { title: 'Messages', href: '/admin/messages', desc: 'Read contact form submissions' },
]

const howItWorks = [
  {
    title: 'Your Cocktail & Wine Menu',
    points: [
      'You control it from the Menu and Wine pages',
      'Add a new seasonal drink, change a price, update the blurb',
      'Changes go live on the website instantly',
    ],
  },
  {
    title: 'Beer & Cans (Untappd)',
    points: [
      'Your Untappd menu syncs to the website automatically',
      'Update a beer in Untappd, the site updates itself',
      'You do nothing extra',
    ],
  },
  {
    title: 'Event Bookings (Perfect Venue)',
    points: [
      'When someone clicks "Book Event" they go to your Perfect Venue form',
      'Inquiries land in your Perfect Venue inbox',
      'Respond from the PV app like you already do',
    ],
  },
  {
    title: 'Weekly Blog + Newsletter',
    points: [
      'Type 5 sentences about what happened this week',
      'Upload 5 photos',
      'AI writes a full blog post, you review and publish',
      'Publishing also emails your subscriber list automatically',
    ],
  },
]

const planRows = [
  { item: 'Website Build', details: '$1,000 one-time' },
  { item: 'Monthly Management', details: '$100/month' },
  { item: 'Includes', details: 'SEO, Google Business updates, site maintenance, blog AI, email newsletter, hosting' },
  { item: 'Your Weekly Task', details: '5 sentences + 5 photos, then hit publish (~15 min)' },
  { item: 'Your Tools', details: 'Untappd (beer), Perfect Venue (events), this admin page (cocktails, wine, blog)' },
]

const steps = [
  'Log into this admin page on your phone',
  'Type 5 sentences about what happened this week',
  'Upload 5 photos from your camera roll',
  'Tap "Generate Post" — AI writes the blog post in 10 seconds',
  'Review, tweak if you want',
  'Tap "Publish" — blog goes live AND emails your subscriber list',
]

export default function Dashboard() {
  const session = useSession()
  const displayName = session?.displayName || 'there'
  const isCrew = session?.role === 'crew'
  const isSuperAdmin = session?.role === 'super_admin'

  return (
    <div className="max-w-4xl">
      {/* WELCOME */}
      <div className="mb-10 md:mb-12">
        <h1 className="font-playfair text-3xl md:text-4xl font-bold text-sea-gold mb-2">Welcome back, {displayName}</h1>
        <p className="font-cormorant text-lg md:text-xl italic text-sea-blue">Your site, your menus, your way.</p>
      </div>

      {/* QUICK ACTIONS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 mb-10 md:mb-14">
        {quickActions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="block bg-[#0a0e18] border border-sea-gold/10 rounded-lg p-4 md:p-5 hover:border-sea-gold/30 transition-all no-underline group"
          >
            <h3 className="font-playfair text-base md:text-lg text-sea-white group-hover:text-sea-gold transition-colors mb-1">{action.title}</h3>
            <p className="text-xs md:text-sm text-sea-blue font-dm">{action.desc}</p>
          </Link>
        ))}
        {isSuperAdmin && (
          <Link
            href="/admin/users"
            className="block bg-[#0a0e18] border border-purple-500/20 rounded-lg p-4 md:p-5 hover:border-purple-500/40 transition-all no-underline group"
          >
            <h3 className="font-playfair text-base md:text-lg text-sea-white group-hover:text-purple-400 transition-colors mb-1">Manage Users</h3>
            <p className="text-xs md:text-sm text-sea-blue font-dm">Add or remove staff accounts</p>
          </Link>
        )}
      </div>

      {/* HOW EVERYTHING WORKS */}
      <div className="mb-10 md:mb-14">
        <h2 className="font-playfair text-xl md:text-2xl text-sea-white mb-4 md:mb-6">How Everything Works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
          {howItWorks.map((card) => (
            <div key={card.title} className="bg-[#0a0e18] border border-sea-gold/10 rounded-lg p-4 md:p-5">
              <h3 className="font-playfair text-sm md:text-base text-sea-gold mb-3">{card.title}</h3>
              <ul className="space-y-2">
                {card.points.map((point, i) => (
                  <li key={i} className="text-xs md:text-sm text-sea-blue font-dm flex items-start gap-2">
                    <span className="text-sea-gold/50 mt-0.5">-</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* YOUR PLAN - hide for crew */}
      {!isCrew && (
        <div className="mb-10 md:mb-14">
          <h2 className="font-playfair text-xl md:text-2xl text-sea-white mb-4 md:mb-6">Your Plan</h2>
          <div className="bg-[#0a0e18] border border-sea-gold/10 rounded-lg overflow-hidden">
            {/* Desktop table */}
            <table className="hidden md:table w-full">
              <tbody>
                {planRows.map((row, i) => (
                  <tr key={row.item} className={i < planRows.length - 1 ? 'border-b border-sea-gold/5' : ''}>
                    <td className="p-4 text-sm text-sea-gold font-dm font-medium w-[180px] align-top">{row.item}</td>
                    <td className="p-4 text-sm text-sea-blue font-dm">{row.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Mobile stacked */}
            <div className="md:hidden divide-y divide-sea-gold/5">
              {planRows.map((row) => (
                <div key={row.item} className="p-4">
                  <p className="text-xs text-sea-gold font-dm font-medium mb-1">{row.item}</p>
                  <p className="text-sm text-sea-blue font-dm">{row.details}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* YOUR WEEKLY ROUTINE */}
      <div className="mb-10 md:mb-14">
        <h2 className="font-playfair text-xl md:text-2xl text-sea-white mb-4 md:mb-6">Your Weekly Routine</h2>
        <div className="bg-[#0a0e18] border border-sea-gold/10 rounded-lg p-4 md:p-6">
          <ol className="space-y-3">
            {steps.map((step, i) => (
              <li key={i} className="flex items-start gap-3 text-sm font-dm">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-sea-gold/10 text-sea-gold flex items-center justify-center text-xs font-medium">{i + 1}</span>
                <span className="text-sea-blue pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
          <p className="text-sm text-sea-gold font-dm mt-5 pt-4 border-t border-sea-gold/10">Total time: about 15 minutes</p>
        </div>
      </div>

      {/* NEED HELP */}
      <div className="bg-[#0a0e18] border border-sea-gold/10 rounded-lg p-4 md:p-6 mb-8">
        <h2 className="font-playfair text-xl md:text-2xl text-sea-white mb-3">Need Help?</h2>
        <p className="text-sm text-sea-blue font-dm leading-relaxed">
          Text or call GG anytime. For menu or blog changes, just log in here and do it yourself — changes go live instantly.
        </p>
      </div>
    </div>
  )
}
