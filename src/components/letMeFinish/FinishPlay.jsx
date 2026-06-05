'use client'

import { useCallback, useEffect, useState } from 'react'
import { getRoomMe, sendInput } from '@/lib/roomApi'

export default function FinishPlay({ room, roomId, playerId, players }) {
  const [me, setMe] = useState(null)
  const [rebuttal, setRebuttal] = useState('')
  const lmf = room?.gameState?.letMeFinish
  const phase = room?.phase
  const isPresenter = lmf?.presenterId === playerId

  const refreshMe = useCallback(() => {
    getRoomMe(roomId, playerId).then(setMe).catch(() => {})
  }, [roomId, playerId])

  useEffect(() => {
    refreshMe()
    const id = setInterval(refreshMe, 700)
    return () => clearInterval(id)
  }, [refreshMe, lmf?.step])

  async function startPitch() {
    await sendInput(roomId, playerId, 'finishPitchStart')
    refreshMe()
  }

  async function endPitch() {
    await sendInput(roomId, playerId, 'finishPitchEnd')
  }

  async function objection(type) {
    await sendInput(roomId, playerId, 'finishObjection', {
      type,
      text: me?.challengerLine,
    })
    refreshMe()
  }

  async function submitRebuttal() {
    await sendInput(roomId, playerId, 'finishRebuttal', { text: rebuttal })
  }

  async function voteFor(votedForId) {
    await sendInput(roomId, playerId, 'finishVote', { votedForId })
    refreshMe()
  }

  if (phase === 'countdown') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-cube-bg p-6">
        <p className="font-display text-4xl font-bold text-cube-cyan">Get ready to debate!</p>
      </main>
    )
  }

  if (!lmf || phase !== 'playing') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-cube-bg p-6 text-white/50">
        Watch the TV for the question…
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col bg-cube-bg p-6">
      <p className="text-center text-xs uppercase text-cube-violet">
        {isPresenter ? 'You are presenting' : 'You are a challenger'}
      </p>
      {lmf.step === 'question' && !isPresenter && (
        <p className="mt-8 text-center text-white/50">Watch the TV for the question…</p>
      )}

      {lmf.step === 'question' && isPresenter && (
        <>
          <p className="mt-4 text-center text-lg font-semibold leading-relaxed text-white">
            {lmf.questionText}
          </p>
        <button
          type="button"
          onClick={startPitch}
          className="mt-8 rounded-xl bg-cube-cyan py-4 text-lg font-bold text-cube-bg"
        >
          Start pitch
        </button>
        </>
      )}

      {lmf.step === 'pitch' && isPresenter && (
        <button
          type="button"
          onClick={endPitch}
          className="mt-8 rounded-xl border border-white/20 py-4 font-bold text-white"
        >
          End pitch early
        </button>
      )}

      {lmf.step === 'pitch' && !isPresenter && !lmf.objectionUsed?.[playerId] && (
        <div className="mt-8 space-y-3">
          <button
            type="button"
            onClick={() => objection('objection')}
            className="w-full rounded-xl bg-cube-danger/80 py-4 font-bold text-white"
          >
            Objection!
          </button>
          <button
            type="button"
            onClick={() => objection('hot')}
            className="w-full rounded-xl bg-cube-violet py-4 font-bold"
          >
            Hot take
          </button>
          <button
            type="button"
            onClick={() => objection('spicy')}
            className="w-full rounded-xl border border-cube-cyan py-4 font-bold text-cube-cyan"
          >
            Spicy follow-up
          </button>
        </div>
      )}

      {lmf.step === 'rebuttal' && lmf.rebuttalPlayerId === playerId && (
        <div className="mt-8">
          <textarea
            value={rebuttal}
            onChange={(e) => setRebuttal(e.target.value)}
            className="w-full rounded-xl border border-white/20 bg-white/5 p-4 text-white"
            rows={3}
            placeholder="Your rebuttal…"
          />
          <button
            type="button"
            onClick={submitRebuttal}
            className="mt-3 w-full rounded-xl bg-cube-cyan py-3 font-bold text-cube-bg"
          >
            Submit rebuttal
          </button>
        </div>
      )}

      {lmf.step === 'vote' && (
        <div className="mt-8 space-y-2">
          <p className="text-center font-bold text-white">Vote best performance</p>
          {players.map((p) => (
            <button
              key={p.id}
              type="button"
              disabled={!!lmf.votes?.[playerId]}
              onClick={() => voteFor(p.id)}
              className="w-full rounded-xl border border-white/15 py-3 font-semibold disabled:opacity-40"
              style={{ color: p.color }}
            >
              {p.name}
            </button>
          ))}
        </div>
      )}
    </main>
  )
}
