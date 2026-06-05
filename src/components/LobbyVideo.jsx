'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { getMediaSupportError, hasVideoTrack, requestLobbyMedia } from '@/lib/media'

const ICE_SERVERS = [{ urls: 'stun:stun.l.google.com:19302' }]

function safePeerId(roomId, playerId) {
  const safe = String(playerId || 'player').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40)
  return `${roomId}_${safe}`
}

function displayNameFromPeerId(peerId, roomId, players) {
  const match = players.find((p) => safePeerId(roomId, p.id) === peerId)
  return match?.name || peerId.split('_').slice(-1)[0] || 'Player'
}

/**
 * Lobby video/audio via WebRTC (PeerJS). Browser-only — no server media relay.
 * Mesh topology: each player connects to every other player in the room.
 */
export default function LobbyVideo({
  roomId,
  myPlayerId,
  myPlayerName,
  players = [],
  className = '',
}) {
  const [joined, setJoined] = useState(false)
  const [muted, setMuted] = useState(false)
  const [cameraOff, setCameraOff] = useState(false)
  const [error, setError] = useState(null)
  const [ready, setReady] = useState(false)
  const [remotePeers, setRemotePeers] = useState([])
  const [audioOnly, setAudioOnly] = useState(false)
  const [mediaBlocked, setMediaBlocked] = useState(null)

  const peerRef = useRef(null)
  const localStreamRef = useRef(null)
  const localVideoRef = useRef(null)
  const callsRef = useRef({})
  const remoteVideosRef = useRef({})
  const remoteAudiosRef = useRef({})

  const myId = roomId && myPlayerId ? safePeerId(roomId, myPlayerId) : null
  const otherPlayers = useMemo(
    () => players.filter((p) => p.id !== myPlayerId),
    [players, myPlayerId]
  )

  useEffect(() => {
    setMediaBlocked(getMediaSupportError())
  }, [])

  useEffect(() => {
    if (!joined || !roomId || !myPlayerId) return undefined

    let peer = null
    let localStream = null
    let cancelled = false

    async function init() {
      setError(null)
      setReady(false)
      setRemotePeers([])
      setAudioOnly(false)

      const blocked = getMediaSupportError()
      if (blocked) {
        setError(blocked)
        setMediaBlocked(blocked)
        setJoined(false)
        return
      }

      try {
        const { default: Peer } = await import('peerjs')
        localStream = await requestLobbyMedia()
        if (cancelled) {
          localStream.getTracks().forEach((t) => t.stop())
          return
        }

        setAudioOnly(!hasVideoTrack(localStream))
        localStreamRef.current = localStream
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStream
        }

        peer = new Peer(myId, { debug: 0, config: { iceServers: ICE_SERVERS } })
        peerRef.current = peer

        peer.on('open', () => {
          if (!cancelled) setReady(true)
        })

        peer.on('call', (call) => {
          const remoteId = call.peer
          const name = displayNameFromPeerId(remoteId, roomId, players)
          call.answer(localStream)

          call.on('stream', (stream) => {
            setRemotePeers((prev) => {
              if (prev.some((p) => p.peerId === remoteId)) return prev
              return [...prev, { peerId: remoteId, name, stream }]
            })
          })

          call.on('close', () => {
            setRemotePeers((prev) => prev.filter((p) => p.peerId !== remoteId))
            delete callsRef.current[remoteId]
          })

          callsRef.current[remoteId] = call
        })

        peer.on('error', (err) => {
          if (err.type === 'peer-unavailable' || err.type === 'network') return
          setError(err.message || 'Video call error')
        })
      } catch (e) {
        if (!cancelled) {
          setError(e?.message || 'Could not access camera/microphone')
          setJoined(false)
        }
        setReady(false)
      }
    }

    init()

    return () => {
      cancelled = true
      Object.values(callsRef.current).forEach((c) => c?.close())
      callsRef.current = {}
      if (peerRef.current) {
        peerRef.current.destroy()
        peerRef.current = null
      }
      Object.values(remoteAudiosRef.current).forEach((a) => {
        if (a?.srcObject) a.srcObject.getTracks().forEach((t) => t.stop())
        a.srcObject = null
      })
      remoteAudiosRef.current = {}
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop())
        localStreamRef.current = null
      }
      if (localVideoRef.current) localVideoRef.current.srcObject = null
      setReady(false)
      setRemotePeers([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- players used only for display names on incoming calls
  }, [joined, roomId, myPlayerId, myId])

  useEffect(() => {
    if (!ready || !peerRef.current || !localStreamRef.current) return

    for (const player of otherPlayers) {
      const theirId = safePeerId(roomId, player.id)
      if (theirId === myId || callsRef.current[theirId]) continue
      if (myId > theirId) continue

      try {
        const call = peerRef.current.call(theirId, localStreamRef.current)
        if (!call) continue
        callsRef.current[theirId] = call

        call.on('stream', (stream) => {
          setRemotePeers((prev) => {
            if (prev.some((p) => p.peerId === theirId)) return prev
            return [...prev, { peerId: theirId, name: player.name, stream }]
          })
        })

        call.on('close', () => {
          setRemotePeers((prev) => prev.filter((p) => p.peerId !== theirId))
          delete callsRef.current[theirId]
        })
      } catch {
        /* peer may not be ready yet */
      }
    }
  }, [ready, roomId, myId, otherPlayers])

  useEffect(() => {
    if (!localStreamRef.current) return
    localStreamRef.current.getAudioTracks().forEach((track) => {
      track.enabled = !muted
    })
  }, [muted])

  useEffect(() => {
    if (!localStreamRef.current) return
    localStreamRef.current.getVideoTracks().forEach((track) => {
      track.enabled = !cameraOff
    })
  }, [cameraOff])

  useEffect(() => {
    remotePeers.forEach(({ peerId, stream }) => {
      if (hasVideoTrack(stream)) {
        const el = remoteVideosRef.current[peerId]
        if (el && el.srcObject !== stream) el.srcObject = stream
      } else {
        let audio = remoteAudiosRef.current[peerId]
        if (!audio) {
          audio = document.createElement('audio')
          audio.autoplay = true
          remoteAudiosRef.current[peerId] = audio
        }
        if (audio.srcObject !== stream) audio.srcObject = stream
      }
    })
  }, [remotePeers])

  if (!roomId || !myPlayerId) return null

  const inCall = joined && ready

  return (
    <section className={`rounded-2xl border border-white/10 bg-cube-surface/80 p-4 ${className}`}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-white">Video meet</h2>
        {error && (
          <span className="text-sm text-cube-danger" role="alert">
            {error}
          </span>
        )}
      </div>

      <p className="mb-4 text-sm text-white/60">
        Meet your party over browser WebRTC before the game starts. Mic is always on when joined;
        toggle camera off for voice-only.
      </p>

      {mediaBlocked && (
        <div
          className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200"
          role="status"
        >
          <strong>Video/voice unavailable on this URL.</strong> {mediaBlocked}
          <p className="mt-2 text-white/50">
            Tip: on your computer, <code className="text-cube-cyan">localhost:5180</code> works.
            Phones on WiFi need HTTPS (e.g. after Amplify deploy).
          </p>
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setJoined((j) => !j)}
          disabled={!!mediaBlocked && !joined}
          className={`rounded-xl px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
            joined
              ? 'bg-cube-danger/20 text-cube-danger hover:bg-cube-danger/30'
              : 'bg-cube-violet text-white hover:bg-cube-violet/90'
          }`}
        >
          {joined ? 'Leave call' : 'Join video call'}
        </button>
        {joined && (
          <>
            <button
              type="button"
              onClick={() => setMuted((m) => !m)}
              disabled={!ready}
              className="rounded-xl border border-white/15 px-3 py-2 text-sm text-white hover:bg-white/5 disabled:opacity-40"
              title={muted ? 'Unmute' : 'Mute'}
            >
              {muted ? '🔇 Muted' : '🔊 Mic on'}
            </button>
            <button
              type="button"
              onClick={() => setCameraOff((c) => !c)}
              disabled={!ready}
              className="rounded-xl border border-white/15 px-3 py-2 text-sm text-white hover:bg-white/5 disabled:opacity-40"
              title={cameraOff ? 'Turn camera on' : 'Turn camera off'}
            >
              {cameraOff ? '📷 Camera off' : '📹 Camera on'}
            </button>
          </>
        )}
      </div>

      {joined && !ready && !error && (
        <p className="mb-3 text-sm text-cube-cyan">
          Connecting{audioOnly ? ' microphone' : ' camera & mic'}…
        </p>
      )}

      {inCall && audioOnly && (
        <p className="mb-3 text-sm text-white/50">Voice-only mode (no camera)</p>
      )}

      {inCall && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {!audioOnly && (
            <div className="relative aspect-video overflow-hidden rounded-xl bg-black/40 ring-2 ring-cube-violet">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className={`h-full w-full object-cover ${cameraOff ? 'opacity-30' : ''}`}
              />
              <span className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-0.5 text-xs text-white">
                You {cameraOff ? '(camera off)' : ''}
              </span>
            </div>
          )}

          {audioOnly && (
            <div className="flex aspect-video items-center justify-center rounded-xl bg-black/40 ring-2 ring-cube-violet">
              <span className="text-4xl">🎤</span>
              <span className="sr-only">You, voice only</span>
            </div>
          )}

          {remotePeers.map(({ peerId, name, stream }) => (
            <div
              key={peerId}
              className="relative aspect-video overflow-hidden rounded-xl bg-black/40 ring-1 ring-white/20"
            >
              {hasVideoTrack(stream) ? (
                <video
                  ref={(el) => {
                    remoteVideosRef.current[peerId] = el
                  }}
                  autoPlay
                  playsInline
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-4xl">🎤</div>
              )}
              <span className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-0.5 text-xs text-white">
                {name}
              </span>
            </div>
          ))}

          {remotePeers.length === 0 && otherPlayers.length > 0 && (
            <div className="col-span-full rounded-xl border border-dashed border-white/15 p-4 text-center text-sm text-white/50">
              Waiting for others to join the call…
            </div>
          )}
        </div>
      )}
    </section>
  )
}
