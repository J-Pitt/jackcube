'use client'

import { usePartyVideo } from '@/contexts/PartyVideoContext'
import PartyVideoControls from './PartyVideoControls'
import VideoTile from './VideoTile'

export default function LobbyVideoPanel({ className = '' }) {
  const { remotePeers, players, inCall, myPlayerId } = usePartyVideo()

  if (!myPlayerId) return null

  const otherCount = players.filter((p) => p.id !== myPlayerId).length

  return (
    <section className={`rounded-2xl border border-white/10 bg-cube-surface/80 p-4 ${className}`}>
      <div className="mb-3">
        <h2 className="text-lg font-semibold text-white">Video meet</h2>
        <p className="mt-1 text-sm text-white/60">
          Your camera goes to the party screen — no self-preview here. Join to appear on the main
          display during lobby and games.
        </p>
      </div>

      <PartyVideoControls className="mb-4" />

      {inCall && remotePeers.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {remotePeers.map(({ peerId, name, stream }) => (
            <VideoTile
              key={peerId}
              name={name}
              stream={stream}
              color={players.find((pl) => pl.name === name)?.color}
            />
          ))}
        </div>
      )}

      {inCall && remotePeers.length === 0 && otherCount > 0 && (
        <p className="rounded-xl border border-dashed border-white/15 p-4 text-center text-sm text-white/50">
          You&apos;re live — waiting for others to join video…
        </p>
      )}
    </section>
  )
}
