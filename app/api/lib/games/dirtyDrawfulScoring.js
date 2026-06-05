function normalizeGuess(text) {
  return String(text || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
}

function scoreDirtyDrawfulRound(dirtyDrawful, players) {
  const { drawerId, guesses = {}, promptText = '' } = dirtyDrawful
  const target = normalizeGuess(promptText)
  const scores = {}
  players.forEach((p) => {
    scores[p.id] = 50
  })

  const correct = []
  Object.entries(guesses).forEach(([playerId, guess]) => {
    if (playerId === drawerId) return
    const g = normalizeGuess(guess)
    if (g && (g === target || target.includes(g) || g.includes(target))) {
      correct.push(playerId)
      scores[playerId] = (scores[playerId] || 0) + 700
    }
  })

  if (correct.length > 0) {
    scores[drawerId] = (scores[drawerId] || 0) + 500 + correct.length * 100
  }

  return scores
}

module.exports = { scoreDirtyDrawfulRound }
