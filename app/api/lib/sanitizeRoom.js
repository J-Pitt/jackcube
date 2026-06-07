const { dedupePlayers } = require('./players')

function keysOf(map) {
  return map && typeof map === 'object' ? Object.keys(map) : []
}

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
    if (fi.step === 'action') fi.answeredIds = keysOf(fi.actionAcks)
    else if (fi.step === 'vote') fi.answeredIds = keysOf(fi.votes)
    gs.fakinIt = fi
  }

  if (gameId === 'dirtyDrawful' && gs.dirtyDrawful) {
    const dd = { ...gs.dirtyDrawful }
    if (dd.step !== 'reveal') {
      delete dd.promptText
    }
    if (dd.step === 'guess') dd.answeredIds = keysOf(dd.guesses)
    gs.dirtyDrawful = dd
  }

  if (gameId === 'truthOrCube' && gs.truthOrCube) {
    const toc = { ...gs.truthOrCube }
    if (toc.step !== 'reveal') {
      delete toc.promptText
    }
    gs.truthOrCube = toc
  }

  if ((gameId === 'captionClash' && gs.captionClash) || (gameId === 'captionDuel' && gs.captionDuel)) {
    const cc = { ...gs[gameId] }
    if (cc.step === 'write') {
      cc.answeredIds = keysOf(cc.submissions)
      delete cc.submissions
      delete cc.votes
    } else if (cc.step === 'vote') {
      cc.answeredIds = keysOf(cc.votes)
      delete cc.votes
    }
    gs[gameId] = cc
  }

  if (gameId === 'bluffBox' && gs.bluffBox) {
    const bb = { ...gs.bluffBox }
    if (bb.step === 'write') {
      bb.answeredIds = keysOf(bb.bluffs)
      delete bb.bluffs
      delete bb.guesses
      delete bb.choices
      delete bb.realAnswer
    } else if (bb.step === 'guess') {
      bb.answeredIds = keysOf(bb.guesses)
      delete bb.guesses
      delete bb.realAnswer
      // Never leak which choice is real or who authored each bluff before reveal.
      bb.choices = (bb.choices || []).map((c) => ({ id: c.id, text: c.text }))
    }
    gs.bluffBox = bb
  }

  if ((gameId === 'triviaToss' && gs.triviaToss) || (gameId === 'triviaDuel' && gs.triviaDuel)) {
    const tt = { ...gs[gameId] }
    if (tt.step !== 'reveal') {
      tt.answeredIds = keysOf(tt.answers)
      delete tt.correctIndex
      delete tt.answers
      delete tt.answeredAt
    }
    gs[gameId] = tt
  }

  if ((gameId === 'reactionRush' && gs.reactionRush) || (gameId === 'reactionDuel' && gs.reactionDuel)) {
    const rr = { ...gs[gameId] }
    if (rr.step === 'ready') {
      delete rr.taps
      delete rr.earlyTappers
    } else if (rr.step === 'go') {
      rr.answeredIds = [...keysOf(rr.taps), ...keysOf(rr.earlyTappers)]
    }
    gs[gameId] = rr
  }

  if (gameId === 'categories' && gs.categories) {
    const cat = { ...gs.categories }
    if (cat.step === 'write') {
      cat.answeredIds = keysOf(cat.answers)
      delete cat.answers
    }
    gs.categories = cat
  }

  if ((gameId === 'doodle' && gs.doodle) || (gameId === 'doodleDuel' && gs.doodleDuel)) {
    const dl = { ...gs[gameId] }
    if (dl.step !== 'reveal') {
      delete dl.promptText
    }
    if (dl.step === 'guess') dl.answeredIds = keysOf(dl.guesses)
    gs[gameId] = dl
  }

  if ((gameId === 'wouldYouRather' && gs.wouldYouRather) || (gameId === 'neverHaveIEver' && gs.neverHaveIEver)) {
    const v = { ...gs[gameId] }
    if (v.step === 'vote') {
      v.answeredIds = keysOf(v.votes)
      delete v.votes
    }
    gs[gameId] = v
  }

  if (gameId === 'cardCrimes' && gs.cardCrimes) {
    const cc = { ...gs.cardCrimes }
    if (cc.step === 'submit') {
      cc.answeredIds = keysOf(cc.submissions)
      delete cc.submissions
      delete cc.board
    } else if (cc.step === 'judge') {
      // Show anonymized submissions (texts only) — never the authors before reveal.
      cc.board = (cc.board || []).map((b) => ({ sid: b.sid, texts: b.texts }))
      delete cc.submissions
      delete cc.pickedSid
    }
    gs.cardCrimes = cc
  }

  if (gameId === 'wordBluff' && gs.wordBluff) {
    const wb = { ...gs.wordBluff }
    if (wb.step === 'write') {
      wb.answeredIds = keysOf(wb.bluffs)
      delete wb.bluffs
      delete wb.guesses
      delete wb.choices
      delete wb.realAnswer
    } else if (wb.step === 'guess') {
      wb.answeredIds = keysOf(wb.guesses)
      delete wb.guesses
      delete wb.realAnswer
      wb.choices = (wb.choices || []).map((c) => ({ id: c.id, text: c.text }))
    }
    gs.wordBluff = wb
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
