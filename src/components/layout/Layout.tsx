import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { Heart, Monitor, Moon, Sun } from 'lucide-react'
import { useTheme, type Theme } from '@/hooks/useTheme'
import { APP_VERSION, DONATE_LINKS } from '@/data/meta'

function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const options: { value: Theme; icon: typeof Sun; label: string }[] = [
    { value: 'light', icon: Sun, label: 'Light theme' },
    { value: 'system', icon: Monitor, label: 'System theme' },
    { value: 'dark', icon: Moon, label: 'Dark theme' },
  ]
  return (
    <div
      role="radiogroup"
      aria-label="Color theme"
      className="flex items-center gap-0.5 rounded-full border border-neutral-200 p-0.5 dark:border-neutral-700"
    >
      {options.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          role="radio"
          aria-checked={theme === value}
          aria-label={label}
          title={label}
          onClick={() => setTheme(value)}
          className={`rounded-full p-1.5 transition-colors ${
            theme === value
              ? 'bg-neutral-200 text-neutral-900 dark:bg-neutral-700 dark:text-white'
              : 'text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
          }`}
        >
          <Icon className="h-4 w-4" aria-hidden />
        </button>
      ))}
    </div>
  )
}

export default function Layout() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  const navLink = ({ isActive }: { isActive: boolean }) =>
    `rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
      isActive
        ? 'text-neutral-900 dark:text-white'
        : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
    }`

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:rounded-lg focus:bg-brand-600 focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to content
      </a>

      {DONATE_LINKS.length > 0 && (
        <div className="border-b border-rose-200/60 bg-rose-50/70 dark:border-rose-500/20 dark:bg-rose-500/5">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 py-1.5 text-sm">
            <span className="inline-flex items-center gap-1.5 font-medium text-rose-700 dark:text-rose-300">
              <Heart className="h-3.5 w-3.5 fill-current" aria-hidden /> Love Papermint? Support it:
            </span>
            {DONATE_LINKS.map((d) => (
              <a
                key={d.url}
                href={d.url}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center rounded-full border border-rose-300 bg-white/70 px-2.5 py-0.5 font-medium text-rose-700 transition-colors hover:bg-white dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-300 dark:hover:bg-rose-500/20"
              >
                {d.label}
              </a>
            ))}
          </div>
        </div>
      )}

      <header className="sticky top-0 z-40 border-b border-neutral-200/70 bg-white/80 backdrop-blur-md dark:border-neutral-800 dark:bg-[#0c0d10]/80">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
          <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <img src="/icons/icon.svg" alt="" className="h-7 w-7" aria-hidden />
            <span>
              Papermint
              <span className="sr-only"> — private PDF tools</span>
            </span>
          </Link>
          <nav aria-label="Main" className="hidden items-center gap-1 sm:flex">
            <NavLink to="/" className={navLink} end>
              Tools
            </NavLink>
            <NavLink to="/about" className={navLink}>
              About
            </NavLink>
            <NavLink to="/privacy" className={navLink}>
              Privacy
            </NavLink>
            <NavLink to="/faq" className={navLink}>
              FAQ
            </NavLink>
          </nav>
          <ThemeToggle />
        </div>
      </header>

      <main id="main" className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-neutral-200/70 py-8 text-sm text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4">
          <p>🔒 Files are processed locally in your browser — nothing is ever uploaded.</p>
          <nav aria-label="Footer" className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link to="/privacy" className="hover:text-neutral-900 dark:hover:text-white">Privacy</Link>
            <Link to="/terms" className="hover:text-neutral-900 dark:hover:text-white">Terms</Link>
            <Link to="/contact" className="hover:text-neutral-900 dark:hover:text-white">Contact</Link>
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer noopener"
              className="hover:text-neutral-900 dark:hover:text-white"
            >
              GitHub
            </a>
            <span aria-label={`Version ${APP_VERSION}`}>v{APP_VERSION}</span>
            <span>MIT License</span>
          </nav>
        </div>
      </footer>
    </div>
  )
}
