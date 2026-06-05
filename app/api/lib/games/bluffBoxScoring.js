function scoreBluffBoxRound(bluffBox, players) {
  const scores = {}
  players.forEach((p) => {
    scores[p.id] = 100
  })

  const choices = bluffBox.choices || []
  const realChoice = choices.find((c) => c.isReal)
  const realId = realChoice?.id
  const guesses = bluffBox.guesses || {}

  Object.entries(guesses).forEach(([playerId, choiceId]) => {
    if (choiceId === realId) {
      scores[playerId] = (scores[playerId] || 0) + 1000
    }
  })

  Object.entries(guesses).forEach(([guesserId, choiceId]) => {
    const choice = choices.find((c) => c.id === choiceId)
    if (choice?.authorId && choice.authorId !== guesserId) {
      scores[choice.authorId] = (scores[choice.authorId] || 0) + 500
    }
  })

  return scores
}

module.exports = { scoreBluffBoxRound }
