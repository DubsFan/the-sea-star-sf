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
    />
  )
}
