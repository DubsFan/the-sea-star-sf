'use client'

import type { SkyPhase } from '../../lib/sky-phases'

interface SkylineProps {
  skyPhase: SkyPhase
  skyBottom: string
  mode?: 'back' | 'front'
}

export default function Skyline({ mode = 'front' }: SkylineProps) {
  const isBack = mode === 'back'

  return (
    <div
      className="absolute left-0 right-0 z-[6] pointer-events-none"
      style={{
        bottom: isBack ? 'calc(18vh + 0.45vh)' : 'calc(18vh + 0.15vh)',
        height: isBack ? '11.5vh' : '10.8vh',
        opacity: isBack ? 0.55 : 1,
        filter: isBack ? 'blur(3px)' : 'none',
        transform: isBack ? 'scale(1.02)' : 'none',
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'url(/SS_skyline_long.png)',
          backgroundSize: '100% auto',
          backgroundPosition: 'bottom center',
          backgroundRepeat: 'no-repeat',
        }}
      />
    </div>
  )
}
