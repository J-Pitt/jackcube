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
    isDisplayMode,
    isHostPlayer,
    remotePeers,
    roomCameraOn,
    cameraSource,
    setCameraSource,
    toggleRoomCamera,
    toggleJoined,
    setMuted,
    setCameraOff,
    myPlayerId,
  } = usePartyVideo()

  if (!myPlayerId && !isDisplayMode) return null

  if (isDisplayMode) {
    return (
      <div className={`flex flex-wrap items-center gap-2 ${className}`}>
        <button
          type="button"
          onClick={toggleRoomCamera}
          className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
            roomCameraOn
              ? 'bg-cube-cyan/20 text-cube-cyan'
              : 'border border-white/15 text-white hover:bg-white/10'
          }`}
        >
          {roomCameraOn ? '📹 Room camera on' : '📹 Enable room camera'}
        </button>
        {inCall && (
          <span className="text-xs text-green-400">
            {remotePeers.length > 0
              ? `${remotePeers.length} on screen`
              : roomCameraOn
                ? 'Room camera live'
                : 'Listening for cameras…'}
          </span>
        )}
        {error && (
          <span className="text-xs text-cube-danger" role="alert">
            {error}
          </span>
        )}
      </div>
    )
  }

  if (mediaBlocked) {
    return (
      <p className={`text-xs text-amber-200/80 ${className}`}>
        Video needs HTTPS or localhost.
      </p>
    )
  }

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {isHostPlayer && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCameraSource('phone')}
            className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
              cameraSource === 'phone'
                ? 'bg-cube-violet text-white'
                : 'border border-white/15 text-white/60 hover:text-white'
            }`}
          >
            Phone camera
          </button>
          <button
            type="button"
            onClick={() => setCameraSource('room')}
            className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
              cameraSource === 'room'
                ? 'bg-cube-cyan/20 text-cube-cyan'
                : 'border border-white/15 text-white/60 hover:text-white'
            }`}
          >
            Main screen camera
          </button>
        </div>
      )}
      {cameraSource === 'room' && isHostPlayer ? (
        <p className="text-xs text-white/50">
          Enable <strong className="text-white/70">room camera</strong> on the main game screen — your phone won&apos;t stream video.
        </p>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
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
          {inCall && compact && (
            <span className="text-xs text-green-400">
              {ready ? 'Live on TV' : 'Connecting to TV…'}
            </span>
          )}
        </div>
      )}
      {error && (
        <span className="text-xs text-cube-danger" role="alert">
          {error}
        </span>
      )}
    </div>
  )
}
