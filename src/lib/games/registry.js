/** Client-side game metadata */
export const FAMILY_GAMES = [
  {
    id: 'flappy',
    name: 'Cube Flap',
    description: 'Multiplayer Flappy Bird — tap to flap',
    minPlayers: 2,
    maxPlayers: 8,
    mature: false,
  },
]

export const ADULT_GAMES = [
  {
    id: 'truthOrCube',
    name: 'Truth or Cube',
    description: 'Spin the cube — spicy truths & dares on your phone',
    minPlayers: 2,
    maxPlayers: 8,
    mature: true,
  },
  {
    id: 'fakinIt',
    name: "Fakin' It All Night Long",
    description: 'Social deduction — blend in or get caught',
    minPlayers: 3,
    maxPlayers: 8,
    mature: true,
  },
  {
    id: 'dirtyDrawful',
    name: 'Dirty Drawful',
    description: 'Draw explicit prompts — others guess',
    minPlayers: 3,
    maxPlayers: 8,
    mature: true,
  },
  {
    id: 'letMeFinish',
    name: 'Let Me Finish',
    description: 'Pitch absurd adult hypotheticals',
    minPlayers: 3,
    maxPlayers: 8,
    mature: true,
  },
]

export const GAMES = [...FAMILY_GAMES, ...ADULT_GAMES]

export function getGameMeta(gameId) {
  return GAMES.find((g) => g.id === gameId) || FAMILY_GAMES[0]
}

export function isAdultGame(gameId) {
  return ADULT_GAMES.some((g) => g.id === gameId)
}

export function validatePlayerCount(gameId, count) {
  const g = getGameMeta(gameId)
  if (count < g.minPlayers) {
    return { ok: false, error: `Need at least ${g.minPlayers} players for ${g.name}` }
  }
  if (count > g.maxPlayers) {
    return { ok: false, error: `Maximum ${g.maxPlayers} players` }
  }
  return { ok: true }
}
