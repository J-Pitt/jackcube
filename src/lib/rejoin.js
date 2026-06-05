const REJOIN_KEY = 'jackcube:rejoin'

export function loadRejoin() {
  try {
    const raw = localStorage.getItem(REJOIN_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function saveRejoin({ roomId, gameCode, playerId, playerName, isHost, mode }) {
  localStorage.setItem(
    REJOIN_KEY,
    JSON.stringify({ roomId, gameCode, playerId, playerName, isHost, mode })
  )
}

export function clearRejoin() {
  localStorage.removeItem(REJOIN_KEY)
}
