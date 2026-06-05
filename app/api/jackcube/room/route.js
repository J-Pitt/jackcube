import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import {
  getRedis,
  codeKey,
  randomGameCode,
  getRoom,
  setRoom,
  pickColor,
  ROOM_TTL_SEC,
  MAX_PLAYERS,
} from '../../lib/redis'
import { publicRoom } from '../../lib/sanitizeRoom'
import { VALID_GAMES } from '../../lib/games/registry'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const roomId = searchParams.get('roomId')
    if (!roomId) {
      return NextResponse.json({ success: false, error: 'roomId required' }, { status: 400 })
    }
    const room = await getRoom(roomId)
    if (!room) {
      return NextResponse.json({ success: false, error: 'Room not found' }, { status: 404 })
    }
    return NextResponse.json({ success: true, ...publicRoom(room) })
  } catch (err) {
    return NextResponse.json(
      { success: false, error: 'Server error', details: err.message },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    const body = await request.json()

    if (body.roomId && body.hostId !== undefined) {
      const room = await getRoom(body.roomId)
      if (!room) {
        return NextResponse.json({ success: false, error: 'Room not found' }, { status: 404 })
      }
      if (room.hostId !== body.hostId) {
        return NextResponse.json({ success: false, error: 'Only host can sync game state' }, { status: 403 })
      }
      if (body.phase !== undefined) room.phase = body.phase
      if (body.gameState !== undefined) room.gameState = body.gameState
      if (body.players !== undefined) room.players = body.players
      room.updatedAt = new Date().toISOString()
      await setRoom(body.roomId, room)
      return NextResponse.json({
        success: true,
        roomId: body.roomId,
        phase: room.phase,
        ...publicRoom(room),
      })
    }

    if (body.roomId && body.state !== undefined) {
      const room = await getRoom(body.roomId)
      if (!room) {
        return NextResponse.json({ success: false, error: 'Room not found' }, { status: 404 })
      }
      room.gameState = body.state
      room.updatedAt = new Date().toISOString()
      await setRoom(body.roomId, room)
      return NextResponse.json({ success: true, roomId: body.roomId })
    }

    const hostName = body.hostName?.trim() || 'Host'
    const mode = body.mode === 'local' ? 'local' : 'online'
    const targetScore = [3000, 5000, 10000].includes(body.targetScore)
      ? body.targetScore
      : 5000
    const gameId = VALID_GAMES.includes(body.gameId) ? body.gameId : 'captionClash'

    const r = getRedis()
    if (!r) {
      return NextResponse.json({ success: false, error: 'Redis not configured' }, { status: 500 })
    }

    let code
    let exists = true
    for (let attempt = 0; attempt < 10 && exists; attempt++) {
      code = randomGameCode()
      exists = (await r.get(codeKey(code))) != null
    }
    if (exists) {
      return NextResponse.json({ success: false, error: 'Could not generate unique code' }, { status: 500 })
    }

    const roomId = randomUUID()
    const hostId = randomUUID()
    const hostPlayer = {
      id: hostId,
      name: hostName,
      color: pickColor(0),
      score: 0,
    }

    const room = {
      roomId,
      gameCode: code,
      mode,
      hostId,
      hostName,
      phase: 'lobby',
      players: [hostPlayer],
      config: { targetScore, gameId, spicyRemote: false },
      gameState: null,
      updatedAt: new Date().toISOString(),
    }

    await setRoom(roomId, room)
    await r.set(codeKey(code), roomId, { ex: ROOM_TTL_SEC })

    return NextResponse.json({
      success: true,
      ...publicRoom(room),
      myPlayerId: hostId,
    })
  } catch (err) {
    return NextResponse.json(
      { success: false, error: 'Server error', details: err.message },
      { status: 500 }
    )
  }
}
