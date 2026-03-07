'use client'

import type { CSSProperties } from 'react'
import type { SkyPhase } from '../../lib/sky-phases'

interface SkylineProps {
  skyPhase: SkyPhase
  skyBottom: string
  mode?: 'back' | 'front'
}

interface SkylineLayer {
  blur: string
  color: string
  opacity: number
  scale: number
  size: string
  translateX: string
  translateY: string
}

function maskStyles(size: string): CSSProperties {
  return {
    WebkitMaskImage: 'url(/SS_skyline_city.png)',
    maskImage: 'url(/SS_skyline_city.png)',
    WebkitMaskPosition: 'bottom center',
    maskPosition: 'bottom center',
    WebkitMaskRepeat: 'no-repeat',
    maskRepeat: 'no-repeat',
    WebkitMaskSize: size,
    maskSize: size,
  }
}

export default function Skyline({ skyPhase, skyBottom, mode = 'back' }: SkylineProps) {
  const isNight = ['night', 'astronomicalDawn', 'astronomicalDusk'].includes(skyPhase)
  const isDusk = ['dusk', 'nauticalDusk', 'sunset', 'nauticalDawn'].includes(skyPhase)
  const isGolden = ['goldenEvening', 'goldenMorning'].includes(skyPhase)
  const isFront = mode === 'front'

  const backLayers: SkylineLayer[] = [
    {
      color: isNight ? 'rgba(182, 194, 226, 1)' : isDusk ? 'rgba(126, 98, 122, 1)' : 'rgba(124, 122, 134, 1)',
      opacity: isNight ? 0.18 : 0.16,
      translateX: '-1.5%',
      translateY: '-9%',
      scale: 1.01,
      blur: '1.4px',
      size: '103% auto',
    },
    {
      color: isNight ? 'rgba(134, 148, 186, 1)' : isDusk ? 'rgba(86, 64, 84, 1)' : 'rgba(88, 86, 96, 1)',
      opacity: isNight ? 0.28 : 0.24,
      translateX: '-0.35%',
      translateY: '-4%',
      scale: 1.018,
      blur: '0.7px',
      size: '105% auto',
    },
  ]

  const frontColor = isNight ? 'rgba(26, 30, 40, 0.98)' : 'rgba(28, 20, 30, 0.96)'

  return (
    <div
      className={`absolute left-0 right-0 pointer-events-none ${isFront ? 'z-[6]' : 'z-[5]'}`}
      style={{
        bottom: isFront ? 'calc(18vh + 0.9vh)' : 'calc(18vh + 1.2vh)',
        height: isFront ? '4.8vh' : '5.4vh',
      }}
    >
      {!isFront && (
        <>
          {backLayers.map((layer, index) => (
            <div
              key={`back-${index}`}
              className="absolute inset-0 transition-all duration-[10000ms] ease-linear"
              style={{
                ...maskStyles(layer.size),
                background: layer.color,
                opacity: layer.opacity,
                transform: `translate3d(${layer.translateX}, ${layer.translateY}, 0) scale(${layer.scale})`,
                filter: `blur(${layer.blur})`,
              }}
            />
          ))}

          <div
            className="absolute inset-0"
            style={{
              ...maskStyles('106% auto'),
              background: `linear-gradient(180deg, transparent 0%, transparent 62%, ${skyBottom} 100%)`,
              opacity: isNight ? 0.08 : 0.06,
            }}
          />
        </>
      )}

      {isFront && (
        <>
          <div
            className="absolute inset-0"
            style={{
              ...maskStyles('108% auto'),
              background: frontColor,
              opacity: 1,
              transform: 'translate3d(0, 0, 0) scale(1.02)',
              filter: 'contrast(1.15)',
            }}
          />
        </>
      )}
    </div>
  )
}
