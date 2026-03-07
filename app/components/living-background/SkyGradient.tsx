'use client'

interface SkyGradientProps {
  skyTop: string
  skyMid: string
  skyBottom: string
}

export default function SkyGradient({ skyTop, skyMid, skyBottom }: SkyGradientProps) {
  return (
    <div
      className="absolute inset-0 transition-all duration-[120000ms] ease-linear"
      style={{
        '--sky-top': skyTop,
        '--sky-mid': skyMid,
        '--sky-bottom': skyBottom,
        background: `linear-gradient(to bottom, var(--sky-top), var(--sky-mid), var(--sky-bottom))`,
      } as React.CSSProperties}
    >
      {/* Horizon haze — warm atmospheric depth band */}
      <div
        className="absolute bottom-0 left-0 right-0 transition-all duration-[120000ms] ease-linear"
        style={{
          height: '20vh',
          background: `linear-gradient(to top, ${skyBottom}4d, transparent)`,
        }}
      />
    </div>
  )
}
