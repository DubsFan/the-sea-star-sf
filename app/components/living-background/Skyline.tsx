'use client'

import type { SkyPhase } from '../../lib/sky-phases'

interface SkylineProps {
  skyPhase: SkyPhase
  skyBottom: string
  mode?: 'back' | 'front'
}

export default function Skyline({ mode = 'front' }: SkylineProps) {
  if (mode === 'back') return null

  return (
    <div
      className="absolute left-0 right-0 z-[6] pointer-events-none"
      style={{
        bottom: 'calc(18vh + 0.25vh)',
        height: '10.5vh',
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'url(/SS_skyline_long.png)',
          backgroundSize: '100% auto',
          backgroundPosition: 'bottom center',
          backgroundRepeat: 'no-repeat',
          opacity: 1,
        }}
      />
    </div>
  )
}
