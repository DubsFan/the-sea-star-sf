'use client'

import type { SkyPhase } from '../../lib/sky-phases'

interface SkylineProps {
  skyPhase: SkyPhase
  skyBottom: string
}

export default function Skyline({ skyPhase, skyBottom }: SkylineProps) {
  const isNight = ['night', 'astronomicalDawn', 'astronomicalDusk'].includes(skyPhase)
  const isDusk = ['dusk', 'nauticalDusk', 'sunset', 'nauticalDawn'].includes(skyPhase)
  const isGolden = ['goldenEvening', 'goldenMorning'].includes(skyPhase)

  // At night: invert dark lines to light, show at decent opacity so it reads
  // During day: dark lines against bright sky, lower opacity
  const opacity = isNight ? 0.45 : isDusk ? 0.4 : isGolden ? 0.35 : 0.25

  // Night: invert to white lines so they glow against dark sky
  // Dusk: slight warm tint
  // Day: darken for silhouette contrast
  const filter = isNight
    ? 'invert(1) brightness(0.8)'
    : isDusk
    ? 'brightness(0.7) sepia(0.15)'
    : 'brightness(0.5)'

  return (
    <div className="absolute bottom-[16vh] left-0 right-0 z-[3] pointer-events-none" style={{ height: '22vh' }}>
      {/* Port skyline silhouette — transparent PNG with dark line art */}
      <div
        className="absolute inset-0 transition-all duration-[10000ms] ease-linear"
        style={{
          backgroundImage: 'url(/skyline-port.png)',
          backgroundSize: '100% auto',
          backgroundPosition: 'bottom center',
          backgroundRepeat: 'no-repeat',
          opacity,
          filter,
        }}
      />
    </div>
  )
}
