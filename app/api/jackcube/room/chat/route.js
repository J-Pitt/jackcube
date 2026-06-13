import { NextResponse } from 'next/server'
import { getRoom, setRoom } from '../../../lib/redis'

const MAX_MESSAGES = 100
const MAX_TEXT = 200
// Inline photos/videos travel through the existing chat state (no separate
// store), so keep them small. Client compresses before sending; hard ceilings.
const MAX_IMAGE_CHARS = 400_000
const MAX_VIDEO_CHARS = 2_000_000

export async function POST(request) {
  try {
    const { roomId, playerId, text, asGuess, image, video } = await request.json()
    const hasText = !!text?.trim()
    const isImage = typeof image === 'string' && image.startsWith('data:image/')
    const isVideo = typeof video === 'string' && video.startsWith('data:video/')
    if (!roomId || !playerId || (!hasText && !isImage && !isVideo)) {
      return NextResponse.json(
        { success: false, error: 'roomId, playerId, and text, image, or video required' },
        { status: 400 }
      )
    }
    if (isImage && image.length > MAX_IMAGE_CHARS) {
      return NextResponse.json(
        { success: false, error: 'Photo too large' },
        { status: 413 }
      )
    }
    if (isVideo && video.length > MAX_VIDEO_CHARS) {
      return NextResponse.json(
        { success: false, error: 'Video too large — keep it short' },
        { status: 413 }
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
      text: hasText ? String(text).trim().slice(0, MAX_TEXT) : '',
      ts: new Date().toISOString(),
      ...(isVideo ? { type: 'video', video } : isImage ? { type: 'image', image } : {}),
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
