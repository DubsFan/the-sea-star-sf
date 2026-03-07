'use client'

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

function isWarmSky(skyBottom: string): boolean {
  if (!skyBottom.startsWith('#') || skyBottom.length < 7) return false
  const r = parseInt(skyBottom.slice(1, 3), 16)
  const g = parseInt(skyBottom.slice(3, 5), 16)
  return r > 150 && r > g * 1.3
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
  const warm = isWarmSky(skyBottom)
  const isDay = sunAltitude > 0
  const isNight = sunAltitude < -6
  const windFactor = clamp(windSpeed / 18, 0, 1)
  const cloudSoftener = 1 - clamp(cloudCoverage / 130, 0, 0.65)
  const highQuality = quality === 'high' && !reducedMotion
  const showSunReflection = sunAltitude > -2
  const showMoonReflection = moonVisible && moonAltitude > 0 && sunAltitude < 3

  const sunReflectionOpacity = (
    sunAltitude <= 0
      ? 0.12
      : sunAltitude < 3 ? 0.36
      : sunAltitude < 8 ? 0.24
      : sunAltitude < 20 ? 0.15
      : 0.09
  ) * cloudSoftener

  const sunReflectionWidth = sunAltitude < 5 ? 24 : sunAltitude < 15 ? 18 : 12
  const moonReflectionOpacity = (0.1 + clamp(moonAltitude / 50, 0, 0.12)) * cloudSoftener
  const waveLineOpacity = isNight ? 0.12 : isDay ? 0.16 : 0.14
  const surfaceTopGlow = skyPhase === 'sunset' || skyPhase === 'goldenEvening' ? 0.18 : isNight ? 0.08 : 0.12
  const motion = (name: string, duration: string, timing = 'ease-in-out', extras = 'infinite alternate') =>
    reducedMotion ? 'none' : `${name} ${duration} ${timing} ${extras}`

  return (
    <div
      className="absolute bottom-0 left-0 right-0 h-[18vh] z-[4] overflow-hidden"
      style={{
        animation: motion('wave-breathe', '10s'),
        transformOrigin: 'bottom',
      }}
    >
      <svg aria-hidden="true" className="absolute h-0 w-0">
        <defs>
          <filter id="water-distortion-filter">
            <feTurbulence
              type="fractalNoise"
              baseFrequency={highQuality ? '0.008 0.05' : '0.012 0.07'}
              numOctaves="2"
              seed="7"
              result="noise"
            >
              {highQuality && (
                <animate
                  attributeName="baseFrequency"
                  dur="16s"
                  values="0.008 0.05;0.011 0.065;0.008 0.05"
                  repeatCount="indefinite"
                />
              )}
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="noise" scale={highQuality ? 24 : 12} xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>

      {/* Deep water base */}
      <div
        className="absolute inset-0 transition-all duration-[120000ms] ease-linear"
        style={{
          background: `linear-gradient(180deg,
            ${alpha(reflectionColor, 0.42)} 0%,
            ${alpha(reflectionColor, 0.78)} 22%,
            ${alpha(reflectionColor, 0.92)} 56%,
            ${reflectionColor} 100%)`,
        }}
      />

      {/* Horizon sheen */}
      <div
        className="absolute inset-0 transition-all duration-[120000ms] ease-linear"
        style={{
          background: `linear-gradient(180deg, ${alpha(skyBottom, surfaceTopGlow)} 0%, ${alpha(skyBottom, 0.07)} 32%, transparent 65%)`,
        }}
      />

      {/* Surface normal illusion */}
      <div
        className="absolute inset-0"
        style={{
          opacity: waveLineOpacity,
          background: `repeating-linear-gradient(
            178deg,
            transparent 0 4px,
            rgba(255,255,255,0.12) 4px 5px,
            transparent 5px 12px
          )`,
          backgroundSize: highQuality ? '220% 130%' : '180% 100%',
          animation: motion('surface-swell', highQuality ? '22s' : '30s', 'linear', 'infinite'),
        }}
      />

      <div
        className="absolute inset-0"
        style={{
          opacity: isNight ? 0.08 : 0.12,
          background: `repeating-linear-gradient(
            92deg,
            transparent 0 42px,
            rgba(255,255,255,0.06) 42px 44px,
            transparent 44px 92px
          )`,
          animation: motion('wave-drift', '24s', 'linear', 'infinite'),
        }}
      />

      {/* Distorted editorial shimmer */}
      <div
        className="absolute inset-0"
        style={{
          opacity: isNight ? 0.12 : 0.18 * cloudSoftener,
          background: `linear-gradient(165deg,
            transparent 18%,
            rgba(255,255,255,0.06) 34%,
            rgba(255,255,255,0.18) 48%,
            rgba(255,255,255,0.08) 58%,
            transparent 74%)`,
          backgroundSize: '260% 100%',
          filter: highQuality ? 'url(#water-distortion-filter)' : undefined,
          animation: motion('specular-scan', highQuality ? '12s' : '18s'),
        }}
      />

      {/* Counter-glint band */}
      <div
        className="absolute inset-0"
        style={{
          opacity: isNight ? 0.09 : 0.13,
          background: `linear-gradient(192deg,
            transparent 24%,
            rgba(255,255,255,0.09) 46%,
            rgba(255,255,255,0.03) 58%,
            transparent 78%)`,
          backgroundSize: '240% 100%',
          animation: motion('specular-scan', highQuality ? '16s' : '22s', 'ease-in-out', 'infinite alternate-reverse'),
        }}
      />

      {/* Sun reflection column */}
      {showSunReflection && (
        <div
          className="absolute top-0 bottom-0"
          style={{
            left: `${sunX - sunReflectionWidth / 2}%`,
            width: `${sunReflectionWidth}vw`,
            filter: highQuality ? 'url(#water-distortion-filter)' : undefined,
          }}
        >
          <div
            className="absolute inset-0"
            style={{
              opacity: sunReflectionOpacity,
              background: `linear-gradient(180deg,
                ${alpha(sunColor, 0.8)} 0%,
                ${alpha(sunColor, 0.46)} 14%,
                ${alpha(sunColor, 0.2)} 34%,
                ${alpha(sunColor, 0.12)} 58%,
                transparent 100%)`,
              maskImage: 'linear-gradient(180deg, transparent 0%, black 16%, black 100%)',
              animation: motion('reflection-breakup', '7s'),
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              opacity: sunReflectionOpacity * 0.92,
              background: `
                radial-gradient(ellipse 18px 4px at 28% 16%, ${alpha(sunColor, 0.92)} 0%, transparent 100%),
                radial-gradient(ellipse 12px 3px at 58% 24%, ${alpha(sunColor, 0.85)} 0%, transparent 100%),
                radial-gradient(ellipse 22px 5px at 35% 38%, ${alpha(sunColor, 0.72)} 0%, transparent 100%),
                radial-gradient(ellipse 16px 4px at 62% 52%, ${alpha(sunColor, 0.58)} 0%, transparent 100%),
                radial-gradient(ellipse 12px 3px at 40% 66%, ${alpha(sunColor, 0.42)} 0%, transparent 100%),
                radial-gradient(ellipse 20px 4px at 54% 82%, ${alpha(sunColor, 0.32)} 0%, transparent 100%)
              `,
              animation: motion('reflection-breakup', '5s'),
            }}
          />
        </div>
      )}

      {/* Moon reflection column */}
      {showMoonReflection && (
        <div
          className="absolute top-0 bottom-0"
          style={{
            left: `${moonX - 4}%`,
            width: '8vw',
            filter: highQuality ? 'url(#water-distortion-filter)' : undefined,
          }}
        >
          <div
            className="absolute inset-0"
            style={{
              opacity: moonReflectionOpacity,
              background: `linear-gradient(180deg,
                ${alpha(moonGlowColor, 0.48)} 0%,
                ${alpha(moonGlowColor, 0.24)} 24%,
                ${alpha(moonGlowColor, 0.12)} 52%,
                transparent 100%)`,
              animation: motion('moon-glint', '9s'),
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              opacity: moonReflectionOpacity * 0.9,
              background: `
                radial-gradient(ellipse 12px 3px at 50% 20%, ${alpha(moonGlowColor, 0.6)} 0%, transparent 100%),
                radial-gradient(ellipse 10px 3px at 40% 38%, ${alpha(moonGlowColor, 0.45)} 0%, transparent 100%),
                radial-gradient(ellipse 14px 3px at 56% 60%, ${alpha(moonGlowColor, 0.36)} 0%, transparent 100%),
                radial-gradient(ellipse 10px 2px at 48% 82%, ${alpha(moonGlowColor, 0.26)} 0%, transparent 100%)
              `,
              animation: motion('reflection-breakup', '6s'),
            }}
          />
        </div>
      )}

      {/* Night: ambient moonlight/starlight sparkle on water */}
      {isNight && (
        <>
          <div
            className="absolute inset-0"
            style={{
              opacity: 0.18,
              background: `linear-gradient(180deg,
                rgba(180,190,220,0.18) 0%,
                rgba(140,150,180,0.09) 40%,
                transparent 80%)`,
              animation: motion('specular-scan', '14s'),
              backgroundSize: '200% 100%',
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              opacity: 0.22,
              background: `
                radial-gradient(ellipse 12px 4px at 10% 25%, rgba(200,196,184,0.5) 0%, transparent 100%),
                radial-gradient(ellipse 8px 3px at 25% 55%, rgba(200,196,184,0.4) 0%, transparent 100%),
                radial-gradient(ellipse 15px 5px at 40% 20%, rgba(200,196,184,0.45) 0%, transparent 100%),
                radial-gradient(ellipse 10px 4px at 55% 45%, rgba(200,196,184,0.4) 0%, transparent 100%),
                radial-gradient(ellipse 12px 4px at 70% 30%, rgba(200,196,184,0.5) 0%, transparent 100%),
                radial-gradient(ellipse 8px 3px at 85% 50%, rgba(200,196,184,0.35) 0%, transparent 100%),
                radial-gradient(ellipse 10px 4px at 95% 20%, rgba(200,196,184,0.4) 0%, transparent 100%)
              `,
              animation: motion('sparkle-dance', '6s'),
            }}
          />
        </>
      )}

      {/* Caustic light dapples during daytime */}
      {isDay && (
        <div
          className="absolute inset-0"
          style={{
            opacity: 0.12,
            background: `
              radial-gradient(ellipse 60px 25px at 15% 50%, rgba(255,255,255,0.08) 0%, transparent 70%),
              radial-gradient(ellipse 45px 20px at 45% 35%, rgba(255,255,255,0.06) 0%, transparent 70%),
              radial-gradient(ellipse 70px 30px at 75% 55%, rgba(255,255,255,0.07) 0%, transparent 70%),
              radial-gradient(ellipse 50px 22px at 90% 40%, rgba(255,255,255,0.05) 0%, transparent 70%)
            `,
            animation: motion('caustic-shift', '10s'),
          }}
        />
      )}

      {/* Warm golden sparkles at sunset */}
      {warm && (
        <div
          className="absolute inset-0"
          style={{
            opacity: 0.18 * cloudSoftener,
            background: `
              radial-gradient(ellipse 30px 12px at 25% 30%, rgba(255,180,60,0.35) 0%, transparent 70%),
              radial-gradient(ellipse 40px 15px at 50% 45%, rgba(255,160,40,0.3) 0%, transparent 70%),
              radial-gradient(ellipse 25px 10px at 70% 25%, rgba(255,200,80,0.25) 0%, transparent 70%),
              radial-gradient(ellipse 35px 14px at 85% 55%, rgba(255,170,50,0.2) 0%, transparent 70%)
            `,
            animation: motion('sparkle-dance', '7s'),
          }}
        />
      )}

      {/* Dark shoreline weight at the bottom edge */}
      <div
        className="absolute inset-x-0 bottom-0 h-[22%]"
        style={{
          background: 'linear-gradient(180deg, transparent 0%, rgba(3, 5, 8, 0.22) 40%, rgba(2, 3, 6, 0.4) 100%)',
        }}
      />
    </div>
  )
}
