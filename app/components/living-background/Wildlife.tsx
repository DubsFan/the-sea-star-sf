'use client'

import { useEffect, useRef, useState } from 'react'
import type { SkyPhase } from '../../lib/sky-phases'

interface WildlifeProps {
  skyPhase: SkyPhase
  isMobile: boolean
  reducedMotion: boolean
  starsOpacity: number
}

type FlightKind = 'ambient-single' | 'paired-pass' | 'low-pelican'
type Species = 'gull' | 'pelican'
type Lane = 'high' | 'mid' | 'low'
type Direction = 'ltr' | 'rtl'
type Pose = 'glide' | 'lift' | 'settle'

interface BirdMember {
  id: number
  x: number
  y: number
  scale: number
  flapDuration: number
  flapDelay: number
  pose: Pose
}

interface FlightGroup {
  id: number
  kind: FlightKind
  species: Species
  lane: Lane
  direction: Direction
  top: number
  duration: number
  width: number
  height: number
  opacity: number
  arcName: 'bird-arc-high' | 'bird-arc-mid' | 'bird-arc-low'
  bankDuration: number
  bankDelay: number
  bankTilt: number
  members: BirdMember[]
}

const ACTIVE_PHASES: SkyPhase[] = ['sunrise', 'goldenMorning', 'day', 'goldenEvening', 'sunset']
const GOLDEN_PHASES: SkyPhase[] = ['sunrise', 'goldenMorning', 'goldenEvening', 'sunset']

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min)
}

function pickOne<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)]
}

function laneOpacity(lane: Lane, starsOpacity: number) {
  const fade = starsOpacity >= 0.15 ? 0.72 : 1
  if (lane === 'high') return randomBetween(0.18, 0.26) * fade
  if (lane === 'mid') return randomBetween(0.24, 0.34) * fade
  return randomBetween(0.28, 0.38) * fade
}

function targetFlights(phase: SkyPhase, isMobile: boolean, reducedMotion: boolean) {
  if (reducedMotion) return isMobile ? 0 : 1
  const golden = GOLDEN_PHASES.includes(phase)
  if (golden) return isMobile ? 2 : Math.random() > 0.4 ? 3 : 2
  if (phase === 'day') return isMobile ? 1 : Math.random() > 0.55 ? 2 : 1
  return isMobile ? 1 : Math.random() > 0.5 ? 2 : 1
}

function nextSpawnDelay(phase: SkyPhase, isMobile: boolean, reducedMotion: boolean, currentFlights: number, target: number) {
  const golden = GOLDEN_PHASES.includes(phase)
  if (reducedMotion) return randomBetween(18000, 26000)
  if (currentFlights < target) {
    return isMobile
      ? randomBetween(9000, golden ? 14000 : 17000)
      : randomBetween(5500, golden ? 10000 : 12500)
  }
  return isMobile ? randomBetween(15000, 23000) : randomBetween(9000, 16000)
}

function chooseKind(phase: SkyPhase, starsOpacity: number, now: number, lastPairedAt: number, lastPelicanAt: number): FlightKind {
  if (starsOpacity >= 0.15) return 'ambient-single'

  const weights =
    GOLDEN_PHASES.includes(phase)
      ? [
          ['ambient-single', 0.6],
          ['paired-pass', 0.25],
          ['low-pelican', 0.15],
        ]
      : [
          ['ambient-single', 0.7],
          ['paired-pass', 0.2],
          ['low-pelican', 0.1],
        ]

  const available = weights.filter(([kind]) => {
    if (kind === 'paired-pass' && now - lastPairedAt < 25000) return false
    if (kind === 'low-pelican' && now - lastPelicanAt < 40000) return false
    return true
  }) as Array<[FlightKind, number]>

  const total = available.reduce((sum, [, weight]) => sum + weight, 0)
  let roll = Math.random() * total

  for (const [kind, weight] of available) {
    roll -= weight
    if (roll <= 0) return kind
  }

  return 'ambient-single'
}

function buildMembers(kind: FlightKind, species: Species, width: number): BirdMember[] {
  if (species === 'pelican') {
    const count = Math.random() > 0.65 ? 2 : 1
    return Array.from({ length: count }, (_, index) => ({
      id: index,
      x: index === 0 ? width * 0.28 : width * 0.58,
      y: randomBetween(20, 34) + index * 4,
      scale: index === 0 ? 1 : 0.84,
      flapDuration: randomBetween(5.8, 8.2),
      flapDelay: randomBetween(-3.2, 0),
      pose: pickOne(['glide', 'settle']),
    }))
  }

  const count = kind === 'paired-pass' ? Math.floor(randomBetween(8, 12)) : Math.floor(randomBetween(5, 9))
  const split = Math.ceil(count / 2)

  return Array.from({ length: count }, (_, index) => {
    const pairedOffset = kind === 'paired-pass'
      ? (index < split ? width * 0.12 : width * 0.56)
      : width * 0.18
    const spread = kind === 'paired-pass'
      ? (index < split ? width * 0.22 : width * 0.2)
      : width * 0.5

    return {
      id: index,
      x: pairedOffset + randomBetween(0, spread),
      y: randomBetween(6, 36) + (index % 3) * 3,
      scale: randomBetween(0.66, 1.05),
      flapDuration: randomBetween(3.8, 6.1),
      flapDelay: randomBetween(-2.8, 0),
      pose: pickOne(['glide', 'lift', 'settle']),
    }
  })
}

function buildFlight(id: number, kind: FlightKind, isMobile: boolean, reducedMotion: boolean, starsOpacity: number): FlightGroup {
  const direction: Direction = Math.random() < 0.65 ? 'ltr' : 'rtl'
  const species: Species = kind === 'low-pelican' ? 'pelican' : 'gull'
  const lane: Lane = kind === 'low-pelican' ? 'low' : Math.random() > 0.45 ? 'mid' : 'high'
  const durationBase = species === 'pelican' ? randomBetween(30, 40) : randomBetween(28, 52)
  const duration = reducedMotion ? durationBase * 1.25 : durationBase
  const width = species === 'pelican'
    ? (isMobile ? randomBetween(88, 116) : randomBetween(110, 148))
    : (isMobile ? randomBetween(102, 138) : randomBetween(132, 186))
  const height = width * (species === 'pelican' ? 0.42 : 0.38)
  const top = lane === 'high'
    ? randomBetween(10, 22)
    : lane === 'mid'
      ? randomBetween(18, 34)
      : randomBetween(54, 64)

  return {
    id,
    kind,
    species,
    lane,
    direction,
    top,
    duration,
    width,
    height,
    opacity: laneOpacity(lane, starsOpacity),
    arcName: lane === 'high' ? 'bird-arc-high' : lane === 'mid' ? 'bird-arc-mid' : 'bird-arc-low',
    bankDuration: randomBetween(7.5, 11.5),
    bankDelay: randomBetween(-4.5, 0),
    bankTilt: direction === 'ltr' ? randomBetween(1.4, 3.6) : randomBetween(-3.6, -1.4),
    members: buildMembers(kind, species, width),
  }
}

function GullSilhouette({ fill, pose, flapDuration, flapDelay, direction, reducedMotion }: { fill: string; pose: Pose; flapDuration: number; flapDelay: number; direction: Direction; reducedMotion: boolean }) {
  const yAdjust = pose === 'lift' ? -1.5 : pose === 'settle' ? 1.2 : 0
  const orientation = direction === 'rtl' ? 'scaleX(-1)' : undefined

  return (
    <svg viewBox="0 0 120 54" className="h-full w-full overflow-visible" style={{ transform: orientation }}>
      <g transform={`translate(0 ${yAdjust})`}>
        <path
          d="M57 25c3.4-3.2 8-4.5 12.2-4.1 4 .3 7.2 2.1 10.7 4.8-2.9 2.8-6.3 4.3-10.6 4.6-4.9.3-8.7-1.1-12.3-5.3z"
          fill={fill}
        />
        <path d="M79.5 24.8l8.8-2.2-4.6 4.4z" fill={fill} />
        <path
          d="M59 27.5C49 15.8 34.8 9.8 15 8.8 22.5 16.5 32 21.4 43 24c6 1.5 11 2.1 16 3.5z"
          fill={fill}
          style={{
            transformOrigin: '59px 27px',
            animation: reducedMotion ? undefined : `wing-flap-left ${flapDuration}s ease-in-out ${flapDelay}s infinite`,
          }}
        />
        <path
          d="M61 27.4c10-11.7 24.2-17.6 44-18.6-7.5 7.7-17 12.6-28 15.2-6 1.5-11 2.1-16 3.4z"
          fill={fill}
          style={{
            transformOrigin: '61px 27px',
            animation: reducedMotion ? undefined : `wing-flap-right ${flapDuration}s ease-in-out ${flapDelay}s infinite`,
          }}
        />
      </g>
    </svg>
  )
}

function PelicanSilhouette({ fill, pose, flapDuration, flapDelay, direction, reducedMotion }: { fill: string; pose: Pose; flapDuration: number; flapDelay: number; direction: Direction; reducedMotion: boolean }) {
  const orientation = direction === 'rtl' ? 'scaleX(-1)' : undefined
  const settle = pose === 'settle' ? 2 : pose === 'lift' ? -1.4 : 0

  return (
    <svg viewBox="0 0 156 64" className="h-full w-full overflow-visible" style={{ transform: orientation }}>
      <g transform={`translate(0 ${settle})`}>
        <path
          d="M73 29c4.8-4.3 10.5-6.4 16.6-6 6.3.4 11.9 3.2 17.4 8.1-3.7 3.5-7.8 5.6-13.4 6.1-8.2.9-14.4-1.1-20.6-8.2z"
          fill={fill}
        />
        <path d="M105 31.2l21-4.8-11.2 7.4z" fill={fill} />
        <path
          d="M74.5 31.5C62 18.5 43 13.2 15 12.6c11.1 8.5 21.6 13.7 32.3 16 9.3 1.9 18.2 2.2 27.2 2.9z"
          fill={fill}
          style={{
            transformOrigin: '74px 31px',
            animation: reducedMotion ? undefined : `wing-flap-left ${flapDuration}s ease-in-out ${flapDelay}s infinite`,
          }}
        />
        <path
          d="M79.5 31.3c13.4-13.2 33-19.1 61.5-18.7-11.1 8.7-21.8 14.2-32.5 16.8-9.4 2-18.7 2.2-29 1.9z"
          fill={fill}
          style={{
            transformOrigin: '80px 31px',
            animation: reducedMotion ? undefined : `wing-flap-right ${flapDuration}s ease-in-out ${flapDelay}s infinite`,
          }}
        />
      </g>
    </svg>
  )
}

export default function Wildlife({ skyPhase, isMobile, reducedMotion, starsOpacity }: WildlifeProps) {
  const [flights, setFlights] = useState<FlightGroup[]>([])
  const timeoutRef = useRef<number | null>(null)
  const nextIdRef = useRef(1)
  const lastPairedAtRef = useRef(0)
  const lastPelicanAtRef = useRef(0)

  useEffect(() => {
    if (!ACTIVE_PHASES.includes(skyPhase) || (reducedMotion && isMobile)) {
      setFlights([])
      return
    }

    let cancelled = false

    const schedule = () => {
      if (cancelled) return

      setFlights((current) => {
        const now = Date.now()
        const target = targetFlights(skyPhase, isMobile, reducedMotion)

        if (starsOpacity >= 0.35 || current.length >= target) return current

        const kind = chooseKind(skyPhase, starsOpacity, now, lastPairedAtRef.current, lastPelicanAtRef.current)
        if (kind === 'paired-pass') lastPairedAtRef.current = now
        if (kind === 'low-pelican') lastPelicanAtRef.current = now

        return [...current, buildFlight(nextIdRef.current++, kind, isMobile, reducedMotion, starsOpacity)]
      })

      const target = targetFlights(skyPhase, isMobile, reducedMotion)
      const delay = nextSpawnDelay(skyPhase, isMobile, reducedMotion, flights.length, target)
      timeoutRef.current = window.setTimeout(schedule, delay)
    }

    timeoutRef.current = window.setTimeout(schedule, randomBetween(2200, 5200))

    return () => {
      cancelled = true
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current)
    }
  }, [skyPhase, isMobile, reducedMotion, starsOpacity, flights.length])

  if (!ACTIVE_PHASES.includes(skyPhase) || (reducedMotion && isMobile)) return null

  return (
    <div className="absolute inset-0 z-[5] overflow-hidden pointer-events-none">
      {flights.map((flight) => {
        const fill = flight.species === 'pelican' ? '#2f3b47' : '#32414d'
        const startX = flight.direction === 'ltr' ? '-18vw' : '102vw'

        return (
          <div
            key={flight.id}
            className="absolute will-change-transform"
            style={{
              top: `${flight.top}%`,
              left: startX,
              width: `${flight.width}px`,
              height: `${flight.height}px`,
              opacity: flight.opacity,
              animation: `${flight.direction === 'ltr' ? 'bird-drift-ltr' : 'bird-drift-rtl'} ${flight.duration}s linear forwards`,
            }}
            onAnimationEnd={() => setFlights((current) => current.filter((item) => item.id !== flight.id))}
          >
            <div
              className="h-full w-full will-change-transform"
              style={{
                animation: `${flight.arcName} ${flight.duration}s cubic-bezier(0.35, 0.05, 0.2, 1) forwards`,
              }}
            >
              <div
                className="h-full w-full will-change-transform"
                style={{
                  animation: reducedMotion ? undefined : `bird-bank-soft ${flight.bankDuration}s ease-in-out ${flight.bankDelay}s infinite`,
                  transformOrigin: '50% 50%',
                  ['--bird-bank-tilt' as string]: `${flight.bankTilt}deg`,
                }}
              >
                {flight.members.map((member) => (
                  <div
                    key={member.id}
                    className="absolute"
                    style={{
                      left: `${member.x}px`,
                      top: `${member.y}px`,
                      width: `${(flight.species === 'pelican' ? 46 : 32) * member.scale}px`,
                      height: `${(flight.species === 'pelican' ? 19 : 14) * member.scale}px`,
                    }}
                  >
                    {flight.species === 'pelican' ? (
                      <PelicanSilhouette
                        fill={fill}
                        pose={member.pose}
                        flapDuration={member.flapDuration}
                        flapDelay={member.flapDelay}
                        direction={flight.direction}
                        reducedMotion={reducedMotion}
                      />
                    ) : (
                      <GullSilhouette
                        fill={fill}
                        pose={member.pose}
                        flapDuration={member.flapDuration}
                        flapDelay={member.flapDelay}
                        direction={flight.direction}
                        reducedMotion={reducedMotion}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
