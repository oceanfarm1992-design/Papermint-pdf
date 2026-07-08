import { useCallback, useEffect, useState } from 'react'

export type Theme = 'light' | 'dark' | 'system'
const KEY = 'pm-theme'

function systemDark(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function apply(theme: Theme): void {
  const dark = theme === 'dark' || (theme === 'system' && systemDark())
  document.documentElement.classList.toggle('dark', dark)
}

export function useTheme(): { theme: Theme; setTheme: (t: Theme) => void } {
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      const stored = localStorage.getItem(KEY)
      return stored === 'light' || stored === 'dark' ? stored : 'system'
    } catch {
      return 'system'
    }
  })

  useEffect(() => {
    apply(theme)
    if (theme !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => apply('system')
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [theme])

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t)
    try {
      if (t === 'system') localStorage.removeItem(KEY)
      else localStorage.setItem(KEY, t)
    } catch {
      /* storage unavailable — theme stays in-memory */
    }
  }, [])

  return { theme, setTheme }
}
