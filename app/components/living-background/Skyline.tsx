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
  const phaseOpacity = isNight ? 0.72 : isDusk ? 0.62 : isGolden ? 0.54 : 0.42
  const tint = isNight
    ? 'rgba(198, 214, 237, 0.16)'
    : isDusk
      ? 'rgba(201, 165, 78, 0.18)'
      : isGolden
        ? 'rgba(201, 165, 78, 0.14)'
        : 'rgba(10, 16, 23, 0.2)'

  const layers = [
    {
      opacity: phaseOpacity * 0.32,
      translateY: '-2%',
      scale: 1.01,
      blur: '0px',
      brightness: isNight ? 0.92 : 0.7,
      mask: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.12) 18%, rgba(0,0,0,0.9) 56%, rgba(0,0,0,1) 100%)',
    },
    {
      opacity: phaseOpacity * 0.46,
      translateY: '1%',
      scale: 1.015,
      blur: '0.35px',
      brightness: isNight ? 0.88 : 0.64,
      mask: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.22) 16%, rgba(0,0,0,0.92) 52%, rgba(0,0,0,1) 100%)',
    },
    {
      opacity: phaseOpacity * 0.62,
      translateY: '3.5%',
      scale: 1.02,
      blur: '0.7px',
      brightness: isNight ? 0.8 : 0.56,
      mask: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.36) 14%, rgba(0,0,0,0.96) 48%, rgba(0,0,0,1) 100%)',
    },
    {
      opacity: phaseOpacity * 0.82,
      translateY: '6%',
      scale: 1.03,
      blur: '1.1px',
      brightness: isNight ? 0.72 : 0.48,
      mask: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.52) 10%, rgba(0,0,0,1) 42%, rgba(0,0,0,1) 100%)',
    },
  ]

  return (
    <div className="absolute bottom-[16vh] left-0 right-0 z-[3] pointer-events-none" style={{ height: '24vh' }}>
      {layers.map((layer, index) => (
        <div
          key={index}
          className="absolute inset-0 transition-all duration-[10000ms] ease-linear"
          style={{
            backgroundImage: 'url(/SS_skyline_long.png)',
            backgroundSize: '100% auto',
            backgroundPosition: 'bottom center',
            backgroundRepeat: 'no-repeat',
            opacity: layer.opacity,
            transform: `translateY(${layer.translateY}) scale(${layer.scale})`,
            filter: `brightness(${layer.brightness}) blur(${layer.blur})`,
            WebkitMaskImage: layer.mask,
            maskImage: layer.mask,
          }}
        />
      ))}

      <div
        className="absolute inset-0 transition-all duration-[10000ms] ease-linear"
        style={{
          background: `linear-gradient(180deg, transparent 0%, transparent 35%, ${tint} 100%)`,
          mixBlendMode: isNight ? 'screen' : 'multiply',
        }}
      />

      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(180deg, transparent 0%, transparent 58%, ${skyBottom} 100%)`,
          opacity: isNight ? 0.12 : 0.18,
        }}
      />
    </div>
  )
}
