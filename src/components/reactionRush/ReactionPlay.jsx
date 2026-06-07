'use client'

import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { getRoomMe, sendInput } from '@/lib/roomApi'
import { PhoneStage, WaitingCard, getAccent } from '@/components/game/GameUI'

export default function ReactionPlay({
  room,
  roomId,
  playerId,
  slotKey = 'reactionRush',
  accentKey = 'reactionRush',
  title = 'Reaction Rush',
  emoji = '⚡',
}) {
  const [me, setMe] = useState(null)
  const rr = room?.gameState?.[slotKey]
  const phase = room?.phase
  const accent = getAccent(accentKey)
  // Prefer the faster /me step so the GO button flips with minimal lag.
  const step = me?.step || rr?.step

  const refreshMe = useCallback(() => {
    getRoomMe(roomId, playerId).then(setMe).catch(() => {})
  }, [roomId, playerId])

  useEffect(() => {
    refreshMe()
    const id = setInterval(refreshMe, 250)
    return () => clearInterval(id)
  }, [refreshMe])

  async function tap() {
    await sendInput(roomId, playerId, 'reactionTap')
    refreshMe()
  }

  if (phase === 'countdown') {
    return (
      <PhoneStage title={title} emoji={emoji} accentKey={accentKey}>
        <WaitingCard emoji={emoji} title={title} subtitle="Thumbs ready…" accentKey={accentKey} />
      </PhoneStage>
    )
  }

  if (!rr || phase !== 'playing') {
    return (
      <PhoneStage title={title} emoji={emoji} accentKey={accentKey}>
        <WaitingCard title="Watch the TV" subtitle="The big screen has the action." accentKey={accentKey} />
      </PhoneStage>
    )
  }

  if (step === 'ready') {
    return (
      <button
        type="button"
        onClick={tap}
        className="relative flex min-h-screen w-full flex-col items-center justify-center px-6 text-center"
        style={{ background: 'rgba(255,107,107,0.06)' }}
      >
        <motion.p
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ repeat: Infinity, duration: 1.2 }}
          className="font-display text-6xl font-black text-white/80"
        >
          WAIT
        </motion.p>
        <p className="mt-4 text-white/50">Tap the moment it turns green — not before!</p>
        {me?.early && (
          <p className="mt-6 rounded-full bg-cube-danger/20 px-4 py-2 font-semibold text-cube-danger">
            Too early! Wait for GO.
          </p>
        )}
      </button>
    )
  }

  if (step === 'go') {
    const done = me?.tapped || me?.early
    return (
      <button
        type="button"
        onClick={tap}
        disabled={done}
        className="flex min-h-screen w-full flex-col items-center justify-center px-6 text-center"
        style={{ background: done ? 'rgba(0,245,212,0.08)' : `${accent.hex}22` }}
      >
        <motion.div
          initial={{ scale: 0.7 }}
          animate={{ scale: done ? 1 : [1, 1.06, 1] }}
          transition={{ repeat: done ? 0 : Infinity, duration: 0.5 }}
          className="font-display text-7xl font-black"
          style={{ color: accent.hex, textShadow: `0 0 40px ${accent.glow}` }}
        >
          {done ? '⚡' : 'TAP!'}
        </motion.div>
        <p className="mt-6 text-lg text-white/70">{done ? 'Got it! Hold tight…' : 'Tap anywhere now!'}</p>
      </button>
    )
  }

  return (
    <PhoneStage title={title} emoji={emoji} accentKey={accentKey}>
      <WaitingCard emoji="🏆" title="Results on the TV" subtitle="Who had the fastest thumbs?" accentKey={accentKey} />
    </PhoneStage>
  )
}
