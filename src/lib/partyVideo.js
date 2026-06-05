import { hasVideoTrack } from '@/lib/media'

export const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
]

export function safePeerId(roomId, playerId) {
  const safeRoom = String(roomId || 'room').replace(/[^a-zA-Z0-9]/g, '')
  const safePlayer = String(playerId || 'player').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40)
  return `${safeRoom}_${safePlayer}`
}

/** Receive-only peer for the TV / main screen — separate from any player id. */
export function displayPeerId(roomId) {
  const safeRoom = String(roomId || 'room').replace(/[^a-zA-Z0-9]/g, '')
  return `${safeRoom}_display`
}

export function isDisplayPeerId(peerId, roomId) {
  return peerId === displayPeerId(roomId)
}

export function displayNameFromPeerId(peerId, roomId, players) {
  const match = players.find((p) => safePeerId(roomId, p.id) === peerId)
  return match?.name || peerId.split('_').slice(-1)[0] || 'Player'
}

export function attachStream(videoEl, stream) {
  if (!videoEl || !stream || !hasVideoTrack(stream)) return
  if (videoEl.srcObject !== stream) {
    videoEl.srcObject = stream
  }
  videoEl.play().catch(() => {})
}

export function attachAudioStream(audioEl, stream) {
  if (!audioEl || !stream) return
  if (audioEl.srcObject !== stream) {
    audioEl.srcObject = stream
  }
  audioEl.play().catch(() => {})
}

export const VIDEO_JOIN_KEY = 'jackcube:videoJoined'
