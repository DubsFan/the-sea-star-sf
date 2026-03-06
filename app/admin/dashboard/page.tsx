'use client'

import Link from 'next/link'

const quickActions = [
  { title: 'Manage Menu', href: '/admin/menu', desc: 'Add, edit, or remove cocktails and wines' },
  { title: 'Create Blog Post', href: '/admin/blog', desc: 'Write your weekly update, AI helps you publish' },
  { title: 'Email Subscribers', href: '/admin/subscribers', desc: 'View and export your mailing list' },
  { title: 'Messages', href: '/admin/messages', desc: 'Read contact form submissions' },
]

const howItWorks = [
  {
    title: 'Your Cocktail & Wine Menu',
    points: [
      'You control it from the Menu page',
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
  return (
    <div className="max-w-4xl">
      {/* WELCOME */}
      <div className="mb-12">
        <h1 className="font-playfair text-4xl font-bold text-sea-gold mb-2">Welcome back, Alicia</h1>
        <p className="font-cormorant text-xl italic text-sea-blue">Your site, your menus, your way.</p>
      </div>

      {/* QUICK ACTIONS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-14">
        {quickActions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="block bg-[#0a0e18] border border-sea-gold/10 rounded-lg p-5 hover:border-sea-gold/30 transition-all no-underline group"
          >
            <h3 className="font-playfair text-lg text-sea-white group-hover:text-sea-gold transition-colors mb-1">{action.title}</h3>
            <p className="text-sm text-sea-blue font-dm">{action.desc}</p>
          </Link>
        ))}
      </div>

      {/* HOW EVERYTHING WORKS */}
      <div className="mb-14">
        <h2 className="font-playfair text-2xl text-sea-white mb-6">How Everything Works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {howItWorks.map((card) => (
            <div key={card.title} className="bg-[#0a0e18] border border-sea-gold/10 rounded-lg p-5">
              <h3 className="font-playfair text-base text-sea-gold mb-3">{card.title}</h3>
              <ul className="space-y-2">
                {card.points.map((point, i) => (
                  <li key={i} className="text-sm text-sea-blue font-dm flex items-start gap-2">
                    <span className="text-sea-gold/50 mt-0.5">-</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* YOUR PLAN */}
      <div className="mb-14">
        <h2 className="font-playfair text-2xl text-sea-white mb-6">Your Plan</h2>
        <div className="bg-[#0a0e18] border border-sea-gold/10 rounded-lg overflow-hidden">
          <table className="w-full">
            <tbody>
              {planRows.map((row, i) => (
                <tr key={row.item} className={i < planRows.length - 1 ? 'border-b border-sea-gold/5' : ''}>
                  <td className="p-4 text-sm text-sea-gold font-dm font-medium w-[180px] align-top">{row.item}</td>
                  <td className="p-4 text-sm text-sea-blue font-dm">{row.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* YOUR WEEKLY ROUTINE */}
      <div className="mb-14">
        <h2 className="font-playfair text-2xl text-sea-white mb-6">Your Weekly Routine</h2>
        <div className="bg-[#0a0e18] border border-sea-gold/10 rounded-lg p-6">
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
      <div className="bg-[#0a0e18] border border-sea-gold/10 rounded-lg p-6 mb-8">
        <h2 className="font-playfair text-2xl text-sea-white mb-3">Need Help?</h2>
        <p className="text-sm text-sea-blue font-dm leading-relaxed">
          Text or call GG anytime. For menu or blog changes, just log in here and do it yourself — changes go live instantly.
        </p>
      </div>
    </div>
  )
}
