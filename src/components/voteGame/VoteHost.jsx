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

export default function VoteHost({ room, roomId, hostId, refresh, config }) {
  const { slotKey, accentKey, title, emoji, type } = config
  const [nextLoading, setNextLoading] = useState(false)
  const phase = room?.phase
  const round = room?.gameState?.round ?? 1
  const v = room?.gameState?.[slotKey]
  const players = room?.players || []
  const accent = getAccent(accentKey)
  const standings = players.some((p) => Number(p.score) > 0) ? players : undefined

  const choices = type === 'ab'
    ? [{ key: 'a', label: v?.optionA }, { key: 'b', label: v?.optionB }]
    : [{ key: 'have', label: 'I have 🙋' }, { key: 'never', label: 'I never 🙅' }]

  const countdown = useGameCountdown({ phase, round, roomId, hostId, onDone: refresh })

  useStepTimer({
    enabled: phase === 'playing' && !!v?.endsAt,
    endsAt: v?.endsAt,
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
      <GameStage title={title} emoji={emoji} accentKey={accentKey} room={room} round={round} maxRounds={5}>
        <LeaderboardPhase
          room={room}
          onNextRound={handleNextRound}
          showNext={phase === 'leaderboard'}
          nextLoading={nextLoading}
        />
      </GameStage>
    )
  }

  const votersFor = (key) => players.filter((p) => v?.votes?.[p.id] === key)

  return (
    <GameStage title={title} emoji={emoji} accentKey={accentKey} room={room} round={round} maxRounds={5} standings={standings}>
      {phase === 'countdown' && <CountdownOverlay countdown={countdown} />}

      {phase === 'playing' && v && (
        <PhaseReveal key={`${round}-${v.step}`}>
          {type === 'haveNever' && (
            <PromptCard label="Vote on your phone" accentKey={accentKey} className="mb-6">
              <p className="font-display text-3xl font-extrabold leading-snug text-white sm:text-4xl">{v.statement}</p>
            </PromptCard>
          )}

          {type === 'ab' && (
            <p className="mb-6 text-center text-sm font-bold uppercase tracking-widest text-white/40">
              Would you rather… (vote on your phone)
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            {choices.map((c, i) => {
              const voters = v.step === 'reveal' ? votersFor(c.key) : []
              const count = voters.length
              const total = players.length || 1
              return (
                <motion.div
                  key={c.key}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="relative overflow-hidden rounded-3xl border p-6"
                  style={{
                    borderColor: `${accent.hex}44`,
                    background: i === 0 ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.03)',
                  }}
                >
                  {v.step === 'reveal' && (
                    <div
                      aria-hidden
                      className="absolute inset-y-0 left-0 -z-0"
                      style={{ width: `${(count / total) * 100}%`, background: `${accent.hex}1f`, transition: 'width .6s ease' }}
                    />
                  )}
                  <p className="relative z-0 font-display text-2xl font-bold text-white">{c.label}</p>
                  {v.step === 'reveal' && (
                    <div className="relative z-0 mt-3">
                      <p className="font-display text-4xl font-black" style={{ color: accent.hex }}>{count}</p>
                      <p className="mt-1 text-sm text-white/50">
                        {voters.map((p) => p.name).join(', ') || '—'}
                      </p>
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>

          {v.step === 'vote' && (
            <div className="mt-8 space-y-6">
              <AnsweredTracker players={players} answeredIds={v.answeredIds || []} accent={accent} label="voted" />
              <div className="flex justify-center">
                <RingTimer endsAt={v.endsAt} accent={accent} />
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
