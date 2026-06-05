/** One row per player id; one name per room (case-insensitive). */
function normalizeName(name) {
  return String(name || '').trim().toLowerCase()
}

function dedupePlayers(players) {
  if (!Array.isArray(players)) return []
  const seenIds = new Set()
  const seenNames = new Set()
  const out = []
  for (const p of players) {
    if (!p?.id || seenIds.has(p.id)) continue
    const nameKey = normalizeName(p.name)
    if (nameKey && seenNames.has(nameKey)) continue
    seenIds.add(p.id)
    if (nameKey) seenNames.add(nameKey)
    out.push(p)
  }
  return out
}

function findPlayerByName(players, playerName) {
  const key = normalizeName(playerName)
  if (!key) return null
  return players.find((p) => normalizeName(p.name) === key) || null
}

module.exports = { dedupePlayers, findPlayerByName, normalizeName }
