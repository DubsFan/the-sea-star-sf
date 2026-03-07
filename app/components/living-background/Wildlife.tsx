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
  reverse: boolean  // fly right-to-left
  soar: boolean     // vertical sine-wave wobble
  flapSpeed: number // seconds per flap cycle
}

interface EasterEggData {
  type: 'dog' | 'sealion'
  id: number
}

const isDaytime = (phase: SkyPhase) =>
  ['goldenMorning', 'day', 'goldenEvening', 'sunrise'].includes(phase)

const isDawnDusk = (phase: SkyPhase) =>
  ['dawn', 'dusk', 'nauticalDawn', 'nauticalDusk', 'sunset'].includes(phase)

const isGoldenHour = (phase: SkyPhase) =>
  ['goldenEvening', 'sunset'].includes(phase)

const isNight = (phase: SkyPhase) =>
  ['night', 'astronomicalDawn', 'astronomicalDusk'].includes(phase)

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

  // Spawn birds during daytime (and reduced at dawn/dusk)
  useEffect(() => {
    if (isNight(skyPhase)) {
      setBirds([])
      return
    }

    const active = isDaytime(skyPhase) || isGoldenHour(skyPhase)
    const reduced = isDawnDusk(skyPhase)
    if (!active && !reduced) {
      setBirds([])
      return
    }

    const spawnBirds = () => {
      const now = Date.now()
      const goldenHour = isGoldenHour(skyPhase)

      // Fewer birds at dawn/dusk
      const maxCount = reduced
        ? (isMobile ? 1 : 2)
        : (isMobile ? Math.floor(seededRandom(now % 1000) * 2) + 1 : Math.floor(seededRandom(now % 1000) * 3) + 2)

      const newBirds: BirdData[] = []
      for (let i = 0; i < maxCount; i++) {
        const isPelican = goldenHour && seededRandom(now + i * 31) > 0.4
        const reverse = seededRandom(now + i * 23) > 0.6 // 40% R to L
        const soar = seededRandom(now + i * 29) > 0.5

        newBirds.push({
          id: now + i,
          type: isPelican ? 'pelican' : 'seagull',
          top: isPelican
            ? 55 + seededRandom(now + i * 7) * 15  // Pelicans fly low near water
            : 10 + seededRandom(now + i * 13) * 40, // Seagulls varied heights
          duration: isPelican
            ? 35 + seededRandom(now + i * 3) * 20
            : 20 + seededRandom(now + i * 5) * 18,
          delay: i * 1.5,
          size: isPelican
            ? 40 + seededRandom(now + i * 11) * 15   // 40-55px
            : 20 + seededRandom(now + i * 11) * 12,  // 20-32px
          reverse,
          soar,
          flapSpeed: isPelican ? 1.2 + seededRandom(now + i * 37) * 0.6 : 0.6 + seededRandom(now + i * 41) * 0.4,
        })
      }

      setBirds(prev => [...prev, ...newBirds])
    }

    // Initial spawn after short delay
    const initialTimeout = setTimeout(spawnBirds, 3000)

    // Frequent spawns: 8-15s desktop, 15-25s mobile (reduced phases: 2x interval)
    const baseMin = isMobile ? 15000 : 8000
    const baseRange = isMobile ? 10000 : 7000
    const multiplier = reduced ? 2 : 1

    const interval = setInterval(
      spawnBirds,
      (baseMin + Math.random() * baseRange) * multiplier
    )

    return () => {
      clearTimeout(initialTimeout)
      clearInterval(interval)
    }
  }, [skyPhase, isMobile])

  // Easter eggs — repeating during daytime
  useEffect(() => {
    if (isNight(skyPhase)) {
      setEasterEggs([])
      return
    }
    if (!isDaytime(skyPhase) && !isGoldenHour(skyPhase)) return

    const spawnEasterEgg = () => {
      const roll = Math.random()
      if (roll < 0.12) {
        setEasterEggs(prev => [...prev, { type: 'sealion', id: Date.now() }])
      } else if (roll < 0.47) {
        setEasterEggs(prev => [...prev, { type: 'dog', id: Date.now() }])
      }
    }

    const initialTimeout = setTimeout(spawnEasterEgg, 10000 + Math.random() * 10000)

    const interval = setInterval(
      spawnEasterEgg,
      isMobile ? (180000 + Math.random() * 120000) : (120000 + Math.random() * 60000)
    )

    return () => {
      clearTimeout(initialTimeout)
      clearInterval(interval)
    }
  }, [skyPhase, isMobile])

  return (
    <div className="absolute inset-0 z-[5] overflow-hidden">
      {/* Birds */}
      {birds.map(bird => (
        <div
          key={bird.id}
          className="absolute"
          style={{
            top: `${bird.top}%`,
            ...(bird.reverse
              ? { right: '-5%' }
              : { left: '-5%' }),
            width: `${bird.size}px`,
            height: `${bird.size * 0.5}px`,
            animation: bird.reverse
              ? `bird-fly-reverse ${bird.duration}s linear ${bird.delay}s forwards`
              : `bird-fly ${bird.duration}s linear ${bird.delay}s forwards`,
          }}
          onAnimationEnd={() => removeBird(bird.id)}
        >
          <div
            style={{
              animation: bird.soar ? 'bird-soar 3s ease-in-out infinite' : undefined,
              width: '100%',
              height: '100%',
            }}
          >
            {bird.type === 'seagull' ? (
              /* Seagull: elegant thin V with gentle wing flap */
              <svg
                viewBox="-1 -1 22 12"
                fill="none"
                className="w-full h-full"
                style={{
                  opacity: 0.6,
                  transform: bird.reverse ? 'scaleX(-1)' : undefined,
                }}
              >
                <path
                  d="M0,8 Q4,1 10,5 Q16,1 20,8"
                  stroke="#1a1a2e"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  fill="none"
                  style={{ animation: `wing-flap ${bird.flapSpeed}s ease-in-out infinite` }}
                />
              </svg>
            ) : (
              /* Pelican: wider, heavier stroke, slight body mass */
              <svg
                viewBox="-1 -1 32 14"
                fill="none"
                className="w-full h-full"
                style={{
                  opacity: 0.65,
                  transform: bird.reverse ? 'scaleX(-1)' : undefined,
                }}
              >
                <path
                  d="M0,10 Q6,1 15,7 Q24,1 30,9"
                  stroke="#1a1a2e"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  fill="none"
                  style={{ animation: `wing-flap ${bird.flapSpeed}s ease-in-out infinite` }}
                />
                {/* Slight body bulge at center */}
                <ellipse cx="15" cy="7.5" rx="3" ry="1.5" fill="#1a1a2e" opacity="0.3" />
              </svg>
            )}
          </div>
        </div>
      ))}

      {/* Dog easter egg */}
      {easterEggs.filter(e => e.type === 'dog').map(egg => (
        <div
          key={egg.id}
          className="absolute"
          style={{
            bottom: '15.5vh',
            right: '-60px',
            width: '50px',
            height: '30px',
            animation: 'dog-trot 18s linear forwards',
          }}
          onAnimationEnd={() => removeEasterEgg(egg.id)}
        >
          <svg viewBox="0 0 50 28" className="w-full h-full" style={{ opacity: 0.4 }}>
            {/* Smooth dog silhouette — body, legs, head, ears, tail */}
            <path
              d="M8,24 L8,17 C8,13 10,10 14,10 L32,10 C36,10 38,12 38,14
                 L42,9 C43,8 44,9 43,11 L41,14 C40,15 39,16 38,17 L38,24
                 M34,17 L34,24
                 M18,17 L18,24
                 M12,17 L12,24"
              fill="#1a1a2e"
            />
            {/* Tail */}
            <path
              d="M8,12 Q4,6 6,4"
              stroke="#1a1a2e"
              strokeWidth="1.8"
              strokeLinecap="round"
              fill="none"
              style={{ animation: 'tail-wag 0.5s ease-in-out infinite alternate' }}
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
            bottom: '14vh',
            left: `${30 + seededRandom(egg.id) * 40}%`,
            width: '25px',
            height: '33px',
            animation: 'sealion-bob 4s ease-in-out forwards',
          }}
          onAnimationEnd={() => removeEasterEgg(egg.id)}
        >
          <svg viewBox="0 0 20 28" className="w-full h-full" style={{ opacity: 0.35 }}>
            {/* Smooth sea lion head + neck silhouette */}
            <path
              d="M10,4 C6,4 4,7 4,11 C4,15 6,18 8,20 L12,20 C14,18 16,15 16,11 C16,7 14,4 10,4 Z"
              fill="#1a1a2e"
            />
            {/* Whisker dots */}
            <circle cx="6" cy="10" r="0.6" fill="#2a2a3e" />
            <circle cx="14" cy="10" r="0.6" fill="#2a2a3e" />
          </svg>
        </div>
      ))}
    </div>
  )
}
