'use client'

import { usePartyVideo } from '@/contexts/PartyVideoContext'
import PartyVideoControls from './PartyVideoControls'
import PartyChat from './PartyChat'
import LeaveGameButton from '@/components/LeaveGameButton'

/** Phone play screen — collapses video/chat when nobody is on cam */
export default function PlayPartyPanel({ room, roomId, playerId, isHost }) {
  const { hasActiveVideo, panelExpanded, setPanelExpanded } = usePartyVideo()

  if (!hasActiveVideo && !panelExpanded) {
    return (
      <div className="sticky top-0 z-40 flex items-center justify-between gap-2 border-b-2 border-cube-cyan/30 bg-cube-bg/95 px-4 py-2 backdrop-blur">
        <button
          type="button"
          onClick={() => setPanelExpanded(true)}
          className="text-xs text-white/50 hover:text-cube-cyan"
        >
          Video &amp; chat
        </button>
        <LeaveGameButton compact label="Leave" className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold text-white/70 hover:bg-white/10" />
      </div>
    )
  }

  return (
    <div className="sticky top-0 z-40 space-y-2 border-b-2 border-cube-cyan/30 bg-cube-bg/95 px-4 py-2 backdrop-blur">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          {isHost && (
            <p className="mb-1 text-center text-xs text-white/50">
              Host: pick phone or main screen camera below.
            </p>
          )}
          <PartyVideoControls compact />
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          {!hasActiveVideo && (
            <button
              type="button"
              onClick={() => setPanelExpanded(false)}
              className="text-xs text-white/40 hover:text-white/70"
            >
              Minimize
            </button>
          )}
          <LeaveGameButton compact label="Leave" className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold text-white/70 hover:bg-white/10" />
        </div>
      </div>
      <PartyChat room={room} roomId={roomId} playerId={playerId} compact />
    </div>
  )
}
