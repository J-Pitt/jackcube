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

export async function createRoom({
  hostName,
  mode = 'online',
  targetScore = 5000,
  gameId = 'flappy',
}) {
  const res = await fetchRoom(ROOM_PATH, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ hostName, mode, targetScore, gameId }),
  })
  return parseResponse(res, 'Failed to create room')
}

export async function updateRoomConfig(roomId, hostId, config) {
  const res = await fetchRoom(`${ROOM_PATH}/config`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roomId, hostId, ...config }),
  })
  return parseResponse(res, 'Failed to update config')
}

export async function getRoomMe(roomId, playerId) {
  const res = await fetchRoom(
    `${ROOM_PATH}/me?roomId=${encodeURIComponent(roomId)}&playerId=${encodeURIComponent(playerId)}`
  )
  return parseResponse(res, 'Failed to get player view')
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
  return sendInput(roomId, playerId, 'flap')
}

export async function sendChat(roomId, playerId, text, { asGuess = false } = {}) {
  const res = await fetchRoom(`${ROOM_PATH}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roomId, playerId, text, asGuess }),
  })
  return parseResponse(res, 'Failed to send message')
}

export async function sendInput(roomId, playerId, action, payload) {
  const res = await fetchRoom(`${ROOM_PATH}/input`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roomId, playerId, action, payload }),
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

export async function advanceGame(roomId, hostId, forceStep) {
  const res = await fetchRoom(`${ROOM_PATH}/advance`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roomId, hostId, forceStep }),
  })
  return parseResponse(res, 'Failed to advance game')
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
