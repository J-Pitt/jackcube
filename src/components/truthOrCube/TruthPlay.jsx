'use client'

import { useCallback, useEffect, useState } from 'react'
import { getRoomMe, sendInput } from '@/lib/roomApi'

export default function TruthPlay({ room, roomId, playerId }) {
  const [me, setMe] = useState(null)
  const toc = room?.gameState?.truthOrCube
  const phase = room?.phase
  const players = room?.players || []
  const target = players.find((p) => p.id === toc?.targetPlayerId)
  const isTarget = toc?.targetPlayerId === playerId

  const refreshMe = useCallback(() => {
    getRoomMe(roomId, playerId).then(setMe).catch(() => {})
  }, [roomId, playerId])

  useEffect(() => {
    refreshMe()
    const id = setInterval(refreshMe, 700)
    return () => clearInterval(id)
  }, [refreshMe, toc?.step, toc?.outcome])

  async function submitOutcome(action) {
    await sendInput(roomId, playerId, action)
    refreshMe()
  }

  if (phase === 'countdown') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-cube-bg p-6 text-center">
        <p className="font-display text-4xl font-bold text-cube-cyan">Truth or Cube</p>
        <p className="mt-2 text-white/50">Get ready…</p>
      </main>
    )
  }

  if (!toc || phase !== 'playing') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-cube-bg p-6 text-white/50">
        Watch the TV…
      </main>
    )
  }

  if (toc.step === 'cube') {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-cube-bg p-6 text-center">
        <p className="text-lg text-white/60">The cube is spinning…</p>
        <p className="mt-4 text-2xl font-bold text-white">{target?.name} is up next</p>
      </main>
    )
  }

  if (toc.step === 'active' && isTarget) {
    const submitted = !!toc.outcome
    return (
      <main className="flex min-h-screen flex-col bg-cube-bg p-6">
        <p
          className={`text-center text-sm font-bold uppercase tracking-widest ${
            toc.cardType === 'dare' ? 'text-cube-danger' : 'text-cube-cyan'
          }`}
        >
          {toc.cardType === 'dare' ? 'Your dare' : 'Your truth'}
        </p>
        <p className="mt-8 flex-1 text-center text-2xl font-bold leading-relaxed text-white">
          {me?.privatePrompt || 'Loading…'}
        </p>
        <div className="space-y-3">
          <button
            type="button"
            disabled={submitted}
            onClick={() => submitOutcome('truthOrDone')}
            className="w-full rounded-xl bg-cube-cyan py-4 text-lg font-bold text-cube-bg disabled:opacity-40"
          >
            {submitted && toc.outcome === 'done' ? 'Done ✓' : 'I did it'}
          </button>
          <button
            type="button"
            disabled={submitted}
            onClick={() => submitOutcome('truthOrChicken')}
            className="w-full rounded-xl border border-white/20 py-4 text-lg font-bold text-white disabled:opacity-40"
          >
            {submitted && toc.outcome === 'chicken' ? 'Chicken ✓' : 'Chicken out'}
          </button>
        </div>
      </main>
    )
  }

  if (toc.step === 'active' && !isTarget) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-cube-bg p-6 text-center">
        <p className="text-3xl">{toc.cardType === 'dare' ? '🔥' : '💬'}</p>
        <p className="mt-4 text-xl text-white">
          <span style={{ color: target?.color }}>{target?.name}</span> got a{' '}
          <strong>{toc.cardType}</strong>
        </p>
        <p className="mt-2 text-white/50">Hype them up on cam!</p>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-cube-bg p-6 text-center text-white/50">
      {toc.step === 'reveal' ? 'Reveal on TV' : 'Waiting…'}
    </main>
  )
}
