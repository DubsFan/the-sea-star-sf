'use client'

import { useEffect, useState } from 'react'
import type { WeatherData } from '../api/weather/route'
import { getSunTimes, getMoonIllumination } from '../lib/sky-phases'

interface HarborConditionsProps {
  revealRef: (el: HTMLDivElement | null) => void
}

// Convert mph to knots
function toKnots(mph: number): number {
  return Math.round(mph * 0.868976)
}

// Convert meters to nautical miles
function toNauticalMiles(meters: number): string {
  const nm = meters / 1852
  return nm >= 10 ? Math.round(nm).toString() : nm.toFixed(1)
}

// Convert hPa to inches of mercury
function toInHg(hPa: number): string {
  return (hPa * 0.02953).toFixed(2)
}

// Compass bearing from degrees
function compassDirection(deg: number): string {
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
  return dirs[Math.round(deg / 22.5) % 16]
}

// Moon phase name
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

// Format time from unix timestamp
function formatTime(ts: number): string {
  return new Date(ts * 1000).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

// Format time from Date
function formatTimeDate(d: Date): string {
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

// Condition icon (CSS-only)
function ConditionIcon({ condition, size = 20 }: { condition: string; size?: number }) {
  const s = size
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" className="inline-block">
      {condition === 'clear' && (
        <>
          <circle cx="12" cy="12" r="4" fill="#c9a54e" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map(angle => (
            <line
              key={angle}
              x1={12 + Math.cos(angle * Math.PI / 180) * 6}
              y1={12 + Math.sin(angle * Math.PI / 180) * 6}
              x2={12 + Math.cos(angle * Math.PI / 180) * 8}
              y2={12 + Math.sin(angle * Math.PI / 180) * 8}
              stroke="#c9a54e"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          ))}
        </>
      )}
      {condition === 'clouds' && (
        <path d="M6 18h12a4 4 0 00.5-7.97A6 6 0 006 18z" stroke="#8a9bb8" strokeWidth="1.5" fill="none" />
      )}
      {(condition === 'rain' || condition === 'drizzle') && (
        <>
          <path d="M6 14h12a4 4 0 00.5-7.97A6 6 0 006 14z" stroke="#8a9bb8" strokeWidth="1.5" fill="none" />
          <line x1="9" y1="17" x2="8" y2="20" stroke="#5cb8c4" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="13" y1="17" x2="12" y2="20" stroke="#5cb8c4" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="17" y1="17" x2="16" y2="20" stroke="#5cb8c4" strokeWidth="1.5" strokeLinecap="round" />
        </>
      )}
      {condition === 'fog' && (
        <>
          <line x1="4" y1="8" x2="20" y2="8" stroke="#8a9bb8" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
          <line x1="6" y1="12" x2="18" y2="12" stroke="#8a9bb8" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
          <line x1="4" y1="16" x2="20" y2="16" stroke="#8a9bb8" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
        </>
      )}
      {condition === 'storm' && (
        <>
          <path d="M6 14h12a4 4 0 00.5-7.97A6 6 0 006 14z" stroke="#8a9bb8" strokeWidth="1.5" fill="none" />
          <path d="M13 14l-2 4h4l-2 4" stroke="#c9a54e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
    </svg>
  )
}

// Wind direction arrow
function WindArrow({ deg }: { deg: number }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" className="inline-block ml-1">
      <g transform={`rotate(${deg}, 8, 8)`}>
        <line x1="8" y1="2" x2="8" y2="14" stroke="#c9a54e" strokeWidth="1.5" />
        <path d="M5 5l3-3 3 3" stroke="#c9a54e" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  )
}

export default function HarborConditions({ revealRef }: HarborConditionsProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [sunTimes, setSunTimes] = useState<{ sunrise: Date; sunset: Date } | null>(null)
  const [moonData, setMoonData] = useState<{ phase: number; fraction: number } | null>(null)

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const res = await fetch('/api/weather')
        if (res.ok) setWeather(await res.json())
      } catch { /* graceful fail */ }
    }
    fetchWeather()

    // SunCalc data
    const now = new Date()
    const times = getSunTimes(now)
    setSunTimes({ sunrise: times.sunrise, sunset: times.sunset })
    setMoonData(getMoonIllumination(now))
  }, [])

  if (!weather) return null

  return (
    <section id="harbor" className="py-20 bg-[#0a0e18]/90 border-t border-sea-gold/10">
      <div className="max-w-[900px] mx-auto px-6 md:px-12">
        <div ref={revealRef} className="opacity-0 translate-y-10 transition-all duration-700">
          {/* Section header */}
          <div className="text-center mb-10">
            <p className="font-dm text-[0.55rem] font-medium tracking-[0.5em] uppercase text-sea-gold mb-4">Dogpatch Waterfront</p>
            <h2 className="font-cormorant text-[clamp(2rem,4vw,3.2rem)] font-light leading-tight text-sea-white">
              Harbor <em className="text-sea-gold">Conditions</em>
            </h2>
          </div>

          {/* Maritime plaque card */}
          <div className="relative border border-sea-gold/20 bg-[#080c14]/80 backdrop-blur-sm p-8 md:p-10 overflow-hidden">
            {/* Compass rose watermark */}
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] opacity-[0.03] pointer-events-none"
              style={{
                background: `
                  conic-gradient(from 0deg, #c9a54e 0deg, transparent 2deg, transparent 88deg, #c9a54e 88deg, #c9a54e 92deg, transparent 92deg, transparent 178deg, #c9a54e 178deg, #c9a54e 182deg, transparent 182deg, transparent 268deg, #c9a54e 268deg, #c9a54e 272deg, transparent 272deg, transparent 358deg, #c9a54e 358deg)
                `,
                borderRadius: '50%',
              }}
            />
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] opacity-[0.03] pointer-events-none rotate-45"
              style={{
                background: `
                  conic-gradient(from 0deg, #c9a54e 0deg, transparent 1deg, transparent 89deg, #c9a54e 89deg, #c9a54e 91deg, transparent 91deg, transparent 179deg, #c9a54e 179deg, #c9a54e 181deg, transparent 181deg, transparent 269deg, #c9a54e 269deg, #c9a54e 271deg, transparent 271deg, transparent 359deg, #c9a54e 359deg)
                `,
                borderRadius: '50%',
              }}
            />

            {/* Compact view — always visible */}
            <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
              {/* Temperature */}
              <div className="text-center">
                <p className="font-playfair text-[0.6rem] tracking-[0.3em] uppercase text-sea-gold/70 mb-2">Temperature</p>
                <p className="font-cormorant text-3xl md:text-4xl text-sea-white font-light">{weather.temp}<span className="text-lg text-sea-gold/50">&deg;F</span></p>
              </div>

              {/* Conditions */}
              <div className="text-center">
                <p className="font-playfair text-[0.6rem] tracking-[0.3em] uppercase text-sea-gold/70 mb-2">Conditions</p>
                <div className="flex items-center justify-center gap-2">
                  <ConditionIcon condition={weather.condition} size={24} />
                  <p className="font-dm text-sm text-sea-light capitalize">{weather.description}</p>
                </div>
              </div>

              {/* Wind */}
              <div className="text-center">
                <p className="font-playfair text-[0.6rem] tracking-[0.3em] uppercase text-sea-gold/70 mb-2">Wind</p>
                <p className="font-cormorant text-3xl md:text-4xl text-sea-white font-light">
                  {toKnots(weather.wind)}<span className="text-lg text-sea-gold/50"> kts</span>
                </p>
                <p className="font-dm text-xs text-sea-blue mt-1">
                  {compassDirection(weather.windDeg)}
                  <WindArrow deg={weather.windDeg} />
                </p>
              </div>

              {/* Sunset */}
              <div className="text-center">
                <p className="font-playfair text-[0.6rem] tracking-[0.3em] uppercase text-sea-gold/70 mb-2">Sunset</p>
                <p className="font-cormorant text-3xl md:text-4xl text-sea-white font-light">
                  {sunTimes ? formatTimeDate(sunTimes.sunset) : '—'}
                </p>
              </div>
            </div>

            {/* Toggle */}
            <div className="relative z-10 text-center mt-8">
              <button
                onClick={() => setExpanded(!expanded)}
                className="font-dm text-[0.65rem] tracking-[0.3em] uppercase text-sea-gold/60 hover:text-sea-gold transition-colors bg-transparent border-none cursor-pointer py-2 px-4"
              >
                {expanded ? 'Close Report' : 'Full Harbor Report'}
                <span className="ml-2 inline-block transition-transform duration-300" style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0)' }}>
                  &#9660;
                </span>
              </button>
            </div>

            {/* Expanded view */}
            <div
              className="relative z-10 overflow-hidden transition-all duration-500 ease-in-out"
              style={{ maxHeight: expanded ? '600px' : '0', opacity: expanded ? 1 : 0 }}
            >
              <div className="pt-8 border-t border-sea-gold/10 mt-4">
                {/* 5-hour forecast */}
                {weather.hourlyForecast.length > 0 && (
                  <div className="mb-8">
                    <p className="font-playfair text-[0.55rem] tracking-[0.4em] uppercase text-sea-gold/50 mb-4 text-center">Forecast</p>
                    <div className="flex justify-center gap-4 md:gap-6 overflow-x-auto pb-2">
                      {weather.hourlyForecast.map((hour, i) => (
                        <div key={i} className="text-center min-w-[60px] flex-shrink-0">
                          <p className="font-dm text-[0.65rem] text-sea-blue mb-2">{formatTime(hour.time)}</p>
                          <ConditionIcon condition={hour.condition} size={18} />
                          <p className="font-cormorant text-xl text-sea-white mt-1">{hour.temp}&deg;</p>
                          <p className="font-dm text-[0.55rem] text-sea-gold/40 mt-1">{toKnots(hour.windSpeed)} kts</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Detailed conditions grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  {/* Visibility */}
                  <div className="text-center">
                    <p className="font-playfair text-[0.55rem] tracking-[0.3em] uppercase text-sea-gold/50 mb-1">Visibility</p>
                    <p className="font-cormorant text-2xl text-sea-white font-light">{toNauticalMiles(weather.visibility)} <span className="text-sm text-sea-gold/40">nm</span></p>
                  </div>

                  {/* Barometric Pressure */}
                  <div className="text-center">
                    <p className="font-playfair text-[0.55rem] tracking-[0.3em] uppercase text-sea-gold/50 mb-1">Barometer</p>
                    <p className="font-cormorant text-2xl text-sea-white font-light">{toInHg(weather.pressure)} <span className="text-sm text-sea-gold/40">inHg</span></p>
                  </div>

                  {/* Humidity */}
                  <div className="text-center">
                    <p className="font-playfair text-[0.55rem] tracking-[0.3em] uppercase text-sea-gold/50 mb-1">Humidity</p>
                    <p className="font-cormorant text-2xl text-sea-white font-light">{weather.humidity}<span className="text-sm text-sea-gold/40">%</span></p>
                  </div>

                  {/* Sunrise */}
                  <div className="text-center">
                    <p className="font-playfair text-[0.55rem] tracking-[0.3em] uppercase text-sea-gold/50 mb-1">Sunrise</p>
                    <p className="font-cormorant text-2xl text-sea-white font-light">{sunTimes ? formatTimeDate(sunTimes.sunrise) : '—'}</p>
                  </div>

                  {/* Moon Phase */}
                  <div className="text-center">
                    <p className="font-playfair text-[0.55rem] tracking-[0.3em] uppercase text-sea-gold/50 mb-1">Moon</p>
                    <p className="font-cormorant text-2xl text-sea-white font-light">{moonData ? moonPhaseName(moonData.phase) : '—'}</p>
                    {moonData && (
                      <p className="font-dm text-[0.55rem] text-sea-blue mt-1">{Math.round(moonData.fraction * 100)}% illuminated</p>
                    )}
                  </div>

                  {/* Cloud Cover */}
                  <div className="text-center">
                    <p className="font-playfair text-[0.55rem] tracking-[0.3em] uppercase text-sea-gold/50 mb-1">Cloud Cover</p>
                    <p className="font-cormorant text-2xl text-sea-white font-light">{weather.clouds}<span className="text-sm text-sea-gold/40">%</span></p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
