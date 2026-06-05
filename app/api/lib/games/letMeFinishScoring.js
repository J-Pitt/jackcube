function scoreLetMeFinishRound(letMeFinish, players) {
  const { votes = {}, presenterId } = letMeFinish
  const scores = {}
  players.forEach((p) => {
    scores[p.id] = 100
  })

  const tally = {}
  Object.values(votes).forEach((votedForId) => {
    if (!votedForId) return
    tally[votedForId] = (tally[votedForId] || 0) + 1
  })

  let maxVotes = 0
  let winners = []
  Object.entries(tally).forEach(([id, count]) => {
    if (count > maxVotes) {
      maxVotes = count
      winners = [id]
    } else if (count === maxVotes) {
      winners.push(id)
    }
  })

  if (winners.length > 1) winners.sort()
  const winnerId = winners[0]
  if (winnerId) {
    scores[winnerId] = (scores[winnerId] || 0) + 900
    if (winnerId === presenterId) scores[winnerId] += 200
  }
  if (presenterId) scores[presenterId] = (scores[presenterId] || 0) + 150

  return scores
}

module.exports = { scoreLetMeFinishRound }
