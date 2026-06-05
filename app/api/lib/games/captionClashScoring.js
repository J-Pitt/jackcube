function scoreCaptionClashRound(captionClash, players) {
  const scores = {}
  players.forEach((p) => {
    scores[p.id] = 150
  })
  const votes = captionClash.votes || {}
  Object.values(votes).forEach((votedForId) => {
    if (votedForId && scores[votedForId] !== undefined) {
      scores[votedForId] += 900
    }
  })
  return scores
}

module.exports = { scoreCaptionClashRound }
