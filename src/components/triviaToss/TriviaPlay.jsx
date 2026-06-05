'use client'

import { useCallback, useEffect, useState } from 'react'
import { getRoomMe, sendInput } from '@/lib/roomApi'

const LABELS = ['A', 'B', 'C', 'D']

export default function TriviaPlay({ room, roomId, playerId }) {
  const [me, setMe] = useState(null)
  const tt = room?.gameState?.triviaToss
  const phase = room?.phase

  const refreshMe = useCallback(() => {
    getRoomMe(roomId, playerId).then(setMe).catch(() => {})
  }, [roomId, playerId])

  useEffect(() => {
    refreshMe()
    const id = setInterval(refreshMe, 700)
    return () => clearInterval(id)
  }, [refreshMe, tt?.step])

  async function pick(index) {
    await sendInput(roomId, playerId, 'triviaAnswer', { index })
    refreshMe()
  }

  if (phase === 'countdown') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-cube-bg p-6 text-center">
        <p className="font-display text-4xl font-bold text-cube-cyan">Trivia Toss</p>
        <p className="mt-2 text-white/50">Get ready…</p>
      </main>
    )
  }

  if (!tt || phase !== 'playing') {
    return <main className="flex min-h-screen items-center justify-center bg-cube-bg p-6 text-white/50">Watch the TV…</main>
  }

  if (tt.step === 'question') {
    const options = me?.options || tt.options || []
    return (
      <main className="flex min-h-screen flex-col bg-cube-bg p-6">
        <p className="text-sm uppercase text-white/40">Pick an answer</p>
        <p className="mt-4 text-xl font-bold text-white">{me?.questionText || tt.questionText}</p>
        <div className="mt-6 space-y-3">
          {options.map((opt, i) => (
            <button
              key={opt}
              type="button"
              disabled={me?.answered}
              onClick={() => pick(i)}
              className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-4 text-left text-white hover:border-cube-cyan/50 disabled:opacity-50"
            >
              <span className="font-bold text-cube-cyan">{LABELS[i]}.</span> {opt}
            </button>
          ))}
        </div>
        {me?.answered && <p className="mt-4 text-center text-cube-cyan">Locked in ✓</p>}
      </main>
    )
  }

  if (tt.step === 'reveal') {
    const correct = me?.correctIndex ?? tt.correctIndex
    const myPick = tt.answers?.[playerId]
    const won = myPick === correct
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-cube-bg p-6 text-center">
        <p className="text-5xl">{won ? '🎉' : '😅'}</p>
        <p className="mt-4 text-2xl font-bold text-white">{won ? 'Correct!' : 'Not quite'}</p>
        <p className="mt-2 text-white/50">
          Answer: <strong className="text-cube-cyan">{LABELS[correct]}. {(tt.options || [])[correct]}</strong>
        </p>
      </main>
    )
  }

  return null
}
