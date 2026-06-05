const UNLOCK_KEY = 'jackcube:adult-unlocked'
const UNLOCK_TTL_MS = 4 * 60 * 60 * 1000

export function isAdultUnlocked() {
  if (typeof window === 'undefined') return false
  try {
    const raw = sessionStorage.getItem(UNLOCK_KEY)
    if (!raw) return false
    const { at } = JSON.parse(raw)
    return Date.now() - at < UNLOCK_TTL_MS
  } catch {
    return false
  }
}

export function setAdultUnlocked() {
  sessionStorage.setItem(UNLOCK_KEY, JSON.stringify({ at: Date.now() }))
}

export function clearAdultUnlocked() {
  sessionStorage.removeItem(UNLOCK_KEY)
}
