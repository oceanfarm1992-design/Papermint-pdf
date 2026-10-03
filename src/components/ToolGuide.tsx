import { Link } from 'react-router-dom'
import type { ToolDef } from '@/types/tool'
import { relatedTools, toolContent, toolFaqs } from '@/data/content'

/**
 * How-to, FAQ and related-tool links shown below every tool.
 *
 * Also rendered to static HTML by scripts/prerender.mjs, so it must stay free of
 * browser-only APIs and effects: pure props → markup.
 */
export default function ToolGuide({ tool }: { tool: ToolDef }) {
  const content = toolContent(tool.slug)
  const faqs = toolFaqs(tool)
  const related = relatedTools(tool)

  return (
    <section
      aria-labelledby="tool-guide-heading"
      className="mx-auto mt-16 max-w-3xl border-t border-neutral-200 px-4 pt-10 pb-4 leading-relaxed text-neutral-700 dark:border-neutral-800 dark:text-neutral-300"
    >
      {content && (
        <>
          <h2 id="tool-guide-heading" className="text-xl font-semibold text-neutral-900 dark:text-white">
            About {tool.name}
          </h2>
          <p className="mt-3">{content.intro}</p>

          <h2 className="mt-8 text-xl font-semibold text-neutral-900 dark:text-white">
            How to use {tool.name}
          </h2>
          <ol className="mt-3 list-decimal space-y-1 pl-6">
            {content.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </>
      )}

      <h2
        id={content ? undefined : 'tool-guide-heading'}
        className="mt-8 text-xl font-semibold text-neutral-900 dark:text-white"
      >
        Frequently asked questions
      </h2>
      <dl className="mt-3 space-y-4">
        {faqs.map((faq) => (
          <div key={faq.q}>
            <dt className="font-medium text-neutral-900 dark:text-white">{faq.q}</dt>
            <dd className="mt-1">{faq.a}</dd>
          </div>
        ))}
      </dl>

      {related.length > 0 && (
        <nav aria-label="Related tools" className="mt-8">
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">Related tools</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {related.map((t) => (
              <li key={t.slug}>
                <Link
                  to={`/tool/${t.slug}`}
                  className="inline-block rounded-full border border-neutral-200 px-3 py-1 text-sm hover:border-brand-500 hover:text-brand-600 dark:border-neutral-700 dark:hover:text-brand-400"
                >
                  {t.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </section>
  )
}
