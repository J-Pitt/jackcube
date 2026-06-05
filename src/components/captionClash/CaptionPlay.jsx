'use client'

import { useCallback, useEffect, useState } from 'react'
import { getRoomMe, sendInput } from '@/lib/roomApi'

export default function CaptionPlay({ room, roomId, playerId }) {
  const [me, setMe] = useState(null)
  const [text, setText] = useState('')
  const cc = room?.gameState?.captionClash
  const phase = room?.phase
  const players = room?.players || []

  const refreshMe = useCallback(() => {
    getRoomMe(roomId, playerId).then(setMe).catch(() => {})
  }, [roomId, playerId])

  useEffect(() => {
    refreshMe()
    const id = setInterval(refreshMe, 700)
    return () => clearInterval(id)
  }, [refreshMe, cc?.step])

  async function submitCaption() {
    if (!text.trim()) return
    await sendInput(roomId, playerId, 'captionSubmit', { text: text.trim() })
    refreshMe()
  }

  async function voteFor(pid) {
    await sendInput(roomId, playerId, 'captionVote', { votedForId: pid })
    refreshMe()
  }

  if (phase === 'countdown') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-cube-bg p-6 text-center">
        <p className="font-display text-4xl font-bold text-cube-cyan">Caption Clash</p>
        <p className="mt-2 text-white/50">Get ready…</p>
      </main>
    )
  }

  if (!cc || phase !== 'playing') {
    return <main className="flex min-h-screen items-center justify-center bg-cube-bg p-6 text-white/50">Watch the TV…</main>
  }

  if (cc.step === 'write') {
    return (
      <main className="flex min-h-screen flex-col bg-cube-bg p-6">
        <p className="text-sm uppercase text-white/40">Your answer</p>
        <p className="mt-4 text-xl font-bold text-white">{me?.promptText || cc.promptText}</p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={120}
          disabled={me?.submitted}
          placeholder="Type something funny…"
          className="mt-6 min-h-[120px] flex-1 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 disabled:opacity-50"
        />
        <button
          type="button"
          disabled={me?.submitted || !text.trim()}
          onClick={submitCaption}
          className="mt-4 rounded-xl bg-cube-cyan py-4 font-bold text-cube-bg disabled:opacity-40"
        >
          {me?.submitted ? 'Submitted ✓' : 'Submit'}
        </button>
      </main>
    )
  }

  if (cc.step === 'vote') {
    const options = me?.voteOptions || []
    return (
      <main className="flex min-h-screen flex-col bg-cube-bg p-6">
        <p className="text-sm uppercase text-white/40">Pick the funniest</p>
        <p className="mt-2 text-lg text-white/70">{cc.promptText}</p>
        <div className="mt-6 space-y-3">
          {options.map((opt) => {
            const author = players.find((p) => p.id === opt.playerId)
            return (
              <button
                key={opt.playerId}
                type="button"
                disabled={me?.voted}
                onClick={() => voteFor(opt.playerId)}
                className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-4 text-left text-white hover:border-cube-cyan/50 disabled:opacity-50"
              >
                {opt.text}
                {me?.voted && <span className="mt-1 block text-xs text-white/40">by {author?.name}</span>}
              </button>
            )
          })}
        </div>
        {me?.voted && <p className="mt-4 text-center text-cube-cyan">Vote locked in ✓</p>}
      </main>
    )
  }

  return <main className="flex min-h-screen items-center justify-center bg-cube-bg p-6 text-white/50">Results on TV…</main>
}
