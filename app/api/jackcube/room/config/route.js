import { NextResponse } from 'next/server'
import { getRoom, setRoom } from '../../../lib/redis'
import { VALID_GAMES } from '../../../lib/games/registry'

export async function POST(request) {
  try {
    const { roomId, hostId, gameId, spicyRemote, targetScore } = await request.json()
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
      return NextResponse.json({ success: false, error: 'Only host can update config' }, { status: 403 })
    }

    if (room.phase !== 'lobby') {
      return NextResponse.json({ success: false, error: 'Can only change config in lobby' }, { status: 400 })
    }

    const config = { ...(room.config || {}) }
    if (gameId !== undefined) {
      if (!VALID_GAMES.includes(gameId)) {
        return NextResponse.json({ success: false, error: 'Invalid gameId' }, { status: 400 })
      }
      config.gameId = gameId
    }
    if (spicyRemote !== undefined) config.spicyRemote = !!spicyRemote
    if ([3000, 5000, 10000].includes(targetScore)) config.targetScore = targetScore

    room.config = config
    room.updatedAt = new Date().toISOString()
    await setRoom(roomId, room)

    return NextResponse.json({ success: true, config })
  } catch (err) {
    return NextResponse.json(
      { success: false, error: 'Server error', details: err.message },
      { status: 500 }
    )
  }
}
