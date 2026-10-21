import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { Heart, Monitor, Moon, Sun } from 'lucide-react'
import { useTheme, type Theme } from '@/hooks/useTheme'
import { APP_VERSION, CRYPTO_WALLETS, DONATE_LINKS } from '@/data/meta'
import CryptoDonate from '@/components/CryptoDonate'

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
      className="flex items-center gap-0.5 rounded-full border border-neutral-200 bg-white/60 p-0.5 dark:border-white/10 dark:bg-white/5"
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
              ? 'bg-neutral-900 text-white shadow-[0_0_12px_rgb(56_217_255/0.35)] dark:bg-white dark:text-neutral-900'
              : 'text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-white'
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
    `relative rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
      isActive
        ? 'bg-neutral-900/[0.06] text-neutral-900 dark:bg-white/10 dark:text-white'
        : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
    }`

  return (
    <div className="relative flex min-h-screen flex-col">
      <div className="aurora" aria-hidden>
        <div className="aurora__grid" />
        <div className="aurora__blob top-[-18rem] left-[-10rem] h-[38rem] w-[38rem] bg-neon-mint" />
        <div
          className="aurora__blob top-[-12rem] right-[-12rem] h-[34rem] w-[34rem] bg-neon-violet"
          style={{ animationDelay: '-7s' }}
        />
        <div
          className="aurora__blob top-[22rem] left-[30%] h-[26rem] w-[26rem] bg-neon-cyan"
          style={{ animationDelay: '-14s' }}
        />
      </div>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:rounded-lg focus:bg-brand-600 focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to content
      </a>

      {(DONATE_LINKS.length > 0 || CRYPTO_WALLETS.length > 0) && (
        <div className="border-b border-rose-200/60 bg-rose-50/70 dark:border-rose-500/20 dark:bg-rose-500/5">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 py-1.5 text-sm">
            <span className="inline-flex items-center gap-1.5 font-medium text-rose-700 dark:text-rose-300">
              <Heart className="h-3.5 w-3.5 fill-current" aria-hidden /> Love these tools? Support us:
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
            <CryptoDonate />
          </div>
        </div>
      )}

      <header className="sticky top-3 z-40 px-3">
        <div className="glass mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 rounded-2xl px-3 shadow-[0_12px_40px_-20px_rgb(15_23_42/0.35)] sm:px-4 dark:shadow-[0_12px_40px_-16px_rgb(0_0_0/0.9)]">
          <Link
            to="/"
            className="group flex items-center gap-2.5 font-display font-semibold tracking-tight"
          >
            <span className="relative grid h-8 w-8 place-items-center rounded-lg bg-neutral-950 ring-1 ring-white/10 dark:bg-white/5">
              <img src="/icons/icon.svg" alt="" className="h-5 w-5" aria-hidden />
              <span className="absolute inset-0 rounded-lg opacity-0 shadow-[0_0_18px_rgb(60_245_192/0.7)] transition-opacity group-hover:opacity-100" />
            </span>
            <span>Privacy PDF Tools</span>
          </Link>
          <nav aria-label="Main" className="hidden items-center gap-1 sm:flex">
            <NavLink to="/" className={navLink} end>
              Tools
            </NavLink>
            <NavLink to="/guides" className={navLink}>
              Guides
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

      <main id="main" className="flex-1 pt-4">
        <Outlet />
      </main>

      <footer className="mt-12 border-t border-neutral-200/70 py-10 text-sm text-neutral-600 dark:border-white/[0.06] dark:text-neutral-400">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4">
          <p className="flex items-center gap-2.5">
            <span className="h-2 w-2 animate-pulse-dot rounded-full bg-neon-mint" aria-hidden />
            <span className="label-mono text-neutral-700 dark:text-neutral-300">Local-only</span>
            <span>Files are processed in your browser — nothing is ever uploaded.</span>
          </p>
          <nav aria-label="Footer" className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link to="/privacy" className="hover:text-neutral-900 dark:hover:text-white">
              Privacy
            </Link>
            <Link to="/terms" className="hover:text-neutral-900 dark:hover:text-white">
              Terms
            </Link>
            <Link to="/contact" className="hover:text-neutral-900 dark:hover:text-white">
              Contact
            </Link>
            <a
              href="https://github.com/oceanfarm1992-design/Papermint-pdf"
              target="_blank"
              rel="noreferrer noopener"
              className="hover:text-neutral-900 dark:hover:text-white"
            >
              GitHub
            </a>
            <span className="font-mono text-xs" aria-label={`Version ${APP_VERSION}`}>
              v{APP_VERSION}
            </span>
            <span>MIT License</span>
          </nav>
        </div>
      </footer>
    </div>
  )
}
