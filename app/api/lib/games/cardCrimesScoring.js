/**
 * Score a Card Crimes round.
 * The judge's chosen submission wins big; everyone who submitted gets a small
 * participation bump, and the judge earns a flat fee for refereeing.
 */
function scoreCardCrimesRound(cardCrimes, players) {
  const scores = {}
  const { judgeId, winnerId, submissions = {} } = cardCrimes

  players.forEach((p) => {
    if (p.id === judgeId) {
      scores[p.id] = 200
    } else if (submissions[p.id]) {
      scores[p.id] = 100
    } else {
      scores[p.id] = 0
    }
  })

  if (winnerId && winnerId !== judgeId) {
    scores[winnerId] = (scores[winnerId] || 0) + 1000
  }

  return scores
}

module.exports = { scoreCardCrimesRound }
