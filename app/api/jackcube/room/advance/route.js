import { NextResponse } from 'next/server'
import { getRoom, setRoom } from '../../../lib/redis'
import { applyStepAdvance } from '../../../lib/stepAdvance'

export async function POST(request) {
  try {
    const { roomId, hostId, forceStep } = await request.json()
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

    if (room.phase !== 'playing' && room.phase !== 'countdown') {
      return NextResponse.json({ success: false, error: 'Invalid phase' }, { status: 400 })
    }

    const { roundEnded } = applyStepAdvance(room, { forceStep })
    await setRoom(roomId, room)

    return NextResponse.json({
      success: true,
      phase: room.phase,
      gameState: room.gameState,
      roundResults: roundEnded ? room.gameState?.roundResults : undefined,
    })
  } catch (err) {
    return NextResponse.json(
      { success: false, error: 'Server error', details: err.message },
      { status: 500 }
    )
  }
}
