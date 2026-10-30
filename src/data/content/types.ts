/**
 * Long-form, per-tool copy rendered under every tool (ToolGuide) and baked into
 * the prerendered HTML. It gives search engines and first-time visitors real,
 * tool-specific text instead of a one-line description.
 *
 * Keep it factual: only describe options and behavior the tool actually has.
 */
export interface ToolFaq {
  q: string
  a: string
}

export interface ToolContent {
  /** 2–3 sentences: what the tool does and when you'd use it. */
  intro: string
  /** Ordered how-to steps (imperative, one action each). */
  steps: string[]
  /** Tool-specific questions. Shared privacy Q&A is appended automatically. */
  faqs: ToolFaq[]
  /** Concrete situations the tool is for, one short sentence each. */
  useCases?: string[]
  /** Practical notes: how options behave, limits, alternatives. */
  details?: { heading: string; text: string }[]
}

/** Extra copy layered onto a tool's base content (faqs are appended). */
export type ToolContentExtras = Pick<ToolContent, 'useCases' | 'details'> & {
  faqs?: ToolFaq[]
}
