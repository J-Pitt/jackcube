'use client'

import { useCallback, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getRoomMe, sendInput } from '@/lib/roomApi'

export default function TruthPlay({ room, roomId, playerId }) {
  const [me, setMe] = useState(null)
  const [answer, setAnswer] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const toc = room?.gameState?.truthOrCube
  const phase = room?.phase
  const players = room?.players || []
  const target = players.find((p) => p.id === toc?.targetPlayerId)
  const isTarget = toc?.targetPlayerId === playerId
  const isTruth = toc?.cardType === 'truth'

  const refreshMe = useCallback(() => {
    getRoomMe(roomId, playerId).then(setMe).catch(() => {})
  }, [roomId, playerId])

  useEffect(() => {
    refreshMe()
    const id = setInterval(refreshMe, 700)
    return () => clearInterval(id)
  }, [refreshMe, toc?.step, toc?.outcome])

  // Clear the draft whenever a new turn/prompt starts.
  useEffect(() => {
    setAnswer('')
  }, [toc?.targetPlayerId, toc?.promptId])

  async function submitOutcome(action) {
    await sendInput(roomId, playerId, action)
    refreshMe()
  }

  async function submitAnswer() {
    const text = answer.trim()
    if (!text || submitting) return
    setSubmitting(true)
    try {
      await sendInput(roomId, playerId, 'truthOrAnswer', { text })
      refreshMe()
    } finally {
      setSubmitting(false)
    }
  }

  if (phase === 'countdown') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-cube-bg p-6 text-center">
        <p className="font-display text-4xl font-bold text-cube-cyan">Truth or Dare</p>
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

  // Your turn on a TRUTH — type your answer in the pop-up.
  if (toc.step === 'active' && isTarget && isTruth) {
    const submitted = !!toc.outcome
    return (
      <main className="relative flex min-h-screen flex-col bg-cube-bg p-6">
        <p className="text-center text-sm font-bold uppercase tracking-widest text-cube-cyan">
          Your truth
        </p>
        <p className="mt-8 flex-1 text-center text-2xl font-bold leading-relaxed text-white">
          {me?.privatePrompt || 'Loading…'}
        </p>

        <AnimatePresence>
          {!submitted && (
            <motion.div
              className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="w-full max-w-md rounded-2xl border border-cube-cyan/30 bg-cube-surface p-5 shadow-2xl"
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 40, opacity: 0 }}
              >
                <p className="text-xs font-bold uppercase tracking-widest text-cube-cyan">
                  Your truth
                </p>
                <p className="mt-1 text-base font-semibold leading-snug text-white">
                  {me?.privatePrompt || 'Loading…'}
                </p>
                <textarea
                  autoFocus
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  maxLength={600}
                  rows={4}
                  placeholder="Type your answer…"
                  className="mt-3 w-full resize-none rounded-xl border border-white/15 bg-cube-bg p-3 text-white placeholder:text-white/30 focus:border-cube-cyan focus:outline-none"
                />
                <div className="mt-1 text-right text-xs text-white/30">{answer.length}/600</div>
                <button
                  type="button"
                  disabled={!answer.trim() || submitting}
                  onClick={submitAnswer}
                  className="mt-2 w-full rounded-xl bg-cube-cyan py-3 text-lg font-bold text-cube-bg disabled:opacity-40"
                >
                  {submitting ? 'Sending…' : 'Submit answer'}
                </button>
                <p className="mt-2 text-center text-xs text-white/40">
                  Everyone sees your answer when you submit.
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {submitted && (
          <p className="text-center text-cube-cyan">Answer sent — revealing to the group…</p>
        )}
      </main>
    )
  }

  // Your turn on a DARE — do it, then mark it.
  if (toc.step === 'active' && isTarget) {
    const submitted = !!toc.outcome
    return (
      <main className="flex min-h-screen flex-col bg-cube-bg p-6">
        <p className="text-center text-sm font-bold uppercase tracking-widest text-cube-danger">
          Your dare
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
        <p className="text-3xl">{isTruth ? '💬' : '🔥'}</p>
        <p className="mt-4 text-xl text-white">
          <span style={{ color: target?.color }}>{target?.name}</span> got a{' '}
          <strong>{toc.cardType}</strong>
        </p>
        <p className="mt-2 text-white/50">
          {isTruth ? 'They’re typing their answer…' : 'Hype them up on cam!'}
        </p>
      </main>
    )
  }

  // Reveal — everyone sees the typed truth answer on their phone too.
  if (toc.step === 'reveal' && (isTruth || toc.answerText)) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-cube-bg p-6 text-center">
        <p className="text-xs uppercase tracking-widest text-cube-cyan">
          {target?.name}’s truth
        </p>
        {toc.promptText && (
          <p className="mt-2 text-lg font-semibold text-white/80">{toc.promptText}</p>
        )}
        {toc.answerText ? (
          <p className="mt-6 text-2xl font-bold leading-relaxed text-white">
            “{toc.answerText}”
          </p>
        ) : (
          <p className="mt-6 text-white/40">No answer.</p>
        )}
      </main>
    )
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-cube-bg p-6 text-center text-white/50">
      {toc.step === 'reveal' ? 'Reveal on TV' : 'Waiting…'}
    </main>
  )
}
