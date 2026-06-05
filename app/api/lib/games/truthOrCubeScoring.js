function scoreTruthOrCubeRound(truthOrCube, players) {
  const { targetPlayerId, outcome } = truthOrCube
  const scores = {}
  players.forEach((p) => {
    scores[p.id] = 100
  })
  if (targetPlayerId) {
    if (outcome === 'done') scores[targetPlayerId] = (scores[targetPlayerId] || 0) + 850
    else if (outcome === 'chicken') scores[targetPlayerId] = (scores[targetPlayerId] || 0) + 200
    else scores[targetPlayerId] = (scores[targetPlayerId] || 0) + 400
  }
  return scores
}

module.exports = { scoreTruthOrCubeRound }
