'use client'

import { useCallback, useEffect, useState } from 'react'
import { getRoomMe, sendInput } from '@/lib/roomApi'

const GESTURES = [
  { id: 'hand', label: '✋ Raise hand' },
  { id: 'stand', label: '🧍 Stand' },
  { id: 'nose', label: '👃 Nose' },
  { id: 'wave', label: '👋 Wave' },
]

export default function FakinPlay({ room, roomId, playerId, players }) {
  const [me, setMe] = useState(null)
  const fi = room?.gameState?.fakinIt
  const phase = room?.phase

  const refreshMe = useCallback(() => {
    if (!roomId || !playerId) return
    getRoomMe(roomId, playerId).then(setMe).catch(() => {})
  }, [roomId, playerId])

  useEffect(() => {
    refreshMe()
    const id = setInterval(refreshMe, 800)
    return () => clearInterval(id)
  }, [refreshMe, fi?.step])

  async function voteFor(accusedPlayerId) {
    await sendInput(roomId, playerId, 'fakinVote', { accusedPlayerId })
    refreshMe()
  }

  async function sendGesture(gesture) {
    await sendInput(roomId, playerId, 'fakinGesture', { gesture })
  }

  if (phase === 'countdown') {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-cube-bg p-6 text-center">
        <p className="text-sm uppercase tracking-widest text-cube-violet">Fakin&apos; It</p>
        <p className="mt-4 font-display text-4xl font-bold text-cube-cyan">Get ready!</p>
      </main>
    )
  }

  if (!fi || phase !== 'playing') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-cube-bg p-6 text-white/50">
        Watch the TV…
      </main>
    )
  }

  const isFaker = me?.role === 'faker'

  return (
    <main className="flex min-h-screen flex-col bg-cube-bg p-6">
      <p className="text-center text-xs uppercase tracking-widest text-cube-violet">
        {isFaker ? '🎭 You are the Faker' : 'Your secret prompt'}
      </p>

      {fi.step === 'prompt' || fi.step === 'action' ? (
        <div className="mt-8 flex flex-1 flex-col items-center justify-center text-center">
          <p className="text-2xl font-bold leading-relaxed text-white">
            {me?.privatePrompt || 'Loading…'}
          </p>
          {fi.remotePlay && fi.step === 'action' && (
            <div className="mt-8 grid w-full max-w-sm grid-cols-2 gap-3">
              {GESTURES.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => sendGesture(g.id)}
                  className="rounded-xl border border-white/15 bg-white/5 py-4 text-sm font-semibold hover:bg-white/10"
                >
                  {g.label}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : null}

      {fi.step === 'vote' && (
        <div className="mt-6">
          <p className="mb-4 text-center text-lg font-bold text-white">Who is faking?</p>
          <div className="space-y-2">
            {players.map((p) => (
              <button
                key={p.id}
                type="button"
                disabled={!!fi.votes?.[playerId]}
                onClick={() => voteFor(p.id)}
                className="w-full rounded-xl border border-white/15 py-4 font-semibold disabled:opacity-40"
                style={{ color: p.color, borderColor: `${p.color}44` }}
              >
                {p.name}
                {fi.votes?.[playerId] === p.id ? ' ✓' : ''}
              </button>
            ))}
          </div>
        </div>
      )}

      {fi.step === 'reveal' && (
        <div className="mt-8 text-center">
          <p className="text-white/50">Reveal on TV</p>
          {me?.privatePrompt && (
            <p className="mt-4 text-lg text-white">{me.privatePrompt}</p>
          )}
        </div>
      )}
    </main>
  )
}
