'use client'

import { useCallback, useEffect, useRef } from 'react'

const COLORS = ['#ffffff', '#ff6b6b', '#4ecdc4', '#ffe66d', '#a855f7', '#111111']

export default function DrawCanvas({ strokes, onStroke, onUndo, onClear, disabled }) {
  const canvasRef = useRef(null)
  const drawingRef = useRef(false)
  const currentRef = useRef(null)

  const redraw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1
    const w = canvas.clientWidth
    const h = canvas.clientHeight
    canvas.width = w * dpr
    canvas.height = h * dpr
    ctx.scale(dpr, dpr)
    ctx.fillStyle = '#1a1a2e'
    ctx.fillRect(0, 0, w, h)
    ;(strokes || []).forEach((stroke) => {
      if (!stroke?.points?.length) return
      ctx.strokeStyle = stroke.color || '#fff'
      ctx.lineWidth = stroke.width || 4
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.beginPath()
      stroke.points.forEach((pt, i) => {
        if (i === 0) ctx.moveTo(pt.x, pt.y)
        else ctx.lineTo(pt.x, pt.y)
      })
      ctx.stroke()
    })
  }, [strokes])

  useEffect(() => {
    redraw()
    const onResize = () => redraw()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [redraw])

  function getPoint(e) {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const touch = e.touches?.[0] || e
    return {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
    }
  }

  function startDraw(e) {
    if (disabled) return
    e.preventDefault()
    drawingRef.current = true
    currentRef.current = {
      color: COLORS[0],
      width: 4,
      points: [getPoint(e)],
    }
  }

  function moveDraw(e) {
    if (!drawingRef.current || !currentRef.current) return
    e.preventDefault()
    currentRef.current.points.push(getPoint(e))
    redraw()
    const ctx = canvasRef.current.getContext('2d')
    const pts = currentRef.current.points
    const last = pts[pts.length - 2]
    const cur = pts[pts.length - 1]
    if (last) {
      ctx.strokeStyle = currentRef.current.color
      ctx.lineWidth = currentRef.current.width
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(last.x, last.y)
      ctx.lineTo(cur.x, cur.y)
      ctx.stroke()
    }
  }

  function endDraw() {
    if (!drawingRef.current || !currentRef.current) return
    drawingRef.current = false
    if (currentRef.current.points.length > 1) {
      onStroke?.(currentRef.current)
    }
    currentRef.current = null
    redraw()
  }

  return (
    <div className="flex flex-1 flex-col gap-3">
      <canvas
        ref={canvasRef}
        className="h-64 w-full touch-none rounded-xl border border-white/10 bg-cube-surface"
        onMouseDown={startDraw}
        onMouseMove={moveDraw}
        onMouseUp={endDraw}
        onMouseLeave={endDraw}
        onTouchStart={startDraw}
        onTouchMove={moveDraw}
        onTouchEnd={endDraw}
      />
      <div className="flex gap-2">
        {COLORS.map((c) => (
          <button
            key={c}
            type="button"
            className="h-8 w-8 rounded-full border border-white/20"
            style={{ backgroundColor: c }}
            onClick={() => {
              if (currentRef.current) currentRef.current.color = c
            }}
          />
        ))}
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onUndo}
          disabled={disabled}
          className="flex-1 rounded-xl border border-white/15 py-3 text-sm font-bold"
        >
          Undo
        </button>
        <button
          type="button"
          onClick={onClear}
          disabled={disabled}
          className="flex-1 rounded-xl border border-white/15 py-3 text-sm font-bold"
        >
          Clear
        </button>
      </div>
    </div>
  )
}
