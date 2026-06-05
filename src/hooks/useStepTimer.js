'use client'

import { useEffect, useRef } from 'react'
import { advanceGame } from '@/lib/roomApi'

/** Host-only: call advanceGame when gameState.endsAt passes */
export function useStepTimer({ enabled, endsAt, roomId, hostId, onAdvanced }) {
  const firedRef = useRef(false)

  useEffect(() => {
    firedRef.current = false
  }, [endsAt])

  useEffect(() => {
    if (!enabled || !endsAt || !roomId || !hostId) return undefined

    const check = () => {
      const end = new Date(endsAt).getTime()
      if (Date.now() >= end && !firedRef.current) {
        firedRef.current = true
        advanceGame(roomId, hostId)
          .then((res) => {
            onAdvanced?.(res)
          })
          .catch(() => {
            firedRef.current = false
          })
      }
    }

    const id = setInterval(check, 400)
    check()
    return () => clearInterval(id)
  }, [enabled, endsAt, roomId, hostId, onAdvanced])
}
