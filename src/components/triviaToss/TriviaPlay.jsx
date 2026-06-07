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

const LABELS = ['A', 'B', 'C', 'D']

export default function TriviaPlay({
  room,
  roomId,
  playerId,
  slotKey = 'triviaToss',
  accentKey = 'triviaToss',
  title = 'Trivia Toss',
  emoji = '🧠',
}) {
  const [me, setMe] = useState(null)
  const [busy, setBusy] = useState(false)
  const tt = room?.gameState?.[slotKey]
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
      <PhoneStage title={title} emoji={emoji} accentKey={accentKey}>
        <WaitingCard emoji={emoji} title={title} subtitle="Sharpen up — questions incoming…" accentKey={accentKey} />
      </PhoneStage>
    )
  }

  if (!tt || phase !== 'playing') {
    return (
      <PhoneStage title={title} emoji={emoji} accentKey={accentKey}>
        <WaitingCard title="Watch the TV" subtitle="The big screen has the action." accentKey={accentKey} />
      </PhoneStage>
    )
  }

  if (tt.step === 'question') {
    const options = me?.options || tt.options || []
    return (
      <PhoneStage title="Pick an answer" emoji={emoji} accentKey={accentKey}>
        <PromptCard accentKey={accentKey} className="mb-4">
          <p className="text-xl font-bold leading-snug text-white">{me?.questionText || tt.questionText}</p>
        </PromptCard>
        <div className="space-y-3">
          {options.map((opt, i) => (
            <ChoiceButton
              key={opt}
              index={LABELS[i]}
              accentKey={accentKey}
              disabled={me?.answered || busy}
              locked={me?.answered}
              onClick={() => pick(i)}
            >
              {opt}
            </ChoiceButton>
          ))}
        </div>
        {me?.answered && <LockedBadge accentKey={accentKey}>Answer locked in</LockedBadge>}
      </PhoneStage>
    )
  }

  if (tt.step === 'reveal') {
    const correct = me?.correctIndex ?? tt.correctIndex
    const myPick = tt.answers?.[playerId]
    const won = myPick === correct
    return (
      <PhoneStage title={title} emoji={emoji} accentKey={accentKey}>
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
