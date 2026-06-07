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
import TriviaDuelPlay from '@/components/triviaDuel/TriviaDuelPlay'
import ReactionDuelPlay from '@/components/reactionDuel/ReactionDuelPlay'
import DoodleDuelPlay from '@/components/doodleDuel/DoodleDuelPlay'
import CaptionDuelPlay from '@/components/captionDuel/CaptionDuelPlay'
import MatureGate from '@/components/MatureGate'
import PlayPartyPanel from '@/components/partyVideo/PlayPartyPanel'
import PlayerResultsScreen from '@/components/results/PlayerResultsScreen'
import { useRoomPoll } from '@/hooks/useRoomPoll'
import { loadRejoin } from '@/lib/rejoin'
import { getGameMeta } from '@/lib/games/registry'

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
      return <PlayerResultsScreen room={room} playerId={playerId} phase={phase} accentKey={gameId} />
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
      triviaDuel: <TriviaDuelPlay {...playProps} />,
      reactionDuel: <ReactionDuelPlay {...playProps} />,
      doodleDuel: <DoodleDuelPlay {...playProps} />,
      captionDuel: <CaptionDuelPlay {...playProps} />,
    }

    return playMap[gameId] || playMap.captionClash
  })()

  return (
    <MatureGate required={meta.mature}>
      <div className="relative min-h-screen">
        {phase !== 'lobby' && (
          <PlayPartyPanel room={room} roomId={roomId} playerId={playerId} isHost={isHost} />
        )}
        {content}
      </div>
    </MatureGate>
  )
}
