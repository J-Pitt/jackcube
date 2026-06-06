function normalize(text) {
  return String(text || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
}

/**
 * Score a Categories round (Scattergories-style).
 * Each answer that is non-empty and starts with the round letter earns points.
 * A bonus is awarded when nobody else gave the same answer for that slot.
 */
function scoreCategoriesRound(categories, players) {
  const { answers = {}, letter = '', categories: cats = [] } = categories
  const target = String(letter || '').trim().toLowerCase()
  const scores = {}
  players.forEach((p) => {
    scores[p.id] = 0
  })

  cats.forEach((_, slot) => {
    const normalizedBySlot = {}
    players.forEach((p) => {
      const raw = (answers[p.id] || [])[slot]
      const n = normalize(raw)
      const valid = n && (!target || n[0] === target)
      normalizedBySlot[p.id] = valid ? n : null
    })

    const counts = {}
    Object.values(normalizedBySlot).forEach((n) => {
      if (n) counts[n] = (counts[n] || 0) + 1
    })

    players.forEach((p) => {
      const n = normalizedBySlot[p.id]
      if (!n) return
      scores[p.id] += counts[n] === 1 ? 300 : 100
    })
  })

  return scores
}

module.exports = { scoreCategoriesRound }
