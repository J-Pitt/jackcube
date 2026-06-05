'use client'

import { useEffect, useRef, useState } from 'react'
import { advanceGame } from '@/lib/roomApi'

/** Host-only 3-2-1 countdown; advances once per round (no double-fire). */
export function useGameCountdown({ phase, round, roomId, hostId, onDone }) {
  const [countdown, setCountdown] = useState(null)
  const advancedRoundRef = useRef(null)

  useEffect(() => {
    if (phase !== 'countdown' || !roomId || !hostId || round == null) {
      setCountdown(null)
      return undefined
    }
    if (advancedRoundRef.current === round) {
      setCountdown(null)
      return undefined
    }

    setCountdown(3)
    const interval = setInterval(() => {
      setCountdown((c) => (c == null || c <= 1 ? null : c - 1))
    }, 1000)
    const timeout = setTimeout(() => {
      if (advancedRoundRef.current === round) return
      advancedRoundRef.current = round
      advanceGame(roomId, hostId)
        .then(() => onDone?.())
        .catch(() => {
          advancedRoundRef.current = null
        })
    }, 3200)

    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [phase, round, roomId, hostId, onDone])

  return countdown
}
