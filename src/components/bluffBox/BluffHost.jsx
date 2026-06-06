'use client'

import { useCallback, useState } from 'react'
import { motion } from 'framer-motion'
import { advanceGame, nextRound } from '@/lib/roomApi'
import { useStepTimer } from '@/hooks/useStepTimer'
import { useGameCountdown } from '@/hooks/useGameCountdown'
import { CountdownOverlay, LeaderboardPhase } from '@/components/PartyGameLayout'
import {
  AnsweredTracker,
  GameStage,
  PromptCard,
  RingTimer,
  PhaseReveal,
  getAccent,
} from '@/components/game/GameUI'

export default function BluffHost({
  room,
  roomId,
  hostId,
  refresh,
  slotKey = 'bluffBox',
  accentKey = 'bluffBox',
  title = 'Bluff Box',
  emoji = '🎭',
  writeLabel = 'Invent a convincing fake answer on your phone',
}) {
  const ACCENT_KEY = accentKey
  const [nextLoading, setNextLoading] = useState(false)
  const phase = room?.phase
  const round = room?.gameState?.round ?? 1
  const bb = room?.gameState?.[slotKey]
  const players = room?.players || []
  const accent = getAccent(ACCENT_KEY)
  const standings = players.some((p) => Number(p.score) > 0) ? players : undefined

  const countdown = useGameCountdown({ phase, round, roomId, hostId, onDone: refresh })

  useStepTimer({
    enabled: phase === 'playing' && !!bb?.endsAt,
    endsAt: bb?.endsAt,
    roomId,
    hostId,
    onAdvanced: () => refresh(),
  })

  const handleNextRound = useCallback(async () => {
    if (nextLoading) return
    setNextLoading(true)
    try {
      await nextRound(roomId, hostId)
      refresh()
    } finally {
      setNextLoading(false)
    }
  }, [roomId, hostId, refresh, nextLoading])

  const handleForceAdvance = useCallback(async () => {
    await advanceGame(roomId, hostId)
    refresh()
  }, [roomId, hostId, refresh])

  if (phase === 'leaderboard' || phase === 'victory') {
    return (
      <GameStage title={title} emoji={emoji} accentKey={ACCENT_KEY} room={room} round={round} maxRounds={5}>
        <LeaderboardPhase
          room={room}
          onNextRound={handleNextRound}
          showNext={phase === 'leaderboard'}
          nextLoading={nextLoading}
        />
      </GameStage>
    )
  }

  return (
    <GameStage title={title} emoji={emoji} accentKey={ACCENT_KEY} room={room} round={round} maxRounds={5} standings={standings}>
      {phase === 'countdown' && <CountdownOverlay countdown={countdown} />}

      {phase === 'playing' && bb && (
        <PhaseReveal key={`${round}-${bb.step}`}>
          {bb.step === 'write' && (
            <div className="space-y-8">
              <PromptCard label={writeLabel} accentKey={ACCENT_KEY}>
                <p className="font-display text-3xl font-extrabold leading-snug text-white sm:text-4xl">
                  {bb.promptText}
                </p>
              </PromptCard>
              <AnsweredTracker players={players} answeredIds={bb.answeredIds || []} accent={accent} label="bluffed" />
              <div className="flex justify-center">
                <RingTimer endsAt={bb.endsAt} accent={accent} />
              </div>
            </div>
          )}

          {bb.step === 'guess' && (
            <div className="space-y-6">
              <p className="text-center text-sm font-bold uppercase tracking-widest text-white/40">
                Which is the truth? · {bb.promptText}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {(bb.choices || []).map((c, i) => (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-3 rounded-2xl border border-white/10 bg-cube-surface/70 p-5"
                  >
                    <span
                      className="flex h-9 w-9 items-center justify-center rounded-lg font-display font-black"
                      style={{ background: `${accent.hex}1a`, color: accent.hex }}
                    >
                      {i + 1}
                    </span>
                    <p className="text-lg font-medium text-white">{c.text}</p>
                  </motion.div>
                ))}
              </div>
              <AnsweredTracker players={players} answeredIds={bb.answeredIds || []} accent={accent} label="guessed" />
              <div className="flex justify-center">
                <RingTimer endsAt={bb.endsAt} accent={accent} />
              </div>
            </div>
          )}

          {bb.step === 'reveal' && (
            <div className="space-y-5">
              <div className="text-center">
                <p className="text-sm font-bold uppercase tracking-widest text-white/40">The real answer</p>
                <p className="mt-1 text-base text-white/60">{bb.promptText}</p>
                <motion.p
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="mt-3 font-display text-4xl font-black"
                  style={{ color: accent.hex }}
                >
                  {bb.realAnswer}
                </motion.p>
              </div>
              <div className="space-y-2">
                {(bb.choices || []).map((c) => {
                  const author = c.authorId ? players.find((p) => p.id === c.authorId) : null
                  return (
                    <div
                      key={c.id}
                      className="flex items-center justify-between gap-4 rounded-2xl border px-5 py-4"
                      style={{
                        borderColor: c.isReal ? `${accent.hex}66` : 'rgba(255,255,255,0.1)',
                        background: c.isReal ? `${accent.hex}12` : 'rgba(255,255,255,0.04)',
                      }}
                    >
                      <p className="font-medium text-white">{c.text}</p>
                      <span className="shrink-0 text-sm" style={{ color: c.isReal ? accent.hex : author?.color }}>
                        {c.isReal ? '✓ Truth' : `Bluff · ${author?.name || '?'}`}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div className="mt-10 text-center">
            <button type="button" onClick={handleForceAdvance} className="text-xs text-white/25 hover:text-white/50">
              Host: skip →
            </button>
          </div>
        </PhaseReveal>
      )}
    </GameStage>
  )
}
