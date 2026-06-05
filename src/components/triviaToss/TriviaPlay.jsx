'use client'

import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { getRoomMe, sendInput } from '@/lib/roomApi'
import {
  PhoneStage,
  PromptCard,
  ChoiceButton,
  WaitingCard,
  LockedBadge,
} from '@/components/game/GameUI'

const ACCENT_KEY = 'triviaToss'
const LABELS = ['A', 'B', 'C', 'D']

export default function TriviaPlay({ room, roomId, playerId }) {
  const [me, setMe] = useState(null)
  const [busy, setBusy] = useState(false)
  const tt = room?.gameState?.triviaToss
  const phase = room?.phase

  const refreshMe = useCallback(() => {
    getRoomMe(roomId, playerId).then(setMe).catch(() => {})
  }, [roomId, playerId])

  useEffect(() => {
    refreshMe()
    const id = setInterval(refreshMe, 600)
    return () => clearInterval(id)
  }, [refreshMe, tt?.step])

  async function pick(index) {
    if (busy || me?.answered) return
    setBusy(true)
    try {
      await sendInput(roomId, playerId, 'triviaAnswer', { index })
      refreshMe()
    } finally {
      setBusy(false)
    }
  }

  if (phase === 'countdown') {
    return (
      <PhoneStage title="Trivia Toss" emoji="🧠" accentKey={ACCENT_KEY}>
        <WaitingCard emoji="🧠" title="Trivia Toss" subtitle="Sharpen up — questions incoming…" accentKey={ACCENT_KEY} />
      </PhoneStage>
    )
  }

  if (!tt || phase !== 'playing') {
    return (
      <PhoneStage title="Trivia Toss" emoji="🧠" accentKey={ACCENT_KEY}>
        <WaitingCard title="Watch the TV" subtitle="The big screen has the action." accentKey={ACCENT_KEY} />
      </PhoneStage>
    )
  }

  if (tt.step === 'question') {
    const options = me?.options || tt.options || []
    return (
      <PhoneStage title="Pick an answer" emoji="🧠" accentKey={ACCENT_KEY}>
        <PromptCard accentKey={ACCENT_KEY} className="mb-4">
          <p className="text-xl font-bold leading-snug text-white">{me?.questionText || tt.questionText}</p>
        </PromptCard>
        <div className="space-y-3">
          {options.map((opt, i) => (
            <ChoiceButton
              key={opt}
              index={LABELS[i]}
              accentKey={ACCENT_KEY}
              disabled={me?.answered || busy}
              locked={me?.answered}
              onClick={() => pick(i)}
            >
              {opt}
            </ChoiceButton>
          ))}
        </div>
        {me?.answered && <LockedBadge accentKey={ACCENT_KEY}>Answer locked in</LockedBadge>}
      </PhoneStage>
    )
  }

  if (tt.step === 'reveal') {
    const correct = me?.correctIndex ?? tt.correctIndex
    const myPick = tt.answers?.[playerId]
    const won = myPick === correct
    return (
      <PhoneStage title="Trivia Toss" emoji="🧠" accentKey={ACCENT_KEY}>
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-7xl"
          >
            {won ? '🎉' : '😅'}
          </motion.div>
          <p className="mt-5 font-display text-3xl font-black text-white">
            {won ? 'Correct!' : 'Not this time'}
          </p>
          <p className="mt-3 text-white/50">
            Answer:{' '}
            <strong style={{ color: '#4ECDC4' }}>
              {LABELS[correct]}. {(tt.options || [])[correct]}
            </strong>
          </p>
        </div>
      </PhoneStage>
    )
  }

  return null
}
