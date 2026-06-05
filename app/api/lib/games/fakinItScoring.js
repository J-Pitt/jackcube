function scoreFakinItRound(fakinIt, players) {
  const { fakerId, votes = {} } = fakinIt
  const scores = {}
  players.forEach((p) => {
    scores[p.id] = 100
  })

  let correctVotes = 0
  Object.entries(votes).forEach(([voterId, accusedId]) => {
    if (accusedId === fakerId) {
      scores[voterId] = (scores[voterId] || 0) + 600
      correctVotes += 1
    }
  })

  const nonFakers = players.filter((p) => p.id !== fakerId)
  const fooled = nonFakers.filter((p) => votes[p.id] !== fakerId).length
  scores[fakerId] = (scores[fakerId] || 0) + fooled * 350
  if (correctVotes < Math.ceil(nonFakers.length / 2)) {
    scores[fakerId] = (scores[fakerId] || 0) + 400
  }

  return scores
}

module.exports = { scoreFakinItRound }
