'use client'

import { usePartyVideo } from '@/contexts/PartyVideoContext'
import PartyVideoControls from './PartyVideoControls'
import VideoTile from './VideoTile'
import { safePeerId } from '@/lib/partyVideo'

/** All player cameras on the main TV screen — receive-only, no self preview. */
export default function HostVideoRail({ className = '' }) {
  const {
    remotePeers,
    players,
    inCall,
    isDisplayMode,
    roomId,
    roomCameraStream,
    hasActiveVideo,
    panelExpanded,
    setPanelExpanded,
  } = usePartyVideo()

  const phoneTiles = remotePeers.filter((p) => p.stream)
  const tiles = [
    ...(roomCameraStream
      ? [{ peerId: '__room__', name: 'Room camera', stream: roomCameraStream, local: true }]
      : []),
    ...phoneTiles,
  ]
  const tileSize = tiles.length === 1 ? 'hero' : tiles.length <= 4 ? 'large' : 'large'

  if (!panelExpanded && !hasActiveVideo) {
    return (
      <button
        type="button"
        onClick={() => setPanelExpanded(true)}
        className={`flex w-full items-center justify-between gap-3 rounded-2xl border-2 border-cube-cyan/30 bg-cube-surface/90 px-4 py-3 text-left backdrop-blur transition hover:border-cube-cyan/50 ${className}`}
      >
        <span className="text-sm text-white/50">
          Party cam — no one on yet
        </span>
        <span className="text-xs font-semibold text-cube-cyan">Open</span>
      </button>
    )
  }

  return (
    <div
      className={`rounded-2xl border-2 border-cube-cyan/40 bg-cube-surface/95 p-4 shadow-[0_0_24px_-8px_rgba(0,245,212,0.5)] backdrop-blur ${className}`}
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold uppercase tracking-widest text-cube-cyan/80">
          Party cam {inCall && hasActiveVideo ? '· live' : ''}
        </p>
        <div className="flex items-center gap-2">
          {!hasActiveVideo && (
            <button
              type="button"
              onClick={() => setPanelExpanded(false)}
              className="text-xs text-white/40 hover:text-white/70"
            >
              Minimize
            </button>
          )}
          <PartyVideoControls compact />
        </div>
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
        <p className="py-4 text-center text-sm text-white/40">
          {isDisplayMode
            ? 'Enable room camera or join video on phones to show faces here.'
            : 'Waiting for players to join video…'}
        </p>
      )}
    </div>
  )
}
