'use client'

import HostVideoRail from './HostVideoRail'
import PartyChat from './PartyChat'

export default function PartyBottomPanel({ room, roomId, className = '' }) {
  return (
    <div className={`grid gap-3 lg:grid-cols-2 ${className}`}>
      <HostVideoRail />
      <PartyChat room={room} roomId={roomId} />
    </div>
  )
}
