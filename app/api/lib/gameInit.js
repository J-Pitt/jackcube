const { createInitialFlappyState } = require('./flappyInit')
const { pickRandomItem, pickHostLine } = require('./content')

const ROUND_MS = {
  fakinIt: { prompt: 8000, action: 25000, vote: 30000, reveal: 8000 },
  dirtyDrawful: { assign: 5000, draw: 90000, guess: 30000, reveal: 10000 },
  letMeFinish: { question: 6000, pitch: 55000, rebuttal: 20000, vote: 25000, reveal: 8000 },
  truthOrCube: { cube: 4500, active: 50000, reveal: 7000 },
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

function pickTarget(players, round) {
  const idx = (round - 1) % players.length
  return players[idx].id
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
    case 'flappy':
    default:
      return {
        round,
        countdownStartedAt: new Date().toISOString(),
        flappy: createInitialFlappyState(players),
        roundResults: null,
        winnerId: null,
      }
  }
}

module.exports = { createGameState, ROUND_MS, endsIn }
