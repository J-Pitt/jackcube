'use client'

import { useEffect, useState } from 'react'
import { sendInput } from '@/lib/roomApi'
import {
  PhoneStage,
  PromptCard,
  PrimaryButton,
  WaitingCard,
  LockedBadge,
  getAccent,
} from '@/components/game/GameUI'

const ACCENT_KEY = 'categories'

export default function CategoriesPlay({ room, roomId, playerId }) {
  const cat = room?.gameState?.categories
  const phase = room?.phase
  const accent = getAccent(ACCENT_KEY)
  const cats = cat?.categories || []
  const letter = cat?.letter || ''

  const [answers, setAnswers] = useState(['', '', ''])
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const submitted = sent || (cat?.answeredIds || []).includes(playerId)

  useEffect(() => {
    setAnswers(cats.map(() => ''))
    setSent(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cat?.promptId, cat?.step])

  async function submit() {
    if (busy || submitted) return
    setBusy(true)
    try {
      await sendInput(roomId, playerId, 'categoryAnswer', { answers })
      setSent(true)
    } finally {
      setBusy(false)
    }
  }

  if (phase === 'countdown') {
    return (
      <PhoneStage title="Categories" emoji="🔤" accentKey={ACCENT_KEY}>
        <WaitingCard emoji="🔤" title="Categories" subtitle="Get your thinking cap on…" accentKey={ACCENT_KEY} />
      </PhoneStage>
    )
  }

  if (!cat || phase !== 'playing') {
    return (
      <PhoneStage title="Categories" emoji="🔤" accentKey={ACCENT_KEY}>
        <WaitingCard title="Watch the TV" subtitle="The big screen has the action." accentKey={ACCENT_KEY} />
      </PhoneStage>
    )
  }

  if (cat.step === 'write') {
    if (submitted) {
      return (
        <PhoneStage title="Categories" emoji="🔤" accentKey={ACCENT_KEY}>
          <WaitingCard emoji="✅" title="Answers locked in!" subtitle="Waiting for everyone else…" accentKey={ACCENT_KEY} />
          <LockedBadge accentKey={ACCENT_KEY}>Answers locked in</LockedBadge>
        </PhoneStage>
      )
    }
    return (
      <PhoneStage title="Your answers" emoji="🔤" accentKey={ACCENT_KEY}>
        <div className="mb-4 flex items-center justify-center gap-3">
          <span className="text-sm text-white/50">Start each with</span>
          <span
            className="flex h-12 w-12 items-center justify-center rounded-2xl font-display text-3xl font-black text-cube-bg"
            style={{ background: accent.hex }}
          >
            {letter}
          </span>
        </div>
        <div className="space-y-3">
          {cats.map((c, i) => (
            <PromptCard key={i} accentKey={ACCENT_KEY} className="!p-4">
              <p className="mb-2 text-xs font-bold uppercase tracking-widest text-white/40">{c}</p>
              <input
                value={answers[i] || ''}
                onChange={(e) => {
                  const next = [...answers]
                  next[i] = e.target.value
                  setAnswers(next)
                }}
                maxLength={40}
                autoComplete="off"
                placeholder={`${letter}…`}
                className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-3 text-lg text-white placeholder:text-white/25 focus:border-cube-cyan"
              />
            </PromptCard>
          ))}
        </div>
        <div className="mt-4">
          <PrimaryButton accentKey={ACCENT_KEY} onClick={submit} disabled={busy || answers.every((a) => !a.trim())}>
            {busy ? 'Submitting…' : 'Lock in answers'}
          </PrimaryButton>
        </div>
      </PhoneStage>
    )
  }

  return (
    <PhoneStage title="Categories" emoji="🔤" accentKey={ACCENT_KEY}>
      <WaitingCard emoji="🏆" title="Scores on the TV" subtitle="Unique answers earned double points!" accentKey={ACCENT_KEY} />
    </PhoneStage>
  )
}
