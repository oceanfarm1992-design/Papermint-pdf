import type { ToolDef } from '@/types/tool'
import EditorPage from './EditorPage'

/** Sign PDF = the editor opened straight into signature creation. */
export default function SignPage({ tool }: { tool: ToolDef }) {
  return <EditorPage tool={tool} signatureMode />
}
