'use client'

interface WaterReflectionProps {
  reflectionColor: string
  skyBottom: string
  sunX: number
  sunAltitude: number
  sunColor: string
}

function isWarmSky(skyBottom: string): boolean {
  if (!skyBottom.startsWith('#') || skyBottom.length < 7) return false
  const r = parseInt(skyBottom.slice(1, 3), 16)
  const g = parseInt(skyBottom.slice(3, 5), 16)
  return r > 150 && r > g * 1.3
}

export default function WaterReflection({ reflectionColor, skyBottom, sunX, sunAltitude, sunColor }: WaterReflectionProps) {
  const warm = isWarmSky(skyBottom)
  const isDay = sunAltitude > 0
  const isNight = sunAltitude < -6
  const showSunReflection = sunAltitude > -1

  const reflectionOpacity = sunAltitude <= 0
    ? 0.06
    : sunAltitude < 3 ? 0.3
    : sunAltitude < 8 ? 0.2
    : sunAltitude < 20 ? 0.12
    : 0.07

  const reflectionWidth = sunAltitude < 5 ? 20 : sunAltitude < 15 ? 14 : 10

  return (
    <div
      className="absolute bottom-0 left-0 right-0 h-[16vh] z-[4] overflow-hidden"
      style={{ animation: 'wave-breathe 8s ease-in-out infinite', transformOrigin: 'bottom' }}
    >
      {/* Deep water base */}
      <div
        className="absolute inset-0 transition-all duration-[120000ms] ease-linear"
        style={{
          background: `linear-gradient(180deg,
            ${reflectionColor}88 0%,
            ${reflectionColor}cc 25%,
            ${reflectionColor}ee 50%,
            ${reflectionColor} 100%)`,
        }}
      />

      {/* Sky reflection on surface */}
      <div
        className="absolute inset-0 transition-all duration-[120000ms] ease-linear"
        style={{
          background: `linear-gradient(180deg, ${skyBottom}30 0%, ${skyBottom}10 30%, transparent 60%)`,
        }}
      />

      {/* Sun reflection column */}
      {showSunReflection && (
        <div
          className="absolute top-0 bottom-0"
          style={{
            left: `${sunX - reflectionWidth / 2}%`,
            width: `${reflectionWidth}vw`,
          }}
        >
          <div
            className="absolute inset-0"
            style={{
              opacity: reflectionOpacity,
              background: `linear-gradient(180deg,
                ${sunColor}80 0%,
                ${sunColor}50 20%,
                ${sunColor}30 40%,
                ${sunColor}15 70%,
                transparent 100%)`,
              animation: 'water-shimmer 5s ease-in-out infinite alternate',
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              opacity: reflectionOpacity * 0.6,
              background: `
                radial-gradient(ellipse 8px 3px at 30% 15%, ${sunColor}90 0%, transparent 100%),
                radial-gradient(ellipse 6px 2px at 55% 25%, ${sunColor}80 0%, transparent 100%),
                radial-gradient(ellipse 10px 3px at 40% 40%, ${sunColor}70 0%, transparent 100%),
                radial-gradient(ellipse 7px 2px at 60% 55%, ${sunColor}60 0%, transparent 100%),
                radial-gradient(ellipse 5px 2px at 35% 70%, ${sunColor}40 0%, transparent 100%)
              `,
              animation: 'sparkle-dance 4s ease-in-out infinite alternate',
            }}
          />
        </div>
      )}

      {/* Ambient light shimmer — ALWAYS visible */}
      <div
        className="absolute inset-0"
        style={{
          opacity: isNight ? 0.18 : isDay ? 0.15 : 0.12,
          background: `repeating-linear-gradient(
            2deg,
            transparent,
            transparent 6px,
            rgba(255,255,255,0.12) 6px,
            rgba(255,255,255,0.12) 7px
          )`,
          animation: 'wave-drift 25s linear infinite',
          backgroundSize: '200% 100%',
        }}
      />

      {/* Shimmer sweep */}
      <div
        className="absolute inset-0"
        style={{
          opacity: isNight ? 0.15 : 0.18,
          background: 'linear-gradient(170deg, transparent 35%, rgba(255,255,255,0.12) 50%, transparent 65%)',
          backgroundSize: '250% 100%',
          animation: 'water-shimmer 10s ease-in-out infinite alternate',
        }}
      />

      {/* Counter-shimmer */}
      <div
        className="absolute inset-0"
        style={{
          opacity: isNight ? 0.1 : 0.12,
          background: 'linear-gradient(190deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%)',
          backgroundSize: '300% 100%',
          animation: 'water-shimmer 14s ease-in-out infinite alternate-reverse',
        }}
      />

      {/* Horizontal ripple lines */}
      <div
        className="absolute inset-0"
        style={{
          background: `repeating-linear-gradient(90deg,
            transparent,
            transparent 80px,
            rgba(255,255,255,0.04) 80px,
            rgba(255,255,255,0.04) 81px)`,
          animation: 'wave-drift 18s linear infinite',
        }}
      />

      {/* Night: ambient moonlight/starlight sparkle on water */}
      {isNight && (
        <>
          {/* Broad ambient glow — city light / starlight reflection */}
          <div
            className="absolute inset-0"
            style={{
              opacity: 0.2,
              background: `linear-gradient(180deg,
                rgba(180,190,220,0.15) 0%,
                rgba(140,150,180,0.08) 40%,
                transparent 80%)`,
              animation: 'water-shimmer 12s ease-in-out infinite alternate',
              backgroundSize: '200% 100%',
            }}
          />
          {/* Scattered light sparkles on water */}
          <div
            className="absolute inset-0"
            style={{
              opacity: 0.25,
              background: `
                radial-gradient(ellipse 12px 4px at 10% 25%, rgba(200,196,184,0.5) 0%, transparent 100%),
                radial-gradient(ellipse 8px 3px at 25% 55%, rgba(200,196,184,0.4) 0%, transparent 100%),
                radial-gradient(ellipse 15px 5px at 40% 20%, rgba(200,196,184,0.45) 0%, transparent 100%),
                radial-gradient(ellipse 10px 4px at 55% 45%, rgba(200,196,184,0.4) 0%, transparent 100%),
                radial-gradient(ellipse 12px 4px at 70% 30%, rgba(200,196,184,0.5) 0%, transparent 100%),
                radial-gradient(ellipse 8px 3px at 85% 50%, rgba(200,196,184,0.35) 0%, transparent 100%),
                radial-gradient(ellipse 10px 4px at 95% 20%, rgba(200,196,184,0.4) 0%, transparent 100%)
              `,
              animation: 'sparkle-dance 6s ease-in-out infinite alternate',
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
            animation: 'caustic-shift 10s ease-in-out infinite alternate',
          }}
        />
      )}

      {/* Warm golden sparkles at sunset */}
      {warm && (
        <div
          className="absolute inset-0"
          style={{
            opacity: 0.2,
            background: `
              radial-gradient(ellipse 30px 12px at 25% 30%, rgba(255,180,60,0.35) 0%, transparent 70%),
              radial-gradient(ellipse 40px 15px at 50% 45%, rgba(255,160,40,0.3) 0%, transparent 70%),
              radial-gradient(ellipse 25px 10px at 70% 25%, rgba(255,200,80,0.25) 0%, transparent 70%),
              radial-gradient(ellipse 35px 14px at 85% 55%, rgba(255,170,50,0.2) 0%, transparent 70%)
            `,
            animation: 'sparkle-dance 7s ease-in-out infinite alternate',
          }}
        />
      )}
    </div>
  )
}
