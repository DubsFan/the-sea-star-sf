'use client'

interface CelestialBodyProps {
  sunPosition: { x: number; y: number; visible: boolean; altitude: number; color: string; glowSize: number }
  moonPosition: { x: number; y: number; visible: boolean; altitude: number; phase: number; illumination: number; glowColor: string }
}

function getSunSize(altitude: number): number {
  if (altitude > 20) return 120
  if (altitude > 10) return 140
  if (altitude > 5) return 160
  if (altitude > 0) return 180
  return 200
}

function getSunOpacity(altitude: number): number {
  if (altitude > 0) return 1
  if (altitude > -2) return 0.6 + (altitude + 2) * 0.2 // fade from 0.6 to 1
  return 0
}

export default function CelestialBody({ sunPosition, moonPosition }: CelestialBodyProps) {
  const sunSize = getSunSize(sunPosition.altitude)
  const sunOpacity = getSunOpacity(sunPosition.altitude)
  const showHorizonGlow = sunPosition.visible && sunPosition.altitude < 5
  const moonSize = 44 + moonPosition.illumination * 16
  const moonOpacity = moonPosition.visible ? 0.4 + moonPosition.illumination * 0.55 : 0

  // Atmospheric haze ring: bigger and more diffuse near horizon
  const hazeScale = sunPosition.altitude < 5 ? 4 : sunPosition.altitude < 10 ? 3 : 2
  const hazeOpacity = sunPosition.altitude < 0 ? 0.15 : sunPosition.altitude < 5 ? 0.12 : 0.06

  return (
    <div className="absolute inset-0 z-[1]">
      {/* Sun — positioned by SunCalc data */}
      {sunPosition.visible && (
        <div
          className="absolute transition-all duration-[120000ms] ease-linear"
          style={{
            left: `${sunPosition.x}%`,
            top: `${sunPosition.y}%`,
            width: `${sunSize}px`,
            height: `${sunSize}px`,
            transform: 'translate(-50%, -50%)',
            opacity: sunOpacity,
          }}
        >
          {/* Core sun */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: `radial-gradient(circle, ${sunPosition.color} 0%, ${sunPosition.color}88 25%, ${sunPosition.color}44 45%, transparent 70%)`,
              boxShadow: `0 0 ${sunPosition.glowSize * 2}px ${sunPosition.glowSize}px ${sunPosition.color}40,
                          0 0 ${sunPosition.glowSize * 4}px ${sunPosition.glowSize * 2}px ${sunPosition.color}20,
                          0 0 ${sunPosition.glowSize * 6}px ${sunPosition.glowSize * 3}px ${sunPosition.color}10`,
            }}
          />

          {/* Atmospheric haze ring */}
          <div
            className="absolute rounded-full"
            style={{
              top: '50%',
              left: '50%',
              width: `${sunSize * hazeScale}px`,
              height: `${sunSize * hazeScale}px`,
              transform: 'translate(-50%, -50%)',
              background: `radial-gradient(circle, ${sunPosition.color}20 0%, ${sunPosition.color}10 40%, transparent 70%)`,
              animation: 'haze-pulse 6s ease-in-out infinite',
            }}
          />
        </div>
      )}

      {/* Horizon glow band — dramatic sunrise/sunset light */}
      {showHorizonGlow && (
        <div
          className="absolute bottom-[15vh] left-0 right-0 transition-opacity duration-[10000ms] ease-linear"
          style={{
            height: '30vh',
            background: `radial-gradient(ellipse 80vw 15vh at ${sunPosition.x}% 100%, ${sunPosition.color}30 0%, ${sunPosition.color}15 30%, transparent 70%)`,
            opacity: sunPosition.altitude < 0 ? 0.8 : sunPosition.altitude < 2 ? 0.6 : 0.3,
          }}
        />
      )}

      {/* Moon — upper-left, solid with craters */}
      <div
        className="absolute transition-opacity duration-[10000ms] ease-linear"
        style={{
          left: `${moonPosition.x}%`,
          top: `${moonPosition.y}%`,
          width: `${moonSize}px`,
          height: `${moonSize}px`,
          transform: 'translate(-50%, -50%)',
          opacity: moonOpacity,
          filter: `drop-shadow(0 0 10px ${moonPosition.glowColor}33) drop-shadow(0 0 28px ${moonPosition.glowColor}22)`,
        }}
      >
        {/* Moon SVG with surface detail */}
        <svg viewBox="0 0 100 100" width={moonSize} height={moonSize}>
          <defs>
            {/* Moon surface gradient — warm off-white */}
            <radialGradient id="moonSurface" cx="40%" cy="38%" r="55%">
              <stop offset="0%" stopColor="#f0ece0" />
              <stop offset="50%" stopColor="#d4cfc0" />
              <stop offset="85%" stopColor="#b8b0a0" />
              <stop offset="100%" stopColor="#a09888" />
            </radialGradient>
            {/* Outer glow */}
            <radialGradient id="moonGlow" cx="50%" cy="50%" r="50%">
              <stop offset="70%" stopColor="transparent" />
              <stop offset="85%" stopColor={moonPosition.glowColor} stopOpacity="0.22" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
            {/* Phase shadow mask */}
            <clipPath id="moonClip">
              <circle cx="50" cy="50" r="42" />
            </clipPath>
          </defs>

          {/* Glow halo */}
          <circle cx="50" cy="50" r="48" fill="url(#moonGlow)" />

          {/* Moon base */}
          <circle cx="50" cy="50" r="42" fill="url(#moonSurface)" />

          {/* Surface detail — craters (clipped to moon) */}
          <g clipPath="url(#moonClip)" opacity="0.5">
            {/* Large maria (dark areas) */}
            <ellipse cx="38" cy="35" rx="14" ry="12" fill="#a09080" opacity="0.35" />
            <ellipse cx="60" cy="55" rx="10" ry="8" fill="#a09080" opacity="0.25" />
            <ellipse cx="45" cy="60" rx="8" ry="6" fill="#a09080" opacity="0.2" />

            {/* Craters */}
            <circle cx="30" cy="30" r="6" fill="none" stroke="#9a9080" strokeWidth="0.8" opacity="0.5" />
            <circle cx="30" cy="30" r="5.5" fill="#b0a898" opacity="0.2" />

            <circle cx="55" cy="25" r="4" fill="none" stroke="#9a9080" strokeWidth="0.6" opacity="0.4" />
            <circle cx="55" cy="25" r="3.5" fill="#b0a898" opacity="0.15" />

            <circle cx="65" cy="45" r="5" fill="none" stroke="#9a9080" strokeWidth="0.7" opacity="0.45" />
            <circle cx="65" cy="45" r="4.5" fill="#b0a898" opacity="0.18" />

            <circle cx="40" cy="50" r="3" fill="none" stroke="#9a9080" strokeWidth="0.5" opacity="0.35" />

            <circle cx="50" cy="70" r="3.5" fill="none" stroke="#9a9080" strokeWidth="0.5" opacity="0.3" />

            <circle cx="25" cy="55" r="2.5" fill="none" stroke="#9a9080" strokeWidth="0.5" opacity="0.3" />

            <circle cx="70" cy="30" r="2" fill="none" stroke="#9a9080" strokeWidth="0.4" opacity="0.25" />

            <circle cx="35" cy="72" r="2.5" fill="none" stroke="#9a9080" strokeWidth="0.4" opacity="0.3" />

            {/* Subtle terrain texture lines */}
            <path d="M25 40 Q30 38 35 42" stroke="#9a9080" strokeWidth="0.4" fill="none" opacity="0.2" />
            <path d="M55 60 Q60 57 65 62" stroke="#9a9080" strokeWidth="0.4" fill="none" opacity="0.2" />
          </g>

          {/* Limb darkening — subtle edge shadow */}
          <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(60,50,40,0.25)" strokeWidth="3" />

          {/* Phase shadow — crescent effect */}
          <circle
            cx={moonPosition.phase < 0.5
              ? 50 + (0.5 - moonPosition.phase) * 120
              : 50 - (moonPosition.phase - 0.5) * 120}
            cy="50"
            r="42"
            fill="rgba(6, 8, 13, 0.92)"
            clipPath="url(#moonClip)"
            style={{
              opacity: moonPosition.phase > 0.45 && moonPosition.phase < 0.55 ? 0 : 1,
              transition: 'opacity 5s',
            }}
          />
        </svg>
      </div>
    </div>
  )
}
