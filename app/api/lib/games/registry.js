const GAMES = {
  captionClash: { id: 'captionClash', minPlayers: 2, maxPlayers: 5, maxRounds: 5 },
  bluffBox: { id: 'bluffBox', minPlayers: 2, maxPlayers: 5, maxRounds: 5 },
  triviaToss: { id: 'triviaToss', minPlayers: 2, maxPlayers: 5, maxRounds: 5 },
  reactionRush: { id: 'reactionRush', minPlayers: 2, maxPlayers: 5, maxRounds: 5 },
  categories: { id: 'categories', minPlayers: 2, maxPlayers: 5, maxRounds: 5 },
  doodle: { id: 'doodle', minPlayers: 3, maxPlayers: 5, maxRounds: 5 },
  wordBluff: { id: 'wordBluff', minPlayers: 2, maxPlayers: 5, maxRounds: 5 },
  truthOrCube: { id: 'truthOrCube', minPlayers: 2, maxPlayers: 8, maxRounds: 10 },
  fakinIt: { id: 'fakinIt', minPlayers: 3, maxPlayers: 8, maxRounds: 5 },
  dirtyDrawful: { id: 'dirtyDrawful', minPlayers: 3, maxPlayers: 8, maxRounds: 5 },
  letMeFinish: { id: 'letMeFinish', minPlayers: 3, maxPlayers: 8, maxRounds: 5 },
  wouldYouRather: { id: 'wouldYouRather', minPlayers: 2, maxPlayers: 8, maxRounds: 5 },
  neverHaveIEver: { id: 'neverHaveIEver', minPlayers: 2, maxPlayers: 8, maxRounds: 5 },
  cardCrimes: { id: 'cardCrimes', minPlayers: 3, maxPlayers: 5, maxRounds: 5 },
}

const VALID_GAMES = Object.keys(GAMES)

function getGameMeta(gameId) {
  return GAMES[gameId] || GAMES.captionClash
}

function validatePlayerCount(gameId, count) {
  const g = getGameMeta(gameId)
  if (count < g.minPlayers) {
    return { ok: false, error: `Need at least ${g.minPlayers} players` }
  }
  if (count > g.maxPlayers) {
    return { ok: false, error: `Maximum ${g.maxPlayers} players` }
  }
  return { ok: true }
}

function getMaxRounds(gameId) {
  const g = getGameMeta(gameId)
  return g.maxRounds ?? 5
}

module.exports = { getGameMeta, validatePlayerCount, getMaxRounds, VALID_GAMES }
