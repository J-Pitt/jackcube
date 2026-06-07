'use client'

import { usePartyVideo } from '@/contexts/PartyVideoContext'
import HostVideoRail from './HostVideoRail'
import PartyChat from './PartyChat'

/** TV footer: video on top, chat below — collapses when empty */
export default function PartyBottomPanel({ room, roomId, className = '' }) {
  const { hasActiveVideo, panelExpanded } = usePartyVideo()
  const compact = !hasActiveVideo && !panelExpanded

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      <HostVideoRail />
      {!compact && <PartyChat room={room} roomId={roomId} />}
    </div>
  )
}
