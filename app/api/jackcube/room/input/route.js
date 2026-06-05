import { NextResponse } from 'next/server'
import { getRoom, setRoom } from '../../../lib/redis'

export async function POST(request) {
  try {
    const { roomId, playerId, action } = await request.json()
    if (!roomId || !playerId || action !== 'flap') {
      return NextResponse.json(
        { success: false, error: 'roomId, playerId, and action flap required' },
        { status: 400 }
      )
    }

    const room = await getRoom(roomId)
    if (!room) {
      return NextResponse.json({ success: false, error: 'Room not found' }, { status: 404 })
    }

    if (room.phase !== 'playing') {
      return NextResponse.json({ success: false, error: 'Game not in progress' }, { status: 400 })
    }

    const gs = room.gameState || {}
    const flappy = gs.flappy || { flapQueue: [] }
    const queue = Array.isArray(flappy.flapQueue) ? [...flappy.flapQueue] : []

    const player = (room.players || []).find((p) => p.id === playerId)
    if (!player) {
      return NextResponse.json({ success: false, error: 'Player not in room' }, { status: 403 })
    }

    queue.push({ playerId, ts: Date.now() })
    flappy.flapQueue = queue.slice(-50)
    gs.flappy = flappy
    room.gameState = gs
    room.updatedAt = new Date().toISOString()
    await setRoom(roomId, room)

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json(
      { success: false, error: 'Server error', details: err.message },
      { status: 500 }
    )
  }
}
