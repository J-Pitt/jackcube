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

  return gs
}

function publicRoom(room) {
  const gameId = room.config?.gameId || 'flappy'
  return {
    roomId: room.roomId,
    gameCode: room.gameCode,
    mode: room.mode || 'online',
    hostId: room.hostId,
    phase: room.phase || 'lobby',
    players: dedupePlayers(room.players || []),
    config: room.config || { targetScore: 5000, gameId: 'flappy' },
    gameState: sanitizeGameState(room.gameState, gameId),
    chat: Array.isArray(room.chat) ? room.chat.slice(-100) : [],
    updatedAt: room.updatedAt || null,
  }
}

module.exports = { publicRoom, sanitizeGameState }
