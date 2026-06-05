'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import TruthPlay from '@/components/truthOrCube/TruthPlay'
import FakinPlay from '@/components/fakinIt/FakinPlay'
import DrawfulPlay from '@/components/dirtyDrawful/DrawfulPlay'
import FinishPlay from '@/components/letMeFinish/FinishPlay'
import CaptionPlay from '@/components/captionClash/CaptionPlay'
import BluffPlay from '@/components/bluffBox/BluffPlay'
import TriviaPlay from '@/components/triviaToss/TriviaPlay'
import ReactionPlay from '@/components/reactionRush/ReactionPlay'
import MatureGate from '@/components/MatureGate'
import PartyVideoControls from '@/components/partyVideo/PartyVideoControls'
import PartyChat from '@/components/partyVideo/PartyChat'
import { useRoomPoll } from '@/hooks/useRoomPoll'
import { loadRejoin } from '@/lib/rejoin'
import { GoHomeButton } from '@/components/PartyGameLayout'
import { getGameMeta } from '@/lib/games/registry'

function RoundResultsScreen({ room, playerId, phase }) {
  const results = room?.gameState?.roundResults || []
  const player = room?.players?.find((p) => p.id === playerId)
  const myResult = results.find((r) => r.playerId === playerId)
  const winner = room?.players?.find((p) => p.id === room?.gameState?.winnerId)
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
      {phase === 'victory' ? (
        <>
          {winner && (
            <p className="mt-6 font-display text-2xl font-bold text-cube-cyan">
              {winner.name} wins!
            </p>
          )}
          <div className="mt-8 w-full max-w-xs">
            <GoHomeButton />
          </div>
        </>
      ) : (
        <p className="mt-8 text-sm text-white/40">Watch the main screen for the leaderboard</p>
      )}
    </main>
  )
}

export default function GamePlayClient({ roomId: roomIdProp }) {
  const router = useRouter()
  const session = loadRejoin()
  const roomId = roomIdProp || session?.roomId
  const playerId = session?.playerId

  const { room } = useRoomPoll(roomId, 800)
  const gameId = room?.config?.gameId || 'captionClash'
  const meta = getGameMeta(gameId)
  const phase = room?.phase
  const players = room?.players || []
  const isHost = playerId === room?.hostId

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

  const playProps = { room, roomId, playerId }

  const content = (() => {
    if (phase === 'leaderboard' || phase === 'victory') {
      return <RoundResultsScreen room={room} playerId={playerId} phase={phase} />
    }

    const playMap = {
      truthOrCube: <TruthPlay {...playProps} />,
      fakinIt: <FakinPlay {...playProps} players={players} />,
      dirtyDrawful: <DrawfulPlay {...playProps} />,
      letMeFinish: <FinishPlay {...playProps} players={players} />,
      captionClash: <CaptionPlay {...playProps} />,
      bluffBox: <BluffPlay {...playProps} />,
      triviaToss: <TriviaPlay {...playProps} />,
      reactionRush: <ReactionPlay {...playProps} />,
    }

    return playMap[gameId] || playMap.captionClash
  })()

  return (
    <MatureGate required={meta.mature}>
      <div className="relative min-h-screen">
        {phase !== 'lobby' && (
          <div className="sticky top-0 z-40 space-y-2 border-b border-white/10 bg-cube-bg/95 px-4 py-2 backdrop-blur">
            {isHost && (
              <p className="text-center text-xs text-white/50">
                Host: join video here — your camera shows on the main screen.
              </p>
            )}
            <PartyVideoControls compact />
            <PartyChat room={room} roomId={roomId} playerId={playerId} compact />
          </div>
        )}
        {content}
      </div>
    </MatureGate>
  )
}
