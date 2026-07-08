import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Clock, Search, Star } from 'lucide-react'
import { CATEGORIES, TOOLS, searchTools, toolsByCategory } from '@/data/tools'
import ToolCard from '@/components/ToolCard'
import PrivacyNote from '@/components/PrivacyNote'
import PrivacyContent from '@/components/PrivacyContent'
import { FAVORITES_KEY, RECENTS_KEY, useLocalList } from '@/hooks/useLocalList'
import { useSeo } from '@/hooks/useSeo'

export default function Home() {
  const [query, setQuery] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)

  useSeo({
    title: 'Privacy PDF Tools — Free & Private, Never Upload Your Files',
    description:
      'Merge, split, compress, convert, edit, sign and OCR PDFs — free and 100% in your browser. No uploads, no accounts, no tracking. Your files never leave your device.',
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
      <section className="py-14 text-center sm:py-20">
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto max-w-3xl text-4xl font-bold tracking-tight text-balance sm:text-6xl"
        >
          Every PDF tool you need.{' '}
          <span className="bg-gradient-to-r from-brand-500 to-sky-500 bg-clip-text text-transparent">
            Zero uploads.
          </span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="mx-auto mt-5 max-w-xl text-lg text-neutral-500 dark:text-neutral-400"
        >
          Merge, split, compress, convert, edit, sign and OCR — {TOOLS.length} free tools that run
          entirely in your browser. No accounts, no tracking, no limits.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16 }}
          className="mx-auto mt-8 max-w-xl"
        >
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-neutral-400"
              aria-hidden
            />
            <input
              ref={searchRef}
              type="search"
              role="searchbox"
              aria-label="Search a tool"
              placeholder="Search a tool…  (press /)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-2xl border border-neutral-200 bg-white py-3.5 pr-4 pl-12 text-base shadow-sm transition-shadow placeholder:text-neutral-400 focus:border-brand-500 focus:shadow-md focus:outline-none dark:border-neutral-700 dark:bg-neutral-900"
            />
          </div>
        </motion.div>

        <div className="mt-6">
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

          {CATEGORIES.map((cat) => {
            const tools = toolsByCategory(cat.id)
            if (tools.length === 0) return null
            const CatIcon = cat.icon
            return (
              <section key={cat.id} className="mb-12" aria-label={cat.name}>
                <div className="mb-4 flex items-center gap-3">
                  <span className={`inline-flex rounded-xl p-2 ${cat.accent}`}>
                    <CatIcon className="h-5 w-5" aria-hidden />
                  </span>
                  <div>
                    <h2 className="text-lg font-semibold">{cat.name}</h2>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">{cat.description}</p>
                  </div>
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
