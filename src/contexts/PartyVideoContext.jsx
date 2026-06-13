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
import {
  describeMediaError,
  getMediaSupportError,
  hasVideoTrack,
  requestLobbyMedia,
  requestRoomCameraMedia,
} from '@/lib/media'
import { loadRejoin } from '@/lib/rejoin'
import {
  VIDEO_JOIN_KEY,
  VIDEO_SOURCE_KEY,
  ROOM_CAMERA_KEY,
  attachAudioStream,
  displayNameFromPeerId,
  displayPeerId,
  isDisplayPeerId,
  PEER_OPTIONS,
  safePeerId,
} from '@/lib/partyVideo'
import { useRoomPoll } from '@/hooks/useRoomPoll'

const PartyVideoContext = createContext(null)

function createRecvOnlyStream() {
  return new MediaStream()
}

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
  const [roomCameraStream, setRoomCameraStream] = useState(null)
  const [roomCameraOn, setRoomCameraOn] = useState(false)
  const [cameraSource, setCameraSourceState] = useState('phone')
  const [panelExpanded, setPanelExpanded] = useState(false)

  const peerRef = useRef(null)
  const callsRef = useRef({})
  const remoteAudiosRef = useRef({})
  const playersRef = useRef([])
  const remotePeersRef = useRef([])

  const roomId = session?.roomId
  const myPlayerId = session?.playerId
  const { room } = useRoomPoll(roomId, 1500)
  const players = room?.players || []
  playersRef.current = players
  remotePeersRef.current = remotePeers

  const isDisplayMode = session?.screenRole === 'tv'
  const isHostPlayer =
    session?.isHost === true || session?.playerId === room?.hostId

  const myId = useMemo(() => {
    if (!roomId) return null
    if (isDisplayMode) return displayPeerId(roomId)
    if (!myPlayerId) return null
    return safePeerId(roomId, myPlayerId)
  }, [roomId, myPlayerId, isDisplayMode])

  const tvPeerId = roomId ? displayPeerId(roomId) : null

  const visibleRemotePeers = useMemo(
    () => remotePeers.filter((p) => !isDisplayPeerId(p.peerId, roomId)),
    [remotePeers, roomId]
  )

  useEffect(() => {
    setMediaBlocked(getMediaSupportError())
    const syncSession = () => setSession(loadRejoin())
    syncSession()
    const id = setInterval(syncSession, 800)
    window.addEventListener('storage', syncSession)
    return () => {
      clearInterval(id)
      window.removeEventListener('storage', syncSession)
    }
  }, [])

  useEffect(() => {
    if (isDisplayMode) {
      setJoined(!!roomId)
      try {
        setRoomCameraOn(localStorage.getItem(ROOM_CAMERA_KEY) === '1')
      } catch {
        setRoomCameraOn(false)
      }
      return undefined
    }
    try {
      const source = localStorage.getItem(VIDEO_SOURCE_KEY)
      setCameraSourceState(source === 'room' ? 'room' : 'phone')
      const wantsVideo = localStorage.getItem(VIDEO_JOIN_KEY) === '1'
      setJoined(wantsVideo && source !== 'room')
    } catch {
      setJoined(false)
      setCameraSourceState('phone')
    }
    return undefined
  }, [isDisplayMode, roomId])

  const persistJoined = useCallback(
    (value) => {
      if (isDisplayMode) return
      setJoined(value)
      try {
        if (value) localStorage.setItem(VIDEO_JOIN_KEY, '1')
        else localStorage.removeItem(VIDEO_JOIN_KEY)
      } catch {
        /* ignore */
      }
    },
    [isDisplayMode]
  )

  const setCameraSource = useCallback(
    (source) => {
      if (isDisplayMode) return
      const next = source === 'room' ? 'room' : 'phone'
      setCameraSourceState(next)
      try {
        if (next === 'room') {
          localStorage.setItem(VIDEO_SOURCE_KEY, 'room')
          localStorage.removeItem(VIDEO_JOIN_KEY)
        } else {
          localStorage.setItem(VIDEO_SOURCE_KEY, 'phone')
        }
      } catch {
        /* ignore */
      }
      if (next === 'room') persistJoined(false)
    },
    [isDisplayMode, persistJoined]
  )

  const join = useCallback(() => {
    if (isDisplayMode) return
    if (cameraSource === 'room') return
    if (!mediaBlocked && !getMediaSupportError()) {
      try {
        localStorage.setItem(VIDEO_SOURCE_KEY, 'phone')
      } catch {
        /* ignore */
      }
      setCameraSourceState('phone')
      persistJoined(true)
    }
  }, [isDisplayMode, cameraSource, mediaBlocked, persistJoined])

  const leave = useCallback(() => {
    if (isDisplayMode) return
    persistJoined(false)
  }, [isDisplayMode, persistJoined])

  const toggleRoomCamera = useCallback(async () => {
    if (!isDisplayMode) return
    if (roomCameraOn) {
      roomCameraStream?.getTracks().forEach((t) => t.stop())
      setRoomCameraStream(null)
      setRoomCameraOn(false)
      try {
        localStorage.removeItem(ROOM_CAMERA_KEY)
      } catch {
        /* ignore */
      }
      return
    }
    const blocked = getMediaSupportError()
    if (blocked) {
      setError(blocked)
      return
    }
    try {
      const stream = await requestRoomCameraMedia()
      setRoomCameraStream(stream)
      setRoomCameraOn(true)
      setError(null)
      try {
        localStorage.setItem(ROOM_CAMERA_KEY, '1')
      } catch {
        /* ignore */
      }
    } catch (e) {
      setError(describeMediaError(e))
    }
  }, [isDisplayMode, roomCameraOn, roomCameraStream])

  const hasRemoteStream = useCallback((peerId) => {
    return remotePeersRef.current.some((p) => p.peerId === peerId && p.stream)
  }, [])

  const clearCall = useCallback((peerId) => {
    const call = callsRef.current[peerId]
    if (call) {
      try {
        call.close()
      } catch {
        /* ignore */
      }
    }
    delete callsRef.current[peerId]
  }, [])

  const addRemotePeer = useCallback(
    (remoteId, name, remoteStream) => {
      if (isDisplayPeerId(remoteId, roomId)) return
      if (!remoteStream) return
      setRemotePeers((prev) => {
        const idx = prev.findIndex((p) => p.peerId === remoteId)
        if (idx >= 0) {
          const next = [...prev]
          next[idx] = { peerId: remoteId, name, stream: remoteStream }
          return next
        }
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
    },
    [roomId]
  )

  const removeRemotePeer = useCallback(
    (remoteId) => {
      setRemotePeers((prev) => prev.filter((p) => p.peerId !== remoteId))
      clearCall(remoteId)
    },
    [clearCall]
  )

  const wireIncomingCall = useCallback(
    (call, stream) => {
      const remoteId = call.peer
      const name = displayNameFromPeerId(remoteId, roomId, playersRef.current)
      call.answer(stream)

      call.on('stream', (remoteStream) => {
        addRemotePeer(remoteId, name, remoteStream)
      })

      call.on('close', () => {
        delete callsRef.current[remoteId]
        removeRemotePeer(remoteId)
      })

      call.on('error', () => {
        clearCall(remoteId)
      })

      callsRef.current[remoteId] = call
    },
    [roomId, addRemotePeer, removeRemotePeer, clearCall]
  )

  const dialPeer = useCallback(
    (theirId, name, stream) => {
      if (!peerRef.current || !stream || !theirId) return
      if (hasRemoteStream(theirId)) return
      // Keep an active outbound call — redialing was tearing down the TV feed every 3s.
      if (callsRef.current[theirId]) return

      try {
        const call = peerRef.current.call(theirId, stream)
        if (!call) return
        callsRef.current[theirId] = call

        call.on('stream', (remoteStream) => {
          addRemotePeer(theirId, name, remoteStream)
        })

        call.on('close', () => {
          delete callsRef.current[theirId]
          if (!isDisplayPeerId(theirId, roomId)) {
            removeRemotePeer(theirId)
          }
        })

        call.on('error', () => {
          clearCall(theirId)
        })
      } catch {
        clearCall(theirId)
      }
    },
    [roomId, addRemotePeer, removeRemotePeer, clearCall, hasRemoteStream]
  )

  useEffect(() => {
    if (!joined || !roomId || !myId) return undefined
    if (!isDisplayMode && !myPlayerId) return undefined

    let peer = null
    let stream = null
    let cancelled = false

    async function initPublisher() {
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

        peer = new Peer(myId, PEER_OPTIONS)
        peerRef.current = peer

        peer.on('open', () => {
          if (!cancelled) setReady(true)
        })

        peer.on('call', (call) => {
          wireIncomingCall(call, stream)
        })

        peer.on('error', (err) => {
          if (err.type === 'peer-unavailable' || err.type === 'network') return
          setError(err.message || 'Video call error')
        })
      } catch (e) {
        if (!cancelled) {
          setError(describeMediaError(e))
          persistJoined(false)
        }
        setReady(false)
      }
    }

    async function initDisplay() {
      setError(null)
      setReady(false)
      setRemotePeers([])

      try {
        const { default: Peer } = await import('peerjs')
        stream = createRecvOnlyStream()
        setAudioOnly(false)
        setLocalStream(stream)

        peer = new Peer(myId, PEER_OPTIONS)
        peerRef.current = peer

        peer.on('open', () => {
          if (!cancelled) setReady(true)
        })

        peer.on('call', (call) => {
          wireIncomingCall(call, stream)
        })

        peer.on('error', (err) => {
          if (err.type === 'peer-unavailable' || err.type === 'network') return
          setError(err.message || 'Video display error')
        })
      } catch (e) {
        if (!cancelled) {
          setError(e?.message || 'Could not start party cam display')
        }
        setReady(false)
      }
    }

    if (isDisplayMode) initDisplay()
    else initPublisher()

    return () => {
      cancelled = true
      Object.keys(callsRef.current).forEach((id) => clearCall(id))
      if (peerRef.current) {
        peerRef.current.destroy()
        peerRef.current = null
      }
      Object.values(remoteAudiosRef.current).forEach((a) => {
        if (a?.srcObject) a.srcObject.getTracks().forEach((t) => t.stop())
      })
      remoteAudiosRef.current = {}
      if (stream && !isDisplayMode) stream.getTracks().forEach((t) => t.stop())
      setLocalStream(null)
      setReady(false)
      setRemotePeers([])
    }
  }, [
    joined,
    roomId,
    myPlayerId,
    myId,
    isDisplayMode,
    persistJoined,
    wireIncomingCall,
    clearCall,
  ])

  /** Phones publish to the TV only (hub-and-spoke). TV passively receives. */
  useEffect(() => {
    if (!ready || !localStream || !roomId || !tvPeerId) return undefined
    if (isDisplayMode) return undefined

    let attempts = 0
    const maxAttempts = 30
    let intervalId = null

    const ensurePublished = () => {
      if (callsRef.current[tvPeerId]) {
        clearInterval(intervalId)
        return
      }
      dialPeer(tvPeerId, 'TV', localStream)
      attempts += 1
      if (attempts >= maxAttempts) clearInterval(intervalId)
    }

    ensurePublished()
    intervalId = setInterval(ensurePublished, 3000)
    return () => clearInterval(intervalId)
  }, [ready, roomId, tvPeerId, localStream, isDisplayMode, dialPeer])

  useEffect(() => {
    if (!localStream || isDisplayMode) return
    localStream.getAudioTracks().forEach((t) => {
      t.enabled = !muted
    })
  }, [muted, localStream, isDisplayMode])

  useEffect(() => {
    if (!localStream || isDisplayMode) return
    localStream.getVideoTracks().forEach((t) => {
      t.enabled = !cameraOff
    })
  }, [cameraOff, localStream, isDisplayMode])

  useEffect(() => {
    if (!isDisplayMode || !roomCameraOn || roomCameraStream) return undefined
    let cancelled = false
    ;(async () => {
      try {
        const stream = await requestRoomCameraMedia()
        if (!cancelled) setRoomCameraStream(stream)
      } catch (e) {
        if (!cancelled) {
          setRoomCameraOn(false)
          setError(describeMediaError(e))
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [isDisplayMode, roomCameraOn, roomCameraStream])

  useEffect(() => {
    return () => {
      roomCameraStream?.getTracks().forEach((t) => t.stop())
    }
  }, [roomCameraStream])

  const hasActiveVideo =
    visibleRemotePeers.some((p) => p.stream) || !!roomCameraStream || (joined && ready && !isDisplayMode)

  useEffect(() => {
    if (hasActiveVideo) setPanelExpanded(true)
    else setPanelExpanded(false)
  }, [hasActiveVideo])

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
    remotePeers: visibleRemotePeers,
    isDisplayMode,
    isHostPlayer,
    inCall: joined && ready,
    hasActiveVideo,
    panelExpanded,
    setPanelExpanded,
    localStream,
    roomCameraStream,
    roomCameraOn,
    cameraSource,
    setCameraSource,
    toggleRoomCamera,
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
