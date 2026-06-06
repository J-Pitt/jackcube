'use client'

import { useCallback, useEffect, useState } from 'react'
import { getRoomMe, sendInput } from '@/lib/roomApi'
import {
  PhoneStage,
  PromptCard,
  ChoiceButton,
  WaitingCard,
  LockedBadge,
} from '@/components/game/GameUI'

export default function VotePlay({ room, roomId, playerId, config }) {
  const { slotKey, accentKey, title, emoji, type } = config
  const [me, setMe] = useState(null)
  const [busy, setBusy] = useState(false)
  const v = room?.gameState?.[slotKey]
  const phase = room?.phase

  const refreshMe = useCallback(() => {
    getRoomMe(roomId, playerId).then(setMe).catch(() => {})
  }, [roomId, playerId])

  useEffect(() => {
    refreshMe()
    const id = setInterval(refreshMe, 700)
    return () => clearInterval(id)
  }, [refreshMe, v?.step])

  const choices = type === 'ab'
    ? [{ key: 'a', label: me?.optionA || v?.optionA }, { key: 'b', label: me?.optionB || v?.optionB }]
    : [{ key: 'have', label: 'I have 🙋' }, { key: 'never', label: 'I never 🙅' }]

  async function vote(choice) {
    if (busy || me?.voted) return
    setBusy(true)
    try {
      await sendInput(roomId, playerId, 'choiceVote', { choice })
      refreshMe()
    } finally {
      setBusy(false)
    }
  }

  if (phase === 'countdown') {
    return (
      <PhoneStage title={title} emoji={emoji} accentKey={accentKey}>
        <WaitingCard emoji={emoji} title={title} subtitle="Make your choice when it lands…" accentKey={accentKey} />
      </PhoneStage>
    )
  }

  if (!v || phase !== 'playing') {
    return (
      <PhoneStage title={title} emoji={emoji} accentKey={accentKey}>
        <WaitingCard title="Watch the TV" subtitle="The big screen has the action." accentKey={accentKey} />
      </PhoneStage>
    )
  }

  if (v.step === 'vote') {
    return (
      <PhoneStage title={type === 'ab' ? 'Would you rather…' : 'Fess up'} emoji={emoji} accentKey={accentKey}>
        {type === 'haveNever' && (
          <PromptCard accentKey={accentKey} className="mb-4">
            <p className="text-xl font-bold leading-snug text-white">{me?.statement || v.statement}</p>
          </PromptCard>
        )}
        <div className="space-y-3">
          {choices.map((c) => (
            <ChoiceButton
              key={c.key}
              accentKey={accentKey}
              selected={me?.myChoice === c.key}
              disabled={me?.voted || busy}
              locked={me?.voted}
              onClick={() => vote(c.key)}
            >
              {c.label}
            </ChoiceButton>
          ))}
        </div>
        {me?.voted && <LockedBadge accentKey={accentKey}>Vote locked in</LockedBadge>}
      </PhoneStage>
    )
  }

  return (
    <PhoneStage title={title} emoji={emoji} accentKey={accentKey}>
      <WaitingCard emoji="📊" title="Results on the TV" subtitle="See how the room split." accentKey={accentKey} />
    </PhoneStage>
  )
}
