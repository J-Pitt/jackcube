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
      return NextResponse.json({ success: false, error: 'Only host can advance' }, { status: 403 })
    }

    if (room.phase === 'victory') {
      return NextResponse.json({ success: true, phase: 'victory' })
    }

    if (room.phase !== 'leaderboard') {
      return NextResponse.json({ success: false, error: 'Can only advance from leaderboard' }, { status: 400 })
    }

    const nextRound = (room.gameState?.round || 1) + 1
    const flappy = createInitialFlappyState(room.players || [])

    room.phase = 'countdown'
    room.gameState = {
      round: nextRound,
      countdownStartedAt: new Date().toISOString(),
      flappy,
      roundResults: null,
      winnerId: null,
    }
    room.updatedAt = new Date().toISOString()
    await setRoom(roomId, room)

    return NextResponse.json({ success: true, phase: room.phase, gameState: room.gameState })
  } catch (err) {
    return NextResponse.json(
      { success: false, error: 'Server error', details: err.message },
      { status: 500 }
    )
  }
}
