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

const ACCENT_KEY = 'captionClash'

export default function CaptionPlay({ room, roomId, playerId }) {
  const [me, setMe] = useState(null)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const cc = room?.gameState?.captionClash
  const phase = room?.phase

  const refreshMe = useCallback(() => {
    getRoomMe(roomId, playerId).then(setMe).catch(() => {})
  }, [roomId, playerId])

  useEffect(() => {
    refreshMe()
    const id = setInterval(refreshMe, 700)
    return () => clearInterval(id)
  }, [refreshMe, cc?.step])

  async function submitCaption() {
    if (!text.trim() || busy) return
    setBusy(true)
    try {
      await sendInput(roomId, playerId, 'captionSubmit', { text: text.trim() })
      refreshMe()
    } finally {
      setBusy(false)
    }
  }

  async function voteFor(pid) {
    if (busy) return
    setBusy(true)
    try {
      await sendInput(roomId, playerId, 'captionVote', { votedForId: pid })
      refreshMe()
    } finally {
      setBusy(false)
    }
  }

  if (phase === 'countdown') {
    return (
      <PhoneStage title="Caption Clash" emoji="💬" accentKey={ACCENT_KEY}>
        <WaitingCard emoji="💬" title="Caption Clash" subtitle="Get ready to be hilarious…" accentKey={ACCENT_KEY} />
      </PhoneStage>
    )
  }

  if (!cc || phase !== 'playing') {
    return (
      <PhoneStage title="Caption Clash" emoji="💬" accentKey={ACCENT_KEY}>
        <WaitingCard title="Watch the TV" subtitle="The big screen has the action." accentKey={ACCENT_KEY} />
      </PhoneStage>
    )
  }

  if (cc.step === 'write') {
    return (
      <PhoneStage title="Your answer" emoji="✍️" accentKey={ACCENT_KEY}>
        <PromptCard accentKey={ACCENT_KEY} className="mb-4">
          <p className="text-xl font-bold leading-snug text-white">{me?.promptText || cc.promptText}</p>
        </PromptCard>
        {me?.submitted ? (
          <>
            <WaitingCard emoji="🎉" title="Answer submitted!" subtitle="Waiting for everyone else…" accentKey={ACCENT_KEY} />
            <LockedBadge accentKey={ACCENT_KEY}>Answer locked in</LockedBadge>
          </>
        ) : (
          <>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={120}
              placeholder="Type something funny…"
              className="min-h-[140px] w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-lg text-white placeholder:text-white/30 focus:border-cube-cyan"
            />
            <p className="mt-1 text-right text-xs text-white/30">{text.length}/120</p>
            <div className="mt-3">
              <PrimaryButton accentKey={ACCENT_KEY} onClick={submitCaption} disabled={!text.trim() || busy}>
                {busy ? 'Submitting…' : 'Submit answer'}
              </PrimaryButton>
            </div>
          </>
        )}
      </PhoneStage>
    )
  }

  if (cc.step === 'vote') {
    const options = me?.voteOptions || []
    return (
      <PhoneStage title="Vote" emoji="🗳️" accentKey={ACCENT_KEY}>
        <p className="mb-4 text-base text-white/60">{cc.promptText}</p>
        {options.length === 0 ? (
          <WaitingCard title="No answers to vote on" subtitle="Hang tight…" accentKey={ACCENT_KEY} />
        ) : (
          <div className="space-y-3">
            {options.map((opt, i) => (
              <ChoiceButton
                key={opt.playerId}
                index={i + 1}
                accentKey={ACCENT_KEY}
                disabled={me?.voted || busy}
                locked={me?.voted}
                onClick={() => voteFor(opt.playerId)}
              >
                {opt.text}
              </ChoiceButton>
            ))}
          </div>
        )}
        {me?.voted && <LockedBadge accentKey={ACCENT_KEY}>Vote locked in</LockedBadge>}
      </PhoneStage>
    )
  }

  return (
    <PhoneStage title="Caption Clash" emoji="💬" accentKey={ACCENT_KEY}>
      <WaitingCard emoji="🏆" title="Results on the TV" subtitle="See who won this prompt." accentKey={ACCENT_KEY} />
    </PhoneStage>
  )
}
