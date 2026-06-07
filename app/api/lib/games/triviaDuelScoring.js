/** 1v1 trivia — correct answer + speed bonus for the faster player (Floor It style). */
function scoreTriviaDuelRound(triviaDuel, players, correctIndex) {
  const scores = {}
  const answers = triviaDuel.answers || {}
  const answeredAt = triviaDuel.answeredAt || {}

  players.forEach((p) => {
    const pick = answers[p.id]
    if (pick === correctIndex) scores[p.id] = 800
    else if (pick !== undefined && pick !== null) scores[p.id] = 100
    else scores[p.id] = 50
  })

  const correct = players
    .filter((p) => answers[p.id] === correctIndex && answeredAt[p.id])
    .map((p) => ({ id: p.id, at: answeredAt[p.id] }))
    .sort((a, b) => a.at - b.at)

  if (correct.length > 0) {
    scores[correct[0].id] = (scores[correct[0].id] || 0) + 700
  }
  if (correct.length > 1) {
    scores[correct[1].id] = (scores[correct[1].id] || 0) + 200
  }

  return scores
}

module.exports = { scoreTriviaDuelRound }
