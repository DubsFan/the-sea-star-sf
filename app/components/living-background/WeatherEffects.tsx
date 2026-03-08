'use client'

import { useEffect, useState } from 'react'

interface WeatherEffectsProps {
  condition: string
  visibility: number
  wind: number
  isMobile: boolean
}

export default function WeatherEffects({ condition, visibility, isMobile }: WeatherEffectsProps) {
  const [stormFlash, setStormFlash] = useState(false)

  // Storm lightning flash
  useEffect(() => {
    if (condition !== 'storm') return
    const flash = () => {
      setStormFlash(true)
      setTimeout(() => setStormFlash(false), 200)
    }
    const interval = setInterval(flash, 8000 + Math.random() * 6000)
    return () => clearInterval(interval)
  }, [condition])

  const showFog = condition === 'fog' || visibility < 2000
  const showRain = condition === 'rain' || condition === 'drizzle' || condition === 'storm'

  return (
    <div className="absolute inset-0 z-[3] overflow-hidden pointer-events-none">
      {/* Karl the Fog */}
      {showFog && (
        <>
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(90deg, rgba(180, 190, 200, 0.20) 0%, rgba(160, 170, 185, 0.12) 40%, transparent 80%)',
              filter: 'blur(40px)',
              animation: 'fog-roll 200s linear infinite',
            }}
          />
          {!isMobile && (
            <>
              <div
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(100deg, rgba(190, 200, 210, 0.15) 0%, rgba(170, 180, 195, 0.08) 50%, transparent 85%)',
                  filter: 'blur(50px)',
                  animation: 'fog-roll 280s linear -60s infinite',
                }}
              />
              <div
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(80deg, rgba(170, 180, 195, 0.12) 0%, transparent 60%)',
                  filter: 'blur(60px)',
                  animation: 'fog-roll 340s linear -120s infinite',
                }}
              />
            </>
          )}
        </>
      )}

      {/* Rain */}
      {showRain && (
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `repeating-linear-gradient(
              ${75}deg,
              transparent,
              transparent ${condition === 'storm' ? '96%' : condition === 'rain' ? '97%' : '98.5%'},
              rgba(174, 194, 224, ${condition === 'storm' ? '0.2' : '0.12'}) ${condition === 'storm' ? '96.5%' : condition === 'rain' ? '97.3%' : '98.8%'},
              transparent ${condition === 'storm' ? '97%' : condition === 'rain' ? '97.6%' : '99%'}
            )`,
            backgroundSize: condition === 'storm' ? '40px 100%' : condition === 'rain' ? '60px 100%' : '100px 100%',
            animation: `rain-fall ${condition === 'storm' ? '0.4s' : condition === 'rain' ? '0.6s' : '1s'} linear infinite`,
          }}
        />
      )}

      {/* Storm flash */}
      {stormFlash && (
        <div
          className="absolute inset-0 bg-white/20 transition-opacity duration-200"
        />
      )}
    </div>
  )
}
