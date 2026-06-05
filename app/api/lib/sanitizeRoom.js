const { dedupePlayers } = require('./players')

/** Strip secret fields before sending room to clients */
function sanitizeGameState(gameState, gameId) {
  if (!gameState) return null
  const gs = { ...gameState }
  delete gs.secrets

  if (gameId === 'fakinIt' && gs.fakinIt) {
    const fi = { ...gs.fakinIt }
    if (fi.step !== 'reveal') {
      delete fi.promptText
    }
    gs.fakinIt = fi
  }

  if (gameId === 'dirtyDrawful' && gs.dirtyDrawful) {
    const dd = { ...gs.dirtyDrawful }
    if (dd.step !== 'reveal') {
      delete dd.promptText
    }
    gs.dirtyDrawful = dd
  }

  if (gameId === 'truthOrCube' && gs.truthOrCube) {
    const toc = { ...gs.truthOrCube }
    if (toc.step !== 'reveal') {
      delete toc.promptText
    }
    gs.truthOrCube = toc
  }

  if (gameId === 'captionClash' && gs.captionClash) {
    const cc = { ...gs.captionClash }
    if (cc.step === 'write') {
      delete cc.submissions
      delete cc.votes
    } else if (cc.step === 'vote') {
      delete cc.votes
    }
    gs.captionClash = cc
  }

  if (gameId === 'bluffBox' && gs.bluffBox) {
    const bb = { ...gs.bluffBox }
    if (bb.step === 'write') {
      delete bb.bluffs
      delete bb.guesses
      delete bb.choices
      delete bb.realAnswer
    } else if (bb.step === 'guess') {
      delete bb.guesses
      delete bb.realAnswer
    }
    gs.bluffBox = bb
  }

  if (gameId === 'triviaToss' && gs.triviaToss) {
    const tt = { ...gs.triviaToss }
    if (tt.step !== 'reveal') {
      delete tt.correctIndex
      delete tt.answers
    }
    gs.triviaToss = tt
  }

  if (gameId === 'reactionRush' && gs.reactionRush) {
    const rr = { ...gs.reactionRush }
    if (rr.step === 'ready') {
      delete rr.taps
      delete rr.earlyTappers
    }
    gs.reactionRush = rr
  }

  return gs
}

function publicRoom(room) {
  const gameId = room.config?.gameId || 'captionClash'
  return {
    roomId: room.roomId,
    gameCode: room.gameCode,
    mode: room.mode || 'online',
    hostId: room.hostId,
    phase: room.phase || 'lobby',
    players: dedupePlayers(room.players || []),
    config: room.config || { targetScore: 5000, gameId: 'captionClash' },
    gameState: sanitizeGameState(room.gameState, gameId),
    chat: Array.isArray(room.chat) ? room.chat.slice(-100) : [],
    updatedAt: room.updatedAt || null,
  }
}

module.exports = { publicRoom, sanitizeGameState }
