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

export default function CaptionPlay({
  room,
  roomId,
  playerId,
  slotKey = 'captionClash',
  accentKey = 'captionClash',
  title = 'Caption Clash',
  emoji = '💬',
}) {
  const [me, setMe] = useState(null)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const cc = room?.gameState?.[slotKey]
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
      <PhoneStage title={title} emoji={emoji} accentKey={accentKey}>
        <WaitingCard emoji={emoji} title={title} subtitle="Get ready to be hilarious…" accentKey={accentKey} />
      </PhoneStage>
    )
  }

  if (!cc || phase !== 'playing') {
    return (
      <PhoneStage title={title} emoji={emoji} accentKey={accentKey}>
        <WaitingCard title="Watch the TV" subtitle="The big screen has the action." accentKey={accentKey} />
      </PhoneStage>
    )
  }

  if (cc.step === 'write') {
    return (
      <PhoneStage title="Your answer" emoji="✍️" accentKey={accentKey}>
        <PromptCard accentKey={accentKey} className="mb-4">
          <p className="text-xl font-bold leading-snug text-white">{me?.promptText || cc.promptText}</p>
        </PromptCard>
        {me?.submitted ? (
          <>
            <WaitingCard emoji="🎉" title="Answer submitted!" subtitle="Waiting for everyone else…" accentKey={accentKey} />
            <LockedBadge accentKey={accentKey}>Answer locked in</LockedBadge>
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
              <PrimaryButton accentKey={accentKey} onClick={submitCaption} disabled={!text.trim() || busy}>
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
      <PhoneStage title="Vote" emoji="🗳️" accentKey={accentKey}>
        <p className="mb-4 text-base text-white/60">{cc.promptText}</p>
        {options.length === 0 ? (
          <WaitingCard title="No answers to vote on" subtitle="Hang tight…" accentKey={accentKey} />
        ) : (
          <div className="space-y-3">
            {options.map((opt, i) => (
              <ChoiceButton
                key={opt.playerId}
                index={i + 1}
                accentKey={accentKey}
                disabled={me?.voted || busy}
                locked={me?.voted}
                onClick={() => voteFor(opt.playerId)}
              >
                {opt.text}
              </ChoiceButton>
            ))}
          </div>
        )}
        {me?.voted && <LockedBadge accentKey={accentKey}>Vote locked in</LockedBadge>}
      </PhoneStage>
    )
  }

  return (
    <PhoneStage title={title} emoji={emoji} accentKey={accentKey}>
      <WaitingCard emoji="🏆" title="Results on the TV" subtitle="See who won this prompt." accentKey={accentKey} />
    </PhoneStage>
  )
}
