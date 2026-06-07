const { pickRandomItem, sampleItems, pickHostLine } = require('./content')
const { buildBluffChoices } = require('./games/partyGameUtils')

const ROUND_MS = {
  fakinIt: { prompt: 8000, action: 25000, vote: 30000, reveal: 8000 },
  dirtyDrawful: { assign: 5000, draw: 90000, guess: 30000, reveal: 10000 },
  letMeFinish: { question: 6000, pitch: 55000, rebuttal: 20000, vote: 25000, reveal: 8000 },
  truthOrCube: { cube: 4500, active: 50000, reveal: 7000 },
  captionClash: { write: 45000, vote: 30000, reveal: 8000 },
  bluffBox: { write: 40000, guess: 35000, reveal: 10000 },
  triviaToss: { question: 20000, reveal: 8000 },
  reactionRush: { ready: 0, go: 5000, reveal: 7000 },
  categories: { write: 60000, reveal: 14000 },
  doodle: { assign: 5000, draw: 75000, guess: 25000, reveal: 10000 },
  wordBluff: { write: 50000, guess: 40000, reveal: 11000 },
  wouldYouRather: { vote: 25000, reveal: 12000 },
  neverHaveIEver: { vote: 25000, reveal: 12000 },
  cardCrimes: { submit: 50000, judge: 35000, reveal: 12000 },
  triviaDuel: { question: 15000, reveal: 8000 },
  reactionDuel: { ready: 0, go: 5000, reveal: 7000 },
  doodleDuel: { assign: 4000, draw: 60000, guess: 20000, reveal: 10000 },
  captionDuel: { write: 40000, vote: 25000, reveal: 8000 },
}

const CARD_CRIMES_HAND_SIZE = 6

const CATEGORY_LETTERS = 'ABCDEFGHIKLMNOPRST'

function pickLetter() {
  return CATEGORY_LETTERS[Math.floor(Math.random() * CATEGORY_LETTERS.length)]
}

function endsIn(ms) {
  return new Date(Date.now() + ms).toISOString()
}

function pickFaker(players, round) {
  const idx = (round - 1) % players.length
  return players[idx].id
}

function pickDrawer(players, round) {
  const idx = (round - 1) % players.length
  return players[idx].id
}

function pickPresenter(players, round) {
  const idx = (round - 1) % players.length
  return players[idx].id
}

function pickTarget(players, round) {
  const idx = (round - 1) % players.length
  return players[idx].id
}

function createFakinItState(players, room, round = 1) {
  const used = room.gameState?.fakinIt?.usedPromptIds || []
  const remoteOnly =
    room.mode === 'online' && room.config?.spicyRemote !== true
  const deckKey = remoteOnly ? 'fakinIt/remote' : 'fakinIt/behavior'
  const item = pickRandomItem(deckKey, { excludeIds: used, remoteOnly })
  const fakerId = pickFaker(players, round)

  return {
    round,
    fakinIt: {
      step: 'prompt',
      roundPromptId: item?.id || null,
      fakerId,
      votes: {},
      actionAcks: {},
      gestures: {},
      endsAt: endsIn(ROUND_MS.fakinIt.prompt),
      usedPromptIds: item ? [...used, item.id] : used,
      remotePlay: remoteOnly || room.mode === 'online',
    },
    secrets: {
      fakinIt: {
        promptText: item?.text || 'Follow the secret prompt.',
        promptId: item?.id,
      },
    },
    roundResults: null,
    winnerId: null,
  }
}

function createDirtyDrawfulState(players, room, round = 1) {
  const used = room.gameState?.dirtyDrawful?.usedPromptIds || []
  const item = pickRandomItem('dirtyDrawful/drawing', { excludeIds: used })
  const hostLine = pickHostLine()
  const drawerId = pickDrawer(players, round)

  return {
    round,
    dirtyDrawful: {
      step: 'assign',
      drawerId,
      promptId: item?.id || null,
      strokes: [],
      guesses: {},
      correctGuessers: [],
      hostLine: hostLine?.text || 'Draw something questionable.',
      endsAt: endsIn(ROUND_MS.dirtyDrawful.assign),
      usedPromptIds: item ? [...used, item.id] : used,
    },
    secrets: {
      dirtyDrawful: {
        promptText: item?.text || 'mystery',
        promptId: item?.id,
      },
    },
    roundResults: null,
    winnerId: null,
  }
}

function createTruthOrCubeState(players, room, round = 1) {
  const used = room.gameState?.truthOrCube?.usedPromptIds || []
  const targetPlayerId = pickTarget(players, round)
  const remoteOnly = room.mode === 'online'
  let cardType = Math.random() < 0.5 ? 'truth' : 'dare'
  let deckKey = cardType === 'truth' ? 'truthOrCube/truths' : 'truthOrCube/dares'
  let item = pickRandomItem(deckKey, { excludeIds: used, remoteOnly: cardType === 'dare' && remoteOnly })
  if (!item && cardType === 'dare') {
    cardType = 'truth'
    deckKey = 'truthOrCube/truths'
    item = pickRandomItem(deckKey, { excludeIds: used })
  }
  if (!item) {
    item = pickRandomItem('truthOrCube/truths', { excludeIds: used })
    cardType = 'truth'
  }

  return {
    round,
    truthOrCube: {
      step: 'cube',
      targetPlayerId,
      cardType,
      promptId: item?.id || null,
      outcome: null,
      endsAt: endsIn(ROUND_MS.truthOrCube.cube),
      usedPromptIds: item ? [...used, item.id] : used,
      cubeSpin: Math.floor(Math.random() * 6) + 1,
    },
    secrets: {
      truthOrCube: {
        promptText: item?.text || 'Spill the tea or do the dare.',
        promptId: item?.id,
      },
    },
    roundResults: null,
    winnerId: null,
  }
}

function createLetMeFinishState(players, room, round = 1) {
  const used = room.gameState?.letMeFinish?.usedPromptIds || []
  const item = pickRandomItem('letMeFinish/questions', { excludeIds: used })
  const presenterId = pickPresenter(players, round)
  const challengers = players.filter((p) => p.id !== presenterId).map((p) => p.id)
  const rebuttalPlayerId = challengers[Math.floor(Math.random() * challengers.length)] || null

  return {
    round,
    letMeFinish: {
      step: 'question',
      presenterId,
      questionId: item?.id || null,
      questionText: item?.text || 'Make something up.',
      objections: [],
      objectionUsed: {},
      votes: {},
      pitchStarted: false,
      rebuttalPlayerId,
      rebuttalText: null,
      endsAt: endsIn(ROUND_MS.letMeFinish.question),
      usedPromptIds: item ? [...used, item.id] : used,
    },
    secrets: {},
    roundResults: null,
    winnerId: null,
  }
}

function createCaptionClashState(players, room, round = 1) {
  const used = room.gameState?.captionClash?.usedPromptIds || []
  const item = pickRandomItem('captionClash/prompts', { excludeIds: used })

  return {
    round,
    captionClash: {
      step: 'write',
      promptId: item?.id || null,
      promptText: item?.text || 'Write something funny…',
      submissions: {},
      votes: {},
      endsAt: endsIn(ROUND_MS.captionClash.write),
      usedPromptIds: item ? [...used, item.id] : used,
    },
    secrets: {},
    roundResults: null,
    winnerId: null,
  }
}

function createBluffBoxState(players, room, round = 1) {
  const used = room.gameState?.bluffBox?.usedPromptIds || []
  const item = pickRandomItem('bluffBox/prompts', { excludeIds: used })

  return {
    round,
    bluffBox: {
      step: 'write',
      promptId: item?.id || null,
      promptText: item?.text || 'Fill in the blank with a convincing lie.',
      bluffs: {},
      guesses: {},
      choices: [],
      endsAt: endsIn(ROUND_MS.bluffBox.write),
      usedPromptIds: item ? [...used, item.id] : used,
    },
    secrets: {
      bluffBox: {
        realAnswer: item?.answer || 'unknown',
        promptId: item?.id,
      },
    },
    roundResults: null,
    winnerId: null,
  }
}

function createTriviaTossState(players, room, round = 1) {
  const used = room.gameState?.triviaToss?.usedPromptIds || []
  const item = pickRandomItem('triviaToss/questions', { excludeIds: used })

  return {
    round,
    triviaToss: {
      step: 'question',
      questionId: item?.id || null,
      questionText: item?.text || 'Quick trivia!',
      options: item?.options || ['A', 'B', 'C', 'D'],
      answers: {},
      endsAt: endsIn(ROUND_MS.triviaToss.question),
      usedPromptIds: item ? [...used, item.id] : used,
    },
    secrets: {
      triviaToss: {
        correctIndex: item?.correctIndex ?? 0,
        questionId: item?.id,
      },
    },
    roundResults: null,
    winnerId: null,
  }
}

function createReactionRushState(players, room, round = 1) {
  const delay = 2000 + Math.floor(Math.random() * 3000)
  const signalAt = endsIn(delay)

  return {
    round,
    reactionRush: {
      step: 'ready',
      endsAt: signalAt,
      signalAt,
      taps: {},
      earlyTappers: {},
    },
    secrets: { reactionRush: { signalAt } },
    roundResults: null,
    winnerId: null,
  }
}

function createCategoriesState(players, room, round = 1) {
  const used = room.gameState?.categories?.usedPromptIds || []
  const item = pickRandomItem('categories/prompts', { excludeIds: used })

  return {
    round,
    categories: {
      step: 'write',
      promptId: item?.id || null,
      categories: item?.categories || ['An animal', 'A food', 'A country'],
      letter: pickLetter(),
      answers: {},
      endsAt: endsIn(ROUND_MS.categories.write),
      usedPromptIds: item ? [...used, item.id] : used,
    },
    secrets: {},
    roundResults: null,
    winnerId: null,
  }
}

function createDoodleState(players, room, round = 1) {
  const used = room.gameState?.doodle?.usedPromptIds || []
  const item = pickRandomItem('doodle/words', { excludeIds: used })
  const drawerId = pickDrawer(players, round)

  return {
    round,
    doodle: {
      step: 'assign',
      drawerId,
      promptId: item?.id || null,
      strokes: [],
      guesses: {},
      correctGuessers: [],
      endsAt: endsIn(ROUND_MS.doodle.assign),
      usedPromptIds: item ? [...used, item.id] : used,
    },
    secrets: {
      doodle: {
        promptText: item?.text || 'star',
        promptId: item?.id,
      },
    },
    roundResults: null,
    winnerId: null,
  }
}

function createWordBluffState(players, room, round = 1) {
  const used = room.gameState?.wordBluff?.usedPromptIds || []
  const item = pickRandomItem('wordBluff/words', { excludeIds: used })

  return {
    round,
    wordBluff: {
      step: 'write',
      promptId: item?.id || null,
      word: item?.text || 'WORD',
      promptText: `What does “${item?.text || 'WORD'}” mean?`,
      bluffs: {},
      guesses: {},
      choices: [],
      endsAt: endsIn(ROUND_MS.wordBluff.write),
      usedPromptIds: item ? [...used, item.id] : used,
    },
    secrets: {
      wordBluff: {
        realAnswer: item?.answer || 'unknown',
        promptId: item?.id,
      },
    },
    roundResults: null,
    winnerId: null,
  }
}

function createWouldYouRatherState(players, room, round = 1) {
  const used = room.gameState?.wouldYouRather?.usedPromptIds || []
  const item = pickRandomItem('wouldYouRather/prompts', { excludeIds: used })

  return {
    round,
    wouldYouRather: {
      step: 'vote',
      promptId: item?.id || null,
      optionA: item?.optionA || 'This',
      optionB: item?.optionB || 'That',
      votes: {},
      endsAt: endsIn(ROUND_MS.wouldYouRather.vote),
      usedPromptIds: item ? [...used, item.id] : used,
    },
    secrets: {},
    roundResults: null,
    winnerId: null,
  }
}

function createNeverHaveIEverState(players, room, round = 1) {
  const used = room.gameState?.neverHaveIEver?.usedPromptIds || []
  const item = pickRandomItem('neverHaveIEver/prompts', { excludeIds: used })

  return {
    round,
    neverHaveIEver: {
      step: 'vote',
      promptId: item?.id || null,
      statement: item?.text || 'Never have I ever told the truth in this game.',
      votes: {},
      endsAt: endsIn(ROUND_MS.neverHaveIEver.vote),
      usedPromptIds: item ? [...used, item.id] : used,
    },
    secrets: {},
    roundResults: null,
    winnerId: null,
  }
}

function createTriviaDuelState(players, room, round = 1) {
  const used = room.gameState?.triviaDuel?.usedPromptIds || []
  const item = pickRandomItem('triviaToss/questions', { excludeIds: used })

  return {
    round,
    triviaDuel: {
      step: 'question',
      questionId: item?.id || null,
      questionText: item?.text || 'Quick trivia!',
      options: item?.options || ['A', 'B', 'C', 'D'],
      answers: {},
      answeredAt: {},
      endsAt: endsIn(ROUND_MS.triviaDuel.question),
      usedPromptIds: item ? [...used, item.id] : used,
    },
    secrets: {
      triviaDuel: {
        correctIndex: item?.correctIndex ?? 0,
        questionId: item?.id,
      },
    },
    roundResults: null,
    winnerId: null,
  }
}

function createReactionDuelState(players, room, round = 1) {
  const delay = 2000 + Math.floor(Math.random() * 3000)
  const signalAt = endsIn(delay)

  return {
    round,
    reactionDuel: {
      step: 'ready',
      endsAt: signalAt,
      signalAt,
      taps: {},
      earlyTappers: {},
    },
    secrets: { reactionDuel: { signalAt } },
    roundResults: null,
    winnerId: null,
  }
}

function createDoodleDuelState(players, room, round = 1) {
  const used = room.gameState?.doodleDuel?.usedPromptIds || []
  const item = pickRandomItem('doodle/words', { excludeIds: used })
  const drawerId = pickDrawer(players, round)

  return {
    round,
    doodleDuel: {
      step: 'assign',
      drawerId,
      promptId: item?.id || null,
      strokes: [],
      guesses: {},
      correctGuessers: [],
      endsAt: endsIn(ROUND_MS.doodleDuel.assign),
      usedPromptIds: item ? [...used, item.id] : used,
    },
    secrets: {
      doodleDuel: {
        promptText: item?.text || 'star',
        promptId: item?.id,
      },
    },
    roundResults: null,
    winnerId: null,
  }
}

function createCaptionDuelState(players, room, round = 1) {
  const used = room.gameState?.captionDuel?.usedPromptIds || []
  const item = pickRandomItem('captionClash/prompts', { excludeIds: used })

  return {
    round,
    captionDuel: {
      step: 'write',
      promptId: item?.id || null,
      promptText: item?.text || 'Write something funny…',
      submissions: {},
      votes: {},
      endsAt: endsIn(ROUND_MS.captionDuel.write),
      usedPromptIds: item ? [...used, item.id] : used,
    },
    secrets: {},
    roundResults: null,
    winnerId: null,
  }
}

function createCardCrimesState(players, room, round = 1) {
  const usedBlack = room.gameState?.cardCrimes?.usedBlackIds || []
  const black = pickRandomItem('cardCrimes/black', { excludeIds: usedBlack })
  const judgeId = pickPresenter(players, round)

  const need = players.length * CARD_CRIMES_HAND_SIZE
  const whites = sampleItems('cardCrimes/white', need)
  const hands = {}
  players.forEach((p, idx) => {
    hands[p.id] = whites
      .slice(idx * CARD_CRIMES_HAND_SIZE, (idx + 1) * CARD_CRIMES_HAND_SIZE)
      .map((w) => ({ id: w.id, text: w.text }))
  })

  return {
    round,
    cardCrimes: {
      step: 'submit',
      judgeId,
      black: { text: black?.text || '___', pick: black?.pick || 1 },
      submissions: {},
      board: [],
      pickedSid: null,
      winnerId: null,
      endsAt: endsIn(ROUND_MS.cardCrimes.submit),
      usedBlackIds: black ? [...usedBlack, black.id] : usedBlack,
    },
    secrets: {
      cardCrimes: {
        hands,
        sidToPid: {},
      },
    },
    roundResults: null,
    winnerId: null,
  }
}

function createGameState(gameId, players, room, round = 1) {
  switch (gameId) {
    case 'fakinIt':
      return createFakinItState(players, room, round)
    case 'dirtyDrawful':
      return createDirtyDrawfulState(players, room, round)
    case 'letMeFinish':
      return createLetMeFinishState(players, room, round)
    case 'truthOrCube':
      return createTruthOrCubeState(players, room, round)
    case 'bluffBox':
      return createBluffBoxState(players, room, round)
    case 'triviaToss':
      return createTriviaTossState(players, room, round)
    case 'reactionRush':
      return createReactionRushState(players, room, round)
    case 'categories':
      return createCategoriesState(players, room, round)
    case 'doodle':
      return createDoodleState(players, room, round)
    case 'wordBluff':
      return createWordBluffState(players, room, round)
    case 'wouldYouRather':
      return createWouldYouRatherState(players, room, round)
    case 'neverHaveIEver':
      return createNeverHaveIEverState(players, room, round)
    case 'cardCrimes':
      return createCardCrimesState(players, room, round)
    case 'triviaDuel':
      return createTriviaDuelState(players, room, round)
    case 'reactionDuel':
      return createReactionDuelState(players, room, round)
    case 'doodleDuel':
      return createDoodleDuelState(players, room, round)
    case 'captionDuel':
      return createCaptionDuelState(players, room, round)
    case 'captionClash':
    default:
      return createCaptionClashState(players, room, round)
  }
}

module.exports = { createGameState, ROUND_MS, endsIn, buildBluffChoices }
