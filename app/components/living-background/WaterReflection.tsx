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

function buildWavePath(line: WaveLine): string {
  const points: Array<{ x: number; y: number }> = []

  for (let x = -80; x <= 1080; x += 70) {
    const nx = x / 1000
    const y =
      line.baseline +
      Math.sin(nx * Math.PI * line.frequency + line.phase) * line.amplitude +
      Math.sin(nx * Math.PI * (line.frequency * 0.45) + line.phase * 1.7) * line.amplitude * 0.45

    points.push({ x, y })
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

    return {
      baseline: 30 + t * 200,
      amplitude: 2 + t * 4.5 + windFactor * 2.2,
      frequency: 5.4 + t * 2.8,
      phase: 0.45 + t * 1.12,
      strokeWidth: 0.9 + t * 0.7,
      reflectionSpread: 0.06 + t * 0.11,
    }
  })
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
  const lineCount = quality === 'high' && !reducedMotion ? 15 : 11
  const waveLines = buildWaveLines(lineCount, windFactor)
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
        animation: motion('wave-breathe', '11s'),
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

      {showSunReflection && (
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse 20vw 9vh at ${sunX}% 0%, ${alpha(sunColor, 0.16 * cloudSoftener)} 0%, ${alpha(sunColor, 0.07 * cloudSoftener)} 36%, transparent 74%)`,
            filter: 'blur(6px)',
            opacity: 0.9,
          }}
        />
      )}

      {showMoonReflection && (
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse 12vw 7vh at ${moonX}% 0%, ${alpha(moonGlowColor, 0.14 * cloudSoftener)} 0%, ${alpha(moonGlowColor, 0.05 * cloudSoftener)} 32%, transparent 70%)`,
            filter: 'blur(7px)',
            opacity: 0.75,
          }}
        />
      )}

      <svg
        aria-hidden="true"
        className="absolute inset-0 h-full w-full"
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

        <g style={{ animation: motion('engrave-drift', '24s', 'linear', 'infinite') }}>
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
            animation: motion('engrave-drift-reverse', '31s', 'linear', 'infinite'),
            opacity: 0.72,
          }}
        >
          {waveLines.slice(1).map((line, index) => (
            <path
              key={`echo-${index}`}
              d={buildWavePath({
                ...line,
                baseline: line.baseline + 3.5,
                phase: line.phase + 0.9,
                amplitude: line.amplitude * 0.82,
              })}
              fill="none"
              stroke={index % 2 === 0 ? alpha('#20313f', 0.42) : alpha('#d7e0ea', 0.08)}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={Math.max(0.7, line.strokeWidth - 0.1)}
            />
          ))}
        </g>

        {showSunReflection && (
          <g style={{ animation: motion('reflection-flicker-subtle', '8s') }}>
            {waveLines.map((line, index) => (
              <path
                key={`sun-${index}`}
                d={buildWavePath(line)}
                fill="none"
                stroke={`url(#${gradientId}-sun-${index})`}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={line.strokeWidth + 0.35}
              />
            ))}
          </g>
        )}

        {showMoonReflection && (
          <g style={{ animation: motion('reflection-flicker-subtle', '10s') }}>
            {waveLines.map((line, index) => (
              <path
                key={`moon-${index}`}
                d={buildWavePath({
                  ...line,
                  phase: line.phase + 0.25,
                  amplitude: line.amplitude * 0.9,
                })}
                fill="none"
                stroke={`url(#${gradientId}-moon-${index})`}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={line.strokeWidth + 0.18}
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
