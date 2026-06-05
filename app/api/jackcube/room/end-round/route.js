import { NextResponse } from 'next/server'
import { getRoom, setRoom } from '../../../lib/redis'
import { scoreRound, checkVictory } from '../../../lib/scoring'

export async function POST(request) {
  try {
    const { roomId, hostId, roundScores } = await request.json()
    if (!roomId || !hostId || !roundScores) {
      return NextResponse.json(
        { success: false, error: 'roomId, hostId, and roundScores required' },
        { status: 400 }
      )
    }

    const room = await getRoom(roomId)
    if (!room) {
      return NextResponse.json({ success: false, error: 'Room not found' }, { status: 404 })
    }

    if (room.hostId !== hostId) {
      return NextResponse.json({ success: false, error: 'Only host can end round' }, { status: 403 })
    }

    if (room.phase !== 'playing') {
      return NextResponse.json({ success: false, error: 'Not in playing phase' }, { status: 400 })
    }

    const { results, updatedPlayers } = scoreRound(room.players || [], roundScores)
    room.players = updatedPlayers

    const winner = checkVictory(updatedPlayers, room.config?.targetScore ?? 5000)
    room.phase = winner ? 'victory' : 'leaderboard'
    room.gameState = {
      ...room.gameState,
      roundResults: results,
      winnerId: winner?.id || null,
    }
    room.updatedAt = new Date().toISOString()
    await setRoom(roomId, room)

    return NextResponse.json({
      success: true,
      phase: room.phase,
      results,
      players: updatedPlayers,
      winnerId: winner?.id || null,
    })
  } catch (err) {
    return NextResponse.json(
      { success: false, error: 'Server error', details: err.message },
      { status: 500 }
    )
  }
}
