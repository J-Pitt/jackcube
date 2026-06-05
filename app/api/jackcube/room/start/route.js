import { NextResponse } from 'next/server'
import { getRoom, setRoom } from '../../../lib/redis'
import { validatePlayerCount } from '../../../lib/games/registry'
import { createGameState } from '../../../lib/gameInit'

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
    const gameId = room.config?.gameId || 'flappy'
    const validation = validatePlayerCount(gameId, players.length)
    if (!validation.ok) {
      return NextResponse.json({ success: false, error: validation.error }, { status: 400 })
    }

    room.phase = 'countdown'
    room.gameState = createGameState(gameId, players, room, 1)
    if (gameId !== 'flappy') {
      room.gameState.countdownStartedAt = new Date().toISOString()
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
