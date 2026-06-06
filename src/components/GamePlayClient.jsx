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
import CategoriesPlay from '@/components/categories/CategoriesPlay'
import DoodlePlay from '@/components/doodle/DoodlePlay'
import WordBluffPlay from '@/components/wordBluff/WordBluffPlay'
import WouldYouRatherPlay from '@/components/wouldYouRather/WouldYouRatherPlay'
import NeverHaveIEverPlay from '@/components/neverHaveIEver/NeverHaveIEverPlay'
import CardCrimesPlay from '@/components/cardCrimes/CardCrimesPlay'
import MatureGate from '@/components/MatureGate'
import PartyVideoControls from '@/components/partyVideo/PartyVideoControls'
import PartyChat from '@/components/partyVideo/PartyChat'
import { useRoomPoll } from '@/hooks/useRoomPoll'
import { loadRejoin } from '@/lib/rejoin'
import { GoHomeButton } from '@/components/PartyGameLayout'
import { getGameMeta } from '@/lib/games/registry'
import { PhoneStage, PromptCard, Scoreboard, PhaseReveal, getAccent } from '@/components/game/GameUI'

function RoundResultsScreen({ room, playerId, phase, accentKey }) {
  const results = room?.gameState?.roundResults || []
  const players = room?.players || []
  const player = players.find((p) => p.id === playerId)
  const myResult = results.find((r) => r.playerId === playerId)
  const winner = players.find((p) => p.id === room?.gameState?.winnerId)
  const isVictory = phase === 'victory'
  const sorted = [...players].sort((a, b) => (Number(b.score) || 0) - (Number(a.score) || 0))
  const myRank = sorted.findIndex((p) => p.id === playerId) + 1
  const iWon = isVictory && winner?.id === playerId

  return (
    <PhoneStage title={isVictory ? 'Game over' : 'Round over'} emoji={isVictory ? '🏁' : '📊'} accentKey={accentKey}>
      <PromptCard accentKey={accentKey} className="text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-white/40">
          {isVictory ? (iWon ? 'You win!' : 'Final standing') : 'Your placement'}
        </p>
        <p className="mt-2 font-display text-6xl font-black text-white">
          {myRank ? `#${myRank}` : '—'}
        </p>
        {myResult?.pointsEarned ? (
          <PhaseReveal>
            <p className="mt-1 font-display text-xl font-bold" style={{ color: getAccent(accentKey).hex }}>
              +{myResult.pointsEarned} pts this round
            </p>
          </PhaseReveal>
        ) : null}
        <p className="mt-3 text-sm text-white/50">
          Total <strong className="text-white">{(Number(player?.score) || 0).toLocaleString()}</strong>
        </p>
      </PromptCard>

      <div className="mt-5 flex-1">
        <Scoreboard
          players={players}
          results={results}
          targetScore={room?.config?.targetScore}
          accentKey={accentKey}
        />
      </div>

      {isVictory ? (
        <div className="mt-6">
          <GoHomeButton />
        </div>
      ) : (
        <p className="mt-6 text-center text-sm text-white/40">Next round starting on the main screen…</p>
      )}
    </PhoneStage>
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
      return <RoundResultsScreen room={room} playerId={playerId} phase={phase} accentKey={gameId} />
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
      categories: <CategoriesPlay {...playProps} />,
      doodle: <DoodlePlay {...playProps} />,
      wordBluff: <WordBluffPlay {...playProps} />,
      wouldYouRather: <WouldYouRatherPlay {...playProps} />,
      neverHaveIEver: <NeverHaveIEverPlay {...playProps} />,
      cardCrimes: <CardCrimesPlay {...playProps} />,
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
