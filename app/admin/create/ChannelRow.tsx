'use client'

export default function ChannelRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-sea-blue font-dm w-28 flex-shrink-0">{label}</span>
      <div className="flex gap-1">
        {['skip', 'now', 'schedule'].map((opt) => (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={`px-3 py-1.5 text-[0.65rem] font-dm tracking-[0.1em] uppercase rounded border cursor-pointer transition-all ${
              value === opt
                ? 'bg-sea-gold/15 border-sea-gold/40 text-sea-gold'
                : 'bg-transparent border-sea-gold/10 text-sea-blue hover:border-sea-gold/20'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  )
}
