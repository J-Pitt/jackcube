/**
 * Shared standings/results math for the TV leaderboard and phone results screen.
 *
 * Inputs:
 *  - players: [{ id, name, color, score }]  (score is the NEW total after the round)
 *  - results: [{ playerId, name, roundScore, placement, pointsEarned, newTotal }]
 *
 * The previous total for each player is derived as (current score - pointsEarned),
 * so we can compute how each player's rank moved this round without extra state.
 */

function toNumber(value) {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

function rankMap(list) {
  // list: array of { id, value } already sorted desc by value -> rank by index
  const map = {}
  list.forEach((entry, i) => {
    map[entry.id] = i + 1
  })
  return map
}

export function computeStandings(players = [], results = [], { winnerId = null } = {}) {
  const resultByPid = Object.fromEntries((results || []).map((r) => [r.playerId, r]))

  const enriched = (players || []).map((p) => {
    const r = resultByPid[p.id]
    const currentTotal = toNumber(p.score)
    const pointsEarned = toNumber(r?.pointsEarned)
    // Fall back to current total when there's no round result (e.g. first paint).
    const previousTotal = r ? currentTotal - pointsEarned : currentTotal
    return {
      id: p.id,
      name: p.name,
      color: p.color,
      currentTotal,
      previousTotal,
      pointsEarned,
      roundScore: toNumber(r?.roundScore),
    }
  })

  const currentSorted = [...enriched].sort((a, b) => b.currentTotal - a.currentTotal)
  const previousSorted = [...enriched].sort((a, b) => b.previousTotal - a.previousTotal)

  const currentRanks = rankMap(currentSorted.map((e) => ({ id: e.id, value: e.currentTotal })))
  const previousRanks = rankMap(previousSorted.map((e) => ({ id: e.id, value: e.previousTotal })))

  const standings = currentSorted.map((e) => {
    const rank = currentRanks[e.id]
    const prevRank = previousRanks[e.id]
    // Positive delta = climbed (e.g. went from rank 3 -> 1 => +2).
    const delta = prevRank - rank
    let movement = 'same'
    if (delta > 0) movement = 'up'
    else if (delta < 0) movement = 'down'
    return {
      ...e,
      rank,
      prevRank,
      delta,
      movement,
    }
  })

  const leader = standings[0] || null
  const winner = winnerId
    ? standings.find((s) => s.id === winnerId) || null
    : null

  return { standings, leader, winner }
}

/** Short contextual line for a single player's round result. */
export function movementMessage(entry) {
  if (!entry) return ''
  const { rank, movement, delta } = entry
  if (rank === 1) {
    return movement === 'up' ? 'Took the lead!' : 'Still in the lead!'
  }
  if (movement === 'up') {
    return delta >= 2 ? `Jumped to #${rank}!` : `Up to #${rank}`
  }
  if (movement === 'down') {
    return `Slipped to #${rank}`
  }
  return `Holding #${rank}`
}
