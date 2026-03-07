'use client'

import type { CSSProperties } from 'react'
import type { SkyPhase } from '../../lib/sky-phases'

interface SkylineProps {
  skyPhase: SkyPhase
  skyBottom: string
  mode?: 'back' | 'front'
}

interface SkylineLayer {
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
  const isFront = mode === 'front'

  const frontLayers: SkylineLayer[] = [
    {
      opacity: 1,
      translateX: '0%',
      translateY: '0%',
      scale: 1.038,
      size: '110% auto',
    },
    {
      opacity: 1,
      translateX: '0.35%',
      translateY: '0.1%',
      scale: 1.03,
      size: '109% auto',
    },
    {
      opacity: 0.8,
      translateX: '0.7%',
      translateY: '0.2%',
      scale: 1.022,
      size: '108% auto',
    },
  ]

  const backLayers: SkylineLayer[] = [
    {
      opacity: 0.7,
      translateX: '-0.2%',
      translateY: '-1.8%',
      scale: 1.014,
      size: '107% auto',
    },
    {
      opacity: 0.6,
      translateX: '-0.5%',
      translateY: '-3.2%',
      scale: 1.008,
      size: '106% auto',
    },
  ]

  const layers = isFront ? frontLayers : backLayers

  return (
    <div
      className={`absolute left-0 right-0 pointer-events-none ${isFront ? 'z-[6]' : 'z-[5]'}`}
      style={{
        bottom: isFront ? 'calc(18vh + 0.85vh)' : 'calc(18vh + 1.05vh)',
        height: isFront ? '5.2vh' : '5.4vh',
      }}
    >
      {layers.map((layer, index) => (
        <div
          key={`${mode}-${index}`}
          className="absolute inset-0"
          style={{
            ...maskStyles(layer.size),
            background: '#000000',
            opacity: layer.opacity,
            transform: `translate3d(${layer.translateX}, ${layer.translateY}, 0) scale(${layer.scale})`,
          }}
        />
      ))}
    </div>
  )
}
