'use client'

import { useCallback, useEffect, useState } from 'react'
import { getRoomMe, sendInput } from '@/lib/roomApi'

export default function ReactionPlay({ room, roomId, playerId }) {
  const [me, setMe] = useState(null)
  const rr = room?.gameState?.reactionRush
  const phase = room?.phase

  const refreshMe = useCallback(() => {
    getRoomMe(roomId, playerId).then(setMe).catch(() => {})
  }, [roomId, playerId])

  useEffect(() => {
    refreshMe()
    const id = setInterval(refreshMe, 400)
    return () => clearInterval(id)
  }, [refreshMe, rr?.step])

  async function tap() {
    await sendInput(roomId, playerId, 'reactionTap')
    refreshMe()
  }

  if (phase === 'countdown') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-cube-bg p-6 text-center">
        <p className="font-display text-4xl font-bold text-cube-danger">Reaction Rush</p>
        <p className="mt-2 text-white/50">Get ready…</p>
      </main>
    )
  }

  if (!rr || phase !== 'playing') {
    return <main className="flex min-h-screen items-center justify-center bg-cube-bg p-6 text-white/50">Watch the TV…</main>
  }

  if (rr.step === 'ready') {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-cube-bg p-6">
        <p className="font-display text-5xl font-black text-cube-danger">WAIT</p>
        <p className="mt-4 text-white/50">Don&apos;t tap!</p>
        <button
          type="button"
          onClick={tap}
          className="mt-12 h-40 w-40 rounded-full border-4 border-cube-danger/50 bg-cube-danger/10 text-xl font-bold text-cube-danger"
        >
          TAP
        </button>
        {me?.early && <p className="mt-4 text-cube-danger">Too early!</p>}
      </main>
    )
  }

  if (rr.step === 'go') {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-cube-bg p-6">
        <p className="font-display text-6xl font-black text-cube-cyan">GO!</p>
        <button
          type="button"
          disabled={me?.tapped || me?.early}
          onClick={tap}
          className="mt-12 h-48 w-48 rounded-full border-4 border-cube-cyan bg-cube-cyan/20 text-2xl font-black text-cube-cyan disabled:opacity-40"
        >
          {me?.tapped ? '✓' : 'TAP!'}
        </button>
      </main>
    )
  }

  return <main className="flex min-h-screen items-center justify-center bg-cube-bg p-6 text-white/50">Results on TV…</main>
}
