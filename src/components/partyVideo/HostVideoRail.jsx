'use client'

import { usePartyVideo } from '@/contexts/PartyVideoContext'
import PartyVideoControls from './PartyVideoControls'
import VideoTile from './VideoTile'
import { safePeerId } from '@/lib/partyVideo'

/** All player cameras on the main TV screen — receive-only, no self preview. */
export default function HostVideoRail({ className = '' }) {
  const { remotePeers, players, inCall, joined, isDisplayMode, roomId } = usePartyVideo()

  const tiles = remotePeers.filter((p) => p.stream)
  const tileSize = tiles.length === 1 ? 'hero' : tiles.length <= 4 ? 'large' : 'large'

  if (!isDisplayMode && !joined && tiles.length === 0) {
    return (
      <div className={`rounded-2xl border border-white/10 bg-cube-surface/90 p-4 backdrop-blur ${className}`}>
        <PartyVideoControls />
      </div>
    )
  }

  return (
    <div
      className={`rounded-2xl border border-white/10 bg-cube-surface/95 p-4 shadow-xl backdrop-blur ${className}`}
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold uppercase tracking-widest text-white/50">
          Party cam {inCall ? '· live' : ''}
        </p>
        <PartyVideoControls compact />
      </div>
      {tiles.length > 0 ? (
        <div
          className={`grid gap-3 ${
            tiles.length === 1
              ? 'grid-cols-1 max-w-2xl mx-auto'
              : tiles.length === 2
                ? 'grid-cols-2'
                : tiles.length <= 4
                  ? 'grid-cols-2 lg:grid-cols-2'
                  : 'grid-cols-2 lg:grid-cols-3'
          }`}
        >
          {tiles.map(({ peerId, name, stream }) => {
            const player =
              players.find((pl) => safePeerId(roomId, pl.id) === peerId) ||
              players.find((pl) => pl.name === name)
            return (
              <VideoTile
                key={peerId}
                name={name}
                stream={stream}
                color={player?.color}
                size={tileSize}
              />
            )
          })}
        </div>
      ) : (
        <p className="py-6 text-center text-sm text-white/40">
          {isDisplayMode
            ? 'Join video on your phone to show your camera here…'
            : 'Waiting for players to join video…'}
        </p>
      )}
    </div>
  )
}
