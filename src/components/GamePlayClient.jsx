'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import FlappyController from '@/components/flappy/FlappyController'
import TruthPlay from '@/components/truthOrCube/TruthPlay'
import FakinPlay from '@/components/fakinIt/FakinPlay'
import DrawfulPlay from '@/components/dirtyDrawful/DrawfulPlay'
import FinishPlay from '@/components/letMeFinish/FinishPlay'
import MatureGate from '@/components/MatureGate'
import PartyVideoControls from '@/components/partyVideo/PartyVideoControls'
import { useRoomPoll } from '@/hooks/useRoomPoll'
import { sendFlap } from '@/lib/roomApi'
import { loadRejoin } from '@/lib/rejoin'
import { getGameMeta } from '@/lib/games/registry'

function RoundResultsScreen({ room, playerId, phase }) {
  const results = room?.gameState?.roundResults || []
  const player = room?.players?.find((p) => p.id === playerId)
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
      <p className="mt-8 text-sm text-white/40">Watch the main screen for the leaderboard</p>
    </main>
  )
}

export default function GamePlayClient({ roomId: roomIdProp }) {
  const router = useRouter()
  const session = loadRejoin()
  const roomId = roomIdProp || session?.roomId
  const playerId = session?.playerId

  const { room } = useRoomPoll(roomId, 300)
  const gameId = room?.config?.gameId || 'flappy'
  const meta = getGameMeta(gameId)
  const phase = room?.phase
  const players = room?.players || []
  const player = players.find((p) => p.id === playerId)
  const bird = room?.gameState?.flappy?.birds?.[playerId]

  useEffect(() => {
    if (phase === 'lobby') {
      router.replace(`/lobby?roomId=${encodeURIComponent(roomId)}`)
    }
  }, [phase, roomId, router])

  if (!roomId || !playerId) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6 text-center text-white/60">
        <p>Join a room first from the home screen.</p>
      </main>
    )
  }

  const content = (() => {
    if (phase === 'leaderboard' || phase === 'victory') {
      return <RoundResultsScreen room={room} playerId={playerId} phase={phase} />
    }

    if (gameId === 'truthOrCube') {
      return <TruthPlay room={room} roomId={roomId} playerId={playerId} />
    }
    if (gameId === 'fakinIt') {
      return <FakinPlay room={room} roomId={roomId} playerId={playerId} players={players} />
    }
    if (gameId === 'dirtyDrawful') {
      return <DrawfulPlay room={room} roomId={roomId} playerId={playerId} />
    }
    if (gameId === 'letMeFinish') {
      return <FinishPlay room={room} roomId={roomId} playerId={playerId} players={players} />
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

    if (phase === 'playing') {
      return (
        <FlappyController
          player={player}
          bird={bird}
          onFlap={async () => {
            await sendFlap(roomId, playerId)
          }}
        />
      )
    }

    return (
      <main className="flex min-h-screen items-center justify-center bg-cube-bg p-6 text-white/50">
        Waiting for host…
      </main>
    )
  })()

  return (
    <MatureGate required={meta.mature}>
      <div className="relative min-h-screen">
        {phase !== 'lobby' && (
          <div className="sticky top-0 z-40 border-b border-white/10 bg-cube-bg/95 px-4 py-2 backdrop-blur">
            <PartyVideoControls compact />
          </div>
        )}
        {content}
      </div>
    </MatureGate>
  )
}
