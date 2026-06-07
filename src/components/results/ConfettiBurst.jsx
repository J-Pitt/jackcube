'use client'

import { useEffect, useRef } from 'react'

function prefersReducedMotion() {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Fires a celebratory confetti burst once when `active` becomes true.
 * Lightweight DOM/canvas effect (canvas-confetti). No-ops under reduced motion.
 *
 * Renders nothing itself — it draws onto its own full-screen canvas overlay.
 */
export default function ConfettiBurst({
  active = true,
  colors = ['#00F5D4', '#6C5CE7', '#FF6B6B', '#FFD166', '#ffffff'],
  duration = 2600,
  intensity = 1,
}) {
  const firedRef = useRef(false)

  useEffect(() => {
    if (!active || firedRef.current) return undefined
    if (prefersReducedMotion()) return undefined
    firedRef.current = true

    let cancelled = false
    let cleanupTimer = null

    ;(async () => {
      const mod = await import('canvas-confetti')
      if (cancelled) return
      const confetti = mod.default

      const end = Date.now() + duration
      const defaults = { colors, disableForReducedMotion: true, zIndex: 90 }

      // Initial celebratory pops from both lower corners.
      confetti({ ...defaults, particleCount: Math.round(120 * intensity), spread: 70, origin: { x: 0.2, y: 0.7 }, angle: 60 })
      confetti({ ...defaults, particleCount: Math.round(120 * intensity), spread: 70, origin: { x: 0.8, y: 0.7 }, angle: 120 })

      // Sustained streamers from the top edge.
      const frame = () => {
        if (cancelled) return
        confetti({
          ...defaults,
          particleCount: Math.round(6 * intensity),
          spread: 100,
          startVelocity: 35,
          gravity: 0.9,
          ticks: 220,
          origin: { x: Math.random(), y: -0.1 },
        })
        if (Date.now() < end) requestAnimationFrame(frame)
      }
      frame()
    })()

    return () => {
      cancelled = true
      if (cleanupTimer) clearTimeout(cleanupTimer)
    }
  }, [active, colors, duration, intensity])

  return null
}
