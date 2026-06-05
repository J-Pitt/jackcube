'use client'

import { useCallback, useEffect, useState } from 'react'
import { getRoomMe, sendInput } from '@/lib/roomApi'

export default function BluffPlay({ room, roomId, playerId }) {
  const [me, setMe] = useState(null)
  const [text, setText] = useState('')
  const bb = room?.gameState?.bluffBox
  const phase = room?.phase

  const refreshMe = useCallback(() => {
    getRoomMe(roomId, playerId).then(setMe).catch(() => {})
  }, [roomId, playerId])

  useEffect(() => {
    refreshMe()
    const id = setInterval(refreshMe, 700)
    return () => clearInterval(id)
  }, [refreshMe, bb?.step])

  async function submitBluff() {
    if (!text.trim()) return
    await sendInput(roomId, playerId, 'bluffSubmit', { text: text.trim() })
    refreshMe()
  }

  async function guess(choiceId) {
    await sendInput(roomId, playerId, 'bluffGuess', { choiceId })
    refreshMe()
  }

  if (phase === 'countdown') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-cube-bg p-6 text-center">
        <p className="font-display text-4xl font-bold text-cube-violet">Bluff Box</p>
        <p className="mt-2 text-white/50">Get ready…</p>
      </main>
    )
  }

  if (!bb || phase !== 'playing') {
    return <main className="flex min-h-screen items-center justify-center bg-cube-bg p-6 text-white/50">Watch the TV…</main>
  }

  if (bb.step === 'write') {
    return (
      <main className="flex min-h-screen flex-col bg-cube-bg p-6">
        <p className="text-sm uppercase text-white/40">Your bluff</p>
        <p className="mt-4 text-xl font-bold text-white">{me?.promptText || bb.promptText}</p>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={80}
          disabled={me?.submitted}
          placeholder="Type a convincing fake answer…"
          className="mt-6 rounded-xl border border-white/15 bg-white/5 px-4 py-4 text-white placeholder:text-white/30 disabled:opacity-50"
        />
        <button
          type="button"
          disabled={me?.submitted || !text.trim()}
          onClick={submitBluff}
          className="mt-4 rounded-xl bg-cube-violet py-4 font-bold text-white disabled:opacity-40"
        >
          {me?.submitted ? 'Submitted ✓' : 'Submit bluff'}
        </button>
      </main>
    )
  }

  if (bb.step === 'guess') {
    return (
      <main className="flex min-h-screen flex-col bg-cube-bg p-6">
        <p className="text-sm uppercase text-white/40">Spot the truth</p>
        <p className="mt-2 text-lg text-white/70">{bb.promptText}</p>
        <div className="mt-6 space-y-3">
          {(me?.choices || []).map((c, i) => (
            <button
              key={c.id}
              type="button"
              disabled={me?.guessed}
              onClick={() => guess(c.id)}
              className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-4 text-left text-white hover:border-cube-violet/50 disabled:opacity-50"
            >
              <span className="text-xs text-white/30">{i + 1}.</span> {c.text}
            </button>
          ))}
        </div>
        {me?.guessed && <p className="mt-4 text-center text-cube-violet">Guess locked in ✓</p>}
      </main>
    )
  }

  return <main className="flex min-h-screen items-center justify-center bg-cube-bg p-6 text-white/50">Reveal on TV…</main>
}
