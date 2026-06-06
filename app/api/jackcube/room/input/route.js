import { NextResponse } from 'next/server'
import { getRoom } from '../../../lib/redis'
import { pickChallengerLine } from '../../../lib/content'
import { endsIn, ROUND_MS } from '../../../lib/gameInit'
import { persistInputAndMaybeAdvance } from '../../../lib/persistInput'

const MAX_STROKES = 120

export async function POST(request) {
  try {
    const { roomId, playerId, action, payload } = await request.json()
    if (!roomId || !playerId || !action) {
      return NextResponse.json(
        { success: false, error: 'roomId, playerId, and action required' },
        { status: 400 }
      )
    }

    const room = await getRoom(roomId)
    if (!room) {
      return NextResponse.json({ success: false, error: 'Room not found' }, { status: 404 })
    }

    if (room.phase !== 'playing' && room.phase !== 'countdown') {
      return NextResponse.json({ success: false, error: 'Game not in progress' }, { status: 400 })
    }

    const player = (room.players || []).find((p) => p.id === playerId)
    if (!player) {
      return NextResponse.json({ success: false, error: 'Player not in room' }, { status: 403 })
    }
    if (player.disconnectedAt) {
      return NextResponse.json(
        { success: false, error: 'Reconnect with your name to continue playing' },
        { status: 403 }
      )
    }

    const gameId = room.config?.gameId || 'captionClash'
    const gs = room.gameState || {}

    if (gameId === 'captionClash' && gs.captionClash) {
      const cc = { ...gs.captionClash }
      if (action === 'captionSubmit' && cc.step === 'write') {
        const text = String(payload?.text || '').trim().slice(0, 120)
        if (text) cc.submissions = { ...cc.submissions, [playerId]: text }
      } else if (action === 'captionVote' && cc.step === 'vote') {
        const votedForId = payload?.votedForId
        if (
          votedForId &&
          votedForId !== playerId &&
          (room.players || []).some((p) => p.id === votedForId) &&
          cc.submissions?.[votedForId]
        ) {
          cc.votes = { ...cc.votes, [playerId]: votedForId }
        }
      } else {
        return NextResponse.json({ success: false, error: 'Invalid captionClash action' }, { status: 400 })
      }
      gs.captionClash = cc
      room.gameState = gs
      await persistInputAndMaybeAdvance(roomId, room)
      return NextResponse.json({ success: true })
    }

    if (gameId === 'bluffBox' && gs.bluffBox) {
      const bb = { ...gs.bluffBox }
      if (action === 'bluffSubmit' && bb.step === 'write') {
        const text = String(payload?.text || '').trim().slice(0, 80)
        if (text) bb.bluffs = { ...bb.bluffs, [playerId]: text }
      } else if (action === 'bluffGuess' && bb.step === 'guess') {
        const choiceId = payload?.choiceId
        const choice = (bb.choices || []).find((c) => c.id === choiceId)
        if (choice && choice.authorId !== playerId) {
          bb.guesses = { ...bb.guesses, [playerId]: choiceId }
        }
      } else {
        return NextResponse.json({ success: false, error: 'Invalid bluffBox action' }, { status: 400 })
      }
      gs.bluffBox = bb
      room.gameState = gs
      await persistInputAndMaybeAdvance(roomId, room)
      return NextResponse.json({ success: true })
    }

    if (gameId === 'triviaToss' && gs.triviaToss) {
      const tt = { ...gs.triviaToss }
      if (action === 'triviaAnswer' && tt.step === 'question') {
        const index = payload?.index
        if (Number.isInteger(index) && index >= 0 && index < (tt.options || []).length) {
          tt.answers = { ...tt.answers, [playerId]: index }
        }
      } else {
        return NextResponse.json({ success: false, error: 'Invalid triviaToss action' }, { status: 400 })
      }
      gs.triviaToss = tt
      room.gameState = gs
      await persistInputAndMaybeAdvance(roomId, room)
      return NextResponse.json({ success: true })
    }

    if (gameId === 'reactionRush' && gs.reactionRush) {
      const rr = { ...gs.reactionRush }
      if (action === 'reactionTap') {
        if (rr.step === 'ready') {
          rr.earlyTappers = { ...rr.earlyTappers, [playerId]: true }
        } else if (rr.step === 'go' && !rr.earlyTappers?.[playerId] && !rr.taps?.[playerId]) {
          rr.taps = { ...rr.taps, [playerId]: Date.now() }
        }
      } else {
        return NextResponse.json({ success: false, error: 'Invalid reactionRush action' }, { status: 400 })
      }
      gs.reactionRush = rr
      room.gameState = gs
      await persistInputAndMaybeAdvance(roomId, room)
      return NextResponse.json({ success: true })
    }

    if (gameId === 'categories' && gs.categories) {
      const cat = { ...gs.categories }
      if (action === 'categoryAnswer' && cat.step === 'write') {
        const arr = Array.isArray(payload?.answers) ? payload.answers : []
        const cleaned = (cat.categories || []).map((_, i) =>
          String(arr[i] || '').trim().slice(0, 40)
        )
        cat.answers = { ...cat.answers, [playerId]: cleaned }
      } else {
        return NextResponse.json({ success: false, error: 'Invalid categories action' }, { status: 400 })
      }
      gs.categories = cat
      room.gameState = gs
      await persistInputAndMaybeAdvance(roomId, room)
      return NextResponse.json({ success: true })
    }

    if (gameId === 'doodle' && gs.doodle) {
      const dl = { ...gs.doodle }
      const isDrawer = dl.drawerId === playerId

      if (action === 'drawStroke' && isDrawer && dl.step === 'draw' && payload?.stroke) {
        dl.strokes = [...(dl.strokes || []), payload.stroke].slice(-MAX_STROKES)
      } else if (action === 'drawUndo' && isDrawer && dl.step === 'draw') {
        const strokes = [...(dl.strokes || [])]
        strokes.pop()
        dl.strokes = strokes
      } else if (action === 'drawClear' && isDrawer && dl.step === 'draw') {
        dl.strokes = []
      } else if (action === 'drawGuess' && !isDrawer && dl.step === 'guess') {
        const text = String(payload?.text || '').slice(0, 80)
        dl.guesses = { ...dl.guesses, [playerId]: text }
      } else {
        return NextResponse.json({ success: false, error: 'Invalid doodle action' }, { status: 400 })
      }
      gs.doodle = dl
      room.gameState = gs
      await persistInputAndMaybeAdvance(roomId, room)
      return NextResponse.json({ success: true })
    }

    if (gameId === 'wordBluff' && gs.wordBluff) {
      const wb = { ...gs.wordBluff }
      if (action === 'bluffSubmit' && wb.step === 'write') {
        const text = String(payload?.text || '').trim().slice(0, 120)
        if (text) wb.bluffs = { ...wb.bluffs, [playerId]: text }
      } else if (action === 'bluffGuess' && wb.step === 'guess') {
        const choiceId = payload?.choiceId
        const choice = (wb.choices || []).find((c) => c.id === choiceId)
        if (choice && choice.authorId !== playerId) {
          wb.guesses = { ...wb.guesses, [playerId]: choiceId }
        }
      } else {
        return NextResponse.json({ success: false, error: 'Invalid wordBluff action' }, { status: 400 })
      }
      gs.wordBluff = wb
      room.gameState = gs
      await persistInputAndMaybeAdvance(roomId, room)
      return NextResponse.json({ success: true })
    }

    if ((gameId === 'wouldYouRather' && gs.wouldYouRather) || (gameId === 'neverHaveIEver' && gs.neverHaveIEver)) {
      const slot = gameId
      const v = { ...gs[slot] }
      const allowed = slot === 'wouldYouRather' ? ['a', 'b'] : ['have', 'never']
      if (action === 'choiceVote' && v.step === 'vote' && allowed.includes(payload?.choice)) {
        v.votes = { ...v.votes, [playerId]: payload.choice }
      } else {
        return NextResponse.json({ success: false, error: 'Invalid vote action' }, { status: 400 })
      }
      gs[slot] = v
      room.gameState = gs
      await persistInputAndMaybeAdvance(roomId, room)
      return NextResponse.json({ success: true })
    }

    if (gameId === 'cardCrimes' && gs.cardCrimes) {
      const cc = { ...gs.cardCrimes }
      const isJudge = cc.judgeId === playerId
      if (action === 'cardSubmit' && !isJudge && cc.step === 'submit') {
        const hand = gs.secrets?.cardCrimes?.hands?.[playerId] || []
        const ids = Array.isArray(payload?.cardIds) ? payload.cardIds.slice(0, cc.black?.pick || 1) : []
        const texts = ids
          .map((id) => hand.find((c) => c.id === id)?.text)
          .filter(Boolean)
        if (texts.length === (cc.black?.pick || 1)) {
          cc.submissions = { ...cc.submissions, [playerId]: texts }
        } else {
          return NextResponse.json({ success: false, error: 'Pick the right number of cards' }, { status: 400 })
        }
      } else if (action === 'cardJudge' && isJudge && cc.step === 'judge') {
        const sid = payload?.sid
        if ((cc.board || []).some((b) => b.sid === sid)) {
          cc.pickedSid = sid
        } else {
          return NextResponse.json({ success: false, error: 'Invalid pick' }, { status: 400 })
        }
      } else {
        return NextResponse.json({ success: false, error: 'Invalid cardCrimes action' }, { status: 400 })
      }
      gs.cardCrimes = cc
      room.gameState = gs
      await persistInputAndMaybeAdvance(roomId, room)
      return NextResponse.json({ success: true })
    }

    if (gameId === 'fakinIt' && gs.fakinIt) {
      const fi = { ...gs.fakinIt }
      if (action === 'fakinReady') {
        fi.actionAcks = { ...fi.actionAcks, [playerId]: true }
      } else if (action === 'fakinGesture' && fi.step === 'action') {
        fi.gestures = { ...fi.gestures, [playerId]: payload?.gesture || 'tap' }
        fi.actionAcks = { ...fi.actionAcks, [playerId]: true }
      } else if (action === 'fakinVote' && fi.step === 'vote') {
        const accused = payload?.accusedPlayerId
        if (accused && (room.players || []).some((p) => p.id === accused)) {
          fi.votes = { ...fi.votes, [playerId]: accused }
        }
      } else {
        return NextResponse.json({ success: false, error: 'Invalid fakinIt action' }, { status: 400 })
      }
      gs.fakinIt = fi
      room.gameState = gs
      await persistInputAndMaybeAdvance(roomId, room)
      return NextResponse.json({ success: true })
    }

    if (gameId === 'dirtyDrawful' && gs.dirtyDrawful) {
      const dd = { ...gs.dirtyDrawful }
      const isDrawer = dd.drawerId === playerId

      if (action === 'drawStroke' && isDrawer && dd.step === 'draw' && payload?.stroke) {
        const strokes = [...(dd.strokes || []), payload.stroke].slice(-MAX_STROKES)
        dd.strokes = strokes
      } else if (action === 'drawUndo' && isDrawer && dd.step === 'draw') {
        const strokes = [...(dd.strokes || [])]
        strokes.pop()
        dd.strokes = strokes
      } else if (action === 'drawClear' && isDrawer && dd.step === 'draw') {
        dd.strokes = []
      } else if (action === 'drawGuess' && !isDrawer && dd.step === 'guess') {
        const text = String(payload?.text || '').slice(0, 80)
        dd.guesses = { ...dd.guesses, [playerId]: text }
      } else {
        return NextResponse.json({ success: false, error: 'Invalid drawful action' }, { status: 400 })
      }
      gs.dirtyDrawful = dd
      room.gameState = gs
      await persistInputAndMaybeAdvance(roomId, room)
      return NextResponse.json({ success: true })
    }

    if (gameId === 'truthOrCube' && gs.truthOrCube) {
      const toc = { ...gs.truthOrCube }
      const isTarget = toc.targetPlayerId === playerId

      if (action === 'truthOrDone' && isTarget && toc.step === 'active') {
        toc.outcome = 'done'
      } else if (action === 'truthOrChicken' && isTarget && toc.step === 'active') {
        toc.outcome = 'chicken'
      } else {
        return NextResponse.json({ success: false, error: 'Invalid truthOrCube action' }, { status: 400 })
      }
      gs.truthOrCube = toc
      room.gameState = gs
      await persistInputAndMaybeAdvance(roomId, room)
      return NextResponse.json({ success: true })
    }

    if (gameId === 'letMeFinish' && gs.letMeFinish) {
      const lmf = { ...gs.letMeFinish }
      const isPresenter = lmf.presenterId === playerId

      if (action === 'finishPitchStart' && isPresenter && lmf.step === 'question') {
        lmf.pitchStarted = true
        lmf.step = 'pitch'
        lmf.endsAt = endsIn(ROUND_MS.letMeFinish.pitch)
      } else if (action === 'finishPitchEnd' && isPresenter && lmf.step === 'pitch') {
        lmf.step = 'rebuttal'
        lmf.endsAt = endsIn(ROUND_MS.letMeFinish.rebuttal)
      } else if (action === 'finishObjection' && !isPresenter && lmf.step === 'pitch') {
        if (lmf.objectionUsed?.[playerId]) {
          return NextResponse.json({ success: false, error: 'Already objected' }, { status: 400 })
        }
        const line = pickChallengerLine()
        const objections = [...(lmf.objections || []), {
          playerId,
          text: payload?.text || line?.text || 'Objection!',
          type: payload?.type || 'objection',
          ts: Date.now(),
        }].slice(-12)
        lmf.objections = objections
        lmf.objectionUsed = { ...lmf.objectionUsed, [playerId]: true }
      } else if (action === 'finishRebuttal' && lmf.rebuttalPlayerId === playerId && lmf.step === 'rebuttal') {
        lmf.rebuttalText = String(payload?.text || '').slice(0, 200)
      } else if (action === 'finishVote' && lmf.step === 'vote') {
        const votedForId = payload?.votedForId
        if (votedForId && (room.players || []).some((p) => p.id === votedForId)) {
          lmf.votes = { ...lmf.votes, [playerId]: votedForId }
        }
      } else {
        return NextResponse.json({ success: false, error: 'Invalid letMeFinish action' }, { status: 400 })
      }
      gs.letMeFinish = lmf
      room.gameState = gs
      await persistInputAndMaybeAdvance(roomId, room)
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 })
  } catch (err) {
    return NextResponse.json(
      { success: false, error: 'Server error', details: err.message },
      { status: 500 }
    )
  }
}
