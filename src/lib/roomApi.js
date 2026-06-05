const ROOM_PATH = '/api/jackcube/room'

async function parseResponse(res, fallbackError) {
  const text = await res.text()
  let data
  try {
    data = text ? JSON.parse(text) : {}
  } catch {
    data = {}
  }
  if (!res.ok) {
    throw new Error(data.error || data.message || res.statusText || fallbackError)
  }
  return data
}

async function fetchRoom(url, options) {
  try {
    return await fetch(url, options)
  } catch (err) {
    const hint =
      ' Ensure the dev server is running and UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN are set.'
    throw new Error((err.message || 'Network error') + hint)
  }
}

export async function getMultiplayerStatus() {
  try {
    const res = await fetchRoom(`${ROOM_PATH}/status`)
    return parseResponse(res, 'Status check failed')
  } catch {
    return { available: false }
  }
}

export async function createRoom({ hostName, mode = 'online', targetScore = 5000 }) {
  const res = await fetchRoom(ROOM_PATH, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ hostName, mode, targetScore }),
  })
  return parseResponse(res, 'Failed to create room')
}

export async function joinRoom(gameCode, playerName) {
  const res = await fetchRoom(`${ROOM_PATH}/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      gameCode: String(gameCode).trim().toUpperCase(),
      playerName: String(playerName).trim(),
    }),
  })
  return parseResponse(res, 'Failed to join room')
}

export async function getRoom(roomId) {
  const res = await fetchRoom(`${ROOM_PATH}?roomId=${encodeURIComponent(roomId)}`)
  return parseResponse(res, 'Failed to get room')
}

export async function startGame(roomId, hostId) {
  const res = await fetchRoom(`${ROOM_PATH}/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roomId, hostId }),
  })
  return parseResponse(res, 'Failed to start game')
}

export async function leaveRoom(roomId, playerId) {
  const res = await fetchRoom(`${ROOM_PATH}/leave`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roomId, playerId }),
  })
  return parseResponse(res, 'Failed to leave room')
}

export async function sendFlap(roomId, playerId) {
  const res = await fetchRoom(`${ROOM_PATH}/input`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roomId, playerId, action: 'flap' }),
  })
  return parseResponse(res, 'Failed to send input')
}

export async function syncGameState(roomId, hostId, { phase, gameState, players }) {
  const res = await fetchRoom(ROOM_PATH, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roomId, hostId, phase, gameState, players }),
  })
  return parseResponse(res, 'Failed to sync game state')
}

export async function endRound(roomId, hostId, roundScores) {
  const res = await fetchRoom(`${ROOM_PATH}/end-round`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roomId, hostId, roundScores }),
  })
  return parseResponse(res, 'Failed to end round')
}

export async function nextRound(roomId, hostId) {
  const res = await fetchRoom(`${ROOM_PATH}/next-round`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roomId, hostId }),
  })
  return parseResponse(res, 'Failed to start next round')
}

export function leaveRoomBeacon(roomId, playerId) {
  try {
    fetch(`${ROOM_PATH}/leave`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId, playerId }),
      keepalive: true,
    }).catch(() => {})
  } catch {
    /* ignore */
  }
}

export function getAppUrl() {
  if (typeof window !== 'undefined') return window.location.origin
  return process.env.NEXT_PUBLIC_APP_URL || ''
}

export function buildJoinUrl(gameCode) {
  const base = getAppUrl()
  return `${base}/join?code=${encodeURIComponent(gameCode)}`
}
