'use client'

import { usePartyVideo } from '@/contexts/PartyVideoContext'
import PartyVideoControls from './PartyVideoControls'

/** Phone-side video controls — streams go to the main screen, no local preview. */
export default function LobbyVideoPanel({ className = '' }) {
  const { myPlayerId, isDisplayMode } = usePartyVideo()

  if (!myPlayerId || isDisplayMode) return null

  return (
    <section className={`rounded-2xl border border-white/10 bg-cube-surface/80 p-4 ${className}`}>
      <div className="mb-3">
        <h2 className="text-lg font-semibold text-white">Your camera</h2>
        <p className="mt-1 text-sm text-white/60">
          Join video on your phone — everyone appears on the main screen. No preview here.
        </p>
      </div>

      <PartyVideoControls />
    </section>
  )
}
