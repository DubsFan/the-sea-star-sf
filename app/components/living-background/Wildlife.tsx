'use client'

import { useEffect, useState, useCallback } from 'react'
import type { SkyPhase } from '../../lib/sky-phases'

interface WildlifeProps {
  skyPhase: SkyPhase
  isMobile: boolean
}

interface BirdData {
  id: number
  type: 'seagull' | 'pelican'
  top: number      // viewport %
  duration: number  // seconds
  delay: number
  size: number     // px
  flipY: boolean
}

interface EasterEggData {
  type: 'dog' | 'sealion'
  id: number
}

const isDaytime = (phase: SkyPhase) =>
  ['goldenMorning', 'day', 'goldenEvening', 'sunrise'].includes(phase)

const isGoldenHour = (phase: SkyPhase) =>
  ['goldenEvening', 'sunset'].includes(phase)

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297
  return x - Math.floor(x)
}

export default function Wildlife({ skyPhase, isMobile }: WildlifeProps) {
  const [birds, setBirds] = useState<BirdData[]>([])
  const [easterEggs, setEasterEggs] = useState<EasterEggData[]>([])

  const removeBird = useCallback((id: number) => {
    setBirds(prev => prev.filter(b => b.id !== id))
  }, [])

  const removeEasterEgg = useCallback((id: number) => {
    setEasterEggs(prev => prev.filter(e => e.id !== id))
  }, [])

  // Spawn birds during daytime
  useEffect(() => {
    if (!isDaytime(skyPhase) && !isGoldenHour(skyPhase)) {
      setBirds([])
      return
    }

    const spawnBirds = () => {
      const now = Date.now()
      const isPelican = isGoldenHour(skyPhase)
      const count = isMobile ? 1 : (isPelican ? 1 : Math.floor(seededRandom(now % 1000) * 3) + 1)

      const newBirds: BirdData[] = []
      for (let i = 0; i < count; i++) {
        newBirds.push({
          id: now + i,
          type: isPelican ? 'pelican' : 'seagull',
          top: isPelican
            ? 55 + seededRandom(now + i * 7) * 15  // Pelicans fly low near water
            : 10 + seededRandom(now + i * 13) * 35, // Seagulls higher up
          duration: isPelican ? 40 + seededRandom(now + i * 3) * 20 : 25 + seededRandom(now + i * 5) * 20,
          delay: i * 2,
          size: isPelican ? 24 : 10 + seededRandom(now + i * 11) * 8,
          flipY: seededRandom(now + i * 17) > 0.5,
        })
      }

      setBirds(prev => [...prev, ...newBirds])
    }

    // Initial spawn after short delay
    const initialTimeout = setTimeout(spawnBirds, 5000)

    // Subsequent spawns
    const interval = setInterval(
      spawnBirds,
      (isMobile ? 90000 : 45000) + Math.random() * 45000
    )

    return () => {
      clearTimeout(initialTimeout)
      clearInterval(interval)
    }
  }, [skyPhase, isMobile])

  // Easter eggs — desktop only, one-time on mount
  useEffect(() => {
    if (isMobile) return

    const roll = Math.random()
    if (roll < 0.02) {
      // Sea lion: 2% chance
      setTimeout(() => {
        setEasterEggs([{ type: 'sealion', id: Date.now() }])
      }, 15000 + Math.random() * 30000)
    } else if (roll < 0.12) {
      // Dog: 10% chance
      setTimeout(() => {
        setEasterEggs([{ type: 'dog', id: Date.now() }])
      }, 20000 + Math.random() * 40000)
    }
  }, [isMobile])

  return (
    <div className="absolute inset-0 z-[5] overflow-hidden">
      {/* Birds */}
      {birds.map(bird => (
        <div
          key={bird.id}
          className="absolute"
          style={{
            top: `${bird.top}%`,
            left: '-5%',
            width: `${bird.size}px`,
            height: `${bird.size * 0.6}px`,
            animation: `bird-fly ${bird.duration}s linear ${bird.delay}s forwards`,
            transform: bird.flipY ? 'scaleY(-1)' : undefined,
          }}
          onAnimationEnd={() => removeBird(bird.id)}
        >
          {/* Bird silhouette using CSS */}
          <svg
            viewBox="0 0 40 20"
            fill="none"
            className="w-full h-full"
            style={{ opacity: bird.type === 'pelican' ? 0.5 : 0.4 }}
          >
            {bird.type === 'seagull' ? (
              <path
                d="M0 10 Q5 2 10 8 Q15 2 20 10 Q25 2 30 8 Q35 2 40 10"
                stroke="currentColor"
                strokeWidth="1.5"
                fill="none"
                className="text-sea-dark"
                style={{ animation: 'wing-flap 0.8s ease-in-out infinite' }}
              />
            ) : (
              // Pelican: larger body, distinct beak
              <>
                <path
                  d="M0 12 Q4 4 10 8 L15 6 Q20 3 25 8 Q30 4 35 8 Q38 5 40 10"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                  className="text-sea-dark"
                />
                <circle cx="37" cy="9" r="1" fill="currentColor" className="text-sea-dark" />
              </>
            )}
          </svg>
        </div>
      ))}

      {/* Dog easter egg */}
      {easterEggs.filter(e => e.type === 'dog').map(egg => (
        <div
          key={egg.id}
          className="absolute"
          style={{
            bottom: '15.5vh', // Just above water line
            right: '-40px',
            width: '30px',
            height: '20px',
            animation: 'dog-trot 20s linear forwards',
          }}
          onAnimationEnd={() => removeEasterEgg(egg.id)}
        >
          <svg viewBox="0 0 40 25" className="w-full h-full opacity-30">
            {/* Simple dog silhouette */}
            <path
              d="M5 15 L5 10 Q5 5 10 5 L25 5 Q30 5 30 8 L35 5 L35 10 L32 10 Q30 10 30 12 L30 15 L27 15 L27 12 L15 12 L15 15 L12 15 L12 12 L8 12 L8 15 Z"
              fill="currentColor"
              className="text-sea-dark"
            />
            {/* Tail */}
            <path
              d="M5 8 Q2 3 4 2"
              stroke="currentColor"
              strokeWidth="1.5"
              fill="none"
              className="text-sea-dark"
              style={{ animation: 'wing-flap 0.4s ease-in-out infinite' }}
            />
          </svg>
        </div>
      ))}

      {/* Sea lion easter egg */}
      {easterEggs.filter(e => e.type === 'sealion').map(egg => (
        <div
          key={egg.id}
          className="absolute"
          style={{
            bottom: '14vh', // At water line
            left: `${30 + Math.random() * 40}%`,
            width: '15px',
            height: '20px',
            animation: 'sealion-bob 4s ease-in-out forwards',
          }}
          onAnimationEnd={() => removeEasterEgg(egg.id)}
        >
          <svg viewBox="0 0 15 25" className="w-full h-full opacity-35">
            {/* Sea lion head */}
            <ellipse cx="7.5" cy="8" rx="5" ry="7" fill="currentColor" className="text-sea-dark" />
            <circle cx="5" cy="5" r="0.8" fill="#0a0e18" /> {/* Eye */}
            <path d="M3 9 Q5 11 7.5 9" stroke="#0a0e18" strokeWidth="0.5" fill="none" /> {/* Nose */}
          </svg>
        </div>
      ))}
    </div>
  )
}
