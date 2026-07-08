/**
 * "Smart tools" — deliberately boring, fully local text analysis.
 * No cloud AI, no model downloads: extractive summarization and frequency
 * analysis over the text pdf.js extracts.
 */
import type { ProcessFn } from '@/types/tool'
import { openWithPdfJs } from '@/utils/pdf'
import { extractLines, headingLevel, pagesToPlainText } from '@/utils/pdfText'
import { baseName } from '@/utils/format'
import { UserError } from '@/utils/errors'

const STOPWORDS = new Set(
  `a about above after again all also am an and any are as at be because been before being below between both but by can could did do does doing down during each few for from further had has have having he her here hers herself him himself his how i if in into is it its itself just me more most my myself no nor not now of off on once only or other our ours ourselves out over own same she should so some such than that the their theirs them themselves then there these they this those through to too under until up very was we were what when where which while who whom why will with you your yours yourself yourselves`.split(
    /\s+/,
  ),
)

function tokenize(text: string): string[] {
  return (text.toLowerCase().match(/[\p{L}\p{N}][\p{L}\p{N}'-]*/gu) ?? []).filter(
    (w) => w.length > 2 && !STOPWORDS.has(w),
  )
}

function splitSentences(text: string): string[] {
  return text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+(?=[A-Z0-9“"(])/)
    .map((s) => s.trim())
    .filter((s) => s.length > 25 && s.length < 600)
}

async function requireText(
  file: File,
  onProgress: (f: number) => void,
  signal: AbortSignal,
): Promise<string> {
  const { pages } = await extractLines(file, onProgress, signal)
  const text = pagesToPlainText(pages)
  if (text.trim().length < 40) {
    throw new UserError('Not enough selectable text found. If this is a scanned PDF, run OCR PDF first.')
  }
  return text
}

export const summarize: ProcessFn = async (files, options, ctx) => {
  const file = files[0]
  if (!file) throw new UserError('No file selected.')
  ctx.onProgress(0.05, 'Extracting text')
  const text = await requireText(file, (f) => ctx.onProgress(f * 0.7), ctx.signal)

  ctx.onProgress(0.8, 'Scoring sentences')
  const sentences = splitSentences(text)
  if (sentences.length === 0) throw new UserError('Could not find complete sentences to summarize.')

  const freq = new Map<string, number>()
  for (const w of tokenize(text)) freq.set(w, (freq.get(w) ?? 0) + 1)

  const scored = sentences.map((s, index) => {
    const words = tokenize(s)
    const score = words.reduce((acc, w) => acc + (freq.get(w) ?? 0), 0) / Math.max(6, words.length)
    return { s, index, score }
  })
  const wanted = Math.min(Number(options.sentences ?? 6), scored.length)
  const top = scored
    .toSorted((a, b) => b.score - a.score)
    .slice(0, wanted)
    .toSorted((a, b) => a.index - b.index)

  const summary = [
    `# Summary of ${file.name}`,
    '',
    `_Generated locally in your browser — extractive summary of the ${sentences.length} sentences found._`,
    '',
    ...top.map((t) => `- ${t.s}`),
  ].join('\n')

  return [
    {
      name: `${baseName(file.name)} (summary).md`,
      blob: new Blob([summary], { type: 'text/markdown;charset=utf-8' }),
    },
  ]
}

export const keywords: ProcessFn = async (files, _options, ctx) => {
  const file = files[0]
  if (!file) throw new UserError('No file selected.')
  ctx.onProgress(0.05, 'Extracting text')
  const text = await requireText(file, (f) => ctx.onProgress(f * 0.7), ctx.signal)

  ctx.onProgress(0.85, 'Ranking terms')
  const words = tokenize(text)
  const uni = new Map<string, number>()
  const bi = new Map<string, number>()
  for (let i = 0; i < words.length; i++) {
    const w = words[i]
    if (!w) continue
    uni.set(w, (uni.get(w) ?? 0) + 1)
    const next = words[i + 1]
    if (next) {
      const pair = `${w} ${next}`
      bi.set(pair, (bi.get(pair) ?? 0) + 1)
    }
  }
  const topUni = [...uni.entries()].sort((a, b) => b[1] - a[1]).slice(0, 25)
  const topBi = [...bi.entries()]
    .filter(([, c]) => c > 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)

  const out = [
    `# Keywords — ${file.name}`,
    '',
    '## Top terms',
    ...topUni.map(([w, c]) => `- ${w} (${c})`),
    '',
    ...(topBi.length > 0 ? ['## Common phrases', ...topBi.map(([w, c]) => `- ${w} (${c})`)] : []),
  ].join('\n')

  return [
    {
      name: `${baseName(file.name)} (keywords).md`,
      blob: new Blob([out], { type: 'text/markdown;charset=utf-8' }),
    },
  ]
}

export const outline: ProcessFn = async (files, _options, ctx) => {
  const file = files[0]
  if (!file) throw new UserError('No file selected.')

  ctx.onProgress(0.1, 'Reading bookmarks')
  const doc = await openWithPdfJs(file)
  const lines: string[] = [`# Outline — ${file.name}`, '']
  try {
    interface OutlineNode {
      title: string
      items?: OutlineNode[]
    }
    const walk = (items: OutlineNode[], depth: number): void => {
      for (const item of items) {
        lines.push(`${'  '.repeat(depth)}- ${item.title}`)
        if (item.items && item.items.length > 0) walk(item.items, depth + 1)
      }
    }
    const bookmarks = (await doc.getOutline()) as OutlineNode[] | null
    if (bookmarks && bookmarks.length > 0) {
      lines.push('_From the document’s embedded bookmarks._', '')
      walk(bookmarks, 0)
    } else {
      // No bookmarks — detect headings from font sizes
      await doc.loadingTask.destroy()
      ctx.onProgress(0.3, 'Detecting headings')
      const { pages, medianSize } = await extractLines(
        file,
        (f) => ctx.onProgress(0.3 + f * 0.6),
        ctx.signal,
      )
      lines.push('_No embedded bookmarks — headings detected from font sizes._', '')
      let found = 0
      pages.forEach((pageLines, p) => {
        for (const line of pageLines) {
          const level = headingLevel(line, medianSize)
          if (level > 0 && line.text.length < 100) {
            lines.push(`${level === 2 ? '  ' : ''}- ${line.text} _(p. ${p + 1})_`)
            found++
          }
        }
      })
      if (found === 0) lines.push('_No headings could be detected in this document._')
      return [
        {
          name: `${baseName(file.name)} (outline).md`,
          blob: new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' }),
        },
      ]
    }
  } finally {
    await doc.loadingTask.destroy().catch(() => undefined)
  }
  return [
    {
      name: `${baseName(file.name)} (outline).md`,
      blob: new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' }),
    },
  ]
}
