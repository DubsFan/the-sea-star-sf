'use client'

interface CelestialBodyProps {
  sunPosition: { x: number; y: number; visible: boolean; altitude: number; color: string; glowSize: number }
  moonPosition: { x: number; y: number; visible: boolean; phase: number; illumination: number }
}

export default function CelestialBody({ sunPosition, moonPosition }: CelestialBodyProps) {
  return (
    <div className="absolute inset-0 z-[1]">
      {/* Sun */}
      <div
        className="absolute w-10 h-10 rounded-full transition-all duration-[120000ms] ease-linear"
        style={{
          left: `${sunPosition.x}%`,
          top: `${sunPosition.y}%`,
          transform: 'translate(-50%, -50%)',
          opacity: sunPosition.visible ? (sunPosition.altitude > 0 ? 1 : 0.6) : 0,
          background: `radial-gradient(circle, ${sunPosition.color} 0%, ${sunPosition.color}88 30%, transparent 70%)`,
          boxShadow: `0 0 ${sunPosition.glowSize}px ${sunPosition.glowSize / 2}px ${sunPosition.color}40,
                      0 0 ${sunPosition.glowSize * 2}px ${sunPosition.glowSize}px ${sunPosition.color}20`,
        }}
      />

      {/* Moon */}
      <div
        className="absolute w-8 h-8 rounded-full transition-all duration-[120000ms] ease-linear"
        style={{
          left: `${moonPosition.x}%`,
          top: `${moonPosition.y}%`,
          transform: 'translate(-50%, -50%)',
          opacity: moonPosition.visible ? 0.9 : 0,
          background: `radial-gradient(circle, #e8e4d8 0%, #c8c4b8 40%, transparent 70%)`,
          boxShadow: moonPosition.visible
            ? `0 0 15px 5px rgba(200, 196, 184, 0.15), 0 0 30px 10px rgba(200, 196, 184, 0.08)`
            : 'none',
        }}
      >
        {/* Moon phase shadow - crescent effect */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            // Phase: 0 = new moon, 0.25 = first quarter, 0.5 = full, 0.75 = last quarter
            background: `radial-gradient(circle at ${moonPosition.phase < 0.5 ? 30 + moonPosition.phase * 80 : 110 - (moonPosition.phase - 0.5) * 80}% 50%, transparent 40%, rgba(6, 8, 13, 0.85) 60%)`,
            opacity: moonPosition.phase > 0.45 && moonPosition.phase < 0.55 ? 0 : 1, // Hide shadow at full moon
          }}
        />
      </div>
    </div>
  )
}
