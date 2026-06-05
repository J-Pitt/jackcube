import { NextResponse } from 'next/server'
import { getRoom, setRoom } from '../../../lib/redis'

const MAX_MESSAGES = 100
const MAX_TEXT = 200

export async function POST(request) {
  try {
    const { roomId, playerId, text, asGuess } = await request.json()
    if (!roomId || !playerId || !text?.trim()) {
      return NextResponse.json(
        { success: false, error: 'roomId, playerId, and text required' },
        { status: 400 }
      )
    }

    const room = await getRoom(roomId)
    if (!room) {
      return NextResponse.json({ success: false, error: 'Room not found' }, { status: 404 })
    }

    const player = (room.players || []).find((p) => p.id === playerId)
    if (!player) {
      return NextResponse.json({ success: false, error: 'Player not in room' }, { status: 403 })
    }
    if (player.disconnectedAt) {
      return NextResponse.json(
        { success: false, error: 'Reconnect with your name to chat' },
        { status: 403 }
      )
    }

    const message = {
      id: `${Date.now()}-${playerId.slice(0, 8)}`,
      playerId,
      playerName: player.name,
      color: player.color,
      text: String(text).trim().slice(0, MAX_TEXT),
      ts: new Date().toISOString(),
    }

    const chat = [...(room.chat || []), message].slice(-MAX_MESSAGES)
    room.chat = chat

    const gameId = room.config?.gameId
    const gs = room.gameState || {}
    if (
      asGuess &&
      gameId === 'dirtyDrawful' &&
      room.phase === 'playing' &&
      gs.dirtyDrawful?.step === 'guess' &&
      gs.dirtyDrawful.drawerId !== playerId
    ) {
      const dd = { ...gs.dirtyDrawful }
      dd.guesses = { ...dd.guesses, [playerId]: message.text }
      gs.dirtyDrawful = dd
      room.gameState = gs
    }

    room.updatedAt = new Date().toISOString()
    await setRoom(roomId, room)

    return NextResponse.json({ success: true, message, chat })
  } catch (err) {
    return NextResponse.json(
      { success: false, error: 'Server error', details: err.message },
      { status: 500 }
    )
  }
}
