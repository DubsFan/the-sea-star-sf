'use client'

import { useEffect, useState } from 'react'
import { getSkyData, type SkyData } from '../../lib/sky-phases'
import SkyGradient from './SkyGradient'
import CelestialBody from './CelestialBody'
import WaterReflection from './WaterReflection'
import Stars from './Stars'

export default function LivingBackground() {
  const [mounted, setMounted] = useState(false)
  const [skyData, setSkyData] = useState<SkyData | null>(null)
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
      <WaterReflection
        reflectionColor={skyData.reflectionColor}
        skyBottom={skyData.skyBottom}
      />
      <Stars
        opacity={skyData.starsOpacity}
        isMobile={isMobile}
      />
    </div>
  )
}
