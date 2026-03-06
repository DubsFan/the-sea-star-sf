'use client'

interface WaterReflectionProps {
  reflectionColor: string
  skyBottom: string
}

export default function WaterReflection({ reflectionColor, skyBottom }: WaterReflectionProps) {
  return (
    <div className="absolute bottom-0 left-0 right-0 h-[15vh] z-[4] overflow-hidden">
      {/* Base water layer */}
      <div
        className="absolute inset-0 transition-all duration-[120000ms] ease-linear"
        style={{
          background: `linear-gradient(180deg, transparent 0%, ${reflectionColor}cc 30%, ${reflectionColor} 100%)`,
        }}
      />

      {/* Shimmer layer 1 - slow */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          background: `linear-gradient(165deg, transparent 40%, ${skyBottom}30 50%, transparent 60%)`,
          backgroundSize: '200% 100%',
          animation: 'water-shimmer 8s ease-in-out infinite alternate',
        }}
      />

      {/* Shimmer layer 2 - offset */}
      <div
        className="absolute inset-0 opacity-15"
        style={{
          background: `linear-gradient(195deg, transparent 35%, ${skyBottom}20 50%, transparent 65%)`,
          backgroundSize: '300% 100%',
          animation: 'water-shimmer 12s ease-in-out infinite alternate-reverse',
        }}
      />

      {/* Wave lines */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          background: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 8px,
            ${skyBottom}15 8px,
            ${skyBottom}15 9px
          )`,
          animation: 'wave-drift 20s linear infinite',
          backgroundSize: '200% 100%',
        }}
      />

      {/* Caustic light patterns for daytime */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          background: `
            radial-gradient(ellipse 80px 40px at 20% 60%, ${skyBottom}20 0%, transparent 70%),
            radial-gradient(ellipse 60px 30px at 60% 40%, ${skyBottom}15 0%, transparent 70%),
            radial-gradient(ellipse 90px 45px at 80% 70%, ${skyBottom}18 0%, transparent 70%)
          `,
          animation: 'caustic-shift 8s ease-in-out infinite alternate',
        }}
      />
    </div>
  )
}
