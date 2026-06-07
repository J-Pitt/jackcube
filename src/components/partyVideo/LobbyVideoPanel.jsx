'use client'

import { usePartyVideo } from '@/contexts/PartyVideoContext'
import PartyVideoControls from './PartyVideoControls'

/** Phone-side video controls — streams go to the main screen, no local preview. */
export default function LobbyVideoPanel({ className = '' }) {
  const { myPlayerId, isDisplayMode, hasActiveVideo, panelExpanded, setPanelExpanded } =
    usePartyVideo()

  if (!myPlayerId || isDisplayMode) return null

  if (!hasActiveVideo && !panelExpanded) {
    return (
      <button
        type="button"
        onClick={() => setPanelExpanded(true)}
        className={`flex w-full items-center justify-between rounded-2xl border border-white/10 bg-cube-surface/80 px-4 py-3 text-left ${className}`}
      >
        <span className="text-sm text-white/50">Party cam — tap to join</span>
        <span className="text-xs font-semibold text-cube-cyan">Open</span>
      </button>
    )
  }

  return (
    <section className={`rounded-2xl border border-white/10 bg-cube-surface/80 p-4 ${className}`}>
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-white">Your camera</h2>
          <p className="mt-1 text-sm text-white/60">
            Join video on your phone — everyone appears on the main screen.
          </p>
        </div>
        {!hasActiveVideo && (
          <button
            type="button"
            onClick={() => setPanelExpanded(false)}
            className="shrink-0 text-xs text-white/40 hover:text-white/70"
          >
            Minimize
          </button>
        )}
      </div>

      <PartyVideoControls />
    </section>
  )
}
