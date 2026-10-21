import { Link } from 'react-router-dom'
import { ArrowUpRight, Star, WifiOff, Zap } from 'lucide-react'
import { motion } from 'framer-motion'
import type { ToolDef } from '@/types/tool'
import { CATEGORIES } from '@/data/tools'
import { FAVORITES_KEY, useLocalList } from '@/hooks/useLocalList'

const SPEED_LABEL: Record<ToolDef['speed'], string> = {
  instant: 'Instant',
  fast: '~seconds',
  medium: 'A few seconds',
  heavy: 'Depends on pages',
}

export default function ToolCard({ tool }: { tool: ToolDef }) {
  const { items: favorites, toggle } = useLocalList(FAVORITES_KEY, 50)
  const isFav = favorites.includes(tool.slug)
  const category = CATEGORIES.find((c) => c.id === tool.category)
  const Icon = tool.icon

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="group relative"
    >
      <Link
        to={`/tool/${tool.slug}`}
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect()
          e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`)
          e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`)
        }}
        className="card spotlight flex h-full flex-col gap-3 p-5 transition-transform duration-300 hover:-translate-y-1"
      >
        <div className="flex items-start justify-between">
          <span
            className={`inline-flex rounded-xl p-2.5 ring-1 ring-current/15 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-[-4deg] ${category?.accent ?? 'bg-neutral-100 text-neutral-600'}`}
          >
            <Icon className="h-6 w-6" aria-hidden />
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-neutral-200 px-2 py-0.5 font-mono text-[10.5px] font-medium text-neutral-600 dark:border-white/10 dark:text-neutral-400">
            <Zap className="h-3 w-3" aria-hidden /> {SPEED_LABEL[tool.speed]}
          </span>
        </div>
        <div>
          <h3 className="flex items-center gap-1.5 font-semibold text-neutral-900 dark:text-white">
            {tool.name}
            <ArrowUpRight
              className="h-4 w-4 -translate-x-1 text-cyan-600 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 dark:text-neon-cyan"
              aria-hidden
            />
          </h3>
          <p className="mt-1 line-clamp-2 text-sm text-neutral-600 dark:text-neutral-400">
            {tool.description}
          </p>
        </div>
        <div className="mt-auto flex flex-wrap items-center gap-1.5 text-[11px] font-medium">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden /> 100% local
          </span>
          {tool.offline && (
            <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400">
              <WifiOff className="h-3 w-3" aria-hidden /> Works offline
            </span>
          )}
        </div>
      </Link>
      <button
        type="button"
        aria-label={isFav ? `Remove ${tool.name} from favorites` : `Add ${tool.name} to favorites`}
        aria-pressed={isFav}
        onClick={() => toggle(tool.slug)}
        className={`absolute right-3 bottom-3 rounded-full p-1.5 transition-all ${
          isFav
            ? 'text-amber-500'
            : 'text-neutral-400 opacity-0 group-hover:opacity-100 hover:text-amber-500 focus-visible:opacity-100 dark:text-neutral-500'
        }`}
      >
        <Star className={`h-4 w-4 ${isFav ? 'fill-current' : ''}`} aria-hidden />
      </button>
    </motion.div>
  )
}
