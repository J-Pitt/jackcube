const PLACEMENT_POINTS = [1000, 750, 500, 250]
const PARTICIPATION = 100

export function scoreRound(players, roundScores) {
  const ranked = [...players]
    .map((p) => ({
      ...p,
      roundScore: Number(roundScores[p.id]) || 0,
    }))
    .sort((a, b) => b.roundScore - a.roundScore)

  const results = ranked.map((p, index) => {
    const placement = index + 1
    const points =
      (PLACEMENT_POINTS[index] ?? PARTICIPATION) + PARTICIPATION
    return {
      playerId: p.id,
      name: p.name,
      roundScore: p.roundScore,
      placement,
      pointsEarned: points,
      newTotal: (Number(p.score) || 0) + points,
    }
  })

  const updatedPlayers = players.map((p) => {
    const result = results.find((r) => r.playerId === p.id)
    return result ? { ...p, score: result.newTotal } : p
  })

  return { results, updatedPlayers }
}

export function checkVictory(players, targetScore) {
  const winner = players.find((p) => (Number(p.score) || 0) >= targetScore)
  return winner || null
}
