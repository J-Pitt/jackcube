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

const ACCENT_KEY = 'cardCrimes'

export default function CardCrimesPlay({ room, roomId, playerId }) {
  const [me, setMe] = useState(null)
  const [selected, setSelected] = useState(null)
  const [pickedSid, setPickedSid] = useState(null)
  const [busy, setBusy] = useState(false)
  const cc = room?.gameState?.cardCrimes
  const phase = room?.phase
  const isJudge = cc?.judgeId === playerId

  const refreshMe = useCallback(() => {
    getRoomMe(roomId, playerId).then(setMe).catch(() => {})
  }, [roomId, playerId])

  useEffect(() => {
    refreshMe()
    setSelected(null)
    setPickedSid(null)
  }, [refreshMe, cc?.step])

  async function submitCard() {
    if (busy || !selected || me?.submitted) return
    setBusy(true)
    try {
      await sendInput(roomId, playerId, 'cardSubmit', { cardIds: [selected] })
      refreshMe()
    } finally {
      setBusy(false)
    }
  }

  async function pickWinner(sid) {
    if (busy || pickedSid) return
    setBusy(true)
    setPickedSid(sid)
    try {
      await sendInput(roomId, playerId, 'cardJudge', { sid })
    } finally {
      setBusy(false)
    }
  }

  if (phase === 'countdown') {
    return (
      <PhoneStage title="Card Crimes" emoji="🃏" accentKey={ACCENT_KEY}>
        <WaitingCard emoji="🃏" title="Card Crimes" subtitle="Dealing your hand…" accentKey={ACCENT_KEY} />
      </PhoneStage>
    )
  }

  if (!cc || phase !== 'playing') {
    return (
      <PhoneStage title="Card Crimes" emoji="🃏" accentKey={ACCENT_KEY}>
        <WaitingCard title="Watch the TV" subtitle="The big screen has the action." accentKey={ACCENT_KEY} />
      </PhoneStage>
    )
  }

  const black = me?.black || cc.black

  // Judge views
  if (isJudge) {
    if (cc.step === 'submit') {
      return (
        <PhoneStage title="You're the Judge" emoji="⚖️" accentKey={ACCENT_KEY}>
          <PromptCard accentKey={ACCENT_KEY} className="mb-4">
            <p className="text-xl font-bold leading-snug text-white">{black?.text}</p>
          </PromptCard>
          <WaitingCard emoji="⚖️" title="Players are picking cards" subtitle="You'll judge the best one next." accentKey={ACCENT_KEY} />
        </PhoneStage>
      )
    }
    if (cc.step === 'judge') {
      return (
        <PhoneStage title="Pick the winner" emoji="⚖️" accentKey={ACCENT_KEY}>
          <PromptCard accentKey={ACCENT_KEY} className="mb-4">
            <p className="text-lg font-bold leading-snug text-white">{black?.text}</p>
          </PromptCard>
          <div className="space-y-3">
            {(cc.board || []).map((b, i) => (
              <ChoiceButton
                key={b.sid}
                index={i + 1}
                accentKey={ACCENT_KEY}
                selected={pickedSid === b.sid}
                disabled={!!pickedSid || busy}
                locked={!!pickedSid}
                onClick={() => pickWinner(b.sid)}
              >
                {(b.texts || []).join(' / ')}
              </ChoiceButton>
            ))}
          </div>
          {pickedSid && <LockedBadge accentKey={ACCENT_KEY}>Winner locked in</LockedBadge>}
        </PhoneStage>
      )
    }
    return (
      <PhoneStage title="Card Crimes" emoji="⚖️" accentKey={ACCENT_KEY}>
        <WaitingCard emoji="🏆" title="Reveal on the TV" subtitle="Your verdict is in." accentKey={ACCENT_KEY} />
      </PhoneStage>
    )
  }

  // Player views
  if (cc.step === 'submit') {
    if (me?.submitted) {
      return (
        <PhoneStage title="Card Crimes" emoji="🃏" accentKey={ACCENT_KEY}>
          <WaitingCard emoji="✅" title="Card played!" subtitle="Waiting for the rest of the table…" accentKey={ACCENT_KEY} />
          <LockedBadge accentKey={ACCENT_KEY}>Card locked in</LockedBadge>
        </PhoneStage>
      )
    }
    const hand = me?.hand || []
    return (
      <PhoneStage title="Play a card" emoji="🃏" accentKey={ACCENT_KEY}>
        <PromptCard accentKey={ACCENT_KEY} className="mb-4">
          <p className="text-lg font-bold leading-snug text-white">{black?.text}</p>
        </PromptCard>
        <div className="space-y-2.5">
          {hand.map((c, i) => (
            <ChoiceButton
              key={c.id}
              index={i + 1}
              accentKey={ACCENT_KEY}
              selected={selected === c.id}
              onClick={() => setSelected(c.id)}
            >
              {c.text}
            </ChoiceButton>
          ))}
        </div>
        <div className="mt-4">
          <PrimaryButton accentKey={ACCENT_KEY} onClick={submitCard} disabled={!selected || busy}>
            {busy ? 'Playing…' : 'Play this card'}
          </PrimaryButton>
        </div>
      </PhoneStage>
    )
  }

  if (cc.step === 'judge') {
    return (
      <PhoneStage title="Card Crimes" emoji="🃏" accentKey={ACCENT_KEY}>
        <WaitingCard emoji="⚖️" title="The Judge is deciding" subtitle="Fingers crossed your card wins…" accentKey={ACCENT_KEY} />
      </PhoneStage>
    )
  }

  return (
    <PhoneStage title="Card Crimes" emoji="🃏" accentKey={ACCENT_KEY}>
      <WaitingCard emoji="🏆" title="Reveal on the TV" subtitle="Did your card take the crown?" accentKey={ACCENT_KEY} />
    </PhoneStage>
  )
}
