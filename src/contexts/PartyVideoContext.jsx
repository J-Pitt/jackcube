'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { getMediaSupportError, hasVideoTrack, requestLobbyMedia } from '@/lib/media'
import { loadRejoin } from '@/lib/rejoin'
import {
  ICE_SERVERS,
  VIDEO_JOIN_KEY,
  attachAudioStream,
  displayNameFromPeerId,
  safePeerId,
} from '@/lib/partyVideo'
import { useRoomPoll } from '@/hooks/useRoomPoll'

const PartyVideoContext = createContext(null)

export function PartyVideoProvider({ children }) {
  const [session, setSession] = useState(null)
  const [joined, setJoined] = useState(false)
  const [muted, setMuted] = useState(false)
  const [cameraOff, setCameraOff] = useState(false)
  const [error, setError] = useState(null)
  const [ready, setReady] = useState(false)
  const [localStream, setLocalStream] = useState(null)
  const [remotePeers, setRemotePeers] = useState([])
  const [audioOnly, setAudioOnly] = useState(false)
  const [mediaBlocked, setMediaBlocked] = useState(null)

  const peerRef = useRef(null)
  const callsRef = useRef({})
  const remoteAudiosRef = useRef({})
  const playersRef = useRef([])

  useEffect(() => {
    setMediaBlocked(getMediaSupportError())
    try {
      setJoined(localStorage.getItem(VIDEO_JOIN_KEY) === '1')
    } catch {
      /* ignore */
    }
    const syncSession = () => setSession(loadRejoin())
    syncSession()
    const id = setInterval(syncSession, 800)
    window.addEventListener('storage', syncSession)
    return () => {
      clearInterval(id)
      window.removeEventListener('storage', syncSession)
    }
  }, [])

  const roomId = session?.roomId
  const myPlayerId = session?.playerId
  const { room } = useRoomPoll(roomId, 1500)
  const players = room?.players || []
  playersRef.current = players

  const myId = roomId && myPlayerId ? safePeerId(roomId, myPlayerId) : null
  const otherPlayers = useMemo(
    () => players.filter((p) => p.id !== myPlayerId),
    [players, myPlayerId]
  )

  const persistJoined = useCallback((value) => {
    setJoined(value)
    try {
      if (value) localStorage.setItem(VIDEO_JOIN_KEY, '1')
      else localStorage.removeItem(VIDEO_JOIN_KEY)
    } catch {
      /* ignore */
    }
  }, [])

  const join = useCallback(() => {
    if (!mediaBlocked && !getMediaSupportError()) persistJoined(true)
  }, [mediaBlocked, persistJoined])

  const leave = useCallback(() => {
    persistJoined(false)
  }, [persistJoined])

  useEffect(() => {
    if (!joined || !roomId || !myPlayerId) return undefined

    let peer = null
    let stream = null
    let cancelled = false

    async function init() {
      setError(null)
      setReady(false)
      setRemotePeers([])

      const blocked = getMediaSupportError()
      if (blocked) {
        setError(blocked)
        setMediaBlocked(blocked)
        persistJoined(false)
        return
      }

      try {
        const { default: Peer } = await import('peerjs')
        stream = await requestLobbyMedia()
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }

        setAudioOnly(!hasVideoTrack(stream))
        setLocalStream(stream)

        peer = new Peer(myId, { debug: 0, config: { iceServers: ICE_SERVERS } })
        peerRef.current = peer

        peer.on('open', () => {
          if (!cancelled) setReady(true)
        })

        peer.on('call', (call) => {
          const remoteId = call.peer
          const name = displayNameFromPeerId(remoteId, roomId, playersRef.current)
          call.answer(stream)

          call.on('stream', (remoteStream) => {
            setRemotePeers((prev) => {
              if (prev.some((p) => p.peerId === remoteId)) return prev
              return [...prev, { peerId: remoteId, name, stream: remoteStream }]
            })
            if (!hasVideoTrack(remoteStream)) {
              let audio = remoteAudiosRef.current[remoteId]
              if (!audio) {
                audio = document.createElement('audio')
                audio.autoplay = true
                remoteAudiosRef.current[remoteId] = audio
              }
              attachAudioStream(audio, remoteStream)
            }
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
          persistJoined(false)
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
      })
      remoteAudiosRef.current = {}
      if (stream) stream.getTracks().forEach((t) => t.stop())
      setLocalStream(null)
      setReady(false)
      setRemotePeers([])
    }
  }, [joined, roomId, myPlayerId, myId, persistJoined])

  useEffect(() => {
    if (!ready || !peerRef.current || !localStream) return

    for (const player of otherPlayers) {
      const theirId = safePeerId(roomId, player.id)
      if (theirId === myId || callsRef.current[theirId]) continue
      if (myId > theirId) continue

      try {
        const call = peerRef.current.call(theirId, localStream)
        if (!call) continue
        callsRef.current[theirId] = call

        call.on('stream', (remoteStream) => {
          setRemotePeers((prev) => {
            if (prev.some((p) => p.peerId === theirId)) return prev
            return [...prev, { peerId: theirId, name: player.name, stream: remoteStream }]
          })
          if (!hasVideoTrack(remoteStream)) {
            let audio = remoteAudiosRef.current[theirId]
            if (!audio) {
              audio = document.createElement('audio')
              audio.autoplay = true
              remoteAudiosRef.current[theirId] = audio
            }
            attachAudioStream(audio, remoteStream)
          }
        })

        call.on('close', () => {
          setRemotePeers((prev) => prev.filter((p) => p.peerId !== theirId))
          delete callsRef.current[theirId]
        })
      } catch {
        /* peer not ready */
      }
    }
  }, [ready, roomId, myId, otherPlayers, localStream])

  useEffect(() => {
    if (!localStream) return
    localStream.getAudioTracks().forEach((t) => {
      t.enabled = !muted
    })
  }, [muted, localStream])

  useEffect(() => {
    if (!localStream) return
    localStream.getVideoTracks().forEach((t) => {
      t.enabled = !cameraOff
    })
  }, [cameraOff, localStream])

  const value = {
    roomId,
    myPlayerId,
    players,
    joined,
    ready,
    muted,
    cameraOff,
    audioOnly,
    error,
    mediaBlocked,
    remotePeers,
    inCall: joined && ready,
    join,
    leave,
    setMuted,
    setCameraOff,
    toggleJoined: () => (joined ? leave() : join()),
  }

  return <PartyVideoContext.Provider value={value}>{children}</PartyVideoContext.Provider>
}

export function usePartyVideo() {
  const ctx = useContext(PartyVideoContext)
  if (!ctx) throw new Error('usePartyVideo must be used within PartyVideoProvider')
  return ctx
}
