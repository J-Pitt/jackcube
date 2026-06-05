import { NextResponse } from 'next/server'
import { getRoom, setRoom } from '../../../lib/redis'
import { pickChallengerLine } from '../../../lib/content'
import { endsIn, ROUND_MS } from '../../../lib/gameInit'

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

    const gameId = room.config?.gameId || 'flappy'
    const gs = room.gameState || {}

    if (action === 'flap') {
      if (gameId !== 'flappy') {
        return NextResponse.json({ success: false, error: 'Invalid action for game' }, { status: 400 })
      }
      const flappy = gs.flappy || { flapQueue: [] }
      const queue = Array.isArray(flappy.flapQueue) ? [...flappy.flapQueue] : []
      queue.push({ playerId, ts: Date.now() })
      flappy.flapQueue = queue.slice(-50)
      gs.flappy = flappy
      room.gameState = gs
      room.updatedAt = new Date().toISOString()
      await setRoom(roomId, room)
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
      room.updatedAt = new Date().toISOString()
      await setRoom(roomId, room)
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
      room.updatedAt = new Date().toISOString()
      await setRoom(roomId, room)
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
      room.updatedAt = new Date().toISOString()
      await setRoom(roomId, room)
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
      room.updatedAt = new Date().toISOString()
      await setRoom(roomId, room)
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
