const REJOIN_KEY = 'jackcube:rejoin'

export function loadRejoin() {
  try {
    const raw = localStorage.getItem(REJOIN_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function saveRejoin({
  roomId,
  gameCode,
  playerId,
  playerName,
  isHost,
  mode,
  screenRole,
}) {
  localStorage.setItem(
    REJOIN_KEY,
    JSON.stringify({ roomId, gameCode, playerId, playerName, isHost, mode, screenRole })
  )
}

export function clearRejoin() {
  localStorage.removeItem(REJOIN_KEY)
}

/** Where to send a returning player based on room phase and device role. */
export function getRejoinPath(saved, phase = 'lobby') {
  if (!saved?.roomId) return '/'
  const q = `roomId=${encodeURIComponent(saved.roomId)}`
  if (phase === 'lobby') return `/lobby?${q}`
  if (saved.screenRole === 'tv') return `/game?${q}`
  return `/play?${q}`
}
