'use client'

import { useEffect, useState, useMemo } from 'react'

interface StarsProps {
  opacity: number
  isMobile: boolean
}

// Pseudo-random number generator from seed for stable star positions
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297
  return x - Math.floor(x)
}

interface StarData {
  x: number
  y: number
  size: number
  gold: boolean
  duration: number
  delay: number
  bright: boolean
}

export default function Stars({ opacity, isMobile }: StarsProps) {
  const [shootingStars, setShootingStars] = useState<number[]>([])

  const starCount = isMobile ? 40 : 80

  const stars = useMemo<StarData[]>(() => {
    const result: StarData[] = []
    for (let i = 0; i < starCount; i++) {
      const isGold = seededRandom(i * 7 + 1) > 0.6
      const size = seededRandom(i * 3 + 2) * 2 + 0.5
      result.push({
        x: seededRandom(i * 13 + 5) * 100,
        y: seededRandom(i * 17 + 3) * 85, // Keep stars in top 85%
        size,
        gold: isGold,
        duration: seededRandom(i * 11 + 7) * 4 + 2,
        delay: seededRandom(i * 19 + 11) * 5,
        bright: isGold && size > 1.8,
      })
    }
    return result
  }, [starCount])

  // Spawn shooting stars periodically
  useEffect(() => {
    if (opacity <= 0) return
    const interval = setInterval(() => {
      setShootingStars(prev => {
        const next = [...prev, Date.now()]
        // Keep max 3 active
        return next.slice(-3)
      })
    }, 4000 + Math.random() * 4000)
    return () => clearInterval(interval)
  }, [opacity])

  // Clean up expired shooting stars
  useEffect(() => {
    if (shootingStars.length === 0) return
    const timeout = setTimeout(() => {
      setShootingStars(prev => prev.filter(t => Date.now() - t < 8000))
    }, 8000)
    return () => clearTimeout(timeout)
  }, [shootingStars])

  return (
    <div
      className="absolute inset-0 z-[6]"
      style={{
        opacity,
        transition: 'opacity 300s linear',
      }}
    >
      {/* Twinkling stars */}
      {stars.map((star, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            backgroundColor: star.gold ? '#c9a54e' : '#d8e0ed',
            opacity: star.gold ? 0.7 : 0.35,
            animation: `twinkle ${star.duration}s ease-in-out ${star.delay}s infinite`,
            boxShadow: star.bright
              ? `0 0 ${star.size * 3}px ${star.size}px rgba(201,165,78,0.3), 0 0 ${star.size * 6}px ${star.size * 2}px rgba(201,165,78,0.1)`
              : 'none',
          }}
        />
      ))}

      {/* Shooting stars */}
      {shootingStars.map(id => {
        const startTop = seededRandom(id % 1000) * 30 + 5
        const duration = 3 + seededRandom((id % 500) + 1) * 3
        return (
          <div
            key={id}
            className="shooting-star"
            style={{
              top: `${startTop}%`,
              left: '-5%',
              animationDuration: `${duration}s`,
              animationIterationCount: '1',
              animationFillMode: 'forwards',
            }}
          />
        )
      })}
    </div>
  )
}
