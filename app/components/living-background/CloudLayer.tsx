'use client'

import { useMemo } from 'react'
import type { SkyPhase } from '../../lib/sky-phases'

interface CloudLayerProps {
  cloudCoverage: number // 0-100
  skyPhase: SkyPhase
  isMobile: boolean
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297
  return x - Math.floor(x)
}

function getCloudColor(skyPhase: SkyPhase): string {
  switch (skyPhase) {
    case 'sunrise':
    case 'goldenMorning':
      return 'rgba(255, 200, 160, 0.12)'
    case 'goldenEvening':
    case 'sunset':
      return 'rgba(220, 140, 80, 0.15)'
    case 'dusk':
    case 'nauticalDusk':
    case 'astronomicalDusk':
      return 'rgba(80, 60, 100, 0.12)'
    case 'night':
    case 'astronomicalDawn':
      return 'rgba(30, 35, 50, 0.15)'
    case 'nauticalDawn':
    case 'dawn':
      return 'rgba(100, 120, 160, 0.10)'
    default: // day
      return 'rgba(255, 255, 255, 0.10)'
  }
}

export default function CloudLayer({ cloudCoverage, skyPhase, isMobile }: CloudLayerProps) {
  const clouds = useMemo(() => {
    // Determine cloud count from coverage
    let count: number
    if (cloudCoverage < 20) count = 0
    else if (cloudCoverage < 40) count = isMobile ? 1 : 2
    else if (cloudCoverage < 60) count = isMobile ? 2 : 3
    else if (cloudCoverage < 80) count = isMobile ? 2 : 5
    else count = isMobile ? 3 : 7

    const color = getCloudColor(skyPhase)
    const result = []

    for (let i = 0; i < count; i++) {
      const width = 200 + seededRandom(i * 7 + 1) * 300
      const height = 60 + seededRandom(i * 11 + 3) * 80
      const top = 5 + seededRandom(i * 13 + 5) * 35 // Top 40% of viewport
      const duration = 120 + seededRandom(i * 17 + 7) * 180 // 120-300s
      const delay = seededRandom(i * 19 + 11) * -duration // Start at random point in animation
      const blur = 30 + seededRandom(i * 23 + 13) * 30
      const opacity = cloudCoverage > 80 ? 0.25 : cloudCoverage > 50 ? 0.18 : 0.12

      result.push({
        id: i,
        width,
        height,
        top,
        duration,
        delay,
        blur,
        opacity,
        color,
      })
    }
    return result
  }, [cloudCoverage, skyPhase, isMobile])

  if (clouds.length === 0) return null

  return (
    <div className="absolute inset-0 z-[2] overflow-hidden">
      {clouds.map((cloud) => (
        <div
          key={cloud.id}
          className="absolute rounded-full"
          style={{
            width: `${cloud.width}px`,
            height: `${cloud.height}px`,
            top: `${cloud.top}%`,
            background: `radial-gradient(ellipse at center, ${cloud.color} 0%, transparent 70%)`,
            filter: `blur(${cloud.blur}px)`,
            opacity: cloud.opacity,
            animation: `cloud-drift ${cloud.duration}s linear ${cloud.delay}s infinite`,
          }}
        />
      ))}
    </div>
  )
}
