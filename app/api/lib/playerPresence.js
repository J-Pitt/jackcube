const { endsIn, ROUND_MS } = require('./gameInit')

function isConnected(player) {
  return player && !player.disconnectedAt
}

function activePlayers(players) {
  return (players || []).filter(isConnected)
}

function markDisconnected(players, playerId) {
  const now = new Date().toISOString()
  return (players || []).map((p) =>
    p.id === playerId ? { ...p, disconnectedAt: now } : p
  )
}

function markConnected(players, playerId) {
  return (players || []).map((p) => {
    if (p.id !== playerId) return p
    const next = { ...p }
    delete next.disconnectedAt
    return next
  })
}

function nextConnectedPlayer(players, startId) {
  const active = activePlayers(players)
  if (active.length === 0) return null
  const idx = active.findIndex((p) => p.id === startId)
  if (idx === -1) return active[0]
  return active[(idx + 1) % active.length]
}

/** Keep game running when the current actor disconnects. */
function sanitizeGameOnDisconnect(room, playerId) {
  if (!room?.gameState || room.phase !== 'playing') return room.gameState

  const gs = { ...room.gameState }
  const gameId = room.config?.gameId || 'captionClash'
  const players = room.players || []

  if (gameId === 'truthOrCube' && gs.truthOrCube) {
    const toc = { ...gs.truthOrCube }
    if (toc.targetPlayerId === playerId) {
      if (toc.step === 'active' && !toc.outcome) {
        toc.outcome = 'chicken'
      } else if (toc.step === 'cube') {
        const replacement = nextConnectedPlayer(players, playerId)
        if (replacement) toc.targetPlayerId = replacement.id
      }
    }
    gs.truthOrCube = toc
  }

  if (gameId === 'dirtyDrawful' && gs.dirtyDrawful) {
    const dd = { ...gs.dirtyDrawful }
    if (dd.drawerId === playerId) {
      if (dd.step === 'draw' || dd.step === 'assign') {
        dd.step = 'guess'
        dd.endsAt = endsIn(ROUND_MS.dirtyDrawful.guess)
      }
    }
    gs.dirtyDrawful = dd
  }

  if (gameId === 'letMeFinish' && gs.letMeFinish) {
    const lmf = { ...gs.letMeFinish }
    if (lmf.presenterId === playerId) {
      if (lmf.step === 'question' || lmf.step === 'pitch') {
        lmf.step = 'vote'
        lmf.endsAt = endsIn(ROUND_MS.letMeFinish.vote)
      }
    }
    if (lmf.rebuttalPlayerId === playerId && lmf.step === 'rebuttal') {
      lmf.rebuttalText = lmf.rebuttalText || '(left the game)'
      lmf.step = 'vote'
      lmf.endsAt = endsIn(ROUND_MS.letMeFinish.vote)
    }
    gs.letMeFinish = lmf
  }

  return gs
}

module.exports = {
  isConnected,
  activePlayers,
  markDisconnected,
  markConnected,
  sanitizeGameOnDisconnect,
}
