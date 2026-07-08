import { useEffect, useState } from 'react'
import { XCircle } from 'lucide-react'
import { formatDuration } from '@/utils/format'

interface Props {
  fraction: number
  stage: string
  startedAt: number
  onCancel: () => void
}

export default function ProgressPanel({ fraction, stage, startedAt, onCancel }: Props) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(t)
  }, [])

  const pct = Math.round(Math.min(1, Math.max(0, fraction)) * 100)

  return (
    <div className="card p-6" aria-live="polite">
      <div className="flex items-center justify-between gap-4">
        <p className="font-medium">{stage || 'Processing…'}</p>
        <p className="text-sm tabular-nums text-neutral-500 dark:text-neutral-400">
          {formatDuration(now - startedAt)} elapsed
        </p>
      </div>
      <div
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Processing progress"
        className="mt-4 h-2.5 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800"
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-brand-500 to-sky-500 transition-[width] duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-4 flex items-center justify-between">
        <p className="text-sm tabular-nums text-neutral-500 dark:text-neutral-400">{pct}%</p>
        <button type="button" className="btn-ghost text-rose-600 dark:text-rose-400" onClick={onCancel}>
          <XCircle className="h-4 w-4" aria-hidden /> Cancel
        </button>
      </div>
    </div>
  )
}
