function shuffleArray(arr) {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function buildBluffChoices(bluffs, realAnswer, players) {
  const choices = []
  players.forEach((p) => {
    const text = String(bluffs[p.id] || '').trim()
    if (text) {
      choices.push({ id: `bluff_${p.id}`, text, authorId: p.id, isReal: false })
    }
  })
  if (realAnswer) {
    choices.push({ id: 'real', text: realAnswer, authorId: null, isReal: true })
  }
  return shuffleArray(choices)
}

module.exports = { shuffleArray, buildBluffChoices }
