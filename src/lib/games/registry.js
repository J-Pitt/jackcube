/** Client-side game metadata */
export const PARTY_GAMES = [
  {
    id: 'captionClash',
    name: 'Caption Clash',
    description: 'Quiplash-style — write the funniest answer, vote for the best',
    minPlayers: 2,
    maxPlayers: 5,
    maxRounds: 5,
    mature: false,
    emoji: '💬',
  },
  {
    id: 'bluffBox',
    name: 'Bluff Box',
    description: "Fibbage-style — fool friends with fake facts, spot the truth",
    minPlayers: 2,
    maxPlayers: 5,
    maxRounds: 5,
    mature: false,
    emoji: '🎭',
  },
  {
    id: 'triviaToss',
    name: 'Trivia Toss',
    description: 'Fast trivia on your phone — Mario Party brain-buster vibes',
    minPlayers: 2,
    maxPlayers: 5,
    maxRounds: 5,
    mature: false,
    emoji: '🧠',
  },
  {
    id: 'reactionRush',
    name: 'Reaction Rush',
    description: 'Reflex mini-game — tap when GO appears, fastest wins',
    minPlayers: 2,
    maxPlayers: 5,
    maxRounds: 5,
    mature: false,
    emoji: '⚡',
  },
  {
    id: 'categories',
    name: 'Categories',
    description: 'Scattergories-style — one letter, three categories, race to answer',
    minPlayers: 2,
    maxPlayers: 5,
    maxRounds: 5,
    mature: false,
    emoji: '🔤',
  },
  {
    id: 'doodle',
    name: 'Doodle Dash',
    description: 'Family Pictionary — one draws, everyone races to guess',
    minPlayers: 3,
    maxPlayers: 5,
    maxRounds: 5,
    mature: false,
    emoji: '✏️',
  },
  {
    id: 'wordBluff',
    name: 'Word Bluff',
    description: 'Balderdash-style — fake a dictionary definition, spot the real one',
    minPlayers: 2,
    maxPlayers: 5,
    maxRounds: 5,
    mature: false,
    emoji: '📖',
  },
]

/** Head-to-head games — exactly 2 players */
export const DUEL_GAMES = [
  {
    id: 'triviaDuel',
    name: 'Trivia Duel',
    description: 'Floor It-style speed trivia — both answer, fastest correct wins the bonus',
    minPlayers: 2,
    maxPlayers: 2,
    maxRounds: 5,
    mature: false,
    emoji: '⚔️',
  },
  {
    id: 'reactionDuel',
    name: 'Reaction Duel',
    description: '1v1 reflex showdown — tap on GO, fastest finger wins',
    minPlayers: 2,
    maxPlayers: 2,
    maxRounds: 5,
    mature: false,
    emoji: '🎯',
  },
  {
    id: 'doodleDuel',
    name: 'Doodle Duel',
    description: 'Head-to-head Pictionary — take turns drawing while your rival guesses',
    minPlayers: 2,
    maxPlayers: 2,
    maxRounds: 5,
    mature: false,
    emoji: '🖊️',
  },
  {
    id: 'captionDuel',
    name: 'Caption Duel',
    description: 'Quiplash for two — write a caption, vote for your opponent\'s best line',
    minPlayers: 2,
    maxPlayers: 2,
    maxRounds: 5,
    mature: false,
    emoji: '💥',
  },
]

/** @deprecated use PARTY_GAMES */
export const FAMILY_GAMES = PARTY_GAMES

export const ADULT_GAMES = [
  {
    id: 'truthOrCube',
    name: 'Truth or Dare',
    description: 'Go around the circle — spicy truths & dares, person to person',
    minPlayers: 2,
    maxPlayers: 8,
    maxRounds: 10,
    mature: true,
    emoji: '🎲',
  },
  {
    id: 'fakinIt',
    name: "Fakin' It All Night Long",
    description: 'Social deduction — blend in or get caught',
    minPlayers: 3,
    maxPlayers: 8,
    mature: true,
    emoji: '🕵️',
  },
  {
    id: 'dirtyDrawful',
    name: 'Dirty Drawful',
    description: 'Draw explicit prompts — others guess',
    minPlayers: 3,
    maxPlayers: 8,
    mature: true,
    emoji: '🎨',
  },
  {
    id: 'letMeFinish',
    name: 'Let Me Finish',
    description: 'Pitch absurd adult hypotheticals',
    minPlayers: 3,
    maxPlayers: 8,
    mature: true,
    emoji: '🎤',
  },
  {
    id: 'wouldYouRather',
    name: 'Would You Rather',
    description: 'Spicy A-vs-B dilemmas — the bold minority scores big',
    minPlayers: 2,
    maxPlayers: 8,
    maxRounds: 5,
    mature: true,
    emoji: '🔀',
  },
  {
    id: 'neverHaveIEver',
    name: 'Never Have I Ever',
    description: 'Group confessions — fess up and watch the tally',
    minPlayers: 2,
    maxPlayers: 8,
    maxRounds: 5,
    mature: true,
    emoji: '🙈',
  },
  {
    id: 'cardCrimes',
    name: 'Card Crimes',
    description: 'Fill-in-the-blank card game — a rotating judge picks the filthiest',
    minPlayers: 3,
    maxPlayers: 5,
    maxRounds: 5,
    mature: true,
    emoji: '🃏',
  },
]

export const GAMES = [...PARTY_GAMES, ...DUEL_GAMES, ...ADULT_GAMES]

export function getGameMeta(gameId) {
  return GAMES.find((g) => g.id === gameId) || PARTY_GAMES[0]
}

export function isAdultGame(gameId) {
  return ADULT_GAMES.some((g) => g.id === gameId)
}

export function isPartyGame(gameId) {
  return PARTY_GAMES.some((g) => g.id === gameId)
}

export function isDuelGame(gameId) {
  return DUEL_GAMES.some((g) => g.id === gameId)
}

export function validatePlayerCount(gameId, count) {
  const g = getGameMeta(gameId)
  if (g.minPlayers === g.maxPlayers && count !== g.minPlayers) {
    return { ok: false, error: `${g.name} needs exactly ${g.minPlayers} players` }
  }
  if (count < g.minPlayers) {
    return { ok: false, error: `Need at least ${g.minPlayers} players for ${g.name}` }
  }
  if (count > g.maxPlayers) {
    return { ok: false, error: `Maximum ${g.maxPlayers} players for ${g.name}` }
  }
  return { ok: true }
}
