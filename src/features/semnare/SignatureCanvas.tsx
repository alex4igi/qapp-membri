import { useEffect, useRef, useState } from 'react'

type Props = {
  onChange: (dataUrl: string | null) => void
}

// Canvas de semnătură cu listeneri NATIVI non-pasivi (nu React synthetic):
// React atașează touch/pointer ca passive la root, iar pe iOS Safari
// preventDefault() nu mai are efect → gestul devine scroll și nu se desenează.
// Pattern-ul de mai jos (pointer + fallback touch, passive:false, direct pe
// element) e cel folosit de librăriile dedicate de signature-pad.
export function SignatureCanvas({ onChange }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  const [empty, setEmpty] = useState(true)
  // remount la „Șterge și reia": resetează și starea din closure (drawing/hasInk)
  const [resetKey, setResetKey] = useState(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = Math.max(window.devicePixelRatio || 1, 1)
    const rect = canvas.getBoundingClientRect()
    canvas.width = Math.round(rect.width * dpr)
    canvas.height = Math.round(rect.height * dpr)
    const ctx = canvas.getContext('2d')!
    ctx.scale(dpr, dpr)
    ctx.lineWidth = 2.2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#1a1a2e'

    let drawing = false
    let hasInk = false

    function point(clientX: number, clientY: number) {
      const r = canvas!.getBoundingClientRect()
      return { x: clientX - r.left, y: clientY - r.top }
    }
    function begin(clientX: number, clientY: number) {
      drawing = true
      const { x, y } = point(clientX, clientY)
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(x + 0.1, y + 0.1) // punct vizibil chiar și la un tap scurt
      ctx.stroke()
      hasInk = true
    }
    function extend(clientX: number, clientY: number) {
      if (!drawing) return
      const { x, y } = point(clientX, clientY)
      ctx.lineTo(x, y)
      ctx.stroke()
    }
    function finish() {
      if (!drawing) return
      drawing = false
      if (hasInk) {
        setEmpty(false)
        onChangeRef.current(canvas!.toDataURL('image/png'))
      }
    }

    const hasPointer = typeof window.PointerEvent !== 'undefined'

    function onPointerDown(e: PointerEvent) {
      e.preventDefault()
      try {
        canvas!.setPointerCapture(e.pointerId)
      } catch {
        /* iOS poate refuza capture; desenăm oricum */
      }
      begin(e.clientX, e.clientY)
    }
    function onPointerMove(e: PointerEvent) {
      if (!drawing) return
      e.preventDefault()
      extend(e.clientX, e.clientY)
    }
    function onPointerEnd(e: PointerEvent) {
      e.preventDefault()
      finish()
    }

    function onTouchStart(e: TouchEvent) {
      e.preventDefault()
      const t = e.touches[0]
      if (t) begin(t.clientX, t.clientY)
    }
    function onTouchMove(e: TouchEvent) {
      e.preventDefault()
      const t = e.touches[0]
      if (t) extend(t.clientX, t.clientY)
    }
    function onTouchEnd(e: TouchEvent) {
      e.preventDefault()
      finish()
    }

    const opts: AddEventListenerOptions = { passive: false }
    if (hasPointer) {
      canvas.addEventListener('pointerdown', onPointerDown, opts)
      canvas.addEventListener('pointermove', onPointerMove, opts)
      canvas.addEventListener('pointerup', onPointerEnd, opts)
      canvas.addEventListener('pointercancel', onPointerEnd, opts)
      canvas.addEventListener('pointerleave', onPointerEnd, opts)
    } else {
      canvas.addEventListener('touchstart', onTouchStart, opts)
      canvas.addEventListener('touchmove', onTouchMove, opts)
      canvas.addEventListener('touchend', onTouchEnd, opts)
      canvas.addEventListener('touchcancel', onTouchEnd, opts)
      canvas.addEventListener('mousedown', (e) => begin(e.clientX, e.clientY))
      canvas.addEventListener('mousemove', (e) => extend(e.clientX, e.clientY))
      canvas.addEventListener('mouseup', () => finish())
    }
    // gard suplimentar iOS: chiar și cu pointer events, blocăm scroll-ul nativ
    canvas.addEventListener('touchstart', (e) => e.preventDefault(), opts)
    canvas.addEventListener('touchmove', (e) => e.preventDefault(), opts)

    return () => {
      // elementul canvas e înlocuit la reset (key); listenerii mor cu el
    }
  }, [resetKey])

  function clear() {
    setEmpty(true)
    onChangeRef.current(null)
    setResetKey((k) => k + 1)
  }

  return (
    <div className="space-y-2">
      <canvas
        key={resetKey}
        ref={canvasRef}
        className="h-40 w-full touch-none select-none rounded-xl border-2 border-dashed border-line bg-white"
        style={{ touchAction: 'none', WebkitUserSelect: 'none', WebkitTapHighlightColor: 'transparent' }}
        onContextMenu={(e) => e.preventDefault()}
      />
      <div className="flex items-center justify-between">
        <p className="text-xs text-sub">
          {empty ? 'Desenează semnătura cu degetul sau mouse-ul' : 'Semnătură desenată ✓'}
        </p>
        <button
          type="button"
          onClick={clear}
          className="text-xs font-medium text-sub underline hover:text-ink"
        >
          Șterge și reia
        </button>
      </div>
    </div>
  )
}
