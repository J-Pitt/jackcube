const GAMES = {
  flappy: { id: 'flappy', minPlayers: 2, maxPlayers: 8 },
  truthOrCube: { id: 'truthOrCube', minPlayers: 2, maxPlayers: 8 },
  fakinIt: { id: 'fakinIt', minPlayers: 3, maxPlayers: 8 },
  dirtyDrawful: { id: 'dirtyDrawful', minPlayers: 3, maxPlayers: 8 },
  letMeFinish: { id: 'letMeFinish', minPlayers: 3, maxPlayers: 8 },
}

const VALID_GAMES = Object.keys(GAMES)

function getGameMeta(gameId) {
  return GAMES[gameId] || GAMES.flappy
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

module.exports = { getGameMeta, validatePlayerCount, VALID_GAMES }
