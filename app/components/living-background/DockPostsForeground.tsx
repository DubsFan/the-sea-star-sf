'use client'

interface DockPostsForegroundProps {
  sunAltitude: number
  isMobile: boolean
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

export default function DockPostsForeground({ sunAltitude, isMobile }: DockPostsForegroundProps) {
  const nightStrength = clamp((-sunAltitude - 2) / 16, 0, 1)
  const opacity = 0.86 - nightStrength * 0.3
  const brightness = 1 - nightStrength * 0.42
  const contrast = 1.02 - nightStrength * 0.08
  const frameHeight = isMobile ? '7.2vh' : '8.2vh'
  const repeatBandHeight = isMobile ? '12vh' : '14vh'
  const bottomBaseHeight = isMobile ? '1.5vh' : '1.7vh'

  return (
    <div
      aria-hidden="true"
      className="absolute inset-x-0 bottom-0 z-[8] overflow-hidden pointer-events-none"
      style={{ height: frameHeight }}
    >
      <div
        className="absolute inset-x-0 bottom-0"
        style={{
          height: bottomBaseHeight,
          background: 'linear-gradient(180deg, rgba(4,7,12,0.92) 0%, rgba(2,4,8,0.98) 100%)',
        }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-[-0.15vh] top-0"
        style={{
          opacity,
          filter: `brightness(${brightness}) contrast(${contrast})`,
          backgroundImage: 'url(/doc%20posts.png)',
          backgroundRepeat: 'repeat-x',
          backgroundPosition: 'center bottom',
          backgroundSize: `auto ${repeatBandHeight}`,
        }}
      />
    </div>
  )
}
