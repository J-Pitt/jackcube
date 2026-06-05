import { NextResponse } from 'next/server'
import { getRoom, setRoom } from '../../../lib/redis'
import { createInitialFlappyState } from '../../../lib/flappyInit'

export async function POST(request) {
  try {
    const { roomId, hostId } = await request.json()
    if (!roomId || !hostId) {
      return NextResponse.json(
        { success: false, error: 'roomId and hostId required' },
        { status: 400 }
      )
    }

    const room = await getRoom(roomId)
    if (!room) {
      return NextResponse.json({ success: false, error: 'Room not found' }, { status: 404 })
    }

    if (room.hostId !== hostId) {
      return NextResponse.json({ success: false, error: 'Only the host can start the game' }, { status: 403 })
    }

    if (room.phase !== 'lobby') {
      return NextResponse.json({ success: false, error: 'Game already started' }, { status: 400 })
    }

    const players = room.players || []
    if (players.length < 2) {
      return NextResponse.json(
        { success: false, error: 'Need at least 2 players to start' },
        { status: 400 }
      )
    }

    const flappy = createInitialFlappyState(players)

    room.phase = 'countdown'
    room.gameState = {
      round: 1,
      countdownStartedAt: new Date().toISOString(),
      flappy,
      roundResults: null,
      winnerId: null,
    }
    room.updatedAt = new Date().toISOString()
    await setRoom(roomId, room)

    return NextResponse.json({
      success: true,
      phase: room.phase,
      gameState: room.gameState,
    })
  } catch (err) {
    return NextResponse.json(
      { success: false, error: 'Server error', details: err.message },
      { status: 500 }
    )
  }
}
