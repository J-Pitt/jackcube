'use client'

import { usePartyVideo } from '@/contexts/PartyVideoContext'

export default function PartyVideoControls({ compact = false, className = '' }) {
  const {
    joined,
    ready,
    muted,
    cameraOff,
    audioOnly,
    error,
    mediaBlocked,
    inCall,
    toggleJoined,
    setMuted,
    setCameraOff,
    myPlayerId,
  } = usePartyVideo()

  if (!myPlayerId) return null

  if (mediaBlocked) {
    return (
      <p className={`text-xs text-amber-200/80 ${className}`}>
        Video needs HTTPS or localhost.
      </p>
    )
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <button
        type="button"
        onClick={toggleJoined}
        className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
          joined
            ? 'bg-cube-danger/20 text-cube-danger'
            : 'bg-cube-violet text-white hover:bg-cube-violet/90'
        }`}
      >
        {joined ? 'Leave video' : compact ? '📹 Join video' : 'Join video call'}
      </button>
      {joined && (
        <>
          <button
            type="button"
            onClick={() => setMuted((m) => !m)}
            disabled={!ready}
            className="rounded-xl border border-white/15 px-3 py-2 text-sm text-white disabled:opacity-40"
          >
            {muted ? '🔇' : '🔊'}
          </button>
          {!audioOnly && (
            <button
              type="button"
              onClick={() => setCameraOff((c) => !c)}
              disabled={!ready}
              className="rounded-xl border border-white/15 px-3 py-2 text-sm text-white disabled:opacity-40"
            >
              {cameraOff ? '📷' : '📹'}
            </button>
          )}
        </>
      )}
      {joined && !ready && !error && (
        <span className="text-xs text-cube-cyan">Connecting…</span>
      )}
      {error && (
        <span className="text-xs text-cube-danger" role="alert">
          {error}
        </span>
      )}
      {inCall && compact && (
        <span className="text-xs text-green-400">Live on TV</span>
      )}
    </div>
  )
}
