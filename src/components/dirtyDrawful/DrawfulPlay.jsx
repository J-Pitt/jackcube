'use client'

import { useCallback, useEffect, useState } from 'react'
import { getRoomMe, sendInput } from '@/lib/roomApi'
import DrawCanvas from './DrawCanvas'

export default function DrawfulPlay({ room, roomId, playerId }) {
  const [me, setMe] = useState(null)
  const [guess, setGuess] = useState('')
  const [localStrokes, setLocalStrokes] = useState([])
  const dd = room?.gameState?.dirtyDrawful
  const phase = room?.phase
  const isDrawer = dd?.drawerId === playerId

  const refreshMe = useCallback(() => {
    getRoomMe(roomId, playerId).then(setMe).catch(() => {})
  }, [roomId, playerId])

  useEffect(() => {
    refreshMe()
  }, [refreshMe, dd?.step])

  useEffect(() => {
    if (isDrawer && dd?.strokes) {
      setLocalStrokes(dd.strokes)
    }
  }, [isDrawer, dd?.strokes])

  const syncStroke = useCallback(
    async (stroke) => {
      setLocalStrokes((prev) => {
        const next = [...prev, stroke]
        sendInput(roomId, playerId, 'drawStroke', { stroke }).catch(() => {})
        return next
      })
    },
    [roomId, playerId]
  )

  async function handleUndo() {
    await sendInput(roomId, playerId, 'drawUndo')
    setLocalStrokes((prev) => prev.slice(0, -1))
  }

  async function handleClear() {
    await sendInput(roomId, playerId, 'drawClear')
    setLocalStrokes([])
  }

  async function submitGuess() {
    await sendInput(roomId, playerId, 'drawGuess', { text: guess })
    setGuess('')
  }

  if (phase === 'countdown') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-cube-bg p-6 text-center">
        <p className="font-display text-4xl font-bold text-cube-cyan">Get ready to draw!</p>
      </main>
    )
  }

  if (!dd || phase !== 'playing') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-cube-bg p-6 text-white/50">
        Watch the TV…
      </main>
    )
  }

  if (dd.step === 'assign') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-cube-bg p-6 text-center">
        <p className="text-xl text-white">
          {isDrawer ? 'Get your prompt…' : 'Someone is about to draw…'}
        </p>
      </main>
    )
  }

  if (dd.step === 'draw' && isDrawer) {
    return (
      <main className="flex min-h-screen flex-col bg-cube-bg p-4">
        <p className="text-center text-lg font-bold text-cube-cyan">{me?.privatePrompt || 'Draw this!'}</p>
        <DrawCanvas
          strokes={localStrokes}
          onStroke={syncStroke}
          onUndo={handleUndo}
          onClear={handleClear}
          disabled={false}
        />
      </main>
    )
  }

  if (dd.step === 'draw' && !isDrawer) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-cube-bg p-6 text-white/50">
        Watch the drawing on TV…
      </main>
    )
  }

  if (dd.step === 'guess' && !isDrawer) {
    const submitted = !!dd.guesses?.[playerId]
    return (
      <main className="flex min-h-screen flex-col justify-center bg-cube-bg p-6">
        <p className="mb-4 text-center text-lg font-bold text-white">Your guess</p>
        <input
          value={guess}
          onChange={(e) => setGuess(e.target.value)}
          disabled={submitted}
          autoComplete="off"
          className="rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-white"
          placeholder="What are they drawing?"
        />
        <button
          type="button"
          onClick={submitGuess}
          disabled={submitted || !guess.trim()}
          className="mt-4 rounded-xl bg-cube-cyan py-3 font-bold text-cube-bg disabled:opacity-40"
        >
          {submitted ? 'Submitted ✓' : 'Submit guess'}
        </button>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-cube-bg p-6 text-white/50">
      {dd.step === 'reveal' ? 'Reveal on TV!' : 'Waiting…'}
    </main>
  )
}
