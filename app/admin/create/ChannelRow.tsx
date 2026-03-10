'use client'

import { splitToPacificParts, combineDateTimePacific } from '@/lib/campaign-timing'

interface ChannelRowProps {
  label: string
  value: string
  onChange: (v: string) => void
  scheduledFor?: string
  onScheduledForChange?: (iso: string) => void
  allowDraft?: boolean
}

export default function ChannelRow({
  label,
  value,
  onChange,
  scheduledFor,
  onScheduledForChange,
  allowDraft,
}: ChannelRowProps) {
  const options = allowDraft ? ['skip', 'now', 'schedule', 'draft'] : ['skip', 'now', 'schedule']

  const dateParts = scheduledFor ? splitToPacificParts(scheduledFor) : { date: '', time: '10:00' }

  function handleDateChange(dateStr: string) {
    if (!onScheduledForChange) return
    const time = dateParts.time || '10:00'
    onScheduledForChange(combineDateTimePacific(dateStr, time))
  }

  function handleTimeChange(timeStr: string) {
    if (!onScheduledForChange) return
    const date = dateParts.date
    if (!date) return
    onScheduledForChange(combineDateTimePacific(date, timeStr))
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <span className="text-xs text-sea-blue font-dm w-28 flex-shrink-0">{label}</span>
        <div className="flex flex-wrap gap-1">
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => onChange(opt)}
              className={`min-h-[44px] px-3 py-1.5 text-[0.65rem] font-dm tracking-[0.1em] uppercase rounded border cursor-pointer transition-all ${
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

      {value === 'schedule' && onScheduledForChange && (
        <div className="ml-28 flex flex-wrap gap-2">
          <input
            type="date"
            value={dateParts.date}
            onChange={(e) => handleDateChange(e.target.value)}
            className="min-h-[44px] w-full sm:w-auto px-3 py-2 text-xs font-dm bg-sea-dark border border-sea-gold/20 rounded text-sea-blue focus:border-sea-gold/50 outline-none"
            style={{ colorScheme: 'dark' }}
          />
          <input
            type="time"
            value={dateParts.time}
            onChange={(e) => handleTimeChange(e.target.value)}
            className="min-h-[44px] w-full sm:w-auto px-3 py-2 text-xs font-dm bg-sea-dark border border-sea-gold/20 rounded text-sea-blue focus:border-sea-gold/50 outline-none"
            style={{ colorScheme: 'dark' }}
          />
        </div>
      )}

      {value === 'draft' && (
        <p className="ml-28 text-[0.6rem] text-sea-blue/50 font-dm">Saved as draft for review</p>
      )}
    </div>
  )
}
