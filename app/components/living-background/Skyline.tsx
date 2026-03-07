'use client'

import type { SkyPhase } from '../../lib/sky-phases'

interface SkylineProps {
  skyPhase: SkyPhase
  skyBottom: string
  mode?: 'back' | 'front'
}

export default function Skyline({ skyPhase, skyBottom, mode = 'back' }: SkylineProps) {
  const isNight = ['night', 'astronomicalDawn', 'astronomicalDusk'].includes(skyPhase)
  const isDusk = ['dusk', 'nauticalDusk', 'sunset', 'nauticalDawn'].includes(skyPhase)
  const isGolden = ['goldenEvening', 'goldenMorning'].includes(skyPhase)
  const isFront = mode === 'front'
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

  const layers = [
    {
      opacity: phaseOpacity * 0.32,
      translateX: '-1.8%',
      translateY: '-11%',
      scale: 1.008,
      blur: '0.35px',
      brightness: isNight ? 1.26 : 1.12,
      contrast: 1.16,
      size: '102% auto',
      mask: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.01) 12%, rgba(0,0,0,0.5) 48%, rgba(0,0,0,0.94) 100%)',
    },
    {
      opacity: phaseOpacity * 0.56,
      translateX: '-0.7%',
      translateY: '-5%',
      scale: 1.016,
      blur: '0px',
      brightness: isNight ? 1.18 : 1,
      contrast: 1.22,
      size: '104% auto',
      mask: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.03) 12%, rgba(0,0,0,0.66) 52%, rgba(0,0,0,1) 100%)',
    },
    {
      opacity: phaseOpacity * 0.74,
      translateX: '0.45%',
      translateY: '0%',
      scale: 1.02,
      blur: '0px',
      brightness: isNight ? 1.08 : 0.88,
      contrast: 1.26,
      size: '104.5% auto',
      mask: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.06) 12%, rgba(0,0,0,0.8) 48%, rgba(0,0,0,1) 100%)',
    },
    {
      opacity: 0.96,
      translateX: '0.8%',
      translateY: '0%',
      scale: 1.018,
      blur: '0px',
      brightness: 0,
      contrast: 1,
      size: '101.5% auto',
      mask: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.06) 22%, rgba(0,0,0,1) 56%, rgba(0,0,0,1) 100%)',
    },
  ]
  const visibleLayers = isFront ? [layers[3]] : layers.slice(0, 3)

  return (
    <div
      className={`absolute left-0 right-0 pointer-events-none ${isFront ? 'z-[6]' : 'z-[5]'}`}
      style={{
        bottom: isFront ? 'calc(18vh - 0.15vh)' : 'calc(18vh + 1.2vh)',
        height: isFront ? '2.5vh' : '8.6vh',
      }}
    >
      {!isFront && (
        <div
          className="absolute inset-x-0 bottom-[10%]"
          style={{
            height: '24%',
            background: `radial-gradient(ellipse 62% 60% at 50% 100%, ${shorelineGlow} 0%, transparent 72%)`,
            filter: 'blur(3px)',
            opacity: isNight ? 0.24 : 0.16,
          }}
        />
      )}

      {visibleLayers.map((layer, index) => (
        <div
          key={`${mode}-${index}`}
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

      {!isFront && (
        <div
          className="absolute inset-0 transition-all duration-[10000ms] ease-linear"
          style={{
            background: `linear-gradient(180deg, transparent 0%, transparent 52%, ${tint} 100%)`,
            mixBlendMode: isNight ? 'screen' : 'multiply',
            opacity: 0.55,
          }}
        />
      )}

      {!isFront && (
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(180deg, transparent 0%, transparent 56%, ${skyBottom} 100%)`,
            opacity: isNight ? 0.03 : 0.04,
          }}
        />
      )}
    </div>
  )
}
