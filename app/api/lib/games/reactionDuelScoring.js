/** 1v1 reaction — winner takes most points; early tap penalized. */
function scoreReactionDuelRound(reactionDuel, players) {
  const scores = {}
  players.forEach((p) => {
    scores[p.id] = 100
  })

  const early = reactionDuel.earlyTappers || {}
  const taps = reactionDuel.taps || {}
  const ranked = players
    .filter((p) => !early[p.id] && taps[p.id])
    .map((p) => ({ id: p.id, ts: taps[p.id] }))
    .sort((a, b) => a.ts - b.ts)

  if (ranked[0]) scores[ranked[0].id] = 1500
  if (ranked[1]) scores[ranked[1].id] = 350
  players.forEach((p) => {
    if (early[p.id]) scores[p.id] = 50
  })

  return scores
}

module.exports = { scoreReactionDuelRound }
