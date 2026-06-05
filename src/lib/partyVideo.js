import { hasVideoTrack } from '@/lib/media'

export const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
]

/** PeerJS cloud — explicit config for reliability on HTTPS deploys */
export const PEER_OPTIONS = {
  host: '0.peerjs.com',
  port: 443,
  path: '/',
  secure: true,
  debug: 0,
  config: { iceServers: ICE_SERVERS },
}

function shortToken(value, max = 12) {
  return String(value || '').replace(/[^a-zA-Z0-9]/g, '').slice(0, max)
}

export function safePeerId(roomId, playerId) {
  return `${shortToken(roomId, 16)}_${shortToken(playerId, 12)}`
}

/** Receive-only peer for the TV / main screen — separate from any player id. */
export function displayPeerId(roomId) {
  return `${shortToken(roomId, 16)}_tv`
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
