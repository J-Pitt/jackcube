function scoreReactionRushRound(reactionRush, players) {
  const scores = {}
  players.forEach((p) => {
    scores[p.id] = 100
  })

  const early = reactionRush.earlyTappers || {}
  const taps = reactionRush.taps || {}
  const ranked = players
    .filter((p) => !early[p.id] && taps[p.id])
    .map((p) => ({ id: p.id, ts: taps[p.id] }))
    .sort((a, b) => a.ts - b.ts)

  const bonuses = [1200, 900, 600, 400, 250]
  ranked.forEach((entry, i) => {
    scores[entry.id] = (scores[entry.id] || 0) + (bonuses[i] || 150)
  })

  return scores
}

module.exports = { scoreReactionRushRound }
