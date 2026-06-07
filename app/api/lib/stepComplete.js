const { activePlayers } = require('./playerPresence')

function activeIds(players) {
  return activePlayers(players).map((p) => p.id)
}

function allPlayersHave(map, playerIds) {
  return playerIds.every((id) => {
    const val = map?.[id]
    return val !== undefined && val !== null && val !== ''
  })
}

/** True when every connected player has finished the current input step. */
function isStepComplete(room) {
  if (room?.phase !== 'playing') return false

  const gameId = room.config?.gameId || 'captionClash'
  const gs = room.gameState || {}
  const playerIds = activeIds(room.players || [])
  if (playerIds.length === 0) return false

  if ((gameId === 'captionClash' && gs.captionClash) || (gameId === 'captionDuel' && gs.captionDuel)) {
    const { step, submissions, votes } = gs[gameId]
    if (step === 'write') return allPlayersHave(submissions, playerIds)
    if (step === 'vote') return allPlayersHave(votes, playerIds)
    return false
  }

  if (gameId === 'bluffBox' && gs.bluffBox) {
    const { step, bluffs, guesses } = gs.bluffBox
    if (step === 'write') return allPlayersHave(bluffs, playerIds)
    if (step === 'guess') return allPlayersHave(guesses, playerIds)
    return false
  }

  if ((gameId === 'triviaToss' && gs.triviaToss) || (gameId === 'triviaDuel' && gs.triviaDuel)) {
    const { step, answers } = gs[gameId]
    if (step === 'question') return allPlayersHave(answers, playerIds)
    return false
  }

  if ((gameId === 'reactionRush' && gs.reactionRush) || (gameId === 'reactionDuel' && gs.reactionDuel)) {
    const { step, taps, earlyTappers } = gs[gameId]
    if (step === 'go') {
      return playerIds.every((id) => earlyTappers?.[id] || taps?.[id])
    }
    return false
  }

  if (gameId === 'fakinIt' && gs.fakinIt) {
    const { step, actionAcks, votes } = gs.fakinIt
    if (step === 'action') return allPlayersHave(actionAcks, playerIds)
    if (step === 'vote') return allPlayersHave(votes, playerIds)
    return false
  }

  if (gameId === 'dirtyDrawful' && gs.dirtyDrawful) {
    const { step, drawerId, guesses } = gs.dirtyDrawful
    if (step === 'guess') {
      const guessers = playerIds.filter((id) => id !== drawerId)
      return guessers.length > 0 && allPlayersHave(guesses, guessers)
    }
    return false
  }

  if (gameId === 'letMeFinish' && gs.letMeFinish) {
    const { step, votes } = gs.letMeFinish
    if (step === 'vote') return allPlayersHave(votes, playerIds)
    return false
  }

  if (gameId === 'categories' && gs.categories) {
    const { step, answers } = gs.categories
    if (step === 'write') return allPlayersHave(answers, playerIds)
    return false
  }

  if ((gameId === 'doodle' && gs.doodle) || (gameId === 'doodleDuel' && gs.doodleDuel)) {
    const { step, drawerId, guesses } = gs[gameId]
    if (step === 'guess') {
      const guessers = playerIds.filter((id) => id !== drawerId)
      return guessers.length > 0 && allPlayersHave(guesses, guessers)
    }
    return false
  }

  if (gameId === 'wordBluff' && gs.wordBluff) {
    const { step, bluffs, guesses } = gs.wordBluff
    if (step === 'write') return allPlayersHave(bluffs, playerIds)
    if (step === 'guess') return allPlayersHave(guesses, playerIds)
    return false
  }

  if ((gameId === 'wouldYouRather' && gs.wouldYouRather) || (gameId === 'neverHaveIEver' && gs.neverHaveIEver)) {
    const v = gs[gameId]
    if (v.step === 'vote') return allPlayersHave(v.votes, playerIds)
    return false
  }

  if (gameId === 'cardCrimes' && gs.cardCrimes) {
    const { step, judgeId, submissions, pickedSid } = gs.cardCrimes
    if (step === 'submit') {
      const submitters = playerIds.filter((id) => id !== judgeId)
      return submitters.length > 0 && allPlayersHave(submissions, submitters)
    }
    if (step === 'judge') return !!pickedSid
    return false
  }

  if (gameId === 'truthOrCube' && gs.truthOrCube) {
    const { step, targetPlayerId, outcome } = gs.truthOrCube
    if (step === 'active') return !!outcome && activeIds(room.players).includes(targetPlayerId)
    return false
  }

  return false
}

module.exports = { isStepComplete, activeIds, allPlayersHave }
