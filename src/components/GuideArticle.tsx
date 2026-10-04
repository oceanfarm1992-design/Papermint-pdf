import { Link } from 'react-router-dom'
import type { Guide, GuideBlock } from '@/data/guides'
import { GUIDES } from '@/data/guides'
import { toolBySlug } from '@/data/tools'
import { seoName } from '@/data/seo'

/**
 * A guide / comparison article. Pure props → markup: it is also rendered to
 * static HTML by scripts/prerender.mjs, so no effects or browser APIs here.
 */
const H2 = 'mt-10 mb-3 text-xl font-semibold text-neutral-900 dark:text-white'

function ToolLinks({ slugs }: { slugs: string[] }) {
  const tools = slugs.map(toolBySlug).filter((t) => t !== undefined)
  return (
    <ul className="my-5 flex flex-wrap gap-2">
      {tools.map((t) => (
        <li key={t.slug}>
          <Link to={`/tool/${t.slug}`} className="btn-primary px-4 py-2 text-sm">
            {seoName(t)} →
          </Link>
        </li>
      ))}
    </ul>
  )
}

function Block({ block }: { block: GuideBlock }) {
  switch (block.type) {
    case 'p':
      return <p className="mt-4">{block.text}</p>
    case 'h2':
      return <h2 className={H2}>{block.text}</h2>
    case 'ul':
      return (
        <ul className="mt-4 list-disc space-y-1.5 pl-6">
          {block.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )
    case 'ol':
      return (
        <ol className="mt-4 list-decimal space-y-1.5 pl-6">
          {block.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      )
    case 'tools':
      return <ToolLinks slugs={block.slugs} />
    case 'table':
      return (
        <div className="mt-5 overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <caption className="sr-only">{block.caption}</caption>
            <thead>
              <tr>
                {block.head.map((h, i) => (
                  <th
                    key={i}
                    scope="col"
                    className="border-b border-neutral-300 px-3 py-2 font-semibold text-neutral-900 dark:border-neutral-700 dark:text-white"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row) => (
                <tr key={row[0]}>
                  {row.map((cell, i) =>
                    i === 0 ? (
                      <th
                        key={i}
                        scope="row"
                        className="border-b border-neutral-200 px-3 py-2 font-medium dark:border-neutral-800"
                      >
                        {cell}
                      </th>
                    ) : (
                      <td
                        key={i}
                        className="border-b border-neutral-200 px-3 py-2 dark:border-neutral-800"
                      >
                        {cell}
                      </td>
                    ),
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
  }
}

export default function GuideArticle({ guide }: { guide: Guide }) {
  const more = GUIDES.filter((g) => g.slug !== guide.slug).slice(0, 4)
  return (
    <article className="mx-auto max-w-3xl px-4 py-10 leading-relaxed text-neutral-700 dark:text-neutral-300">
      <Link
        to="/guides"
        className="text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
      >
        ← All guides
      </Link>
      <h1 className="mt-4 text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
        {guide.h1}
      </h1>
      <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
        Updated <time dateTime={guide.updated}>{guide.updated}</time>
      </p>

      {guide.blocks.map((block, i) => (
        <Block key={i} block={block} />
      ))}

      {guide.faqs.length > 0 && (
        <>
          <h2 className={H2}>Frequently asked questions</h2>
          <dl className="space-y-4">
            {guide.faqs.map((f) => (
              <div key={f.q}>
                <dt className="font-medium text-neutral-900 dark:text-white">{f.q}</dt>
                <dd className="mt-1">{f.a}</dd>
              </div>
            ))}
          </dl>
        </>
      )}

      <nav
        aria-label="More guides"
        className="mt-12 border-t border-neutral-200 pt-6 dark:border-neutral-800"
      >
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">More guides</h2>
        <ul className="mt-3 space-y-2">
          {more.map((g) => (
            <li key={g.slug}>
              <Link to={`/guides/${g.slug}`} className="text-brand-700 underline dark:text-brand-400">
                {g.h1}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </article>
  )
}

export function GuidesList() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight">PDF guides</h1>
      <p className="mt-2 text-neutral-600 dark:text-neutral-400">
        Practical how-tos and honest comparisons for working with PDFs privately — without uploading your
        documents anywhere.
      </p>
      <ul className="mt-8 space-y-4">
        {GUIDES.map((g) => (
          <li key={g.slug} className="card p-5">
            <Link
              to={`/guides/${g.slug}`}
              className="text-lg font-semibold text-neutral-900 hover:underline dark:text-white"
            >
              {g.h1}
            </Link>
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{g.description}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
