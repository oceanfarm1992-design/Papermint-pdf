import type { OutputFile } from '@/types/tool'

export function downloadBlob(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  // Give the browser a beat to start the download before revoking
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

export async function zipOutputs(outputs: OutputFile[], zipName: string): Promise<void> {
  const { default: JSZip } = await import('jszip')
  const zip = new JSZip()
  const used = new Set<string>()
  for (const out of outputs) {
    let name = out.name
    let n = 1
    while (used.has(name)) {
      const dot = out.name.lastIndexOf('.')
      name = dot > 0 ? `${out.name.slice(0, dot)} (${n})${out.name.slice(dot)}` : `${out.name} (${n})`
      n++
    }
    used.add(name)
    zip.file(name, out.blob)
  }
  const blob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  })
  downloadBlob(blob, zipName)
}
