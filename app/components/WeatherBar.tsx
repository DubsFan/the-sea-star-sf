'use client'

import { useEffect, useState } from 'react'
import type { WeatherData } from '../api/weather/route'
import { getSunTimes, getMoonIllumination } from '../lib/sky-phases'

function moonPhaseName(phase: number): string {
  if (phase < 0.03 || phase > 0.97) return 'New Moon'
  if (phase < 0.22) return 'Waxing Crescent'
  if (phase < 0.28) return 'First Quarter'
  if (phase < 0.47) return 'Waxing Gibbous'
  if (phase < 0.53) return 'Full Moon'
  if (phase < 0.72) return 'Waning Gibbous'
  if (phase < 0.78) return 'Last Quarter'
  return 'Waning Crescent'
}

function formatTimeDate(d: Date): string {
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

function toTitleCase(value: string): string {
  return value
    .split(' ')
    .map(word => word[0].toUpperCase() + word.slice(1))
    .join(' ')
}

function WeatherIcon({ condition, size = 18 }: { condition: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="flex-shrink-0 opacity-85">
      {condition === 'clear' && (
        <>
          <circle cx="12" cy="12" r="4" stroke="#c9a54e" strokeWidth="1.3" />
          <line x1="12" y1="3" x2="12" y2="6" stroke="#c9a54e" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="12" y1="18" x2="12" y2="21" stroke="#c9a54e" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="3" y1="12" x2="6" y2="12" stroke="#c9a54e" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="18" y1="12" x2="21" y2="12" stroke="#c9a54e" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="5.6" y1="5.6" x2="7.8" y2="7.8" stroke="#c9a54e" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
          <line x1="16.2" y1="16.2" x2="18.4" y2="18.4" stroke="#c9a54e" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
          <line x1="5.6" y1="18.4" x2="7.8" y2="16.2" stroke="#c9a54e" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
          <line x1="16.2" y1="7.8" x2="18.4" y2="5.6" stroke="#c9a54e" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
        </>
      )}
      {condition === 'clouds' && (
        <path d="M6 19h12a5 5 0 10-1-9.9A7 7 0 106 19z" stroke="#8a9bb8" strokeWidth="1.3" strokeLinejoin="round" />
      )}
      {(condition === 'rain' || condition === 'drizzle') && (
        <>
          <path d="M6 15h12a5 5 0 10-1-9.9A7 7 0 106 15z" stroke="#8a9bb8" strokeWidth="1.3" strokeLinejoin="round" />
          <line x1="9" y1="18" x2="8" y2="21" stroke="#5cb8c4" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="13" y1="18" x2="12" y2="21" stroke="#5cb8c4" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="17" y1="18" x2="16" y2="21" stroke="#5cb8c4" strokeWidth="1.2" strokeLinecap="round" />
        </>
      )}
      {condition === 'fog' && (
        <>
          <line x1="4" y1="8" x2="20" y2="8" stroke="#8a9bb8" strokeWidth="1.3" strokeLinecap="round" opacity="0.6" />
          <line x1="6" y1="12" x2="18" y2="12" stroke="#8a9bb8" strokeWidth="1.3" strokeLinecap="round" opacity="0.8" />
          <line x1="4" y1="16" x2="20" y2="16" stroke="#8a9bb8" strokeWidth="1.3" strokeLinecap="round" opacity="0.5" />
        </>
      )}
      {condition === 'storm' && (
        <>
          <path d="M6 15h12a5 5 0 10-1-9.9A7 7 0 106 15z" stroke="#8a9bb8" strokeWidth="1.3" strokeLinejoin="round" />
          <path d="M13 15l-2 4h4l-2 4" stroke="#c9a54e" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
    </svg>
  )
}

function SunsetIcon({ size = 19 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="flex-shrink-0 opacity-85">
      <path d="M3 17h18" stroke="#c9a54e" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M5.5 14.5a7 7 0 0113 0" stroke="#c9a54e" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="12" y1="3" x2="12" y2="7" stroke="#c9a54e" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="5.6" y1="5.6" x2="8" y2="8" stroke="#c9a54e" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
      <line x1="18.4" y1="5.6" x2="16" y2="8" stroke="#c9a54e" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
    </svg>
  )
}

function MoonIcon({ size = 19 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="flex-shrink-0 opacity-85">
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" stroke="#8a9bb8" strokeWidth="1.3" />
    </svg>
  )
}

export default function WeatherBar() {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [open, setOpen] = useState(false)
  const [sunTimes, setSunTimes] = useState<{ sunrise: Date; sunset: Date } | null>(null)
  const [moonData, setMoonData] = useState<{ phase: number; fraction: number } | null>(null)

  useEffect(() => {
    fetch('/api/weather')
      .then(r => (r.ok ? r.json() : null))
      .then(d => d && setWeather(d))
      .catch(() => {})

    const now = new Date()
    const times = getSunTimes(now)
    setSunTimes({ sunrise: times.sunrise, sunset: times.sunset })
    setMoonData(getMoonIllumination(now))
  }, [])

  if (!weather) return null

  const skyLabel = toTitleCase(weather.description)

  const statItems: Array<{ icon: React.ReactNode; label: string; value: React.ReactNode; sub?: string }> = [
    {
      icon: <SunsetIcon />,
      label: 'Sunset',
      value: sunTimes ? formatTimeDate(sunTimes.sunset) : '—',
    },
    {
      icon: <MoonIcon />,
      label: 'Moon',
      value: moonData ? moonPhaseName(moonData.phase) : '—',
      sub: moonData ? `${Math.round(moonData.fraction * 100)}% illuminated` : undefined,
    },
  ]

  return (
    <div className="relative shrink-0">
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-label={`Weather ${weather.temp} degrees and ${skyLabel}`}
        className={`flex max-w-[calc(100vw-8.5rem)] items-center gap-2 border px-3.5 py-1.5 transition-all no-underline md:max-w-[17rem] ${
          open
            ? 'border-sea-gold bg-[rgba(8,12,18,0.62)] shadow-[0_0_0_1px_rgba(201,165,78,0.10)]'
            : 'border-sea-gold/30 bg-[rgba(8,12,18,0.22)] hover:border-sea-gold/60 hover:bg-[rgba(8,12,18,0.35)]'
        }`}
      >
        <WeatherIcon condition={weather.condition} />
        <span className="font-cormorant text-[1rem] font-medium leading-none text-[#f3ead7]">
          {weather.temp}°
        </span>
        <span className="min-w-0 flex-1 truncate font-dm text-[0.55rem] tracking-[0.16em] text-sea-gold/75 md:text-[0.6rem]">
          {skyLabel}
        </span>
        <span
          className="flex-shrink-0 text-[0.42rem] text-sea-gold/50 transition-transform duration-300"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0)' }}
        >
          &#9660;
        </span>
      </button>

      <div
        className={`pointer-events-none fixed left-4 right-4 top-[4.6rem] z-[98] origin-top transition-all duration-300 ease-out md:absolute md:left-0 md:right-auto md:top-[calc(100%+0.75rem)] md:w-[18.5rem] ${
          open
            ? 'translate-y-0 scale-y-100 opacity-100'
            : '-translate-y-2 scale-y-95 opacity-0'
        }`}
      >
        <div
          className={`overflow-hidden rounded-[1.35rem] border border-sea-gold/20 bg-[rgba(7,10,15,0.86)] shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl transition-all duration-300 md:rounded-[1.1rem] ${
            open ? 'pointer-events-auto' : 'pointer-events-none'
          }`}
        >
          <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-sea-gold/45 to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(201,165,78,0.10),_transparent_48%)]" />

          <div className="relative grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 md:grid-cols-1 md:gap-2.5 md:p-3.5">
            {statItems.map(item => (
              <Stat
                key={item.label}
                icon={item.icon}
                label={item.label}
                value={item.value}
                sub={item.sub}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function Stat({ icon, label, value, sub }: {
  icon: React.ReactNode
  label: string
  value: React.ReactNode
  sub?: string
}) {
  return (
    <div className="flex items-start gap-3 rounded-[1rem] border border-white/5 bg-white/[0.03] px-3.5 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-sea-gold/10 bg-[rgba(255,255,255,0.03)]">
        {icon}
      </div>
      <div className="min-w-0">
        <span className="block font-dm text-[0.45rem] tracking-[0.22em] uppercase text-sea-gold/50">
          {label}
        </span>
        <span className="block font-cormorant text-[1.15rem] font-medium leading-tight text-[#f3ead7]">
          {value}
        </span>
        {sub && (
          <span className="block font-dm text-[0.58rem] tracking-[0.04em] text-sea-blue/70">
            {sub}
          </span>
        )}
      </div>
    </div>
  )
}
