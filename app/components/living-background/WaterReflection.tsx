'use client'

import { useId } from 'react'
import type { SkyPhase } from '../../lib/sky-phases'

interface WaterReflectionProps {
  reflectionColor: string
  skyBottom: string
  skyPhase: SkyPhase
  sunX: number
  sunAltitude: number
  sunColor: string
  moonX: number
  moonAltitude: number
  moonVisible: boolean
  moonGlowColor: string
  windSpeed?: number
  cloudCoverage?: number
  quality?: 'high' | 'low'
  reducedMotion?: boolean
}

interface WaveLine {
  baseline: number
  amplitude: number
  frequency: number
  phase: number
  strokeWidth: number
  reflectionSpread: number
  depth: number
  perspectiveInset: number
  irregularity: number
  skew: number
  splashX: number
  splashWidth: number
  splashLift: number
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function toRgb(hex: string): { r: number; g: number; b: number } {
  if (!hex.startsWith('#') || hex.length < 7) return { r: 255, g: 255, b: 255 }
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  }
}

function alpha(hex: string, opacity: number): string {
  const { r, g, b } = toRgb(hex)
  return `rgba(${r}, ${g}, ${b}, ${opacity})`
}

function isWarmSky(skyBottom: string): boolean {
  if (!skyBottom.startsWith('#') || skyBottom.length < 7) return false
  const r = parseInt(skyBottom.slice(1, 3), 16)
  const g = parseInt(skyBottom.slice(3, 5), 16)
  return r > 150 && r > g * 1.3
}

function noise(seed: number): number {
  const value = Math.sin(seed * 12.9898) * 43758.5453
  return value - Math.floor(value)
}

function buildWavePath(line: WaveLine, phaseOffset = 0, amplitudeScale = 1, verticalShift = 0): string {
  const points: Array<{ x: number; y: number }> = []
  const amplitude = line.amplitude * amplitudeScale
  const phase = line.phase + phaseOffset
  const startX = -120 + line.perspectiveInset
  const endX = 1120 - line.perspectiveInset
  const step = 52 + (1 - line.depth) * 16

  for (let x = startX; x <= endX; x += step) {
    const nx = x / 1000
    const progress = (x - startX) / Math.max(endX - startX, 1)
    const centered = progress - 0.5
    const widthEnvelope = 1 - Math.min(Math.abs(centered) * 1.55, 0.72)
    const perspectiveWarp = centered * line.skew * (1 - line.depth) * 42
    const y =
      line.baseline +
      verticalShift +
      Math.sin(nx * Math.PI * line.frequency + phase) * amplitude +
      Math.sin(nx * Math.PI * (line.frequency * 0.45) + phase * 1.7) * amplitude * 0.45 +
      Math.sin(nx * Math.PI * (line.frequency * 1.9) + phase * 0.65) * amplitude * 0.18 * line.irregularity +
      Math.cos(progress * Math.PI * 6 + phase * 0.8) * amplitude * 0.12 * line.irregularity * widthEnvelope

    points.push({ x: x + perspectiveWarp, y })
  }

  let path = `M ${points[0].x} ${points[0].y}`
  for (let i = 1; i < points.length - 1; i += 1) {
    const current = points[i]
    const next = points[i + 1]
    const midX = (current.x + next.x) / 2
    const midY = (current.y + next.y) / 2
    path += ` Q ${current.x} ${current.y} ${midX} ${midY}`
  }

  const last = points[points.length - 1]
  path += ` T ${last.x} ${last.y}`
  return path
}

function buildWaveLines(lineCount: number, windFactor: number): WaveLine[] {
  return Array.from({ length: lineCount }, (_, index) => {
    const t = index / Math.max(lineCount - 1, 1)
    const depth = Math.pow(t, 1.42)
    const seed = index + 1
    const variance = noise(seed)
    const sideBias = noise(seed * 1.7 + 9) > 0.5 ? 1 : -1

    return {
      baseline: 18 + depth * 214,
      amplitude: 1.6 + depth * 7.2 + windFactor * 2.4 + variance * 0.8,
      frequency: 4.6 + depth * 2.4 + variance * 0.9,
      phase: 0.38 + depth * 1.24 + variance * 0.9,
      strokeWidth: 0.68 + depth * 1.25,
      reflectionSpread: 0.035 + depth * 0.12,
      depth,
      perspectiveInset: (1 - depth) * 210,
      irregularity: 0.7 + variance * 0.9,
      skew: sideBias * (0.7 + noise(seed * 2.4 + 3) * 0.7),
      splashX: 180 + depth * 560 + sideBias * 90 * (0.35 + variance),
      splashWidth: 26 + depth * 30 + variance * 12,
      splashLift: 4 + depth * 8 + variance * 4,
    }
  })
}

function buildSplashPath(line: WaveLine): string {
  const startX = line.splashX - line.splashWidth
  const endX = line.splashX + line.splashWidth
  const midX = line.splashX
  const baseY = line.baseline - line.splashLift

  return `M ${startX} ${baseY} Q ${midX - line.splashWidth * 0.3} ${baseY - line.splashLift * 0.75} ${midX} ${baseY - line.splashLift} Q ${midX + line.splashWidth * 0.3} ${baseY - line.splashLift * 0.75} ${endX} ${baseY}`
}

function buildReflectionStops(center: number, spread: number, color: string, strength: number) {
  const startOuter = clamp(center - spread, 0, 1) * 100
  const startInner = clamp(center - spread * 0.45, 0, 1) * 100
  const centerStop = clamp(center, 0, 1) * 100
  const endInner = clamp(center + spread * 0.45, 0, 1) * 100
  const endOuter = clamp(center + spread, 0, 1) * 100

  return [
    { offset: '0%', color: alpha(color, 0) },
    { offset: `${startOuter}%`, color: alpha(color, 0) },
    { offset: `${startInner}%`, color: alpha(color, strength * 0.28) },
    { offset: `${centerStop}%`, color: alpha(color, strength) },
    { offset: `${endInner}%`, color: alpha(color, strength * 0.28) },
    { offset: `${endOuter}%`, color: alpha(color, 0) },
    { offset: '100%', color: alpha(color, 0) },
  ]
}

export default function WaterReflection({
  reflectionColor,
  skyBottom,
  skyPhase,
  sunX,
  sunAltitude,
  sunColor,
  moonX,
  moonAltitude,
  moonVisible,
  moonGlowColor,
  windSpeed = 8,
  cloudCoverage = 0,
  quality = 'high',
  reducedMotion = false,
}: WaterReflectionProps) {
  const gradientId = useId().replace(/:/g, '')
  const warm = isWarmSky(skyBottom)
  const isNight = sunAltitude < -6
  const windFactor = clamp(windSpeed / 20, 0, 1)
  const cloudSoftener = 1 - clamp(cloudCoverage / 120, 0, 0.6)
  const lineCount = quality === 'high' && !reducedMotion ? 8 : 6
  const waveLines = buildWaveLines(lineCount, windFactor)
  const splashLines = waveLines.filter((line, index) => index > 1 && index < waveLines.length - 1 && index % 2 === 1)
  const showSunReflection = sunAltitude > -2
  const showMoonReflection = moonVisible && moonAltitude > 0 && sunAltitude < 3
  const sunCenter = clamp(sunX / 100, 0.05, 0.95)
  const moonCenter = clamp(moonX / 100, 0.05, 0.95)
  const baseStroke = warm
    ? alpha('#d5c1a2', isNight ? 0.12 : 0.18)
    : alpha('#aabfd1', isNight ? 0.14 : 0.18)
  const secondaryStroke = warm
    ? alpha('#8a7b67', 0.16)
    : alpha('#72879b', 0.16)
  const topGlow = skyPhase === 'sunset' || skyPhase === 'goldenEvening'
    ? alpha(sunColor, 0.16 * cloudSoftener)
    : isNight
      ? alpha(moonGlowColor, 0.08 * cloudSoftener)
      : alpha(skyBottom, 0.08)
  const motion = (name: string, duration: string, timing = 'ease-in-out', extras = 'infinite alternate') =>
    reducedMotion ? 'none' : `${name} ${duration} ${timing} ${extras}`

  return (
    <div
      className="absolute bottom-0 left-0 right-0 h-[18vh] z-[4] overflow-hidden"
      style={{
        animation: motion('wave-breathe', '6s'),
        transformOrigin: 'bottom',
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(180deg,
            ${alpha(reflectionColor, 0.22)} 0%,
            ${alpha(reflectionColor, 0.58)} 24%,
            ${alpha(reflectionColor, 0.82)} 58%,
            ${reflectionColor} 100%)`,
        }}
      />

      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(180deg, ${topGlow} 0%, ${alpha(skyBottom, 0.02)} 34%, transparent 66%)`,
        }}
      />

      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(180deg,
            ${alpha('#08111a', 0.2)} 0%,
            transparent 28%,
            transparent 72%,
            ${alpha('#071018', 0.16)} 100%),
            radial-gradient(ellipse 68% 50% at 50% 18%, transparent 0%, transparent 48%, ${alpha('#050b12', 0.18)} 100%)`,
        }}
      />

      {showSunReflection && (
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse 24vw 11vh at ${sunX}% 0%, ${alpha(sunColor, 0.26 * cloudSoftener)} 0%, ${alpha(sunColor, 0.14 * cloudSoftener)} 34%, transparent 74%)`,
            filter: 'blur(7px)',
            opacity: 1,
          }}
        />
      )}

      {showMoonReflection && (
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse 16vw 8vh at ${moonX}% 0%, ${alpha(moonGlowColor, 0.22 * cloudSoftener)} 0%, ${alpha(moonGlowColor, 0.08 * cloudSoftener)} 32%, transparent 70%)`,
            filter: 'blur(8px)',
            opacity: 0.9,
          }}
        />
      )}

      <svg
        aria-hidden="true"
        className="absolute top-0 bottom-0 left-[-10%] h-full w-[120%] max-w-none"
        preserveAspectRatio="none"
        viewBox="0 0 1000 260"
      >
        <defs>
          {waveLines.map((line, index) => (
            <linearGradient
              id={`${gradientId}-sun-${index}`}
              key={`${gradientId}-sun-${index}`}
              x1="0%"
              y1="0%"
              x2="100%"
              y2="0%"
            >
              {buildReflectionStops(sunCenter, line.reflectionSpread, sunColor, 0.7 * cloudSoftener).map((stop, stopIndex) => (
                <stop key={`${gradientId}-sun-${index}-${stopIndex}`} offset={stop.offset} stopColor={stop.color} />
              ))}
            </linearGradient>
          ))}
          {waveLines.map((line, index) => (
            <linearGradient
              id={`${gradientId}-moon-${index}`}
              key={`${gradientId}-moon-${index}`}
              x1="0%"
              y1="0%"
              x2="100%"
              y2="0%"
            >
              {buildReflectionStops(moonCenter, line.reflectionSpread * 0.52, moonGlowColor, 0.55 * cloudSoftener).map((stop, stopIndex) => (
                <stop key={`${gradientId}-moon-${index}-${stopIndex}`} offset={stop.offset} stopColor={stop.color} />
              ))}
            </linearGradient>
          ))}
        </defs>

        <g
          style={{
            animation: motion('ripple-shift-a', '4.5s', 'linear'),
            transformBox: 'fill-box',
            transformOrigin: 'center',
          }}
        >
          {waveLines.map((line, index) => (
            <path
              key={`base-${index}`}
              d={buildWavePath(line)}
              fill="none"
              stroke={index % 2 === 0 ? baseStroke : secondaryStroke}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeOpacity={0.46 + index / (lineCount * 2.4)}
              strokeWidth={line.strokeWidth}
            />
          ))}
        </g>

        <g
          style={{
            animation: motion('ripple-shift-b', '6s', 'linear'),
            opacity: 0.76,
            transformBox: 'fill-box',
            transformOrigin: 'center',
          }}
        >
          {waveLines.slice(1).map((line, index) => (
            <path
              key={`echo-${index}`}
              d={buildWavePath({
                ...line,
                baseline: line.baseline + 3.5,
              })}
              fill="none"
              stroke={index % 2 === 0 ? alpha('#20313f', 0.42) : alpha('#d7e0ea', 0.08)}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={Math.max(0.7, line.strokeWidth - 0.1)}
            />
          ))}
        </g>

        <g
          style={{
            animation: motion('ripple-shift-c', '3.5s', 'ease-in-out'),
            opacity: 0.5,
            transformBox: 'fill-box',
            transformOrigin: 'center',
          }}
        >
          {waveLines.slice(2).map((line, index) => (
            <path
              key={`crest-${index}`}
              d={buildWavePath(line, 0.2, 0.72, -2)}
              fill="none"
              stroke={alpha('#f7f3ea', warm ? 0.1 : 0.08)}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={Math.max(0.6, line.strokeWidth - 0.25)}
            />
          ))}
        </g>

        <g
          style={{
            animation: motion('ripple-shift-b', '3.2s', 'ease-in-out'),
            opacity: 0.55,
            transformBox: 'fill-box',
            transformOrigin: 'center',
          }}
        >
          {splashLines.map((line, index) => (
            <path
              key={`splash-${index}`}
              d={buildSplashPath(line)}
              fill="none"
              stroke={alpha('#f5efe6', warm ? 0.16 : 0.12)}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={Math.max(0.85, line.strokeWidth - 0.25)}
            />
          ))}
        </g>

        {showSunReflection && (
          <g
            style={{
              animation: motion('reflection-shimmer', '2.2s', 'ease-in-out'),
              transformBox: 'fill-box',
              transformOrigin: 'center',
            }}
          >
            {waveLines.map((line, index) => (
              <path
                key={`sun-${index}`}
                d={buildWavePath(line)}
                fill="none"
                stroke={`url(#${gradientId}-sun-${index})`}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={line.strokeWidth + 0.65}
                strokeOpacity={1}
              />
            ))}
          </g>
        )}

        {showMoonReflection && (
          <g
            style={{
              animation: motion('reflection-shimmer', '2.8s', 'ease-in-out'),
              transformBox: 'fill-box',
              transformOrigin: 'center',
            }}
          >
            {waveLines.map((line, index) => (
              <path
                key={`moon-${index}`}
                d={buildWavePath({
                  ...line,
                })}
                fill="none"
                stroke={`url(#${gradientId}-moon-${index})`}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={line.strokeWidth + 0.38}
                strokeOpacity={1}
              />
            ))}
          </g>
        )}
      </svg>

      <div
        className="absolute inset-x-0 bottom-0 h-[26%]"
        style={{
          background: 'linear-gradient(180deg, transparent 0%, rgba(2, 4, 7, 0.24) 42%, rgba(2, 3, 6, 0.45) 100%)',
        }}
      />
    </div>
  )
}
