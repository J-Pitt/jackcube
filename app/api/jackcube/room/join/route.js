import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import {
  getRedis,
  codeKey,
  getRoom,
  setRoom,
  pickColor,
  MAX_PLAYERS,
} from '../../../lib/redis'

export async function POST(request) {
  try {
    const { gameCode, playerName } = await request.json()
    if (!gameCode || !playerName?.trim()) {
      return NextResponse.json(
        { success: false, error: 'gameCode and playerName required' },
        { status: 400 }
      )
    }

    const code = String(gameCode).trim().toUpperCase()
    const r = getRedis()
    if (!r) {
      return NextResponse.json({ success: false, error: 'Redis not configured' }, { status: 500 })
    }

    const roomId = await r.get(codeKey(code))
    if (!roomId) {
      return NextResponse.json({ success: false, error: 'Game code not found' }, { status: 404 })
    }

    const room = await getRoom(roomId)
    if (!room) {
      return NextResponse.json({ success: false, error: 'Room not found' }, { status: 404 })
    }

    if (room.phase !== 'lobby') {
      return NextResponse.json(
        { success: false, error: 'Game already started — room is locked' },
        { status: 403 }
      )
    }

    const players = Array.isArray(room.players) ? [...room.players] : []
    const name = String(playerName).trim()

    const existing = players.find((p) => p.name === name)
    if (existing) {
      return NextResponse.json({
        success: true,
        roomId: room.roomId,
        gameCode: room.gameCode,
        mode: room.mode,
        hostId: room.hostId,
        phase: room.phase,
        players,
        config: room.config,
        myPlayerId: existing.id,
      })
    }

    if (players.length >= MAX_PLAYERS) {
      return NextResponse.json({ success: false, error: 'Room is full' }, { status: 403 })
    }

    const newPlayer = {
      id: randomUUID(),
      name,
      color: pickColor(players.length),
      score: 0,
    }
    players.push(newPlayer)
    room.players = players
    room.updatedAt = new Date().toISOString()
    await setRoom(roomId, room)

    return NextResponse.json({
      success: true,
      roomId: room.roomId,
      gameCode: room.gameCode,
      mode: room.mode,
      hostId: room.hostId,
      phase: room.phase,
      players,
      config: room.config,
      myPlayerId: newPlayer.id,
    })
  } catch (err) {
    return NextResponse.json(
      { success: false, error: 'Server error', details: err.message },
      { status: 500 }
    )
  }
}
