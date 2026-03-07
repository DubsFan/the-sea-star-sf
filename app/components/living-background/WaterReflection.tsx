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
  const waveLineOpacity = isNight ? 0.08 : isDay ? 0.12 : 0.1
  const surfaceTopGlow = skyPhase === 'sunset' || skyPhase === 'goldenEvening' ? 0.14 : isNight ? 0.06 : 0.1
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
            ${alpha(reflectionColor, 0.28)} 0%,
            ${alpha(reflectionColor, 0.62)} 20%,
            ${alpha(reflectionColor, 0.86)} 54%,
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
            180deg,
            transparent 0 6px,
            rgba(255,255,255,0.08) 6px 7px,
            transparent 7px 16px
          )`,
          backgroundSize: highQuality ? '160% 115%' : '140% 100%',
          animation: motion('surface-swell', highQuality ? '26s' : '34s', 'linear', 'infinite'),
        }}
      />

      <div
        className="absolute inset-0"
        style={{
          opacity: isNight ? 0.05 : 0.08,
          background: `repeating-linear-gradient(
            180deg,
            transparent 0 18px,
            rgba(255,255,255,0.05) 18px 19px,
            transparent 19px 36px
          )`,
          transform: `translateX(${windFactor * 2 - 1}%)`,
          animation: motion('wave-drift', '36s', 'linear', 'infinite'),
        }}
      />

      {/* Low, narrow crest sheen */}
      <div
        className="absolute inset-0"
        style={{
          opacity: isNight ? 0.04 : 0.08 * cloudSoftener,
          background: `linear-gradient(180deg,
            transparent 0%,
            transparent 28%,
            rgba(255,255,255,0.04) 36%,
            rgba(255,255,255,0.08) 42%,
            rgba(255,255,255,0.03) 48%,
            transparent 62%)`,
          backgroundSize: '100% 140%',
          filter: highQuality ? 'url(#water-distortion-filter)' : undefined,
          animation: motion('specular-scan', highQuality ? '18s' : '24s'),
        }}
      />

      {/* Secondary soft sweep */}
      <div
        className="absolute inset-0"
        style={{
          opacity: isNight ? 0.03 : 0.05,
          background: `linear-gradient(180deg,
            transparent 0%,
            transparent 44%,
            rgba(255,255,255,0.03) 52%,
            transparent 64%)`,
          backgroundSize: '100% 160%',
          animation: motion('specular-scan', highQuality ? '24s' : '30s', 'ease-in-out', 'infinite alternate-reverse'),
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
                ${alpha(sunColor, 0.62)} 0%,
                ${alpha(sunColor, 0.3)} 18%,
                ${alpha(sunColor, 0.12)} 42%,
                ${alpha(sunColor, 0.08)} 62%,
                transparent 100%)`,
              maskImage: `linear-gradient(180deg, transparent 0%, black 14%, black 100%),
                repeating-linear-gradient(
                  180deg,
                  black 0 12px,
                  rgba(0,0,0,0.3) 12px 16px,
                  black 16px 28px,
                  transparent 28px 34px
                )`,
              maskComposite: 'intersect',
              WebkitMaskImage: `linear-gradient(180deg, transparent 0%, black 14%, black 100%),
                repeating-linear-gradient(
                  180deg,
                  black 0 12px,
                  rgba(0,0,0,0.3) 12px 16px,
                  black 16px 28px,
                  transparent 28px 34px
                )`,
              animation: motion('reflection-breakup', '7s'),
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              opacity: sunReflectionOpacity * 0.5,
              background: `repeating-linear-gradient(
                180deg,
                ${alpha(sunColor, 0.5)} 0 2px,
                transparent 2px 12px,
                ${alpha(sunColor, 0.28)} 12px 13px,
                transparent 13px 26px
              )`,
              filter: 'blur(0.4px)',
              animation: motion('reflection-breakup', '8s'),
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
                ${alpha(moonGlowColor, 0.3)} 0%,
                ${alpha(moonGlowColor, 0.16)} 24%,
                ${alpha(moonGlowColor, 0.08)} 52%,
                transparent 100%)`,
              maskImage: `linear-gradient(180deg, transparent 0%, black 16%, black 100%),
                repeating-linear-gradient(
                  180deg,
                  black 0 10px,
                  transparent 10px 16px,
                  black 16px 25px,
                  transparent 25px 34px
                )`,
              WebkitMaskImage: `linear-gradient(180deg, transparent 0%, black 16%, black 100%),
                repeating-linear-gradient(
                  180deg,
                  black 0 10px,
                  transparent 10px 16px,
                  black 16px 25px,
                  transparent 25px 34px
                )`,
              animation: motion('moon-glint', '9s'),
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              opacity: moonReflectionOpacity * 0.35,
              background: `repeating-linear-gradient(
                180deg,
                ${alpha(moonGlowColor, 0.3)} 0 1px,
                transparent 1px 11px,
                ${alpha(moonGlowColor, 0.16)} 11px 12px,
                transparent 12px 23px
              )`,
              filter: 'blur(0.5px)',
              animation: motion('reflection-breakup', '10s'),
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
              opacity: 0.1,
              background: `linear-gradient(180deg,
                rgba(180,190,220,0.1) 0%,
                rgba(140,150,180,0.05) 40%,
                transparent 80%)`,
              animation: motion('specular-scan', '14s'),
              backgroundSize: '200% 100%',
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
            opacity: 0.1 * cloudSoftener,
            background: `
              linear-gradient(180deg, transparent 0%, rgba(255,180,60,0.08) 42%, transparent 64%)
            `,
            animation: motion('specular-scan', '20s'),
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
