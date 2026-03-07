'use client'

import { useEffect, useState } from 'react'
import type { WeatherData } from '../api/weather/route'
import { getSunTimes, getMoonIllumination } from '../lib/sky-phases'

function toKnots(mph: number): number {
  return Math.round(mph * 0.868976)
}

function toNauticalMiles(meters: number): string {
  const nm = meters / 1852
  return nm >= 10 ? Math.round(nm).toString() : nm.toFixed(1)
}

function toInHg(hPa: number): string {
  return (hPa * 0.02953).toFixed(2)
}

function compassDirection(deg: number): string {
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
  return dirs[Math.round(deg / 22.5) % 16]
}

function moonPhaseName(phase: number): string {
  if (phase < 0.03 || phase > 0.97) return 'New'
  if (phase < 0.22) return 'Waxing'
  if (phase < 0.28) return 'First Qtr'
  if (phase < 0.47) return 'Wax Gibb'
  if (phase < 0.53) return 'Full'
  if (phase < 0.72) return 'Wan Gibb'
  if (phase < 0.78) return 'Last Qtr'
  return 'Waning'
}

function formatTimeDate(d: Date): string {
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

function getHarborMood(condition: string, wind: number): string {
  if (condition === 'storm') return 'Electric'
  if (condition === 'fog') return 'Moody'
  if (wind > 16) return 'Windy'
  if (condition === 'rain' || condition === 'drizzle') return 'Restless'
  if (condition === 'clouds') return 'Soft'
  return 'Open'
}

function WeatherIcon({ condition, size = 20 }: { condition: string; size?: number }) {
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

function SunsetIcon({ size = 20 }: { size?: number }) {
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

function WindIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="flex-shrink-0 opacity-85">
      <path d="M3 8h12a3 3 0 10-3-3" stroke="#8a9bb8" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M3 16h16a3 3 0 11-3 3" stroke="#8a9bb8" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M3 12h8a2 2 0 10-2-2" stroke="#8a9bb8" strokeWidth="1.3" strokeLinecap="round" opacity="0.5" />
    </svg>
  )
}

function BarometerIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="flex-shrink-0 opacity-85">
      <circle cx="12" cy="12" r="9" stroke="#8a9bb8" strokeWidth="1.3" />
      <path d="M12 12l-4-6" stroke="#c9a54e" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="12" cy="12" r="1.5" fill="#c9a54e" />
    </svg>
  )
}

function HumidityIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="flex-shrink-0 opacity-85">
      <path d="M12 2C12 2 5 10 5 15a7 7 0 0014 0c0-5-7-13-7-13z" stroke="#5cb8c4" strokeWidth="1.3" />
    </svg>
  )
}

function MoonIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="flex-shrink-0 opacity-85">
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" stroke="#8a9bb8" strokeWidth="1.3" />
    </svg>
  )
}

function VisibilityIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="flex-shrink-0 opacity-85">
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" stroke="#8a9bb8" strokeWidth="1.3" />
      <circle cx="12" cy="12" r="3" stroke="#8a9bb8" strokeWidth="1.3" />
    </svg>
  )
}

export default function WeatherBar() {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [open, setOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [sunTimes, setSunTimes] = useState<{ sunrise: Date; sunset: Date } | null>(null)
  const [moonData, setMoonData] = useState<{ phase: number; fraction: number } | null>(null)

  useEffect(() => {
    fetch('/api/weather')
      .then(r => r.ok ? r.json() : null)
      .then(d => d && setWeather(d))
      .catch(() => {})

    const now = new Date()
    const times = getSunTimes(now)
    setSunTimes({ sunrise: times.sunrise, sunset: times.sunset })
    setMoonData(getMoonIllumination(now))

    const handleResize = () => setIsMobile(window.innerWidth < 768)
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  if (!weather) return null

  const statItems: Array<{ icon: React.ReactNode; label: string; value: React.ReactNode; sub?: string }> = isMobile
    ? [
        {
          icon: <WeatherIcon condition={weather.condition} size={20} />,
          label: 'Temp',
          value: <>{weather.temp}<U>&deg;F</U></>,
        },
        {
          icon: <WeatherIcon condition={weather.condition} size={20} />,
          label: 'Sky',
          value: <span className="text-[0.9rem]">{weather.description.split(' ').map(w => w[0].toUpperCase() + w.slice(1)).join(' ')}</span>,
        },
        {
          icon: <SunsetIcon size={20} />,
          label: 'Sunset',
          value: sunTimes ? <>{formatTimeDate(sunTimes.sunset)}</> : <>—</>,
        },
        {
          icon: <MoonIcon size={20} />,
          label: 'Mood',
          value: <span className="text-[0.9rem]">{getHarborMood(weather.condition, weather.wind)}</span>,
        },
      ]
    : [
        {
          icon: <WeatherIcon condition={weather.condition} size={20} />,
          label: 'Temp',
          value: <>{weather.temp}<U>&deg;F</U></>,
        },
        {
          icon: <WeatherIcon condition={weather.condition} size={20} />,
          label: 'Sky',
          value: <span className="text-[0.9rem]">{weather.description.split(' ').map(w => w[0].toUpperCase() + w.slice(1)).join(' ')}</span>,
        },
        {
          icon: <WindIcon size={20} />,
          label: 'Wind',
          value: <>{toKnots(weather.wind)} <U>kts</U></>,
          sub: compassDirection(weather.windDeg),
        },
        {
          icon: <VisibilityIcon size={20} />,
          label: 'Visibility',
          value: <>{toNauticalMiles(weather.visibility)} <U>nm</U></>,
        },
        {
          icon: <BarometerIcon size={20} />,
          label: 'Pressure',
          value: <>{toInHg(weather.pressure)} <U>inHg</U></>,
        },
        {
          icon: <HumidityIcon size={20} />,
          label: 'Humidity',
          value: <>{weather.humidity}<U>%</U></>,
        },
        {
          icon: <SunsetIcon size={20} />,
          label: 'Sunset',
          value: sunTimes ? <>{formatTimeDate(sunTimes.sunset)}</> : <>—</>,
        },
        {
          icon: <MoonIcon size={20} />,
          label: 'Moon',
          value: <span className="text-[0.8rem]">{moonData ? moonPhaseName(moonData.phase) : '—'}</span>,
          sub: moonData ? `${Math.round(moonData.fraction * 100)}%` : undefined,
        },
      ]

  return (
    <>
      {/* Toggle button — sits in nav, rendered via portal-like absolute positioning */}
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 border px-3.5 py-1.5 transition-all cursor-pointer bg-transparent ${
          open
            ? 'border-sea-gold bg-sea-gold/5'
            : 'border-sea-gold/30 hover:border-sea-gold/60'
        }`}
      >
        <span className="font-cormorant text-[1rem] font-medium text-[#e8dcc4]">
          {weather.temp}°
        </span>
        <span className="hidden md:inline font-dm text-[0.5rem] tracking-[0.18em] uppercase text-sea-gold/60">
          Weather
        </span>
        <span
          className="text-[0.4rem] text-sea-gold/40 transition-transform duration-300"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0)' }}
        >
          &#9660;
        </span>
      </button>

      {/* Weather bar dropdown */}
      <div
        className="fixed left-0 right-0 z-[98] overflow-hidden transition-all duration-400 ease-[cubic-bezier(0.4,0,0.2,1)]"
        style={{
          top: '56px',
          maxHeight: open ? (isMobile ? '168px' : '120px') : '0',
          opacity: open ? 1 : 0,
        }}
      >
        <div
          className="relative border-b border-[rgba(120,80,30,0.15)]"
          style={{
            background: 'repeating-linear-gradient(88deg, transparent, transparent 3px, rgba(90,55,20,0.015) 3px, rgba(90,55,20,0.015) 4px), linear-gradient(180deg, #0f0c08, #110e0a)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          }}
        >
          {/* Subtle brass trim */}
          <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-sea-gold/30 to-transparent" />

          <div className="flex items-center justify-center gap-0 py-2.5 px-4 md:px-6 max-w-[1100px] mx-auto flex-wrap">
            {statItems.map((item) => (
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
    </>
  )
}

function U({ children }: { children: React.ReactNode }) {
  return <span className="text-[0.6rem] text-sea-gold/35 font-normal">{children}</span>
}

function Stat({ icon, label, value, sub }: {
  icon: React.ReactNode
  label: string
  value: React.ReactNode
  sub?: string
}) {
  return (
    <div className="flex items-center gap-2 px-3 md:px-4 relative">
      {/* Brass dot separator — hidden on first child via CSS */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[3px] rounded-full bg-gradient-to-br from-[#dfc06e] to-[#8f6a20] opacity-40 first:hidden" />
      {icon}
      <div className="flex flex-col">
        <span className="font-dm text-[0.4rem] tracking-[0.15em] uppercase text-sea-gold/40 leading-none">{label}</span>
        <span className="font-cormorant text-[1.1rem] font-medium text-[#e8dcc4] leading-tight whitespace-nowrap">{value}</span>
        {sub && <span className="font-dm text-[0.42rem] text-sea-blue/50 leading-none">{sub}</span>}
      </div>
    </div>
  )
}
