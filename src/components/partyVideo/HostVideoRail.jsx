'use client'

import { usePartyVideo } from '@/contexts/PartyVideoContext'
import PartyVideoControls from './PartyVideoControls'
import VideoTile from './VideoTile'

/** Player faces on the main game screen — remote peers only (no self preview). */
export default function HostVideoRail({ className = '' }) {
  const { remotePeers, players, inCall, joined } = usePartyVideo()

  const tiles = remotePeers.filter((p) => p.stream)

  if (!joined && tiles.length === 0) {
    return (
      <div className={`rounded-2xl border border-white/10 bg-cube-surface/90 p-3 backdrop-blur ${className}`}>
        <PartyVideoControls />
      </div>
    )
  }

  return (
    <div
      className={`rounded-2xl border border-white/10 bg-cube-surface/95 p-3 shadow-xl backdrop-blur ${className}`}
    >
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-white/50">
          Party cam {inCall ? '· live' : ''}
        </p>
        <PartyVideoControls compact />
      </div>
      {tiles.length > 0 ? (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {tiles.map(({ peerId, name, stream }) => {
            const player = players.find((pl) => name === pl.name)
            return (
              <VideoTile
                key={peerId}
                name={name}
                stream={stream}
                color={player?.color}
                compact
              />
            )
          })}
        </div>
      ) : (
        <p className="text-sm text-white/40">
          Waiting for players to join video…
        </p>
      )}
    </div>
  )
}
