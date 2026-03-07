'use client'

import { useEffect, useState } from 'react'
import { getSkyData, type SkyData } from '../../lib/sky-phases'
import type { WeatherData } from '../../api/weather/route'
import SkyGradient from './SkyGradient'
import CelestialBody from './CelestialBody'
import CloudLayer from './CloudLayer'
import WeatherEffects from './WeatherEffects'
import WaterReflection from './WaterReflection'
import Skyline from './Skyline'
import Wildlife from './Wildlife'
import Starfield from '../Starfield'

const WEATHER_FETCH_INTERVAL = 30 * 60 * 1000 // 30 minutes

interface LivingBackgroundProps {
  overrideDate?: Date | null // For demo slider — when set, sky uses this instead of real time
}

export default function LivingBackground({ overrideDate }: LivingBackgroundProps) {
  const [mounted, setMounted] = useState(false)
  const [skyData, setSkyData] = useState<SkyData | null>(null)
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    setMounted(true)
    setIsMobile(window.innerWidth < 768)
    setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handleMotionChange = () => setReducedMotion(mediaQuery.matches)
    window.addEventListener('resize', handleResize)
    mediaQuery.addEventListener('change', handleMotionChange)
    return () => {
      window.removeEventListener('resize', handleResize)
      mediaQuery.removeEventListener('change', handleMotionChange)
    }
  }, [])

  // Sky from override date or real time
  useEffect(() => {
    if (!mounted) return
    if (overrideDate) {
      setSkyData(getSkyData(overrideDate))
    } else {
      setSkyData(getSkyData(new Date()))
      const interval = setInterval(() => setSkyData(getSkyData(new Date())), 60000)
      return () => clearInterval(interval)
    }
  }, [mounted, overrideDate])

  // Weather
  useEffect(() => {
    if (!mounted) return
    const fetchWeather = async () => {
      try {
        const res = await fetch('/api/weather')
        if (res.ok) setWeather(await res.json())
      } catch { /* graceful fail */ }
    }
    fetchWeather()
    const interval = setInterval(fetchWeather, WEATHER_FETCH_INTERVAL)
    return () => clearInterval(interval)
  }, [mounted])

  if (!mounted || !skyData) return null

  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
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
        skyPhase={skyData.phase}
        sunX={skyData.sunPosition.x}
        sunAltitude={skyData.sunPosition.altitude}
        sunColor={skyData.sunPosition.color}
        moonX={skyData.moonPosition.x}
        moonAltitude={skyData.moonPosition.altitude}
        moonVisible={skyData.moonPosition.visible}
        moonGlowColor={skyData.moonPosition.glowColor}
        windSpeed={weather?.wind}
        cloudCoverage={weather?.clouds}
        quality={isMobile ? 'low' : 'high'}
        reducedMotion={reducedMotion}
      />
      <Skyline
        skyPhase={skyData.phase}
        skyBottom={skyData.skyBottom}
        mode="back"
      />
      <Skyline
        skyPhase={skyData.phase}
        skyBottom={skyData.skyBottom}
        mode="front"
      />
      <Wildlife
        skyPhase={skyData.phase}
        isMobile={isMobile}
      />
      <Starfield opacity={skyData.starsOpacity} />
    </div>
  )
}
