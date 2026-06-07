import { NextResponse } from 'next/server'
import { getRoom } from '../../../lib/redis'
import { pickChallengerLine } from '../../../lib/content'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const roomId = searchParams.get('roomId')
    const playerId = searchParams.get('playerId')

    if (!roomId || !playerId) {
      return NextResponse.json(
        { success: false, error: 'roomId and playerId required' },
        { status: 400 }
      )
    }

    const room = await getRoom(roomId)
    if (!room) {
      return NextResponse.json({ success: false, error: 'Room not found' }, { status: 404 })
    }

    const player = (room.players || []).find((p) => p.id === playerId)
    if (!player) {
      return NextResponse.json({ success: false, error: 'Player not in room' }, { status: 403 })
    }

    const gameId = room.config?.gameId || 'captionClash'
    const secrets = room.gameState?.secrets || {}
    const payload = { success: true, gameId, phase: room.phase, playerId }

    if (gameId === 'fakinIt' && room.gameState?.fakinIt) {
      const fi = room.gameState.fakinIt
      const sec = secrets.fakinIt || {}
      const isFaker = fi.fakerId === playerId
      payload.role = isFaker ? 'faker' : 'player'
      if (isFaker) {
        payload.privatePrompt =
          "You're the Faker. Blend in — you don't know the real prompt. Mirror others or use gesture buttons."
      } else if (fi.step !== 'reveal') {
        payload.privatePrompt = sec.promptText || null
      } else {
        payload.privatePrompt = fi.promptText || sec.promptText
      }
      payload.step = fi.step
      payload.remotePlay = !!fi.remotePlay
    }

    if (gameId === 'dirtyDrawful' && room.gameState?.dirtyDrawful) {
      const dd = room.gameState.dirtyDrawful
      const sec = secrets.dirtyDrawful || {}
      const isDrawer = dd.drawerId === playerId
      payload.role = isDrawer ? 'drawer' : 'guesser'
      if (isDrawer && dd.step !== 'reveal') {
        payload.privatePrompt = sec.promptText || null
      } else if (dd.step === 'reveal') {
        payload.privatePrompt = dd.promptText || sec.promptText
      }
      payload.step = dd.step
    }

    if (gameId === 'truthOrCube' && room.gameState?.truthOrCube) {
      const toc = room.gameState.truthOrCube
      const sec = secrets.truthOrCube || {}
      const isTarget = toc.targetPlayerId === playerId
      payload.role = isTarget ? 'target' : 'audience'
      payload.step = toc.step
      payload.cardType = toc.step !== 'cube' ? toc.cardType : null
      if (isTarget && (toc.step === 'active' || toc.step === 'reveal')) {
        payload.privatePrompt = sec.promptText || toc.promptText || null
      } else if (!isTarget && toc.step === 'reveal') {
        payload.privatePrompt = toc.promptText || sec.promptText
      } else if (!isTarget && toc.step === 'active') {
        payload.privatePrompt = `It's a ${toc.cardType} — cheer them on!`
      }
      payload.isTarget = isTarget
    }

    if (gameId === 'letMeFinish' && room.gameState?.letMeFinish) {
      const lmf = room.gameState.letMeFinish
      const isPresenter = lmf.presenterId === playerId
      payload.role = isPresenter ? 'presenter' : 'challenger'
      payload.questionText = lmf.questionText
      payload.step = lmf.step
      if (!isPresenter && lmf.step === 'pitch' && !lmf.objectionUsed?.[playerId]) {
        const line = pickChallengerLine()
        payload.challengerLine = line?.text
      }
      if (lmf.rebuttalPlayerId === playerId && lmf.step === 'rebuttal') {
        payload.canRebuttal = true
      }
    }

    if ((gameId === 'captionClash' && room.gameState?.captionClash) || (gameId === 'captionDuel' && room.gameState?.captionDuel)) {
      const cc = room.gameState[gameId]
      payload.step = cc.step
      payload.promptText = cc.promptText
      payload.submitted = !!cc.submissions?.[playerId]
      payload.voted = !!cc.votes?.[playerId]
      if (cc.step === 'vote') {
        payload.voteOptions = Object.entries(cc.submissions || {})
          .filter(([pid]) => pid !== playerId)
          .map(([pid, text]) => ({ playerId: pid, text }))
      }
    }

    if (gameId === 'bluffBox' && room.gameState?.bluffBox) {
      const bb = room.gameState.bluffBox
      payload.step = bb.step
      payload.promptText = bb.promptText
      payload.submitted = !!bb.bluffs?.[playerId]
      payload.guessed = !!bb.guesses?.[playerId]
      if (bb.step === 'guess') {
        // Strip isReal/authorId; flag the player's own bluff so the UI can disable it.
        payload.choices = (bb.choices || []).map((c) => ({
          id: c.id,
          text: c.text,
          mine: c.authorId === playerId,
        }))
      }
    }

    if ((gameId === 'triviaToss' && room.gameState?.triviaToss) || (gameId === 'triviaDuel' && room.gameState?.triviaDuel)) {
      const tt = room.gameState[gameId]
      payload.step = tt.step
      payload.questionText = tt.questionText
      payload.options = tt.options
      payload.answered = tt.answers?.[playerId] !== undefined
      if (tt.step === 'reveal') payload.correctIndex = tt.correctIndex
    }

    if ((gameId === 'reactionRush' && room.gameState?.reactionRush) || (gameId === 'reactionDuel' && room.gameState?.reactionDuel)) {
      const rr = room.gameState[gameId]
      payload.step = rr.step
      payload.tapped = !!rr.taps?.[playerId]
      payload.early = !!rr.earlyTappers?.[playerId]
    }

    if (gameId === 'categories' && room.gameState?.categories) {
      const cat = room.gameState.categories
      payload.step = cat.step
      payload.letter = cat.letter
      payload.categories = cat.categories
      payload.submitted = Array.isArray(cat.answers?.[playerId])
      payload.myAnswers = cat.answers?.[playerId] || null
    }

    if ((gameId === 'doodle' && room.gameState?.doodle) || (gameId === 'doodleDuel' && room.gameState?.doodleDuel)) {
      const dl = room.gameState[gameId]
      const sec = secrets[gameId] || {}
      const isDrawer = dl.drawerId === playerId
      payload.role = isDrawer ? 'drawer' : 'guesser'
      payload.step = dl.step
      if (isDrawer && dl.step !== 'reveal') {
        payload.privatePrompt = sec.promptText || null
      } else if (dl.step === 'reveal') {
        payload.privatePrompt = dl.promptText || sec.promptText
      }
    }

    if ((gameId === 'wouldYouRather' && room.gameState?.wouldYouRather) || (gameId === 'neverHaveIEver' && room.gameState?.neverHaveIEver)) {
      const v = room.gameState[gameId]
      payload.step = v.step
      payload.voted = v.votes?.[playerId] !== undefined
      payload.myChoice = v.votes?.[playerId] ?? null
      if (gameId === 'wouldYouRather') {
        payload.optionA = v.optionA
        payload.optionB = v.optionB
      } else {
        payload.statement = v.statement
      }
    }

    if (gameId === 'cardCrimes' && room.gameState?.cardCrimes) {
      const cc = room.gameState.cardCrimes
      const sec = secrets.cardCrimes || {}
      const isJudge = cc.judgeId === playerId
      payload.role = isJudge ? 'judge' : 'player'
      payload.step = cc.step
      payload.black = cc.black
      payload.submitted = !!cc.submissions?.[playerId]
      if (!isJudge) {
        payload.hand = sec.hands?.[playerId] || []
      }
    }

    if (gameId === 'wordBluff' && room.gameState?.wordBluff) {
      const wb = room.gameState.wordBluff
      payload.step = wb.step
      payload.promptText = wb.promptText
      payload.word = wb.word
      payload.submitted = !!wb.bluffs?.[playerId]
      payload.guessed = !!wb.guesses?.[playerId]
      if (wb.step === 'guess') {
        payload.choices = (wb.choices || []).map((c) => ({
          id: c.id,
          text: c.text,
          mine: c.authorId === playerId,
        }))
      }
    }

    return NextResponse.json(payload)
  } catch (err) {
    return NextResponse.json(
      { success: false, error: 'Server error', details: err.message },
      { status: 500 }
    )
  }
}
