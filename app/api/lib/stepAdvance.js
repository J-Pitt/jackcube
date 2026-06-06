const { endsIn, ROUND_MS, buildBluffChoices } = require('./gameInit')
const { pickHostLine } = require('./content')
const { scoreFakinItRound } = require('./games/fakinItScoring')
const { scoreDirtyDrawfulRound } = require('./games/dirtyDrawfulScoring')
const { scoreLetMeFinishRound } = require('./games/letMeFinishScoring')
const { scoreTruthOrCubeRound } = require('./games/truthOrCubeScoring')
const { scoreCaptionClashRound } = require('./games/captionClashScoring')
const { scoreBluffBoxRound } = require('./games/bluffBoxScoring')
const { scoreTriviaTossRound } = require('./games/triviaTossScoring')
const { scoreReactionRushRound } = require('./games/reactionRushScoring')
const { scoreCategoriesRound } = require('./games/categoriesScoring')
const { scoreChoiceVoteRound } = require('./games/choiceVoteScoring')
const { scoreCardCrimesRound } = require('./games/cardCrimesScoring')
const { shuffleArray } = require('./games/partyGameUtils')
const { scoreRound, checkVictory } = require('./scoring')

/** Advance one step in the current party game. Mutates room in place. */
function applyStepAdvance(room, { forceStep } = {}) {
  if (room.phase === 'countdown') {
    room.phase = 'playing'
    room.updatedAt = new Date().toISOString()
    return { roundEnded: false }
  }

  if (room.phase !== 'playing') {
    return { roundEnded: false }
  }

  const gameId = room.config?.gameId || 'captionClash'
  const gs = { ...room.gameState }
  const secrets = gs.secrets || {}
  const targetScore = room.config?.targetScore ?? 5000

  if (gameId === 'fakinIt' && gs.fakinIt) {
    const fi = { ...gs.fakinIt }
    const sec = secrets.fakinIt || {}

    if (forceStep) fi.step = forceStep
    else if (fi.step === 'prompt') {
      fi.step = 'action'
      fi.endsAt = endsIn(ROUND_MS.fakinIt.action)
    } else if (fi.step === 'action') {
      fi.step = 'vote'
      fi.endsAt = endsIn(ROUND_MS.fakinIt.vote)
    } else if (fi.step === 'vote') {
      fi.step = 'reveal'
      fi.promptText = sec.promptText
      fi.endsAt = endsIn(ROUND_MS.fakinIt.reveal)
    } else if (fi.step === 'reveal') {
      const roundScores = scoreFakinItRound(fi, room.players || [])
      const { results, updatedPlayers } = scoreRound(room.players || [], roundScores)
      room.players = updatedPlayers
      const winner = checkVictory(updatedPlayers, targetScore)
      room.phase = winner ? 'victory' : 'leaderboard'
      room.gameState = { ...gs, fakinIt: fi, roundResults: results, winnerId: winner?.id || null }
      room.updatedAt = new Date().toISOString()
      return { roundEnded: true }
    }
    gs.fakinIt = fi
  }

  if (gameId === 'dirtyDrawful' && gs.dirtyDrawful) {
    const dd = { ...gs.dirtyDrawful }
    const sec = secrets.dirtyDrawful || {}

    if (dd.step === 'assign') {
      dd.step = 'draw'
      dd.endsAt = endsIn(ROUND_MS.dirtyDrawful.draw)
      dd.hostLine = pickHostLine()?.text || dd.hostLine
    } else if (dd.step === 'draw') {
      dd.step = 'guess'
      dd.endsAt = endsIn(ROUND_MS.dirtyDrawful.guess)
    } else if (dd.step === 'guess') {
      const target = sec.promptText || ''
      const correctGuessers = []
      Object.entries(dd.guesses || {}).forEach(([pid, guess]) => {
        if (pid === dd.drawerId) return
        const g = String(guess).trim().toLowerCase()
        const t = String(target).trim().toLowerCase()
        if (g && (g === t || t.includes(g) || g.includes(t))) correctGuessers.push(pid)
      })
      dd.correctGuessers = correctGuessers
      dd.step = 'reveal'
      dd.promptText = target
      dd.endsAt = endsIn(ROUND_MS.dirtyDrawful.reveal)
    } else if (dd.step === 'reveal') {
      const roundScores = scoreDirtyDrawfulRound(
        { ...dd, promptText: sec.promptText || dd.promptText },
        room.players || []
      )
      const { results, updatedPlayers } = scoreRound(room.players || [], roundScores)
      room.players = updatedPlayers
      const winner = checkVictory(updatedPlayers, targetScore)
      room.phase = winner ? 'victory' : 'leaderboard'
      room.gameState = { ...gs, dirtyDrawful: dd, roundResults: results, winnerId: winner?.id || null }
      room.updatedAt = new Date().toISOString()
      return { roundEnded: true }
    }
    gs.dirtyDrawful = dd
  }

  if (gameId === 'truthOrCube' && gs.truthOrCube) {
    const toc = { ...gs.truthOrCube }
    const sec = secrets.truthOrCube || {}

    if (toc.step === 'cube') {
      toc.step = 'active'
      toc.endsAt = endsIn(ROUND_MS.truthOrCube.active)
    } else if (toc.step === 'active') {
      toc.step = 'reveal'
      toc.promptText = sec.promptText
      toc.endsAt = endsIn(ROUND_MS.truthOrCube.reveal)
    } else if (toc.step === 'reveal') {
      const roundScores = scoreTruthOrCubeRound(toc, room.players || [])
      const { results, updatedPlayers } = scoreRound(room.players || [], roundScores)
      room.players = updatedPlayers
      const winner = checkVictory(updatedPlayers, targetScore)
      room.phase = winner ? 'victory' : 'leaderboard'
      room.gameState = {
        ...gs,
        truthOrCube: toc,
        roundResults: results,
        winnerId: winner?.id || null,
      }
      room.updatedAt = new Date().toISOString()
      return { roundEnded: true }
    }
    gs.truthOrCube = toc
  }

  if (gameId === 'letMeFinish' && gs.letMeFinish) {
    const lmf = { ...gs.letMeFinish }

    if (lmf.step === 'question') {
      lmf.step = 'pitch'
      lmf.pitchStarted = true
      lmf.endsAt = endsIn(ROUND_MS.letMeFinish.pitch)
    } else if (lmf.step === 'pitch') {
      lmf.step = 'rebuttal'
      lmf.endsAt = endsIn(ROUND_MS.letMeFinish.rebuttal)
    } else if (lmf.step === 'rebuttal') {
      lmf.step = 'vote'
      lmf.endsAt = endsIn(ROUND_MS.letMeFinish.vote)
    } else if (lmf.step === 'vote') {
      lmf.step = 'reveal'
      lmf.endsAt = endsIn(ROUND_MS.letMeFinish.reveal)
    } else if (lmf.step === 'reveal') {
      const roundScores = scoreLetMeFinishRound(lmf, room.players || [])
      const { results, updatedPlayers } = scoreRound(room.players || [], roundScores)
      room.players = updatedPlayers
      const winner = checkVictory(updatedPlayers, targetScore)
      room.phase = winner ? 'victory' : 'leaderboard'
      room.gameState = { ...gs, letMeFinish: lmf, roundResults: results, winnerId: winner?.id || null }
      room.updatedAt = new Date().toISOString()
      return { roundEnded: true }
    }
    gs.letMeFinish = lmf
  }

  if (gameId === 'captionClash' && gs.captionClash) {
    const cc = { ...gs.captionClash }

    if (cc.step === 'write') {
      cc.step = 'vote'
      cc.endsAt = endsIn(ROUND_MS.captionClash.vote)
    } else if (cc.step === 'vote') {
      cc.step = 'reveal'
      cc.endsAt = endsIn(ROUND_MS.captionClash.reveal)
    } else if (cc.step === 'reveal') {
      const roundScores = scoreCaptionClashRound(cc, room.players || [])
      const { results, updatedPlayers } = scoreRound(room.players || [], roundScores)
      room.players = updatedPlayers
      const winner = checkVictory(updatedPlayers, targetScore)
      room.phase = winner ? 'victory' : 'leaderboard'
      room.gameState = { ...gs, captionClash: cc, roundResults: results, winnerId: winner?.id || null }
      room.updatedAt = new Date().toISOString()
      return { roundEnded: true }
    }
    gs.captionClash = cc
  }

  if (gameId === 'bluffBox' && gs.bluffBox) {
    const bb = { ...gs.bluffBox }
    const sec = secrets.bluffBox || {}

    if (bb.step === 'write') {
      bb.choices = buildBluffChoices(bb.bluffs || {}, sec.realAnswer, room.players || [])
      bb.step = 'guess'
      bb.endsAt = endsIn(ROUND_MS.bluffBox.guess)
    } else if (bb.step === 'guess') {
      bb.step = 'reveal'
      bb.realAnswer = sec.realAnswer
      bb.endsAt = endsIn(ROUND_MS.bluffBox.reveal)
    } else if (bb.step === 'reveal') {
      const roundScores = scoreBluffBoxRound(bb, room.players || [])
      const { results, updatedPlayers } = scoreRound(room.players || [], roundScores)
      room.players = updatedPlayers
      const winner = checkVictory(updatedPlayers, targetScore)
      room.phase = winner ? 'victory' : 'leaderboard'
      room.gameState = { ...gs, bluffBox: bb, roundResults: results, winnerId: winner?.id || null }
      room.updatedAt = new Date().toISOString()
      return { roundEnded: true }
    }
    gs.bluffBox = bb
  }

  if (gameId === 'triviaToss' && gs.triviaToss) {
    const tt = { ...gs.triviaToss }
    const sec = secrets.triviaToss || {}

    if (tt.step === 'question') {
      tt.step = 'reveal'
      tt.correctIndex = sec.correctIndex
      tt.endsAt = endsIn(ROUND_MS.triviaToss.reveal)
    } else if (tt.step === 'reveal') {
      const roundScores = scoreTriviaTossRound(tt, room.players || [], sec.correctIndex ?? 0)
      const { results, updatedPlayers } = scoreRound(room.players || [], roundScores)
      room.players = updatedPlayers
      const winner = checkVictory(updatedPlayers, targetScore)
      room.phase = winner ? 'victory' : 'leaderboard'
      room.gameState = { ...gs, triviaToss: tt, roundResults: results, winnerId: winner?.id || null }
      room.updatedAt = new Date().toISOString()
      return { roundEnded: true }
    }
    gs.triviaToss = tt
  }

  if (gameId === 'reactionRush' && gs.reactionRush) {
    const rr = { ...gs.reactionRush }

    if (rr.step === 'ready') {
      rr.step = 'go'
      rr.goAt = new Date().toISOString()
      rr.endsAt = endsIn(ROUND_MS.reactionRush.go)
    } else if (rr.step === 'go') {
      rr.step = 'reveal'
      rr.endsAt = endsIn(ROUND_MS.reactionRush.reveal)
    } else if (rr.step === 'reveal') {
      const roundScores = scoreReactionRushRound(rr, room.players || [])
      const { results, updatedPlayers } = scoreRound(room.players || [], roundScores)
      room.players = updatedPlayers
      const winner = checkVictory(updatedPlayers, targetScore)
      room.phase = winner ? 'victory' : 'leaderboard'
      room.gameState = { ...gs, reactionRush: rr, roundResults: results, winnerId: winner?.id || null }
      room.updatedAt = new Date().toISOString()
      return { roundEnded: true }
    }
    gs.reactionRush = rr
  }

  if (gameId === 'categories' && gs.categories) {
    const cat = { ...gs.categories }

    if (cat.step === 'write') {
      cat.step = 'reveal'
      cat.endsAt = endsIn(ROUND_MS.categories.reveal)
    } else if (cat.step === 'reveal') {
      const roundScores = scoreCategoriesRound(cat, room.players || [])
      const { results, updatedPlayers } = scoreRound(room.players || [], roundScores)
      room.players = updatedPlayers
      const winner = checkVictory(updatedPlayers, targetScore)
      room.phase = winner ? 'victory' : 'leaderboard'
      room.gameState = { ...gs, categories: cat, roundResults: results, winnerId: winner?.id || null }
      room.updatedAt = new Date().toISOString()
      return { roundEnded: true }
    }
    gs.categories = cat
  }

  if (gameId === 'doodle' && gs.doodle) {
    const dl = { ...gs.doodle }
    const sec = secrets.doodle || {}

    if (dl.step === 'assign') {
      dl.step = 'draw'
      dl.endsAt = endsIn(ROUND_MS.doodle.draw)
    } else if (dl.step === 'draw') {
      dl.step = 'guess'
      dl.endsAt = endsIn(ROUND_MS.doodle.guess)
    } else if (dl.step === 'guess') {
      const target = sec.promptText || ''
      const correctGuessers = []
      Object.entries(dl.guesses || {}).forEach(([pid, guess]) => {
        if (pid === dl.drawerId) return
        const g = String(guess).trim().toLowerCase()
        const t = String(target).trim().toLowerCase()
        if (g && (g === t || t.includes(g) || g.includes(t))) correctGuessers.push(pid)
      })
      dl.correctGuessers = correctGuessers
      dl.step = 'reveal'
      dl.promptText = target
      dl.endsAt = endsIn(ROUND_MS.doodle.reveal)
    } else if (dl.step === 'reveal') {
      const roundScores = scoreDirtyDrawfulRound(
        { ...dl, promptText: sec.promptText || dl.promptText },
        room.players || []
      )
      const { results, updatedPlayers } = scoreRound(room.players || [], roundScores)
      room.players = updatedPlayers
      const winner = checkVictory(updatedPlayers, targetScore)
      room.phase = winner ? 'victory' : 'leaderboard'
      room.gameState = { ...gs, doodle: dl, roundResults: results, winnerId: winner?.id || null }
      room.updatedAt = new Date().toISOString()
      return { roundEnded: true }
    }
    gs.doodle = dl
  }

  if (gameId === 'wordBluff' && gs.wordBluff) {
    const wb = { ...gs.wordBluff }
    const sec = secrets.wordBluff || {}

    if (wb.step === 'write') {
      wb.choices = buildBluffChoices(wb.bluffs || {}, sec.realAnswer, room.players || [])
      wb.step = 'guess'
      wb.endsAt = endsIn(ROUND_MS.wordBluff.guess)
    } else if (wb.step === 'guess') {
      wb.step = 'reveal'
      wb.realAnswer = sec.realAnswer
      wb.endsAt = endsIn(ROUND_MS.wordBluff.reveal)
    } else if (wb.step === 'reveal') {
      const roundScores = scoreBluffBoxRound(wb, room.players || [])
      const { results, updatedPlayers } = scoreRound(room.players || [], roundScores)
      room.players = updatedPlayers
      const winner = checkVictory(updatedPlayers, targetScore)
      room.phase = winner ? 'victory' : 'leaderboard'
      room.gameState = { ...gs, wordBluff: wb, roundResults: results, winnerId: winner?.id || null }
      room.updatedAt = new Date().toISOString()
      return { roundEnded: true }
    }
    gs.wordBluff = wb
  }

  if ((gameId === 'wouldYouRather' && gs.wouldYouRather) || (gameId === 'neverHaveIEver' && gs.neverHaveIEver)) {
    const slot = gameId
    const v = { ...gs[slot] }
    const options = gameId === 'wouldYouRather' ? ['a', 'b'] : ['have', 'never']

    if (v.step === 'vote') {
      v.step = 'reveal'
      v.endsAt = endsIn(ROUND_MS[slot].reveal)
    } else if (v.step === 'reveal') {
      const roundScores = scoreChoiceVoteRound(v.votes || {}, room.players || [], options)
      const { results, updatedPlayers } = scoreRound(room.players || [], roundScores)
      room.players = updatedPlayers
      const winner = checkVictory(updatedPlayers, targetScore)
      room.phase = winner ? 'victory' : 'leaderboard'
      room.gameState = { ...gs, [slot]: v, roundResults: results, winnerId: winner?.id || null }
      room.updatedAt = new Date().toISOString()
      return { roundEnded: true }
    }
    gs[slot] = v
  }

  if (gameId === 'cardCrimes' && gs.cardCrimes) {
    const cc = { ...gs.cardCrimes }
    const sec = secrets.cardCrimes || {}

    if (cc.step === 'submit') {
      const entries = Object.entries(cc.submissions || {})
        .filter(([pid]) => pid !== cc.judgeId)
        .map(([pid, texts]) => ({ pid, texts }))
      const shuffled = shuffleArray(entries)
      const sidToPid = {}
      cc.board = shuffled.map((e, i) => {
        const sid = `sub_${i}_${Math.random().toString(36).slice(2, 8)}`
        sidToPid[sid] = e.pid
        return { sid, texts: e.texts }
      })
      secrets.cardCrimes = { ...sec, sidToPid }
      gs.secrets = secrets
      cc.step = 'judge'
      cc.endsAt = endsIn(ROUND_MS.cardCrimes.judge)
    } else if (cc.step === 'judge') {
      const sidToPid = sec.sidToPid || {}
      const winnerId = cc.pickedSid ? sidToPid[cc.pickedSid] : null
      cc.winnerId = winnerId || null
      cc.board = (cc.board || []).map((b) => ({ ...b, authorId: sidToPid[b.sid] || null }))
      cc.step = 'reveal'
      cc.endsAt = endsIn(ROUND_MS.cardCrimes.reveal)
    } else if (cc.step === 'reveal') {
      const roundScores = scoreCardCrimesRound(cc, room.players || [])
      const { results, updatedPlayers } = scoreRound(room.players || [], roundScores)
      room.players = updatedPlayers
      const winner = checkVictory(updatedPlayers, targetScore)
      room.phase = winner ? 'victory' : 'leaderboard'
      room.gameState = { ...gs, cardCrimes: cc, roundResults: results, winnerId: winner?.id || null }
      room.updatedAt = new Date().toISOString()
      return { roundEnded: true }
    }
    gs.cardCrimes = cc
  }

  room.gameState = gs
  room.updatedAt = new Date().toISOString()
  return { roundEnded: false }
}

module.exports = { applyStepAdvance }
