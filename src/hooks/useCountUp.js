'use client'

import { useEffect, useState } from 'react'
import { animate } from 'framer-motion'

function prefersReducedMotion() {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Animate a number from a starting value up to `target`.
 * Returns the current (rounded) display value.
 *
 * Respects prefers-reduced-motion by snapping straight to the target.
 */
export function useCountUp(target = 0, { from = 0, duration = 1.1, delay = 0 } = {}) {
  const [value, setValue] = useState(prefersReducedMotion() ? target : from)

  useEffect(() => {
    if (prefersReducedMotion()) {
      setValue(target)
      return undefined
    }
    const controls = animate(from, target, {
      duration,
      delay,
      ease: 'easeOut',
      onUpdate: (v) => setValue(Math.round(v)),
    })
    return () => controls.stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, from, duration, delay])

  return value
}
