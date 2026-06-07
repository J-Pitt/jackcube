'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { leaveRoom, leaveRoomBeacon } from '@/lib/roomApi'
import { clearRejoin, loadRejoin } from '@/lib/rejoin'
import { VIDEO_JOIN_KEY, VIDEO_SOURCE_KEY } from '@/lib/partyVideo'

export function useLeaveGame() {
  const router = useRouter()

  return useCallback(async () => {
    const session = loadRejoin()
    if (session?.roomId && session?.playerId) {
      try {
        await leaveRoom(session.roomId, session.playerId)
      } catch {
        leaveRoomBeacon(session.roomId, session.playerId)
      }
    }
    try {
      localStorage.removeItem(VIDEO_JOIN_KEY)
      localStorage.removeItem(VIDEO_SOURCE_KEY)
    } catch {
      /* ignore */
    }
    clearRejoin()
    router.push('/')
  }, [router])
}
