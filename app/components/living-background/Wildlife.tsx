'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import type { SkyPhase } from '../../lib/sky-phases'

interface WildlifeProps {
  skyPhase: SkyPhase
  isMobile: boolean
  reducedMotion: boolean
  starsOpacity: number
}

type FlightKind =
  | 'ambient-single'
  | 'paired-pass'
  | 'low-pelican'
  | 'pelican-dive'
  | 'gull-dive'
  | 'gull-skim-pack'
  | 'pelican-skim-recover'
type Species = 'gull' | 'pelican'
type Lane = 'high' | 'mid' | 'low'
type Direction = 'ltr' | 'rtl'
type Pose = 'glide' | 'lift' | 'settle' | 'dive' | 'skim' | 'recover'
type PathName =
  | 'bird-arc-high'
  | 'bird-arc-mid'
  | 'bird-arc-low'
  | 'bird-dive-pelican'
  | 'bird-dive-gull'
  | 'bird-skim-water'
  | 'bird-recover-climb'
type BankName = 'bird-bank-soft' | 'bird-bank-hard'
type BodyName = 'pelican-body-pitch' | 'gull-body-flick'
type ActionProfile = 'ambient' | 'dive' | 'skim'

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
  pathName: PathName
  pathTiming: string
  actionProfile: ActionProfile
  bankName: BankName
  bankDuration: number
  bankDelay: number
  bankTilt: number
  bankIterations: number | 'infinite'
  bodyName?: BodyName
  members: BirdMember[]
}

type WeightedKind = [FlightKind, number]

const ACTIVE_PHASES: SkyPhase[] = ['sunrise', 'goldenMorning', 'day', 'goldenEvening', 'sunset']
const GOLDEN_PHASES: SkyPhase[] = ['sunrise', 'goldenMorning', 'goldenEvening', 'sunset']

const ACTION_COOLDOWNS: Partial<Record<FlightKind, number>> = {
  'paired-pass': 18000,
  'low-pelican': 24000,
  'pelican-dive': 16000,
  'gull-dive': 9500,
  'gull-skim-pack': 8500,
  'pelican-skim-recover': 19000,
}

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min)
}

function randomIntBetween(min: number, max: number) {
  return Math.floor(randomBetween(min, max + 1))
}

function pickOne<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)]
}

function laneOpacity(lane: Lane, starsOpacity: number, actionProfile: ActionProfile) {
  const fade = starsOpacity >= 0.15 ? 0.72 : 1
  const base =
    lane === 'high'
      ? randomBetween(0.18, 0.26)
      : lane === 'mid'
        ? randomBetween(0.24, 0.34)
        : randomBetween(0.28, 0.38)
  const accent = actionProfile === 'ambient' ? 0 : actionProfile === 'dive' ? 0.05 : 0.035
  return Math.min(0.48, (base + accent) * fade)
}

function targetFlights(phase: SkyPhase, isMobile: boolean, reducedMotion: boolean) {
  if (reducedMotion) return isMobile ? 0 : 1
  if (phase === 'day') return isMobile ? 2 : 4
  if (GOLDEN_PHASES.includes(phase)) return isMobile ? 3 : 5
  return isMobile ? 2 : 3
}

function nextSpawnDelay(phase: SkyPhase, isMobile: boolean, reducedMotion: boolean, currentFlights: number, target: number) {
  if (reducedMotion) return randomBetween(18000, 24000)
  if (currentFlights < target) {
    if (isMobile) return randomBetween(6000, phase === 'day' ? 9200 : 8600)
    return randomBetween(3400, phase === 'day' ? 6400 : 5600)
  }
  return isMobile ? randomBetween(9000, 14000) : randomBetween(7000, 11000)
}

function phaseWeights(phase: SkyPhase, isMobile: boolean): WeightedKind[] {
  const weights: WeightedKind[] =
    phase === 'day'
      ? [
          ['ambient-single', 0.18],
          ['paired-pass', 0.1],
          ['low-pelican', 0.08],
          ['pelican-dive', 0.16],
          ['gull-dive', 0.17],
          ['gull-skim-pack', 0.2],
          ['pelican-skim-recover', 0.11],
        ]
      : [
          ['ambient-single', 0.2],
          ['paired-pass', 0.12],
          ['low-pelican', 0.1],
          ['pelican-dive', 0.18],
          ['gull-dive', 0.14],
          ['gull-skim-pack', 0.16],
          ['pelican-skim-recover', 0.1],
        ]

  if (!isMobile) return weights

  return weights.map(([kind, weight]) => {
    if (kind === 'gull-skim-pack') return [kind, weight * 0.82]
    if (kind === 'paired-pass') return [kind, weight * 0.86]
    if (kind === 'ambient-single') return [kind, weight * 1.1]
    return [kind, weight]
  })
}

function chooseKind(
  phase: SkyPhase,
  isMobile: boolean,
  starsOpacity: number,
  now: number,
  lastActionAt: Partial<Record<FlightKind, number>>,
): FlightKind {
  if (starsOpacity >= 0.15) return 'ambient-single'

  const available = phaseWeights(phase, isMobile).filter(([kind]) => {
    const cooldown = ACTION_COOLDOWNS[kind]
    if (!cooldown) return true
    return now - (lastActionAt[kind] ?? 0) >= cooldown
  })

  const weighted: WeightedKind[] = available.length > 0 ? available : [['ambient-single', 1]]
  const total = weighted.reduce((sum, [, weight]) => sum + weight, 0)
  let roll = Math.random() * total

  for (const [kind, weight] of weighted) {
    roll -= weight
    if (roll <= 0) return kind
  }

  return 'ambient-single'
}

function gullFlapDuration(pose: Pose) {
  if (pose === 'dive') return randomBetween(2.9, 4.2)
  if (pose === 'skim') return randomBetween(3.0, 4.3)
  if (pose === 'recover') return randomBetween(3.2, 4.6)
  return randomBetween(3.8, 6.1)
}

function pelicanFlapDuration(pose: Pose) {
  if (pose === 'dive') return randomBetween(4.5, 6.1)
  if (pose === 'recover') return randomBetween(4.7, 6.4)
  if (pose === 'skim') return randomBetween(5.3, 7.0)
  return randomBetween(5.8, 8.2)
}

function buildGullMembers(
  count: number,
  width: number,
  formation: 'loose' | 'paired' | 'pack',
  poseOptions: Pose[],
): BirdMember[] {
  if (formation === 'paired') {
    const split = Math.ceil(count / 2)
    return Array.from({ length: count }, (_, index) => {
      const inFront = index < split
      const base = inFront ? width * 0.12 : width * 0.56
      const spread = inFront ? width * 0.22 : width * 0.2
      const pose = pickOne(poseOptions)

      return {
        id: index,
        x: base + randomBetween(0, spread),
        y: randomBetween(8, 30) + (index % 3) * 3,
        scale: randomBetween(0.68, 1.04),
        flapDuration: gullFlapDuration(pose),
        flapDelay: randomBetween(-2.6, 0),
        pose,
      }
    })
  }

  if (formation === 'pack') {
    const columns = [width * 0.1, width * 0.36, width * 0.64]
    return Array.from({ length: count }, (_, index) => {
      const column = columns[index % columns.length]
      const row = Math.floor(index / columns.length)
      const pose = pickOne(poseOptions)

      return {
        id: index,
        x: column + randomBetween(0, width * 0.14),
        y: randomBetween(12, 22) + row * randomBetween(2.5, 5),
        scale: randomBetween(0.72, 1.02),
        flapDuration: gullFlapDuration(pose),
        flapDelay: randomBetween(-2.3, 0),
        pose,
      }
    })
  }

  return Array.from({ length: count }, (_, index) => {
    const pose = pickOne(poseOptions)
    return {
      id: index,
      x: width * 0.18 + randomBetween(0, width * 0.5),
      y: randomBetween(6, 34) + (index % 3) * 3,
      scale: randomBetween(0.66, 1.04),
      flapDuration: gullFlapDuration(pose),
      flapDelay: randomBetween(-2.8, 0),
      pose,
    }
  })
}

function buildPelicanMembers(count: number, width: number, poseOptions: Pose[]): BirdMember[] {
  return Array.from({ length: count }, (_, index) => {
    const pose = poseOptions[index % poseOptions.length] ?? pickOne(poseOptions)
    return {
      id: index,
      x: index === 0 ? width * 0.24 : width * 0.56 + randomBetween(-width * 0.03, width * 0.04),
      y: randomBetween(16, 28) + index * 5,
      scale: index === 0 ? 1 : 0.84,
      flapDuration: pelicanFlapDuration(pose),
      flapDelay: randomBetween(-3.2, 0),
      pose,
    }
  })
}

function makeFlightBase(
  id: number,
  kind: FlightKind,
  species: Species,
  lane: Lane,
  isMobile: boolean,
  starsOpacity: number,
  actionProfile: ActionProfile,
  config: {
    duration: [number, number]
    width: [number, number]
    heightRatio: number
    top: [number, number]
    pathName: PathName
    pathTiming: string
    bankName: BankName
    bankIterations: number | 'infinite'
    bankDuration?: [number, number]
    bodyName?: BodyName
    members: BirdMember[]
  },
): FlightGroup {
  const direction: Direction = Math.random() < 0.65 ? 'ltr' : 'rtl'
  const duration = randomBetween(config.duration[0], config.duration[1])
  const width = randomBetween(config.width[0], config.width[1])
  const height = width * config.heightRatio
  const bankDuration = config.bankIterations === 'infinite'
    ? randomBetween(config.bankDuration?.[0] ?? 7.5, config.bankDuration?.[1] ?? 11.5)
    : duration
  const bankTilt =
    config.bankName === 'bird-bank-hard'
      ? (direction === 'ltr' ? randomBetween(6.5, 11) : randomBetween(-11, -6.5))
      : (direction === 'ltr' ? randomBetween(1.4, 3.6) : randomBetween(-3.6, -1.4))

  return {
    id,
    kind,
    species,
    lane,
    direction,
    top: randomBetween(config.top[0], config.top[1]),
    duration,
    width,
    height,
    opacity: laneOpacity(lane, starsOpacity, actionProfile),
    pathName: config.pathName,
    pathTiming: config.pathTiming,
    actionProfile,
    bankName: config.bankName,
    bankDuration,
    bankDelay: config.bankIterations === 'infinite' ? randomBetween(-4.5, 0) : 0,
    bankTilt,
    bankIterations: config.bankIterations,
    bodyName: config.bodyName,
    members: config.members.map(member => ({
      ...member,
      x: member.x * (width / Math.max(config.width[0], 1)),
      y: member.y,
    })),
  }
}

function buildAmbientFlight(id: number, kind: Extract<FlightKind, 'ambient-single' | 'paired-pass' | 'low-pelican'>, isMobile: boolean, starsOpacity: number): FlightGroup {
  if (kind === 'low-pelican') {
    const widthSeed = isMobile ? 96 : 118
    return makeFlightBase(id, kind, 'pelican', 'low', isMobile, starsOpacity, 'ambient', {
      duration: [28, 36],
      width: isMobile ? [96, 118] : [118, 148],
      heightRatio: 0.42,
      top: [54, 63],
      pathName: 'bird-arc-low',
      pathTiming: 'cubic-bezier(0.35, 0.08, 0.22, 1)',
      bankName: 'bird-bank-soft',
      bankIterations: 'infinite',
      bankDuration: [8.2, 12.2],
      members: buildPelicanMembers(Math.random() > 0.62 ? 2 : 1, widthSeed, ['glide', 'settle']),
    })
  }

  const lane: Lane = kind === 'paired-pass' ? (Math.random() > 0.55 ? 'mid' : 'high') : (Math.random() > 0.45 ? 'mid' : 'high')
  const widthSeed = isMobile ? 116 : 144
  return makeFlightBase(id, kind, 'gull', lane, isMobile, starsOpacity, 'ambient', {
    duration: kind === 'paired-pass' ? [24, 34] : [28, 46],
    width: kind === 'paired-pass'
      ? (isMobile ? [112, 146] : [138, 188])
      : (isMobile ? [102, 138] : [132, 186]),
    heightRatio: 0.38,
    top: lane === 'high' ? [10, 22] : [18, 34],
    pathName: lane === 'high' ? 'bird-arc-high' : 'bird-arc-mid',
    pathTiming: 'cubic-bezier(0.35, 0.05, 0.2, 1)',
    bankName: 'bird-bank-soft',
    bankIterations: 'infinite',
    bankDuration: [7.4, 10.8],
    members: buildGullMembers(
      kind === 'paired-pass' ? randomIntBetween(isMobile ? 6 : 8, isMobile ? 8 : 11) : randomIntBetween(isMobile ? 4 : 5, isMobile ? 6 : 8),
      widthSeed,
      kind === 'paired-pass' ? 'paired' : 'loose',
      ['glide', 'lift', 'settle'],
    ),
  })
}

function buildPelicanDiveFlight(id: number, isMobile: boolean, starsOpacity: number): FlightGroup {
  const widthSeed = isMobile ? 104 : 132
  return makeFlightBase(id, 'pelican-dive', 'pelican', 'low', isMobile, starsOpacity, 'dive', {
    duration: [18, 24],
    width: isMobile ? [104, 124] : [126, 156],
    heightRatio: 0.44,
    top: [46, 53],
    pathName: 'bird-dive-pelican',
    pathTiming: 'cubic-bezier(0.32, 0.02, 0.16, 1)',
    bankName: 'bird-bank-hard',
    bankIterations: 1,
    bodyName: 'pelican-body-pitch',
    members: buildPelicanMembers(Math.random() > 0.7 ? 2 : 1, widthSeed, ['dive', 'skim', 'recover']),
  })
}

function buildGullDiveFlight(id: number, isMobile: boolean, starsOpacity: number): FlightGroup {
  const widthSeed = isMobile ? 112 : 146
  return makeFlightBase(id, 'gull-dive', 'gull', 'mid', isMobile, starsOpacity, 'dive', {
    duration: [14, 20],
    width: isMobile ? [106, 136] : [126, 172],
    heightRatio: 0.39,
    top: [34, 42],
    pathName: 'bird-dive-gull',
    pathTiming: 'cubic-bezier(0.3, 0.03, 0.18, 1)',
    bankName: 'bird-bank-hard',
    bankIterations: 1,
    bodyName: 'gull-body-flick',
    members: buildGullMembers(randomIntBetween(isMobile ? 3 : 4, isMobile ? 5 : 7), widthSeed, 'pack', ['dive', 'lift', 'recover']),
  })
}

function buildGullSkimPack(id: number, isMobile: boolean, starsOpacity: number): FlightGroup {
  const widthSeed = isMobile ? 120 : 154
  return makeFlightBase(id, 'gull-skim-pack', 'gull', 'low', isMobile, starsOpacity, 'skim', {
    duration: [16, 23],
    width: isMobile ? [116, 150] : [144, 190],
    heightRatio: 0.38,
    top: [54, 60],
    pathName: 'bird-skim-water',
    pathTiming: 'cubic-bezier(0.28, 0.04, 0.2, 1)',
    bankName: 'bird-bank-hard',
    bankIterations: 1,
    bodyName: 'gull-body-flick',
    members: buildGullMembers(randomIntBetween(isMobile ? 5 : 7, isMobile ? 7 : 10), widthSeed, 'pack', ['skim', 'skim', 'recover', 'lift']),
  })
}

function buildPelicanSkimRecover(id: number, isMobile: boolean, starsOpacity: number): FlightGroup {
  const widthSeed = isMobile ? 102 : 128
  return makeFlightBase(id, 'pelican-skim-recover', 'pelican', 'low', isMobile, starsOpacity, 'skim', {
    duration: [20, 28],
    width: isMobile ? [98, 120] : [118, 150],
    heightRatio: 0.43,
    top: [56, 63],
    pathName: 'bird-recover-climb',
    pathTiming: 'cubic-bezier(0.28, 0.06, 0.18, 1)',
    bankName: 'bird-bank-hard',
    bankIterations: 1,
    bodyName: 'pelican-body-pitch',
    members: buildPelicanMembers(Math.random() > 0.68 ? 2 : 1, widthSeed, ['skim', 'recover']),
  })
}

function buildFlight(id: number, kind: FlightKind, isMobile: boolean, reducedMotion: boolean, starsOpacity: number): FlightGroup {
  if (reducedMotion) return buildAmbientFlight(id, 'ambient-single', isMobile, starsOpacity)
  if (kind === 'pelican-dive') return buildPelicanDiveFlight(id, isMobile, starsOpacity)
  if (kind === 'gull-dive') return buildGullDiveFlight(id, isMobile, starsOpacity)
  if (kind === 'gull-skim-pack') return buildGullSkimPack(id, isMobile, starsOpacity)
  if (kind === 'pelican-skim-recover') return buildPelicanSkimRecover(id, isMobile, starsOpacity)
  return buildAmbientFlight(id, kind, isMobile, starsOpacity)
}

function GullSilhouette({
  fill,
  pose,
  flapDuration,
  flapDelay,
  direction,
  reducedMotion,
}: {
  fill: string
  pose: Pose
  flapDuration: number
  flapDelay: number
  direction: Direction
  reducedMotion: boolean
}) {
  const orientation = direction === 'rtl' ? 'scaleX(-1)' : undefined
  const poseTransform =
    pose === 'dive'
      ? 'translateY(3px) rotate(11deg) scale(0.95, 0.92)'
      : pose === 'skim'
        ? 'translateY(2px) rotate(4deg) scale(1.03, 0.9)'
        : pose === 'recover'
          ? 'translateY(-2px) rotate(-10deg) scale(1.02, 1.04)'
          : pose === 'lift'
            ? 'translateY(-1.5px) rotate(-4deg)'
            : pose === 'settle'
              ? 'translateY(1.4px) rotate(4deg) scale(0.98, 0.96)'
              : 'translateY(0)'

  return (
    <svg viewBox="0 0 120 54" className="h-full w-full overflow-visible" style={{ transform: orientation }}>
      <g style={{ transformOrigin: '60px 27px', transform: poseTransform }}>
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

function PelicanSilhouette({
  fill,
  pose,
  flapDuration,
  flapDelay,
  direction,
  reducedMotion,
}: {
  fill: string
  pose: Pose
  flapDuration: number
  flapDelay: number
  direction: Direction
  reducedMotion: boolean
}) {
  const orientation = direction === 'rtl' ? 'scaleX(-1)' : undefined
  const poseTransform =
    pose === 'dive'
      ? 'translateY(4px) rotate(14deg) scale(0.96, 0.92)'
      : pose === 'skim'
        ? 'translateY(2px) rotate(6deg) scale(1.02, 0.94)'
        : pose === 'recover'
          ? 'translateY(-2px) rotate(-11deg) scale(1.02, 1.05)'
          : pose === 'lift'
            ? 'translateY(-1.4px) rotate(-3deg)'
            : pose === 'settle'
              ? 'translateY(2px) rotate(4deg) scale(0.99, 0.97)'
              : 'translateY(0)'

  return (
    <svg viewBox="0 0 156 64" className="h-full w-full overflow-visible" style={{ transform: orientation }}>
      <g style={{ transformOrigin: '78px 31px', transform: poseTransform }}>
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
  const lastActionAtRef = useRef<Partial<Record<FlightKind, number>>>({})

  useEffect(() => {
    if (!ACTIVE_PHASES.includes(skyPhase) || (reducedMotion && isMobile)) {
      setFlights([])
      return
    }

    let cancelled = false

    const schedule = () => {
      if (cancelled) return

      setFlights(current => {
        const now = Date.now()
        const target = targetFlights(skyPhase, isMobile, reducedMotion)

        if (starsOpacity >= 0.35 || current.length >= target) return current

        const kind = chooseKind(skyPhase, isMobile, starsOpacity, now, lastActionAtRef.current)
        if (ACTION_COOLDOWNS[kind]) lastActionAtRef.current[kind] = now

        return [...current, buildFlight(nextIdRef.current++, kind, isMobile, reducedMotion, starsOpacity)]
      })

      const target = targetFlights(skyPhase, isMobile, reducedMotion)
      timeoutRef.current = window.setTimeout(
        schedule,
        nextSpawnDelay(skyPhase, isMobile, reducedMotion, flights.length, target),
      )
    }

    timeoutRef.current = window.setTimeout(schedule, randomBetween(1800, 4200))

    return () => {
      cancelled = true
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current)
    }
  }, [skyPhase, isMobile, reducedMotion, starsOpacity, flights.length])

  if (!ACTIVE_PHASES.includes(skyPhase) || (reducedMotion && isMobile)) return null

  return (
    <div className="absolute inset-0 z-[5] overflow-hidden pointer-events-none">
      {flights.map(flight => {
        const fill = flight.species === 'pelican' ? '#2b3844' : '#31404d'
        const startX = flight.direction === 'ltr' ? '-18vw' : '102vw'
        const bankStyle: CSSProperties = {
          transformOrigin: '50% 50%',
          ['--bird-bank-tilt' as string]: `${flight.bankTilt}deg`,
        }

        if (!reducedMotion) {
          bankStyle.animation =
            flight.bankIterations === 'infinite'
              ? `${flight.bankName} ${flight.bankDuration}s ease-in-out ${flight.bankDelay}s infinite`
              : `${flight.bankName} ${flight.bankDuration}s cubic-bezier(0.28, 0.06, 0.18, 1) forwards`
        }

        const bodyStyle: CSSProperties = {}
        if (!reducedMotion && flight.bodyName) {
          bodyStyle.animation = `${flight.bodyName} ${flight.duration}s cubic-bezier(0.28, 0.06, 0.18, 1) forwards`
          bodyStyle.transformOrigin = '50% 50%'
        }

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
            onAnimationEnd={() => setFlights(current => current.filter(item => item.id !== flight.id))}
          >
            <div
              className="h-full w-full will-change-transform"
              style={{
                animation: `${flight.pathName} ${flight.duration}s ${flight.pathTiming} forwards`,
              }}
            >
              <div className="h-full w-full will-change-transform" style={bankStyle}>
                <div className="h-full w-full will-change-transform" style={bodyStyle}>
                  {flight.members.map(member => (
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
          </div>
        )
      })}
    </div>
  )
}
