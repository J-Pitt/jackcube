'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import FlappyController from '@/components/flappy/FlappyController'
import { useRoomPoll } from '@/hooks/useRoomPoll'
import { sendFlap } from '@/lib/roomApi'
import { loadRejoin } from '@/lib/rejoin'

export default function GamePlayClient({ roomId: roomIdProp }) {
  const router = useRouter()
  const session = loadRejoin()
  const roomId = roomIdProp || session?.roomId
  const playerId = session?.playerId

  const { room } = useRoomPoll(roomId, 300)
  const [flapCooldown, setFlapCooldown] = useState(false)

  const phase = room?.phase
  const players = room?.players || []
  const player = players.find((p) => p.id === playerId)
  const bird = room?.gameState?.flappy?.birds?.[playerId]

  useEffect(() => {
    if (phase === 'lobby') {
      router.replace(`/lobby?roomId=${encodeURIComponent(roomId)}`)
    }
  }, [phase, roomId, router])

  async function handleFlap() {
    if (flapCooldown || phase !== 'playing' || !bird?.alive) return
    setFlapCooldown(true)
    try {
      await sendFlap(roomId, playerId)
    } catch {
      /* ignore transient errors */
    }
    setTimeout(() => setFlapCooldown(false), 80)
  }

  if (!roomId || !playerId) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6 text-center text-white/60">
        <p>Join a room first from the home screen.</p>
      </main>
    )
  }

  if (phase === 'countdown') {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-cube-bg p-6 text-center">
        <p className="text-sm uppercase tracking-widest text-cube-violet">Cube Flap</p>
        <p className="mt-4 font-display text-5xl font-bold text-cube-cyan">Get ready!</p>
        <p className="mt-2 text-white/50">Round {room?.gameState?.round ?? 1} starting…</p>
      </main>
    )
  }

  if (phase === 'leaderboard' || phase === 'victory') {
    const results = room?.gameState?.roundResults || []
    const myResult = results.find((r) => r.playerId === playerId)
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-cube-bg p-6 text-center">
        <p className="text-sm uppercase tracking-widest text-cube-violet">
          {phase === 'victory' ? 'Game over' : 'Round over'}
        </p>
        <p className="mt-4 font-display text-4xl font-bold text-white">
          {myResult ? `#${myResult.placement}` : '—'}
        </p>
        {myResult && (
          <p className="mt-2 text-2xl text-cube-cyan">+{myResult.pointsEarned} pts</p>
        )}
        <p className="mt-4 text-white/50">
          Total: <strong className="text-white">{player?.score?.toLocaleString() ?? 0}</strong>
        </p>
        <p className="mt-8 text-sm text-white/40">Watch the main screen for the 3D leaderboard</p>
      </main>
    )
  }

  if (phase === 'playing') {
    return (
      <FlappyController
        player={player}
        bird={bird}
        onFlap={handleFlap}
        disabled={flapCooldown}
      />
    )
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-cube-bg p-6 text-white/50">
      Waiting for host…
    </main>
  )
}
