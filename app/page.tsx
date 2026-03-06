'use client'

import { useEffect, useState, useRef } from 'react'
import toast from 'react-hot-toast'

interface MenuItem {
  id: string
  name: string
  price: number
  blurb: string
  image_url: string
  category: string
  sort_order: number
  is_active: boolean
}

interface BlogPost {
  id: string
  title: string
  slug: string
  body: string
  excerpt: string
  featured_image: string
  published_at: string
  created_at: string
}

const FALLBACK_MENU: Record<string, { name: string; price: number; blurb: string }[]> = {
  'Batched': [
    { name: 'Pit Stop In Portugal', price: 18, blurb: 'A brandy-fueled detour through Madeira with cherry and almond riding shotgun. Served in a bottle because some journeys deserve commitment.' },
    { name: 'Central Line', price: 18, blurb: 'Rye and vermouth take the express train through Tokyo and Italy in the same sip. Eucalyptus bitters make it smell like a fancy spa that serves booze.' },
    { name: 'Plums The Word', price: 18, blurb: 'Japanese plum brandy meets ginger and honey in a fizzy crush of spring energy. Crushed ice, big flavor, zero regrets.' },
    { name: 'Czechs & Balances', price: 15, blurb: 'Bourbon shakes hands with Czech fernet and allspice for a drink that hits every continent. Shaken with lemon and honey because democracy is sweet.' },
    { name: 'Soft Porn', price: 16, blurb: 'Passionfruit and coconut doing exactly what you think in a coupe glass. Topped with toasted coconut for the morning-after glow.' },
    { name: 'Angel\'s Orchard', price: 18, blurb: 'Angel\'s Envy Bourbon walks through an Italian orchard and comes back changed. Bold, stirred, and served on a throne of clear ice.' },
    { name: 'Spill The Tea', price: 17, blurb: 'Mezcal and earl grey gossip over amaro while cola syrup stirs the pot. Served in a teacup because we are classy like that.' },
    { name: 'Endless Summer', price: 17, blurb: 'Brandy and rum built a beach bar in a Collins glass and invited tonic to the party. Thai spice bitters showed up uninvited and made it better.' },
    { name: 'Gypsy Tailwind', price: 18, blurb: 'Agave spirit catches a breeze of peach, sakura sake, and celery root on its way somewhere beautiful. Mint and a peach ring make sure you enjoy the ride.' },
    { name: 'Caribbean Queen', price: 17, blurb: 'Haitian clairin and peach liqueur slow dance to Caribbean bitters under orange-scented moonlight. Stirred smooth and served on a king cube.' },
    { name: 'Blood From A Stone', price: 18, blurb: 'Highland Park scotch bleeds into blood orange and vermouth with a whisper of cherry and hibiscus. Dark, moody, and stirred to perfection.' },
    { name: 'Panaderia Pinata', price: 16, blurb: 'Turmeric rum and tamarindo swing at a candy-filled party with peppercorn confetti. Crushed ice keeps things chill while the flavors go wild.' },
  ],
  'Made To Order': [
    { name: 'Umami Issues', price: 16, blurb: 'Sesame fat-washed rye with miso and shiitake because your cocktail should have more depth than your ex. Black sesame garnish for the drama.' },
    { name: 'Suntory Fashioned', price: 14, blurb: 'Japanese whisky, honey, and tobacco bitters walk into a bar and refuse to leave. The old fashioned grew up and moved to Tokyo.' },
    { name: 'Spring Fling', price: 17, blurb: 'Gin and vodka split a hibiscus peppercorn situation with sherry playing wingman. Shaken under an umbrella because spring is unpredictable.' },
    { name: 'Mezcal Aloe Mode', price: 16, blurb: 'Smoky mezcal gets a spa day with Chareau aloe liqueur and five-spice bitters. Black salt and dehydrated lime because we take self-care seriously.' },
  ],
  'Draft': [
    { name: 'Monkey Business', price: 16, blurb: 'Irish whiskey goes bananas with aperitivo bitters in the best way possible. Served on a clear cube with an actual banana leaf because we commit to the bit.' },
    { name: 'Thyme On My Hands', price: 16, blurb: 'Vodka and thyme have a sparkling affair topped with bubbly and zero apologies. Champagne glass because you deserve that energy on a Tuesday.' },
    { name: 'Dutch Flight', price: 15, blurb: 'Gin takes a cool cucumber trip through elderflower gardens with celery bitters as tour guide. Light, crisp, and gone before you know it.' },
    { name: 'Nitro Espresso Martini', price: 16, blurb: 'Mezcal and tequila crash an espresso party and nitrogen makes it creamy and ridiculous. Three espresso beans on top because tradition is sacred.' },
    { name: 'Spice Queen', price: 17, blurb: 'Mezcal, tequila, and Campari threw a turmeric-fueled block party in a Collins glass. Crushed ice, chili garnish, and zero chill.' },
  ],
  'NA Mocktails': [
    { name: 'The New OG', price: 16, blurb: 'NA mezcal and chili-infused vermouth prove you don\'t need alcohol to start a fire. Pineapple and agave keep things tropical and dangerous.' },
    { name: 'In The Clouds', price: 16, blurb: 'Blood orange and pamplemouse float through amaro and honey on a tonic cloud. Dreamy, complex, and completely sober.' },
    { name: 'Slim Fizz', price: 13, blurb: 'Coconut and Thai basil take a ginger beer joyride with lime holding on tight. Built in a Collins glass and gone in five minutes.' },
    { name: 'Spiritual Awakening', price: 16, blurb: 'NA amaro meets pomegranate and prickly pear for a drink that sounds like a yoga retreat. Ginger beer adds the fizz your third eye was missing.' },
  ],
}

const WINE_ITEMS = [
  { name: 'Sparkling Ros\u00e9', price: '$14 / $48', desc: 'Dry, crisp, and bright. Perfect with anything on the menu.', tag: 'Glass / Bottle' },
  { name: 'Sauvignon Blanc', price: '$13 / $44', desc: 'Citrus-forward with mineral finish. Sonoma County.', tag: 'Glass / Bottle' },
  { name: 'Pinot Noir', price: '$14 / $48', desc: 'Red fruit, soft tannins, earthy finish. Central Coast.', tag: 'Glass / Bottle' },
  { name: 'Cabernet Sauvignon', price: '$15 / $52', desc: 'Full-bodied, dark cherry, hints of oak and tobacco. Paso Robles.', tag: 'Glass / Bottle' },
  { name: 'Natural Orange Wine', price: '$15 / $50', desc: 'Skin-contact, funky, and textured. Rotating selection.', tag: 'Glass / Bottle' },
  { name: 'Prosecco', price: '$12 / $40', desc: 'Light, bubbly, green apple and pear. Italian.', tag: 'Glass / Bottle' },
]

const BLOG_CONTENT = [
  { date: 'February 2026', title: 'Introducing the Spring Menu: Florals, Smoke & a Little Chaos', content: '<p class="text-lg font-cormorant italic text-sea-light leading-relaxed">Every season, we tear up the menu and start fresh. Spring 2026 is no exception.</p><p>The Gypsy Tailwind is the cocktail we\'re proudest of this round. Aqar\u00e1 Agave and sakura sake with celery root syrup for earthiness and Liquid Alchemist peach for sweetness.</p><p>Spill The Tea is the sleeper hit. Mezcal plus earl grey sounds strange until you taste it. The bergamot in the tea amplifies the smoke.</p><p>The full spring menu is live now. Come taste it before we change it again.</p>' },
  { date: 'January 2026', title: 'Behind the Nitro Espresso Martini: Rebuilding a Classic', content: '<p class="text-lg font-cormorant italic text-sea-light leading-relaxed">The espresso martini is everywhere. We wanted to make one worth talking about.</p><p>Step one: ditch the vodka. We use Caff\u00e8 Borghetti, and split the base between mezcal and tequila.</p><p>Step two: nitrogen. We charge the cocktail with nitro for that cascading pour and dense, creamy head.</p><p>The result is darker, more complex, and honestly more fun to drink.</p>' },
  { date: 'December 2025', title: '127 Years at 2289 3rd Street: The History Beneath Your Feet', content: '<p class="text-lg font-cormorant italic text-sea-light leading-relaxed">There\'s a trough under the bar. A real, century-old trough that once served as a urinal and tobacco spittoon.</p><p>The building first appeared as a saloon on Sanborn fire insurance maps from 1899. It\'s had at least five different names since then.</p><p>The Victorian tin ceilings are original. The long bar has been in the same spot for over a century.</p><p>We don\'t take that lightly. Every cocktail we serve is part of a story that started 127 years ago.</p>' },
]

const CATEGORIES = ['Batched', 'Made To Order', 'Draft', 'NA Mocktails', 'Beer', 'Wine'] as const

const CATEGORY_LABELS: Record<string, string> = {
  'Batched': 'Portside Classics',
  'Made To Order': 'Starboard Select',
  'Draft': 'The Swell',
  'NA Mocktails': 'Safe Harbor',
  'Wine': 'The Hold',
  'Beer': 'The Vessel',
}

export default function Home() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([])
  const [activeTab, setActiveTab] = useState('Batched')
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [blogModalOpen, setBlogModalOpen] = useState(false)
  const [activeBlogIndex, setActiveBlogIndex] = useState(0)
  const [aliciaSlide, setAliciaSlide] = useState(0)
  const [subscribeEmail, setSubscribeEmail] = useState('')
  const [subscribeName, setSubscribeName] = useState('')
  const [loginOpen, setLoginOpen] = useState(false)
  const [loginUser, setLoginUser] = useState('')
  const [loginPass, setLoginPass] = useState('')
  const [loginError, setLoginError] = useState(false)
  const revealRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    fetch('/api/menu')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setMenuItems(data) })
      .catch(() => {})

    fetch('/api/blog')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setBlogPosts(data) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('opacity-100', 'translate-y-0')
            e.target.classList.remove('opacity-0', 'translate-y-10')
            observer.unobserve(e.target)
          }
        })
      },
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    )
    revealRefs.current.forEach((el) => el && observer.observe(el))
    return () => observer.disconnect()
  }, [menuItems, blogPosts])

  useEffect(() => {
    const timer = setInterval(() => {
      setAliciaSlide((prev) => (prev + 1) % 3)
    }, 6000)
    return () => clearInterval(timer)
  }, [])

  const addRevealRef = (el: HTMLDivElement | null) => {
    if (el && !revealRefs.current.includes(el)) {
      revealRefs.current.push(el)
    }
  }

  const filteredItems = menuItems.filter((item) => item.category === activeTab)
  const fallbackItems = FALLBACK_MENU[activeTab] || []
  const displayItems = filteredItems.length > 0 ? filteredItems : (activeTab !== 'Beer' && activeTab !== 'Wine' ? fallbackItems : [])

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' })

  const handleLogin = async () => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUser, password: loginPass }),
      })
      if (res.ok) {
        window.location.href = '/admin/dashboard'
      } else {
        setLoginError(true)
        setLoginPass('')
      }
    } catch {
      setLoginError(true)
      setLoginPass('')
    }
  }

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!subscribeEmail) return
    try {
      await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: subscribeEmail, name: subscribeName }),
      })
      toast.success('Welcome to the crew!')
      setSubscribeEmail('')
      setSubscribeName('')
    } catch {
      toast.error('Something went wrong')
    }
  }

  const aliciaPhotos = [
    'https://cdn.canvasrebel.com/wp-content/uploads/2025/03/c-1742689886356-personal_1742689886058_1742689886058_alicia_walton_alicia_the_sea_star_sanfrancisco_5-23-23_sarahfelker-7.jpeg',
    'https://cdn.canvasrebel.com/wp-content/uploads/2025/03/c-1742689690105-1742689690105-1742689689772_alicia_walton_4f1a0534.jpeg',
    'https://cdn.canvasrebel.com/wp-content/uploads/2025/03/c-1742689690106-1742689689772_alicia_walton_4f1a0498.jpeg',
  ]

  const blogImages = [
    'https://cdn.canvasrebel.com/wp-content/uploads/2025/03/c-1742689690106-1742689689772_alicia_walton_4f1a0644.jpeg',
    'https://thetasteedit.com/wp-content/uploads/2016/04/the-sea-star-san-francisco-thetastesf-alicia-walton-cynar-DSC08610.jpg',
    'https://drinkfellows.com/cdn/shop/articles/sea_star_interior_2_1100x.jpg?v=1647980521',
  ]

  const blogDisplayPosts = blogPosts.length > 0 ? blogPosts.slice(0, 3) : null

  return (
    <>
      {/* NAV */}
      <nav className={`fixed top-0 left-0 right-0 z-[100] px-6 md:px-12 py-4 flex justify-between items-center transition-all duration-500 ${scrolled ? 'bg-[#06080d]/95 backdrop-blur-xl py-3 border-b border-sea-gold/10' : ''}`}>
        <a href="#" className="nav-logo no-underline">
          <img src="/sea-star-logo.png" alt="The Sea Star" style={{ height: '32px', display: 'block' }} />
        </a>
        <div className="hidden md:flex gap-9 items-center">
          {['Story', 'Alicia', 'Menu', 'Reviews', 'Events', 'Journal', 'Visit'].map((item) => (
            <a key={item} href={`#${item.toLowerCase()}`} className="text-[0.65rem] font-dm tracking-[0.2em] uppercase text-sea-blue hover:text-sea-gold transition-colors no-underline">
              {item}
            </a>
          ))}
          <a href="#" onClick={(e) => { e.preventDefault(); setLoginOpen(true) }} className="text-[0.65rem] font-dm tracking-[0.2em] uppercase text-sea-blue hover:text-sea-gold transition-colors no-underline">
            Login
          </a>
          <a href="https://app.perfectvenue.com/venues/sea-star/hello" target="_blank" rel="noopener" className="text-[0.6rem] font-dm tracking-[0.2em] uppercase px-5 py-2 border border-sea-gold text-sea-gold hover:bg-sea-gold hover:text-[#06080d] transition-all no-underline">
            Book Event
          </a>
        </div>
        <button className="md:hidden flex flex-col gap-[5px] bg-transparent border-none p-2" onClick={() => setMobileMenuOpen(true)}>
          <span className="block w-6 h-[1px] bg-sea-gold" />
          <span className="block w-6 h-[1px] bg-sea-gold" />
          <span className="block w-6 h-[1px] bg-sea-gold" />
        </button>
      </nav>

      {/* MOBILE MENU */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-[#06080d]/98 backdrop-blur-xl z-[99] flex flex-col items-center justify-center gap-8">
          <button className="absolute top-6 right-8 bg-transparent border-none text-sea-gold text-3xl cursor-pointer font-light" onClick={() => setMobileMenuOpen(false)}>&times;</button>
          {['Our Story', 'Alicia Walton', 'Menu', 'Reviews', 'Events', 'Journal', 'Visit Us'].map((item, i) => {
            const targets = ['story', 'alicia', 'menu', 'reviews', 'events', 'journal', 'visit']
            return (
              <a key={item} href={`#${targets[i]}`} onClick={() => setMobileMenuOpen(false)} className="font-cormorant text-3xl font-light text-sea-light hover:text-sea-gold transition-colors no-underline">
                {item}
              </a>
            )
          })}
          <a href="#" onClick={(e) => { e.preventDefault(); setMobileMenuOpen(false); setLoginOpen(true) }} className="text-sea-blue no-underline">
            Login
          </a>
          <a href="https://app.perfectvenue.com/venues/sea-star/hello" target="_blank" rel="noopener" className="text-sea-gold no-underline" onClick={() => setMobileMenuOpen(false)}>
            Book an Event
          </a>
        </div>
      )}

      {/* LOGIN MODAL */}
      {loginOpen && (
        <div className="fixed inset-0 bg-[#06080d]/98 backdrop-blur-xl z-[300] flex items-center justify-center">
          <button className="absolute top-8 right-8 bg-transparent border border-[#2d3a52] text-sea-gold text-xl w-10 h-10 cursor-pointer flex items-center justify-center hover:border-sea-gold transition-all" onClick={() => setLoginOpen(false)}>&times;</button>
          <div className="max-w-[380px] w-[90%] text-center" style={{ animation: 'fadeUp 0.5s ease-out' }}>
            <h2 className="font-cormorant text-[2.4rem] font-light text-sea-light mb-2">Welcome Back</h2>
            <p className="text-[0.85rem] text-sea-blue mb-10">Staff access only</p>
            <input
              type="text"
              placeholder="Username"
              autoComplete="off"
              value={loginUser}
              onChange={(e) => setLoginUser(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleLogin() }}
              className="block w-full py-3 px-5 bg-[rgba(26,34,54,0.5)] border border-sea-gold/10 text-sea-light font-dm text-[0.85rem] mb-4 outline-none focus:border-sea-gold transition-colors placeholder:text-[#2d3a52]"
            />
            <input
              type="password"
              placeholder="Password"
              value={loginPass}
              onChange={(e) => setLoginPass(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleLogin() }}
              className="block w-full py-3 px-5 bg-[rgba(26,34,54,0.5)] border border-sea-gold/10 text-sea-light font-dm text-[0.85rem] mb-4 outline-none focus:border-sea-gold transition-colors placeholder:text-[#2d3a52]"
            />
            <button
              onClick={handleLogin}
              className="w-full py-3 bg-sea-gold text-[#06080d] border-none font-dm text-[0.6rem] font-medium tracking-[0.3em] uppercase cursor-pointer hover:bg-[#dfc06e] transition-all mt-2"
            >
              Sign In
            </button>
            {loginError && (
              <p className="text-[#c47e7e] text-[0.75rem] mt-4">Invalid credentials. Try again.</p>
            )}
          </div>
        </div>
      )}

      {/* HERO */}
      <section className="h-screen min-h-[750px] flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#06080d] via-[#0a3847] to-[#0a0e18]" />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 100% 70% at 30% 60%, rgba(58,125,140,0.08) 0%, transparent 50%), radial-gradient(ellipse 80% 50% at 70% 40%, rgba(92,184,196,0.05) 0%, transparent 50%)', animation: 'caustic-shift 8s ease-in-out infinite alternate' }} />
        <div className="text-center relative z-10 px-8">
          <p className="font-dm text-[0.6rem] font-normal tracking-[0.6em] uppercase text-sea-gold mb-12 opacity-0" style={{ animation: 'fadeUp 1s ease-out 0.4s forwards' }}>
            Dogpatch, San Francisco &bull; Est. 1899
          </p>
          <div className="mb-4 opacity-0" style={{ animation: 'fadeUp 1.2s ease-out 0.6s forwards' }}>
            <span className="font-cormorant text-[clamp(1.4rem,3vw,2rem)] font-light italic text-sea-blue tracking-[0.4em] block mb-1">the</span>
            <h1 className="font-playfair text-[clamp(5rem,14vw,12rem)] font-extrabold leading-[0.85] tracking-tight text-sea-gold uppercase" style={{ textShadow: '0 2px 40px rgba(201,165,78,0.3), 0 0 80px rgba(201,165,78,0.1)' }}>
              Sea Star
            </h1>
          </div>
          <p className="font-cormorant text-[clamp(1.1rem,2.5vw,1.7rem)] font-light italic text-sea-blue/80 mt-6 mb-14 tracking-wide opacity-0" style={{ animation: 'fadeUp 1s ease-out 0.9s forwards' }}>
            <span className="text-sea-gold">Booze</span> Your Own Adventure
          </p>
          <div className="flex gap-6 justify-center flex-wrap opacity-0" style={{ animation: 'fadeUp 1s ease-out 1.1s forwards' }}>
            <a href="#menu" className="font-dm text-[0.6rem] font-medium tracking-[0.3em] uppercase px-10 py-4 bg-sea-gold text-[#06080d] hover:bg-sea-gold-light hover:-translate-y-0.5 hover:shadow-[0_8px_40px_rgba(201,165,78,0.25)] transition-all no-underline">
              Explore the Menu
            </a>
            <a href="#visit" className="font-dm text-[0.6rem] font-normal tracking-[0.3em] uppercase px-10 py-4 bg-transparent text-sea-light border border-sea-border hover:border-sea-gold hover:text-sea-gold transition-all no-underline">
              Plan Your Visit
            </a>
          </div>
        </div>
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-3 opacity-0" style={{ animation: 'fadeUp 1s ease-out 1.5s forwards' }}>
          <span className="text-[0.55rem] tracking-[0.4em] uppercase text-sea-blue">Discover</span>
          <div className="w-[1px] h-10 bg-gradient-to-b from-sea-gold to-transparent" style={{ animation: 'scrollPulse 2.5s ease-in-out infinite' }} />
        </div>
      </section>

      {/* STORY */}
      <section id="story" className="py-32 bg-[#06080d]/80">
        <div className="max-w-[1200px] mx-auto px-6 md:px-12">
          <div className="grid md:grid-cols-2 gap-12 md:gap-24 items-center">
            <div ref={addRevealRef} className="relative aspect-[3/4] overflow-hidden opacity-0 translate-y-10 transition-all duration-700">
              <img src="https://www.opensfhistory.org/Image/700/wnp27.4067.jpg" alt="3rd Street Bridge, Dogpatch, circa 1940" className="w-full h-full object-cover opacity-50" style={{ filter: 'sepia(0.3) contrast(1.1)' }} />
              <div className="absolute inset-0 bg-gradient-to-br from-[#06080d]/40 to-[#0c2d3a]/30" />
              <div className="absolute top-8 left-8 text-[0.5rem] tracking-[0.4em] uppercase text-sea-teal px-3 py-1.5 border border-sea-teal/20 z-10">Since 1899</div>
              <div className="absolute bottom-6 left-8 font-playfair text-7xl font-extrabold text-sea-gold/10 z-10">1899</div>
            </div>
            <div ref={addRevealRef} className="opacity-0 translate-y-10 transition-all duration-700">
              <p className="font-dm text-[0.55rem] font-medium tracking-[0.5em] uppercase text-sea-gold mb-6">Our Story</p>
              <h2 className="font-cormorant text-[clamp(2.2rem,5vw,3.8rem)] font-light leading-tight text-sea-white mb-6">127 Years of <em className="text-sea-gold">Boozeness</em></h2>
              <div className="w-[60px] h-[1px] bg-sea-gold-dim mb-8" />
              <p className="font-cormorant text-2xl font-light italic text-sea-light leading-relaxed mb-8">A craft cocktail bar disguised as a dive. A pre-Prohibition saloon reborn in the heart of San Francisco&apos;s Dogpatch.</p>
              <p className="text-base text-sea-blue leading-relaxed mb-6 font-dm">The building at 2289 3rd Street has poured drinks without interruption since 1899. Through earthquakes, Prohibition, world wars, and the transformation of San Francisco&apos;s industrial waterfront, this bar has endured.</p>
              <p className="text-base text-sea-blue leading-relaxed mb-6 font-dm">Look closely and you&apos;ll find the proof: a trough beneath the long bar that once served as a urinal and tobacco spittoon, Victorian tin ceilings overhead, and over a century of stories soaked into the walls.</p>
              <p className="text-base text-sea-blue leading-relaxed mb-6 font-dm">Today, under the stewardship of Alicia Walton, The Sea Star honors that history with award-winning cocktails, a world-class jukebox, and the kind of warmth you only find in a real neighborhood bar.</p>
              <div className="flex gap-12 mt-12 pt-8 border-t border-sea-gold/10">
                <div><div className="font-playfair text-4xl font-bold text-sea-gold">127</div><div className="text-[0.6rem] tracking-[0.2em] uppercase text-sea-blue mt-1">Years Pouring</div></div>
                <div><div className="font-playfair text-4xl font-bold text-sea-gold">4.7</div><div className="text-[0.6rem] tracking-[0.2em] uppercase text-sea-blue mt-1">Google Stars</div></div>
                <div><div className="font-playfair text-4xl font-bold text-sea-gold">5.0</div><div className="text-[0.6rem] tracking-[0.2em] uppercase text-sea-blue mt-1">TripAdvisor</div></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ALICIA */}
      <section id="alicia" className="py-32 relative overflow-hidden border-t border-sea-gold/10">
        <div className="absolute inset-0 z-0">
          {aliciaPhotos.map((photo, i) => (
            <div key={i} className={`absolute inset-[-20px] bg-cover bg-[center_20%] transition-opacity duration-[2500ms] ${i === aliciaSlide ? 'opacity-100' : 'opacity-0'}`} style={{ backgroundImage: `url('${photo}')`, filter: 'saturate(0.6)', ...(i === aliciaSlide ? { animation: 'kenBurns 12s ease-in-out forwards' } : {}) }} />
          ))}
          <div className="absolute inset-0 z-[1]" style={{ background: 'linear-gradient(180deg, #06080d 0%, rgba(6,8,13,0.78) 15%, rgba(10,14,24,0.65) 40%, rgba(10,14,24,0.65) 60%, rgba(6,8,13,0.78) 85%, #06080d 100%)' }} />
        </div>
        <div className="max-w-[800px] mx-auto px-6 md:px-12 text-center relative z-[2]" ref={addRevealRef}>
          <div className="inline-flex items-center gap-3 px-6 py-2 border border-sea-gold/15 mb-8">
            <span className="text-[0.55rem] tracking-[0.35em] uppercase text-sea-gold">&#9733; Meet the Mixologist &#9733;</span>
          </div>
          <p className="font-dm text-[0.55rem] font-medium tracking-[0.5em] uppercase text-sea-gold mb-6">Alicia Walton</p>
          <h2 className="font-cormorant text-[clamp(2.2rem,5vw,3.8rem)] font-light leading-tight text-sea-white mb-6">Award-Winning <em className="text-sea-gold">Bartender</em></h2>
          <div className="w-[60px] h-[1px] bg-sea-gold-dim mx-auto mb-8" />
          <p className="font-cormorant text-[clamp(1.4rem,3vw,2.4rem)] font-light italic text-sea-white leading-relaxed mb-8">&ldquo;We serve delicious drinks with cheeky names, hand-crafted with premium ingredients.&rdquo;</p>
          <p className="text-[0.95rem] text-sea-blue leading-relaxed mb-12 font-dm">From a small-town hostess in West Virginia to one of San Francisco&apos;s most decorated bartenders. Alicia&apos;s path to The Sea Star spans two decades and some of the city&apos;s most iconic bars: Martuni&apos;s, Elixir, Comstock Saloon, and Brass Tacks. She won the 2016 Speed Rack SF championship, was named a StarChefs Rising Star Mixologist, and earned SF Chronicle&apos;s Bar Star recognition. She doesn&apos;t just make cocktails. She makes you feel at home.</p>
          <a href="https://canvasrebel.com/meet-alicia-walton/" target="_blank" rel="noopener" className="inline-block text-[0.55rem] tracking-[0.25em] uppercase text-sea-gold px-5 py-2.5 border border-sea-gold/30 hover:border-sea-gold transition-all no-underline mb-8">
            Read Her Story on CanvasRebel &rarr;
          </a>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-[1px] mt-12 bg-sea-gold/10 border border-sea-gold/10">
            {[
              { year: '2015', name: 'Speed Rack Finalist', org: 'San Francisco' },
              { year: '2016', name: 'Speed Rack Champion', org: 'Ms. Speed Rack SF' },
              { year: '2016', name: 'Rising Star Mixologist', org: 'StarChefs' },
              { year: '2017', name: 'Bar Star', org: 'SF Chronicle' },
            ].map((award) => (
              <div key={award.name} className="bg-[#06080d] p-6 md:p-8 text-center hover:bg-sea-gold/5 transition-all">
                <div className="font-playfair text-3xl font-bold text-sea-gold mb-2">{award.year}</div>
                <div className="text-[0.6rem] font-medium tracking-[0.15em] uppercase text-sea-light mb-1">{award.name}</div>
                <div className="text-[0.55rem] text-sea-blue tracking-wider">{award.org}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COCKTAILS / MENU */}
      <section id="menu" className="py-32 bg-[#0a0e18]/85 border-t border-sea-gold/10 relative overflow-hidden">
        <div className="max-w-[1200px] mx-auto px-6 md:px-12 relative z-[2]">
          <div ref={addRevealRef} className="text-center mb-16 opacity-0 translate-y-10 transition-all duration-700">
            <p className="font-dm text-[0.55rem] font-medium tracking-[0.5em] uppercase text-sea-gold mb-6">The Menu</p>
            <h2 className="font-cormorant text-[clamp(2.2rem,5vw,3.8rem)] font-light leading-tight text-sea-white mb-6">Signature <em className="text-sea-gold">Cocktails</em></h2>
            <p className="text-sea-blue max-w-[500px] mx-auto text-[0.95rem] font-dm">Creative, bold, and unapologetically fun. Every drink crafted with intention.</p>
          </div>

          <div ref={addRevealRef} className="flex justify-center gap-2 mb-12 flex-wrap opacity-0 translate-y-10 transition-all duration-700">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveTab(cat)}
                className={`font-dm text-[0.55rem] tracking-[0.2em] uppercase px-4 py-2.5 border cursor-pointer transition-all ${activeTab === cat ? 'border-sea-gold text-sea-gold bg-sea-gold/5' : 'border-sea-gold/10 text-sea-blue hover:border-sea-gold hover:text-sea-gold'}`}
              >
                {CATEGORY_LABELS[cat] || cat}
              </button>
            ))}
          </div>

          <div ref={addRevealRef} className="opacity-0 translate-y-10 transition-all duration-700">
            {activeTab === 'Beer' && (
              <div className="w-full rounded-lg overflow-hidden">
                <iframe
                  src="https://business.untappd.com/embeds/iframes/4010/12417"
                  frameBorder="0"
                  width="100%"
                  height={800}
                  style={{ border: 'none', borderRadius: '8px' }}
                  title="Untappd Beer Menu"
                />
              </div>
            )}

            {activeTab === 'Wine' && (
              <div className="grid md:grid-cols-2 gap-[1px] bg-sea-gold/5 border border-sea-gold/5">
                {WINE_ITEMS.map((wine) => (
                  <div key={wine.name} className="bg-[#06080d] p-8 hover:bg-sea-gold/[0.02] transition-all">
                    <div className="flex justify-between items-start mb-3">
                      <span className="font-cormorant text-2xl font-normal text-sea-white">{wine.name}</span>
                      <span className="font-cormorant text-xl font-light text-sea-gold">{wine.price}</span>
                    </div>
                    <p className="text-[0.85rem] text-sea-blue leading-relaxed font-dm">{wine.desc}</p>
                    <span className="inline-block mt-3 text-[0.5rem] tracking-[0.2em] uppercase text-sea-teal px-2.5 py-1 border border-sea-teal/25">{wine.tag}</span>
                  </div>
                ))}
              </div>
            )}

            {activeTab !== 'Beer' && activeTab !== 'Wine' && (
              <div className="grid md:grid-cols-2 gap-[1px] bg-sea-gold/[0.06] border border-sea-gold/[0.06]">
                {displayItems.map((item, idx) => (
                  <div key={'id' in item ? (item as MenuItem).id : idx} className="bg-[#06080d] p-8 transition-all hover:bg-sea-gold/[0.02] group">
                    {'image_url' in item && (item as MenuItem).image_url && (
                      <div className="aspect-[16/10] overflow-hidden mb-4 -mx-8 -mt-8">
                        <img src={(item as MenuItem).image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80 group-hover:opacity-100" />
                      </div>
                    )}
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-cormorant text-[1.5rem] font-normal text-sea-white">{item.name}</h3>
                      <span className="font-cormorant text-[1.3rem] font-light text-sea-gold ml-4 whitespace-nowrap">${item.price}</span>
                    </div>
                    <p className="text-[0.85rem] text-sea-blue leading-relaxed font-dm">{item.blurb}</p>
                    <span className="inline-block mt-3 text-[0.5rem] tracking-[0.2em] uppercase text-sea-teal px-2.5 py-1 border border-sea-teal/25 font-dm">{activeTab}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* REVIEWS */}
      <section id="reviews" className="py-32 bg-[#06080d]/80 border-t border-sea-gold/10">
        <div className="max-w-[1200px] mx-auto px-6 md:px-12">
          <div ref={addRevealRef} className="text-center mb-16 opacity-0 translate-y-10 transition-all duration-700">
            <p className="font-dm text-[0.55rem] font-medium tracking-[0.5em] uppercase text-sea-gold mb-6">What People Say</p>
            <h2 className="font-cormorant text-[clamp(2.2rem,5vw,3.8rem)] font-light leading-tight text-sea-white">Don&apos;t Take <em className="text-sea-gold">Our Word</em> For It</h2>
          </div>
          <div ref={addRevealRef} className="flex justify-center gap-4 md:gap-8 mb-16 flex-wrap opacity-0 translate-y-10 transition-all duration-700">
            {[
              { score: '4.7', stars: '\u2605\u2605\u2605\u2605\u2605', source: 'Google', count: '328 reviews', href: 'https://www.google.com/maps/place/The+Sea+Star/@37.7607427,-122.3882716,17z/' },
              { score: '5.0', stars: '\u2605\u2605\u2605\u2605\u2605', source: 'TripAdvisor', count: 'Perfect', href: 'https://www.tripadvisor.com/Restaurant_Review-g60713-d15106299-Reviews-The_Sea_Star-San_Francisco_California.html' },
              { score: '4.5', stars: '\u2605\u2605\u2605\u2605\u2606', source: 'Yelp', count: '128 reviews', href: 'https://www.yelp.com/biz/the-sea-star-san-francisco' },
              { score: '8.6', stars: '\u2605\u2605\u2605\u2605\u2605', source: 'Foursquare', count: '105 ratings', href: 'https://foursquare.com/v/sea-star/53583898498e7059d4ce6206' },
            ].map((r) => (
              <a key={r.source} href={r.href} target="_blank" rel="noopener" className="text-center px-8 py-6 border border-sea-gold/10 min-w-[150px] hover:border-sea-gold-dim hover:-translate-y-1 transition-all no-underline block">
                <div className="font-playfair text-4xl font-bold text-sea-gold">{r.score}</div>
                <div className="text-sea-gold text-xs mt-1 tracking-wider">{r.stars}</div>
                <div className="text-[0.55rem] tracking-[0.2em] uppercase text-sea-blue mt-1">{r.source}</div>
                <div className="text-[0.65rem] text-sea-border mt-0.5">{r.count}</div>
              </a>
            ))}
          </div>
          <div ref={addRevealRef} className="grid md:grid-cols-3 gap-6 opacity-0 translate-y-10 transition-all duration-700">
            {[
              { text: 'This star is rising! New ownership has transformed this spot with a delicious and interesting cocktail list, fun jukebox, gracious bartenders, and lively atmosphere.', author: 'Foursquare', platform: 'Verified Visitor' },
              { text: 'Dog friendly, great bartenders, good value and best of all creative and well made cocktails and non-alcoholic drinks. I left wanting to return.', author: 'Google Review', platform: '5 Stars' },
              { text: 'What an awesome bar! Excellent environment for drinks with sports mixed in. The decor is really unique. Think sea-themed with artistic lighting.', author: 'Yelp', platform: 'Verified Reviewer' },
              { text: 'A charming place with high ceilings and a lot of character. The laid-back atmosphere of a dive bar with the cocktail quality of the finest lounges.', author: 'Yelp', platform: 'Verified Reviewer' },
              { text: 'Some of the best bartenders in town in an unpretentious, high-energy atmosphere. Great pricing for SF and fun for days!', author: 'Jennifer D.', platform: 'Visited 25+ times' },
              { text: 'They took a neighborhood dive and cleaned it up without losing the character. The cocktail program is seriously one of the best in the city.', author: 'Foursquare', platform: 'Verified Visitor' },
            ].map((review, i) => (
              <div key={i} className="p-8 bg-gradient-to-br from-[rgba(26,34,54,0.4)] to-[rgba(15,21,35,0.6)] border border-sea-gold/5 hover:border-sea-gold/15 hover:-translate-y-1 transition-all duration-300 relative">
                <span className="absolute top-3 left-6 font-cormorant text-6xl text-sea-gold/10 leading-none">&ldquo;</span>
                <p className="font-cormorant text-base font-light italic text-sea-light leading-relaxed mb-6 relative z-10">{review.text}</p>
                <div className="text-[0.65rem] font-medium tracking-[0.15em] uppercase text-sea-gold">{review.author}</div>
                <div className="text-[0.55rem] text-sea-blue tracking-wider">{review.platform}</div>
              </div>
            ))}
          </div>
          <div ref={addRevealRef} className="flex justify-center gap-4 mt-12 flex-wrap opacity-0 translate-y-10 transition-all duration-700">
            {[
              { label: 'Review on Google', href: 'https://www.google.com/maps/place/The+Sea+Star/@37.7607427,-122.3882716,17z/' },
              { label: 'Review on Yelp', href: 'https://www.yelp.com/biz/the-sea-star-san-francisco' },
              { label: 'Review on TripAdvisor', href: 'https://www.tripadvisor.com/Restaurant_Review-g60713-d15106299-Reviews-The_Sea_Star-San_Francisco_California.html' },
            ].map((link) => (
              <a key={link.label} href={link.href} target="_blank" rel="noopener" className="text-[0.55rem] tracking-[0.2em] uppercase text-sea-blue px-5 py-2.5 border border-sea-border hover:border-sea-gold hover:text-sea-gold transition-all no-underline">
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* EVENTS */}
      <section id="events" className="py-32 bg-[#0a0e18]/85 border-t border-sea-gold/10">
        <div className="max-w-[1200px] mx-auto px-6 md:px-12">
          <div ref={addRevealRef} className="opacity-0 translate-y-10 transition-all duration-700 mb-12">
            <p className="font-dm text-[0.55rem] font-medium tracking-[0.5em] uppercase text-sea-gold mb-6">Happenings</p>
            <h2 className="font-cormorant text-[clamp(2.2rem,5vw,3.8rem)] font-light leading-tight text-sea-white">What&apos;s <em className="text-sea-gold">On</em></h2>
          </div>
          <div ref={addRevealRef} className="grid md:grid-cols-2 gap-6 opacity-0 translate-y-10 transition-all duration-700">
            <div className="p-8 border border-sea-gold/10 hover:border-sea-gold-dim hover:-translate-y-1 transition-all duration-300">
              <div className="text-[0.5rem] tracking-[0.35em] uppercase text-sea-teal mb-4">Weekly</div>
              <h3 className="font-cormorant text-2xl font-light text-sea-white mb-3">Live Music Tuesdays</h3>
              <p className="text-[0.9rem] text-sea-blue leading-relaxed mb-6 font-dm">Acoustic sets from Dave Ricketts, Jimmy Touzel &amp; Marty Eggers. Laid back, free, and the perfect excuse for a Tuesday cocktail.</p>
              <div className="text-[0.75rem] text-sea-gold tracking-wide">Every Tuesday &bull; 7:00 &ndash; 10:00 PM &bull; Free</div>
            </div>
            <div className="p-8 border border-sea-gold/10 hover:border-sea-gold-dim hover:-translate-y-1 transition-all duration-300">
              <div className="text-[0.5rem] tracking-[0.35em] uppercase text-sea-teal mb-4">Private Events</div>
              <h3 className="font-cormorant text-2xl font-light text-sea-white mb-3">Book The Sea Star</h3>
              <p className="text-[0.9rem] text-sea-blue leading-relaxed mb-6 font-dm">Host up to 80 guests standing or 40 seated. Full bar, PA system, and more character than any hotel ballroom.</p>
              <div className="text-[0.75rem] text-sea-gold tracking-wide">
                From $400/hr weekdays &bull; $700/hr weekends &bull;{' '}
                <a href="https://app.perfectvenue.com/venues/sea-star/hello" target="_blank" rel="noopener" className="text-sea-gold no-underline border-b border-sea-gold/30 hover:border-sea-gold">Book Now</a>
              </div>
            </div>
            <div className="p-8 border border-sea-gold/10 hover:border-sea-gold-dim hover:-translate-y-1 transition-all duration-300">
              <div className="text-[0.5rem] tracking-[0.35em] uppercase text-sea-teal mb-4">Offsite</div>
              <h3 className="font-cormorant text-2xl font-light text-sea-white mb-3">Mobile Cocktail Catering</h3>
              <p className="text-[0.9rem] text-sea-blue leading-relaxed mb-6 font-dm">Bring The Sea Star to you. Full setup, service, and cleanup for weddings, corporate events, and private parties across the Bay Area.</p>
              <a href="mailto:offsiteboozeness@theseastarsf.com" className="text-[0.75rem] text-sea-gold no-underline border-b border-sea-gold/30 hover:border-sea-gold">offsiteboozeness@theseastarsf.com</a>
            </div>
            <div className="p-8 border border-sea-gold/10 hover:border-sea-gold-dim hover:-translate-y-1 transition-all duration-300">
              <div className="text-[0.5rem] tracking-[0.35em] uppercase text-sea-teal mb-4">Community</div>
              <h3 className="font-cormorant text-2xl font-light text-sea-white mb-3">Giving Back</h3>
              <p className="text-[0.9rem] text-sea-blue leading-relaxed mb-6 font-dm">Order the F*CK THE PATRIARCHY boilermaker and $1 goes to Planned Parenthood. We also support local schools&apos; sports teams and neighborhood causes.</p>
              <div className="text-[0.75rem] text-sea-gold tracking-wide">Every drink counts</div>
            </div>
          </div>
        </div>
      </section>

      {/* JOURNAL */}
      <section id="journal" className="py-32 bg-[#06080d]/80 border-t border-sea-gold/10">
        <div className="max-w-[1200px] mx-auto px-6 md:px-12">
          <div ref={addRevealRef} className="text-center mb-12 opacity-0 translate-y-10 transition-all duration-700">
            <p className="font-dm text-[0.55rem] font-medium tracking-[0.5em] uppercase text-sea-gold mb-6">From the Bar</p>
            <h2 className="font-cormorant text-[clamp(2.2rem,5vw,3.8rem)] font-light leading-tight text-sea-white">The <em className="text-sea-gold">Journal</em></h2>
          </div>
          <div ref={addRevealRef} className="grid md:grid-cols-3 gap-6 opacity-0 translate-y-10 transition-all duration-700">
            {(blogDisplayPosts || BLOG_CONTENT.map((b, i) => ({ ...b, slug: '', excerpt: b.content.slice(0, 120).replace(/<[^>]*>/g, ''), featured_image: blogImages[i], published_at: '', id: String(i), created_at: '' }))).map((post, i) => (
              <div
                key={post.id || i}
                className="border border-sea-gold/5 overflow-hidden hover:border-sea-gold/15 hover:-translate-y-1 transition-all cursor-pointer"
                onClick={() => {
                  if (blogDisplayPosts && post.slug) {
                    window.location.href = `/blog/${post.slug}`
                  } else {
                    setActiveBlogIndex(i)
                    setBlogModalOpen(true)
                  }
                }}
              >
                <div className="aspect-video relative overflow-hidden bg-gradient-to-br from-[#0c2d3a] to-[#0f1523]">
                  <div className="absolute inset-0 bg-cover bg-center opacity-40" style={{ backgroundImage: `url('${post.featured_image || blogImages[i]}')` }} />
                  <div className="absolute bottom-3 left-4 font-playfair text-5xl font-extrabold text-sea-gold/15">{String(i + 1).padStart(2, '0')}</div>
                </div>
                <div className="p-6">
                  <div className="text-[0.55rem] tracking-[0.25em] uppercase text-sea-gold mb-3">
                    {blogDisplayPosts ? new Date(post.published_at || post.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : (post as typeof BLOG_CONTENT[number] & { slug: string; featured_image: string; published_at: string; id: string; created_at: string }).date}
                  </div>
                  <h3 className="font-cormorant text-xl font-normal text-sea-white leading-tight mb-3">{post.title}</h3>
                  <p className="text-[0.85rem] text-sea-blue leading-relaxed font-dm line-clamp-2">{post.excerpt}</p>
                  <span className="inline-block mt-4 text-[0.55rem] tracking-[0.25em] uppercase text-sea-gold">Read More &rarr;</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Blog modal for fallback static content */}
      {blogModalOpen && (
        <div className="fixed inset-0 bg-[#06080d]/95 backdrop-blur-xl z-[200] overflow-y-auto p-8 md:p-16">
          <button className="fixed top-8 right-8 bg-transparent border border-sea-border text-sea-gold text-xl w-10 h-10 flex items-center justify-center cursor-pointer hover:border-sea-gold transition-all z-[201]" onClick={() => setBlogModalOpen(false)}>&times;</button>
          <div className="max-w-[700px] mx-auto" style={{ animation: 'fadeUp 0.5s ease-out' }}>
            <div className="text-[0.55rem] tracking-[0.25em] uppercase text-sea-gold mb-4">{BLOG_CONTENT[activeBlogIndex].date}</div>
            <h2 className="font-cormorant text-[clamp(2rem,4vw,2.8rem)] font-light text-sea-white leading-tight mb-8">{BLOG_CONTENT[activeBlogIndex].title}</h2>
            <div className="space-y-6 text-base text-sea-blue leading-relaxed font-dm" dangerouslySetInnerHTML={{ __html: BLOG_CONTENT[activeBlogIndex].content }} />
          </div>
        </div>
      )}

      {/* CTA BAND */}
      <div className="bg-[#0a0e18]/85 py-24 text-center relative border-y border-sea-gold/10">
        <div className="max-w-[1200px] mx-auto px-6 md:px-12" ref={addRevealRef}>
          <p className="font-cormorant text-[clamp(2rem,4vw,3.2rem)] font-light text-sea-white mb-4">Bring the <em className="text-sea-gold">Sea Star</em> to your next event</p>
          <p className="text-[0.95rem] text-sea-blue mb-10 font-dm">Mobile cocktail catering across the Bay Area. Full setup, service, and cleanup.</p>
          <a href="mailto:offsiteboozeness@theseastarsf.com" className="font-dm text-[0.6rem] font-medium tracking-[0.3em] uppercase px-10 py-4 bg-sea-gold text-[#06080d] hover:bg-sea-gold-light hover:-translate-y-0.5 transition-all no-underline inline-block">
            Get a Quote
          </a>
        </div>
      </div>

      {/* JOIN THE CREW */}
      <div className="bg-[#06080d]/80 py-24 text-center border-b border-sea-gold/10">
        <div className="max-w-[500px] mx-auto px-6" ref={addRevealRef}>
          <p className="font-dm text-[0.55rem] font-medium tracking-[0.5em] uppercase text-sea-gold mb-6">Stay Connected</p>
          <h2 className="font-cormorant text-3xl font-light text-sea-white mb-3">Join the Crew</h2>
          <p className="text-sm text-sea-blue mb-8 font-dm">New drinks, events, and stories from behind the bar. No spam, ever.</p>
          <form onSubmit={handleSubscribe} className="flex flex-col gap-3">
            <input type="text" placeholder="Your name" value={subscribeName} onChange={(e) => setSubscribeName(e.target.value)} className="w-full px-4 py-3 bg-[rgba(26,34,54,0.5)] border border-sea-gold/15 text-sea-light font-dm text-sm outline-none focus:border-sea-gold transition-colors placeholder:text-sea-border" />
            <input type="email" placeholder="Your email" value={subscribeEmail} onChange={(e) => setSubscribeEmail(e.target.value)} required className="w-full px-4 py-3 bg-[rgba(26,34,54,0.5)] border border-sea-gold/15 text-sea-light font-dm text-sm outline-none focus:border-sea-gold transition-colors placeholder:text-sea-border" />
            <button type="submit" className="w-full py-3 bg-sea-gold text-[#06080d] font-dm text-[0.6rem] font-medium tracking-[0.3em] uppercase border-none cursor-pointer hover:bg-sea-gold-light transition-all">
              Subscribe
            </button>
          </form>
        </div>
      </div>

      {/* VISIT */}
      <section id="visit" className="py-32 bg-[#06080d]/80">
        <div className="max-w-[1200px] mx-auto px-6 md:px-12">
          <div ref={addRevealRef} className="text-center mb-12 opacity-0 translate-y-10 transition-all duration-700">
            <p className="font-dm text-[0.55rem] font-medium tracking-[0.5em] uppercase text-sea-gold mb-6">Find Us</p>
            <h2 className="font-cormorant text-[clamp(2.2rem,5vw,3.8rem)] font-light leading-tight text-sea-white">Plan Your <em className="text-sea-gold">Visit</em></h2>
          </div>
          <div ref={addRevealRef} className="grid md:grid-cols-3 gap-[1px] bg-sea-gold/5 border border-sea-gold/5 opacity-0 translate-y-10 transition-all duration-700">
            <div className="bg-[#06080d] p-8">
              <h3 className="font-cormorant text-2xl font-light text-sea-gold mb-6">Hours</h3>
              <table className="w-full">
                <tbody>
                  {[
                    ['Monday', '4 PM \u2013 1 AM'],
                    ['Tuesday', '4 PM \u2013 1 AM'],
                    ['Wednesday', '4 PM \u2013 1 AM'],
                    ['Thursday', '4 PM \u2013 1 AM'],
                    ['Friday', '4 PM \u2013 2 AM'],
                    ['Saturday', '2 PM \u2013 2 AM'],
                    ['Sunday', '2 PM \u2013 1 AM'],
                  ].map(([day, time]) => (
                    <tr key={day} className="border-b border-white/[0.03]">
                      <td className={`py-1.5 text-sm ${day === today ? 'text-sea-gold' : 'text-sea-light'}`}>{day}</td>
                      <td className={`py-1.5 text-sm text-right ${day === today ? 'text-sea-gold' : 'text-sea-blue'}`}>{time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="bg-[#06080d] p-8">
              <h3 className="font-cormorant text-2xl font-light text-sea-gold mb-6">Location</h3>
              <address className="not-italic text-[0.95rem] text-sea-light leading-relaxed">
                2289 3rd Street<br />San Francisco, CA 94107<br />Dogpatch Neighborhood<br /><br />
                <a href="tel:+14155525330" className="text-sea-gold no-underline hover:text-sea-gold-light transition-colors">(415) 552-5330</a><br />
                <a href="mailto:info@theseastarsf.com" className="text-sea-gold no-underline hover:text-sea-gold-light transition-colors">info@theseastarsf.com</a>
              </address>
              <a href="https://www.google.com/maps/dir//The+Sea+Star,+2289+3rd+St,+San+Francisco,+CA+94107" target="_blank" rel="noopener" className="inline-block mt-6 text-[0.55rem] tracking-[0.2em] uppercase px-5 py-2.5 bg-transparent text-sea-light border border-sea-border hover:border-sea-gold hover:text-sea-gold transition-all no-underline">
                Get Directions
              </a>
            </div>
            <div className="bg-[#06080d] p-8">
              <h3 className="font-cormorant text-2xl font-light text-sea-gold mb-6">Good to Know</h3>
              <div className="mb-3"><strong className="text-sea-light font-normal block text-[0.9rem] mb-0.5">Dog Friendly</strong><p className="text-[0.85rem] text-sea-blue leading-relaxed font-dm">Bring your pup. Always welcome.</p></div>
              <div className="mb-3"><strong className="text-sea-light font-normal block text-[0.9rem] mb-0.5">BYO Food</strong><p className="text-[0.85rem] text-sea-blue leading-relaxed font-dm">No kitchen. Grab slices from Long Bridge Pizza next door or bring your own.</p></div>
              <div className="mb-3"><strong className="text-sea-light font-normal block text-[0.9rem] mb-0.5">Getting Here</strong><p className="text-[0.85rem] text-sea-blue leading-relaxed font-dm">T-Line Muni at 20th &amp; 3rd. 22nd St Caltrain 0.3 mi.</p></div>
              <div><strong className="text-sea-light font-normal block text-[0.9rem] mb-0.5">Accessibility</strong><p className="text-[0.85rem] text-sea-blue leading-relaxed font-dm">Wheelchair accessible. Free Wi-Fi. Contactless payments.</p></div>
            </div>
          </div>
        </div>
      </section>

      {/* MAP */}
      <div className="w-full h-[350px] border-y border-sea-gold/5" style={{ filter: 'grayscale(0.7) brightness(0.7) contrast(1.1)' }}>
        <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3154.2!2d-122.3905!3d37.7607!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x808f7fc36f455555%3A0x2c4e67fb66c5847d!2sThe%20Sea%20Star!5e0!3m2!1sen!2sus!4v1709000000000" loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="The Sea Star on Google Maps" className="w-full h-full border-none block" />
      </div>

      {/* FOOTER */}
      <footer className="bg-[#06080d]/90 py-16 border-t border-sea-gold/5">
        <div className="max-w-[1200px] mx-auto px-6 md:px-12">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="font-playfair text-3xl font-bold text-sea-gold mb-3">The Sea Star</div>
              <div className="font-cormorant italic text-base text-sea-blue mb-6">Booze Your Own Adventure</div>
              <div className="flex gap-3">
                <a href="https://www.instagram.com/seastarbarsf/" target="_blank" rel="noopener" className="w-9 h-9 flex items-center justify-center border border-sea-border text-sea-blue rounded-full hover:border-sea-gold hover:text-sea-gold hover:-translate-y-0.5 transition-all no-underline">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="5"/><circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none"/></svg>
                </a>
                <a href="https://www.facebook.com/TheSeaStarSF" target="_blank" rel="noopener" className="w-9 h-9 flex items-center justify-center border border-sea-border text-sea-blue rounded-full hover:border-sea-gold hover:text-sea-gold hover:-translate-y-0.5 transition-all no-underline">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3V2z"/></svg>
                </a>
                <a href="https://www.yelp.com/biz/the-sea-star-san-francisco" target="_blank" rel="noopener" className="w-9 h-9 flex items-center justify-center border border-sea-border text-sea-blue rounded-full hover:border-sea-gold hover:text-sea-gold hover:-translate-y-0.5 transition-all no-underline">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12.14 2C10.75 2 9.26 5.2 9.26 5.2L5.5 12.28c-.3.56.16 1.3.8 1.3h3.87s.18 0 .26.1c.08.1.06.24.06.24l-.9 4.2c-.1.46.26.88.7.88.22 0 .42-.1.56-.28l5.72-7.46c.34-.44.1-1.06-.44-1.2l-3.08-.8s-.16-.04-.22-.14c-.06-.1 0-.22 0-.22L14.56 3.2c.16-.52-.16-1.04-.66-1.16-.12-.02-.24-.04-.36-.04h-1.4z"/></svg>
                </a>
                <a href="https://untappd.com/v/the-sea-star/1567898" target="_blank" rel="noopener" className="w-9 h-9 flex items-center justify-center border border-sea-border text-sea-blue rounded-full hover:border-sea-gold hover:text-sea-gold hover:-translate-y-0.5 transition-all no-underline">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4C10.34 4 9 5.34 9 7c0 .86.37 1.63.95 2.18L7.4 14.6a3 3 0 1 0 1.73 1l2.55-5.42c.1.01.21.02.32.02s.22-.01.32-.02l2.55 5.42a3 3 0 1 0 1.73-1l-2.55-5.42C14.63 8.63 15 7.86 15 7c0-1.66-1.34-3-3-3zm0 2a1 1 0 1 1 0 2 1 1 0 0 1 0-2zM6 17a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm12 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/></svg>
                </a>
              </div>
            </div>
            <div>
              <div className="text-[0.55rem] font-medium tracking-[0.35em] uppercase text-sea-gold mb-5">Navigate</div>
              {[['Our Story', 'story'], ['Alicia Walton', 'alicia'], ['Cocktails', 'menu'], ['Reviews', 'reviews'], ['Events', 'events'], ['Journal', 'journal']].map(([label, href]) => (
                <a key={label} href={`#${href}`} className="block text-[0.85rem] text-sea-blue leading-8 hover:text-sea-gold transition-colors no-underline">{label}</a>
              ))}
            </div>
            <div>
              <div className="text-[0.55rem] font-medium tracking-[0.35em] uppercase text-sea-gold mb-5">Connect</div>
              <a href="tel:+14155525330" className="block text-[0.85rem] text-sea-blue leading-8 hover:text-sea-gold transition-colors no-underline">(415) 552-5330</a>
              <a href="mailto:info@theseastarsf.com" className="block text-[0.85rem] text-sea-blue leading-8 hover:text-sea-gold transition-colors no-underline">info@theseastarsf.com</a>
              <a href="https://app.perfectvenue.com/venues/sea-star/hello" target="_blank" rel="noopener" className="block text-[0.85rem] text-sea-blue leading-8 hover:text-sea-gold transition-colors no-underline">Book an Event</a>
              <a href="mailto:offsiteboozeness@theseastarsf.com" className="block text-[0.85rem] text-sea-blue leading-8 hover:text-sea-gold transition-colors no-underline">Catering Inquiries</a>
            </div>
            <div>
              <div className="text-[0.55rem] font-medium tracking-[0.35em] uppercase text-sea-gold mb-5">Discover</div>
              <a href="https://www.google.com/maps/place/The+Sea+Star/" target="_blank" rel="noopener" className="block text-[0.85rem] text-sea-blue leading-8 hover:text-sea-gold transition-colors no-underline">Google Maps</a>
              <a href="https://www.tripadvisor.com/Restaurant_Review-g60713-d15106299-Reviews-The_Sea_Star-San_Francisco_California.html" target="_blank" rel="noopener" className="block text-[0.85rem] text-sea-blue leading-8 hover:text-sea-gold transition-colors no-underline">TripAdvisor</a>
              <a href="https://foursquare.com/v/sea-star/53583898498e7059d4ce6206" target="_blank" rel="noopener" className="block text-[0.85rem] text-sea-blue leading-8 hover:text-sea-gold transition-colors no-underline">Foursquare</a>
            </div>
          </div>
          <div className="border-t border-white/[0.03] pt-8 flex flex-col md:flex-row justify-between items-center text-[0.65rem] text-sea-border gap-2">
            <span>&copy; 2026 The Sea Star SF. All rights reserved.</span>
            <span>2289 3rd Street, San Francisco, CA 94107</span>
          </div>
        </div>
      </footer>
    </>
  )
}
