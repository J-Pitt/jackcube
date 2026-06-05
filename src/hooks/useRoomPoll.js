'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { getRoom } from '@/lib/roomApi'

export function useRoomPoll(roomId, intervalMs = 2000) {
  const [room, setRoom] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(!!roomId)
  const mounted = useRef(true)

  const refresh = useCallback(async () => {
    if (!roomId) return
    try {
      const data = await getRoom(roomId)
      if (mounted.current) {
        setRoom(data)
        setError(null)
        setLoading(false)
      }
    } catch (err) {
      if (mounted.current) {
        setError(err.message || 'Failed to load room')
        setLoading(false)
      }
    }
  }, [roomId])

  useEffect(() => {
    mounted.current = true
    if (!roomId) {
      setRoom(null)
      setLoading(false)
      return undefined
    }

    refresh()
    const id = setInterval(refresh, intervalMs)
    return () => {
      mounted.current = false
      clearInterval(id)
    }
  }, [roomId, intervalMs, refresh])

  return { room, error, loading, refresh }
}
