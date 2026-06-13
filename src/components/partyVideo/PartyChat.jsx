'use client'

import { useEffect, useRef, useState } from 'react'
import { sendChat } from '@/lib/roomApi'
import { loadRejoin } from '@/lib/rejoin'
import { usePartyVideo } from '@/contexts/PartyVideoContext'
import CameraCapture from './CameraCapture'

export default function PartyChat({
  room,
  roomId,
  playerId: playerIdProp,
  compact = false,
  className = '',
}) {
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)
  const [cameraOpen, setCameraOpen] = useState(false)
  const bottomRef = useRef(null)
  const { localStream, roomCameraStream, isDisplayMode } = usePartyVideo()
  // Reuse whichever camera is already live so we don't open a second one.
  const liveCameraStream = isDisplayMode ? roomCameraStream : localStream
  const session = loadRejoin()
  const playerId = playerIdProp || session?.playerId
  const messages = room?.chat || []
  const gameId = room?.config?.gameId
  const dd = room?.gameState?.dirtyDrawful
  const isGuessPhase =
    gameId === 'dirtyDrawful' && dd?.step === 'guess' && dd?.drawerId !== playerId

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!roomId || !playerId || !text.trim() || sending) return
    setSending(true)
    setError(null)
    try {
      await sendChat(roomId, playerId, text.trim(), {
        asGuess: isGuessPhase,
      })
      setText('')
    } catch (err) {
      setError(err.message || 'Could not send')
    } finally {
      setSending(false)
    }
  }

  async function handleSendMedia(dataUrl, kind) {
    if (!roomId || !playerId) return
    setError(null)
    try {
      await sendChat(roomId, playerId, '', kind === 'video' ? { video: dataUrl } : { image: dataUrl })
      setCameraOpen(false)
    } catch (err) {
      setError(err.message || 'Could not send')
      setCameraOpen(false)
    }
  }

  const height = compact ? 'max-h-36' : 'max-h-48'

  return (
    <div
      className={`flex flex-col rounded-2xl border border-white/10 bg-cube-surface/95 p-3 shadow-xl backdrop-blur ${className}`}
    >
      <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-white/50">
        Party chat
      </p>
      <div className={`${height} space-y-1.5 overflow-y-auto pr-1`}>
        {messages.length === 0 ? (
          <p className="py-4 text-center text-xs text-white/35">
            No messages yet — say hi or type an answer!
          </p>
        ) : (
          messages.map((m) => (
            <div key={m.id} className="text-sm leading-snug text-white/85">
              <span className="font-semibold" style={{ color: m.color || '#6C5CE7' }}>
                {m.playerName}:
              </span>{' '}
              {m.type === 'image' && m.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={m.image}
                  alt={`${m.playerName}'s photo`}
                  className="mt-1 max-h-48 w-auto rounded-lg border border-white/10"
                />
              ) : m.type === 'video' && m.video ? (
                <video
                  src={m.video}
                  controls
                  playsInline
                  className="mt-1 max-h-48 w-auto rounded-lg border border-white/10"
                />
              ) : (
                m.text
              )}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
      {playerId ? (
        <form onSubmit={handleSubmit} className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={() => setCameraOpen(true)}
            aria-label="Take a photo"
            title="Take a photo"
            className="shrink-0 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-base text-white/80 hover:bg-white/10"
          >
            📷
          </button>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={200}
            placeholder={
              isGuessPhase ? 'Type your guess…' : 'Type a message or answer…'
            }
            className="min-w-0 flex-1 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30"
          />
          <button
            type="submit"
            disabled={sending || !text.trim()}
            className="shrink-0 rounded-xl bg-cube-violet px-3 py-2 text-sm font-semibold text-white disabled:opacity-40"
          >
            Send
          </button>
        </form>
      ) : (
        <p className="mt-2 text-xs text-white/40">Join on your phone to chat</p>
      )}

      {cameraOpen && (
        <CameraCapture
          onCapture={handleSendMedia}
          onClose={() => setCameraOpen(false)}
          existingStream={liveCameraStream}
        />
      )}
      {error && (
        <p className="mt-1 text-xs text-cube-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
