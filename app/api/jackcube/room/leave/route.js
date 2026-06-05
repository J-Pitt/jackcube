import { NextResponse } from 'next/server'
import { getRoom, setRoom } from '../../../lib/redis'
import { markDisconnected, sanitizeGameOnDisconnect } from '../../../lib/playerPresence'

export async function POST(request) {
  try {
    const { roomId, playerId } = await request.json()
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

    const players = Array.isArray(room.players) ? [...room.players] : []
    const idx = players.findIndex((p) => p.id === playerId)
    if (idx === -1) {
      return NextResponse.json({ success: true, left: false, players })
    }

    room.players = markDisconnected(players, playerId)
    room.gameState = sanitizeGameOnDisconnect(room, playerId)
    room.updatedAt = new Date().toISOString()
    await setRoom(roomId, room)

    return NextResponse.json({ success: true, left: true, players: room.players })
  } catch (err) {
    return NextResponse.json(
      { success: false, error: 'Server error', details: err.message },
      { status: 500 }
    )
  }
}
