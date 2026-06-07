'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import AdultGamesPasswordModal from '@/components/AdultGamesPasswordModal'
import { isAdultUnlocked } from '@/lib/adultAccess'
import TruthHost from '@/components/truthOrCube/TruthHost'
import FakinHost from '@/components/fakinIt/FakinHost'
import DrawfulHost from '@/components/dirtyDrawful/DrawfulHost'
import FinishHost from '@/components/letMeFinish/FinishHost'
import CaptionHost from '@/components/captionClash/CaptionHost'
import BluffHost from '@/components/bluffBox/BluffHost'
import TriviaHost from '@/components/triviaToss/TriviaHost'
import ReactionHost from '@/components/reactionRush/ReactionHost'
import CategoriesHost from '@/components/categories/CategoriesHost'
import DoodleHost from '@/components/doodle/DoodleHost'
import WordBluffHost from '@/components/wordBluff/WordBluffHost'
import WouldYouRatherHost from '@/components/wouldYouRather/WouldYouRatherHost'
import NeverHaveIEverHost from '@/components/neverHaveIEver/NeverHaveIEverHost'
import CardCrimesHost from '@/components/cardCrimes/CardCrimesHost'
import TriviaDuelHost from '@/components/triviaDuel/TriviaDuelHost'
import ReactionDuelHost from '@/components/reactionDuel/ReactionDuelHost'
import DoodleDuelHost from '@/components/doodleDuel/DoodleDuelHost'
import CaptionDuelHost from '@/components/captionDuel/CaptionDuelHost'
import PartyBottomPanel from '@/components/partyVideo/PartyBottomPanel'
import LeaveGameButton from '@/components/LeaveGameButton'
import { usePartyVideo } from '@/contexts/PartyVideoContext'
import { useRoomPoll } from '@/hooks/useRoomPoll'
import { loadRejoin } from '@/lib/rejoin'

export default function GameHostClient({ roomId: roomIdProp }) {
  const router = useRouter()
  const [adultModalOpen, setAdultModalOpen] = useState(false)
  const session = loadRejoin()
  const roomId = roomIdProp || session?.roomId
  const { room, refresh } = useRoomPoll(roomId, 400)
  const { hasActiveVideo, panelExpanded } = usePartyVideo()

  const isTvScreen = session?.screenRole === 'tv'
  const hostId = room?.hostId
  const isHostPlayer =
    session?.isHost === true || session?.playerId === room?.hostId
  const canViewHostScreen = isTvScreen || isHostPlayer
  const gameId = room?.config?.gameId || 'captionClash'

  if (!roomId) {
    return <p className="p-8 text-white/60">No room session.</p>
  }

  if (!canViewHostScreen) {
    return (
      <main className="flex min-h-screen items-center justify-center p-8 text-center">
        <p className="text-white/60">
          This is the main game screen. Open <strong>/play</strong> on your phone.
        </p>
      </main>
    )
  }

  const hostProps = { room, roomId, hostId, refresh }

  const gameMap = {
    truthOrCube: <TruthHost {...hostProps} />,
    fakinIt: <FakinHost {...hostProps} />,
    dirtyDrawful: <DrawfulHost {...hostProps} />,
    letMeFinish: <FinishHost {...hostProps} />,
    captionClash: <CaptionHost {...hostProps} />,
    bluffBox: <BluffHost {...hostProps} />,
    triviaToss: <TriviaHost {...hostProps} />,
    reactionRush: <ReactionHost {...hostProps} />,
    categories: <CategoriesHost {...hostProps} />,
    doodle: <DoodleHost {...hostProps} />,
    wordBluff: <WordBluffHost {...hostProps} />,
    wouldYouRather: <WouldYouRatherHost {...hostProps} />,
    neverHaveIEver: <NeverHaveIEverHost {...hostProps} />,
    cardCrimes: <CardCrimesHost {...hostProps} />,
    triviaDuel: <TriviaDuelHost {...hostProps} />,
    reactionDuel: <ReactionDuelHost {...hostProps} />,
    doodleDuel: <DoodleDuelHost {...hostProps} />,
    captionDuel: <CaptionDuelHost {...hostProps} />,
  }

  const game = gameMap[gameId] || gameMap.captionClash

  function openAdultCatalog() {
    if (isAdultUnlocked()) {
      router.push('/adult-games')
      return
    }
    setAdultModalOpen(true)
  }

  const videoDockCompact = !hasActiveVideo && !panelExpanded

  return (
    <div className={`relative ${videoDockCompact ? 'pb-20' : 'pb-[min(42vh,460px)]'}`}>
      {game}
      <div className="fixed right-4 top-4 z-40 flex flex-wrap items-center justify-end gap-2">
        {isTvScreen && (
          <button
            type="button"
            onClick={openAdultCatalog}
            className="rounded-full border border-cube-danger/40 bg-cube-danger/10 px-4 py-2 text-xs font-semibold text-cube-danger hover:bg-cube-danger/20"
          >
            Adult games
          </button>
        )}
        <LeaveGameButton
          compact
          label="Leave game"
          className="rounded-full border border-white/15 bg-cube-bg/80 px-4 py-2 text-xs font-semibold text-white/80 backdrop-blur hover:bg-white/10"
        />
      </div>
      <AdultGamesPasswordModal
        open={adultModalOpen}
        onClose={() => setAdultModalOpen(false)}
        onUnlocked={() => router.push('/adult-games')}
      />
      <div className="pointer-events-none fixed bottom-0 left-0 right-0 z-40 max-h-[55vh] overflow-y-auto px-4 pb-4 pt-2">
        <div className="pointer-events-auto mx-auto max-w-6xl">
          <PartyBottomPanel room={room} roomId={roomId} />
        </div>
      </div>
    </div>
  )
}
