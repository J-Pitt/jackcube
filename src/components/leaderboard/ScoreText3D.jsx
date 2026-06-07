'use client'

import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'

function prefersReducedMotion() {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * drei <Text> that animates from `from` up to `value` in-scene without
 * triggering React re-renders every frame (mutates the troika text instance).
 */
export default function ScoreText3D({
  value = 0,
  from = 0,
  duration = 1.1,
  delay = 0,
  prefix = '',
  suffix = '',
  format = true,
  ...textProps
}) {
  const ref = useRef()
  const startRef = useRef(null)
  const reduced = prefersReducedMotion()

  useEffect(() => {
    startRef.current = null
  }, [value, from, delay])

  const render = (n) => {
    const rounded = Math.round(n)
    const body = format ? rounded.toLocaleString() : String(rounded)
    return `${prefix}${body}${suffix}`
  }

  useFrame((state) => {
    const mesh = ref.current
    if (!mesh) return
    if (reduced) {
      if (mesh.text !== render(value)) {
        mesh.text = render(value)
        mesh.sync?.()
      }
      return
    }
    if (startRef.current === null) startRef.current = state.clock.elapsedTime + delay
    const t = state.clock.elapsedTime - startRef.current
    if (t < 0) return
    const progress = Math.min(1, t / duration)
    const eased = 1 - Math.pow(1 - progress, 3)
    const current = from + (value - from) * eased
    const next = render(current)
    if (mesh.text !== next) {
      mesh.text = next
      mesh.sync?.()
    }
  })

  return (
    <Text ref={ref} {...textProps}>
      {render(reduced ? value : from)}
    </Text>
  )
}
