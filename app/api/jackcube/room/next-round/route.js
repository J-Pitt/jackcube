import { NextResponse } from 'next/server'
import { getRoom, setRoom } from '../../../lib/redis'
import { createGameState } from '../../../lib/gameInit'
import { getMaxRounds } from '../../../lib/games/registry'
import { activePlayers } from '../../../lib/playerPresence'

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

    const gameId = room.config?.gameId || 'captionClash'
    const nextRound = (room.gameState?.round || 1) + 1
    const maxRounds = getMaxRounds(gameId)
    if (nextRound > maxRounds) {
      const sorted = [...(room.players || [])].sort(
        (a, b) => (Number(b.score) || 0) - (Number(a.score) || 0)
      )
      room.phase = 'victory'
      room.gameState = {
        ...room.gameState,
        winnerId: sorted[0]?.id || null,
        roundResults: room.gameState?.roundResults,
      }
      room.updatedAt = new Date().toISOString()
      await setRoom(roomId, room)
      return NextResponse.json({ success: true, phase: room.phase, gameState: room.gameState })
    }

    room.phase = 'countdown'
    room.gameState = createGameState(gameId, activePlayers(room.players || []), room, nextRound)
    room.gameState.countdownStartedAt = new Date().toISOString()
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
