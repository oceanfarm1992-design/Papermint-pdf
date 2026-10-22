import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Clock, Search, Star } from 'lucide-react'
import { CATEGORIES, TOOLS, searchTools, toolsByCategory } from '@/data/tools'
import ToolCard from '@/components/ToolCard'
import PrivacyNote from '@/components/PrivacyNote'
import PrivacyContent from '@/components/PrivacyContent'
import { FAVORITES_KEY, RECENTS_KEY, useLocalList } from '@/hooks/useLocalList'
import { useSeo } from '@/hooks/useSeo'
import { HOME_DESCRIPTION, HOME_TITLE } from '@/data/seo'

export default function Home() {
  const [query, setQuery] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)

  useSeo({
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    path: '/',
  })
  const { items: favorites } = useLocalList(FAVORITES_KEY, 50)
  const { items: recents } = useLocalList(RECENTS_KEY, 8)

  // "/" focuses search from anywhere on the page
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const results = useMemo(() => searchTools(query), [query])
  const searching = query.trim().length > 0

  const favTools = useMemo(() => TOOLS.filter((t) => favorites.includes(t.slug)), [favorites])
  const recentTools = useMemo(
    () =>
      recents
        .map((slug) => TOOLS.find((t) => t.slug === slug))
        .filter((t): t is NonNullable<typeof t> => t != null)
        .slice(0, 4),
    [recents],
  )

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16">
      {/* Hero */}
      <section className="relative py-16 text-center sm:py-24">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass mx-auto inline-flex items-center gap-2.5 rounded-full py-1 pr-3.5 pl-2"
        >
          <span className="h-2 w-2 animate-pulse-dot rounded-full bg-neon-mint" aria-hidden />
          <span className="label-mono text-neutral-700 dark:text-neutral-300">
            100% client-side · {TOOLS.length} tools online
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
          className="mx-auto mt-7 max-w-4xl font-display text-5xl leading-[1.02] font-bold tracking-tight text-balance sm:text-7xl"
        >
          Every PDF tool you need. <span className="text-gradient block">Zero uploads.</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="mx-auto mt-6 max-w-xl text-lg text-neutral-600 dark:text-neutral-400"
        >
          Merge, split, compress, convert, edit, sign and OCR — {TOOLS.length} free tools that run
          entirely in your browser. No accounts, no tracking, no limits.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mx-auto mt-10 max-w-2xl"
        >
          <div className="group relative rounded-2xl bg-gradient-to-r from-neon-mint/50 via-neon-cyan/50 to-neon-violet/50 p-px shadow-[0_20px_60px_-25px_rgb(56_217_255/0.55)] transition-shadow focus-within:from-neon-mint focus-within:via-neon-cyan focus-within:to-neon-violet focus-within:shadow-[0_20px_70px_-20px_rgb(56_217_255/0.8)]">
            <div className="relative flex items-center rounded-[15px] bg-white/95 dark:bg-[#090b12]/95">
              <Search
                className="pointer-events-none absolute left-5 h-5 w-5 text-neutral-500 transition-colors group-focus-within:text-cyan-600 dark:text-neutral-400 dark:group-focus-within:text-neon-cyan"
                aria-hidden
              />
              <input
                ref={searchRef}
                type="search"
                role="searchbox"
                aria-label="Search a tool"
                placeholder="Search a tool — merge, compress, sign…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full rounded-[15px] bg-transparent py-4 pr-16 pl-14 text-base text-neutral-900 placeholder:text-neutral-500 focus:outline-none dark:text-white"
              />
              <kbd
                aria-hidden
                className="pointer-events-none absolute right-4 rounded-md border border-neutral-300 bg-neutral-100 px-2 py-0.5 font-mono text-xs text-neutral-600 dark:border-white/15 dark:bg-white/5 dark:text-neutral-400"
              >
                /
              </kbd>
            </div>
          </div>
        </motion.div>

        <motion.dl
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mx-auto mt-10 grid max-w-3xl grid-cols-2 gap-px overflow-hidden rounded-2xl border border-neutral-200/80 bg-neutral-200/80 text-left sm:grid-cols-4 dark:border-white/[0.08] dark:bg-white/[0.08]"
        >
          {[
            [String(TOOLS.length), 'PDF tools'],
            ['0 bytes', 'uploaded'],
            ['Offline', 'ready'],
            ['∞', 'files & pages'],
          ].map(([value, label]) => (
            <div key={label} className="bg-white/85 px-4 py-3.5 backdrop-blur dark:bg-[#090b12]/85">
              <dt className="label-mono text-neutral-600 dark:text-neutral-400">{label}</dt>
              <dd className="mt-1 font-display text-2xl font-semibold text-neutral-900 dark:text-white">
                {value}
              </dd>
            </div>
          ))}
        </motion.dl>

        <div className="mt-8">
          <PrivacyNote />
        </div>
      </section>

      {searching ? (
        <section aria-label="Search results">
          <h2 className="mb-4 text-lg font-semibold">
            {results.length === 0
              ? `No tools match “${query}”`
              : `${results.length} tool${results.length === 1 ? '' : 's'} found`}
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((tool) => (
              <ToolCard key={tool.slug} tool={tool} />
            ))}
          </div>
        </section>
      ) : (
        <>
          {favTools.length > 0 && (
            <section className="mb-12" aria-label="Favorite tools">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                <Star className="h-5 w-5 text-amber-500" aria-hidden /> Favorites
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {favTools.map((tool) => (
                  <ToolCard key={tool.slug} tool={tool} />
                ))}
              </div>
            </section>
          )}

          {recentTools.length > 0 && (
            <section className="mb-12" aria-label="Recently used tools">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                <Clock className="h-5 w-5 text-neutral-400" aria-hidden /> Recently used
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {recentTools.map((tool) => (
                  <ToolCard key={tool.slug} tool={tool} />
                ))}
              </div>
            </section>
          )}

          {CATEGORIES.filter((cat) => toolsByCategory(cat.id).length > 0).map((cat, i) => {
            const tools = toolsByCategory(cat.id)
            const CatIcon = cat.icon
            return (
              <section key={cat.id} className="mb-14" aria-label={cat.name}>
                <div className="mb-5 flex items-end gap-4">
                  <span className={`inline-flex rounded-xl p-2.5 ring-1 ring-current/15 ${cat.accent}`}>
                    <CatIcon className="h-5 w-5" aria-hidden />
                  </span>
                  <div className="min-w-0 shrink">
                    <p className="label-mono text-neutral-600 dark:text-neutral-400">
                      {String(i + 1).padStart(2, '0')} / {tools.length} tools
                    </p>
                    <h2 className="mt-0.5 text-xl font-semibold">{cat.name}</h2>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">{cat.description}</p>
                  </div>
                  <span
                    className="mb-3 hidden h-px flex-1 bg-gradient-to-r from-neutral-300 to-transparent sm:block dark:from-white/15"
                    aria-hidden
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {tools.map((tool) => (
                    <ToolCard key={tool.slug} tool={tool} />
                  ))}
                </div>
              </section>
            )
          })}

          <PrivacyContent />
        </>
      )}
    </div>
  )
}
