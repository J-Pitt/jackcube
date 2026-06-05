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

const ACCENT_KEY = 'triviaToss'
const LABELS = ['A', 'B', 'C', 'D']

export default function TriviaHost({ room, roomId, hostId, refresh }) {
  const [nextLoading, setNextLoading] = useState(false)
  const phase = room?.phase
  const round = room?.gameState?.round ?? 1
  const tt = room?.gameState?.triviaToss
  const players = room?.players || []
  const accent = getAccent(ACCENT_KEY)

  const countdown = useGameCountdown({ phase, round, roomId, hostId, onDone: refresh })

  useStepTimer({
    enabled: phase === 'playing' && !!tt?.endsAt,
    endsAt: tt?.endsAt,
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
      <GameStage title="Trivia Toss" emoji="🧠" accentKey={ACCENT_KEY} room={room} round={round} maxRounds={5}>
        <LeaderboardPhase
          room={room}
          onNextRound={handleNextRound}
          showNext={phase === 'leaderboard'}
          nextLoading={nextLoading}
        />
      </GameStage>
    )
  }

  const correct = tt?.correctIndex

  return (
    <GameStage title="Trivia Toss" emoji="🧠" accentKey={ACCENT_KEY} room={room} round={round} maxRounds={5}>
      {phase === 'countdown' && <CountdownOverlay countdown={countdown} />}

      {phase === 'playing' && tt && (
        <PhaseReveal key={`${round}-${tt.step}`}>
          <PromptCard label="Answer on your phone" accentKey={ACCENT_KEY} className="mb-6">
            <p className="font-display text-3xl font-extrabold leading-snug text-white sm:text-4xl">
              {tt.questionText}
            </p>
          </PromptCard>

          <div className="grid gap-3 sm:grid-cols-2">
            {(tt.options || []).map((opt, i) => {
              const isCorrect = tt.step === 'reveal' && i === correct
              return (
                <motion.div
                  key={opt}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3 rounded-2xl border px-5 py-4"
                  style={{
                    borderColor: isCorrect ? `${accent.hex}` : 'rgba(255,255,255,0.1)',
                    background: isCorrect ? `${accent.hex}1f` : 'rgba(255,255,255,0.04)',
                  }}
                >
                  <span
                    className="flex h-9 w-9 items-center justify-center rounded-lg font-display font-black"
                    style={{
                      background: isCorrect ? accent.hex : `${accent.hex}1a`,
                      color: isCorrect ? '#0A0B14' : accent.hex,
                    }}
                  >
                    {LABELS[i]}
                  </span>
                  <span className="flex-1 text-lg font-medium text-white">{opt}</span>
                  {isCorrect && <span style={{ color: accent.hex }}>✓</span>}
                </motion.div>
              )
            })}
          </div>

          <div className="mt-8">
            {tt.step === 'question' ? (
              <div className="space-y-6">
                <AnsweredTracker players={players} answeredIds={tt.answeredIds || []} accent={accent} label="answered" />
                <div className="flex justify-center">
                  <RingTimer endsAt={tt.endsAt} accent={accent} />
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap justify-center gap-2">
                {players.map((p) => {
                  const ok = tt.answers?.[p.id] === correct
                  return (
                    <span
                      key={p.id}
                      className="rounded-full px-4 py-1.5 text-sm font-semibold"
                      style={{
                        background: ok ? `${accent.hex}1f` : 'rgba(255,255,255,0.06)',
                        color: ok ? accent.hex : 'rgba(255,255,255,0.45)',
                      }}
                    >
                      {p.name} {ok ? '✓' : '✗'}
                    </span>
                  )
                })}
              </div>
            )}
          </div>

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
