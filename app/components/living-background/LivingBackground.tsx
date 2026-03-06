'use client'

import { useEffect, useState } from 'react'
import { getSkyData, type SkyData } from '../../lib/sky-phases'
import type { WeatherData } from '../../api/weather/route'
import SkyGradient from './SkyGradient'
import CelestialBody from './CelestialBody'
import CloudLayer from './CloudLayer'
import WeatherEffects from './WeatherEffects'
import WaterReflection from './WaterReflection'
import Wildlife from './Wildlife'
import Stars from './Stars'

const WEATHER_FETCH_INTERVAL = 30 * 60 * 1000 // 30 minutes

export default function LivingBackground() {
  const [mounted, setMounted] = useState(false)
  const [skyData, setSkyData] = useState<SkyData | null>(null)
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  // Initialize on mount (client only)
  useEffect(() => {
    setMounted(true)
    setSkyData(getSkyData(new Date()))
    setIsMobile(window.innerWidth < 768)

    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Update sky every 60 seconds
  useEffect(() => {
    if (!mounted) return
    const interval = setInterval(() => {
      setSkyData(getSkyData(new Date()))
    }, 60000)
    return () => clearInterval(interval)
  }, [mounted])

  // Fetch weather on mount + every 30 minutes
  useEffect(() => {
    if (!mounted) return

    const fetchWeather = async () => {
      try {
        const res = await fetch('/api/weather')
        if (res.ok) {
          const data = await res.json()
          setWeather(data)
        }
      } catch {
        // Silently fail — background degrades gracefully without weather
      }
    }

    fetchWeather()
    const interval = setInterval(fetchWeather, WEATHER_FETCH_INTERVAL)
    return () => clearInterval(interval)
  }, [mounted])

  // Don't render on server
  if (!mounted || !skyData) return null

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      <SkyGradient
        skyTop={skyData.skyTop}
        skyMid={skyData.skyMid}
        skyBottom={skyData.skyBottom}
      />
      <CelestialBody
        sunPosition={skyData.sunPosition}
        moonPosition={skyData.moonPosition}
      />
      {weather && (
        <>
          <CloudLayer
            cloudCoverage={weather.clouds}
            skyPhase={skyData.phase}
            isMobile={isMobile}
          />
          <WeatherEffects
            condition={weather.condition}
            visibility={weather.visibility}
            wind={weather.wind}
            isMobile={isMobile}
          />
        </>
      )}
      <WaterReflection
        reflectionColor={skyData.reflectionColor}
        skyBottom={skyData.skyBottom}
      />
      <Wildlife
        skyPhase={skyData.phase}
        isMobile={isMobile}
      />
      <Stars
        opacity={skyData.starsOpacity}
        isMobile={isMobile}
      />
    </div>
  )
}
