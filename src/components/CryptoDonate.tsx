import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown, Copy } from 'lucide-react'
import { CRYPTO_WALLETS } from '@/data/meta'

export default function CryptoDonate() {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const copy = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address)
    } catch {
      // Fallback for browsers without the async clipboard API
      const ta = document.createElement('textarea')
      ta.value = address
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      try {
        document.execCommand('copy')
      } catch {
        /* clipboard unavailable */
      }
      ta.remove()
    }
    setCopied(address)
    setTimeout(() => setCopied((c) => (c === address ? null : c)), 1800)
  }

  if (CRYPTO_WALLETS.length === 0) return null

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1 rounded-full border border-rose-300 bg-white/70 px-2.5 py-0.5 font-medium text-rose-700 transition-colors hover:bg-white dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-300 dark:hover:bg-rose-500/20"
      >
        Crypto
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute top-full left-1/2 z-50 mt-1.5 w-72 -translate-x-1/2 rounded-xl border border-neutral-200 bg-white p-2 text-left shadow-lg dark:border-neutral-700 dark:bg-neutral-900"
        >
          <p className="px-1.5 pb-1 text-xs text-neutral-500 dark:text-neutral-400">
            Tap an address to copy it
          </p>
          {CRYPTO_WALLETS.map((w) => {
            const isCopied = copied === w.address
            return (
              <button
                key={`${w.label}-${w.address}`}
                type="button"
                role="menuitem"
                onClick={() => void copy(w.address)}
                className="flex w-full items-center gap-2 rounded-lg px-1.5 py-1.5 text-left transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                <span className="w-20 shrink-0 text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  {w.label}
                </span>
                <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-neutral-500 dark:text-neutral-400">
                  {w.address}
                </span>
                {isCopied ? (
                  <Check className="h-3.5 w-3.5 shrink-0 text-emerald-500" aria-hidden />
                ) : (
                  <Copy className="h-3.5 w-3.5 shrink-0 text-neutral-400" aria-hidden />
                )}
                <span className="sr-only">{isCopied ? 'Copied' : `Copy ${w.label} address`}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
