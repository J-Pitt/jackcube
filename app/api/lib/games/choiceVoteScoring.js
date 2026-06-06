/**
 * Score a two-choice vote round (Would You Rather / Never Have I Ever).
 * Voting rewards everyone; the bolder minority side earns a bonus.
 * Unanimous rooms split the difference.
 */
function scoreChoiceVoteRound(votes, players, options) {
  const scores = {}
  const counts = {}
  options.forEach((o) => {
    counts[o] = 0
  })

  players.forEach((p) => {
    const v = votes?.[p.id]
    if (v != null && counts[v] !== undefined) counts[v] += 1
  })

  // Find the minority option (the one with fewest, non-zero votes).
  let minorityOpt = null
  let minCount = Infinity
  let tie = false
  const voted = options.filter((o) => counts[o] > 0)
  if (voted.length > 1) {
    voted.forEach((o) => {
      if (counts[o] < minCount) {
        minCount = counts[o]
        minorityOpt = o
        tie = false
      } else if (counts[o] === minCount) {
        tie = true
      }
    })
  }

  players.forEach((p) => {
    const v = votes?.[p.id]
    if (v == null || counts[v] === undefined) {
      scores[p.id] = 50
      return
    }
    if (tie || minorityOpt == null) {
      scores[p.id] = 200
    } else if (v === minorityOpt) {
      scores[p.id] = 350
    } else {
      scores[p.id] = 150
    }
  })

  return scores
}

module.exports = { scoreChoiceVoteRound }
