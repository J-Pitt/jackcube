'use client'

import HostVideoRail from './HostVideoRail'
import PartyChat from './PartyChat'

/** TV footer: video on top, chat below — no overlap */
export default function PartyBottomPanel({ room, roomId, className = '' }) {
  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      <HostVideoRail />
      <PartyChat room={room} roomId={roomId} />
    </div>
  )
}
