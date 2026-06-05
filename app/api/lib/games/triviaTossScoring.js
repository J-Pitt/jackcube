function scoreTriviaTossRound(triviaToss, players, correctIndex) {
  const scores = {}
  const answers = triviaToss.answers || {}
  players.forEach((p) => {
    const pick = answers[p.id]
    if (pick === correctIndex) scores[p.id] = 1000
    else if (pick !== undefined && pick !== null) scores[p.id] = 150
    else scores[p.id] = 50
  })
  return scores
}

module.exports = { scoreTriviaTossRound }
