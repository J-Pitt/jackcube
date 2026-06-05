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
  displayPeerId,
  isDisplayPeerId,
  safePeerId,
} from '@/lib/partyVideo'
import { useRoomPoll } from '@/hooks/useRoomPoll'

const PartyVideoContext = createContext(null)

function createEmptyStream() {
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

  const peerRef = useRef(null)
  const callsRef = useRef({})
  const remoteAudiosRef = useRef({})
  const playersRef = useRef([])

  const roomId = session?.roomId
  const myPlayerId = session?.playerId
  const { room } = useRoomPoll(roomId, 1500)
  const players = room?.players || []
  playersRef.current = players

  const isDisplayMode = session?.screenRole === 'tv'

  const myId = useMemo(() => {
    if (!roomId) return null
    if (isDisplayMode) return displayPeerId(roomId)
    if (!myPlayerId) return null
    return safePeerId(roomId, myPlayerId)
  }, [roomId, myPlayerId, isDisplayMode])

  const connectedPlayers = useMemo(
    () => players.filter((p) => !p.disconnectedAt),
    [players]
  )

  const otherPlayers = useMemo(
    () => connectedPlayers.filter((p) => p.id !== myPlayerId),
    [connectedPlayers, myPlayerId]
  )

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
      return undefined
    }
    try {
      setJoined(localStorage.getItem(VIDEO_JOIN_KEY) === '1')
    } catch {
      setJoined(false)
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

  const join = useCallback(() => {
    if (isDisplayMode) return
    if (!mediaBlocked && !getMediaSupportError()) persistJoined(true)
  }, [isDisplayMode, mediaBlocked, persistJoined])

  const leave = useCallback(() => {
    if (isDisplayMode) return
    persistJoined(false)
  }, [isDisplayMode, persistJoined])

  const addRemotePeer = useCallback((remoteId, name, remoteStream) => {
    if (isDisplayPeerId(remoteId, roomId)) return
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
  }, [roomId])

  const removeRemotePeer = useCallback((remoteId) => {
    setRemotePeers((prev) => prev.filter((p) => p.peerId !== remoteId))
    delete callsRef.current[remoteId]
  }, [])

  const wireIncomingCall = useCallback(
    (call, stream) => {
      const remoteId = call.peer
      const name = displayNameFromPeerId(remoteId, roomId, playersRef.current)
      call.answer(stream)

      call.on('stream', (remoteStream) => {
        addRemotePeer(remoteId, name, remoteStream)
      })

      call.on('close', () => {
        removeRemotePeer(remoteId)
      })

      callsRef.current[remoteId] = call
    },
    [roomId, addRemotePeer, removeRemotePeer]
  )

  const dialPeer = useCallback(
    (theirId, name, stream) => {
      if (!peerRef.current || !stream || callsRef.current[theirId]) return
      try {
        const call = peerRef.current.call(theirId, stream)
        if (!call) return
        callsRef.current[theirId] = call

        call.on('stream', (remoteStream) => {
          addRemotePeer(theirId, name, remoteStream)
        })

        call.on('close', () => {
          removeRemotePeer(theirId)
        })
      } catch {
        /* peer not ready */
      }
    },
    [addRemotePeer, removeRemotePeer]
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

        peer = new Peer(myId, { debug: 0, config: { iceServers: ICE_SERVERS } })
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
          setError(e?.message || 'Could not access camera/microphone')
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
        stream = createEmptyStream()
        setAudioOnly(false)
        setLocalStream(stream)

        peer = new Peer(myId, { debug: 0, config: { iceServers: ICE_SERVERS } })
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
  ])

  useEffect(() => {
    if (!ready || !peerRef.current || !localStream || !roomId) return

    if (isDisplayMode) {
      for (const player of connectedPlayers) {
        const theirId = safePeerId(roomId, player.id)
        dialPeer(theirId, player.name, localStream)
      }
      return
    }

    const displayId = displayPeerId(roomId)
    dialPeer(displayId, 'TV', localStream)

    for (const player of otherPlayers) {
      const theirId = safePeerId(roomId, player.id)
      if (theirId === myId) continue
      if (myId > theirId) continue
      dialPeer(theirId, player.name, localStream)
    }
  }, [ready, roomId, myId, otherPlayers, connectedPlayers, localStream, isDisplayMode, dialPeer])

  useEffect(() => {
    if (!isDisplayMode || !ready || !localStream || !roomId) return undefined

    const retry = () => {
      for (const player of connectedPlayers) {
        const theirId = safePeerId(roomId, player.id)
        dialPeer(theirId, player.name, localStream)
      }
    }

    const id = setInterval(retry, 4000)
    return () => clearInterval(id)
  }, [isDisplayMode, ready, roomId, connectedPlayers, localStream, dialPeer])

  useEffect(() => {
    if (isDisplayMode || !ready || !localStream || !roomId) return undefined

    const displayId = displayPeerId(roomId)
    const retry = () => dialPeer(displayId, 'TV', localStream)

    retry()
    const id = setInterval(retry, 4000)
    return () => clearInterval(id)
  }, [isDisplayMode, ready, roomId, localStream, dialPeer])

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
