import { useEffect, useRef, useState } from 'react'
import { Eraser, X } from 'lucide-react'

interface Props {
  onDone: (dataUrl: string, aspect: number) => void
  onClose: () => void
}

type Tab = 'draw' | 'type' | 'upload'
const FONTS = ['"Segoe Script", cursive', '"Brush Script MT", cursive', '"Lucida Handwriting", cursive', 'Georgia, serif']

export default function SignatureModal({ onDone, onClose }: Props) {
  const [tab, setTab] = useState<Tab>('draw')
  const [ink, setInk] = useState('#1e3a8a')
  const [typed, setTyped] = useState('')
  const [fontIdx, setFontIdx] = useState(0)
  const [hasDrawing, setHasDrawing] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const last = useRef<[number, number] | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || tab !== 'draw') return
    const scale = window.devicePixelRatio || 1
    canvas.width = 560 * scale
    canvas.height = 200 * scale
    const c2d = canvas.getContext('2d')
    if (c2d) c2d.scale(scale, scale)
  }, [tab])

  const pos = (e: React.PointerEvent): [number, number] => {
    const rect = canvasRef.current!.getBoundingClientRect()
    return [((e.clientX - rect.left) / rect.width) * 560, ((e.clientY - rect.top) / rect.height) * 200]
  }

  const clear = () => {
    const canvas = canvasRef.current
    const c2d = canvas?.getContext('2d')
    if (canvas && c2d) {
      c2d.save()
      c2d.setTransform(1, 0, 0, 1, 0, 0)
      c2d.clearRect(0, 0, canvas.width, canvas.height)
      c2d.restore()
    }
    setHasDrawing(false)
  }

  /** Crop transparent margins and return dataURL + aspect */
  const finishFromCanvas = (source: HTMLCanvasElement) => {
    const c2d = source.getContext('2d')!
    const { width, height } = source
    const data = c2d.getImageData(0, 0, width, height).data
    let minX = width
    let minY = height
    let maxX = 0
    let maxY = 0
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if ((data[(y * width + x) * 4 + 3] ?? 0) > 8) {
          if (x < minX) minX = x
          if (x > maxX) maxX = x
          if (y < minY) minY = y
          if (y > maxY) maxY = y
        }
      }
    }
    if (maxX <= minX || maxY <= minY) return
    const pad = 6
    minX = Math.max(0, minX - pad)
    minY = Math.max(0, minY - pad)
    maxX = Math.min(width, maxX + pad)
    maxY = Math.min(height, maxY + pad)
    const out = document.createElement('canvas')
    out.width = maxX - minX
    out.height = maxY - minY
    out.getContext('2d')!.drawImage(source, minX, minY, out.width, out.height, 0, 0, out.width, out.height)
    onDone(out.toDataURL('image/png'), out.width / out.height)
  }

  const finishTyped = () => {
    if (!typed.trim()) return
    const canvas = document.createElement('canvas')
    const c2d = canvas.getContext('2d')!
    const font = `64px ${FONTS[fontIdx]}`
    c2d.font = font
    const w = Math.ceil(c2d.measureText(typed).width) + 40
    canvas.width = w
    canvas.height = 120
    const c = canvas.getContext('2d')!
    c.font = font
    c.fillStyle = ink
    c.textBaseline = 'middle'
    c.fillText(typed, 20, 60)
    finishFromCanvas(canvas)
  }

  const onUpload = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => onDone(String(reader.result), img.naturalWidth / img.naturalHeight)
      img.src = String(reader.result)
    }
    reader.readAsDataURL(file)
  }

  return (
    <div role="dialog" aria-modal="true" aria-label="Create signature" className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="card w-full max-w-2xl bg-white p-5 dark:bg-neutral-900">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Create your signature</h2>
          <button type="button" className="btn-ghost" aria-label="Close" onClick={onClose}>
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <div role="tablist" aria-label="Signature method" className="mb-4 flex gap-1 rounded-xl bg-neutral-100 p-1 dark:bg-neutral-800">
          {(['draw', 'type', 'upload'] as Tab[]).map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
                tab === t ? 'bg-white shadow-sm dark:bg-neutral-700' : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === 'draw' && (
          <div>
            <canvas
              ref={canvasRef}
              className="h-[200px] w-full cursor-crosshair touch-none rounded-xl border border-dashed border-neutral-300 bg-white dark:border-neutral-600"
              aria-label="Signature drawing area"
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId)
                drawing.current = true
                last.current = pos(e)
              }}
              onPointerMove={(e) => {
                if (!drawing.current || !last.current) return
                const c2d = canvasRef.current?.getContext('2d')
                if (!c2d) return
                const [x, y] = pos(e)
                c2d.strokeStyle = ink
                c2d.lineWidth = 2.5
                c2d.lineCap = 'round'
                c2d.beginPath()
                c2d.moveTo(last.current[0], last.current[1])
                c2d.lineTo(x, y)
                c2d.stroke()
                last.current = [x, y]
                setHasDrawing(true)
              }}
              onPointerUp={() => {
                drawing.current = false
                last.current = null
              }}
            />
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {['#1e3a8a', '#111827', '#166534'].map((c) => (
                  <button
                    key={c}
                    type="button"
                    aria-label={`Ink color ${c}`}
                    onClick={() => setInk(c)}
                    className={`h-6 w-6 rounded-full border-2 ${ink === c ? 'border-brand-500' : 'border-transparent'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
                <button type="button" className="btn-ghost text-sm" onClick={clear}>
                  <Eraser className="h-4 w-4" aria-hidden /> Clear
                </button>
              </div>
              <button
                type="button"
                className="btn-primary"
                disabled={!hasDrawing}
                onClick={() => canvasRef.current && finishFromCanvas(canvasRef.current)}
              >
                Use signature
              </button>
            </div>
          </div>
        )}

        {tab === 'type' && (
          <div className="space-y-4">
            <input
              className="input-base text-2xl"
              style={{ fontFamily: FONTS[fontIdx] }}
              placeholder="Type your name"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              aria-label="Signature text"
            />
            <div className="grid grid-cols-2 gap-2">
              {FONTS.map((f, i) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFontIdx(i)}
                  className={`rounded-xl border px-3 py-2 text-xl ${
                    fontIdx === i ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10' : 'border-neutral-200 dark:border-neutral-700'
                  }`}
                  style={{ fontFamily: f }}
                >
                  {typed || 'Signature'}
                </button>
              ))}
            </div>
            <div className="flex justify-end">
              <button type="button" className="btn-primary" disabled={!typed.trim()} onClick={finishTyped}>
                Use signature
              </button>
            </div>
          </div>
        )}

        {tab === 'upload' && (
          <div className="py-6 text-center">
            <p className="mb-4 text-sm text-neutral-500 dark:text-neutral-400">
              Upload a photo or scan of your signature (PNG with transparency works best).
            </p>
            <label className="btn-primary inline-flex cursor-pointer">
              Choose image
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) onUpload(f)
                }}
              />
            </label>
          </div>
        )}
      </div>
    </div>
  )
}
