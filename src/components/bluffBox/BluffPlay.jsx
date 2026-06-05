'use client'

import { useCallback, useEffect, useState } from 'react'
import { getRoomMe, sendInput } from '@/lib/roomApi'
import {
  PhoneStage,
  PromptCard,
  PrimaryButton,
  ChoiceButton,
  WaitingCard,
  LockedBadge,
} from '@/components/game/GameUI'

const ACCENT_KEY = 'bluffBox'

export default function BluffPlay({ room, roomId, playerId }) {
  const [me, setMe] = useState(null)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
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
    if (!text.trim() || busy) return
    setBusy(true)
    try {
      await sendInput(roomId, playerId, 'bluffSubmit', { text: text.trim() })
      refreshMe()
    } finally {
      setBusy(false)
    }
  }

  async function guess(choiceId) {
    if (busy) return
    setBusy(true)
    try {
      await sendInput(roomId, playerId, 'bluffGuess', { choiceId })
      refreshMe()
    } finally {
      setBusy(false)
    }
  }

  if (phase === 'countdown') {
    return (
      <PhoneStage title="Bluff Box" emoji="🎭" accentKey={ACCENT_KEY}>
        <WaitingCard emoji="🎭" title="Bluff Box" subtitle="Time to fool your friends…" accentKey={ACCENT_KEY} />
      </PhoneStage>
    )
  }

  if (!bb || phase !== 'playing') {
    return (
      <PhoneStage title="Bluff Box" emoji="🎭" accentKey={ACCENT_KEY}>
        <WaitingCard title="Watch the TV" subtitle="The big screen has the action." accentKey={ACCENT_KEY} />
      </PhoneStage>
    )
  }

  if (bb.step === 'write') {
    return (
      <PhoneStage title="Your bluff" emoji="🤥" accentKey={ACCENT_KEY}>
        <PromptCard accentKey={ACCENT_KEY} className="mb-4">
          <p className="text-xl font-bold leading-snug text-white">{me?.promptText || bb.promptText}</p>
        </PromptCard>
        {me?.submitted ? (
          <>
            <WaitingCard emoji="🤫" title="Bluff submitted!" subtitle="Waiting for the other liars…" accentKey={ACCENT_KEY} />
            <LockedBadge accentKey={ACCENT_KEY}>Bluff locked in</LockedBadge>
          </>
        ) : (
          <>
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={80}
              placeholder="A convincing fake answer…"
              className="w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-4 text-lg text-white placeholder:text-white/30 focus:border-cube-violet"
            />
            <p className="mt-2 text-sm text-white/40">Tip: make it believable so others pick it.</p>
            <div className="mt-3">
              <PrimaryButton accentKey={ACCENT_KEY} onClick={submitBluff} disabled={!text.trim() || busy}>
                {busy ? 'Submitting…' : 'Submit bluff'}
              </PrimaryButton>
            </div>
          </>
        )}
      </PhoneStage>
    )
  }

  if (bb.step === 'guess') {
    const choices = me?.choices || []
    return (
      <PhoneStage title="Spot the truth" emoji="🔍" accentKey={ACCENT_KEY}>
        <p className="mb-4 text-base text-white/60">{bb.promptText}</p>
        <div className="space-y-3">
          {choices.map((c, i) => (
            <ChoiceButton
              key={c.id}
              index={i + 1}
              accentKey={ACCENT_KEY}
              disabled={me?.guessed || busy || c.mine}
              locked={me?.guessed}
              onClick={() => guess(c.id)}
            >
              {c.text}
              {c.mine && <span className="ml-2 text-xs text-white/40">(your bluff)</span>}
            </ChoiceButton>
          ))}
        </div>
        {me?.guessed && <LockedBadge accentKey={ACCENT_KEY}>Guess locked in</LockedBadge>}
      </PhoneStage>
    )
  }

  return (
    <PhoneStage title="Bluff Box" emoji="🎭" accentKey={ACCENT_KEY}>
      <WaitingCard emoji="🏆" title="Reveal on the TV" subtitle="Did anyone fall for your bluff?" accentKey={ACCENT_KEY} />
    </PhoneStage>
  )
}
