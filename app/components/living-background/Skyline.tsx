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
  const phaseOpacity = isNight ? 0.76 : isDusk ? 0.66 : isGolden ? 0.54 : 0.4
  const tint = isNight
    ? 'rgba(198, 214, 237, 0.16)'
    : isDusk
      ? 'rgba(201, 165, 78, 0.18)'
      : isGolden
        ? 'rgba(201, 165, 78, 0.14)'
        : 'rgba(10, 16, 23, 0.2)'
  const shorelineGlow = isNight
    ? 'rgba(158, 184, 220, 0.12)'
    : isDusk
      ? 'rgba(216, 151, 79, 0.18)'
      : isGolden
        ? 'rgba(202, 182, 134, 0.12)'
        : 'rgba(116, 156, 186, 0.08)'
  const horizonShadow = isNight ? 'rgba(3, 8, 14, 0.72)' : 'rgba(6, 12, 18, 0.5)'

  const layers = [
    {
      opacity: phaseOpacity * 0.14,
      translateX: '-1.8%',
      translateY: '-18%',
      scale: 1.02,
      blur: '2.8px',
      brightness: isNight ? 1.06 : 0.84,
      contrast: 1.02,
      size: '103% auto',
      mask: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.02) 28%, rgba(0,0,0,0.72) 68%, rgba(0,0,0,1) 100%)',
    },
    {
      opacity: phaseOpacity * 0.3,
      translateX: '-0.7%',
      translateY: '-10%',
      scale: 1.032,
      blur: '1.8px',
      brightness: isNight ? 1.02 : 0.78,
      contrast: 1.04,
      size: '106% auto',
      mask: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.06) 24%, rgba(0,0,0,0.84) 66%, rgba(0,0,0,1) 100%)',
    },
    {
      opacity: phaseOpacity * 0.48,
      translateX: '0.45%',
      translateY: '-3%',
      scale: 1.045,
      blur: '1.3px',
      brightness: isNight ? 0.9 : 0.68,
      contrast: 1.08,
      size: '109% auto',
      mask: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.1) 20%, rgba(0,0,0,0.92) 60%, rgba(0,0,0,1) 100%)',
    },
    {
      opacity: phaseOpacity * 0.8,
      translateX: '1.1%',
      translateY: '3%',
      scale: 1.06,
      blur: '0.35px',
      brightness: isNight ? 0.74 : 0.52,
      contrast: 1.12,
      size: '112% auto',
      mask: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.18) 16%, rgba(0,0,0,1) 54%, rgba(0,0,0,1) 100%)',
    },
  ]

  return (
    <div
      className="absolute left-0 right-0 z-[3] pointer-events-none"
      style={{
        bottom: 'calc(18vh - 1.4vh)',
        height: '12.25vh',
      }}
    >
      <div
        className="absolute inset-x-0 bottom-[12%]"
        style={{
          height: '58%',
          background: `radial-gradient(ellipse 62% 60% at 50% 100%, ${shorelineGlow} 0%, transparent 72%)`,
          filter: 'blur(12px)',
          opacity: isNight ? 0.74 : 0.62,
        }}
      />

      <div
        className="absolute inset-x-0 bottom-0"
        style={{
          height: '22%',
          background: `linear-gradient(180deg, transparent 0%, ${horizonShadow} 100%)`,
          opacity: 0.56,
        }}
      />

      {layers.map((layer, index) => (
        <div
          key={index}
          className="absolute inset-0 transition-all duration-[10000ms] ease-linear"
          style={{
            backgroundImage: 'url(/SS_skyline_long.png)',
            backgroundSize: layer.size,
            backgroundPosition: 'bottom center',
            backgroundRepeat: 'no-repeat',
            opacity: layer.opacity,
            transform: `translate3d(${layer.translateX}, ${layer.translateY}, 0) scale(${layer.scale})`,
            filter: `brightness(${layer.brightness}) contrast(${layer.contrast}) saturate(0.7) blur(${layer.blur})`,
            WebkitMaskImage: layer.mask,
            maskImage: layer.mask,
          }}
        />
      ))}

      <div
        className="absolute inset-0 transition-all duration-[10000ms] ease-linear"
        style={{
          background: `linear-gradient(180deg, transparent 0%, transparent 42%, ${tint} 100%)`,
          mixBlendMode: isNight ? 'screen' : 'soft-light',
        }}
      />

      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(180deg, transparent 0%, transparent 44%, ${skyBottom} 100%)`,
          opacity: isNight ? 0.1 : 0.14,
        }}
      />
    </div>
  )
}
