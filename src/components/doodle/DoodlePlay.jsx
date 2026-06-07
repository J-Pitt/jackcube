'use client'

import { useCallback, useEffect, useState } from 'react'
import { getRoomMe, sendInput } from '@/lib/roomApi'
import DrawCanvas from '@/components/dirtyDrawful/DrawCanvas'
import {
  PhoneStage,
  PromptCard,
  PrimaryButton,
  WaitingCard,
  LockedBadge,
} from '@/components/game/GameUI'

export default function DoodlePlay({
  room,
  roomId,
  playerId,
  slotKey = 'doodle',
  accentKey = 'doodle',
  title = 'Doodle Dash',
  emoji = '✏️',
}) {
  const [me, setMe] = useState(null)
  const [guess, setGuess] = useState('')
  const [busy, setBusy] = useState(false)
  const [localStrokes, setLocalStrokes] = useState([])
  const dl = room?.gameState?.[slotKey]
  const phase = room?.phase
  const isDrawer = dl?.drawerId === playerId
  const submitted = !!dl?.guesses?.[playerId] || (dl?.answeredIds || []).includes(playerId)

  const refreshMe = useCallback(() => {
    getRoomMe(roomId, playerId).then(setMe).catch(() => {})
  }, [roomId, playerId])

  useEffect(() => {
    refreshMe()
  }, [refreshMe, dl?.step])

  useEffect(() => {
    if (isDrawer && dl?.strokes) setLocalStrokes(dl.strokes)
  }, [isDrawer, dl?.strokes])

  const syncStroke = useCallback(
    (stroke) => {
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
    if (busy || !guess.trim()) return
    setBusy(true)
    try {
      await sendInput(roomId, playerId, 'drawGuess', { text: guess.trim() })
      setGuess('')
      refreshMe()
    } finally {
      setBusy(false)
    }
  }

  if (phase === 'countdown') {
    return (
      <PhoneStage title={title} emoji={emoji} accentKey={accentKey}>
        <WaitingCard emoji={emoji} title={title} subtitle="Pencils ready…" accentKey={accentKey} />
      </PhoneStage>
    )
  }

  if (!dl || phase !== 'playing') {
    return (
      <PhoneStage title={title} emoji={emoji} accentKey={accentKey}>
        <WaitingCard title="Watch the TV" subtitle="The big screen has the action." accentKey={accentKey} />
      </PhoneStage>
    )
  }

  if (dl.step === 'assign') {
    return (
      <PhoneStage title={title} emoji={emoji} accentKey={accentKey}>
        <WaitingCard
          emoji={isDrawer ? '🎨' : '👀'}
          title={isDrawer ? 'You are drawing!' : 'Someone is about to draw…'}
          subtitle={isDrawer ? 'Get your word ready…' : 'Be ready to guess fast.'}
          accentKey={accentKey}
        />
      </PhoneStage>
    )
  }

  if (dl.step === 'draw' && isDrawer) {
    return (
      <PhoneStage title="Draw this!" emoji="🎨" accentKey={accentKey}>
        <PromptCard accentKey={accentKey} className="mb-3 text-center">
          <p className="font-display text-3xl font-black text-white">{me?.privatePrompt || '…'}</p>
        </PromptCard>
        <DrawCanvas strokes={localStrokes} onStroke={syncStroke} onUndo={handleUndo} onClear={handleClear} disabled={false} />
      </PhoneStage>
    )
  }

  if (dl.step === 'draw' && !isDrawer) {
    return (
      <PhoneStage title="Doodle Dash" emoji="👀" accentKey={accentKey}>
        <WaitingCard emoji="👀" title="Watch the drawing" subtitle="Guessing opens any second…" accentKey={accentKey} />
      </PhoneStage>
    )
  }

  if (dl.step === 'guess' && isDrawer) {
    return (
      <PhoneStage title="Doodle Dash" emoji="🎨" accentKey={accentKey}>
        <WaitingCard emoji="🤞" title="They're guessing!" subtitle="Hope your art holds up…" accentKey={accentKey} />
      </PhoneStage>
    )
  }

  if (dl.step === 'guess' && !isDrawer) {
    return (
      <PhoneStage title="Your guess" emoji="💭" accentKey={accentKey}>
        {submitted ? (
          <>
            <WaitingCard emoji="✅" title="Guess submitted!" subtitle="Waiting for the reveal…" accentKey={accentKey} />
            <LockedBadge accentKey={accentKey}>Guess locked in</LockedBadge>
          </>
        ) : (
          <>
            <p className="mb-3 text-center text-white/60">What are they drawing?</p>
            <input
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              maxLength={40}
              autoComplete="off"
              placeholder="Type your guess…"
              className="w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-4 text-lg text-white placeholder:text-white/30 focus:border-cube-cyan"
            />
            <div className="mt-4">
              <PrimaryButton accentKey={accentKey} onClick={submitGuess} disabled={busy || !guess.trim()}>
                {busy ? 'Submitting…' : 'Submit guess'}
              </PrimaryButton>
            </div>
          </>
        )}
      </PhoneStage>
    )
  }

  return (
    <PhoneStage title={title} emoji={emoji} accentKey={accentKey}>
      <WaitingCard emoji="🏆" title="Reveal on the TV" subtitle="Did you nail it?" accentKey={accentKey} />
    </PhoneStage>
  )
}
